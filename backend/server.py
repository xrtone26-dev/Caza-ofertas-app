import os
import hmac
import time
import secrets
import smtplib
from email.mime.text import MIMEText
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, Depends, Header, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from motor.motor_asyncio import AsyncIOMotorClient
from bson.objectid import ObjectId
from bson.errors import InvalidId
from groq import AsyncGroq


# ==========================================================================
# CONFIGURACIÓN (todo valor sensible viene SOLO de variables de entorno)
# ==========================================================================
# ADMIN_PASSWORD        -> contraseña inicial del admin. Solo se usa mientras la base
#                          de datos no tenga una contraseña guardada; en el primer login
#                          correcto se guarda hasheada (bcrypt) en db.config.
# ADMIN_TOKEN_SECRET    -> secreto para firmar las sesiones del panel (JWT). Si falta,
#                          se genera uno aleatorio al arrancar (las sesiones se pierden
#                          al reiniciar el servidor).
# BOT_API_KEY           -> clave del bot que sincroniza productos/ofertas. Sin ella, los
#                          endpoints del bot quedan deshabilitados.
# ADMIN_EMAIL / ADMIN_USERNAME / SMTP_* -> recuperación de contraseña por correo.
# ML_AFFILIATE_CAMPID   -> campid real de afiliado de Mercado Libre (opcional).
# ALLOWED_ORIGINS       -> orígenes permitidos por CORS, separados por coma.
MONGO_URL = os.getenv("MONGO_URL", "")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD") or None
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL") or None
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
BOT_API_KEY = os.getenv("BOT_API_KEY") or None
ADMIN_TOKEN_SECRET = os.getenv("ADMIN_TOKEN_SECRET") or secrets.token_urlsafe(48)
ADMIN_TOKEN_TTL_SECONDS = int(os.getenv("ADMIN_TOKEN_TTL_SECONDS", str(8 * 60 * 60)))
ML_AFFILIATE_CAMPID = (os.getenv("ML_AFFILIATE_CAMPID") or "").strip()
ALLOWED_ORIGINS = [
    o.strip()
    for o in os.getenv(
        "ALLOWED_ORIGINS",
        "https://capibaraml.com,https://www.capibaraml.com,http://localhost:3000",
    ).split(",")
    if o.strip()
]

MIN_ADMIN_PASSWORD_LENGTH = 10
TEMP_PASSWORD_TTL = timedelta(minutes=30)
CAMPID_PLACEHOLDER = "TU_CAMPID_AQUI"
PUBLIC_CACHE_CONTROL = "public, max-age=60, stale-while-revalidate=300"

if not os.getenv("ADMIN_TOKEN_SECRET"):
    print("⚠️ ADMIN_TOKEN_SECRET no está configurado: se usa uno temporal (las sesiones admin se pierden al reiniciar).")
if not BOT_API_KEY:
    print("⚠️ BOT_API_KEY no está configurado: los endpoints del bot están deshabilitados.")


# ==========================================================================
# MODELOS
# ==========================================================================
class _BlankStringsAsNone(BaseModel):
    """El panel envía '' en campos vacíos; se tratan como 'sin valor' en vez de
    provocar errores 422 (p. ej. expires_at='' o min_purchase='')."""

    @field_validator("*", mode="before")
    @classmethod
    def _blank_to_none(cls, value):
        if isinstance(value, str) and value.strip() == "":
            return None
        return value


