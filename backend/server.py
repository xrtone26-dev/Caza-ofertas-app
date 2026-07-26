import os
import string
import secrets
from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from bson.objectid import ObjectId
from bson.errors import InvalidId
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

class Product(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    original_price: float
    discount_price: float
    discount_percentage: Optional[int] = None
    coupon: Optional[str] = None
    affiliate_link: Optional[str] = None
    image_url: Optional[str] = None
    active: bool
    created_at: datetime

class ProductCreate(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    original_price: float
    discount_price: float
    discount_percentage: Optional[int] = None
    coupon: Optional[str] = None
    affiliate_link: Optional[str] = None
    image_url: Optional[str] = None
    active: bool
    created_at: datetime

class ProductUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    original_price: Optional[float] = None
    discount_price: Optional[float] = None
    discount_percentage: Optional[int] = None
    coupon: Optional[str] = None
    affiliate_link: Optional[str] = None
    image_url: Optional[str] = None
    active: Optional[bool] = None

class Offer(BaseModel):
    id: str
    type: str
    title: str
    description: Optional[str] = None
    code: Optional[str] = None
    link: Optional[str] = None
    active: bool

class OfferCreate(BaseModel):
    id: str
    type: str
    title: str
    description: Optional[str] = None
    code: Optional[str] = None
    link: Optional[str] = None
    active: bool

class OfferUpdate(BaseModel):
    type: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    code: Optional[str] = None
    link: Optional[str] = None
    active: Optional[bool] = None

class AdminLoginRequest(BaseModel):
    password: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[dict]] = []

class ForgotPasswordRequest(BaseModel):
    email: str

class UserRegister(BaseModel):
    nombre: str
    nick: str
    email: str
    telefono: str
    password: str
    avatar: str

class UserLogin(BaseModel):
    identificador: str
    password: str

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

client = AsyncIOMotorClient(MONGO_URL)
db = client.cazaofertas

def get_query_id(item_id: str):
    try:
        return {"$or": [{"id": item_id}, {"_id": ObjectId(item_id)}]}
    except InvalidId:
        return {"id": item_id}

@api_router.get("/products")
async def get_products():
    cursor = db.products.find({"active": True})
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
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        offers.append(doc)
    return offers

@api_router.post("/chat")
async def ai_chat_endpoint(data: ChatRequest):
    return {"reply": "¡Hola! He recibido tu mensaje de Caza Ofertas, pero el cerebro de IA aún está en construcción. ¡Regresa pronto!"}

@api_router.post("/register")
async def register_user(user: UserRegister):
    existing = await db.users.find_one({"$or": [{"email": user.email}, {"nick": user.nick}]})
    if existing:
        raise HTTPException(status_code=400, detail="El correo o nickname ya están en uso.")
    user_dict = user.model_dump()
    await db.users.insert_one(user_dict)
    return {"success": True, "message": "Usuario registrado."}

@api_router.post("/login")
async def login_user(creds: UserLogin):
    user = await db.users.find_one({
        "$or": [{"email": creds.identificador}, {"nick": creds.identificador}],
        "password": creds.password
    })
    if not user:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas.")
    return {"success": True, "nick": user.get("nick"), "nombre": user.get("nombre")}

@api_router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    identifier = request.email
    user = await db.users.find_one({"$or": [{"email": identifier}, {"nick": identifier}]})
    
    if not user:
        return {"success": True, "message": "Si la cuenta existe, enviamos el correo."}

    alphabet = string.ascii_letters + string.digits
    provisional_pass = ''.join(secrets.choice(alphabet) for _ in range(8)).upper()

    await db.users.update_one({"_id": user["_id"]}, {"$set": {"password": provisional_pass}})

    sender_email = os.getenv('EMAIL_USER', 'tu_correo@gmail.com')
    sender_password = os.getenv('EMAIL_PASS', 'tu_contraseña_de_aplicacion')
    
    target_email = user.get("email")
    target_nick = user.get("nick", "Cazador")

    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #FFEA00; background-color: #000; padding: 10px; border-radius: 8px;">CazaOfertasML</h1>
      </div>
      <h2>¡Regla de Oro Activada!</h2>
      <p>Hola <strong>{target_nick}</strong>,</p>
      <p>Has solicitado recuperar tu acceso. Aquí tienes tus credenciales de emergencia:</p>
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <p style="margin: 5px 0;">Tu Nickname: <strong style="color: #0056b3;">{target_nick}</strong></p>
        <p style="margin: 5px 0; font-size: 18px;">Clave Provisional: <strong style="color: #d97706;">{provisional_pass}</strong></p>
      </div>
      <p>Ingresa con esta clave en la página principal. Una vez dentro, recuerda que podrás actualizarla cuando implementemos la función en tu perfil.</p>
      <p>Con cariño,<br>El equipo de CazaOfertasML.</p>
    </div>
    """

    message = MIMEMultipart("alternative")
    message["Subject"] = "Clave Provisional | CazaOfertasML"
    message["From"] = f"Seguridad CazaOfertasML <{sender_email}>"
    message["To"] = target_email
    message.attach(MIMEText(html_content, "html"))

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, target_email, message.as_string())
        return {"success": True, "message": "Correo enviado con éxito"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error enviando el correo.")

@api_router.post("/admin/login")
async def admin_login(request: AdminLoginRequest):
    if request.password == ADMIN_PASSWORD:
        return {"success": True, "message": "Autenticado correctamente"}
    raise HTTPException(status_code=401, detail="Contraseña incorrecta")

@api_router.get("/admin/products")
async def get_admin_products(password: str):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="No autorizado")
    cursor = db.products.find({})
    products = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        products.append(doc)
    return products

@api_router.post("/admin/products")
async def create_product(product: ProductCreate, password: str):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="No autorizado")
    prod_dict = product.model_dump()
    await db.products.insert_one(prod_dict)
    return {"success": True, "message": "Producto creado exitosamente"}

@api_router.patch("/admin/products/{product_id}")
async def update_product(product_id: str, product_data: ProductUpdate, password: str):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="No autorizado")
    
    update_dict = {k: v for k, v in product_data.model_dump().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No hay datos para actualizar")
    
    if 'original_price' in update_dict or 'discount_price' in update_dict:
        product = await db.products.find_one(get_query_id(product_id), {"_id": 0})
        if product:
            original = update_dict.get('original_price', product.get('original_price', 0))
            discount = update_dict.get('discount_price', product.get('discount_price', 0))
            if original > 0:
                update_dict['discount_percentage'] = int(((original - discount) / original) * 100)
    
    result = await db.products.update_one(get_query_id(product_id), {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return {"success": True, "message": "Producto actualizado"}

@api_router.delete("/admin/products/{product_id}")
async def delete_product(product_id: str, password: str):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="No autorizado")
    result = await db.products.delete_one(get_query_id(product_id))
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return {"success": True, "message": "Producto eliminado"}

@api_router.get("/admin/offers")
async def get_admin_offers(password: str):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="No autorizado")
    cursor = db.offers.find({})
    offers = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        offers.append(doc)
    return offers

@api_router.post("/admin/offers")
async def create_offer(offer: OfferCreate, password: str):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="No autorizado")
    offer_dict = offer.model_dump()
    await db.offers.insert_one(offer_dict)
    return {"success": True, "message": "Oferta creada exitosamente"}

@api_router.patch("/admin/offers/{offer_id}")
async def update_offer(offer_id: str, offer_data: OfferUpdate, password: str):
    if password != ADMIN_PASSWORD:
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
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="No autorizado")
    result = await db.offers.delete_one(get_query_id(offer_id))
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Oferta no encontrada")
    return {"success": True, "message": "Oferta eliminada"}

app.include_router(api_router)
