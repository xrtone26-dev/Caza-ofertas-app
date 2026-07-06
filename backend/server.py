# Eliminar oferta (admin)
@api_router.delete("/admin/offers/{offer_id}")
async def delete_offer(offer_id: str, password: str):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="No autorizado")
    
    result = await db.offers.delete_one({"id": offer_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Oferta no encontrada")
    
    return {"success": True, "message": "Oferta eliminada"}

# ========== PRODUCTOS ENDPOINTS ==========

# Obtener últimos 5 productos activos (público)
@api_router.get("/products", response_model=List[Product])
async def get_products():
    products = await db.products.find(
        {"active": True}, 
        {"_id": 0}
    ).sort("created_at", -1).limit(5).to_list(5)
    
    # Convert ISO string timestamps back to datetime objects
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
    
    # Convert ISO string timestamps back to datetime objects
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
    
    # Calculate discount percentage if not provided
    if product.discount_percentage is None and product.original_price > 0:
        product.discount_percentage = int(
            ((product.original_price - product.discount_price) / product.original_price) * 100
        )
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
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
    
    # Recalculate discount percentage if prices are updated
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
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    return {"success": True, "message": "Producto eliminado"}