class ProductFields(_BlankStringsAsNone):
    id: Optional[str] = None
    title: Optional[str] = None
    nombre: Optional[str] = None
    description: Optional[str] = None
    original_price: Optional[float] = None
    discount_price: Optional[float] = None
    precio: Optional[str] = None
    discount_percentage: Optional[int] = None
    descuento: Optional[str] = None
    coupon: Optional[str] = None
    affiliate_link: Optional[str] = None
    link: Optional[str] = None
    image_url: Optional[str] = None
    active: Optional[bool] = None
    is_exclusive: Optional[bool] = None
    installments_text: Optional[str] = None
    features: Optional[str] = None
    specs: Optional[str] = None
    created_at: Optional[datetime] = None
    # Campos de las tarjetas promocionales (renderNewSection en el frontend)
    is_promo_card: Optional[bool] = None
    promo_subtitle: Optional[str] = None
    model_capacity: Optional[str] = None
    coupon1_desc: Optional[str] = None
    coupon1_code: Optional[str] = None
    coupon2_desc: Optional[str] = None
    coupon2_code: Optional[str] = None
    msi_text: Optional[str] = None
    shipping_text: Optional[str] = None
    affiliate_earning: Optional[str] = None
    affiliate_desc: Optional[str] = None


class ProductCreate(ProductFields):
    original_price: Optional[float] = 0.0
    discount_price: Optional[float] = 0.0
    active: bool = True
    is_exclusive: Optional[bool] = False
    is_promo_card: Optional[bool] = False


class ProductUpdate(ProductFields):
    pass


class OfferFields(_BlankStringsAsNone):
    id: Optional[str] = None
    nombre: Optional[str] = None
    descuento: Optional[str] = None
    precio: Optional[str] = None
    link: Optional[str] = None
    is_exclusive: Optional[bool] = None
    type: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    code: Optional[str] = None
    active: Optional[bool] = None
    expires_at: Optional[datetime] = None
    min_purchase: Optional[float] = None
    max_discount: Optional[float] = None
    giro: Optional[str] = None


class OfferCreate(OfferFields):
    is_exclusive: Optional[bool] = False
    type: Optional[str] = "oferta"
    active: Optional[bool] = True


class OfferUpdate(OfferFields):
    pass


class MaintenanceRequest(BaseModel):
    enabled: bool


class AdminLoginRequest(BaseModel):
    password: str


class RecoverRequest(BaseModel):
    identifier: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[dict]] = []
    systemPrompt: Optional[str] = None
    products: Optional[List[dict]] = []


# ==========================================================================
# APP
# ==========================================================================
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,  # el panel usa Authorization: Bearer, no cookies
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-API-Key"],
)

api_router = APIRouter()

client = AsyncIOMotorClient(MONGO_URL)
db = client.cazaofertas

SYNONYMS_MAP = {
    "celular": ["smartphone", "movil", "telefono", "cel", "iphone", "android", "samsung", "xiaomi", "motorola", "oppo", "realme", "poco"],
    "audifonos": ["audifono", "cascos", "airpods", "diadema", "bluetooth", "manos libres", "earbuds", "headset"],
    "laptop": ["computadora", "portatil", "pc", "macbook", "notebook", "laptop gamer"],
    "pantalla": ["television", "tv", "smarttv", "monitor", "display"]
}


# ==========================================================================
# ENLACES DE AFILIADO
# ==========================================================================
def normalize_affiliate_link(url: Optional[str]) -> Optional[str]:
    """Quita el marcador campid=TU_CAMPID_AQUI. Si ML_AFFILIATE_CAMPID está
    configurado, lo usa en su lugar; nunca deja el marcador literal."""
    if not url or not isinstance(url, str) or "campid" not in url.lower():
        return url
    try:
        parts = urlsplit(url)
        query = []
        for key, value in parse_qsl(parts.query, keep_blank_values=True):
            if key.lower() == "campid" and (not value or value == CAMPID_PLACEHOLDER):
                if ML_AFFILIATE_CAMPID:
                    query.append((key, ML_AFFILIATE_CAMPID))
                continue
            query.append((key, value))
        return urlunsplit(parts._replace(query=urlencode(query)))
    except ValueError:
        return url


def is_affiliate_link(url: Optional[str]) -> bool:
    """Enlaces cortos de afiliado de Mercado Libre (meli.la o mercadolibre.com/sec/...)."""
    if not url:
        return False
    try:
        parts = urlsplit(url)
    except ValueError:
        return False
    host = (parts.hostname or "").lower()
    if host == "meli.la" or host.endswith(".meli.la"):
        return True
    return host.startswith("mercadolibre.") and parts.path.startswith("/sec/")


