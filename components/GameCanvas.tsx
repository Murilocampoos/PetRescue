
import React, { useEffect, useRef } from 'react';
import { CharacterType, GameStatus } from '../types';
import { 
  GAME_HEIGHT, GAME_WIDTH, GRAVITY, GROUND_Y, INITIAL_SPEED, JUMP_STRENGTH, 
  DOG_SPRITE, DOG_SPRITE_RUN, CAT_SPRITE, CAT_SPRITE_RUN, 
  TRASH_SPRITE, BIRD_SPRITE, WIN_SCORE, HOUSE_SPRITE 
} from '../constants';
import { drawSprite, saveScore, playJumpSound, playCollisionSound, playVictorySound } from '../utils';

interface GameCanvasProps {
  status: GameStatus;
  character: CharacterType;
  nickname: string;
  onGameOver: () => void;
  onVictory: () => void;
  onUpdateScore: (score: number) => void;
  onUpdateHealth: (health: number) => void;
}

interface Entity {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'OBSTACLE_GROUND' | 'OBSTACLE_AIR' | 'HOUSE';
  passed: boolean;
}

// Define colorful buildings for the background
const BUILDINGS = [
  { w: 60, h: 150, color: '#F87171' }, // Red-400
  { w: 80, h: 200, color: '#FBBF24' }, // Amber-400
  { w: 50, h: 100, color: '#34D399' }, // Emerald-400
  { w: 100, h: 250, color: '#60A5FA' }, // Blue-400
  { w: 70, h: 180, color: '#A78BFA' }, // Violet-400
  { w: 90, h: 120, color: '#F472B6' }, // Pink-400
  { w: 110, h: 220, color: '#FB923C' }, // Orange-400
  { w: 80, h: 140, color: '#4ADE80' }, // Green-400
  { w: 100, h: 280, color: '#22D3EE' }, // Cyan-400
  { w: 60, h: 160, color: '#E879F9' }  // Fuchsia-400
];

