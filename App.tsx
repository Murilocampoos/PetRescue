
import React, { useState, useEffect, useRef } from 'react';
import { CharacterType, GameStatus, SoundSettings, Difficulty } from './types';
import GameCanvas from './components/GameCanvas';
import Leaderboard from './components/Leaderboard';
import { DOG_SPRITE, CAT_SPRITE, RABBIT_SPRITE, MAX_HEALTH, FINISHED_DOG_IMG, FINISHED_CAT_IMG, FINISHED_RABBIT_IMG } from './constants';
import { getSoundSettings, saveSoundSettings, getUnlockedLevel, saveUnlockedLevel, playShutterSound, playVictorySound, unlockPhoto, getUnlockedPhotos, downloadImage } from './utils';

const SpritePreview = ({ sprite, active, size = 5 }: { sprite: any, active?: boolean, size?: number }) => {
    return (
        <div 
          className={`relative p-3 border-4 transition-all duration-200 ${active !== undefined ? (active ? 'border-blue-500 bg-blue-900/30 scale-105' : 'border-gray-700 bg-gray-800 hover:border-gray-600') : 'border-transparent bg-transparent'}`}
        >
             <div style={{
                 width: sprite.width * size,
                 height: sprite.height * size,
                 display: 'grid',
                 gridTemplateColumns: `repeat(${sprite.width}, ${size}px)`
             }}>
                 {sprite.data.map((c: number, i: number) => (
                     <div key={i} style={{ width: size, height: size, backgroundColor: c === 0 ? 'transparent' : sprite.palette[c] }} />
                 ))}
             </div>
        </div>
    );
};

