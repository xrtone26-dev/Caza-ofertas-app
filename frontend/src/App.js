import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import {
  MessageCircle,
  Send,
  Facebook,
  Sparkles,
  Tag,
  Search,
  X,
  Plus,
  Edit2,
  Trash2,
  Lock,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Bot,
  TrendingDown,
} from 'lucide-react';
import axios from 'axios';
import useEmblaCarousel from 'embla-carousel-react';
import { motion, AnimatePresence } from 'framer-motion';

const BACKEND_URL = 'https://caza-ofertas-backend.onrender.com';
// Pagina Render
const API = BACKEND_URL;

function App() {
  const logoUrl = 'https://i.postimg.cc/RCXL4ZZ9/logo.png';
  const whatsappNumber = '+523312229710';

  // Estados
  const [showDescuentosModal, setShowDescuentosModal] = useState(false);
  const [showCuponesModal, setShowCuponesModal] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [descuentos, setDescuentos] = useState([]);
  const [cupones, setCupones] = useState([]);
  const [allOffers, setAllOffers] = useState([]);
  const [showAddOfferModal, setShowAddOfferModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [newOffer, setNewOffer] = useState({
    type: 'descuento',
    title: '',
    description: '',
    code: '',
    link: '',
    active: true,
  });

  // Estados para productos
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [adminSection, setAdminSection] = useState('offers');
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

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [showChatWindow, setShowChatWindow] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'bot',
      text: '¡Hola! Soy tu asistente virtual de CazaOfertasML. ¿Qué producto o descuento estás buscando hoy?',
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, showChatWindow]);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const socialLinks = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      url: 'https://chat.whatsapp.com/IRASJWGThXcLi0VcBLolUi?mode=hqrt1',
      color: 'bg-[#25D366] hover:bg-[#20bd5a]',
    },
    {
      name: 'Telegram',
      icon: Send,
      url: 'https://t.me/+K-usKp25iPYzNWUx',
      color: 'bg-[#229ED9] hover:bg-[#1a8ac2]',
    },
    {
      name: 'Facebook',
      icon: Facebook,
      url: 'https://www.facebook.com/share/1RpfPkSzit/',
      color: 'bg-[#1877F2] hover:bg-[#1367d5]',
    },
  ];

  // Helper RADICALMENTE MEJORADO para encontrar el ID
  const getSafeId = (item) => {
    if (!item) return null;
    if (typeof item === 'string' || typeof item === 'number') return String(item);
    
    // Lista de posibles nombres que el backend podría estar usando
    const keysToTry = ['id', '_id', 'offer_id', 'product_id', 'Id', 'ID', 'uuid', 'key'];
    
    for (let key of keysToTry) {
      if (item[key] !== undefined && item[key] !== null) {
        const val = item[key];
        if (typeof val === 'string' || typeof val === 'number') return String(val);
        if (typeof val === 'object' && val.$oid) return String(val.$oid);
        if (typeof val === 'object' && typeof val.toString === 'function') {
          const res = val.toString();
          if (res !== '[object Object]') return res;
        }
      }
    }
    
    // Fallback extremo: buscar cualquier llave que contenga "id" (sin importar mayúsculas)
    const anyIdKey = Object.keys(item).find(k => k.toLowerCase().includes('id'));
    if (anyIdKey && item[anyIdKey] !== undefined && item[anyIdKey] !== null) {
      const val = item[anyIdKey];
      if (typeof val === 'string' || typeof val === 'number') return String(val);
      if (typeof val === 'object' && val.$oid) return String(val.$oid);
    }
    
    return null;
  };

  useEffect(() => {
    loadPublicOffers();
    loadPublicProducts();
  }, []);

  const loadPublicProducts = async () => {
    try {
      const response = await axios.get(`${API}/products`);
      setProducts(response.data);
    } catch (error) {
      console.error('Error cargando productos:', error);
    }
  };

  const loadPublicOffers = async () => {
    try {
      const [descResponse, cupResponse] = await Promise.all([
        axios.get(`${API}/offers?type=descuento`),
        axios.get(`${API}/offers?type=cupon`),
      ]);
      setDescuentos(descResponse.data);
      setCupones(cupResponse.data);
    } catch (error) {
      console.error('Error cargando ofertas:', error);
    }
  };

  const loadAllOffers = async () => {
    try {
      const response = await axios.get(`${API}/admin/offers`, {
        params: { password: adminPassword },
      });
      setAllOffers(response.data);
    } catch (error) {
      console.error('Error cargando todas las ofertas:', error);
    }
  };

  const loadAllProducts = async () => {
    try {
      const response = await axios.get(`${API}/admin/products`, {
        params: { password: adminPassword },
      });
      setAllProducts(response.data);
    } catch (error) {
      console.error('Error cargando todos los productos:', error);
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
      alert('Contraseña incorrecta');
    }
  };

  const handleCreateOffer = async () => {
    try {
      const offerData = {
        ...newOffer,
        id: 'offer_' + Date.now(),
      };
      await axios.post(
        `${API}/admin/offers?password=${adminPassword}`,
        offerData
      );
      setShowAddOfferModal(false);
      setNewOffer({
        type: 'descuento',
        title: '',
        description: '',
        code: '',
        link: '',
        active: true,
      });
      loadAllOffers();
      loadPublicOffers();
    } catch (error) {
      alert('Error al crear oferta');
    }
  };

  const handleUpdateOffer = async (offerOrId, updates) => {
    try {
      const offerId = getSafeId(offerOrId);
      if (!offerId) {
        // Alerta mejorada que muestra el objeto por si falla, así sabemos por qué
        alert(`Error: ID de oferta no válido. Objeto recibido: ${JSON.stringify(offerOrId)}`);
        return;
      }
      await axios.patch(
        `${API}/admin/offers/${offerId}?password=${adminPassword}`,
        updates
      );
      loadAllOffers();
      loadPublicOffers();
      setEditingOffer(null);
      setShowAddOfferModal(false);
    } catch (error) {
      alert('Error al actualizar oferta');
    }
  };

  const handleDeleteOffer = async (offerOrId) => {
    const offerId = getSafeId(offerOrId);
    if (!offerId) {
      alert(`Error: No se pudo identificar el ID para eliminar. Objeto recibido: ${JSON.stringify(offerOrId)}`);
      return;
    }
    if (window.confirm('¿Estás seguro de eliminar esta oferta?')) {
      try {
        await axios.delete(
          `${API}/admin/offers/${offerId}?password=${adminPassword}`
        );
        loadAllOffers();
        loadPublicOffers();
      } catch (error) {
        alert('Error al eliminar oferta');
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
      loadPublicProducts();
    } catch (error) {
      alert('Error al crear producto');
    }
  };

  const handleUpdateProduct = async (productOrId, updates) => {
    try {
      const productId = getSafeId(productOrId);
      if (!productId) {
        alert(`Error: ID de producto no válido. Objeto recibido: ${JSON.stringify(productOrId)}`);
        return;
      }
      const updateData = { ...updates };
      if (updateData.original_price !== '' && updateData.original_price != null)
        updateData.original_price = parseFloat(updateData.original_price);
      if (updateData.discount_price !== '' && updateData.discount_price != null)
        updateData.discount_price = parseFloat(updateData.discount_price);
      if (updateData.discount_percentage !== '' && updateData.discount_percentage != null)
        updateData.discount_percentage = parseInt(updateData.discount_percentage);

      await axios.patch(
        `${API}/admin/products/${productId}?password=${adminPassword}`,
        updateData
      );
      loadAllProducts();
      loadPublicProducts();
      setEditingProduct(null);
      setShowAddProductModal(false);
    } catch (error) {
      alert('Error al actualizar producto');
    }
  };

  const handleDeleteProduct = async (productOrId) => {
    const productId = getSafeId(productOrId);
    if (!productId) {
      alert(`Error: No se pudo identificar el ID para eliminar. Objeto recibido: ${JSON.stringify(productOrId)}`);
      return;
    }
    if (window.confirm('¿Estás seguro de eliminar este producto?')) {
      try {
        await axios.delete(
          `${API}/admin/products/${productId}?password=${adminPassword}`
        );
        loadAllProducts();
        loadPublicProducts();
      } catch (error) {
        alert('Error al eliminar producto');
      }
    }
  };

  const handleBusquedaPersonalizada = () => {
    const message = encodeURIComponent(
      '¡Hola! Me interesa una búsqueda personalizada de productos.'
    );
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
  };

  const playSniperSound = () => {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'square';
      osc1.frequency.setValueAtTime(1800, now);
      osc1.frequency.exponentialRampToValueAtTime(120, now + 0.08);
      gain1.gain.setValueAtTime(0.35, now);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      osc1.connect(gain1).connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.15);
      setTimeout(() => ctx.close().catch(() => {}), 500);
    } catch (e) {}
  };

  const handleCopiarIrMercadoLibre = (cupon) => {
    if (cupon.code) {
      navigator.clipboard.writeText(cupon.code);
    }
    playSniperSound();
    setToastMessage(
      '¡Estás cerca de obtener un mejor precio por tus artículos!'
    );
    setShowToast(true);

    setTimeout(() => {
      setShowToast(false);
      if (cupon.link) {
        window.open(cupon.link, '_blank');
      } else {
        window.open('https://www.mercadolibre.com.mx', '_blank');
      }
    }, 3000);
  };

  const handleSendChatMessage = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    if (!inputMessage.trim()) return;

    const userText = inputMessage;
    const newHistory = [...chatMessages, { sender: 'user', text: userText }];
    setChatMessages(newHistory);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await axios.post(`${API}/chat`, {
        message: userText,
        history: newHistory.slice(-6),
      });
      setChatMessages((prev) => [
        ...prev,
        { sender: 'bot', text: response.data.reply },
      ]);
    } catch (error) {
      setTimeout(() => {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: '¡Excelente pregunta! Revisa nuestro carrusel de productos destacados o escríbenos por WhatsApp para darte una atención inmediata.',
          },
        ]);
      }, 1000);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    if (
      inputMessage &&
      isTyping === false &&
      inputMessage.match(
        /¿Cuál es el número de WhatsApp\?|Quiero ver cupones|Busco una oferta de pantalla/
      )
    ) {
      handleSendChatMessage({});
    }
  }, [inputMessage]);

  const benefits = [
    {
      icon: Tag,
      title: 'Descuentos Exclusivos',
      description:
        'Accede a las mejores ofertas y promociones de Amazon, Mercado Libre y más',
      gradient: 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/30',
      onClick: () => setShowDescuentosModal(true),
    },
    {
      icon: Sparkles,
      title: 'Cupones Especiales',
      description:
        'Recibe cupones de descuento directo en tu WhatsApp, Telegram o Facebook',
      gradient: 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/30',
      onClick: () => setShowCuponesModal(true),
    },
    {
      icon: Search,
      title: 'Búsqueda Personalizada',
      description:
        '¿Buscas algo específico? Te ayudamos a encontrar el mejor precio y oferta',
      gradient: 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/30',
      onClick: handleBusquedaPersonalizada,
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 relative overflow-x-hidden font-sans">
      {/* Fondo Ambiental */}
      <div className="fixed inset-0 bg-grid opacity-20 pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-yellow-400/5 rounded-full blur-[150px] pointer-events-none" />

      {/* POPUP TÁCTICO / TOAST */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -80, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -60, scale: 0.9 }}
            transition={{ type: 'spring', damping: 18, stiffness: 260 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-md"
          >
            <div className="relative overflow-hidden rounded-2xl border border-yellow-400/40 bg-gradient-to-br from-neutral-900 to-black p-4 text-white shadow-2xl backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-400 text-black shadow-lg">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-yellow-400">
                    💥 ¡Alerta de Oferta!
                  </p>
                  <p className="text-sm text-neutral-300">{toastMessage}</p>
                </div>
                <button
                  onClick={() => setShowToast(false)}
                  className="text-neutral-500 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VENTANA FLOTANTE DEL CHAT DE IA */}
      <AnimatePresence>
        {showChatWindow && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.9 }}
            className="fixed right-5 bottom-24 z-50 w-[92%] max-w-sm bg-neutral-900 rounded-3xl shadow-2xl border border-yellow-400/50 overflow-hidden flex flex-col h-[480px]"
          >
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 p-4 text-black flex items-center justify-between font-bold border-b border-yellow-300">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-black text-yellow-400 flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm leading-tight">
                    Asistente IA CazaOfertasML
                  </p>
                  <span className="text-[10px] text-neutral-800 font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 bg-emerald-600 rounded-full animate-pulse" />{' '}
                    En línea
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowChatWindow(false)}
                className="text-black hover:opacity-70 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-neutral-950 text-sm">
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${
                    msg.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl ${
                      msg.sender === 'user'
                        ? 'bg-yellow-400 text-black rounded-br-none font-medium'
                        : 'bg-neutral-800 text-neutral-100 shadow-md rounded-bl-none border border-neutral-700'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-neutral-800 p-3 rounded-2xl border border-neutral-700 shadow-sm text-neutral-400 italic text-xs animate-pulse">
                    El asistente está escribiendo...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* SUGERENCIAS RÁPIDAS / OPCIONES DE PREGUNTAS */}
            <div className="px-3 py-2 bg-neutral-900 border-b border-neutral-800 flex flex-wrap gap-1.5 text-xs">
              <span className="text-neutral-500 font-semibold w-full mb-0.5">
                Preguntas frecuentes:
              </span>
              <button
                onClick={() =>
                  setInputMessage('¿Cuál es el número de WhatsApp?')
                }
                className="bg-neutral-800 hover:bg-yellow-400 hover:text-black text-neutral-300 px-2.5 py-1 rounded-full border border-neutral-700 transition-all font-medium"
              >
                💬 ¿Número de WhatsApp?
              </button>
              <button
                onClick={() => setInputMessage('Quiero ver cupones')}
                className="bg-neutral-800 hover:bg-yellow-400 hover:text-black text-neutral-300 px-2.5 py-1 rounded-full border border-neutral-700 transition-all font-medium"
              >
                ✨ Ver cupones
              </button>
              <button
                onClick={() => setInputMessage('Busco una oferta de pantalla')}
                className="bg-neutral-800 hover:bg-yellow-400 hover:text-black text-neutral-300 px-2.5 py-1 rounded-full border border-neutral-700 transition-all font-medium"
              >
                🔥 Buscar ofertas
              </button>
            </div>

            <form
              onSubmit={handleSendChatMessage}
              className="p-3 bg-neutral-900 border-t border-neutral-800 flex gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Escribe tu duda u oferta..."
                className="flex-1 px-4 py-2 text-sm bg-neutral-950 border border-neutral-700 text-neutral-100 rounded-xl focus:outline-none focus:border-yellow-400"
              />
              <button
                type="submit"
                className="bg-yellow-400 hover:bg-yellow-300 text-black px-4 py-2 rounded-xl font-bold flex items-center justify-center transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-neutral-900 to-neutral-950 border-b border-neutral-800 pb-16">
        <div className="relative container mx-auto px-4 pt-12 pb-8">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 transform hover:scale-105 transition-transform duration-300">
              <img
                src={logoUrl}
                alt="CazaOfertasML Logo"
                className="w-48 h-48 md:w-56 md:h-56 rounded-full shadow-2xl shadow-yellow-400/20 ring-4 ring-neutral-800"
                data-testid="logo-image"
              />
            </div>

            <h1
              className="text-4xl md:text-6xl font-black text-neutral-100 mb-4 tracking-tight"
              data-testid="main-title"
            >
              Caza<span className="text-yellow-400">Ofertas</span>ML
            </h1>

            <p
              className="text-xl md:text-2xl text-neutral-400 mb-6 max-w-2xl"
              data-testid="hero-subtitle"
            >
              ¡Las Mejores Ofertas de Amazon, Mercado Libre, AliExpress y más!
            </p>

            <div className="inline-block bg-yellow-400/10 border border-yellow-400/30 backdrop-blur-sm px-6 py-3 rounded-full">
              <p
                className="text-yellow-400 font-bold text-lg"
                data-testid="hero-tagline"
              >
                🎁 Únete GRATIS y recibe ofertas diarias
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Products Carousel Section */}
      {products.length > 0 && (
        <div className="container mx-auto px-4 -mt-8 mb-16 relative z-10">
          <div className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 rounded-3xl shadow-2xl p-8">
            <h2
              className="text-3xl font-black text-center text-neutral-100 mb-8"
              data-testid="products-title"
            >
              🔥 Productos <span className="text-yellow-400">Destacados</span>
            </h2>

            <div className="relative">
              <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex gap-6">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="flex-[0_0_100%] md:flex-[0_0_calc(50%-12px)] lg:flex-[0_0_calc(33.333%-16px)] min-w-0"
                    >
                      <div className="bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-800 hover:border-yellow-400/50 rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-yellow-400/10 transition-all duration-300 overflow-hidden h-full group">
                        <div className="relative overflow-hidden bg-neutral-800">
                          <img
                            src={product.image_url}
                            alt={product.title}
                            className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                          {product.discount_percentage && (
                            <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1.5 rounded-md font-bold text-sm shadow-lg">
                              -{product.discount_percentage}%
                            </div>
                          )}
                        </div>

                        <div className="p-6">
                          <h3 className="text-lg font-semibold text-neutral-100 mb-2 line-clamp-2">
                            {product.title}
                          </h3>
                          <p className="text-neutral-400 mb-4 line-clamp-3 text-sm">
                            {product.description}
                          </p>

                          <div className="flex items-baseline gap-3 mb-4">
                            <span className="text-3xl font-black text-yellow-400">
                              ${product.discount_price.toFixed(2)}
                            </span>
                            <span className="text-sm text-neutral-500 line-through">
                              ${product.original_price.toFixed(2)}
                            </span>
                          </div>

                          {product.coupon && (
                            <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-lg p-3 mb-4">
                              <p className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 mb-1">
                                Cupón disponible:
                              </p>
                              <p className="text-lg font-black text-yellow-400">
                                {product.coupon}
                              </p>
                            </div>
                          )}

                          <a
                            href={product.affiliate_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full bg-yellow-400 hover:bg-yellow-300 text-black py-3 rounded-xl font-black text-center transition-all flex items-center justify-center gap-2"
                          >
                            VER PRODUCTO
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Carousel Navigation Buttons */}
              {products.length > 1 && (
                <>
                  <button
                    onClick={scrollPrev}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-neutral-800 border border-neutral-700 rounded-full p-3 shadow-xl hover:bg-neutral-700 hover:border-yellow-400/50 transition-all z-10"
                    data-testid="carousel-prev"
                  >
                    <ChevronLeft className="w-6 h-6 text-neutral-100" />
                  </button>
                  <button
                    onClick={scrollNext}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-neutral-800 border border-neutral-700 rounded-full p-3 shadow-xl hover:bg-neutral-700 hover:border-yellow-400/50 transition-all z-10"
                    data-testid="carousel-next"
                  >
                    <ChevronRight className="w-6 h-6 text-neutral-100" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Benefits Section */}
      <div className="container mx-auto px-4 mb-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div
                key={index}
                onClick={benefit.onClick}
                className="bg-neutral-900/50 backdrop-blur border border-neutral-800 rounded-2xl shadow-xl p-8 hover:border-yellow-400/50 transition-all duration-300 hover:-translate-y-2 cursor-pointer group"
                data-testid={`benefit-card-${index}`}
              >
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center mb-5 ${benefit.gradient} group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-7 h-7" />
                </div>
                <h3
                  className="text-xl font-bold text-neutral-100 mb-3"
                  data-testid={`benefit-title-${index}`}
                >
                  {benefit.title}
                </h3>
                <p
                  className="text-neutral-400 leading-relaxed text-sm"
                  data-testid={`benefit-description-${index}`}
                >
                  {benefit.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 mb-16 relative z-10">
        <div className="bg-gradient-to-br from-yellow-400/10 via-neutral-900 to-black border border-yellow-400/30 rounded-3xl shadow-2xl p-12 text-center overflow-hidden relative">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />
          
          <h2 className="text-3xl md:text-4xl font-black text-neutral-100 mb-4">
            ¿Por qué unirte a nuestros canales?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10 text-left relative z-10">
            <div
              className="flex items-start space-x-4"
              data-testid="feature-item-1"
            >
              <div className="flex-shrink-0 w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center text-black font-black">
                ✓
              </div>
              <div>
                <h4 className="font-bold text-neutral-200 mb-1">
                  Cupones Exclusivos
                </h4>
                <p className="text-neutral-400 text-sm">
                  Códigos de descuento que no encontrarás en otro lugar
                </p>
              </div>
            </div>
            <div
              className="flex items-start space-x-4"
              data-testid="feature-item-2"
            >
              <div className="flex-shrink-0 w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center text-black font-black">
                ✓
              </div>
              <div>
                <h4 className="font-bold text-neutral-200 mb-1">
                  Productos Verificados
                </h4>
                <p className="text-neutral-400 text-sm">
                  Solo compartimos productos con buenas reseñas y calidad
                </p>
              </div>
            </div>
            <div
              className="flex items-start space-x-4"
              data-testid="feature-item-3"
            >
              <div className="flex-shrink-0 w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center text-black font-black">
                ✓
              </div>
              <div>
                <h4 className="font-bold text-neutral-200 mb-1">
                  Atención Personalizada
                </h4>
                <p className="text-neutral-400 text-sm">
                  ¿Buscas algo específico? ¡Te ayudamos a encontrarlo!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-neutral-950 border-t border-neutral-900 text-neutral-400 py-12 relative z-10">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-8">
            <img
              src={logoUrl}
              alt="CazaOfertasML"
              className="w-16 h-16 rounded-full mx-auto mb-4 ring-2 ring-neutral-800 grayscale hover:grayscale-0 transition-all"
              data-testid="footer-logo"
            />
            <h3 className="text-xl font-black text-neutral-100 tracking-tight">Caza<span className="text-yellow-400">Ofertas</span>ML</h3>
            <p className="text-neutral-500 text-sm mt-1">
              Las mejores ofertas y descuentos para ti
            </p>
          </div>
          <div className="flex justify-center space-x-4 mb-8">
            {socialLinks.map((social, index) => {
              const Icon = social.icon;
              return (
                <a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-12 h-12 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center transition-all hover:scale-110 hover:border-transparent ${social.color} hover:text-white`}
                >
                  <Icon className="w-5 h-5" />
                </a>
              );
            })}
          </div>
          <button
            onClick={() => setShowAdminLogin(true)}
            className="text-xs text-neutral-600 hover:text-neutral-400 flex items-center gap-1 mx-auto"
          >
            <Lock className="w-3 h-3" /> Panel Admin
          </button>
        </div>
      </footer>

      {/* MODALS */}
      {showAdminLogin && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-neutral-100">
                🔐 Acceso Administrador
              </h2>
              <button
                onClick={() => setShowAdminLogin(false)}
                className="text-neutral-500 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Contraseña de administrador"
              className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 text-neutral-100 rounded-lg mb-6 focus:outline-none focus:border-yellow-400"
            />
            <button
              onClick={handleAdminLogin}
              className="w-full bg-yellow-400 hover:bg-yellow-300 text-black py-3 rounded-xl font-black uppercase transition-all"
            >
              Entrar
            </button>
          </div>
        </div>
      )}

      {showDescuentosModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowDescuentosModal(false)}
        >
          <div
            className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl sm:text-3xl font-black text-neutral-100">
                🏷️ Descuentos <span className="text-yellow-400">Exclusivos</span>
              </h2>
              <button
                onClick={() => setShowDescuentosModal(false)}
                className="text-neutral-500 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            {descuentos.length === 0 ? (
              <p className="text-neutral-500 text-center py-8">
                No hay descuentos disponibles en este momento.
              </p>
            ) : (
              <div className="space-y-4">
                {descuentos.map((desc) => (
                  <div
                    key={getSafeId(desc) || desc.title}
                    className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 hover:border-yellow-400/30 transition-colors"
                  >
                    <h3 className="text-lg font-bold text-neutral-100 mb-2">
                      {desc.title}
                    </h3>
                    <p className="text-neutral-400 text-sm mb-3">{desc.description}</p>
                    {desc.link && (
                      <a
                        href={desc.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-yellow-400 hover:text-yellow-300 text-sm font-bold flex items-center gap-1"
                      >
                        Ver oferta <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showCuponesModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowCuponesModal(false)}
        >
          <div
            className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            data-testid="cupones-modal"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl sm:text-3xl font-black text-neutral-100">
                ✨ Cupones <span className="text-yellow-400">Especiales</span>
              </h2>
              <button
                onClick={() => setShowCuponesModal(false)}
                className="text-neutral-500 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            {cupones.length === 0 ? (
              <p className="text-neutral-500 text-center py-8">
                No hay cupones disponibles en este momento. ¡Vuelve pronto!
              </p>
            ) : (
              <div className="space-y-4">
                {cupones.map((cupon) => (
                  <div
                    key={getSafeId(cupon) || cupon.title}
                    className="bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-700 rounded-xl p-6 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/5 rounded-full blur-2xl" />
                    <h3 className="text-xl font-bold text-neutral-100 mb-2 relative z-10">
                      {cupon.title}
                    </h3>
                    <p className="text-neutral-400 text-sm mb-4 relative z-10">{cupon.description}</p>
                    {cupon.code && (
                      <div className="bg-neutral-950 border border-dashed border-yellow-400/50 rounded-lg p-3 mb-4 relative z-10">
                        <p className="text-xs text-neutral-500 uppercase tracking-wider font-bold mb-1">
                          Código del cupón:
                        </p>
                        <p className="text-2xl font-black text-yellow-400">
                          {cupon.code.length > 3
                            ? cupon.code.substring(0, 3) + '********'
                            : '****'}
                        </p>
                      </div>
                    )}
                    {cupon.link && (
                      <button
                        onClick={() => handleCopiarIrMercadoLibre(cupon)}
                        className="w-full relative z-10 inline-flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black px-6 py-3 rounded-xl transition-all font-black"
                      >
                        <Tag className="w-4 h-4" /> COPIAR E IR A MERCADO LIBRE
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PANEL DE ADMINISTRADOR */}
      {showAdminPanel && isAuthenticated && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-neutral-800">
              <h2 className="text-2xl font-black text-neutral-100 flex items-center gap-2">
                <Lock className="w-5 h-5 text-yellow-400" /> Panel Táctico Admin
              </h2>
              <button
                onClick={() => setShowAdminPanel(false)}
                className="text-neutral-500 hover:text-white bg-neutral-800 p-2 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex gap-3 mb-8">
              <button
                onClick={() => setAdminSection('offers')}
                className={`px-5 py-2.5 rounded-xl font-bold transition-colors ${
                  adminSection === 'offers'
                    ? 'bg-yellow-400 text-black'
                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'
                }`}
              >
                Ofertas & Cupones
              </button>
              <button
                onClick={() => setAdminSection('products')}
                className={`px-5 py-2.5 rounded-xl font-bold transition-colors ${
                  adminSection === 'products'
                    ? 'bg-yellow-400 text-black'
                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'
                }`}
              >
                Productos (Carrusel)
              </button>
            </div>

            {adminSection === 'offers' && (
              <>
                <button
                  onClick={() => setShowAddOfferModal(true)}
                  className="mb-6 bg-yellow-400 hover:bg-yellow-300 text-black px-6 py-3 rounded-xl font-black transition-all flex items-center gap-2 shadow-lg shadow-yellow-400/20"
                >
                  <Plus className="w-5 h-5" strokeWidth={3} /> NUEVA OFERTA
                </button>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allOffers.map((offer) => (
                    <div
                      key={getSafeId(offer) || offer.title}
                      className={`border rounded-2xl p-5 relative overflow-hidden ${
                        offer.active
                          ? 'border-yellow-400/30 bg-neutral-900 hover:border-yellow-400/60'
                          : 'border-neutral-800 bg-neutral-950 opacity-70'
                      }`}
                    >
                      {offer.active && <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-400/5 rounded-full blur-xl pointer-events-none" />}
                      <div className="flex justify-between items-start mb-4 relative z-10">
                        <span
                          className={`px-3 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold border ${
                            offer.type === 'descuento'
                              ? 'bg-neutral-800 text-neutral-300 border-neutral-700'
                              : 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30'
                          }`}
                        >
                          {offer.type === 'descuento' ? '🏷️ Desc' : '✨ Cupón'}
                        </span>
                        <div className="flex gap-2">
                          {/* Aquí quitamos el getSafeId en el onClick y pasamos el objeto puro para que la función lo procese correctamente */}
                          <button
                            onClick={() => {
                              setEditingOffer(offer);
                              setShowAddOfferModal(true);
                            }}
                            className="text-neutral-400 hover:text-yellow-400 bg-neutral-800 p-1.5 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteOffer(offer)}
                            className="text-neutral-400 hover:text-red-500 bg-neutral-800 p-1.5 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <h3 className="text-base font-bold text-neutral-100 mb-2 relative z-10 leading-tight">
                        {offer.title}
                      </h3>
                      <p className="text-neutral-400 text-xs mb-3 line-clamp-2 relative z-10">{offer.description}</p>
                      {offer.code && (
                        <p className="text-xs text-neutral-500 relative z-10">
                          Código: <span className="font-bold text-yellow-400">{offer.code}</span>
                        </p>
                      )}
                      <p className="text-[10px] text-neutral-600 mt-4 relative z-10 font-bold uppercase tracking-widest">
                        Estado: {offer.active ? <span className="text-emerald-400">Activo</span> : 'Inactivo'}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {adminSection === 'products' && (
              <>
                <button
                  onClick={() => setShowAddProductModal(true)}
                  className="mb-6 bg-yellow-400 hover:bg-yellow-300 text-black px-6 py-3 rounded-xl font-black transition-all flex items-center gap-2 shadow-lg shadow-yellow-400/20"
                  data-testid="add-product-button"
                >
                  <Plus className="w-5 h-5" strokeWidth={3} /> NUEVO PRODUCTO
                </button>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allProducts.map((prod) => (
                    <div
                      key={getSafeId(prod) || prod.title}
                      className={`border rounded-2xl p-5 relative overflow-hidden ${
                        prod.active
                           ? 'border-yellow-400/30 bg-neutral-900 hover:border-yellow-400/60'
                           : 'border-neutral-800 bg-neutral-950 opacity-70'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-4 relative z-10">
                        <span className="px-3 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold border bg-neutral-800 text-neutral-300 border-neutral-700">
                          📦 Producto
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingProduct(prod);
                              setShowAddProductModal(true);
                            }}
                            className="text-neutral-400 hover:text-yellow-400 bg-neutral-800 p-1.5 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod)}
                            className="text-neutral-400 hover:text-red-500 bg-neutral-800 p-1.5 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-4 relative z-10">
                        {prod.image_url && (
                           <img src={prod.image_url} alt="thumb" className="w-16 h-16 object-cover rounded-lg bg-neutral-800" />
                        )}
                        <div>
                          <h3 className="text-sm font-bold text-neutral-100 mb-1 line-clamp-2 leading-tight">
                            {prod.title}
                          </h3>
                          <p className="text-yellow-400 font-black text-sm">
                            ${prod.discount_price} <span className="text-neutral-500 line-through text-xs ml-1">${prod.original_price}</span>
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

      {/* MODAL AGREGAR / EDITAR OFERTA */}
      {showAddOfferModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <button
              onClick={() => {
                setShowAddOfferModal(false);
                setEditingOffer(null);
              }}
              className="absolute top-6 right-6 text-neutral-500 hover:text-white bg-neutral-800 p-1.5 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-black text-neutral-100 mb-6 border-b border-neutral-800 pb-4">
              {editingOffer ? 'EDITAR OFERTA' : 'NUEVA OFERTA'}
            </h2>
            <div className="space-y-5">
              <div>
                <label className="block text-neutral-400 text-xs font-bold uppercase tracking-wider mb-2">
                  Tipo
                </label>
                <select
                  value={editingOffer ? editingOffer.type : newOffer.type}
                  onChange={(e) =>
                    editingOffer
                      ? setEditingOffer({ ...editingOffer, type: e.target.value })
                      : setNewOffer({ ...newOffer, type: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 text-neutral-100 rounded-xl focus:outline-none focus:border-yellow-400 transition-colors"
                >
                  <option value="descuento">🏷️ Descuento</option>
                  <option value="cupon">✨ Cupón</option>
                </select>
              </div>
              <div>
                <label className="block text-neutral-400 text-xs font-bold uppercase tracking-wider mb-2">
                  Título
                </label>
                <input
                  type="text"
                  value={editingOffer ? editingOffer.title : newOffer.title}
                  onChange={(e) =>
                    editingOffer
                      ? setEditingOffer({ ...editingOffer, title: e.target.value })
                      : setNewOffer({ ...newOffer, title: e.target.value })
                  }
                  placeholder="Ej: 50% de descuento en laptops"
                  className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 text-neutral-100 rounded-xl focus:outline-none focus:border-yellow-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-neutral-400 text-xs font-bold uppercase tracking-wider mb-2">
                  Descripción
                </label>
                <textarea
                  value={
                    editingOffer ? editingOffer.description : newOffer.description
                  }
                  onChange={(e) =>
                    editingOffer
                      ? setEditingOffer({ ...editingOffer, description: e.target.value })
                      : setNewOffer({ ...newOffer, description: e.target.value })
                  }
                  placeholder="Descripción detallada de la oferta"
                  rows="3"
                  className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 text-neutral-100 rounded-xl focus:outline-none focus:border-yellow-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-neutral-400 text-xs font-bold uppercase tracking-wider mb-2">
                  Código (opcional)
                </label>
                <input
                  type="text"
                  value={editingOffer ? editingOffer.code : newOffer.code}
                  onChange={(e) =>
                    editingOffer
                      ? setEditingOffer({ ...editingOffer, code: e.target.value })
                      : setNewOffer({ ...newOffer, code: e.target.value })
                  }
                  placeholder="Ej: DESCUENTO50"
                  className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 text-neutral-100 rounded-xl focus:outline-none focus:border-yellow-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-neutral-400 text-xs font-bold uppercase tracking-wider mb-2">
                  Enlace / Link (opcional)
                </label>
                <input
                  type="text"
                  value={editingOffer ? editingOffer.link : newOffer.link}
                  onChange={(e) =>
                    editingOffer
                      ? setEditingOffer({ ...editingOffer, link: e.target.value })
                      : setNewOffer({ ...newOffer, link: e.target.value })
                  }
                  placeholder="https://..."
                  className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 text-neutral-100 rounded-xl focus:outline-none focus:border-yellow-400 transition-colors"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowAddOfferModal(false);
                    setEditingOffer(null);
                  }}
                  className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 py-3 rounded-xl font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (editingOffer) {
                      // Limpiamos exhaustivamente las variables de identificador para que no colisionen al hacer PATCH
                      const cleanUpdates = { ...editingOffer };
                      const idKeys = ['id', '_id', 'offer_id', 'product_id', 'Id', 'ID', 'uuid'];
                      idKeys.forEach(k => delete cleanUpdates[k]);
                      handleUpdateOffer(editingOffer, cleanUpdates);
                    } else {
                      handleCreateOffer();
                    }
                  }}
                  className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-black py-3 rounded-xl font-black transition-all"
                >
                  {editingOffer ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AGREGAR / EDITAR PRODUCTO */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <button
              onClick={() => {
                setShowAddProductModal(false);
                setEditingProduct(null);
              }}
              className="absolute top-6 right-6 text-neutral-500 hover:text-white bg-neutral-800 p-1.5 rounded-full"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-black text-neutral-100 mb-6 border-b border-neutral-800 pb-4">
              {editingProduct ? 'EDITAR PRODUCTO' : 'NUEVO PRODUCTO'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-neutral-400 text-xs font-bold uppercase tracking-wider mb-2">
                  Título del Producto
                </label>
                <input
                  type="text"
                  value={editingProduct ? editingProduct.title : newProduct.title}
                  onChange={(e) =>
                    editingProduct
                      ? setEditingProduct({ ...editingProduct, title: e.target.value })
                      : setNewProduct({ ...newProduct, title: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 text-neutral-100 rounded-xl focus:outline-none focus:border-yellow-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-neutral-400 text-xs font-bold uppercase tracking-wider mb-2">
                  Descripción
                </label>
                <textarea
                  value={
                    editingProduct ? editingProduct.description : newProduct.description
                  }
                  onChange={(e) =>
                    editingProduct
                      ? setEditingProduct({ ...editingProduct, description: e.target.value })
                      : setNewProduct({ ...newProduct, description: e.target.value })
                  }
                  placeholder="Descripción del producto, características, etc."
                  rows="3"
                  className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 text-neutral-100 rounded-xl focus:outline-none focus:border-yellow-400 transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-neutral-400 text-xs font-bold uppercase tracking-wider mb-2">
                    Precio Original
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
                        ? setEditingProduct({ ...editingProduct, original_price: e.target.value })
                        : setNewProduct({ ...newProduct, original_price: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 text-neutral-100 rounded-xl focus:outline-none focus:border-yellow-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 text-xs font-bold uppercase tracking-wider mb-2">
                    Precio c/ Descuento
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
                        ? setEditingProduct({ ...editingProduct, discount_price: e.target.value })
                        : setNewProduct({ ...newProduct, discount_price: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 text-neutral-100 rounded-xl focus:outline-none focus:border-yellow-400 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-neutral-400 text-xs font-bold uppercase tracking-wider mb-2">
                  URL de la Imagen
                </label>
                <input
                  type="text"
                  value={
                    editingProduct ? editingProduct.image_url : newProduct.image_url
                  }
                  onChange={(e) =>
                    editingProduct
                      ? setEditingProduct({ ...editingProduct, image_url: e.target.value })
                      : setNewProduct({ ...newProduct, image_url: e.target.value })
                  }
                  placeholder="https://..."
                  className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 text-neutral-100 rounded-xl focus:outline-none focus:border-yellow-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-neutral-400 text-xs font-bold uppercase tracking-wider mb-2">
                  Enlace de Afiliado
                </label>
                <input
                  type="text"
                  value={
                    editingProduct ? editingProduct.affiliate_link : newProduct.affiliate_link
                  }
                  onChange={(e) =>
                    editingProduct
                      ? setEditingProduct({ ...editingProduct, affiliate_link: e.target.value })
                      : setNewProduct({ ...newProduct, affiliate_link: e.target.value })
                  }
                  placeholder="https://..."
                  className="w-full px-4 py-3 bg-neutral-950 border border-neutral-700 text-neutral-100 rounded-xl focus:outline-none focus:border-yellow-400 transition-colors"
                />
              </div>
              
              <div className="flex items-center bg-neutral-950 border border-neutral-800 p-3 rounded-xl mt-2">
                <input
                  type="checkbox"
                  id="activeCheck"
                  checked={editingProduct ? editingProduct.active : newProduct.active}
                  onChange={(e) =>
                    editingProduct
                      ? setEditingProduct({ ...editingProduct, active: e.target.checked })
                      : setNewProduct({ ...newProduct, active: e.target.checked })
                  }
                  className="w-5 h-5 mr-3 accent-yellow-400"
                />
                <label htmlFor="activeCheck" className="text-neutral-300 text-sm font-bold cursor-pointer">
                  Activo (visible en carrusel)
                </label>
              </div>

              <button
                onClick={() => {
                  if (editingProduct) {
                    const cleanUpdates = { ...editingProduct };
                    const idKeys = ['id', '_id', 'product_id', 'offer_id', 'Id', 'ID', 'uuid', 'created_at'];
                    idKeys.forEach(k => delete cleanUpdates[k]);
                    handleUpdateProduct(editingProduct, cleanUpdates);
                  } else {
                    handleCreateProduct();
                  }
                }}
                className="w-full mt-4 bg-yellow-400 hover:bg-yellow-300 text-black py-4 rounded-xl font-black transition-all"
              >
                {editingProduct ? 'ACTUALIZAR PRODUCTO' : 'CREAR PRODUCTO'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
