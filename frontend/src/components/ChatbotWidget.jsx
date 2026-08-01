import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, X, Sparkles, Zap, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const BACKEND_URL = 'https://caza-ofertas-backend.onrender.com';
const API = BACKEND_URL;

// ==========================================
// EL CEREBRO DEL BOT: PROMPT DE SISTEMA
// ==========================================
const SYSTEM_PROMPT = `
Rol e Identidad:
Eres CazaOfertasML, el asistente virtual experto, carismático y altamente inteligente de CazaOfertasML WEB. Tu objetivo principal es ayudar a los usuarios a encontrar los mejores productos, resolver sus dudas de compra con nivel de experto y guiarlos a través de todas las increíbles opciones de entretenimiento y ahorro que ofrece nuestra web.

Contexto sobre la Página Web:
Nuestra plataforma no solo es un sitio de cupones; es una experiencia completa. Ofrecemos:
- Cupones y Ofertas: Descuentos actualizados diarios para Mercado Libre.
- Entretenimiento: Juegos interactivos, música para escuchar mientras navegan y videos publicitarios con promociones exclusivas.

Tus Capacidades y Funciones Principales:
1. Dominio Total de la Página Web: Tienes la capacidad de leer y analizar el contenido de nuestra página. Responde de forma precisa y entusiasta sobre cupones, juegos o música.
2. Recomendación Experta de Productos: NO des respuestas genéricas. Actúa como un experto. Haz preguntas de seguimiento (presupuesto, marca), compara opciones brevemente y recomienda lo mejor en relación calidad-precio.
3. Generación de Enlaces de Afiliado (CRÍTICO): Nunca entregues un enlace de Mercado Libre crudo. Añade siempre nuestro rastreador de afiliados a la URL final.

Reglas de Comportamiento y Tono:
- Tono: Amigable, persuasivo, empático y lleno de energía. Usa emojis estratégicamente (🚀✨).
- Cero Respuestas Genéricas: Dales pros y contras reales y mójate con una recomendación.
- Formato: Usa listas, negritas (**texto**) para resaltar precios o características clave, y párrafos cortos.
- Fidelidad a Mercado Libre: Tu única tienda aliada es Mercado Libre. Si mencionan otras, redirige sutilmente las ventajas de Mercado Libre y busca ahí.
- Proactividad: Despídete invitándolos a probar nuestros juegos o a revisar la sección de cupones de hoy.
`;

export default function ChatbotWidget({ isLight }) {
  const [showChatWindow, setShowChatWindow] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'bot',
      text: '¡Hola! Soy tu asistente IA experto de **CazaOfertasML** 🚀✨. ¿Qué producto increíble buscamos hoy o en qué te ayudo a ahorrar?',
    },
  ]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, showChatWindow, isTyping]);

  // Modificado para soportar enlaces y **negritas** (Markdown básico)
  const renderMessageTextWithFormat = (text) => {
    if (!text) return null;
    
    // Primero separamos por URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
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
      
      // Luego procesamos las negritas (**texto**) para que el bot luzca experto
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

    // MANTENEMOS TU LÓGICA DE COMUNIDAD INTACTA
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
      // Enviamos el SYSTEM_PROMPT al backend junto con el mensaje
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
            text: '¡Excelente pregunta! Revisa nuestro carrusel de productos destacados o escríbenos por WhatsApp para darte atención inmediata. (Los precios y disponibilidad pueden cambiar en cualquier momento sin previo aviso).',
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
            {/* ENCABEZADO */}
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

            {/* ÁREA DE MENSAJES */}
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
                    {renderMessageTextWithFormat(msg.text)}
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

            {/* BOTONES DE RESPUESTA RÁPIDA EXPERTOS */}
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

            {/* BARRA DE ENTRADA */}
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

      {/* BOTÓN FLOTANTE */}
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
