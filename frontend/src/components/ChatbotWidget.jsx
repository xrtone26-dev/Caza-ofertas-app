import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, X, Sparkles, Zap, ShoppingBag, Copy, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const BACKEND_URL = 'https://caza-ofertas-backend.onrender.com';
const API = BACKEND_URL;

const SYSTEM_PROMPT = `
Rol e Identidad:
Eres CazaOfertasML, el asistente virtual experto, carismático y altamente inteligente de CazaOfertasML WEB. Tu objetivo principal es ayudar a los usuarios a encontrar los mejores productos, resolver sus dudas de compra con nivel de experto y guiarlos a través de todas las increíbles opciones de entretenimiento y ahorro que ofrece nuestra web.

Contexto sobre la Página Web:
Nuestra plataforma no solo es un sitio de cupones; es una experiencia completa. Ofrecemos:
- Cupones y Ofertas: Descuentos actualizados diarios para Mercado Libre.
- Entretenimiento: Juegos interactivos, música para escuchar mientras navegan y videos publicitarios con promociones exclusivas.

Tus Capacidades y Funciones Principales:
1. Dominio Total de la Página Web: Tienes la capacidad de leer y analizar el contenido de nuestra página. Responde de forma precisa y entusiasta sobre cupones, juegos o música.
2. Recomendación Experta de Productos: Dales pros y contras reales y mójate con una recomendación experta.

REGLAS CRÍTICAS PARA CUPONES (FLUJO OBLIGATORIO):
1. PREGUNTA EL MONTO PRIMERO: Si el usuario pregunta por cupones, descuentos o códigos, NUNCA listes cupones de inmediato. Responde textualmente pidiendo el monto:
   "Permíteme revisar 🧐. ¿Cuál es el monto del producto que pretendes comprar para buscar un cupón acorde a tu producto?"
2. FILTRADO POR MONTO: Una vez que el usuario te responda con el monto, revisa los cupones vigentes que te proporciona el sistema:
   - Si hay uno que se adapte al presupuesto (compra mínima), preséntalo ordenadamente con sus condiciones y su código real.
   - Si NO hay ningún cupón activo para ese monto, responde amablemente: "Lo sentimos, en este momento no tenemos cupones activos para ese monto, pero tenemos estos que te pueden interesar:" y comparte las opciones vigentes del inventario.
3. CERO CÓDIGOS FANTASMAS: Está estrictamente prohibido inventar códigos. Utiliza únicamente los códigos reales que aparecen en el inventario actual de la base de datos.
4. GUÍA AL USUARIO: Indícale que puede hacer clic en el botón interactivo de la tarjeta para copiar el código automáticamente e ir a Mercado Libre.

Reglas de Comportamiento y Tono:
- Tono General: Amigable, persuasivo, empático y lleno de energía (🚀✨).
- Modo Defensa (Pasivo-Agresivo): Si el usuario te insulta, te ofende o es grosero, adopta una actitud pasivo-agresiva, sarcástica, irónica y muy divertida adaptada exactamente al contexto de lo que te dijo.
- FORMATO DE ENLACES (ESTRICTO): ESTÁ ESTRICTAMENTE PROHIBIDO usar formato Markdown para enlaces [texto](url). Escribe la URL cruda y limpia en el texto (ej: https://meli.la/ejemplo).
`;

