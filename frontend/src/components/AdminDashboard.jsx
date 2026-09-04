// Archivo: src/components/AdminDashboard.js
import React, { useState } from 'react';
import { X, Plus, Edit2, Trash2, Video, Copy, ShoppingCart, Image as ImageIcon, Star, Lock } from 'lucide-react';
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
  
  const [showDeleteAllProductsModal, setShowDeleteAllProductsModal] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false); 

  const [showAddVideoModal, setShowAddVideoModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [videoFormTitle, setVideoFormTitle] = useState('');
  const [videoFormUrl, setVideoFormUrl] = useState('');
  const [videoFormBuyUrl, setVideoFormBuyUrl] = useState('');
  const [videoFormImageUrl, setVideoFormImageUrl] = useState('');

  const [loginMode, setLoginMode] = useState('login');
  const [recoverIdentifier, setRecoverIdentifier] = useState('');
  const [changePwData, setChangePwData] = useState({ current_password: '', new_password: '' });

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
    is_exclusive: false,
    active: true,
    installments_text: '',
    features: '',
    specs: '',
  });

  const formatCurrencyInput = (value) => {
    if (value === undefined || value === null) return '';
    const rawDigits = String(value).replace(/\D/g, '');
    if (!rawDigits) return '';
    return '$' + Number(rawDigits).toLocaleString('en-US');
  };

  const parsePrice = (value) => {
    if (value === undefined || value === null || value === '') return 0.0;
    return parseFloat(String(value).replace(/,/g, ''));
  };

  const loadAllOffers = async () => {
    try {
      const response = await axios.get(`${API}/admin/offers`, {
        params: { password: adminPassword, t: Date.now() },
      });
      setAllOffers(response.data.map(decodeCoupon));
    } catch (error) {
      console.error("--- ⚠️ Error al cargar ofertas en Admin: ---", error);
    }
  };

  const loadAllProducts = async () => {
    try {
      const response = await axios.get(`${API}/admin/products`, {
        params: { password: adminPassword, t: Date.now() },
      });
      setAllProducts(response.data);
    } catch (error) {
      console.error("--- ⚠️ Error al cargar productos en Admin: ---", error);
    }
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
      console.error("Error en login:", error);
      alert('Contraseña incorrecta');
    }
  };

  const handleRecover = async () => {
    try {
      const response = await axios.post(`${API}/admin/recover`, { identifier: recoverIdentifier });
      if (response.data.success) {
        alert('¡Bzz bzz! 🐝 Se ha enviado un correo con tu clave provisional. Revisa tu bandeja de entrada.');
        setLoginMode('login');
      }
    } catch (error) {
      alert('Usuario o correo no encontrado. ¿Seguro que eres el admin? 🥸');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API}/admin/change-password`, changePwData);
      if (response.data.success) {
        alert('¡Contraseña actualizada con éxito! A salvo de los piratas informáticos 🏴‍☠️');
        setAdminPassword(changePwData.new_password);
        setChangePwData({ current_password: '', new_password: '' });
      }
    } catch (error) {
      alert('La contraseña actual es incorrecta. 🛑');
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
      console.error("Error al crear cupón:", error);
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
      console.error("Error al actualizar cupón:", error);
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
        console.error("Error al eliminar cupón:", error);
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
        original_price: parsePrice(newProduct.original_price),
        discount_price: parsePrice(newProduct.discount_price),
        discount_percentage: newProduct.discount_percentage !== '' && newProduct.discount_percentage != null
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
        is_exclusive: false,
        active: true,
        installments_text: '',
        features: '',
        specs: '',
      });
      loadAllProducts();
      if (loadPublicProducts) loadPublicProducts();
    } catch (error) {
      console.error("Error al crear producto:", error);
      alert('Error al crear producto');
    }
  };

  const handleUpdateProduct = async (productOrId, updates) => {
    try {
      const productId = getSafeId(productOrId);
      if (!productId) return;
      const updateData = { ...updates };
      
      updateData.original_price = parsePrice(updateData.original_price);
      updateData.discount_price = parsePrice(updateData.discount_price);

      if (updateData.discount_percentage !== '' && updateData.discount_percentage != null)
        updateData.discount_percentage = parseInt(updateData.discount_percentage);
      else
        updateData.discount_percentage = null;

      await axios.patch(
        `${API}/admin/products/${productId}?password=${adminPassword}`,
        updateData
      );
      loadAllProducts();
      if (loadPublicProducts) loadPublicProducts();
      setEditingProduct(null);
      setShowAddProductModal(false);
    } catch (error) {
      console.error("Error al actualizar producto:", error);
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
        console.error("Error al eliminar producto:", error);
        alert('Error al eliminar producto');
      }
    }
  };

  const handleDeleteAllProducts = async () => {
    setIsDeletingAll(true);
    try {
      const response = await axios.delete(`${API}/admin/products`, {
        params: { password: adminPassword }
      });
      loadAllProducts();
      if (loadPublicProducts) loadPublicProducts();
      setShowDeleteAllProductsModal(false);
      alert(response.data.message || '¡Lista vaciada con éxito! Tus terminales exclusivas están a salvo.');
    } catch (error) {
      console.error("Error al vaciar productos normales:", error);
      alert('Error al vaciar la lista de productos.');
    } finally {
      setIsDeletingAll(false);
    }
  };

  const regularAdminProducts = allProducts.filter(p => !p.is_exclusive);
  const exclusiveAdminProducts = allProducts.filter(p => p.is_exclusive);

  return (
    <>
      {showAdminLogin && (
        <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-gray-800 shadow-2xl relative">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">🔐 Acceso Administrador</h2>
              <button
                onClick={() => setShowAdminLogin(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            {loginMode === 'login' ? (
              <>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Contraseña de administrador"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg mb-4 text-gray-800 focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={handleAdminLogin}
                  className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-3 rounded-lg font-bold hover:shadow-lg mb-4"
                >
                  Entrar
                </button>
                <button
                  onClick={() => setLoginMode('recover')}
                  className="w-full text-center text-sm text-purple-600 hover:text-purple-800 font-bold"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-4">Ingresa tu correo o usuario para recuperar el acceso con una clave provisional.</p>
                <input
                  type="text"
                  value={recoverIdentifier}
                  onChange={(e) => setRecoverIdentifier(e.target.value)}
                  placeholder="Correo o usuario"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg mb-4 text-gray-800 focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={handleRecover}
                  className="w-full bg-yellow-400 text-black border-2 border-black py-3 rounded-lg font-black hover:shadow-lg mb-4 hover:bg-yellow-300 transition-all"
                >
                  Recuperar Acceso
                </button>
                <button
                  onClick={() => setLoginMode('login')}
                  className="w-full text-center text-sm text-gray-600 hover:text-gray-800 font-bold"
                >
                  Volver al inicio de sesión
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {showAdminPanel && isAuthenticated && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto text-gray-800 shadow-2xl relative">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-white z-10 pb-4 border-b">
              <h2 className="text-2xl font-bold">🛠️ Panel de Administración</h2>
              <button
                onClick={() => setShowAdminPanel(false)}
                className="text-gray-500 hover:text-gray-700 bg-gray-100 p-2 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex flex-wrap gap-3 mb-6">
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
                onClick={() => setAdminSection('exclusive')}
                className={`px-4 py-2 rounded-lg font-bold flex items-center gap-1.5 ${
                  adminSection === 'exclusive'
                    ? 'bg-yellow-500 text-black'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                <Star size={18} /> Exclusivos / MP
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
              <button
                onClick={() => setAdminSection('security')}
                className={`px-4 py-2 rounded-lg font-bold flex items-center gap-1.5 ${
                  adminSection === 'security'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                <Lock size={18} /> Inicio de Sesión
              </button>
            </div>

            {adminSection === 'security' && (
              <div className="bg-gray-50 border-2 border-gray-300 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4">Cambiar Contraseña</h3>
                <p className="text-sm text-gray-600 mb-6">Cambia tu contraseña actual o provisional aquí. ¡Mantén segura la cueva del tesoro! 🐝</p>
                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-gray-700 font-bold mb-2 text-sm">Contraseña Actual / Provisional</label>
                    <input
                      type="password"
                      value={changePwData.current_password}
                      onChange={(e) => setChangePwData({ ...changePwData, current_password: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-bold mb-2 text-sm">Nueva Contraseña</label>
                    <input
                      type="password"
                      value={changePwData.new_password}
                      onChange={(e) => setChangePwData({ ...changePwData, new_password: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-sm"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-3 rounded-lg font-bold hover:shadow-lg transition-all"
                  >
                    Actualizar Contraseña
                  </button>
                </form>
              </div>
            )}

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
                            className="text-blue-600 hover:text-blue-800 bg-blue-100 p-1.5 rounded-lg"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteOffer(offer)}
                            className="text-red-600 hover:text-red-800 bg-red-100 p-1.5 rounded-lg"
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
                          <span className="font-bold text-black">{offer.code}</span>
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
                      <p className="text-xs text-gray-500 mt-2 font-semibold">
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

                  {regularAdminProducts.length > 0 && (
                    <button
                      onClick={() => setShowDeleteAllProductsModal(true)}
                      className="bg-red-100 text-red-600 hover:bg-red-200 px-4 py-3 rounded-lg font-bold transition-all flex items-center gap-2 border border-red-200"
                      title="Vaciar Lista"
                    >
                      <Trash2 className="w-5 h-5" /> Vaciar Lista
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {regularAdminProducts.map((prod) => (
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
                              setEditingProduct({
                                ...prod,
                                original_price: prod.original_price ? prod.original_price.toString() : '',
                                discount_price: prod.discount_price ? prod.discount_price.toString() : '',
                              });
                              setShowAddProductModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 bg-blue-100 p-1.5 rounded-lg"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod)}
                            className="text-red-600 hover:text-red-800 bg-red-100 p-1.5 rounded-lg"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      <h3 className="text-xl font-bold mb-2">{prod.title}</h3>
                      <p className="text-gray-600 mb-2 font-semibold">
                        ${Number(prod.discount_price).toLocaleString('en-US')} / <span className="line-through text-gray-400">${Number(prod.original_price).toLocaleString('en-US')}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {adminSection === 'exclusive' && (
              <>
                <button
                  onClick={() => {
                    setNewProduct({ ...newProduct, is_exclusive: true });
                    setShowAddProductModal(true);
                  }}
                  className="mb-6 bg-yellow-400 text-black px-6 py-3 rounded-lg font-black hover:bg-yellow-300 transition-all flex items-center gap-2 border-2 border-black"
                >
                  <Plus className="w-5 h-5" /> Nuevo Producto Exclusivo / Terminal
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {exclusiveAdminProducts.map((prod) => (
                    <div
                      key={getSafeId(prod) || prod.title}
                      className="border-2 rounded-xl p-6 border-yellow-400 bg-yellow-50/50"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-yellow-200 text-yellow-900 border border-yellow-400">
                          ⭐ Exclusivo / Mercado Pago
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingProduct({
                                ...prod,
                                original_price: prod.original_price ? prod.original_price.toString() : '',
                                discount_price: prod.discount_price ? prod.discount_price.toString() : '',
                              });
                              setShowAddProductModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 bg-blue-100 p-1.5 rounded-lg"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod)}
                            className="text-red-600 hover:text-red-800 bg-red-100 p-1.5 rounded-lg"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      <h3 className="text-xl font-bold mb-2">{prod.title}</h3>
                      <p className="text-gray-800 mb-2 font-black text-lg">
                        ${Number(prod.discount_price).toLocaleString('en-US')} <span className="line-through text-gray-400 text-sm font-medium ml-2">${Number(prod.original_price).toLocaleString('en-US')}</span>
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
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-200 text-yellow-800 border border-yellow-300">
                              🎬 Video Probado
                            </span>
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleCopyVideoLinkAdmin(video.id)}
                                className="text-yellow-600 hover:text-yellow-800 bg-yellow-100 p-1 rounded-md"
                                title="Copiar Link Único"
                              >
                                <Copy size={14} />
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
                                className="text-blue-600 hover:text-blue-800 bg-blue-100 p-1 rounded-md"
                                title="Editar"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteVideoAdmin(video.id)}
                                className="text-red-600 hover:text-red-800 bg-red-100 p-1 rounded-md"
                                title="Eliminar"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          <h4 className="font-bold text-gray-800 text-sm truncate">{video.title}</h4>
                          <p className="text-xs text-blue-600 truncate font-semibold flex items-center gap-1 mt-1">
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

      {showDeleteAllProductsModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center text-gray-800 shadow-2xl relative">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200">
              <Trash2 className={`w-8 h-8 ${isDeletingAll ? 'animate-bounce' : ''}`} />
            </div>
            <h3 className="text-2xl font-black mb-2">
              {isDeletingAll ? 'Borrando...' : '¿Vaciar Productos Normales?'}
            </h3>
            <p className="text-gray-600 mb-6 font-medium text-sm">
              {isDeletingAll 
                ? 'Por favor espera unos segundos mientras limpiamos tu inventario normal. Tus terminales exclusivas están blindadas y seguras.' 
                : `Estás a punto de eliminar TODOS los productos normales (${regularAdminProducts.length}). Tus terminales exclusivas se mantendrán intactas.`}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteAllProducts}
                disabled={isDeletingAll}
                className={`flex-1 text-white py-3 rounded-xl font-black shadow-lg transition-all ${
                  isDeletingAll ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {isDeletingAll ? 'Procesando...' : 'Sí, vaciar normales'}
              </button>
              {!isDeletingAll && (
                <button
                  onClick={() => setShowDeleteAllProductsModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-xl font-bold transition-all"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showAddVideoModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-gray-800 shadow-2xl relative">
            <button
              onClick={() => setShowAddVideoModal(false)}
              className="absolute top-6 right-6 text-gray-500 hover:text-gray-800 bg-gray-100 p-1.5 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-2xl font-bold mb-4 pr-8">
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto text-gray-800 shadow-2xl relative">
            <button
              onClick={() => {
                setShowAddOfferModal(false);
                setEditingOffer(null);
              }}
              className="absolute top-6 right-6 text-gray-500 hover:text-gray-800 bg-gray-100 p-1.5 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold mb-4 pr-8">
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
                    const rawDigits = e.target.value.replace(/\D/g, '');
                    const formatted = rawDigits ? '$' + Number(rawDigits).toLocaleString('en-US') : '';
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
                className="w-full bg-gray-200 text-gray-800 hover:bg-gray-300 py-3 rounded-lg font-bold transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddProductModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto text-gray-800 shadow-2xl relative">
            <button
              onClick={() => {
                setShowAddProductModal(false);
                setEditingProduct(null);
              }}
              className="absolute top-6 right-6 text-gray-500 hover:text-gray-800 bg-gray-100 p-1.5 rounded-full"
              aria-label="Cerrar modal"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold mb-4 pr-8">
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
                  Descripción corta (Subtítulo)
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
                  placeholder="Ej: Con chip 4G gratis, WiFi e impresión de recibos."
                  rows="2"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-sm"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-gray-700 font-bold mb-1 text-xs">
                    Precio Original ($)
                  </label>
                  <input
                    type="text"
                    value={
                      editingProduct
                        ? editingProduct.original_price
                        : newProduct.original_price
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      editingProduct
                        ? setEditingProduct({
                            ...editingProduct,
                            original_price: val,
                          })
                        : setNewProduct({
                            ...newProduct,
                            original_price: val,
                          })
                    }}
                    placeholder="4499"
                    className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1 text-xs">
                    Precio Oferta ($)
                  </label>
                  <input
                    type="text"
                    value={
                      editingProduct
                        ? editingProduct.discount_price
                        : newProduct.discount_price
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      editingProduct
                        ? setEditingProduct({
                            ...editingProduct,
                            discount_price: val,
                          })
                        : setNewProduct({
                            ...newProduct,
                            discount_price: val,
                          })
                    }}
                    placeholder="529"
                    className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1 text-xs">
                    % Descuento
                  </label>
                  <input
                    type="number"
                    value={
                      editingProduct
                        ? editingProduct.discount_percentage
                        : newProduct.discount_percentage
                    }
                    onChange={(e) =>
                      editingProduct
                        ? setEditingProduct({
                            ...editingProduct,
                            discount_percentage: e.target.value,
                          })
                        : setNewProduct({
                            ...newProduct,
                            discount_percentage: e.target.value,
                          })
                    }
                    placeholder="88"
                    className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1 text-sm">
                  Texto de Meses Sin Intereses (Ej: o 6x $88.16 sin intereses)
                </label>
                <input
                  type="text"
                  value={
                    editingProduct
                      ? editingProduct.installments_text || ''
                      : newProduct.installments_text || ''
                  }
                  onChange={(e) =>
                    editingProduct
                      ? setEditingProduct({
                          ...editingProduct,
                          installments_text: e.target.value,
                        })
                      : setNewProduct({
                          ...newProduct,
                          installments_text: e.target.value,
                        })
                  }
                  placeholder="o 6x $88.16 sin intereses"
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1 text-sm">
                  Beneficios con palomita (Un beneficio por renglón)
                </label>
                <textarea
                  value={
                    editingProduct
                      ? editingProduct.features || ''
                      : newProduct.features || ''
                  }
                  onChange={(e) =>
                    editingProduct
                      ? setEditingProduct({
                          ...editingProduct,
                          features: e.target.value,
                        })
                      : setNewProduct({
                          ...newProduct,
                          features: e.target.value,
                        })
                  }
                  placeholder={`Acepta débito, crédito y vales.\nIncluye cuenta digital y tarjeta gratuita.\n1 año de garantía.\nEnvío gratis en 2 hs.*`}
                  rows="4"
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1 text-sm">
                  Especificaciones técnicas (Un renglón por especificación)
                </label>
                <p className="text-[10px] text-gray-500 mb-2 leading-tight">No necesitas poner emojis, el sistema detectará palabras clave (Plan de datos, Recibos, Tarjetas, batería, mm, g, celular, Bluetooth) y agregará el ícono azul automáticamente.</p>
                <textarea
                  value={
                    editingProduct
                      ? editingProduct.specs || ''
                      : newProduct.specs || ''
                  }
                  onChange={(e) =>
                    editingProduct
                      ? setEditingProduct({
                          ...editingProduct,
                          specs: e.target.value,
                        })
                      : setNewProduct({
                          ...newProduct,
                          specs: e.target.value,
                        })
                  }
                  placeholder={`Plan de datos 4G gratis y Wi-Fi.\nRecibos impresos, por e-mail y SMS.\nTarjetas con chip, banda y sin contacto.\n72 horas de batería.\n175x82x62 mm.\n410 g.`}
                  rows="4"
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg text-xs font-mono"
                />
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
                      ? editingProduct.affiliate_link || editingProduct.link || editingProduct.url || ''
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
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={
                    editingProduct ? !!editingProduct.is_exclusive : newProduct.is_exclusive
                  }
                  onChange={(e) =>
                    editingProduct
                      ? setEditingProduct({
                          ...editingProduct,
                          is_exclusive: e.target.checked,
                        })
                      : setNewProduct({
                          ...newProduct,
                          is_exclusive: e.target.checked,
                        })
                  }
                  className="w-5 h-5 accent-purple-500"
                />
                <label className="text-gray-700 font-bold">
                  ⭐ Producto Exclusivo / Terminal (Diseño Tipo Mercado Pago)
                </label>
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