// Simple Photo Modal Component
const PhotoModal = ({ url, onClose }: { url: string, onClose: () => void }) => {
    return (
        <div className="fixed inset-0 bg-black/90 z-[80] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="relative max-w-lg w-full bg-white p-2 rounded-xl shadow-2xl transform rotate-1">
                <button 
                    onClick={onClose}
                    className="absolute -top-4 -right-4 bg-red-500 hover:bg-red-600 text-white rounded-full w-10 h-10 font-bold border-4 border-white shadow-lg z-10 flex items-center justify-center"
                >
                    ✕
                </button>
                <img src={url} alt="Memory" className="w-full h-auto rounded-lg border border-gray-200" />
                <div className="absolute bottom-4 right-4">
                     <button 
                        onClick={() => downloadImage(url)}
                        className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-full shadow-lg border-2 border-white transition-transform active:scale-95"
                        title="Baixar Foto"
                     >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256"><path d="M224,152a8,8,0,0,1,8,8v32a16,16,0,0,1-16,16H40a16,16,0,0,1-16-16V160a8,8,0,0,1,16,0v32H216V160A8,8,0,0,1,224,152Zm-82.34,45.66a8,8,0,0,0,11.32,0l48-48a8,8,0,0,0-11.32-11.32L136,192.69V40a8,8,0,0,0-16,0V192.69L66.34,138.34a8,8,0,0,0-11.32,11.32Z"></path></svg>
                     </button>
                </div>
            </div>
        </div>
    );
};

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.SPLASH);
  const [nickname, setNickname] = useState('');
  const [selectedChar, setSelectedChar] = useState<CharacterType>(CharacterType.DOG);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.NORMAL);
  const [level, setLevel] = useState(1);
  const [unlockedLevel, setUnlockedLevel] = useState(getUnlockedLevel());
  const [score, setScore] = useState(0);
  const [kibble, setKibble] = useState(0);
  const [health, setHealth] = useState(MAX_HEALTH);
  const [lastScoreUpdate, setLastScoreUpdate] = useState(0);
  
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showLeaderboardShortcut, setShowLeaderboardShortcut] = useState(false);
  const [soundSettings, setSoundSettings] = useState<SoundSettings>(getSoundSettings());
  
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([]);

  const countdownInterval = useRef<number | null>(null);

  const startGame = () => {
    if (!nickname.trim()) {
      alert("Por favor, digite um nickname!");
      return;
    }
    setStatus(GameStatus.PLAYING);
    setIsPaused(false);
    setCountdown(null);
    setScore(0);
    setKibble(0);
    setHealth(MAX_HEALTH);
  };

  const nextLevel = () => {
    const nextLvl = level + 1;
    saveUnlockedLevel(nextLvl);
    setUnlockedLevel(getUnlockedLevel());
    setLevel(nextLvl);
    setStatus(GameStatus.PLAYING);
    setIsPaused(false);
    setCountdown(null);
    setScore(0);
    setHealth(MAX_HEALTH);
  };

  const handleGameOver = () => {
    setStatus(GameStatus.GAME_OVER);
    setLastScoreUpdate(Date.now());
  };

  const handleVictory = () => {
    if (level === 3 && difficulty === Difficulty.NORMAL) {
        // Special Ending Logic: Unlock Photo
        playShutterSound();
        let photoId = '';
        let photoUrl = '';
        if (selectedChar === CharacterType.DOG) { photoId = 'DOG'; photoUrl = FINISHED_DOG_IMG; }
        else if (selectedChar === CharacterType.CAT) { photoId = 'CAT'; photoUrl = FINISHED_CAT_IMG; }
        else if (selectedChar === CharacterType.RABBIT) { photoId = 'RABBIT'; photoUrl = FINISHED_RABBIT_IMG; }
        
        if (photoId) {
            unlockPhoto(photoId);
            setViewingPhoto(photoUrl);
        }
    } else {
        // Normal victory sound
        playVictorySound();
    }

    if (level < 3) {
        saveUnlockedLevel(level + 1);
        setUnlockedLevel(getUnlockedLevel());
    } else {
        // Unlocks secret character by setting progress to 4
        saveUnlockedLevel(4);
        setUnlockedLevel(getUnlockedLevel());
    }
    setStatus(GameStatus.VICTORY);
    setLastScoreUpdate(Date.now());
  };

  const toggleSound = (type: keyof SoundSettings) => {
    const newSettings = { ...soundSettings, [type]: !soundSettings[type] };
    setSoundSettings(newSettings);
    saveSoundSettings(newSettings);
  };

  const openOptions = () => {
    if (status === GameStatus.PLAYING) setIsPaused(true);
    setIsOptionsOpen(true);
  };

  const togglePause = () => {
    if (status !== GameStatus.PLAYING || countdown !== null) return;
    if (isPaused) {
      setCountdown(3);
      countdownInterval.current = window.setInterval(() => {
        setCountdown(prev => {
          if (prev === null || prev <= 1) {
            if (countdownInterval.current) clearInterval(countdownInterval.current);
            setIsPaused(false);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setIsPaused(true);
    }
  };

  useEffect(() => {
    if (status === GameStatus.SPLASH) {
        const handleInteraction = () => setStatus(GameStatus.MENU);
        window.addEventListener('keydown', handleInteraction);
        window.addEventListener('mousedown', handleInteraction);
        window.addEventListener('touchstart', handleInteraction);
        return () => {
            window.removeEventListener('keydown', handleInteraction);
            window.removeEventListener('mousedown', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
        };
    }
    if (status === GameStatus.GALLERY || status === GameStatus.MENU) {
        setGalleryPhotos(getUnlockedPhotos());
    }
  }, [status]);

  useEffect(() => {
    return () => { if (countdownInterval.current) clearInterval(countdownInterval.current); };
  }, []);

  const getLevelName = (lvl: number) => {
    switch(lvl) {
        case 1: return 'VILA';
        case 2: return 'FAZENDA';
        case 3: return 'PRAIA';
        default: return 'CASA';
    }
  }

  const isRabbitUnlocked = unlockedLevel >= 4;

  const renderGallery = () => {
    const photos = [
        { id: 'DOG', url: FINISHED_DOG_IMG, label: 'Caramelo' },
        { id: 'CAT', url: FINISHED_CAT_IMG, label: 'Laranja' },
        { id: 'RABBIT', url: FINISHED_RABBIT_IMG, label: 'Neve' },
    ];

    return (
        <div className="absolute inset-0 bg-[#1a1c2c] flex flex-col items-center justify-center z-50 p-4 md:p-8 overflow-y-auto custom-scrollbar">
             <div className="bg-[#2d3748] p-6 md:p-8 rounded-2xl border-4 border-yellow-500 shadow-2xl max-w-2xl w-full text-center flex-shrink-0 animate-in zoom-in duration-300">
                <h2 className="text-xl md:text-3xl text-yellow-400 mb-8 font-bold tracking-tight uppercase underline decoration-yellow-600 decoration-4 underline-offset-8">GALERIA DE MEMÓRIAS</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {photos.map((photo) => {
                        const isUnlocked = galleryPhotos.includes(photo.id);
                        return (
                            <div key={photo.id} className="flex flex-col items-center group">
                                <div 
                                    onClick={() => isUnlocked && setViewingPhoto(photo.url)}
                                    className={`relative w-full aspect-[4/5] bg-gray-900 rounded-xl border-4 overflow-hidden transition-all duration-300 ${isUnlocked ? 'border-white cursor-pointer hover:scale-105 hover:border-blue-400 shadow-lg' : 'border-gray-700 opacity-60'}`}
                                >
                                    {isUnlocked ? (
                                        <img src={photo.url} alt={photo.label} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
                                            <span className="text-4xl mb-2">🔒</span>
                                            <span className="text-[8px] uppercase font-bold px-2">Complete o Nível 3 (Normal) com {photo.label}</span>
                                        </div>
                                    )}
                                </div>
                                <span className={`mt-3 text-[10px] font-bold uppercase tracking-widest ${isUnlocked ? 'text-white' : 'text-gray-600'}`}>{photo.label}</span>
                            </div>
                        );
                    })}
                </div>

                <button onClick={() => setStatus(GameStatus.MENU)} className="bg-gray-700 text-white py-4 px-8 rounded-xl border-b-4 border-gray-900 hover:bg-gray-600 font-bold text-xs uppercase tracking-widest shadow-xl active:translate-y-1 active:border-b-0">Voltar ao Menu</button>
             </div>
        </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-[#1a1c2c] flex flex-col items-center overflow-hidden selection:bg-blue-500 font-['Press_Start_2P']">
      
      {/* PHOTO MODAL OVERLAY */}
      {viewingPhoto && (
          <PhotoModal url={viewingPhoto} onClose={() => setViewingPhoto(null)} />
      )}

      {/* GALLERY SCREEN */}
      {status === GameStatus.GALLERY && renderGallery()}

      {/* HUD LAYER */}
      {(status !== GameStatus.SPLASH && status !== GameStatus.GALLERY) && (
        <div className="absolute top-0 left-0 right-0 p-4 md:p-6 flex justify-between items-start z-40 pointer-events-none">
            <div className="flex flex-col pointer-events-auto">
              <h1 className="text-[10px] md:text-lg text-yellow-400 font-bold tracking-tighter drop-shadow-lg" style={{ textShadow: '2px 2px 0 #000' }}>
                  PET RESCUE
              </h1>
              <span className="text-[6px] md:text-[8px] text-gray-400 uppercase tracking-widest mt-1">{nickname || 'Resgate'} - {getLevelName(level)}</span>
              {selectedChar === CharacterType.RABBIT && (
                  <span className="text-[6px] text-blue-400 uppercase animate-pulse mt-1">MODO VELOZ ATIVO (+35%)</span>
              )}
            </div>

            {status === GameStatus.PLAYING && (
                <div className="flex flex-col items-center pointer-events-auto gap-2">
                  <div className="bg-black/40 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10 shadow-2xl flex flex-col items-center min-w-[120px]">
                      <div className="text-[12px] md:text-xl font-bold text-white tracking-widest" style={{ textShadow: '2px 2px 0 #000' }}>
                          {score}m
                      </div>
                      <div className="text-[8px] md:text-[10px] font-bold text-yellow-500 uppercase">
                          🦴 {kibble}
                      </div>
                  </div>
                  <div className="flex gap-1">
                      {[...Array(MAX_HEALTH)].map((_, i) => (
                          <span key={i} className={`text-xs md:text-sm transition-all duration-300 ${i < health ? 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'text-gray-800'}`}>
                              ♥
                          </span>
                      ))}
                  </div>
                </div>
            )}
            
            <div className="flex items-center gap-2 pointer-events-auto">
                {status === GameStatus.PLAYING && (
                    <button onClick={togglePause} className="bg-gray-800/80 p-2 md:p-3 rounded-xl border-2 border-gray-700 hover:border-blue-500 transition-all text-white active:scale-90 shadow-xl backdrop-blur-sm">
                      {isPaused || countdown !== null ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256"><path d="M240,128a15.74,15.74,0,0,1-7.6,13.51L88.32,229.75a16,16,0,0,1-24.32-13.51V40a16,16,0,0,1,24.32-13.51L232.4,114.49A15.74,15.74,0,0,1,240,128Z"></path></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256"><path d="M200,48V208a16,16,0,0,1-16,16H152a16,16,0,0,1-16-16V48a16,16,0,0,1,16-16h32A16,16,0,0,1,200,48ZM104,32H72A16,16,0,0,0,56,48V208a16,16,0,0,0,16,16h32a16,16,0,0,0,16-16V48A16,16,0,0,0,104,32Z"></path></svg>
                      )}
                    </button>
                )}
                <button onClick={openOptions} className="bg-gray-800/80 p-2 md:p-3 rounded-xl border-2 border-gray-700 hover:border-yellow-500 transition-all text-white active:scale-90 shadow-xl backdrop-blur-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256"><path d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Zm112.55-52a12.11,12.11,0,0,0-10.74-8.15l-12.78-1a89.43,89.43,0,0,0-6.17-14.89l7.73-10.32a12.11,12.11,0,0,0-1.12-15.35L192,72.76a12.11,12.11,0,0,0-15.35-1.12l-10.32,7.73a89.43,89.43,0,0,0-14.89-6.17l-1-12.78A12.11,12.11,0,0,0,142.27,50H113.73a12.11,12.11,0,0,0-10.74,10.42l-1,12.78a89.43,89.43,0,0,0-14.89,6.17l-10.32-7.73a12.11,12.11,0,0,0-15.35,1.12L35.48,88.29a12.11,12.11,0,0,0-1.12,15.35l7.73,10.32a89.43,89.43,0,0,0-6.17,14.89l-12.78,1A12.11,12.11,0,0,0,12.73,142.27v28.54a12.11,12.11,0,0,0,10.42,10.74l12.78,1a89.43,89.43,0,0,0,6.17,14.89l-7.73,10.32a12.11,12.11,0,0,0,1.12,15.35L51.9,235.52a12.11,12.11,0,0,0,15.35,1.12l10.32-7.73a89.43,89.43,0,0,0 surveillance-14.89,6.17l1,12.78A12.11,12.11,0,0,0,113.73,258.4h28.54a12.11,12.11,0,0,0,10.74-10.42l1-12.78a89.43,89.43,0,0,0,14.89-6.17l10.32,7.73a12.11,12.11,0,0,0,15.35-1.12l16.39-16.39a12.11,12.11,0,0,0,1.12-15.35l-7.73-10.32a89.43,89.43,0,0,0,6.17-14.89l12.78-1a12.11,12.11,0,0,0,10.42-10.74V142.27A12.11,12.11,0,0,0,240.55,128Zm-28.1,38.11a12.1,12.1,0,0,0-11,8.37,73.1,73.1,0,0,1-10,24.22,12.1,12.1,0,0,0,.15,13.84l8.36,11.17-9,9-11.17-8.36a12.1,12.1,0,0,0-13.84-.15,73.1,73.1,0,0,1-24.22,10,12.1,12.1,0,0,0-8.37,11l-1.09,13.8h-12.72L159.4,241.22a12.1,12.1,0,0,0-8.37-11,73.1,73.1,0,0,1-24.22-10,12.1,12.1,0,0,0-13.84.15l-11.17,8.36-9-9,8.36-11.17a12.1,12.1,0,0,0,.15-13.84,73.1,73.1,0,0,1-10-24.22,12.1,12.1,0,0,0-11-8.37l-13.8-1.09v-12.72l13.8-1.09a12.1,12.1,0,0,0,11-8.37,73.1,73.1,0,0,1,10-24.22,12.1,12.1,0,0,0-.15-13.84L76.9,86.48l9-9,11.17,8.36a12.1,12.1,0,0,0,13.84.15,73.1,73.1,0,0,1,24.22,10,12.1,12.1,0,0,0,8.37-11l1.09-13.8h12.72L159.4,71.22a12.1,12.1,0,0,0,8.37,11,73.1,73.1,0,0,1,24.22,10,12.1,12.1,0,0,0,13.84-.15l11.17-8.36,9,9-8.36,11.17a12.1,12.1,0,0,0-.15,13.84,73.1,73.1,0,0,1,10,24.22,12.1,12.1,0,0,0,11,8.37l13.8,1.09v12.72Z"></path></svg>
                </button>
            </div>
        </div>
      )}

      {/* GAME VIEWPORT */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black">
        <div className="w-full h-full relative flex items-center justify-center bg-[#1a1c2c]">
          <div className="relative w-full h-auto aspect-[1/1.5] max-w-[600px] max-h-screen shadow-2xl overflow-hidden ring-4 ring-black/50 md:rounded-3xl">
            {status !== GameStatus.GALLERY && (
                <GameCanvas 
                    status={status === GameStatus.SPLASH ? GameStatus.MENU : status}
                    character={selectedChar}
                    difficulty={difficulty}
                    level={level}
                    nickname={nickname}
                    onUpdateScore={setScore}
                    onUpdateKibble={setKibble}
                    onUpdateHealth={setHealth}
                    onGameOver={handleGameOver}
                    onVictory={handleVictory}
                    isPaused={isPaused || countdown !== null || status === GameStatus.SPLASH || !!viewingPhoto}
                />
            )}
            
            {isPaused && countdown === null && status === GameStatus.PLAYING && !viewingPhoto && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center backdrop-blur-md z-30">
                 <div className="text-white text-3xl md:text-5xl font-bold uppercase tracking-widest animate-pulse italic text-center px-4" style={{ textShadow: '4px 4px 0 #000' }}>PAUSADO</div>
                 <button onClick={togglePause} className="mt-8 bg-blue-600 px-8 py-4 rounded-xl border-b-4 border-blue-800 text-sm md:text-lg font-bold uppercase active:translate-y-1 active:border-b-0">Continuar</button>
              </div>
            )}
            {countdown !== null && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-50">
                 <div className="text-white text-6xl md:text-9xl font-bold animate-ping" style={{ textShadow: '6px 6px 0 #000' }}>{countdown}</div>
              </div>
            )}
          </div>
        </div>

        {/* SPLASH OVERLAY */}
        {status === GameStatus.SPLASH && (
            <div className="absolute inset-0 z-[100] flex flex-col items-center justify-between p-12 bg-gradient-to-b from-[#60A5FA] to-[#1a1c2c]">
                <div className="w-full text-center flex flex-col items-center mt-12 animate-in slide-in-from-top-12 duration-1000">
                    <h1 className="text-4xl md:text-7xl text-white font-black tracking-tighter drop-shadow-[8px_8px_0_rgba(234,88,12,1)] mb-4" style={{ WebkitTextStroke: '3px #7C2D12' }}>
                        PET RESCUE
                    </h1>
                    <div className="bg-yellow-400/90 text-[#7C2D12] px-6 py-2 rounded-full border-4 border-white text-[8px] md:text-xs font-bold uppercase tracking-widest shadow-xl">
                        SALVE SEUS AMIGOS PIXELADOS!
                    </div>
                </div>

                <div className="flex gap-12 items-end mb-12 relative">
                    <div className="relative translate-y-4 animate-bounce duration-700">
                        <SpritePreview sprite={DOG_SPRITE} size={8} />
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-yellow-400 animate-pulse">⚡</div>
                    </div>
                    <div className="relative animate-bounce duration-1000">
                        <SpritePreview sprite={CAT_SPRITE} size={8} />
                    </div>
                    {isRabbitUnlocked && (
                        <div className="relative animate-bounce duration-500">
                            <SpritePreview sprite={RABBIT_SPRITE} size={8} />
                        </div>
                    )}
                </div>

                <div className="mb-20 flex flex-col items-center">
                    <div className="text-white text-[10px] md:text-sm animate-pulse font-bold tracking-[0.3em] uppercase mb-4" style={{ textShadow: '2px 2px 0 #000' }}>
                        CLIQUE OU TOQUE PARA INICIAR
                    </div>
                    <div className="text-gray-400 text-[6px] md:text-[8px] uppercase tracking-widest">
                        By: Murilo Campoos | 2026
                    </div>
                </div>
            </div>
        )}

        {/* MENU OVERLAY */}
        {(status === GameStatus.MENU && !isOptionsOpen) && (
            <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center z-50 p-4 md:p-8 overflow-y-auto custom-scrollbar">
                <div className="bg-[#2d3748] p-6 md:p-10 rounded-2xl border-4 border-blue-600 shadow-2xl max-w-md w-full text-center flex-shrink-0 animate-in zoom-in duration-300">
                    <h2 className="text-lg md:text-2xl text-white mb-8 font-bold tracking-tight uppercase underline decoration-blue-500 decoration-4 underline-offset-8">CONFIGURAÇÕES</h2>
                    
                    {/* Nickname Input */}
                    <div className="mb-6 text-left">
                        <label className="block text-[8px] text-gray-400 mb-2 font-bold uppercase tracking-widest">Nickname</label>
                        <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="DIGITE SEU NOME" className="w-full p-4 border-2 border-gray-600 bg-gray-900 rounded-xl text-white font-mono focus:border-blue-500 outline-none uppercase placeholder-gray-700 text-xs md:text-sm" maxLength={12} />
                    </div>

                    {/* Level Selection */}
                    <div className="mb-6">
                        <label className="block text-[8px] text-gray-400 mb-4 text-left font-bold uppercase tracking-widest">Selecione o Nível</label>
                        <div className="flex gap-2">
                            {[1, 2, 3].map((l) => (
                                <button 
                                    key={l}
                                    disabled={l > unlockedLevel && l <= 3}
                                    onClick={() => setLevel(l)}
                                    className={`flex-1 py-3 rounded-xl border-2 text-[8px] font-bold uppercase transition-all flex flex-col items-center gap-1 ${
                                        level === l 
                                            ? 'bg-blue-600 border-blue-400 text-white scale-105 shadow-[0_0_10px_rgba(59,130,246,0.5)]' 
                                            : (l <= unlockedLevel || l > 3) 
                                                ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' 
                                                : 'bg-gray-900 border-gray-800 text-gray-600 opacity-50 cursor-not-allowed'
                                    }`}
                                >
                                    <span>Lvl {l}</span>
                                    {l > unlockedLevel && l <= 3 && <span className="text-[10px]">🔒</span>}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Character Selection */}
                    <div className="mb-6">
                        <label className="block text-[8px] text-gray-400 mb-4 text-left font-bold uppercase tracking-widest">Escolha seu Pet</label>
                        <div className="flex justify-center gap-4 flex-wrap">
                            <div className="cursor-pointer group text-center" onClick={() => setSelectedChar(CharacterType.DOG)}>
                                <SpritePreview sprite={DOG_SPRITE} active={selectedChar === CharacterType.DOG} size={4} />
                                <span className={`text-[7px] mt-2 block font-bold transition-colors ${selectedChar === CharacterType.DOG ? 'text-blue-400' : 'text-gray-500'}`}>CARAMELO</span>
                            </div>
                            <div className="cursor-pointer group text-center" onClick={() => setSelectedChar(CharacterType.CAT)}>
                                <SpritePreview sprite={CAT_SPRITE} active={selectedChar === CharacterType.CAT} size={4} />
                                <span className={`text-[7px] mt-2 block font-bold transition-colors ${selectedChar === CharacterType.CAT ? 'text-blue-400' : 'text-gray-500'}`}>LARANJA</span>
                            </div>
                            {isRabbitUnlocked && (
                                <div className="cursor-pointer group text-center" onClick={() => setSelectedChar(CharacterType.RABBIT)}>
                                    <SpritePreview sprite={RABBIT_SPRITE} active={selectedChar === CharacterType.RABBIT} size={4} />
                                    <span className={`text-[7px] mt-2 block font-bold transition-colors ${selectedChar === CharacterType.RABBIT ? 'text-pink-400' : 'text-gray-500'}`}>NEVE</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Difficulty */}
                    <div className="mb-6">
                        <label className="block text-[8px] text-gray-400 mb-4 text-left font-bold uppercase tracking-widest">Dificuldade</label>
                        <div className="flex gap-2">
                            <button onClick={() => setDifficulty(Difficulty.NORMAL)} className={`flex-1 py-3 px-2 rounded-xl border-2 text-[8px] font-bold uppercase transition-all ${difficulty === Difficulty.NORMAL ? 'bg-blue-600 border-blue-400 text-white scale-105 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-gray-800 border-gray-700 text-gray-500'}`}>Normal</button>
                            <button onClick={() => setDifficulty(Difficulty.HARD)} className={`flex-1 py-3 px-2 rounded-xl border-2 text-[8px] font-bold uppercase transition-all ${difficulty === Difficulty.HARD ? 'bg-red-600 border-red-400 text-white scale-105 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-gray-800 border-gray-700 text-gray-500'}`}>Difícil</button>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button onClick={startGame} className="flex-[2] bg-blue-600 text-white py-5 rounded-2xl border-b-8 border-blue-800 active:border-b-0 active:translate-y-2 font-bold hover:bg-blue-500 transition-all text-xs md:text-sm tracking-widest shadow-2xl">COMEÇAR AVENTURA</button>
                        <button onClick={() => setStatus(GameStatus.GALLERY)} className="flex-1 bg-yellow-600 text-white py-5 rounded-2xl border-b-8 border-yellow-800 active:border-b-0 active:translate-y-2 font-bold hover:bg-yellow-500 transition-all text-[8px] md:text-xs uppercase tracking-widest shadow-2xl flex flex-col items-center justify-center">
                            <span>📷</span>
                            <span>Galeria</span>
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* OPTIONS MODAL */}
        {isOptionsOpen && (
            <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center z-[60] p-4 md:p-8 backdrop-blur-xl overflow-y-auto custom-scrollbar">
                 <div className="bg-gray-900 p-6 md:p-10 rounded-2xl border-4 border-gray-700 shadow-2xl max-w-xl w-full flex-shrink-0">
                    <div className="flex justify-between items-center mb-8">
                         <h2 className="text-sm md:text-xl text-yellow-400 font-bold uppercase tracking-widest">Opções</h2>
                         <button onClick={() => { setIsOptionsOpen(false); setShowLeaderboardShortcut(false); }} className="text-gray-500 hover:text-white font-bold text-2xl active:scale-75 transition-transform">×</button>
                    </div>
                    {showLeaderboardShortcut ? (
                        <div className="flex flex-col items-center space-y-6">
                            <Leaderboard lastUpdate={lastScoreUpdate} />
                            <button onClick={() => setShowLeaderboardShortcut(false)} className="text-[8px] md:text-[10px] text-blue-400 hover:text-white font-bold uppercase py-2 tracking-widest underline underline-offset-4">Voltar às Configurações</button>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-3 bg-gray-800 p-5 rounded-2xl border border-gray-700">
                                    <span className="text-[7px] md:text-[9px] font-bold uppercase text-gray-400">Sons Animais</span>
                                    <button onClick={() => toggleSound('animalSounds')} className={`w-full py-3 rounded-xl font-bold text-[8px] md:text-[10px] uppercase transition-all shadow-lg ${soundSettings.animalSounds ? 'bg-green-600 text-white border-b-4 border-green-800' : 'bg-red-900/50 text-gray-400 border-b-4 border-red-950'}`}>{soundSettings.animalSounds ? 'Ligado' : 'Desligado'}</button>
                                </div>
                                <div className="flex flex-col gap-3 bg-gray-800 p-5 rounded-2xl border border-gray-700">
                                    <span className="text-[7px] md:text-[9px] font-bold uppercase text-gray-400">Efeitos</span>
                                    <button onClick={() => toggleSound('systemSounds')} className={`w-full py-3 rounded-xl font-bold text-[8px] md:text-[10px] uppercase transition-all shadow-lg ${soundSettings.systemSounds ? 'bg-green-600 text-white border-b-4 border-green-800' : 'bg-red-900/50 text-gray-400 border-b-4 border-red-950'}`}>{soundSettings.systemSounds ? 'Ligado' : 'Desligado'}</button>
                                </div>
                            </div>
                            <div className="flex flex-col md:flex-row gap-4 pt-4">
                                <button onClick={() => setShowLeaderboardShortcut(true)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-4 rounded-xl border-b-4 border-black text-[8px] md:text-[10px] font-bold uppercase transition-all shadow-xl">Placar Geral</button>
                                <button onClick={() => setIsOptionsOpen(false)} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl border-b-4 border-blue-900 text-[8px] md:text-[10px] font-bold uppercase transition-all shadow-xl">Voltar</button>
                            </div>
                        </div>
                    )}
                 </div>
            </div>
        )}

        {/* GAME OVER MODAL */}
        {status === GameStatus.GAME_OVER && (
            <div className="absolute inset-0 bg-red-950/90 flex flex-col items-center justify-center z-[70] p-4 md:p-8 overflow-y-auto custom-scrollbar">
                <div className="bg-gray-900 p-6 md:p-10 rounded-2xl border-4 border-red-600 shadow-[0_0_60px_rgba(220,38,38,0.4)] text-center max-w-md w-full flex-shrink-0 animate-in zoom-in duration-300">
                    <h2 className="text-2xl md:text-4xl text-red-500 mb-2 font-bold italic uppercase tracking-tighter" style={{ textShadow: '4px 4px 0 #000' }}>GAME OVER</h2>
                    <p className="text-gray-400 text-[8px] md:text-[10px] mb-6 tracking-widest uppercase">O resgate te pegou!</p>
                    <div className="bg-black/60 p-5 rounded-2xl mb-8 border border-red-500/20 flex flex-col gap-2 shadow-inner">
                        <div className="flex justify-between items-center w-full"><span className="text-gray-500 text-[8px] font-bold uppercase tracking-widest">Score Final</span><span className="text-xl md:text-2xl text-white font-black">{score * level}m</span></div>
                        <div className="flex justify-between items-center w-full border-t border-gray-800 pt-2"><span className="text-gray-500 text-[8px] font-bold uppercase tracking-widest">Ração Coletada</span><span className="text-lg md:text-xl text-yellow-500 font-black">🦴 {kibble}</span></div>
                    </div>
                    <div className="mb-8"><Leaderboard lastUpdate={lastScoreUpdate} /></div>
                    <button onClick={() => setStatus(GameStatus.MENU)} className="bg-gray-700 text-white py-5 rounded-2xl border-b-8 border-gray-900 hover:bg-gray-600 font-bold w-full transition-all text-[10px] uppercase tracking-[0.2em] shadow-2xl active:translate-y-2 active:border-b-0">Tentar Novamente</button>
                </div>
            </div>
        )}

        {/* VICTORY MODAL */}
        {status === GameStatus.VICTORY && !viewingPhoto && (
            <div className="absolute inset-0 bg-green-950/90 flex flex-col items-center justify-center z-[70] p-4 md:p-8 overflow-y-auto custom-scrollbar">
                 <div className="bg-gray-900 p-6 md:p-10 rounded-2xl border-4 border-green-500 shadow-[0_0_60px_rgba(34,197,94,0.4)] text-center max-w-md w-full flex-shrink-0 animate-in zoom-in duration-300">
                    <h2 className="text-2xl md:text-4xl text-green-400 mb-2 font-bold tracking-tighter uppercase" style={{ textShadow: '4px 4px 0 #000' }}>{level < 3 ? `${getLevelName(level)} CONCLUÍDA!` : 'AVENTURA FINALIZADA!'}</h2>
                    <p className="text-gray-400 text-[8px] md:text-[10px] mb-8 tracking-widest uppercase">
                        {level === 1 ? 'Você atravessou a cidade!' : (level === 2 ? 'Você atravessou o interior!' : 'Você finalmente chegou em casa!')}
                    </p>
                    
                    {level === 3 && difficulty !== Difficulty.NORMAL && unlockedLevel < 4 && (
                        <p className="text-[8px] text-yellow-500 mb-4 italic">Dica: Termine no modo NORMAL para ver o final secreto!</p>
                    )}

                    {level === 3 && difficulty === Difficulty.NORMAL && (
                        <div className="bg-yellow-400/20 border border-yellow-400 p-4 rounded-xl mb-6 animate-pulse">
                            <span className="text-yellow-400 text-[8px] font-bold uppercase tracking-widest">
                                🎉 NOVO PET DESBLOQUEADO: COELHO VELOZ!
                            </span>
                        </div>
                    )}
                    <div className="bg-black/60 p-5 rounded-2xl mb-8 border border-green-500/30 flex flex-col gap-2 shadow-inner">
                        <div className="flex justify-between items-center w-full"><span className="text-gray-500 text-[8px] font-bold uppercase tracking-widest">Score Final</span><span className="text-xl md:text-2xl text-green-400 font-black">{score * level}m</span></div>
                    </div>
                    <div className="mb-8"><Leaderboard lastUpdate={lastScoreUpdate} /></div>
                    <div className="flex flex-col gap-4">
                        {level < 3 ? (
                            <button onClick={nextLevel} className="bg-blue-600 text-white py-5 rounded-2xl border-b-8 border-blue-800 hover:bg-blue-500 font-bold w-full text-[10px] uppercase tracking-[0.2em] shadow-2xl active:translate-y-2 active:border-b-0">PRÓXIMO NÍVEL: {getLevelName(level + 1)}</button>
                        ) : (
                            <button onClick={() => setStatus(GameStatus.MENU)} className="bg-yellow-600 text-white py-5 rounded-2xl border-b-8 border-yellow-800 hover:bg-yellow-500 font-bold w-full text-[10px] uppercase tracking-[0.2em] shadow-2xl active:translate-y-2 active:border-b-0">Jogar Novamente</button>
                        )}
                        <button onClick={() => setStatus(GameStatus.MENU)} className="bg-gray-700 text-white py-5 rounded-2xl border-b-8 border-gray-900 hover:bg-gray-600 font-bold w-full text-[10px] uppercase tracking-[0.2em] shadow-2xl active:translate-y-2 active:border-b-0">Voltar ao Menu</button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default App;
