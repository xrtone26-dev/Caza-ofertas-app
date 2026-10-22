import os
import smtplib
from email.mime.text import MIMEText
import random
import string
from fastapi import FastAPI, APIRouter, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from bson.objectid import ObjectId
from bson.errors import InvalidId
from groq import AsyncGroq

class Product(BaseModel):
    id: Optional[str] = None
    title: Optional[str] = None
    nombre: Optional[str] = None
    description: Optional[str] = None
    original_price: Optional[float] = 0.0
    discount_price: Optional[float] = 0.0
    precio: Optional[str] = None
    discount_percentage: Optional[int] = None
    descuento: Optional[str] = None
    coupon: Optional[str] = None
    affiliate_link: Optional[str] = None
    link: Optional[str] = None
    image_url: Optional[str] = None
    active: bool = True
    is_exclusive: Optional[bool] = False
    installments_text: Optional[str] = None
    features: Optional[str] = None
    specs: Optional[str] = None
    created_at: Optional[datetime] = None

class ProductCreate(BaseModel):
    id: Optional[str] = None
    title: Optional[str] = None
    nombre: Optional[str] = None
    description: Optional[str] = None
    original_price: Optional[float] = 0.0
    discount_price: Optional[float] = 0.0
    precio: Optional[str] = None
    discount_percentage: Optional[int] = None
    descuento: Optional[str] = None
    coupon: Optional[str] = None
    affiliate_link: Optional[str] = None
    link: Optional[str] = None
    image_url: Optional[str] = None
    active: bool = True
    is_exclusive: Optional[bool] = False
    installments_text: Optional[str] = None
    features: Optional[str] = None
    specs: Optional[str] = None
    created_at: Optional[datetime] = None

class ProductUpdate(BaseModel):
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

class Offer(BaseModel):
    id: Optional[str] = None
    nombre: Optional[str] = None
    descuento: Optional[str] = None
    precio: Optional[str] = None
    link: Optional[str] = None
    is_exclusive: Optional[bool] = False
    type: Optional[str] = "oferta"
    title: Optional[str] = None
    description: Optional[str] = None
    code: Optional[str] = None
    active: Optional[bool] = True
    expires_at: Optional[datetime] = None

class OfferCreate(BaseModel):
    id: Optional[str] = None
    nombre: Optional[str] = None
    descuento: Optional[str] = None
    precio: Optional[str] = None
    link: Optional[str] = None
    is_exclusive: Optional[bool] = False
    type: Optional[str] = "oferta"
    title: Optional[str] = None
    description: Optional[str] = None
    code: Optional[str] = None
    active: Optional[bool] = True
    expires_at: Optional[datetime] = None

class OfferUpdate(BaseModel):
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

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter()

MONGO_URL = os.getenv("MONGO_URL", "tu_cadena_de_conexion_aqui")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "Caza-Ofertas2026")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@cazaofertas.com")
BOT_API_KEY = os.getenv("BOT_API_KEY", "CazaOfertas_SuperSecretKey_2026")

client = AsyncIOMotorClient(MONGO_URL)
db = client.cazaofertas

SYNONYMS_MAP = {
    "celular": ["smartphone", "movil", "telefono", "cel", "iphone", "android", "samsung", "xiaomi", "motorola", "oppo", "realme", "poco"],
    "audifonos": ["audifono", "cascos", "airpods", "diadema", "bluetooth", "manos libres", "earbuds", "headset"],
    "laptop": ["computadora", "portatil", "pc", "macbook", "notebook", "laptop gamer"],
    "pantalla": ["television", "tv", "smarttv", "monitor", "display"]
}

async def get_admin_password():
    config = await db.config.find_one({"_id": "admin_settings"})
    if config and "password" in config:
        return config["password"]
    return ADMIN_PASSWORD

async def set_admin_password(new_password):
    await db.config.update_one(
        {"_id": "admin_settings"},
        {"$set": {"password": new_password}},
        upsert=True
    )

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

@api_router.get("/products")
async def get_products():
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    cursor = db.products.find({
        "$or": [
            {"active": True},
            {"active": {"$exists": False}},
            {"created_at": {"$gte": thirty_days_ago}},
            {"created_at": {"$exists": False}}
        ]
    })
    products = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        products.append(doc)
    return products

@api_router.get("/offers")
async def get_offers(type: Optional[str] = None):
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
        offers.append(doc)
    return offers

