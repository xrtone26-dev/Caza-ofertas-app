import React, { useState, useEffect } from 'react';
import { Music, X, Maximize2, Minimize2, ExternalLink, Play, Radio, CheckCircle2 } from 'lucide-react';

export default function MusicPlayer({ showMusicModal, setShowMusicModal, isLight, isMinimized, setIsMinimized }) {
  const [platform, setPlatform] = useState('spotify'); // 'spotify' o 'youtube'
  const [musicLink, setMusicLink] = useState('');
  const [savedLink, setSavedLink] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const storedLink = localStorage.getItem('cazaUserPlaylist') || localStorage.getItem('cazaPlaylist') || '';
    const storedPlatform = localStorage.getItem('cazaMusicPlatform') || 'spotify';
    const logged = localStorage.getItem('cazaMusicLogged') === 'true';
    
    setMusicLink(storedLink);
    setSavedLink(storedLink);
    setPlatform(storedPlatform);
    setIsLoggedIn(logged);
  }, [showMusicModal]);

  const handleSaveAndConnect = (e) => {
    e.preventDefault();
    setSavedLink(musicLink);
    setIsLoggedIn(true);
    localStorage.setItem('cazaUserPlaylist', musicLink);
    localStorage.setItem('cazaMusicPlatform', platform);
    localStorage.setItem('cazaMusicLogged', 'true');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setSavedLink('');
    localStorage.removeItem('cazaUserPlaylist');
    localStorage.removeItem('cazaMusicLogged');
  };

  if (!showMusicModal) return null;

  const getEmbedUrl = (url, plat) => {
    if (!url) {
      // Playlist por defecto si no hay enlace
      return plat === 'spotify' 
        ? 'https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M?utm_source=generator&theme=0'
        : 'https://www.youtube.com/embed/videoseries?list=PLw-VjHDlEOgs658kAHR_LAaILBXb-s6Qc';
    }

    if (plat === 'spotify') {
      if (url.includes('open.spotify.com')) {
        return url.replace('/track/', '/embed/track/').replace('/playlist/', '/embed/playlist/').replace('/album/', '/embed/album/');
      }
      return `https://open.spotify.com/embed/track/${url}?utm_source=generator&theme=0`;
    } else {
      let ytId = '';
      if (url.includes('shorts/')) {
        ytId = url.split('shorts/')[1]?.split('?')[0];
      } else if (url.includes('youtu.be/')) {
        ytId = url.split('youtu.be/')[1]?.split('?')[0];
      } else if (url.includes('watch?v=')) {
        ytId = url.split('watch?v=')[1]?.split('&')[0];
      } else {
        ytId = url;
      }
      return `https://www.youtube.com/embed/${ytId}?autoplay=1`;
    }
  };

  return (
    <div className={`fixed z-[95] transition-all duration-300 shadow-2xl border-4 border-black font-sans ${
      isMaximized 
        ? 'inset-4 md:inset-10 rounded-3xl bg-neutral-900 text-white' 
        : 'bottom-20 right-6 w-[92%] max-w-[380px] rounded-3xl bg-neutral-900 text-white'
    }`}>
      {/* Barra superior de la ventana emergente */}
      <div className="bg-black px-4 py-3 rounded-t-2xl flex items-center justify-between border-b-2 border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
          <span className="font-black text-xs md:text-sm uppercase tracking-wider text-yellow-400 flex items-center gap-1.5">
            <Music size={16} /> Reproductor Estelar
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => setIsMaximized(!isMaximized)} 
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
            title={isMaximized ? "Restaurar tamaño" : "Maximizar ventana"}
          >
            {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button 
            onClick={() => setShowMusicModal(false)} 
            className="p-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white transition-colors"
            title="Cerrar"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Contenido de la ventana */}
      <div className={`p-5 flex flex-col ${isMaximized ? 'h-[calc(100%-60px)]' : 'h-[360px]'}`}>
        {!isLoggedIn ? (
          <div className="flex flex-col h-full justify-center text-center">
            <h4 className="font-black text-base mb-2 text-yellow-400">Conecta tu música</h4>
            <p className="text-xs text-neutral-400 mb-4">
              Elige tu plataforma e ingresa tu enlace de Spotify o YouTube para escuchar tus canciones mientras navegas.
            </p>

            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setPlatform('spotify')}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border-2 transition-all ${
                  platform === 'spotify' ? 'bg-[#1DB954] text-black border-black font-black shadow-md' : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                }`}
              >
                <span>🟢 Spotify</span>
              </button>
              <button
                type="button"
                onClick={() => setPlatform('youtube')}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border-2 transition-all ${
                  platform === 'youtube' ? 'bg-red-600 text-white border-black font-black shadow-md' : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                }`}
              >
                <span>🔴 YouTube</span>
              </button>
            </div>

            <form onSubmit={handleSaveAndConnect} className="flex flex-col gap-3">
              <input
                type="text"
                value={musicLink}
                onChange={(e) => setMusicLink(e.target.value)}
                placeholder={platform === 'spotify' ? "Pega tu enlace de Spotify..." : "Pega tu enlace o ID de YouTube..."}
                className="w-full bg-neutral-950 border-2 border-neutral-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-yellow-400"
                required
              />
              <button
                type="submit"
                className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black py-3 rounded-xl text-xs uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_0px_rgba(255,255,255,0.2)] transition-transform hover:scale-[1.02]"
              >
                Iniciar Sesión / Escuchar 🎧
              </button>
            </form>
          </div>
        ) : (
          <div className="flex flex-col h-full gap-3">
            <div className="flex items-center justify-between bg-neutral-950 px-3 py-2 rounded-xl border border-neutral-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className={platform === 'spotify' ? 'text-[#1DB954]' : 'text-red-500'} />
                <span className="text-xs font-bold uppercase text-neutral-300">
                  Conectado a {platform === 'spotify' ? 'Spotify' : 'YouTube'}
                </span>
              </div>
              <button 
                onClick={handleLogout}
                className="text-[10px] font-bold text-red-400 hover:text-red-300 uppercase underline"
              >
                Cambiar cuenta
              </button>
            </div>

            <div className="flex-1 w-full rounded-2xl overflow-hidden bg-black border-2 border-neutral-800 relative">
              <iframe
                src={getEmbedUrl(savedLink, platform)}
                className="w-full h-full border-0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                title="Reproductor de música personalizado"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