def _normalize_links_in(data: Dict[str, Any]) -> Dict[str, Any]:
    for key in ("affiliate_link", "link"):
        if data.get(key):
            data[key] = normalize_affiliate_link(data[key])
    return data


def serialize_public_product(doc: Dict[str, Any]) -> Dict[str, Any]:
    doc["_id"] = str(doc["_id"])
    _normalize_links_in(doc)
    doc["is_affiliate"] = is_affiliate_link(doc.get("affiliate_link") or doc.get("link"))
    # Los campos nulos no aportan nada al frontend y engordan la respuesta
    return {k: v for k, v in doc.items() if v is not None}


# ==========================================================================
# AUTENTICACIÓN DEL PANEL ADMIN
# ==========================================================================
_failed_attempts: Dict[str, List[float]] = {}
RATE_LIMIT_MAX_ATTEMPTS = 5
RATE_LIMIT_WINDOW_SECONDS = 15 * 60


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _check_rate_limit(key: str) -> None:
    now = time.time()
    recent = [t for t in _failed_attempts.get(key, []) if now - t < RATE_LIMIT_WINDOW_SECONDS]
    _failed_attempts[key] = recent
    if len(recent) >= RATE_LIMIT_MAX_ATTEMPTS:
        raise HTTPException(status_code=429, detail="Demasiados intentos. Espera 15 minutos e inténtalo de nuevo.")


def _register_attempt(key: str) -> None:
    _failed_attempts.setdefault(key, []).append(time.time())


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _check_hash(password: str, hashed: Optional[str]) -> bool:
    if not hashed:
        return False
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except ValueError:
        return False


def _same(a: str, b: str) -> bool:
    return hmac.compare_digest(a.encode("utf-8"), b.encode("utf-8"))


async def _admin_settings() -> Dict[str, Any]:
    return await db.config.find_one({"_id": "admin_settings"}) or {}


async def set_admin_password(new_password: str) -> None:
    """Guarda la contraseña hasheada, elimina la versión en texto plano (legado),
    invalida claves provisionales y cierra todas las sesiones abiertas."""
    await db.config.update_one(
        {"_id": "admin_settings"},
        {
            "$set": {"password_hash": _hash_password(new_password)},
            "$unset": {"password": "", "temp_password_hash": "", "temp_password_expires": ""},
            "$inc": {"password_version": 1},
        },
        upsert=True,
    )


async def verify_admin_password(candidate: str) -> bool:
    if not candidate:
        return False
    config = await _admin_settings()

    if config.get("password_hash"):
        if _check_hash(candidate, config["password_hash"]):
            return True
    elif config.get("password"):
        # Contraseña antigua guardada en texto plano: se migra a bcrypt al validar.
        if _same(candidate, str(config["password"])):
            await set_admin_password(candidate)
            return True
    elif ADMIN_PASSWORD:
        # Arranque inicial: la contraseña viene de la variable de entorno.
        if _same(candidate, ADMIN_PASSWORD):
            await set_admin_password(candidate)
            return True

    expires = config.get("temp_password_expires")
    if expires and expires > datetime.utcnow() and _check_hash(candidate, config.get("temp_password_hash")):
        return True
    return False


async def _issue_admin_token() -> str:
    config = await _admin_settings()
    now = int(time.time())
    payload = {
        "sub": "admin",
        "iat": now,
        "exp": now + ADMIN_TOKEN_TTL_SECONDS,
        "pv": int(config.get("password_version", 0)),
    }
    return jwt.encode(payload, ADMIN_TOKEN_SECRET, algorithm="HS256")


