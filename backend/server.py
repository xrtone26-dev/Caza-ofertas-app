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
from groq import Groq

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
        "active": True,
        "$or": [
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
    query = {"active": True}
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
        active_products = await db.products.find({"active": True}).to_list(length=100)
        all_offers = await db.offers.find({"active": True}).to_list(length=100)
        
        now = datetime.utcnow()
        active_offers = []
        for o in all_offers:
            exp = o.get("expires_at")
            if exp:
                if isinstance(exp, str):
                    try:
                        exp = datetime.fromisoformat(exp.replace("Z", "+00:00"))
                    except ValueError:
                        pass
                if isinstance(exp, datetime) and exp.replace(tzinfo=None) <= now:
                    continue
            active_offers.append(o)
        
        db_context = "\n\n--- INVENTARIO Y OFERTAS REALES VIGENTES EN LA TIENDA ---\n"
        if active_products:
            db_context += "PRODUCTOS:\n"
            for p in active_products:
                p_title = p.get('nombre') or p.get('title') or 'Producto'
                p_price = p.get('precio') or p.get('discount_price') or 'N/A'
                p_link = p.get('link') or p.get('affiliate_link') or 'N/A'
                db_context += f"- {p_title}: Precio ${p_price}. Link real: {p_link}\n"
        if active_offers:
            db_context += "\nOFERTAS Y PROMOCIONES VIGENTES:\n"
            for o in active_offers:
                nombre = o.get('nombre') or o.get('title') or 'Oferta'
                precio = o.get('precio') or 'N/A'
                descuento = o.get('descuento') or 'N/A'
                link = o.get('link') or 'N/A'
                is_excl = o.get('is_exclusive', False)
                db_context += f"- Producto: {nombre}, Precio: {precio}, Descuento: {descuento}, Exclusivo: {is_excl}, Link: {link}\n"
        else:
            db_context += "\nOFERTAS VIGENTES: NO HAY NINGUNA OFERTA ACTIVA EN ESTE MOMENTO.\n"

        ai_client = Groq(api_key=GROQ_API_KEY)
        messages = [{"role": "system", "content": (data.systemPrompt if data.systemPrompt else "Eres un asistente experto de CazaOfertasML.") + db_context}]
        
        for msg in data.history:
            messages.append({"role": "user" if msg["sender"] == "user" else "assistant", "content": msg["text"]})
            
        chat_completion = ai_client.chat.completions.create(
            messages=messages,
            model="llama-3.3-70b-versatile",
            temperature=0.2,
            max_tokens=300
        )
        
        return {"reply": chat_completion.choices[0].message.content}

    except Exception as e:
        print(f"Error en AI: {str(e)}")
        return {"reply": "¡Uy! Mi procesador está un poco saturado cazando ofertas en este momento. 😅 ¿Puedes intentarlo de nuevo en unos segundos?"}

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
    return {"success": True, "message": "Oferta eliminada"}

app.include_router(api_router)