@api_router.post("/chat")
async def ai_chat_endpoint(data: ChatRequest):
    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
    
    if not GROQ_API_KEY:
        return {"reply": "⚠️ El administrador aún no ha configurado la API Key de Groq en el servidor."}
    
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
        user_query = (data.message or '').lower().strip()
        
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
            p_link = p.get('affiliate_link') or p.get('link') or p.get('url') or 'Sin enlace'
            p_desc = p.get('description') or p.get('descuento') or p.get('specs') or ''
            
            item_str = f"- {p_title} | Precio Oferta: ${p_price} | Link Afiliado: {p_link}"
            if p_desc:
                item_str += f" | Detalle: {p_desc[:80]}"
            inventario_total.append(item_str)

        db_context = "\n\n--- CATÁLOGO REAL Y OFERTAS DISPONIBLES EN LA TIENDA ---\n" + ("\n".join(inventario_total) if inventario_total else "SIN PRODUCTOS EN ESTE MOMENTO") + "\n"

        base_system_prompt = (
            "Eres CapiBaraML 🐹, el famoso y simpático especialista en ofertas de CazaOfertasML WEB.\n\n"
            "TU ROL Y MISION:\n"
            "Eres un superasesor de ventas entusiasta, divertido y directo. Tu objetivo principal es ayudar al usuario a ahorrar dinero y RECOMENDARLE productos exactos de nuestro catálogo real con sus ENLACES DE AFILIADO de Mercado Libre para concretar ventas.\n\n"
            "TONO DE VOZ Y ESTILO:\n"
            "- Háblale de forma cercana y amigable en español latino.\n"
            "- Usa emojis alegres con moderación (🚀, 🐹, ✨, 🔥, 🎟️).\n"
            "- Sé claro, directo y mantén respuestas concisas (2 a 3 párrafos cortos como máximo).\n\n"
            "REGLAS ESTRATÉGICAS DE VENTA:\n"
            "1. REVISA SIEMPRE el catálogo real provisto abajo antes de responder.\n"
            "2. Si el usuario pregunta por un producto, marca, modelo o categoría, BÚSCALO en el catálogo y RECOMIÉNDALO DE INMEDIATO mencionando su Nombre, Precio de oferta y su Link de Afiliado completo.\n"
            "3. NUNCA inventes enlaces de afiliados que no estén en la lista. Usa únicamente los links proporcionados en el catálogo.\n"
            "4. Si el usuario pide algo que no tenemos exacto, recomiéndale amablemente las opciones más parecidas disponibles en el catálogo resaltando sus ventajas.\n"
            "5. Agrega un toque de entusiasmo o urgencia positiva (ej. '¡Está a un superprecio!', '¡Aprovecha antes de que se agote el stock!')."
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
            
        return {"reply": "¡Claro que sí! 🚀 Tenemos excelentes ofertas esperándote en la tienda. Dime qué producto o marca buscas y te paso de inmediato la mejor recomendación con su enlace de descuento. 🐹✨"}

@api_router.post("/api/bot/products")
async def bot_create_product(product: ProductCreate, x_api_key: Optional[str] = Header(None)):
    if x_api_key != BOT_API_KEY:
        raise HTTPException(status_code=401, detail="No autorizado: API Key incorrecta")
    
    prod_dict = product.model_dump()
    if not prod_dict.get("created_at"):
        prod_dict["created_at"] = datetime.utcnow()
        
    filter_query = {"id": prod_dict["id"]} if prod_dict.get("id") else {"nombre": prod_dict.get("nombre")}
    await db.products.update_one(filter_query, {"$set": prod_dict}, upsert=True)
    return {"success": True, "message": "Producto sincronizado por el bot exitosamente"}

@api_router.post("/api/bot/offers")
async def bot_create_offer(offer: OfferCreate, x_api_key: Optional[str] = Header(None)):
    if x_api_key != BOT_API_KEY:
        raise HTTPException(status_code=401, detail="No autorizado: API Key incorrecta")
    
    offer_dict = offer.model_dump()
    filter_query = {"id": offer_dict["id"]} if offer_dict.get("id") else {"nombre": offer_dict.get("nombre")}
    await db.offers.update_one(filter_query, {"$set": offer_dict}, upsert=True)
    return {"success": True, "message": "Oferta sincronizada por el bot exitosamente"}

@api_router.post("/admin/login")
async def admin_login(request: AdminLoginRequest):
    current_pw = await get_admin_password()
    if request.password == current_pw:
        return {"success": True, "message": "Autenticado correctamente"}
    raise HTTPException(status_code=401, detail="Contraseña incorrecta")

@api_router.post("/admin/recover")
async def recover_admin_password(request: RecoverRequest):
    config = await db.config.find_one({"_id": "admin_settings"})
    stored_email = config.get("email", ADMIN_EMAIL) if config else ADMIN_EMAIL
    stored_username = config.get("username", "admin") if config else "admin"

    if request.identifier != stored_email and request.identifier != stored_username:
        raise HTTPException(status_code=404, detail="Usuario o correo no encontrado")
    
    temp_password = ''.join(random.choices(string.ascii_letters + string.digits, k=8))
    await set_admin_password(temp_password)
    
    try:
        msg = MIMEText(f"¡Al rescate! 🦸‍♂️ Tu usuario es: {stored_username} y tu clave provisional es: {temp_password}\nUna vez dentro, en la pestaña de inicio de sesión, recuerda cambiar tu contraseña.")
        msg['Subject'] = 'Recuperación de contraseña - CazaOfertas'
        msg['From'] = os.getenv("SMTP_USER", stored_email)
        msg['To'] = stored_email
        
        smtp_server = os.getenv("SMTP_SERVER")
        if smtp_server:
            with smtplib.SMTP(smtp_server, int(os.getenv("SMTP_PORT", 587))) as server:
                server.starttls()
                server.login(os.getenv("SMTP_USER"), os.getenv("SMTP_PASSWORD"))
                server.send_message(msg)
        else:
            print(f"🐝 Bzz bzz! (Simulando envío a {stored_email}) Usuario: {stored_username}, Clave provisional: {temp_password}")
    except Exception as e:
        print(f"Error enviando correo: {e}")
        
    return {"success": True, "message": "Correo enviado con clave provisional"}

@api_router.post("/admin/change-password")
async def change_password(request: ChangePasswordRequest):
    current_valid = await get_admin_password()
    if request.current_password != current_valid:
        raise HTTPException(status_code=401, detail="Contraseña actual incorrecta")
    await set_admin_password(request.new_password)
    return {"success": True, "message": "Contraseña actualizada exitosamente"}

@api_router.get("/admin/products")
async def get_admin_products(password: str):
    current_pw = await get_admin_password()
    if password != current_pw:
        raise HTTPException(status_code=401, detail="No autorizado")
    cursor = db.products.find({})
    products = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        products.append(doc)
    return products

@api_router.post("/admin/products")
async def create_product(product: ProductCreate, password: str):
    current_pw = await get_admin_password()
    if password != current_pw:
        raise HTTPException(status_code=401, detail="No autorizado")
    prod_dict = product.model_dump()
    if not prod_dict.get("created_at"):
        prod_dict["created_at"] = datetime.utcnow()
    await db.products.insert_one(prod_dict)
    return {"success": True, "message": "Producto creado exitosamente"}

@api_router.patch("/admin/products/{product_id}")
async def update_product(product_id: str, product_data: ProductUpdate, password: str):
    current_pw = await get_admin_password()
    if password != current_pw:
        raise HTTPException(status_code=401, detail="No autorizado")
    
    update_dict = {k: v for k, v in product_data.model_dump().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No hay datos para actualizar")
    
    result = await db.products.update_one(get_query_id(product_id), {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return {"success": True, "message": "Producto actualizado"}

@api_router.delete("/admin/products/{product_id}")
async def delete_product(product_id: str, password: str):
    current_pw = await get_admin_password()
    if password != current_pw:
        raise HTTPException(status_code=401, detail="No autorizado")
    result = await db.products.delete_one(get_query_id(product_id))
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return {"success": True, "message": "Producto eliminado"}

@api_router.delete("/admin/products")
async def clear_non_exclusive_products(password: str):
    current_pw = await get_admin_password()
    if password != current_pw:
        raise HTTPException(status_code=401, detail="No autorizado")
    
    result = await db.products.delete_many({
        "$or": [
            {"is_exclusive": False},
            {"is_exclusive": {"$exists": False}}
        ]
    })
    return {"success": True, "message": f"{result.deleted_count} productos normales eliminados. Terminales exclusivas protegidas."}

@api_router.get("/admin/offers")
async def get_admin_offers(password: str):
    current_pw = await get_admin_password()
    if password != current_pw:
        raise HTTPException(status_code=401, detail="No autorizado")
    cursor = db.offers.find({})
    offers = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        offers.append(doc)
    return offers

@api_router.post("/admin/offers")
async def create_offer(offer: OfferCreate, password: str):
    current_pw = await get_admin_password()
    if password != current_pw:
        raise HTTPException(status_code=401, detail="No autorizado")
    offer_dict = offer.model_dump()
    await db.offers.insert_one(offer_dict)
    return {"success": True, "message": "Oferta creada exitosamente"}

@api_router.patch("/admin/offers/{offer_id}")
async def update_offer(offer_id: str, offer_data: OfferUpdate, password: str):
    current_pw = await get_admin_password()
    if password != current_pw:
        raise HTTPException(status_code=401, detail="No autorizado")
    
    update_dict = {k: v for k, v in offer_data.model_dump().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No hay datos para actualizar")
        
    result = await db.offers.update_one(get_query_id(offer_id), {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Oferta no encontrada")
    return {"success": True, "message": "Oferta actualizada"}

@api_router.delete("/admin/offers/{offer_id}")
async def delete_offer(offer_id: str, password: str):
    current_pw = await get_admin_password()
    if password != current_pw:
        raise HTTPException(status_code=401, detail="No autorizado")
    result = await db.offers.delete_one(get_query_id(offer_id))
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Oferta no encontrada")
    return {"success": True, "message": "Oferta eliminado"}

app.include_router(api_router)