async def require_admin(authorization: Optional[str] = Header(None)) -> None:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="No autorizado")
    token = authorization.split(" ", 1)[1].strip()
    try:
        payload = jwt.decode(token, ADMIN_TOKEN_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Sesión inválida o expirada")
    config = await _admin_settings()
    if payload.get("sub") != "admin" or int(payload.get("pv", -1)) != int(config.get("password_version", 0)):
        raise HTTPException(status_code=401, detail="Sesión inválida o expirada")


def require_bot_key(x_api_key: Optional[str] = Header(None)) -> None:
    if not BOT_API_KEY:
        raise HTTPException(status_code=503, detail="BOT_API_KEY no está configurado en el servidor")
    if not x_api_key or not _same(x_api_key, BOT_API_KEY):
        raise HTTPException(status_code=401, detail="No autorizado: API Key incorrecta")


admin_only = [Depends(require_admin)]


@app.on_event("startup")
async def setup_database_indexes():
    try:
        await db.products.create_index("created_at", expireAfterSeconds=2592000)
    except Exception as e:
        print(f"Error creando índice TTL: {e}")


def get_query_id(item_id: str):
    try:
        return {"$or": [{"id": item_id}, {"_id": ObjectId(item_id)}]}
    except InvalidId:
        return {"id": item_id}


def _serialize_docs(docs):
    for doc in docs:
        doc["_id"] = str(doc["_id"])
    return docs


# ==========================================================================
# ENDPOINTS PÚBLICOS
# ==========================================================================
@api_router.get("/maintenance")
async def get_maintenance(response: Response):
    doc = await db.config.find_one({"_id": "site_settings"}) or {}
    response.headers["Cache-Control"] = "no-store"
    return {"maintenance": bool(doc.get("maintenance", False))}


@api_router.put("/admin/maintenance", dependencies=admin_only)
async def set_maintenance(payload: MaintenanceRequest):
    await db.config.update_one(
        {"_id": "site_settings"},
        {"$set": {"maintenance": payload.enabled, "maintenance_updated_at": datetime.utcnow()}},
        upsert=True,
    )
    return {"maintenance": payload.enabled}


@api_router.get("/products")
async def get_products(response: Response):
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    cursor = db.products.find({
        "$or": [
            {"active": True},
            {"active": {"$exists": False}},
            {"created_at": {"$gte": thirty_days_ago}},
            {"created_at": {"$exists": False}}
        ]
    })
    products = [serialize_public_product(doc) async for doc in cursor]
    response.headers["Cache-Control"] = PUBLIC_CACHE_CONTROL
    return products


@api_router.get("/offers")
async def get_offers(response: Response, type: Optional[str] = None):
    query = {}
    if type:
        query["type"] = type

    cursor = db.offers.find(query)
    offers = []
    now = datetime.utcnow()
    async for doc in cursor:
        expires_at = doc.get("expires_at")
        if expires_at:
            if isinstance(expires_at, str):
                try:
                    expires_at = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
                except ValueError:
                    pass
            if isinstance(expires_at, datetime) and expires_at.replace(tzinfo=None) <= now:
                continue

        doc["_id"] = str(doc["_id"])
        _normalize_links_in(doc)
        offers.append(doc)
    response.headers["Cache-Control"] = PUBLIC_CACHE_CONTROL
    return offers


@api_router.post("/chat")
async def ai_chat_endpoint(data: ChatRequest):
    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
    
    if not GROQ_API_KEY:
        return {"reply": "⚠️ El administrador aún no ha configurado la API Key de Groq en el servidor."}
    
    user_query = (data.message or '').lower().strip()

    try:
        db_products = await db.products.find({}).to_list(length=150)
        frontend_products = data.products if (data.products and len(data.products) > 0) else []
        
        combined_dict = {}
        for p in (db_products + frontend_products):
            if isinstance(p, dict):
                title = p.get('title') or p.get('nombre') or p.get('name') or ''
                if title:
                    combined_dict[title] = p
        
        all_products = list(combined_dict.values())
        search_tokens = [w for w in user_query.replace('?', '').replace('!', '').replace(',', '').split() if len(w) >= 2]
        
        expanded_tokens = list(search_tokens)
        for token in search_tokens:
            for main_key, synonyms in SYNONYMS_MAP.items():
                if token == main_key or token in synonyms:
                    if main_key not in expanded_tokens:
                        expanded_tokens.append(main_key)
                    for syn in synonyms:
                        if syn not in expanded_tokens:
                            expanded_tokens.append(syn)
        
        matched_products = []
        for p in all_products:
            p_title = (p.get('title') or p.get('nombre') or p.get('name') or '').lower()
            p_desc = (p.get('description') or p.get('descuento') or p.get('specs') or '').lower()
            p_full = f"{p_title} {p_desc}"
            
            matches_count = sum(1 for token in expanded_tokens if token in p_full)
            if matches_count > 0:
                matched_products.append((matches_count, p))
                
        matched_products.sort(key=lambda x: x[0], reverse=True)
        final_matches = [item[1] for item in matched_products]
        
        if any(k in user_query for k in ['iphone', 'apple', 'ios', 'celular', 'smartphone', 'movil', 'cel']):
            priority_items = [p for p in all_products if any(k in (p.get('title') or p.get('nombre') or p.get('description') or '').lower() for k in ['iphone', 'apple', 'celular', 'smartphone', 'samsung', 'xiaomi'])]
            for item in priority_items:
                if item not in final_matches:
                    final_matches.insert(0, item)

        final_list = final_matches if final_matches else all_products
        active_products = final_list[:20]
        
        inventario_total = []
        for p in active_products:
            p_title = p.get('title') or p.get('nombre') or p.get('name') or 'Producto'
            p_price = str(p.get('discount_price') or p.get('precio') or p.get('price') or 'N/A')
            p_link = normalize_affiliate_link(p.get('affiliate_link') or p.get('link') or p.get('url')) or 'Sin enlace'
            p_desc = p.get('description') or p.get('descuento') or p.get('specs') or ''
            
            item_str = f"- {p_title} | Precio Oferta: ${p_price} | Link Afiliado: {p_link}"
            if p_desc:
                item_str += f" | Detalle: {p_desc[:80]}"
            inventario_total.append(item_str)

        db_context = "\n\n--- CATÁLOGO REAL Y OFERTAS DISPONIBLES EN LA TIENDA ---\n" + ("\n".join(inventario_total) if inventario_total else "SIN PRODUCTOS EN ESTE MOMENTO") + "\n"

        base_system_prompt = (
            "Eres CapiBaraML 🐹, el famoso y simpático especialista en ofertas, descuentos y cupones de Mercado Libre México en CapiBaraML.\n\n"
            "TU ROL Y MISIÓN:\n"
            "Eres un superasesor de ventas entusiasta, divertido y directo. Tu objetivo principal es ayudar al usuario a ahorrar dinero, encontrar cupones de descuento, promociones bancarias y RECOMENDARLE productos exactos de nuestro catálogo real con sus ENLACES DE AFILIADO de Mercado Libre para concretar ventas.\n\n"
            "TONO DE VOZ Y ESTILO:\n"
            "- Háblale de forma cercana y amigable en español latino.\n"
            "- Usa emojis alegres con moderación (🚀, 🐹, ✨, 🔥, 🎟️, 💳).\n"
            "- Sé claro, directo y mantén respuestas concisas (2 a 3 párrafos cortos como máximo).\n\n"
            "REGLAS ESTRATÉGICAS DE VENTA:\n"
            "1. REVISA SIEMPRE el catálogo real provisto abajo antes de responder.\n"
            "2. Si el usuario pregunta por un producto, marca, modelo, cupones o categoría, BÚSCALO en el catálogo y RECOMIÉNDALO DE INMEDIATO mencionando su Nombre, Precio de oferta y su Link de Afiliado completo.\n"
            "3. NUNCA inventes enlaces de afiliados que no estén en la lista. Usa únicamente los links proporcionados en el catálogo.\n"
            "4. Si el usuario pide algo que no tenemos exacto, recomiéndale amablemente las opciones más parecidas disponibles en el catálogo resaltando sus ventajas.\n"
            "5. Agrega un toque de entusiasmo o urgencia positiva (ej. '¡Está a un superprecio con cupón!', '¡Aprovecha antes de que se agote!')."
        )

        ai_client = AsyncGroq(api_key=GROQ_API_KEY)
        messages = [{"role": "system", "content": base_system_prompt + db_context}]
        
        if data.history:
            for msg in data.history[-10:]:
                role = "user" if (msg.get("sender") == "user" or msg.get("role") == "user") else "assistant"
                text = msg.get("text") or msg.get("content") or ""
                if text:
                    messages.append({"role": role, "content": text})
        
        if data.message:
            messages.append({"role": "user", "content": data.message})
            
        chat_completion = await ai_client.chat.completions.create(
            messages=messages,
            model="openai/gpt-oss-20b",
            temperature=0.35,
            max_tokens=450
        )
        
        return {"reply": chat_completion.choices[0].message.content}

    except Exception as e:
        print(f"Error detallado en AI Chat: {str(e)}")
        
        if any(k in user_query for k in ['iphone', 'apple', 'celular', 'smartphone', 'cel']):
            return {"reply": "¡Claro que sí! 🚀 Tenemos superopciones en celulares y tecnología listas en el catálogo. ¡Dime qué modelo o presupuesto buscas y te paso su enlace de oferta directo! 🐹✨"}
            
        return {"reply": "¡Claro que sí! 🚀 Tenemos excelentes ofertas y cupones esperándote en la tienda. Dime qué producto o marca buscas y te paso de inmediato la mejor recomendación con su enlace de descuento. 🐹✨"}

# ==========================================================================
# ENDPOINTS DEL BOT (requieren X-API-Key = BOT_API_KEY)
# ==========================================================================
@api_router.post("/api/bot/products", dependencies=[Depends(require_bot_key)])
async def bot_create_product(product: ProductCreate):
    prod_dict = _normalize_links_in(product.model_dump())
    if not prod_dict.get("created_at"):
        prod_dict["created_at"] = datetime.utcnow()

    filter_query = {"id": prod_dict["id"]} if prod_dict.get("id") else {"nombre": prod_dict.get("nombre")}
    await db.products.update_one(filter_query, {"$set": prod_dict}, upsert=True)
    return {"success": True, "message": "Producto sincronizado por el bot exitosamente"}


@api_router.post("/api/bot/offers", dependencies=[Depends(require_bot_key)])
async def bot_create_offer(offer: OfferCreate):
    offer_dict = _normalize_links_in(offer.model_dump())
    filter_query = {"id": offer_dict["id"]} if offer_dict.get("id") else {"nombre": offer_dict.get("nombre")}
    await db.offers.update_one(filter_query, {"$set": offer_dict}, upsert=True)
    return {"success": True, "message": "Oferta sincronizada por el bot exitosamente"}


# ==========================================================================
# SESIÓN DEL PANEL ADMIN
# ==========================================================================
@api_router.post("/admin/login")
async def admin_login(body: AdminLoginRequest, request: Request):
    key = f"login:{_client_ip(request)}"
    _check_rate_limit(key)
    if await verify_admin_password(body.password):
        _failed_attempts.pop(key, None)
        return {
            "success": True,
            "message": "Autenticado correctamente",
            "token": await _issue_admin_token(),
            "expires_in": ADMIN_TOKEN_TTL_SECONDS,
        }
    _register_attempt(key)
    config = await _admin_settings()
    if not (config.get("password_hash") or config.get("password") or ADMIN_PASSWORD):
        raise HTTPException(status_code=503, detail="El acceso admin no está configurado (falta ADMIN_PASSWORD en el servidor)")
    raise HTTPException(status_code=401, detail="Contraseña incorrecta")


@api_router.post("/admin/recover")
async def recover_admin_password(body: RecoverRequest, request: Request):
    key = f"recover:{_client_ip(request)}"
    _check_rate_limit(key)
    _register_attempt(key)

    smtp_server = os.getenv("SMTP_SERVER")
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    config = await _admin_settings()
    stored_email = config.get("email") or ADMIN_EMAIL
    stored_username = config.get("username") or ADMIN_USERNAME

    if not (smtp_server and smtp_user and smtp_password and stored_email):
        raise HTTPException(status_code=503, detail="La recuperación por correo no está configurada en el servidor")

    generic = {
        "success": True,
        "message": "Si los datos coinciden, enviamos una clave provisional (válida 30 minutos) al correo del administrador.",
    }
    identifier = (body.identifier or "").strip()
    if not (_same(identifier, stored_email) or _same(identifier, stored_username)):
        return generic

    # La clave provisional NO reemplaza la contraseña actual: solo se acepta
    # adicionalmente durante 30 minutos. Así nadie puede bloquear al admin.
    temp_password = secrets.token_urlsafe(9)
    msg = MIMEText(
        f"Tu clave provisional para el panel de CapiBaraML es: {temp_password}\n"
        "Es válida durante 30 minutos. Al entrar, cambia tu contraseña desde el panel.\n"
        "Si no solicitaste esto, ignora este correo: tu contraseña actual sigue funcionando."
    )
    msg["Subject"] = "Recuperación de contraseña - CapiBaraML"
    msg["From"] = smtp_user
    msg["To"] = stored_email
    try:
        with smtplib.SMTP(smtp_server, int(os.getenv("SMTP_PORT", "587")), timeout=15) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
    except Exception as e:
        print(f"Error enviando correo de recuperación: {type(e).__name__}")
        raise HTTPException(status_code=502, detail="No se pudo enviar el correo de recuperación")

    await db.config.update_one(
        {"_id": "admin_settings"},
        {"$set": {
            "temp_password_hash": _hash_password(temp_password),
            "temp_password_expires": datetime.utcnow() + TEMP_PASSWORD_TTL,
        }},
        upsert=True,
    )
    return generic


@api_router.post("/admin/change-password", dependencies=admin_only)
async def change_password(body: ChangePasswordRequest, request: Request):
    key = f"change:{_client_ip(request)}"
    _check_rate_limit(key)
    if not await verify_admin_password(body.current_password):
        _register_attempt(key)
        raise HTTPException(status_code=401, detail="Contraseña actual incorrecta")
    if len(body.new_password or "") < MIN_ADMIN_PASSWORD_LENGTH:
        raise HTTPException(status_code=400, detail=f"La nueva contraseña debe tener al menos {MIN_ADMIN_PASSWORD_LENGTH} caracteres")
    await set_admin_password(body.new_password)
    # El cambio invalida las sesiones anteriores; se entrega una nueva.
    return {"success": True, "message": "Contraseña actualizada exitosamente", "token": await _issue_admin_token()}


# ==========================================================================
# ADMIN: PRODUCTOS (requieren Authorization: Bearer <token>)
# ==========================================================================
def _update_payload(model: BaseModel) -> Dict[str, Any]:
    data = model.model_dump(exclude_unset=True)
    data.pop("id", None)
    data.pop("created_at", None)
    return _normalize_links_in(data)


@api_router.get("/admin/products", dependencies=admin_only)
async def get_admin_products():
    return _serialize_docs([doc async for doc in db.products.find({})])


@api_router.post("/admin/products", dependencies=admin_only)
async def create_product(product: ProductCreate):
    prod_dict = _normalize_links_in(product.model_dump())
    if not prod_dict.get("created_at"):
        prod_dict["created_at"] = datetime.utcnow()
    await db.products.insert_one(prod_dict)
    return {"success": True, "message": "Producto creado exitosamente"}


@api_router.patch("/admin/products/{product_id}", dependencies=admin_only)
async def update_product(product_id: str, product_data: ProductUpdate):
    update_dict = _update_payload(product_data)
    if not update_dict:
        raise HTTPException(status_code=400, detail="No hay datos para actualizar")

    result = await db.products.update_one(get_query_id(product_id), {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return {"success": True, "message": "Producto actualizado"}


@api_router.delete("/admin/products/{product_id}", dependencies=admin_only)
async def delete_product(product_id: str):
    result = await db.products.delete_one(get_query_id(product_id))
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return {"success": True, "message": "Producto eliminado"}


@api_router.delete("/admin/products", dependencies=admin_only)
async def clear_non_exclusive_products():
    result = await db.products.delete_many({
        "$or": [
            {"is_exclusive": False},
            {"is_exclusive": {"$exists": False}}
        ]
    })
    return {"success": True, "message": f"{result.deleted_count} productos normales eliminados. Terminales exclusivas protegidas."}


# ==========================================================================
# ADMIN: AUDITORÍA DE ENLACES DE AFILIADO
# ==========================================================================
@api_router.get("/admin/links/audit", dependencies=admin_only)
async def audit_affiliate_links(limit: int = 200):
    total = placeholder = non_affiliate_count = 0
    non_affiliate = []
    async for doc in db.products.find({}, {"title": 1, "nombre": 1, "id": 1, "affiliate_link": 1, "link": 1}):
        total += 1
        raw = doc.get("affiliate_link") or doc.get("link") or ""
        if CAMPID_PLACEHOLDER in raw:
            placeholder += 1
        if not is_affiliate_link(raw):
            non_affiliate_count += 1
            if len(non_affiliate) < limit:
                non_affiliate.append({
                    "id": doc.get("id") or str(doc["_id"]),
                    "title": doc.get("title") or doc.get("nombre"),
                    "link": raw,
                })
    return {
        "total_products": total,
        "with_campid_placeholder": placeholder,
        "campid_configured": bool(ML_AFFILIATE_CAMPID),
        "non_affiliate_count": non_affiliate_count,
        "non_affiliate": non_affiliate,
    }


@api_router.post("/admin/links/normalize", dependencies=admin_only)
async def normalize_stored_links():
    """Reescribe en la base de datos los enlaces que contienen el marcador campid."""
    updated = 0
    query = {"$or": [
        {"affiliate_link": {"$regex": CAMPID_PLACEHOLDER}},
        {"link": {"$regex": CAMPID_PLACEHOLDER}},
    ]}
    for collection in (db.products, db.offers):
        async for doc in collection.find(query, {"affiliate_link": 1, "link": 1}):
            changes = {}
            for key in ("affiliate_link", "link"):
                if doc.get(key) and CAMPID_PLACEHOLDER in doc[key]:
                    changes[key] = normalize_affiliate_link(doc[key])
            if changes:
                await collection.update_one({"_id": doc["_id"]}, {"$set": changes})
                updated += 1
    return {"success": True, "updated": updated, "campid_configured": bool(ML_AFFILIATE_CAMPID)}


# ==========================================================================
# ADMIN: OFERTAS / CUPONES
# ==========================================================================
@api_router.get("/admin/offers", dependencies=admin_only)
async def get_admin_offers():
    return _serialize_docs([doc async for doc in db.offers.find({})])


@api_router.post("/admin/offers", dependencies=admin_only)
async def create_offer(offer: OfferCreate):
    await db.offers.insert_one(_normalize_links_in(offer.model_dump()))
    return {"success": True, "message": "Oferta creada exitosamente"}


@api_router.patch("/admin/offers/{offer_id}", dependencies=admin_only)
async def update_offer(offer_id: str, offer_data: OfferUpdate):
    update_dict = _update_payload(offer_data)
    if not update_dict:
        raise HTTPException(status_code=400, detail="No hay datos para actualizar")

    result = await db.offers.update_one(get_query_id(offer_id), {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Oferta no encontrada")
    return {"success": True, "message": "Oferta actualizada"}


@api_router.delete("/admin/offers/{offer_id}", dependencies=admin_only)
async def delete_offer(offer_id: str):
    result = await db.offers.delete_one(get_query_id(offer_id))
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Oferta no encontrada")
    return {"success": True, "message": "Oferta eliminada"}

app.include_router(api_router)
