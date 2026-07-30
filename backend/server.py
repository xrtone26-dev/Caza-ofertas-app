import os
from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from bson.objectid import ObjectId
from bson.errors import InvalidId

# Importamos la NUEVA librería oficial de Google Gemini
from google import genai
from google.genai import types

# ========== MODELOS ==========
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
    systemPrompt: Optional[str] = None 

# ========== CONFIGURACIÓN ==========
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

# ========== RUTAS PÚBLICAS ==========
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

# ========== EL NUEVO CEREBRO DE LA IA (GEMINI ACTUALIZADO) ==========
@api_router.post("/chat")
async def ai_chat_endpoint(data: ChatRequest):
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    
    if not GEMINI_API_KEY:
        return {"reply": "⚠️ El administrador aún no ha configurado la API Key de Gemini en el servidor."}
    
    try:
        # Iniciamos el cliente con la nueva librería
        ai_client = genai.Client(api_key=GEMINI_API_KEY)
        
        # Preparamos el historial de chat en el formato estricto que pide Google
        formatted_history = []
        for msg in data.history:
            role = "user" if msg["sender"] == "user" else "model"
            formatted_history.append(
                types.Content(
                    role=role,
                    parts=[types.Part.from_text(text=msg["text"])]
                )
            )
            
        # Configuramos el System Prompt
        sys_prompt = data.systemPrompt if data.systemPrompt else "Eres un asistente experto de CazaOfertasML."
        
        # Generamos la respuesta con el modelo más nuevo (2.0-flash)
        response = ai_client.models.generate_content(
            model='gemini-1.5-flash',
            contents=formatted_history,
            config=types.GenerateContentConfig(
                system_instruction=sys_prompt,
                temperature=0.7
            )
        )
        
        return {"reply": response.text}

    except Exception as e:
        print(f"Error en AI: {str(e)}")
        return {"reply": "¡Uy! Mi procesador está un poco saturado cazando ofertas en este momento. 😅 ¿Puedes intentarlo de nuevo en unos segundos?"}

# ========== RUTAS DE ADMINISTRACIÓN ==========
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
