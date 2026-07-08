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
  // 'offers' o 'products'
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

  // Estados del sistema de francotirador / notificaciones del bot
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Estados del Chat de Inteligencia Artificial (Integrado de app1)
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

  // Embla Carousel
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
      color: 'from-green-500 to-green-600',
      hoverColor: 'hover:from-green-600 hover:to-green-700',
    },
    {
      name: 'Telegram',
      icon: Send,
      url: 'https://t.me/+K-usKp25iPYzNWUx',
      color: 'from-blue-500 to-blue-600',
      hoverColor: 'hover:from-blue-600 hover:to-blue-700',
    },
    {
      name: 'Facebook',
      icon: Facebook,
      url: 'https://www.facebook.com/share/1RpfPkSzit/',
      color: 'from-blue-600 to-indigo-600',
      hoverColor: 'hover:from-blue-700 hover:to-indigo-700',
    },
  ];

  // Cargar ofertas y productos públicos
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

  const handleUpdateOffer = async (offerId, updates) => {
    try {
      await axios.patch(
        `${API}/admin/offers/${offerId}?password=${adminPassword}`,
        updates
      );
      loadAllOffers();
      loadPublicOffers();
      setEditingOffer(null);
    } catch (error) {
      alert('Error al actualizar oferta');
    }
  };

  const handleDeleteOffer = async (offerId) => {
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

  // Funciones para productos
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

  const handleUpdateProduct = async (productId, updates) => {
    try {
      const updateData = { ...updates };
      if (updateData.original_price)
        updateData.original_price = parseFloat(updateData.original_price);
      if (updateData.discount_price)
        updateData.discount_price = parseFloat(updateData.discount_price);
      if (updateData.discount_percentage)
        updateData.discount_percentage = parseInt(
          updateData.discount_percentage
        );

      await axios.patch(
        `${API}/admin/products/${productId}?password=${adminPassword}`,
        updateData
      );
      loadAllProducts();
      loadPublicProducts();
      setEditingProduct(null);
    } catch (error) {
      alert('Error al actualizar oferta');
    }
  };

  const handleDeleteProduct = async (productId) => {
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

  // Audio sintetizado (efecto francotirador app1)
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

  // Esto permite que los botones de sugerencia rápida ejecuten el envío directo
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
      gradient: 'from-pink-500 to-rose-500',
      onClick: () => setShowDescuentosModal(true),
    },
    {
      icon: Sparkles,
      title: 'Cupones Especiales',
      description:
        'Recibe cupones de descuento directo en tu WhatsApp, Telegram or Facebook',
      gradient: 'from-purple-500 to-indigo-500',
      onClick: () => setShowCuponesModal(true),
    },
    {
      icon: Search,
      title: 'Búsqueda Personalizada',
      description:
        '¿Buscas algo específico? Te ayudamos a encontrar el mejor precio y oferta',
      gradient: 'from-cyan-500 to-blue-500',
      onClick: handleBusquedaPersonalizada,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 relative">
      {/* POPUP TÁCTICO / TOAST CON COLORES AMARILLO/ESMERALDA */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -80, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -60, scale: 0.9 }}
            transition={{ type: 'spring', damping: 18, stiffness: 260 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-md"
          >
            <div className="relative overflow-hidden rounded-2xl border border-yellow-400 bg-neutral-900/95 p-4 text-white shadow-2xl backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-500 text-black shadow-lg">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-yellow-400">
                    ¡Alerta de Oferta!
                  </p>
                  <p className="text-sm text-gray-200">{toastMessage}</p>
                </div>
                <button
                  onClick={() => setShowToast(false)}
                  className="text-gray-400 hover:text-white"
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
            className="fixed right-5 bottom-24 z-50 w-[92%] max-w-sm bg-white rounded-3xl shadow-2xl border-2 border-yellow-300 overflow-hidden flex flex-col h-[480px]"
          >
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 p-4 text-black flex items-center justify-between font-bold">
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

            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50 text-sm">
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
                        : 'bg-white text-gray-800 shadow-md rounded-bl-none border border-gray-100'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white p-3 rounded-2xl shadow-sm text-gray-400 italic text-xs animate-pulse">
                    El asistente está escribiendo...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* SUGERENCIAS RÁPIDAS / OPCIONES DE PREGUNTAS */}
            <div className="px-3 py-2 bg-yellow-50 border-b border-gray-200 flex flex-wrap gap-1.5 text-xs">
              <span className="text-gray-500 font-semibold w-full mb-0.5">
                Preguntas frecuentes:
              </span>
              <button
                onClick={() =>
                  setInputMessage('¿Cuál es el número de WhatsApp?')
                }
                className="bg-white hover:bg-yellow-200 text-gray-800 px-2.5 py-1 rounded-full border border-yellow-300 transition-all font-medium"
              >
                💬 ¿Número de WhatsApp?
              </button>
              <button
                onClick={() => setInputMessage('Quiero ver cupones')}
                className="bg-white hover:bg-yellow-200 text-gray-800 px-2.5 py-1 rounded-full border border-yellow-300 transition-all font-medium"
              >
                ✨ Ver cupones
              </button>
              <button
                onClick={() => setInputMessage('Busco una oferta de pantalla')}
                className="bg-white hover:bg-yellow-200 text-gray-800 px-2.5 py-1 rounded-full border border-yellow-300 transition-all font-medium"
              >
                🔥 Buscar ofertas
              </button>
            </div>

            <form
              onSubmit={handleSendChatMessage}
              className="p-3 bg-white border-t border-gray-200 flex gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Escribe tu duda u oferta..."
                className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:border-yellow-400"
              />
              <button
                type="submit"
                className="bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded-xl font-bold flex items-center justify-center transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 pb-16">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="absolute inset-0 bg-pattern opacity-20"></div>

        <div className="relative container mx-auto px-4 pt-12 pb-8">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 transform hover:scale-105 transition-transform duration-300">
              <img
                src={logoUrl}
                alt="CazaOfertasML Logo"
                className="w-48 h-48 md:w-56 md:h-56 rounded-full shadow-2xl ring-8 ring-white/50"
                data-testid="logo-image"
              />
            </div>

            <h1
              className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg"
              data-testid="main-title"
            >
              CazaOfertasML
            </h1>

            <p
              className="text-xl md:text-2xl text-white/90 mb-6 max-w-2xl"
              data-testid="hero-subtitle"
            >
              ¡Las Mejores Ofertas de Amazon, Mercado Libre, AliExpress y más!
            </p>

            <div className="inline-block bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full">
              <p
                className="text-white font-semibold text-lg"
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
        <div className="container mx-auto px-4 -mt-8 mb-16">
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <h2
              className="text-3xl font-bold text-center text-gray-800 mb-8"
              data-testid="products-title"
            >
              🔥 Productos Destacados
            </h2>

            <div className="relative">
              <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex gap-6">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="flex-[0_0_100%] md:flex-[0_0_calc(50%-12px)] lg:flex-[0_0_calc(33.333%-16px)] min-w-0"
                    >
                      <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden h-full">
                        <div className="relative">
                          <img
                            src={product.image_url}
                            alt={product.title}
                            className="w-full h-64 object-cover"
                          />
                          {product.discount_percentage && (
                            <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-full font-bold text-lg shadow-lg">
                              -{product.discount_percentage}%
                            </div>
                          )}
                        </div>

                        <div className="p-6">
                          <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">
                            {product.title}
                          </h3>
                          <p className="text-gray-600 mb-4 line-clamp-3 text-sm">
                            {product.description}
                          </p>

                          <div className="flex items-baseline gap-3 mb-4">
                            <span className="text-3xl font-bold text-green-600">
                              ${product.discount_price.toFixed(2)}
                            </span>
                            <span className="text-lg text-gray-500 line-through">
                              ${product.original_price.toFixed(2)}
                            </span>
                          </div>

                          {product.coupon && (
                            <div className="bg-yellow-50 border-2 border-dashed border-yellow-400 rounded-lg p-3 mb-4">
                              <p className="text-xs text-gray-600 mb-1">
                                Cupón disponible:
                              </p>
                              <p className="text-lg font-bold text-yellow-700">
                                {product.coupon}
                              </p>
                            </div>
                          )}

                          <a
                            href={product.affiliate_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 rounded-lg font-bold text-center hover:shadow-lg transition-all flex items-center justify-center gap-2"
                          >
                            Ver Producto
                            <ExternalLink className="w-5 h-5" />
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
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white rounded-full p-3 shadow-xl hover:bg-gray-100 transition-all z-10"
                    data-testid="carousel-prev"
                  >
                    <ChevronLeft className="w-6 h-6 text-gray-800" />
                  </button>
                  <button
                    onClick={scrollNext}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white rounded-full p-3 shadow-xl hover:bg-gray-100 transition-all z-10"
                    data-testid="carousel-next"
                  >
                    <ChevronRight className="w-6 h-6 text-gray-800" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Benefits Section */}
      <div className="container mx-auto px-4 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div
                key={index}
                onClick={benefit.onClick}
                className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer"
                data-testid={`benefit-card-${index}`}
              >
                <div
                  className={`w-16 h-16 rounded-xl bg-gradient-to-br ${benefit.gradient} flex items-center justify-center mb-4 shadow-lg`}
                >
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3
                  className="text-xl font-bold text-gray-800 mb-3"
                  data-testid={`benefit-title-${index}`}
                >
                  {benefit.title}
                </h3>
                <p
                  className="text-gray-600 leading-relaxed"
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
      <div className="container mx-auto px-4 mb-16">
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-3xl shadow-xl p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            ¿Por qué unirte a nuestros canales?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8 text-left">
            <div
              className="flex items-start space-x-4"
              data-testid="feature-item-1"
            >
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
                ✓
              </div>
              <div>
                <h4 className="font-bold text-gray-800 mb-1">
                  Cupones Exclusivos
                </h4>
                <p className="text-gray-600">
                  Códigos de descuento que no encontrarás en otro lugar
                </p>
              </div>
            </div>
            <div
              className="flex items-start space-x-4"
              data-testid="feature-item-2"
            >
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold">
                ✓
              </div>
              <div>
                <h4 className="font-bold text-gray-800 mb-1">
                  Productos Verificados
                </h4>
                <p className="text-gray-600">
                  Solo compartimos productos con buenas reseñas y calidad
                </p>
              </div>
            </div>
            <div
              className="flex items-start space-x-4"
              data-testid="feature-item-3"
            >
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center text-white font-bold">
                ✓
              </div>
              <div>
                <h4 className="font-bold text-gray-800 mb-1">
                  Atención Personalizada
                </h4>
                <p className="text-gray-600">
                  ¿Buscas algo específico? ¡Te ayudamos a encontrarlo!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-6">
            <img
              src={logoUrl}
              alt="CazaOfertasML"
              className="w-20 h-20 rounded-full mx-auto mb-4 ring-4 ring-white/20"
              data-testid="footer-logo"
            />
            <h3 className="text-2xl font-bold mb-2">CazaOfertasML</h3>
            <p className="text-gray-400">
              Las mejores ofertas y descuentos para ti
            </p>
          </div>
          <div className="flex justify-center space-x-6 mb-6">
            {socialLinks.map((social, index) => {
              const Icon = social.icon;
              return (
                <a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center transition-all hover:scale-110"
                >
                  <Icon className="w-6 h-6" />
                </a>
              );
            })}
          </div>
          <button
            onClick={() => setShowAdminLogin(true)}
            className="text-xs text-gray-500 hover:text-gray-400 flex items-center gap-1 mx-auto mt-4"
          >
            <Lock className="w-3 h-3" /> Panel Admin
          </button>
        </div>
      </footer>

      {showAdminLogin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                🔐 Acceso Administrador
              </h2>
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
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg mb-4 focus:outline-none focus:border-purple-500"
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

      {showDescuentosModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowDescuentosModal(false)}
        >
          <div
            className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800">
                🏷️ Descuentos Exclusivos
              </h2>
              <button
                onClick={() => setShowDescuentosModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            {descuentos.length === 0 ? (
              <p className="text-gray-600 text-center py-8">
                No hay descuentos disponibles en este momento.
              </p>
            ) : (
              <div className="space-y-4">
                {descuentos.map((desc) => (
                  <div
                    key={desc.id}
                    className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                  >
                    <h3 className="text-xl font-bold text-gray-800">
                      {desc.title}
                    </h3>
                    <p className="text-gray-600">{desc.description}</p>
                    {desc.link && (
                      <a
                        href={desc.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        Ver oferta
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
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCuponesModal(false)}
        >
          <div
            className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            data-testid="cupones-modal"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800">
                ✨ Cupones Especiales
              </h2>
              <button
                onClick={() => setShowCuponesModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            {cupones.length === 0 ? (
              <p className="text-gray-600 text-center py-8">
                No hay cupones disponibles en este momento. ¡Vuelve pronto!
              </p>
            ) : (
              <div className="space-y-4">
                {cupones.map((cupon) => (
                  <div
                    key={cupon.id}
                    className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border-2 border-purple-200"
                  >
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      {cupon.title}
                    </h3>
                    <p className="text-gray-600 mb-3">{cupon.description}</p>
                    {cupon.code && (
                      <div className="bg-white border-2 border-dashed border-purple-400 rounded-lg p-3 mb-3">
                        <p className="text-sm text-gray-600 mb-1">
                          Código del cupón:
                        </p>
                        <p className="text-2xl font-bold text-purple-600">
                          {cupon.code.length > 3
                            ? cupon.code.substring(0, 3) + '********'
                            : '****'}
                        </p>
                      </div>
                    )}
                    {cupon.link && (
                      <button
                        onClick={() => handleCopiarIrMercadoLibre(cupon)}
                        className="w-full mt-2 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all font-bold"
                      >
                        <Tag className="w-5 h-5" /> Copiar e ir a MercadoLibre
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showAdminPanel && isAuthenticated && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                🛠️ Panel de Administración
              </h2>
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
                Ofertas
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
            </div>
            {adminSection === 'offers' && (
              <>
                <button
                  onClick={() => setShowAddOfferModal(true)}
                  className="mb-6 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-3 rounded-lg font-bold hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" /> Nueva Oferta
                </button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {allOffers.map((offer) => (
                    <div
                      key={offer.id || offer._id}
                      className={`border-2 rounded-xl p-6 ${
                        offer.active
                          ? 'border-green-300 bg-green-50'
                          : 'border-gray-300 bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-bold ${
                            offer.type === 'descuento'
                              ? 'bg-pink-200 text-pink-800'
                              : 'bg-purple-200 text-purple-800'
                          }`}
                        >
                          {offer.type === 'descuento'
                            ? '🏷️ Descuento'
                            : '✨ Cupón'}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingOffer(offer);
                              setShowAddOfferModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteOffer(offer.id || offer._id)
                            }
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">
                        {offer.title}
                      </h3>
                      <p className="text-gray-600 mb-2">{offer.description}</p>
                      {offer.code && (
                        <p className="text-sm text-gray-500">
                          Código:{' '}
                          <span className="font-bold">{offer.code}</span>
                        </p>
                      )}
                      {offer.link && (
                        <p className="text-sm text-blue-600 truncate">
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
                <button
                  onClick={() => setShowAddProductModal(true)}
                  className="mb-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-lg font-bold hover:shadow-lg transition-all flex items-center gap-2"
                  data-testid="add-product-button"
                >
                  <Plus className="w-5 h-5" /> Nuevo Producto
                </button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {allProducts.map((prod) => (
                    <div
                      key={prod.id}
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
                            onClick={() => handleDeleteProduct(prod.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">
                        {prod.title}
                      </h3>
                      <p className="text-gray-600 mb-2">
                        ${prod.discount_price} / ${prod.original_price}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showAddOfferModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {editingOffer ? 'Editar Oferta' : 'Agregar Oferta'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-bold mb-2">
                  Tipo
                </label>
                <select
                  value={editingOffer ? editingOffer.type : newOffer.type}
                  onChange={(e) =>
                    editingOffer
                      ? setEditingOffer({
                          ...editingOffer,
                          type: e.target.value,
                        })
                      : setNewOffer({ ...newOffer, type: e.target.value })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                >
                  <option value="descuento">🏷️ Descuento</option>
                  <option value="cupon">✨ Cupón</option>
                </select>
              </div>
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
                  placeholder="Ej: 50% de descuento en laptops"
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
                  placeholder="Descripción detallada de la oferta"
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
                  placeholder="Ej: DESCUENTO50"
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
                    handleUpdateOffer(
                      editingOffer.id || editingOffer._id,
                      editingOffer
                    );
                  } else {
                    handleCreateOffer();
                  }
                }}
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-3 rounded-lg font-bold hover:shadow-lg transition-all"
              >
                {editingOffer ? 'Actualizar Oferta' : 'Guardar Oferta'}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
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
                  className="w-5 h-5 mr-3"
                />
                <label className="text-gray-700 font-bold">
                  Activo (visible en carrusel)
                </label>
              </div>
              <button
                onClick={() => {
                  if (editingProduct) {
                    handleUpdateProduct(editingProduct.id, editingProduct);
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

      {/* CHATBOT FLOATING ACTION BUTTON CON ESTILOS Y COLORES DE APP1 */}
      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.2, type: 'spring' }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        id="chatbot-fab"
        data-chatbot-slot="customer-service"
        onClick={() => setShowChatWindow(!showChatWindow)}
        className="fixed right-5 bottom-5 z-40 group cursor-pointer"
        aria-label="Abrir chat de atención"
      >
        <span className="absolute inset-0 rounded-full bg-yellow-400/40 blur-xl group-hover:blur-2xl transition" />
        <span className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 text-black shadow-2xl shadow-yellow-400/50 border-2 border-yellow-300">
          <Bot className="w-6 h-6" strokeWidth={2.5} />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-neutral-950" />
        </span>
      </motion.button>
    </div>
  );
}

export default App;
