import React, { useState, useEffect } from "react";
import { X, Minus, Maximize2, Music, Radio } from "lucide-react";

// Función inteligente para transformar enlaces de Spotify o YouTube en formato Embed
function getEmbedUrl(url) {
  if (!url || typeof url !== "string") {
    // Playlist Lofi por defecto si el usuario no ha puesto nada
    return "https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1";
  }

  // Si es un enlace de Spotify
  if (url.includes("spotify.com")) {
    const cleanUrl = url.split("?")[0];
    return cleanUrl.replace("spotify.com/", "spotify.com/embed/");
  }

  // Si es un enlace de YouTube (watch, youtu.be, shorts o playlist)
  let videoId = "";
  if (url.includes("shorts/")) {
    videoId = url.split("shorts/")[1]?.split("?")[0];
  } else if (url.includes("youtu.be/")) {
    videoId = url.split("youtu.be/")[1]?.split("?")[0];
  } else if (url.includes("watch?v=")) {
    videoId = url.split("watch?v=")[1]?.split("&")[0];
  } else if (url.includes("playlist?list=")) {
    const listId = url.split("playlist?list=")[1]?.split("&")[0];
    return `https://www.youtube.com/embed/videoseries?list=${listId}&autoplay=1`;
  }

  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  }

  // Si por alguna razón pegó un embed directo o no se reconoce, lo devolvemos tal cual
  return url;
}

export default function MusicPlayer({ showMusicModal, setShowMusicModal, isMinimized, setIsMinimized }) {
  const [userPlaylist, setUserPlaylist] = useState(() => {
    try {
      return localStorage.getItem("cazaPlaylist") || "";
    } catch {
      return "";
    }
  });

  // Escuchar cambios en localStorage si el usuario actualiza su perfil en tiempo real
  useEffect(() => {
    const checkPlaylist = () => {
      const saved = localStorage.getItem("cazaPlaylist") || "";
      setUserPlaylist(saved);
    };
    window.addEventListener("storage", checkPlaylist);
    const interval = setInterval(checkPlaylist, 2000); // Sincronización continua
    return () => {
      window.removeEventListener("storage", checkPlaylist);
      clearInterval(interval);
    };
  }, []);

  const embedSource = getEmbedUrl(userPlaylist);

  if (!showMusicModal && !isMinimized) return null;

  return (
    <>
      {/* MODAL PRINCIPAL DEL REPRODUCTOR */}
      {showMusicModal && !isMinimized && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[90] p-4">
          <div className="bg-neutral-950 text-white rounded-3xl w-full max-w-3xl h-[80vh] overflow-hidden border border-yellow-400/40 flex flex-col shadow-2xl">
            
            <header className="flex justify-between items-center p-5 bg-neutral-900 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="bg-yellow-400 rounded-xl p-3 text-black shadow-lg shadow-yellow-400/30">
                  <Music className="animate-bounce" />
                </div>
                <div>
                  <h2 className="font-black text-xl flex items-center gap-2">
                    Tu Música Personalizada <span className="text-xs bg-yellow-400/20 text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-400/30">🎧 DJ Mode</span>
                  </h2>
                  <p className="data-text text-xs text-neutral-400">Escucha tus rolas favoritas mientras buscas ofertas</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={() => setIsMinimized(true)} className="p-2 rounded-full hover:bg-neutral-800 text-neutral-300 transition-colors" title="Minimizar">
                  <Minus />
                </button>
                <button onClick={() => setShowMusicModal(false)} className="p-2 rounded-full hover:bg-neutral-800 text-neutral-300 hover:text-red-400 transition-colors" title="Cerrar modal">
                  <X />
                </button>
              </div>
            </header>

            {/* CONTENIDO DEL REPRODUCTOR (IFRAME LIMPIO) */}
            <div className="flex-1 bg-neutral-950 flex flex-col p-4">
              {!userPlaylist && (
                <div className="bg-yellow-400/10 border border-yellow-400/30 p-3 rounded-xl mb-4 text-xs text-yellow-300 flex items-center justify-between">
                  <span>💡 Tip: Aún no configuras tu música en tu perfil. Estamos reproduciendo Lofi por defecto. ¡Entra a tu perfil y pega tu enlace de Spotify o YouTube!</span>
                </div>
              )}
              
              <div className="flex-1 w-full h-full rounded-2xl overflow-hidden border border-neutral-800 bg-black">
                <iframe
                  src={embedSource}
                  className="w-full h-full border-0"
                  title="Music Player Frame"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>

            <footer className="bg-neutral-900 border-t border-neutral-800 p-4 text-center text-xs text-neutral-400">
              <span>CazaOfertas Music Player • Configura tu enlace en tu Perfil 🎶</span>
            </footer>
          </div>
        </div>
      )}

      {/* MINIPLAYER FLOTANTE */}
      {isMinimized && (
        <div className="fixed bottom-6 right-6 bg-neutral-900 border border-yellow-400/50 shadow-2xl rounded-2xl p-3 text-white flex items-center gap-3 z-[90] backdrop-blur-xl">
          <div className="w-10 h-10 rounded-xl bg-yellow-400 text-black flex items-center justify-center text-xl shrink-0 animate-pulse shadow-md">
            🎧
          </div>
          <div className="min-w-0 pr-2">
            <p className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider">Reproductor Activo</p>
            <b className="text-sm truncate block max-w-[140px] text-white">Tu Música Personal</b>
          </div>
          <div className="flex items-center gap-1 ml-2">
            <button onClick={() => { setIsMinimized(false); setShowMusicModal(true); }} className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors" title="Maximizar">
              <Maximize2 size={16} />
            </button>
            <button onClick={() => setIsMinimized(false)} className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors" title="Cerrar">
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
