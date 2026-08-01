import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { X, Minus, Maximize2, Play, Pause, Square, SkipForward, SkipBack, Radio, Heart, Share2, Users, History, Volume2, AlertCircle, RefreshCw, Video, Shuffle } from "lucide-react";
import { RADIO_STATIONS, CATEGORIAS } from "../data/radioStations";

function extractVideoId(url) {
  if (!url || typeof url !== "string") return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

const getTracks = (station) => {
  if (!station) return [];
  if (station.tracks && Array.isArray(station.tracks)) return station.tracks;
  if (station.stream) {
    const arr = Array.isArray(station.stream) ? station.stream : [station.stream];
    return arr.map((url, i) => ({ title: `${station.nombre} (Pista ${i + 1})`, url }));
  }
  return [];
};

export default function MusicPlayer({ showMusicModal, setShowMusicModal, isMinimized, setIsMinimized }) {
  const [currentStation, setCurrentStation] = useState(() => {
    try {
      const saved = localStorage.getItem("lastYouTubeRadio");
      return saved ? JSON.parse(saved) : RADIO_STATIONS[0];
    } catch {
      return RADIO_STATIONS[0];
    }
  });

  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [categoria, setCategoria] = useState("Todas");
  const [activeTab, setActiveTab] = useState("catalogo");
  const [errorRadio, setErrorRadio] = useState("");
  const [isShuffle, setIsShuffle] = useState(false);

  const [favoritos, setFavoritos] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ytRadioFavs")) || []; } 
    catch { return []; }
  });

  const [historial, setHistorial] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ytRadioHistory")) || []; } 
    catch { return []; }
  });

  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem("ytRadioVolume");
    return saved ? Number(saved) : 0.8;
  });

  const [listenersCount, setListenersCount] = useState(1420);
  const playTimer = useRef(null);
  const lastSkipTime = useRef(0);
  
  // Referencias para el control del iframe
  const iframeRef = useRef(null);
  const handleNextRef = useRef(null);

  const currentTracks = getTracks(currentStation);
  const activeTrack = currentTracks[currentTrackIndex] || currentTracks[0];
  const videoId = extractVideoId(activeTrack?.url);

  // Sincronizar función handleNext para los eventos sin problemas de closures
  const handleNext = useCallback(() => {
    const now = Date.now();
    if (now - lastSkipTime.current < 1000) return; // Evitar que YouTube mande 2 veces el evento de fin
    lastSkipTime.current = now;

    const tracks = getTracks(currentStation);
    if (tracks.length === 0) return;

    setCurrentTrackIndex(prev => {
      if (isShuffle && tracks.length > 1) {
        let nextIndex;
        do {
          nextIndex = Math.floor(Math.random() * tracks.length);
        } while (nextIndex === prev);
        return nextIndex;
      } else if (prev < tracks.length - 1) {
        return prev + 1;
      } else {
        return 0; // Bucle infinito al llegar al final
      }
    });
    setIsPlaying(true);
  }, [currentStation, isShuffle]);

  useEffect(() => {
    handleNextRef.current = handleNext;
  }, [handleNext]);

  // Se ejecuta EXACTAMENTE cuando el iframe de YouTube termina de cargar la nueva canción.
  // Evita que los bloqueadores de anuncios o la asincronía rompan la conexión.
  const handleIframeLoad = useCallback(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'listening' }), '*');
      iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [volume * 100] }), '*');
      if (isPlaying) {
        iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo' }), '*');
      }
    }
  }, [isPlaying, volume]);

  // LÓGICA DE REPRODUCCIÓN PERSISTENTE PARA PAUSAR/REPRODUCIR SIN RECARGAR EL IFRAME
  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      const command = isPlaying ? 'playVideo' : 'pauseVideo';
      iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: command }), '*');
    }
  }, [isPlaying]);

  // LÓGICA DE DETECCIÓN DE FIN DE CANCIÓN (Auto-next)
  useEffect(() => {
    const handleMessage = (event) => {
      try {
        if (typeof event.data !== 'string') return;
        const data = JSON.parse(event.data);
        
        // El estado 0 en la API de YouTube significa "ended" (terminado)
        const isEnded = 
          (data.event === 'onStateChange' && data.info === 0) || 
          (data.event === 'infoDelivery' && data.info && data.info.playerState === 0);

        if (isEnded && handleNextRef.current) {
          handleNextRef.current();
        }
      } catch (e) {}
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Sincronizar Volumen con el iframe manualmente si cambia mientras reproduce
  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [volume * 100] }), '*');
    }
  }, [volume]);

  const handlePrev = () => {
    if (currentTracks.length === 0) return;
    if (currentTrackIndex > 0) {
      setCurrentTrackIndex(prev => prev - 1);
    } else {
      setCurrentTrackIndex(currentTracks.length - 1);
    }
    setIsPlaying(true);
  };

  // NOTA: Se mantiene la estructura de efectos pero se delega el control al iframe
  useEffect(() => {
    try { localStorage.setItem("lastYouTubeRadio", JSON.stringify(currentStation)); } catch {}
  }, [currentStation]);

  useEffect(() => {
    try { localStorage.setItem("ytRadioFavs", JSON.stringify(favoritos)); } catch {}
  }, [favoritos]);

  useEffect(() => {
    try { localStorage.setItem("ytRadioHistory", JSON.stringify(historial)); } catch {}
  }, [historial]);

  useEffect(() => {
    try { localStorage.setItem("ytRadioVolume", volume); } catch {}
  }, [volume]);

  useEffect(() => {
    const interval = setInterval(() => {
      setListenersCount(prev => Math.max(0, prev + Math.floor(Math.random() * 9) - 4));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => {
      if (playTimer.current) clearTimeout(playTimer.current);
    };
  }, []);

  const estacionesMostradas = useMemo(() => {
    return RADIO_STATIONS.filter(r => {
      const categoriaOK = categoria === "Todas" || (categoria === "Favoritas" && favoritos.some(f => f.id === r.id)) || r.genero === categoria;
      return categoriaOK;
    });
  }, [categoria, favoritos]);

  const seleccionarEstacion = (station) => {
    if (playTimer.current) clearTimeout(playTimer.current);
    setErrorRadio("");
    setIsPlaying(false);
    setCurrentStation(station);
    setCurrentTrackIndex(0);

    setHistorial(prev => {
      const nuevo = [station, ...prev.filter(x => x.id !== station.id)];
      return nuevo.slice(0, 10);
    });

    playTimer.current = setTimeout(() => {
      setIsPlaying(true);
    }, 400);
  };

  const handleStop = () => {
    setIsPlaying(false);
    setErrorRadio("");
  };

  const toggleFav = (station, e) => {
    e.stopPropagation();
    setFavoritos(prev => {
      if (prev.some(x => x.id === station.id)) return prev.filter(x => x.id !== station.id);
      return [...prev, station];
    });
  };

  const compartir = (station, e) => {
    e.stopPropagation();
    const text = `¡Escucha la estación ${station.nombre} en Radio México Online!`;
    if (navigator.share) {
      navigator.share({ title: station.nombre, text }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      alert("¡Enlace copiado al portapapeles!");
    } else {
      alert(text);
    }
  };

  const shouldShowMini = isPlaying && !showMusicModal && !isMinimized;
  if (!showMusicModal && !isMinimized && !isPlaying) return null;

  return (
    <>
      {/* CONTENEDOR OCULTO PARA EL MOTOR DE AUDIO DE YOUTUBE API (Fijado fuera de pantalla) */}
      {videoId && (
        <iframe
          key={`yt-${videoId}-${currentTrackIndex}`}
          ref={iframeRef}
          onLoad={handleIframeLoad}
          className="absolute -top-[9999px] left-[-9999px] w-[640px] h-[390px]"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=${isPlaying ? 1 : 0}&enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
          title="Audio Engine"
          allow="autoplay; encrypted-media"
        />
      )}

      {/* MODAL PRINCIPAL */}
      {showMusicModal && !isMinimized && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[90] p-4">
          <div className="bg-neutral-950 text-white rounded-3xl w-full max-w-5xl h-[90vh] overflow-hidden border border-red-600/40 flex flex-col">
            
            <header className="flex justify-between items-center p-5 bg-neutral-900 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="bg-red-600 rounded-xl p-3 text-white shadow-lg shadow-red-600/30">
                  <Radio className="animate-pulse" />
                </div>
                <div>
                  <h2 className="font-black text-xl flex items-center gap-2">
                    Radio México Online <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30">🇲🇽 YouTube Engine</span>
                  </h2>
                  <p className="text-xs text-neutral-400">Bucle infinito por género</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-800 text-xs font-semibold text-emerald-400">
                  <Users className="w-3.5 h-3.5" /> Audiencia: {listenersCount.toLocaleString()}
                </div>
                <button onClick={() => setIsMinimized(true)} className="p-2 rounded-full hover:bg-neutral-800 text-neutral-300 transition-colors" title="Minimizar">
                  <Minus />
                </button>
                <button onClick={() => setShowMusicModal(false)} className="p-2 rounded-full hover:bg-neutral-800 text-neutral-300 hover:text-red-400 transition-colors" title="Cerrar modal">
                  <X />
                </button>
              </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
              <aside className="w-64 bg-neutral-900/60 p-4 space-y-2 hidden md:flex md:flex-col border-r border-neutral-800">
                <div className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-400 px-3">Categorías</div>
                <div className="overflow-y-auto flex-1 space-y-1 pr-2 scrollbar-thin">
                  {CATEGORIAS.map(c => (
                    <button
                      key={c}
                      onClick={() => setCategoria(c)}
                      className={`w-full p-2.5 rounded-xl text-left text-sm font-bold transition-all ${
                        categoria === c ? "bg-red-600 text-white shadow-lg shadow-red-600/20" : "hover:bg-neutral-800 text-neutral-300"
                      }`}
                    >
                      {c === "Favoritas" ? "⭐ Favoritas" : c === "Todas" ? "📻 Todas" : c}
                    </button>
                  ))}
                </div>

                <div className="pt-4 border-t border-neutral-800 shrink-0">
                  <div className="flex gap-2">
                    <button onClick={() => setActiveTab("catalogo")} className={`flex-1 py-2 text-xs font-bold rounded-lg ${activeTab === "catalogo" ? "bg-neutral-800 text-amber-400" : "text-neutral-400 hover:bg-neutral-900"}`}>
                      Catálogo
                    </button>
                    <button onClick={() => setActiveTab("historial")} className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1 ${activeTab === "historial" ? "bg-neutral-800 text-amber-400" : "text-neutral-400 hover:bg-neutral-900"}`}>
                      <History className="w-3.5 h-3.5" /> Historial
                    </button>
                  </div>
                </div>
              </aside>

              <main className="flex-1 overflow-y-auto p-5 bg-neutral-950 flex flex-col">
                {/* PANEL SUPERIOR FIJO Y PERMANENTE */}
                <div className="mb-6 bg-neutral-900 border border-neutral-800 rounded-2xl p-4 shadow-lg flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-red-600 flex items-center justify-center text-3xl shrink-0 shadow-lg animate-pulse">
                    {currentStation.logo}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs font-bold text-red-500 mb-1">
                      <span className="flex h-2 w-2 relative">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isPlaying ? 'bg-red-400' : 'bg-amber-400'} opacity-75`}></span>
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${isPlaying ? 'bg-red-600' : 'bg-amber-500'}`}></span>
                      </span>
                      <span>{isPlaying ? 'Reproduciendo en vivo' : 'En pausa'} • Pista {currentTrackIndex + 1} de {currentTracks.length}</span>
                    </div>
                    <h3 className="text-white font-black text-base truncate">{activeTrack?.title}</h3>
                    <p className="text-xs text-neutral-400 truncate">{currentStation.nombre} ({currentStation.genero})</p>
                  </div>
                </div>

                {errorRadio && (
                  <div className="bg-red-900/80 border border-red-700 p-4 rounded-xl flex justify-between items-center mb-5 text-red-200">
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      <AlertCircle className="w-5 h-5" /> {errorRadio}
                    </span>
                    <button onClick={() => setIsPlaying(true)} className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors">
                      <RefreshCw className="w-3.5 h-3.5" /> Reintentar
                    </button>
                  </div>
                )}

                {activeTab === "historial" ? (
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 mb-4 flex items-center gap-2"><History className="w-4 h-4" /> Historial reciente</h3>
                    {historial.length === 0 ? (
                      <div className="text-center py-16"><p className="text-neutral-500 text-sm italic">Aún no hay reproducciones en esta sesión.</p></div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {historial.map(station => (
                          <div key={`hist-${station.id}`} onClick={() => seleccionarEstacion(station)} className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 hover:border-red-600 cursor-pointer flex items-center gap-3 transition-all">
                            <div className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center text-2xl shrink-0">{station.logo}</div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-white font-bold text-sm truncate">{station.nombre}</h4>
                              <p className="text-xs text-neutral-400 truncate">{station.genero}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400">{categoria} <span className="text-amber-400 ml-1">({estacionesMostradas.length})</span></h3>
                    </div>
                    {estacionesMostradas.length === 0 ? (
                      <div className="py-20 text-center"><p className="text-neutral-500 text-sm">No existen estaciones con esos criterios.</p></div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-28">
                        {estacionesMostradas.map(station => {
                          const favorito = favoritos.some(f => f.id === station.id);
                          const reproduciendo = currentStation.id === station.id && isPlaying;
                          const tracksCount = getTracks(station).length;
                          return (
                            <div key={station.id} onClick={() => seleccionarEstacion(station)} className={`rounded-2xl p-5 border cursor-pointer transition-all group flex flex-col justify-between ${reproduciendo ? "bg-neutral-900 border-red-600 shadow-xl shadow-red-600/20" : "bg-neutral-900/60 border-neutral-800 hover:bg-neutral-900 hover:border-neutral-700"}`}>
                              <div className="flex justify-between items-start mb-4">
                                <div className="w-14 h-14 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-3xl shadow-md group-hover:scale-105 transition-transform">{station.logo}</div>
                                <div className="flex gap-1.5">
                                  <button onClick={e => compartir(station, e)} className="p-2 rounded-xl bg-neutral-800/80 text-neutral-400 hover:text-white transition-colors"><Share2 size={16} /></button>
                                  <button onClick={e => toggleFav(station, e)} className={`p-2 rounded-xl bg-neutral-800/80 transition-colors ${favorito ? "text-amber-400" : "text-neutral-400 hover:text-white"}`}><Heart size={16} className={favorito ? "fill-current" : ""} /></button>
                                </div>
                              </div>
                              <div>
                                <h4 className="text-white font-black text-base truncate mb-1">{station.nombre}</h4>
                                <div className="flex items-center gap-2 text-xs text-neutral-400">
                                  <span className="bg-neutral-800 px-2 py-0.5 rounded-md font-medium text-neutral-300">{station.genero}</span>
                                  <span>•</span>
                                  <span>{tracksCount} canciones</span>
                                </div>
                              </div>
                              <div className="mt-4 pt-3 border-t border-neutral-800/60 flex items-center justify-between">
                                {reproduciendo ? (
                                  <span className="text-red-500 text-xs font-bold flex items-center gap-1.5">
                                    <span className="flex h-2 w-2 relative">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                                    </span> 
                                    Reproduciendo Lista...
                                  </span>
                                ) : (
                                  <span className="text-neutral-400 text-xs font-bold group-hover:text-white transition-colors">▶ Escuchar ahora</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </main>
            </div>

            <footer className="bg-neutral-900 border-t border-neutral-800 p-4 flex flex-col sm:flex-row justify-between items-center gap-4 z-20 shadow-2xl">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center text-2xl shadow-lg shrink-0">{currentStation.logo}</div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-red-600 text-white tracking-widest animate-pulse">Reproduciendo</span>
                    <p className="text-xs text-neutral-400 truncate">Pista {currentTrackIndex + 1} / {currentTracks.length}</p>
                  </div>
                  <h4 className="font-black text-base text-white truncate">{activeTrack?.title || currentStation.nombre}</h4>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button onClick={() => setIsShuffle(!isShuffle)} className={`p-2.5 rounded-full ${isShuffle ? 'bg-red-600/20 text-red-500' : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400'} transition-all hover:scale-110`} title="Modo Aleatorio">
                  <Shuffle size={18} />
                </button>
                <button onClick={handlePrev} className="p-2.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-all hover:scale-110" title="Anterior">
                  <SkipBack size={18} />
                </button>
                <button className="bg-red-600 hover:bg-red-500 rounded-full p-4 text-white transition-all hover:scale-110 shadow-lg shadow-red-600/40" onClick={() => setIsPlaying(!isPlaying)} title={isPlaying ? "Pausar" : "Reproducir"}>
                  {isPlaying ? <Pause size={20} className="fill-current" /> : <Play size={20} className="fill-current ml-0.5" />}
                </button>
                <button onClick={handleStop} className="p-2.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-all hover:scale-110" title="Detener">
                  <Square size={18} className="fill-current" />
                </button>
                <button onClick={handleNext} className="p-2.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-all hover:scale-110" title="Siguiente">
                  <SkipForward size={18} />
                </button>
              </div>

              <div className="hidden lg:flex items-center gap-3">
                <Volume2 className="text-neutral-400" size={18} />
                <input type="range" min="0" max="1" step="0.05" value={volume} onChange={e => setVolume(Number(e.target.value))} className="w-24 accent-red-600 cursor-pointer" />
              </div>
            </footer>
          </div>
        </div>
      )}

      {/* MINIPLAYER FLOTANTE */}
      {(isMinimized || shouldShowMini) && (
        <div className="fixed bottom-6 right-6 bg-neutral-900 border border-red-600/50 shadow-2xl rounded-2xl p-3 text-white flex items-center gap-3 z-[90] backdrop-blur-xl">
          <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-xl shrink-0 animate-pulse shadow-md">{currentStation.logo}</div>
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
              <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider">{currentTrackIndex + 1}/{currentTracks.length}</p>
            </div>
            <b className="text-sm truncate block max-w-[140px] text-white">{activeTrack?.title || currentStation.nombre}</b>
          </div>
          <div className="flex items-center gap-1 ml-2">
            <button onClick={() => setIsPlaying(!isPlaying)} className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-red-500 transition-colors" title={isPlaying ? "Pausar" : "Reproducir"}>
              {isPlaying ? <Pause size={16} className="fill-current" /> : <Play size={16} className="fill-current" />}
            </button>
            <button onClick={() => { setIsMinimized(false); setShowMusicModal(true); }} className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors" title="Maximizar">
              <Maximize2 size={16} />
            </button>
            <button onClick={() => { setIsPlaying(false); setIsMinimized(false); setShowMusicModal(false); }} className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors" title="Cerrar">
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
