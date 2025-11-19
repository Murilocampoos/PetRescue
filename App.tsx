import React, { useState } from 'react';
import { CharacterType, GameStatus } from './types';
import GameCanvas from './components/GameCanvas';
import Leaderboard from './components/Leaderboard';
import { DOG_SPRITE, CAT_SPRITE, MAX_HEALTH } from './constants';

// Simple sprite preview component
const SpritePreview = ({ sprite, active }: { sprite: any, active: boolean }) => {
    const size = 6;
    return (
        <div 
          className={`relative p-4 border-4 cursor-pointer transition-all duration-200 ${active ? 'border-blue-500 bg-blue-50 scale-110' : 'border-gray-300 bg-gray-100 hover:border-gray-400'}`}
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

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.MENU);
  const [nickname, setNickname] = useState('');
  const [selectedChar, setSelectedChar] = useState<CharacterType>(CharacterType.DOG);
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(MAX_HEALTH);

  const startGame = () => {
    if (!nickname.trim()) {
      alert("Por favor, digite um nickname!");
      return;
    }
    setStatus(GameStatus.PLAYING);
    setScore(0);
    setHealth(MAX_HEALTH);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-blue-900 to-purple-900 flex flex-col items-center justify-center p-4">
      
      {/* Header / HUD */}
      <div className="absolute top-4 w-full max-w-3xl flex justify-between items-center px-4 text-white z-10">
          <div className="flex flex-col">
            <h1 className="text-xl md:text-2xl text-yellow-400 drop-shadow-md" style={{ textShadow: '2px 2px 0 #000' }}>
                PET RESCUE
            </h1>
            <span className="text-xs text-gray-300">by QuantIT</span>
          </div>
          
          {status === GameStatus.PLAYING && (
              <div className="flex gap-4 bg-black/50 p-2 rounded-lg border-2 border-white">
                  <div className="flex flex-col items-center">
                      <span className="text-xs text-gray-400">DISTÂNCIA</span>
                      <span className="text-lg font-bold text-green-400">{score}m</span>
                  </div>
                  <div className="flex flex-col items-center">
                       <span className="text-xs text-gray-400">VIDA</span>
                       <div className="flex gap-1">
                           {[...Array(MAX_HEALTH)].map((_, i) => (
                               <span key={i} className={`text-lg ${i < health ? 'text-red-500' : 'text-gray-600'}`}>
                                   ♥
                               </span>
                           ))}
                       </div>
                  </div>
              </div>
          )}
      </div>

      {/* Main Game Container */}
      <div className="relative w-full max-w-3xl aspect-[2/1]">
        
        {/* GAME CANVAS */}
        <GameCanvas 
            status={status}
            character={selectedChar}
            nickname={nickname}
            onUpdateScore={setScore}
            onUpdateHealth={setHealth}
            onGameOver={() => setStatus(GameStatus.GAME_OVER)}
            onVictory={() => setStatus(GameStatus.VICTORY)}
        />

        {/* MENUS OVERLAY */}
        {status === GameStatus.MENU && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-lg z-20 animate-fade-in">
                <div className="bg-white p-8 rounded-lg border-4 border-blue-500 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md w-full text-center">
                    <h2 className="text-2xl text-gray-800 mb-6 font-bold">NOVO JOGO</h2>
                    
                    <div className="mb-6 text-left">
                        <label className="block text-xs text-gray-600 mb-2">SEU NICKNAME</label>
                        <input 
                            type="text" 
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder="PLAYER 1"
                            className="w-full p-3 border-2 border-gray-300 rounded text-gray-900 font-mono focus:border-blue-500 outline-none"
                            maxLength={10}
                        />
                    </div>

                    <div className="mb-8">
                        <label className="block text-xs text-gray-600 mb-2 text-left">ESCOLHA SEU PET</label>
                        <div className="flex justify-center gap-4">
                            <div onClick={() => setSelectedChar(CharacterType.DOG)}>
                                <SpritePreview sprite={DOG_SPRITE} active={selectedChar === CharacterType.DOG} />
                                <span className="text-xs text-gray-600 mt-1 block">Caramelo</span>
                            </div>
                            <div onClick={() => setSelectedChar(CharacterType.CAT)}>
                                <SpritePreview sprite={CAT_SPRITE} active={selectedChar === CharacterType.CAT} />
                                <span className="text-xs text-gray-600 mt-1 block">Laranja</span>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={startGame}
                        className="w-full bg-green-500 text-white py-4 rounded border-b-4 border-green-700 active:border-b-0 active:mt-1 font-bold hover:bg-green-400 transition-all"
                    >
                        COMEÇAR JORNADA
                    </button>
                </div>
            </div>
        )}

        {status === GameStatus.GAME_OVER && (
            <div className="absolute inset-0 bg-red-900/80 flex flex-col items-center justify-center rounded-lg z-20">
                <div className="bg-white p-8 rounded-lg border-4 border-red-500 shadow-xl text-center">
                    <h2 className="text-3xl text-red-600 mb-2">QUE PENA!</h2>
                    <p className="text-gray-600 text-sm mb-6">Tente novamente.</p>
                    
                    <div className="bg-gray-100 p-4 rounded mb-6 border-2 border-gray-200">
                        <p className="text-gray-500 text-xs">SUA PONTUAÇÃO</p>
                        <p className="text-4xl text-gray-800">{score}m</p>
                    </div>

                    <button 
                        onClick={() => setStatus(GameStatus.MENU)}
                        className="bg-blue-500 text-white px-8 py-3 rounded border-b-4 border-blue-700 hover:bg-blue-400 font-bold w-full"
                    >
                        VOLTAR AO MENU
                    </button>
                </div>
            </div>
        )}

        {status === GameStatus.VICTORY && (
            <div className="absolute inset-0 bg-green-900/80 flex flex-col items-center justify-center rounded-lg z-20">
                 <div className="bg-white p-8 rounded-lg border-4 border-green-500 shadow-xl text-center animate-bounce-in">
                    <h2 className="text-3xl text-green-600 mb-2">PARABÉNS!</h2>
                    <p className="text-gray-600 text-sm mb-6">Você encontrou um lar!</p>
                    
                    <div className="flex justify-center mb-6">
                         {/* Render House Sprite CSS approximation for UI */}
                         <div className="w-16 h-16 bg-red-500 relative">
                             <div className="absolute -top-8 left-0 w-0 h-0 border-l-[32px] border-l-transparent border-r-[32px] border-r-transparent border-b-[32px] border-b-red-600"></div>
                             <div className="absolute bottom-0 left-6 w-4 h-8 bg-gray-700"></div>
                         </div>
                    </div>

                    <button 
                        onClick={() => setStatus(GameStatus.MENU)}
                        className="bg-yellow-500 text-white px-8 py-3 rounded border-b-4 border-yellow-700 hover:bg-yellow-400 font-bold w-full text-shadow"
                    >
                        JOGAR NOVAMENTE
                    </button>
                </div>
            </div>
        )}
      </div>

      {/* Instructions & Leaderboard Section */}
      <div className="mt-8 w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-4">
         <div className="bg-gray-800 p-4 rounded-lg border-2 border-gray-600 text-gray-300 text-xs leading-relaxed">
             <h4 className="text-yellow-400 font-bold mb-2">COMO JOGAR</h4>
             <p>1. Pule para desviar de <b>latas de lixo</b>.</p>
             <p>2. Cuidado com os <b>pombos</b> voando baixo.</p>
             <p>3. Chegue a 100m para encontrar a casa.</p>
             <br/>
             <p className="text-center font-bold text-white">
                 [ESPAÇO] ou [TOQUE] para pular
             </p>
         </div>
         <Leaderboard />
      </div>

    </div>
  );
};

export default App;