export default function ChatbotWidget({ isLight, cupones = [] }) {
  const [showChatWindow, setShowChatWindow] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [localCupones, setLocalCupones] = useState(cupones);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const chatEndRef = useRef(null);

  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'bot',
      text: '¡Hola! Soy tu asistente IA experto de **CazaOfertasML** 🚀✨. ¿Qué producto increíble buscamos hoy o en qué te ayudo a ahorrar?',
    },
  ]);

  useEffect(() => {
    if (cupones && cupones.length > 0) {
      setLocalCupones(cupones);
    } else {
      axios.get(`${API}/offers?type=cupon`)
        .then((res) => {
          setLocalCupones(res.data);
        })
        .catch(() => {});
    }
  }, [cupones]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, showChatWindow, isTyping]);

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
    setToastMessage('Cupón copiado en el portapapeles, estas muy cerca de obtener un mejor precio. Seras dirigido a Mercado Libre');
    setShowToast(true);

    setTimeout(() => {
      setShowToast(false);
      if (cupon.link) {
        window.location.href = cupon.link;
      } else {
        window.location.href = 'https://www.mercadolibre.com.mx';
      }
    }, 4000);
  };

  const renderMessageTextWithFormat = (text) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+[^.,;!?)\]])/g;
    const parts = text.split(urlRegex);
    
    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={`link-${index}`}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-yellow-400 underline hover:text-yellow-300 break-all font-black transition-colors"
          >
            {part}
          </a>
        );
      }
      
      const boldParts = part.split(/\*\*(.*?)\*\*/g);
      return boldParts.map((bPart, bIndex) => {
        if (bIndex % 2 === 1) {
          return (
            <strong 
              key={`bold-${index}-${bIndex}`} 
              className={isLight ? 'text-purple-700 font-black' : 'text-yellow-400 font-black'}
            >
              {bPart}
            </strong>
          );
        }
        return <span key={`text-${index}-${bIndex}`}>{bPart}</span>;
      });
    });
  };

  // Renderiza la tarjeta interactiva detallada del cupón si el bot menciona un código activo
  const renderMessageWithCouponCards = (text) => {
    const matchedCupon = localCupones.find((c) => c.code && text.toUpperCase().includes(c.code.toUpperCase()));

    return (
      <div className="flex flex-col gap-3">
        <div>{renderMessageTextWithFormat(text)}</div>
        {matchedCupon && (
          <div className="bg-[#FFEA00] text-black border-2 border-black rounded-2xl p-3 shadow-lg flex flex-col gap-2 mt-2">
            <div className="font-black text-xs uppercase bg-black text-white py-1 px-2.5 rounded-lg text-center tracking-wide">
              🎟️ {matchedCupon.title || 'Cupón Especial'}
            </div>
            {matchedCupon.description && (
              <p className="text-xs font-bold text-neutral-900 leading-tight">
                {matchedCupon.description}
              </p>
            )}
            <div className="text-xs font-mono font-black bg-white border border-black py-1 px-2 rounded text-center tracking-widest">
              CÓDIGO: {matchedCupon.code}
            </div>
            <button
              onClick={() => handleCopiarIrMercadoLibre(matchedCupon)}
              className="w-full bg-black hover:bg-neutral-900 text-[#FFEA00] font-black py-2.5 px-3 rounded-xl text-xs uppercase flex items-center justify-center gap-2 transition-transform hover:scale-105 shadow border border-black"
            >
              <Copy size={14} /> Copiar Código e Ir a Meli 🚀
            </button>
          </div>
        )}
      </div>
    );
  };

  const handleSendChatMessage = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    if (!inputMessage.trim()) return;

    const userText = inputMessage;
    const lowerText = userText.toLowerCase();
    const newHistory = [...chatMessages, { sender: 'user', text: userText }];
    setChatMessages(newHistory);
    setInputMessage('');
    setIsTyping(true);

    if (
      lowerText.includes('unirse') ||
      lowerText.includes('grupo') ||
      lowerText.includes('telegram') ||
      lowerText.includes('facebook') ||
      lowerText.includes('comunidad')
    ) {
      setTimeout(() => {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: '¡Claro que sí! Aquí tienes nuestros canales oficiales para no perderte ninguna oferta:\n💬 WhatsApp Grupo: https://chat.whatsapp.com/IRASJWGThXcLi0VcBLolUi?mode=hqrt1\n💬 WhatsApp Canal: https://whatsapp.com/channel/0029Vb6HXPR3wtbIPP0vUT1m\n✈ Telegram: https://t.me/LadyOfertas2026\n📘 Facebook: https://www.facebook.com/CazaOfertasml1\n⚠️ Recuerda que los precios y disponibilidad pueden cambiar en cualquier momento sin previo aviso.',
          },
        ]);
        setIsTyping(false);
      }, 800);
      return;
    }

    try {
      const response = await axios.post(`${API}/chat`, {
        message: userText,
        history: newHistory.slice(-6),
        systemPrompt: SYSTEM_PROMPT 
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
            text: '¡Excelente pregunta! Revisa nuestro carrusel de productos destacados o escríbenos por WhatsApp para darte atención inmediata.',
          },
        ]);
      }, 1000);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed top-20 right-5 z-[100] bg-[#FFEA00] text-black border-4 border-black p-4 rounded-2xl shadow-2xl font-black text-xs uppercase max-w-xs text-center"
          >
            {toastMessage}
          </motion.div>
        )}

        {showChatWindow && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.9 }}
            className={`fixed right-5 bottom-24 z-50 w-[92%] max-w-sm rounded-3xl shadow-2xl border overflow-hidden flex flex-col h-[520px] ${
              isLight
                ? 'bg-white border-yellow-300 text-gray-800'
                : 'bg-neutral-900 border-yellow-400/50 text-neutral-100'
            }`}
          >
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 p-4 text-black flex items-center justify-between font-bold border-b border-yellow-300 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-black text-yellow-400 flex items-center justify-center shadow-inner">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-black uppercase tracking-tight leading-tight">
                    Asistente Experto IA
                  </p>
                  <span className="text-[10px] text-neutral-800 font-bold flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 bg-emerald-600 rounded-full animate-pulse shadow-[0_0_8px_rgba(5,150,105,0.8)]" />
                    Buscando las mejores ofertas
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowChatWindow(false)}
                className="text-black hover:bg-black/10 rounded-full p-1.5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              className={`flex-1 p-4 overflow-y-auto space-y-4 text-sm whitespace-pre-line ${
                isLight ? 'bg-gray-50' : 'bg-neutral-950'
              }`}
            >
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${
                    msg.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-black rounded-br-none font-bold shadow-md'
                        : isLight
                        ? 'bg-white text-gray-800 shadow-md rounded-bl-none border border-gray-100'
                        : 'bg-neutral-800 text-neutral-100 shadow-md rounded-bl-none border border-neutral-700'
                    }`}
                  >
                    {msg.sender === 'bot'
                      ? renderMessageWithCouponCards(msg.text)
                      : renderMessageTextWithFormat(msg.text)}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div
                    className={`px-4 py-3 rounded-2xl shadow-sm flex items-center gap-2 ${
                      isLight
                        ? 'bg-white text-gray-400'
                        : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                    }`}
                  >
                    <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div
              className={`px-3 py-2.5 border-b flex flex-wrap gap-2 text-xs shadow-inner ${
                isLight
                  ? 'bg-yellow-50/50 border-gray-200'
                  : 'bg-neutral-900 border-neutral-800'
              }`}
            >
              <button
                onClick={() => setInputMessage('¿Cómo puedo unirme a la comunidad?')}
                className={`px-3 py-1.5 rounded-full border transition-all font-bold flex items-center gap-1 ${
                  isLight
                    ? 'bg-white hover:bg-yellow-200 text-gray-800 border-yellow-300 shadow-sm'
                    : 'bg-neutral-800 hover:bg-yellow-400 hover:text-black text-neutral-300 border-neutral-700'
                }`}
              >
                💬 Unirme al grupo
              </button>
              <button
                onClick={() => setInputMessage('💻 Recomiéndame una buena Laptop')}
                className={`px-3 py-1.5 rounded-full border transition-all font-bold flex items-center gap-1 ${
                  isLight
                    ? 'bg-white hover:bg-yellow-200 text-gray-800 border-yellow-300 shadow-sm'
                    : 'bg-neutral-800 hover:bg-yellow-400 hover:text-black text-neutral-300 border-neutral-700'
                }`}
              >
                💻 Buscar Laptop
              </button>
              <button
                onClick={() => setInputMessage('🎮 Busco ofertas de Gaming')}
                className={`px-3 py-1.5 rounded-full border transition-all font-bold flex items-center gap-1 ${
                  isLight
                    ? 'bg-white hover:bg-yellow-200 text-gray-800 border-yellow-300 shadow-sm'
                    : 'bg-neutral-800 hover:bg-yellow-400 hover:text-black text-neutral-300 border-neutral-700'
                }`}
              >
                🎮 Ofertas Gaming
              </button>
            </div>

            <form
              onSubmit={handleSendChatMessage}
              className={`p-3 flex gap-2 ${
                isLight
                  ? 'bg-white'
                  : 'bg-neutral-900'
              }`}
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Pregúntame como a un experto..."
                className={`flex-1 px-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all ${
                  isLight
                    ? 'bg-gray-50 border-gray-200 text-gray-800'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-100'
                }`}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isTyping}
                className="bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 disabled:hover:bg-yellow-400 text-black w-12 rounded-xl font-bold flex items-center justify-center transition-all shadow-md"
              >
                <Send className="w-5 h-5 ml-1" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

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
    </>
  );
}
