import React, { useState } from 'react';
import { X, Plus, Edit2, Trash2, Video, Copy, ShoppingCart, Image as ImageIcon } from 'lucide-react';
import axios from 'axios';

export const decodeCoupon = (offer) => {
  let expires_at = offer.expires_at;
  let description = offer.description || '';
  const match = description.match(/\|\|exp:(.*?)\|\|/);
  if (match) {
    if (match[1]) expires_at = match[1];
    description = description.replace(match[0], '').trim();
  }
  return { ...offer, expires_at, description };
};

export default function AdminDashboard({
  showAdminLogin,
  setShowAdminLogin,
  showAdminPanel,
  setShowAdminPanel,
  adminPassword,
  setAdminPassword,
  isAuthenticated,
  setIsAuthenticated,
  API,
  getSafeId,
  loadPublicOffers,
  loadPublicProducts,
  tiktokVideos,
  setTiktokVideos,
}) {
  const [allOffers, setAllOffers] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [adminSection, setAdminSection] = useState('offers');
  const [showAddOfferModal, setShowAddOfferModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Nuevo estado para el modal de advertencia de borrado masivo
  const [showDeleteAllProductsModal, setShowDeleteAllProductsModal] = useState(false);

  const [showAddVideoModal, setShowAddVideoModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [videoFormTitle, setVideoFormTitle] = useState('');
  const [videoFormUrl, setVideoFormUrl] = useState('');
  const [videoFormBuyUrl, setVideoFormBuyUrl] = useState('');
  const [videoFormImageUrl, setVideoFormImageUrl] = useState('');

  const [newOffer, setNewOffer] = useState({
    type: 'cupon',
    title: '',
    description: '',
    code: '',
    min_purchase: '',
    link: '',
    expires_at: '',
    active: true,
  });

  const [newProduct, setNewProduct] = useState({
    title: '',
    description: '',
    original_price: '',
    discount_price: '',
    discount_percentage: '',
    coupon: '',
    affiliate_link: '',
    image_url: '',
    active: true,
  });

  const formatCurrencyInput = (value) => {
    const rawDigits = value.replace(/\D/g, '');
    if (!rawDigits) return '';
    return '$' + Number(rawDigits).toLocaleString('en-US');
  };

  const loadAllOffers = async () => {
    try {
      const response = await axios.get(`${API}/admin/offers`, {
        params: { password: adminPassword },
      });
      setAllOffers(response.data.map(decodeCoupon));
    } catch (error) {}
  };

  const loadAllProducts = async () => {
    try {
      const response = await axios.get(`${API}/admin/products`, {
        params: { password: adminPassword },
      });
      setAllProducts(response.data);
    } catch (error) {}
  };

  const handleAdminLogin = async () => {
    try {
      const response = await axios.post(`${API}/admin/login`, {
        password: adminPassword,
      });
      if (response.data.success) {
        setIsAuthenticated(true);
        setShowAdminLogin(false);
        setShowAdminPanel(true);
        loadAllOffers();
        loadAllProducts();
      }
    } catch (error) {
      alert('Contraseña incorrecta');
    }
  };

  const handleSaveVideoAdmin = (e) => {
    e.preventDefault();
    if (!videoFormTitle.trim() || !videoFormUrl.trim()) {
      alert('Por favor ingresa el título y la URL del video.');
      return;
    }

    if (editingVideo) {
      setTiktokVideos(tiktokVideos.map(v => v.id === editingVideo.id ? { 
        ...v, 
        title: videoFormTitle, 
        url: videoFormUrl, 
        buyUrl: videoFormBuyUrl,
        imageUrl: videoFormImageUrl 
      } : v));
      alert('¡Video actualizado con éxito!');
    } else {
      const newVid = {
        id: 'video-' + Date.now(),
        title: videoFormTitle,
        author: 'CazaOfertas Oficial',
        url: videoFormUrl,
        buyUrl: videoFormBuyUrl,
        imageUrl: videoFormImageUrl,
        likes: Math.floor(Math.random() * 200) + 50,
        dislikes: Math.floor(Math.random() * 10),
        hearts: Math.floor(Math.random() * 500) + 100
      };
      setTiktokVideos([...tiktokVideos, newVid]);
      alert('¡Video cargado con éxito!');
    }

    setVideoFormTitle('');
    setVideoFormUrl('');
    setVideoFormBuyUrl('');
    setVideoFormImageUrl('');
    setEditingVideo(null);
    setShowAddVideoModal(false);
  };

  const handleDeleteVideoAdmin = (id) => {
    if (window.confirm('¿Estás seguro de eliminar este video?')) {
      setTiktokVideos(tiktokVideos.filter(v => v.id !== id));
    }
  };

  const handleCopyVideoLinkAdmin = (videoId) => {
    const uniqueUrl = `${window.location.origin}${window.location.pathname}?video=${videoId}`;
    navigator.clipboard.writeText(uniqueUrl);
    alert('🔗 ¡Link único del video copiado al portapapeles!');
  };

  const handleCreateOffer = async () => {
    try {
      const rawMin = newOffer.min_purchase ? Number(String(newOffer.min_purchase).replace(/\D/g, '')) : 0;
      
      let desc = (newOffer.description || '').replace(/\s*\|\|exp:.*?\|\|/g, '');
      if (newOffer.expires_at) desc += ` ||exp:${newOffer.expires_at}||`;

      const offerData = {
        ...newOffer,
        description: desc,
        min_purchase: rawMin,
        type: 'cupon',
        id: 'offer_' + Date.now(),
      };
      await axios.post(
        `${API}/admin/offers?password=${adminPassword}`,
        offerData
      );
      setShowAddOfferModal(false);
      setNewOffer({
        type: 'cupon',
        title: '',
        description: '',
        code: '',
        min_purchase: '',
        link: '',
        expires_at: '',
        active: true,
      });
      loadAllOffers();
      if (loadPublicOffers) loadPublicOffers();
    } catch (error) {
      alert('Error al crear cupón');
    }
  };

  const handleUpdateOffer = async (offerOrId, updates) => {
    try {
      const offerId = getSafeId(offerOrId);
      if (!offerId) return;
      
      const rawMin = updates.min_purchase !== undefined && updates.min_purchase !== ''
        ? Number(String(updates.min_purchase).replace(/\D/g, ''))
        : 0;
        
      let desc = (updates.description || '').replace(/\s*\|\|exp:.*?\|\|/g, '');
      if (updates.expires_at) desc += ` ||exp:${updates.expires_at}||`;

      const updateData = { ...updates, min_purchase: rawMin, type: 'cupon', description: desc };
      await axios.patch(
        `${API}/admin/offers/${offerId}?password=${adminPassword}`,
        updateData
      );
      loadAllOffers();
      if (loadPublicOffers) loadPublicOffers();
      setEditingOffer(null);
      setShowAddOfferModal(false);
    } catch (error) {
      alert('Error al actualizar cupón');
    }
  };

  const handleDeleteOffer = async (offerOrId) => {
    const offerId = getSafeId(offerOrId);
    if (!offerId) return;
    if (window.confirm('¿Estás seguro de eliminar este cupón?')) {
      try {
        await axios.delete(
          `${API}/admin/offers/${offerId}?password=${adminPassword}`
        );
        loadAllOffers();
        if (loadPublicOffers) loadPublicOffers();
      } catch (error) {
        alert('Error al eliminar cupón');
      }
    }
  };

  const handleCreateProduct = async () => {
    try {
      const productData = {
        ...newProduct,
        id: 'prod_' + Date.now(),
        created_at: new Date().toISOString(),
        original_price: parseFloat(newProduct.original_price),
        discount_price: parseFloat(newProduct.discount_price),
        discount_percentage: newProduct.discount_percentage
          ? parseInt(newProduct.discount_percentage)
          : null,
      };
      await axios.post(
        `${API}/admin/products?password=${adminPassword}`,
        productData
      );
      setShowAddProductModal(false);
      setNewProduct({
        title: '',
        description: '',
        original_price: '',
        discount_price: '',
        discount_percentage: '',
        coupon: '',
        affiliate_link: '',
        image_url: '',
        active: true,
      });
      loadAllProducts();
      if (loadPublicProducts) loadPublicProducts();
    } catch (error) {
      alert('Error al crear producto');
    }
  };

  const handleUpdateProduct = async (productOrId, updates) => {
    try {
      const productId = getSafeId(productOrId);
      if (!productId) return;
      const updateData = { ...updates };
      if (updateData.original_price !== '' && updateData.original_price != null)
        updateData.original_price = parseFloat(updateData.original_price);
      if (updateData.discount_price !== '' && updateData.discount_price != null)
        updateData.discount_price = parseFloat(updateData.discount_price);
      if (
        updateData.discount_percentage !== '' &&
        updateData.discount_percentage != null
      )
        updateData.discount_percentage = parseInt(
          updateData.discount_percentage
        );

      await axios.patch(
        `${API}/admin/products/${productId}?password=${adminPassword}`,
        updateData
      );
      loadAllProducts();
      if (loadPublicProducts) loadPublicProducts();
      setEditingProduct(null);
      setShowAddProductModal(false);
    } catch (error) {
      alert('Error al actualizar producto');
    }
  };

  const handleDeleteProduct = async (productOrId) => {
    const productId = getSafeId(productOrId);
    if (!productId) return;
    if (window.confirm('¿Estás seguro de eliminar este producto?')) {
      try {
        await axios.delete(
          `${API}/admin/products/${productId}?password=${adminPassword}`
        );
        loadAllProducts();
        if (loadPublicProducts) loadPublicProducts();
      } catch (error) {
        alert('Error al eliminar producto');
      }
    }
  };

  // Función para vaciar todos los productos
  const handleDeleteAllProducts = async () => {
    try {
      for (const prod of allProducts) {
        const productId = getSafeId(prod);
        if (productId) {
          await axios.delete(`${API}/admin/products/${productId}?password=${adminPassword}`);
        }
      }
      loadAllProducts();
      if (loadPublicProducts) loadPublicProducts();
      setShowDeleteAllProductsModal(false);
      alert('Todos los productos han sido eliminados correctamente.');
    } catch (error) {
      alert('Hubo un error al eliminar algunos productos. Inténtalo nuevamente.');
    }
  };

  return (
    <>
      {showAdminLogin && (
        <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-gray-800">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">🔐 Acceso Administrador</h2>
              <button
                onClick={() => setShowAdminLogin(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Contraseña de administrador"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg mb-4 text-gray-800 focus:outline-none focus:border-purple-500"
            />
            <button
              onClick={handleAdminLogin}
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-3 rounded-lg font-bold hover:shadow-lg"
            >
              Entrar
            </button>
          </div>
        </div>
      )}

      {showAdminPanel && isAuthenticated && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto text-gray-800">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">🛠️ Panel de Administración</h2>
              <button
                onClick={() => setShowAdminPanel(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setAdminSection('offers')}
                className={`px-4 py-2 rounded-lg font-bold ${
                  adminSection === 'offers'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Cupones
              </button>
              <button
                onClick={() => setAdminSection('products')}
                className={`px-4 py-2 rounded-lg font-bold ${
                  adminSection === 'products'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Productos
              </button>
              <button
                onClick={() => setAdminSection('videos')}
                className={`px-4 py-2 rounded-lg font-bold flex items-center gap-1.5 ${
                  adminSection === 'videos'
                    ? 'bg-yellow-500 text-black'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                <Video size={18} /> Videos
              </button>
            </div>

            {adminSection === 'offers' && (
              <>
                <button
                  onClick={() => setShowAddOfferModal(true)}
                  className="mb-6 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-3 rounded-lg font-bold hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" /> Nuevo Cupón
                </button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {allOffers.map((offer) => (
                    <div
                      key={getSafeId(offer) || offer.title}
                      className={`border-2 rounded-xl p-6 ${
                        offer.active
                          ? 'border-green-300 bg-green-50'
                          : 'border-gray-300 bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="px-3 py-1 rounded-full text-sm font-bold bg-purple-200 text-purple-800">
                          ✨ Cupón
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingOffer({
                                ...offer,
                                min_purchase: offer.min_purchase ? formatCurrencyInput(String(offer.min_purchase)) : ''
                              });
                              setShowAddOfferModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteOffer(offer)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      <h3 className="text-xl font-bold mb-2">{offer.title}</h3>
                      <p className="text-gray-600 mb-2">{offer.description}</p>
                      {offer.code && (
                        <p className="text-sm text-gray-500">
                          Código:{' '}
                          <span className="font-bold">{offer.code}</span>
                        </p>
                      )}
                      {offer.min_purchase !== undefined && offer.min_purchase !== null && (
                        <p className="text-sm text-purple-700 font-bold mt-1">
                          Mínimo de compra: ${Number(offer.min_purchase).toLocaleString('en-US')}
                        </p>
                      )}
                      {offer.expires_at && (
                        <p className="text-xs text-red-500 mt-1 font-bold">
                          ⏰ Expira: {new Date(offer.expires_at).toLocaleString()}
                        </p>
                      )}
                      {offer.link && (
                        <p className="text-sm text-blue-600 truncate mt-1">
                          Link: {offer.link}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        Estado: {offer.active ? 'Activo ✓' : 'Inactivo'}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {adminSection === 'products' && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <button
                    onClick={() => setShowAddProductModal(true)}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-lg font-bold hover:shadow-lg transition-all flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" /> Nuevo Producto
                  </button>

                  {allProducts.length > 0 && (
                    <button
                      onClick={() => setShowDeleteAllProductsModal(true)}
                      className="bg-red-100 text-red-600 hover:bg-red-200 px-4 py-3 rounded-lg font-bold transition-all flex items-center gap-2 border border-red-200"
                      title="Eliminar todos los productos"
                    >
                      <Trash2 className="w-5 h-5" /> Vaciar Lista
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {allProducts.map((prod) => (
                    <div
                      key={getSafeId(prod) || prod.title}
                      className="border-2 rounded-xl p-6 border-gray-300 bg-gray-50"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="px-3 py-1 rounded-full text-sm font-bold bg-green-200 text-green-800">
                          📦 Producto
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingProduct(prod);
                              setShowAddProductModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      <h3 className="text-xl font-bold mb-2">{prod.title}</h3>
                      <p className="text-gray-600 mb-2">
                        ${prod.discount_price} / ${prod.original_price}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {adminSection === 'videos' && (
              <>
                <button
                  onClick={() => {
                    setEditingVideo(null);
                    setVideoFormTitle('');
                    setVideoFormUrl('');
                    setVideoFormBuyUrl('');
                    setVideoFormImageUrl('');
                    setShowAddVideoModal(true);
                  }}
                  className="mb-6 bg-yellow-400 hover:bg-yellow-300 text-black px-6 py-3 rounded-lg font-bold hover:shadow-lg transition-all flex items-center gap-2 border-2 border-black"
                >
                  <Plus className="w-5 h-5" /> Cargar Nuevo Video y Producto
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tiktokVideos && tiktokVideos.map((video) => (
                    <div key={video.id} className="border-2 border-gray-300 bg-gray-50 rounded-xl p-4 flex flex-col justify-between">
                      <div className="flex gap-3 items-center">
                        <div className="w-14 h-14 bg-gray-200 rounded-lg overflow-hidden border border-gray-300 flex-shrink-0 flex items-center justify-center">
                          {(video.imageUrl || video.image_url) ? (
                            <img src={video.imageUrl || video.image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon size={20} className="text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-200 text-yellow-800">
                              🎬 Video Probado
                            </span>
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleCopyVideoLinkAdmin(video.id)}
                                className="text-yellow-600 hover:text-yellow-800 p-1"
                                title="Copiar Link Único"
                              >
                                <Copy size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingVideo(video);
                                  setVideoFormTitle(video.title);
                                  setVideoFormUrl(video.url);
                                  setVideoFormBuyUrl(video.buyUrl || '');
                                  setVideoFormImageUrl(video.imageUrl || video.image_url || '');
                                  setShowAddVideoModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-800 p-1"
                                title="Editar"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteVideoAdmin(video.id)}
                                className="text-red-600 hover:text-red-800 p-1"
                                title="Eliminar"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                          <h4 className="font-bold text-gray-800 text-sm truncate">{video.title}</h4>
                          <p className="text-xs text-blue-600 truncate font-semibold flex items-center gap-1">
                            <ShoppingCart size={10} /> Compra ML asignado
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

          </div>
        </div>
      )}

      {/* Modal para confirmar el vaciado completo de productos */}
      {showDeleteAllProductsModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[80] p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center text-gray-800 shadow-2xl">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black mb-2">¿Vaciar Productos?</h3>
            <p className="text-gray-600 mb-6 font-medium text-sm">
              Estás a punto de eliminar <strong>TODOS ({allProducts.length})</strong> los productos de tu carrusel. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteAllProducts}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-black shadow-lg transition-all"
              >
                Sí, eliminar todo
              </button>
              <button
                onClick={() => setShowDeleteAllProductsModal(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-xl font-bold transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddVideoModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-gray-800 relative">
            <button
              onClick={() => setShowAddVideoModal(false)}
              className="absolute top-6 right-6 text-gray-500 hover:text-gray-800"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-2xl font-bold mb-4">
              {editingVideo ? 'Editar Video y Producto' : 'Cargar Video y Vista Previa'}
            </h3>
            <form onSubmit={handleSaveVideoAdmin} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-bold mb-1.5 text-sm">Título del Video / Producto</label>
                <input
                  type="text"
                  value={videoFormTitle}
                  onChange={(e) => setVideoFormTitle(e.target.value)}
                  placeholder="Ej: Probando artefacto viral 🔥"
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-yellow-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-1.5 text-sm">URL del Video (MP4 o Facebook)</label>
                <input
                  type="text"
                  value={videoFormUrl}
                  onChange={(e) => setVideoFormUrl(e.target.value)}
                  placeholder="https://... o enlace de Facebook"
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-yellow-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-1.5 text-sm">URL de Compra en Mercado Libre 🛒</label>
                <input
                  type="text"
                  value={videoFormBuyUrl}
                  onChange={(e) => setVideoFormBuyUrl(e.target.value)}
                  placeholder="https://mercadolibre.com.mx/..."
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-yellow-500 text-sm font-semibold text-blue-600"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-1.5 text-sm">URL de la Miniatura del Producto 🖼️</label>
                <input
                  type="text"
                  value={videoFormImageUrl}
                  onChange={(e) => setVideoFormImageUrl(e.target.value)}
                  placeholder="https://... (imagen para el botón)"
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-yellow-500 text-sm"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-yellow-400 text-black py-3 rounded-lg font-bold hover:bg-yellow-300 transition-all border-2 border-black mt-2"
              >
                {editingVideo ? 'Guardar Cambios' : 'Cargar Video y Vista Previa'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showAddOfferModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto text-gray-800 relative">
            <button
              onClick={() => {
                setShowAddOfferModal(false);
                setEditingOffer(null);
              }}
              className="absolute top-6 right-6 text-gray-500 hover:text-gray-800"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold mb-4">
              {editingOffer ? 'Editar Cupón' : 'Agregar Cupón'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-bold mb-2">
                  Título
                </label>
                <input
                  type="text"
                  value={editingOffer ? editingOffer.title : newOffer.title}
                  onChange={(e) =>
                    editingOffer
                      ? setEditingOffer({
                          ...editingOffer,
                          title: e.target.value,
                        })
                      : setNewOffer({ ...newOffer, title: e.target.value })
                  }
                  placeholder="Ej: Descuento en artículos seleccionados"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2">
                  Descripción
                </label>
                <textarea
                  value={
                    editingOffer
                      ? editingOffer.description
                      : newOffer.description
                  }
                  onChange={(e) =>
                    editingOffer
                      ? setEditingOffer({
                          ...editingOffer,
                          description: e.target.value,
                        })
                      : setNewOffer({
                          ...newOffer,
                          description: e.target.value,
                        })
                  }
                  placeholder="Descripción detallada del cupón"
                  rows="3"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2">
                  Código (opcional)
                </label>
                <input
                  type="text"
                  value={editingOffer ? editingOffer.code : newOffer.code}
                  onChange={(e) =>
                    editingOffer
                      ? setEditingOffer({
                          ...editingOffer,
                          code: e.target.value,
                        })
                      : setNewOffer({ ...newOffer, code: e.target.value })
                  }
                  placeholder="Ej: CUPON50"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2">
                  Mínimo de Compra ($)
                </label>
                <input
                  type="text"
                  value={
                    editingOffer
                      ? editingOffer.min_purchase || ''
                      : newOffer.min_purchase || ''
                  }
                  onChange={(e) => {
                    const formatted = formatCurrencyInput(e.target.value);
                    if (editingOffer) {
                      setEditingOffer({ ...editingOffer, min_purchase: formatted });
                    } else {
                      setNewOffer({ ...newOffer, min_purchase: formatted });
                    }
                  }}
                  placeholder="$10,000"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2">
                  Fecha y Hora de Expiración (Caducidad)
                </label>
                <input
                  type="datetime-local"
                  value={
                    editingOffer
                      ? editingOffer.expires_at || ''
                      : newOffer.expires_at || ''
                  }
                  onChange={(e) =>
                    editingOffer
                      ? setEditingOffer({
                          ...editingOffer,
                          expires_at: e.target.value,
                        })
                      : setNewOffer({
                          ...newOffer,
                          expires_at: e.target.value,
                        })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2">
                  Enlace / Link (opcional)
                </label>
                <input
                  type="text"
                  value={editingOffer ? editingOffer.link : newOffer.link}
                  onChange={(e) =>
                    editingOffer
                      ? setEditingOffer({
                          ...editingOffer,
                          link: e.target.value,
                        })
                      : setNewOffer({ ...newOffer, link: e.target.value })
                  }
                  placeholder="https://..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                />
              </div>
              <button
                onClick={() => {
                  if (editingOffer) {
                    const cleanUpdates = { ...editingOffer, type: 'cupon' };
                    const idKeys = [
                      'id',
                      '_id',
                      'offer_id',
                      'product_id',
                      'Id',
                      'ID',
                      'uuid',
                    ];
                    idKeys.forEach((k) => delete cleanUpdates[k]);
                    handleUpdateOffer(editingOffer, cleanUpdates);
                  } else {
                    handleCreateOffer();
                  }
                }}
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-3 rounded-lg font-bold hover:shadow-lg transition-all"
              >
                {editingOffer ? 'Actualizar Cupón' : 'Guardar Cupón'}
              </button>
              <button
                onClick={() => {
                  setShowAddOfferModal(false);
                  setEditingOffer(null);
                }}
                className="w-full bg-gray-300 text-gray-800 py-3 rounded-lg font-bold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddProductModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto text-gray-800 relative">
            <button
              onClick={() => {
                setShowAddProductModal(false);
                setEditingProduct(null);
              }}
              className="absolute top-6 right-6 text-gray-500 hover:text-gray-800"
              aria-label="Cerrar modal"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold mb-4">
              {editingProduct ? 'Editar Producto' : 'Agregar Producto'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-bold mb-2">
                  Título del Producto
                </label>
                <input
                  type="text"
                  value={
                    editingProduct ? editingProduct.title : newProduct.title
                  }
                  onChange={(e) =>
                    editingProduct
                      ? setEditingProduct({
                          ...editingProduct,
                          title: e.target.value,
                        })
                      : setNewProduct({ ...newProduct, title: e.target.value })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2">
                  Descripción
                </label>
                <textarea
                  value={
                    editingProduct
                      ? editingProduct.description
                      : newProduct.description
                  }
                  onChange={(e) =>
                    editingProduct
                      ? setEditingProduct({
                          ...editingProduct,
                          description: e.target.value,
                        })
                      : setNewProduct({
                          ...newProduct,
                          description: e.target.value,
                        })
                  }
                  placeholder="Descripción del producto, características, etc."
                  rows="3"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-bold mb-2">
                    Precio Original ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={
                      editingProduct
                        ? editingProduct.original_price
                        : newProduct.original_price
                    }
                    onChange={(e) =>
                      editingProduct
                        ? setEditingProduct({
                            ...editingProduct,
                            original_price: e.target.value,
                          })
                        : setNewProduct({
                            ...newProduct,
                            original_price: e.target.value,
                          })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-2">
                    Precio con Descuento ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={
                      editingProduct
                        ? editingProduct.discount_price
                        : newProduct.discount_price
                    }
                    onChange={(e) =>
                      editingProduct
                        ? setEditingProduct({
                            ...editingProduct,
                            discount_price: e.target.value,
                          })
                        : setNewProduct({
                            ...newProduct,
                            discount_price: e.target.value,
                          })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2">
                  URL de la Imagen
                </label>
                <input
                  type="text"
                  value={
                    editingProduct
                      ? editingProduct.image_url
                      : newProduct.image_url
                  }
                  onChange={(e) =>
                    editingProduct
                      ? setEditingProduct({
                          ...editingProduct,
                          image_url: e.target.value,
                        })
                      : setNewProduct({
                            ...newProduct,
                            image_url: e.target.value,
                        })
                  }
                  placeholder="https://..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-2">
                  Enlace de Afiliado / Link del Producto
                </label>
                <input
                  type="text"
                  value={
                    editingProduct
                      ? editingProduct.affiliate_link
                      : newProduct.affiliate_link
                  }
                  onChange={(e) =>
                    editingProduct
                      ? setEditingProduct({
                          ...editingProduct,
                          affiliate_link: e.target.value,
                        })
                      : setNewProduct({
                            ...newProduct,
                            affiliate_link: e.target.value,
                        })
                  }
                  placeholder="https://..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={
                    editingProduct ? editingProduct.active : newProduct.active
                  }
                  onChange={(e) =>
                    editingProduct
                      ? setEditingProduct({
                          ...editingProduct,
                          active: e.target.checked,
                        })
                      : setNewProduct({
                            ...newProduct,
                            active: e.target.checked,
                        })
                  }
                  className="w-5 h-5 mr-3 accent-purple-500"
                />
                <label className="text-gray-700 font-bold">
                  Activo (visible en carrusel)
                </label>
              </div>
              <button
                onClick={() => {
                  if (editingProduct) {
                    const cleanUpdates = { ...editingProduct };
                    const idKeys = [
                      'id',
                      '_id',
                      'product_id',
                      'offer_id',
                      'Id',
                      'ID',
                      'uuid',
                      'created_at',
                    ];
                    idKeys.forEach((k) => delete cleanUpdates[k]);
                    handleUpdateProduct(editingProduct, cleanUpdates);
                  } else {
                    handleCreateProduct();
                  }
                }}
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-3 rounded-lg font-bold hover:shadow-lg transition-all"
              >
                {editingProduct ? 'Actualizar Producto' : 'Crear Producto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