const GameCanvas: React.FC<GameCanvasProps> = ({
  status,
  character,
  nickname,
  onGameOver,
  onVictory,
  onUpdateScore,
  onUpdateHealth
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Game State Refs (Mutable for Loop)
  const gameState = useRef({
    frame: 0,
    playerY: GROUND_Y,
    playerVelY: 0,
    isJumping: false,
    obstacles: [] as Entity[],
    speed: INITIAL_SPEED,
    score: 0,
    distance: 0,
    health: 3,
    invincibleFrames: 0,
    gameActive: false,
    victorySequence: false,
  });

  // Setup Sprites
  const basePlayerSprite = character === CharacterType.DOG ? DOG_SPRITE : CAT_SPRITE;
  const runPlayerSprite = character === CharacterType.DOG ? DOG_SPRITE_RUN : CAT_SPRITE_RUN;
  
  const playerWidth = basePlayerSprite.width * basePlayerSprite.pixelSize;
  const playerHeight = basePlayerSprite.height * basePlayerSprite.pixelSize;

  // Reset Game Logic
  const resetGame = () => {
    gameState.current = {
      frame: 0,
      playerY: GROUND_Y - playerHeight,
      playerVelY: 0,
      isJumping: false,
      obstacles: [],
      speed: INITIAL_SPEED,
      score: 0,
      distance: 0,
      health: 3,
      invincibleFrames: 0,
      gameActive: true,
      victorySequence: false,
    };
    onUpdateScore(0);
    onUpdateHealth(3);
  };

  // Jump Handler
  const handleJump = () => {
    if (gameState.current.playerY >= GROUND_Y - playerHeight - 5 && !gameState.current.victorySequence) {
      gameState.current.playerVelY = JUMP_STRENGTH;
      gameState.current.isJumping = true;
      playJumpSound(character);
    }
  };

  useEffect(() => {
    if (status === GameStatus.PLAYING) {
      resetGame();
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('touchstart', handleTouch);
    } else {
      gameState.current.gameActive = false;
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      handleJump();
    }
  };

  const handleTouch = () => {
    handleJump();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      if (!gameState.current.gameActive && status !== GameStatus.PLAYING) return;

      const state = gameState.current;

      // Update Physics
      if (state.gameActive) {
        state.playerVelY += GRAVITY;
        state.playerY += state.playerVelY;

        // Ground Collision
        if (state.playerY > GROUND_Y - playerHeight) {
          state.playerY = GROUND_Y - playerHeight;
          state.playerVelY = 0;
          state.isJumping = false;
        }

        // Speed Progression
        if (state.frame % 600 === 0 && !state.victorySequence) {
           state.speed += 0.5; // Increase speed every ~10 seconds
        }

        // Score Calculation (Based on distance/ticks)
        if (!state.victorySequence) {
            // Every 60 frames (approx 1 sec) adds 1 point of progress towards the house
            if (state.frame % 30 === 0) { 
                state.score += 1;
                onUpdateScore(state.score);
            }
        }

        // Spawn Obstacles
        // Only spawn if not in victory sequence and score < 100
        if (!state.victorySequence && state.score < WIN_SCORE) {
           // Increased frequency logic
           // Start: spawnRate = 70. End: spawnRate = 30.
           const spawnRate = Math.max(30, 70 - Math.floor(state.score * 0.4)); 
           
           // Random chance slightly increased
           if (state.frame % spawnRate === 0 && Math.random() > 0.25) {
             const type = Math.random() > 0.6 ? 'OBSTACLE_AIR' : 'OBSTACLE_GROUND';
             
             // Prevent air obstacles from being impossible to jump if speed is low
             const actualType = (type === 'OBSTACLE_AIR' && state.speed < 6) ? 'OBSTACLE_GROUND' : type;

             state.obstacles.push({
               x: GAME_WIDTH,
               y: actualType === 'OBSTACLE_AIR' ? GROUND_Y - 100 : GROUND_Y - TRASH_SPRITE.height * TRASH_SPRITE.pixelSize,
               width: actualType === 'OBSTACLE_AIR' ? BIRD_SPRITE.width * BIRD_SPRITE.pixelSize : TRASH_SPRITE.width * TRASH_SPRITE.pixelSize,
               height: actualType === 'OBSTACLE_AIR' ? BIRD_SPRITE.height * BIRD_SPRITE.pixelSize : TRASH_SPRITE.height * TRASH_SPRITE.pixelSize,
               type: actualType,
               passed: false
             });
           }
        }

        // Spawn House
        if (state.score >= WIN_SCORE && !state.obstacles.find(o => o.type === 'HOUSE')) {
             state.obstacles.push({
                 x: GAME_WIDTH + 100,
                 y: GROUND_Y - HOUSE_SPRITE.height * HOUSE_SPRITE.pixelSize,
                 width: HOUSE_SPRITE.width * HOUSE_SPRITE.pixelSize,
                 height: HOUSE_SPRITE.height * HOUSE_SPRITE.pixelSize,
                 type: 'HOUSE',
                 passed: false
             });
             state.victorySequence = true;
        }

        // Update Obstacles
        for (let i = state.obstacles.length - 1; i >= 0; i--) {
          const obs = state.obstacles[i];
          obs.x -= state.speed;

          // Collision Detection
          if (
            state.invincibleFrames === 0 &&
            obs.x < 100 + playerWidth - 20 && // Player fixed X at 100. -20 for hitbox forgiveness
            obs.x + obs.width > 100 + 20 &&
            state.playerY < obs.y + obs.height - 10 &&
            state.playerY + playerHeight > obs.y + 10
          ) {
            if (obs.type === 'HOUSE') {
                // Victory!
                saveScore(nickname, state.score);
                playVictorySound();
                onVictory();
                state.gameActive = false;
            } else {
                // Hit Obstacle
                state.health -= 1;
                state.invincibleFrames = 60; // 1 second invincibility
                playCollisionSound();
                onUpdateHealth(state.health);
                
                if (state.health <= 0) {
                    saveScore(nickname, state.score);
                    onGameOver();
                    state.gameActive = false;
                }
            }
          }

          // Cleanup
          if (obs.x + obs.width < 0) {
            state.obstacles.splice(i, 1);
          }
        }

        if (state.invincibleFrames > 0) {
            state.invincibleFrames--;
        }

        state.frame++;
      }

      // --- DRAWING ---
      
      // Clear Screen
      ctx.fillStyle = '#7DD3FC'; // Sky blue-300 (Brighter)
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      // Draw Background (Colorful City Skyline)
      const bgOffset = (state.frame * (state.speed * 0.3)) % GAME_WIDTH;
      
      const drawSkyline = (offsetX: number) => {
          let currentX = 0;
          BUILDINGS.forEach((b) => {
              ctx.fillStyle = b.color;
              ctx.fillRect(offsetX + currentX, GAME_HEIGHT - b.h, b.w, b.h);
              
              // Add simple windows
              ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
              for(let wy = GAME_HEIGHT - b.h + 10; wy < GAME_HEIGHT - 10; wy+=20) {
                 for(let wx = 10; wx < b.w - 10; wx+=15) {
                    if (Math.random() > 0.1) { // Slight randomness for sparkle effect or static windows
                       ctx.fillRect(offsetX + currentX + wx, wy, 8, 12);
                    }
                 }
              }

              currentX += b.w;
          });
      };
      
      // Draw twice for seamless looping
      drawSkyline(-bgOffset);
      drawSkyline(-bgOffset + 800); 

      // Draw ONG (Start) only at beginning
      if (state.frame * state.speed < 500) {
          ctx.fillStyle = '#FFF';
          ctx.font = '10px "Press Start 2P"';
          const ongX = 50 - (state.frame * state.speed);
          ctx.fillText("ONG", ongX, GROUND_Y - 50);
          ctx.fillRect(ongX, GROUND_Y - 40, 40, 40);
          
          // Draw simple door for ONG
          ctx.fillStyle = '#374151';
          ctx.fillRect(ongX + 15, GROUND_Y - 20, 10, 20);
      }

      // Draw Ground
      ctx.fillStyle = '#374151'; // Gray-700 Road
      ctx.fillRect(0, GROUND_Y, GAME_WIDTH, GAME_HEIGHT - GROUND_Y);
      
      // Road Markings
      ctx.fillStyle = '#FCD34D'; // Markings
      for (let i = 0; i < GAME_WIDTH; i += 100) {
        const markX = (i - (state.frame * state.speed)) % GAME_WIDTH;
        const drawX = markX < 0 ? GAME_WIDTH + markX : markX;
        ctx.fillRect(drawX, GROUND_Y + 20, 40, 10);
      }

      // Draw Obstacles
      state.obstacles.forEach(obs => {
        if (obs.type === 'HOUSE') {
            drawSprite(ctx, HOUSE_SPRITE, obs.x, obs.y);
        } else if (obs.type === 'OBSTACLE_GROUND') {
            drawSprite(ctx, TRASH_SPRITE, obs.x, obs.y);
        } else {
            drawSprite(ctx, BIRD_SPRITE, obs.x, obs.y);
        }
      });

      // Draw Player with Animation
      if (state.invincibleFrames % 10 < 5) { // Flicker effect
        let activeSprite = basePlayerSprite;
        
        // Animation Logic
        // Toggle frame based on distance traveled for accurate "step" feeling
        if (state.isJumping) {
            activeSprite = runPlayerSprite; 
        } else {
             // Change sprite every 10 frames
             const isRunning = Math.floor(state.frame / 8) % 2 === 0;
             activeSprite = isRunning ? runPlayerSprite : basePlayerSprite;
        }

        drawSprite(ctx, activeSprite, 100, state.playerY);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => cancelAnimationFrame(animationFrameId);
  }, [status, basePlayerSprite, runPlayerSprite, onGameOver, onVictory, onUpdateScore, onUpdateHealth, nickname, playerWidth, playerHeight, character]);

  return (
    <canvas
      ref={canvasRef}
      width={GAME_WIDTH}
      height={GAME_HEIGHT}
      className="w-full h-full max-w-3xl border-4 border-gray-800 rounded-lg shadow-xl bg-gray-800"
    />
  );
};

export default GameCanvas;
