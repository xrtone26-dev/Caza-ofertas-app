import os
from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient

# ========== MODELOS ==========
class Product(BaseModel):
    id: str
    name: str
    original_price: float
    discount_price: float
    discount_percentage: Optional[int] = None
    active: bool
    created_at: datetime

class ProductCreate(BaseModel):
    id: str
    name: str
    original_price: float
    discount_price: float
    active: bool
    created_at: datetime

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    original_price: Optional[float] = None
    discount_price: Optional[float] = None
    active: Optional[bool] = None

class OfferUpdate(BaseModel):
    type: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    code: Optional[str] = None
    link: Optional[str] = None
    active: Optional[bool] = None

class AdminLoginRequest(BaseModel):
    password: str

# ================= CHAT CON PROVEEDOR DE IA =================
class ChatRequest(BaseModel):
    message: str
    history: Optional[List[dict]] = []

# ========== CONFIGURACIÓN ==========
app = FastAPI()

# ¡AQUÍ ESTÁ LA LLAVE DE CORS QUE FALTABA!
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite peticiones desde cualquier frontend (StackBlitz, Vercel, etc.)
    allow_credentials=True,
    allow_methods=["*"],  # Permite GET, POST, OPTIONS, PATCH, DELETE, etc.
    allow_headers=["*"],
)

api_router = APIRouter()

MONGO_URL = os.getenv("MONGO_URL")
client = AsyncIOMotorClient(MONGO_URL)
db = client.cazaofertas_db 

ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "Caza-Ofertas2026")

# ========== ENDPOINTS ==========

@api_router.post("/chat")
async def ai_chat_endpoint(data: ChatRequest):
    user_msg = data.message.lower()
    
    # Detección de intención táctica (ej. WhatsApp)
    if "whatsapp" in user_msg or "número" in user_msg or "contacto" in user_msg:
        reply_text = f"¡Claro! Nuestro número oficial de atención por WhatsApp es +523312229710. Escríbenos directamente aquí: https://wa.me/523312229710"
    elif "tv" in user_msg or "samsung" in user_msg or "pantalla" in user_msg:
        reply_text = "¡Tenemos excelentes ofertas en pantallas! Revisa los descuentos activos en nuestro carrusel principal o pídenos el cupón secreto."
    elif "cupon" in user_msg or "descuento" in user_msg:
        reply_text = "Puedes abrir la pestaña de 'Cupones Especiales' arriba para ver los códigos con descuento directo para Mercado Libre."
    else:
        reply_text = "¡Entendido! Déjanos tu duda exacta o da clic en nuestro botón de búsqueda personalizada de WhatsApp para rastrear el artículo por ti."
        
    return {"reply": reply_text}

# Iniciar sesión de administrador
@api_router.post("/admin/login")
async def admin_login(data: AdminLoginRequest):
    if data.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Contraseña incorrecta")
    return {"success": True, "message": "Acceso concedido"}

# Obtener ofertas públicas
@api_router.get("/offers")
async def get_offers(type: Optional[str] = None):
    query = {}
    if type:
        query["type"] = type
    offers = await db.offers.find(query, {"_id": 0}).to_list(100)
    return offers

# Obtener todas las ofertas (admin)
@api_router.get("/admin/offers")
async def get_all_offers(password: str):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="No autorizado")
    offers = await db.offers.find({}, {"_id": 0}).to_list(1000)
    return offers

# Crear nueva oferta (admin)
@api_router.post("/admin/offers")
async def create_offer(offer_data: dict, password: str):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="No autorizado")
    await db.offers.insert_one(offer_data)
    return {"success": True, "message": "Oferta creada"}

# Actualizar oferta/cupón (admin)
@api_router.patch("/admin/offers/{offer_id}")
async def update_offer(offer_id: str, offer_data: OfferUpdate, password: str):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="No autorizado")
    
    update_dict = {k: v for k, v in offer_data.model_dump().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No hay datos para actualizar")
    
    result = await db.offers.update_one(
        {"id": offer_id},
        {"$set": update_dict}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Oferta no encontrada")
    
    return {"success": True, "message": "Oferta actualizada"}

# Eliminar oferta (admin)
@api_router.delete("/admin/offers/{offer_id}")
async def delete_offer(offer_id: str, password: str):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="No autorizado")
    
    result = await db.offers.delete_one({"id": offer_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Oferta no encontrada")
    
    return {"success": True, "message": "Oferta eliminada"}

# Obtener últimos 5 productos activos (público)
@api_router.get("/products", response_model=List[Product])
async def get_products():
    products = await db.products.find(
        {"active": True}, 
        {"_id": 0}
    ).sort("created_at", -1).limit(5).to_list(5)
    
    for product in products:
        if isinstance(product.get('created_at'), str):
            product['created_at'] = datetime.fromisoformat(product['created_at'])
    return products

# Obtener todos los productos (admin)
@api_router.get("/admin/products", response_model=List[Product])
async def get_all_products(password: str):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="No autorizado")
    
    products = await db.products.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for product in products:
        if isinstance(product.get('created_at'), str):
            product['created_at'] = datetime.fromisoformat(product['created_at'])
    return products

# Crear nuevo producto (admin)
@api_router.post("/admin/products", response_model=Product)
async def create_product(product_data: ProductCreate, password: str):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="No autorizado")
    
    product = Product(**product_data.model_dump())
    if product.discount_percentage is None and product.original_price > 0:
        product.discount_percentage = int(
            ((product.original_price - product.discount_price) / product.original_price) * 100
        )
    
    doc = product.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.products.insert_one(doc)
    return product

# Actualizar producto (admin)
@api_router.patch("/admin/products/{product_id}")
async def update_product(product_id: str, product_data: ProductUpdate, password: str):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="No autorizado")
    
    update_dict = {k: v for k, v in product_data.model_dump().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No hay datos para actualizar")
    
    if 'original_price' in update_dict or 'discount_price' in update_dict:
        product = await db.products.find_one({"id": product_id}, {"_id": 0})
        if product:
            original = update_dict.get('original_price', product.get('original_price', 0))
            discount = update_dict.get('discount_price', product.get('discount_price', 0))
            if original > 0:
                update_dict['discount_percentage'] = int(((original - discount) / original) * 100)
    
    result = await db.products.update_one(
        {"id": product_id},
        {"$set": update_dict}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    return {"success": True, "message": "Producto actualizado"}

# Eliminar producto (admin)
@api_router.delete("/admin/products/{product_id}")
async def delete_product(product_id: str, password: str):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="No autorizado")
    
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Oferta no encontrada")
    
    return {"success": True, "message": "Producto eliminado"}

# Registro final
app.include_router(api_router)
