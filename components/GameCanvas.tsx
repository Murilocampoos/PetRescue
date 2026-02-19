
import React, { useEffect, useRef } from 'react';
import { CharacterType, GameStatus, Difficulty } from '../types';
import { 
  GAME_HEIGHT, GAME_WIDTH, GRAVITY, GROUND_Y, INITIAL_SPEED, JUMP_STRENGTH, 
  DOG_SPRITE, DOG_SPRITE_RUN, CAT_SPRITE, CAT_SPRITE_RUN, 
  RABBIT_SPRITE, RABBIT_SPRITE_RUN,
  TRASH_SPRITE, BIRD_SPRITE, BIRD_SPRITE_FLAP, WIN_SCORE, HOUSE_SPRITE, CLOUD_SPRITE,
  RED_CAR_SPRITE, TAXI_CAR_SPRITE, VAN_SPRITE, BUSH_SPRITE, BENCH_SPRITE, CRATE_SPRITE,
  POLICE_CAR_SPRITE, BONE_SPRITE, BISCUIT_SPRITE, HEART_SPRITE, MAX_HEALTH,
  FENCE_SPRITE, FALCON_SPRITE, FALCON_SPRITE_FLAP, HAY_BALE_SPRITE, CHICKEN_COOP_SPRITE, TRACTOR_SPRITE,
  CRAB_SPRITE, SEAGULL_SPRITE, SEAGULL_SPRITE_FLAP, BUOY_SPRITE, BEACH_CHAIR_SPRITE, SANDCASTLE_SPRITE,
  OFFROAD_SPRITE, ATV_SPRITE, PALM_TREE_SPRITE
} from '../constants';
import { drawSprite, saveScore, playJumpSound, playCollisionSound, playVictorySound, playCollectSound } from '../utils';

interface GameCanvasProps {
  status: GameStatus;
  character: CharacterType;
  difficulty: Difficulty;
  level: number;
  nickname: string;
  onGameOver: () => void;
  onVictory: () => void;
  onUpdateScore: (score: number) => void;
  onUpdateKibble: (kibble: number) => void;
  onUpdateHealth: (health: number) => void;
  isPaused: boolean;
}

interface Entity {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'OBSTACLE_GROUND' | 'OBSTACLE_AIR' | 'HOUSE' | 'PLATFORM' | 'COLLECTIBLE';
  passed: boolean;
  subType?: 'LOW' | 'HIGH' | 'CAR' | 'BUSH' | 'BENCH' | 'CRATE' | 'TRASH' | 'TAXI' | 'VAN' | 'POLICE' | 'BONE' | 'BISCUIT' | 'HEART';
}

interface Cloud {
    x: number;
    y: number;
    speedFactor: number;
}

// Parallax Layers Configuration
const CITY_LAYERS = [
  {
    speed: 0.15, // Slow back layer
    items: [
      { w: 100, h: 250, color: '#1E293B' },
      { w: 80, h: 300, color: '#334155' },
      { w: 120, h: 200, color: '#1E293B' },
      { w: 90, h: 350, color: '#334155' },
      { w: 110, h: 220, color: '#1E293B' },
    ]
  },
  {
    speed: 0.5, // Faster front layer
    items: [
      { w: 60, h: 150, color: '#F87171' }, 
      { w: 80, h: 220, color: '#FBBF24' }, 
      { w: 50, h: 100, color: '#34D399' }, 
      { w: 100, h: 300, color: '#60A5FA' }, 
      { w: 70, h: 180, color: '#A78BFA' }, 
      { w: 90, h: 120, color: '#F472B6' }, 
      { w: 110, h: 250, color: '#FB923C' }, 
      { w: 80, h: 140, color: '#4ADE80' }
    ]
  }
];

const RURAL_LAYERS = [
  {
    speed: 0.15,
    items: [
      { w: 300, h: 280, color: '#064E3B' }, // Darker, larger hills in back
      { w: 400, h: 350, color: '#065F46' },
    ]
  },
  {
    speed: 0.5,
    items: [
      { w: 150, h: 100, color: '#10B981' },
      { w: 200, h: 150, color: '#059669' },
      { w: 180, h: 120, color: '#047857' },
      { w: 250, h: 180, color: '#064E3B' }
    ]
  }
];

const PALMS_PATTERN = [
  { x: 30, w: 100 },
  { x: 150, w: 120 },
  { x: 280, w: 90 },
  { x: 400, w: 110 }
];
const PALMS_WIDTH = 550; // Total width of the palm pattern loop

const GameCanvas: React.FC<GameCanvasProps> = ({
  status,
  character,
  difficulty,
  level,
  nickname,
  onGameOver,
  onVictory,
  onUpdateScore,
  onUpdateKibble,
  onUpdateHealth,
  isPaused
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const PLAYER_X = 50; 
  
  const speedMult = difficulty === Difficulty.HARD ? 1.25 : 1.0;
  // Rabbit effect: 35% faster independently of difficulty
  const rabbitSpeedMult = character === CharacterType.RABBIT ? 1.35 : 1.0;
  
  const currentGravity = GRAVITY * speedMult * (character === CharacterType.RABBIT ? 1.15 : 1.0); // Slightly more gravity for rabbit to compensate speed
  const currentJumpStrength = JUMP_STRENGTH * speedMult;

  const gameState = useRef({
    frame: 0,
    playerY: GROUND_Y,
    playerVelY: 0,
    isJumping: false,
    jumpInputActive: false,
    appliedJumpBoost: false, 
    landingFrame: 0, // Animation frame counter for landing squash effect
    onPlatform: null as Entity | null,
    obstacles: [] as Entity[],
    clouds: [] as Cloud[],
    speed: INITIAL_SPEED * speedMult * rabbitSpeedMult,
    bgDistance: 0, // Track total distance for parallax
    score: 0,
    kibble: 0,
    health: 3,
    invincibleFrames: 0,
    gameActive: false,
    victorySequence: false,
  });

  const getSprites = () => {
    switch(character) {
        case CharacterType.CAT: return [CAT_SPRITE, CAT_SPRITE_RUN];
        case CharacterType.RABBIT: return [RABBIT_SPRITE, RABBIT_SPRITE_RUN];
        default: return [DOG_SPRITE, DOG_SPRITE_RUN];
    }
  }

  const [basePlayerSprite, runPlayerSprite] = getSprites();
  
  const playerWidth = basePlayerSprite.width * basePlayerSprite.pixelSize;
  const playerHeight = basePlayerSprite.height * basePlayerSprite.pixelSize;

  const initClouds = () => {
      const clouds: Cloud[] = [];
      for (let i = 0; i < 8; i++) {
          clouds.push({
              x: Math.random() * GAME_WIDTH,
              y: 20 + Math.random() * 200, 
              speedFactor: 0.1 + Math.random() * 0.2 
          });
      }
      return clouds;
  };

  const resetGame = () => {
    gameState.current = {
      frame: 0,
      playerY: GROUND_Y - playerHeight,
      playerVelY: 0,
      isJumping: false,
      jumpInputActive: false,
      appliedJumpBoost: false,
      landingFrame: 0,
      onPlatform: null,
      obstacles: [],
      clouds: initClouds(),
      speed: INITIAL_SPEED * speedMult * rabbitSpeedMult * (level > 1 ? (level > 2 ? 1.4 : 1.2) : 1.0),
      bgDistance: 0,
      score: 0,
      kibble: 0,
      health: 3,
      invincibleFrames: 0,
      gameActive: true,
      victorySequence: false,
    };
    onUpdateScore(0);
    onUpdateKibble(0);
    onUpdateHealth(3);
  };

  const handleJumpStart = () => {
    if (isPaused) return;
    const state = gameState.current;
    state.jumpInputActive = true;
    const canJump = state.playerY >= (state.onPlatform ? state.onPlatform.y - playerHeight - 5 : GROUND_Y - playerHeight - 5);
    if (canJump && !state.victorySequence && state.gameActive) {
      state.playerVelY = currentJumpStrength;
      state.isJumping = true;
      state.appliedJumpBoost = false; 
      state.onPlatform = null;
      state.landingFrame = 0; // Reset landing animation on jump
      playJumpSound(character);
    }
  };

  const handleJumpEnd = () => { gameState.current.jumpInputActive = false; };
  const handleKeyDown = (e: KeyboardEvent) => { if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); handleJumpStart(); } };
  const handleKeyUp = (e: KeyboardEvent) => { if (e.code === 'Space' || e.code === 'ArrowUp') handleJumpEnd(); };
  const handleMouseDown = () => { if (status === GameStatus.PLAYING) handleJumpStart(); };
  const handleMouseUp = () => handleJumpEnd();
  const handleTouchStart = () => { if (status === GameStatus.PLAYING) handleJumpStart(); };
  const handleTouchEnd = () => handleJumpEnd();

  useEffect(() => {
    if (status === GameStatus.PLAYING) {
      resetGame();
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      window.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchstart', handleTouchStart);
      window.addEventListener('touchend', handleTouchEnd);
    } else {
      gameState.current.gameActive = false;
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [status, level, character, difficulty]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animationFrameId: number;

    const render = () => {
      if (!gameState.current.gameActive && status !== GameStatus.PLAYING) {
          animationFrameId = requestAnimationFrame(render);
          return;
      }
      const state = gameState.current;

      if (state.gameActive && !isPaused) {
        if (state.isJumping && state.playerVelY < 0 && state.jumpInputActive && !state.appliedJumpBoost) {
            if (state.playerVelY > currentJumpStrength * 0.5) {
                state.playerVelY -= 2.0 * speedMult; 
                state.appliedJumpBoost = true;
            }
        }
        state.playerVelY += currentGravity;
        if (!state.jumpInputActive && state.playerVelY < -2 * speedMult) state.playerVelY = -2 * speedMult; 
        state.playerY += state.playerVelY;

        if (state.playerY > GROUND_Y - playerHeight) {
          if (state.playerVelY > 0.5) state.landingFrame = 8; // Trigger landing squash
          state.playerY = GROUND_Y - playerHeight;
          state.playerVelY = 0;
          state.isJumping = false;
          state.onPlatform = null;
          state.appliedJumpBoost = false;
        }

        if (state.frame % 600 === 0 && !state.victorySequence) state.speed += 0.2 * speedMult * rabbitSpeedMult; 
        if (!state.victorySequence) {
            state.bgDistance += state.speed; 
        }
        
        state.clouds.forEach(cloud => {
            if (!state.victorySequence) {
                cloud.x -= (state.speed * cloud.speedFactor) + (0.1 * speedMult);
                if (cloud.x + (CLOUD_SPRITE.width * CLOUD_SPRITE.pixelSize) < -20) {
                    cloud.x = GAME_WIDTH + 20;
                    cloud.y = 20 + Math.random() * 200;
                }
            }
        });

        if (!state.victorySequence) {
            if (state.frame % 30 === 0) { 
                state.score += 1;
                onUpdateScore(state.score);
            }
        }

        const clearPathThreshold = WIN_SCORE - 3;

        if (!state.victorySequence && state.score < clearPathThreshold) {
           const spawnRate = Math.max(30 / speedMult / rabbitSpeedMult, (90 - Math.floor(state.score * 0.3)) / speedMult / rabbitSpeedMult); 
           if (state.frame % Math.floor(spawnRate) === 0 && Math.random() > 0.1) {
             const rand = Math.random();
             let obsW = 0, obsH = 0;

             if (rand < 0.20) { 
                 const birdCount = Math.floor(Math.random() * 3) + 1;
                 const birdGap = 35; 
                 const baseBirdY = Math.random() > 0.5 ? GROUND_Y - 80 : GROUND_Y - 40;
                 for (let k = 0; k < birdCount; k++) {
                     const birdSpr = level === 1 ? BIRD_SPRITE : (level === 2 ? FALCON_SPRITE : SEAGULL_SPRITE);
                     state.obstacles.push({
                       x: GAME_WIDTH,
                       y: baseBirdY - (k * birdGap),
                       width: birdSpr.width * birdSpr.pixelSize,
                       height: birdSpr.height * birdSpr.pixelSize,
                       type: 'OBSTACLE_AIR',
                       subType: 'LOW',
                       passed: false
                     });
                 }
             } else if (rand < 0.40) {
                 const colType = Math.random() > 0.5 ? 'BONE' : 'BISCUIT';
                 const colSprite = colType === 'BONE' ? BONE_SPRITE : BISCUIT_SPRITE;
                 state.obstacles.push({
                     x: GAME_WIDTH,
                     y: GROUND_Y - (Math.random() * 100 + 30),
                     width: colSprite.width * colSprite.pixelSize,
                     height: colSprite.height * colSprite.pixelSize,
                     type: 'COLLECTIBLE',
                     subType: colType,
                     passed: false
                 });
             } else {
                 let type: Entity['type'] = 'OBSTACLE_GROUND', subType: Entity['subType'] = 'TRASH';
                 if (rand < 0.60) { 
                     type = 'PLATFORM';
                     const carRand = Math.random();
                     if (carRand < 0.25) subType = 'CAR';
                     else if (carRand < 0.50) subType = 'TAXI';
                     else if (carRand < 0.75) subType = 'POLICE';
                     else subType = 'VAN';
                     
                     if (level === 1) {
                        obsW = RED_CAR_SPRITE.width * RED_CAR_SPRITE.pixelSize;
                        obsH = RED_CAR_SPRITE.height * RED_CAR_SPRITE.pixelSize;
                     } else if (level === 2) {
                        obsW = TRACTOR_SPRITE.width * TRACTOR_SPRITE.pixelSize;
                        obsH = TRACTOR_SPRITE.height * TRACTOR_SPRITE.pixelSize;
                     } else {
                        const beachCarSpr = (subType === 'CAR' || subType === 'TAXI') ? OFFROAD_SPRITE : ATV_SPRITE;
                        obsW = beachCarSpr.width * beachCarSpr.pixelSize;
                        obsH = beachCarSpr.height * beachCarSpr.pixelSize;
                     }
                 } else if (rand < 0.70) { 
                     type = 'PLATFORM'; subType = 'CRATE';
                     const crateSpr = level === 1 ? CRATE_SPRITE : (level === 2 ? HAY_BALE_SPRITE : SANDCASTLE_SPRITE);
                     obsW = crateSpr.width * crateSpr.pixelSize;
                     obsH = crateSpr.height * crateSpr.pixelSize;
                 } else if (rand < 0.80) { 
                     type = 'PLATFORM'; subType = 'BENCH';
                     const benchSpr = level === 3 ? BEACH_CHAIR_SPRITE : BENCH_SPRITE;
                     obsW = benchSpr.width * benchSpr.pixelSize;
                     obsH = benchSpr.height * benchSpr.pixelSize;
                 } else if (rand < 0.90) { 
                     type = 'PLATFORM'; subType = 'BUSH';
                     const bushSpr = level === 1 ? BUSH_SPRITE : (level === 2 ? CHICKEN_COOP_SPRITE : BUOY_SPRITE);
                     obsW = bushSpr.width * bushSpr.pixelSize;
                     obsH = bushSpr.height * bushSpr.pixelSize;
                 } else { 
                     type = 'OBSTACLE_GROUND'; subType = 'TRASH';
                     const trashSpr = level === 1 ? TRASH_SPRITE : (level === 2 ? FENCE_SPRITE : CRAB_SPRITE);
                     obsW = trashSpr.width * trashSpr.pixelSize;
                     obsH = trashSpr.height * trashSpr.pixelSize;
                 }
                 state.obstacles.push({ x: GAME_WIDTH, y: GROUND_Y - obsH, width: obsW, height: obsH, type, subType, passed: false });
             }
           }
        }

        if (!state.victorySequence && state.score > 20 && state.score < WIN_SCORE - 20 && state.health < MAX_HEALTH) {
            if (Math.random() < 0.003) { 
                state.obstacles.push({
                    x: GAME_WIDTH,
                    y: GROUND_Y - 120, 
                    width: HEART_SPRITE.width * HEART_SPRITE.pixelSize,
                    height: HEART_SPRITE.height * HEART_SPRITE.pixelSize,
                    type: 'COLLECTIBLE',
                    subType: 'HEART',
                    passed: false
                });
            }
        }

        if (state.score >= WIN_SCORE && !state.obstacles.find(o => o.type === 'HOUSE')) {
             state.obstacles.push({
                 x: GAME_WIDTH + 50,
                 y: GROUND_Y - HOUSE_SPRITE.height * HOUSE_SPRITE.pixelSize,
                 width: HOUSE_SPRITE.width * HOUSE_SPRITE.pixelSize,
                 height: HOUSE_SPRITE.height * HOUSE_SPRITE.pixelSize,
                 type: 'HOUSE',
                 passed: false
             });
             state.victorySequence = true;
        }

        for (let i = state.obstacles.length - 1; i >= 0; i--) {
          const obs = state.obstacles[i];
          obs.x -= state.speed;
          if (state.playerVelY >= 0 && obs.type === 'PLATFORM') {
            const playerFeet = state.playerY + playerHeight;
            if (playerFeet <= obs.y + 14 && playerFeet >= obs.y - 8 && PLAYER_X < obs.x + obs.width - 5 && PLAYER_X + playerWidth > obs.x + 5) {
              if (state.playerVelY > 0.5) state.landingFrame = 8; // Trigger landing squash
              state.playerY = obs.y - playerHeight;
              state.playerVelY = 0; state.isJumping = false; state.onPlatform = obs; state.appliedJumpBoost = false;
            }
          }
          if (state.onPlatform === obs) {
            if (PLAYER_X >= obs.x + obs.width || PLAYER_X + playerWidth <= obs.x) { state.onPlatform = null; state.isJumping = true; }
          }
          if (state.onPlatform !== obs && obs.x < PLAYER_X + playerWidth - 10 && obs.x + obs.width > PLAYER_X + 10 && state.playerY < obs.y + obs.height - 5 && state.playerY + playerHeight > obs.y + 5) {
            if (obs.type === 'HOUSE') {
                saveScore(nickname, state.score * level, state.kibble);
                playVictorySound(); onVictory(); state.gameActive = false;
            } else if (obs.type === 'COLLECTIBLE') {
                if (obs.subType === 'HEART') {
                    if (state.health < MAX_HEALTH) {
                        state.health += 1;
                        onUpdateHealth(state.health);
                    }
                    playCollectSound();
                    state.obstacles.splice(i, 1);
                } else {
                    state.kibble += 1; onUpdateKibble(state.kibble); playCollectSound(); state.obstacles.splice(i, 1);
                }
            } else if (state.invincibleFrames === 0) {
                let damage = (['CAR', 'TAXI', 'VAN', 'POLICE'].includes(obs.subType!)) ? 2 : 1;
                state.health -= damage; state.invincibleFrames = 60; playCollisionSound(); onUpdateHealth(Math.max(0, state.health));
                if (state.health <= 0) { saveScore(nickname, state.score * level, state.kibble); onGameOver(); state.gameActive = false; }
            }
          }
          if (obs.x + obs.width < -150) state.obstacles.splice(i, 1);
        }
        if (state.invincibleFrames > 0) state.invincibleFrames--;
        state.frame++;
      }

      // BACKGROUND RENDERING
      let skyColor = '#60A5FA';
      if (level === 2) skyColor = '#FCD34D';
      if (level === 3) skyColor = '#38BDF8';
      
      ctx.fillStyle = skyColor;
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      state.clouds.forEach(cloud => drawSprite(ctx, CLOUD_SPRITE, cloud.x, cloud.y));
      
      const drawLayer = (layerItems: any[], speedFactor: number, isFrontCity: boolean) => {
        const totalWidth = layerItems.reduce((acc, item) => acc + item.w, 0);
        const scrollPos = (state.bgDistance * speedFactor) % totalWidth;
        let drawX = -scrollPos;
        
        while (drawX < GAME_WIDTH) {
            for (const item of layerItems) {
                if (drawX >= GAME_WIDTH) break;
                
                if (drawX + item.w > 0) {
                    ctx.fillStyle = item.color;
                    ctx.fillRect(Math.floor(drawX), GAME_HEIGHT - item.h - 80, item.w, item.h + 80);
                    
                    if (isFrontCity) {
                         ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                         for(let r = 0; r < Math.floor((item.h + 80) / 25) - 1; r++)
                            for(let c = 0; c < Math.floor(item.w / 15) - 1; c++)
                                ctx.fillRect(Math.floor(drawX) + 8 + c*15, GAME_HEIGHT - item.h - 80 + 15 + r*25, 6, 12);
                    }
                }
                drawX += item.w;
            }
        }
      };

      if (level === 3) {
        // Draw Parallax for Beach Level
        // Layer 1: Ocean/Deep Sea - moves very slowly
        const deepSeaSpeed = 0.1;
        const deepSeaOffset = (state.bgDistance * deepSeaSpeed) % GAME_WIDTH;
        ctx.fillStyle = '#0EA5E9';
        ctx.fillRect(-deepSeaOffset, GROUND_Y - 140, GAME_WIDTH, 60);
        ctx.fillRect(GAME_WIDTH - deepSeaOffset, GROUND_Y - 140, GAME_WIDTH, 60);

        // Layer 2: Wave crests - moves slightly faster
        const waveSpeed = 0.2;
        const waveOffset = (state.bgDistance * waveSpeed) % GAME_WIDTH;
        ctx.fillStyle = '#7DD3FC';
        ctx.fillRect(-waveOffset, GROUND_Y - 100, GAME_WIDTH, 20);
        ctx.fillRect(GAME_WIDTH - waveOffset, GROUND_Y - 100, GAME_WIDTH, 20);

        // Layer 3: Palm Trees - moves faster (foreground background)
        const palmSpeed = 0.5;
        const palmOffset = (state.bgDistance * palmSpeed) % PALMS_WIDTH;
        let drawPalmX = -palmOffset;
        
        // Loop palms to cover screen
        while (drawPalmX < GAME_WIDTH) {
            PALMS_PATTERN.forEach(p => {
               const pX = drawPalmX + p.x;
               if (pX + 100 > -50 && pX < GAME_WIDTH) {
                   drawSprite(ctx, PALM_TREE_SPRITE, pX, GROUND_Y - (PALM_TREE_SPRITE.height * PALM_TREE_SPRITE.pixelSize));
               }
            });
            drawPalmX += PALMS_WIDTH;
        }

      } else {
        // Draw Parallax for City and Rural
        const layers = level === 1 ? CITY_LAYERS : RURAL_LAYERS;
        layers.forEach((layer, index) => {
            const isFrontCity = level === 1 && index === 1;
            drawLayer(layer.items, layer.speed, isFrontCity);
        });
      }

      let groundColor = '#1F2937';
      if (level === 2) groundColor = '#78350F';
      if (level === 3) groundColor = '#FDE68A'; // Sand
      
      ctx.fillStyle = groundColor;
      ctx.fillRect(0, GROUND_Y, GAME_WIDTH, GAME_HEIGHT - GROUND_Y);
      
      state.obstacles.forEach(obs => {
        if (obs.type === 'HOUSE') drawSprite(ctx, HOUSE_SPRITE, obs.x, obs.y);
        else if (obs.subType === 'TRASH') {
            const spr = level === 1 ? TRASH_SPRITE : (level === 2 ? FENCE_SPRITE : CRAB_SPRITE);
            drawSprite(ctx, spr, obs.x, obs.y);
        }
        else if (['CAR', 'TAXI', 'POLICE', 'VAN'].includes(obs.subType!)) {
            let vehicleSprite = RED_CAR_SPRITE;
            if (level === 1) {
                vehicleSprite = obs.subType === 'CAR' ? RED_CAR_SPRITE : 
                                obs.subType === 'TAXI' ? TAXI_CAR_SPRITE : 
                                obs.subType === 'POLICE' ? POLICE_CAR_SPRITE : VAN_SPRITE;
            } else if (level === 2) {
                vehicleSprite = TRACTOR_SPRITE;
            } else {
                // Fixed Beach Vehicle assignment to subtypes to prevent flickering and separate Car from ATV
                vehicleSprite = (obs.subType === 'CAR' || obs.subType === 'TAXI') ? OFFROAD_SPRITE : ATV_SPRITE;
            }
            drawSprite(ctx, vehicleSprite, obs.x, obs.y);
        }
        else if (obs.subType === 'BUSH') {
            const spr = level === 1 ? BUSH_SPRITE : (level === 2 ? CHICKEN_COOP_SPRITE : BUOY_SPRITE);
            drawSprite(ctx, spr, obs.x, obs.y);
        }
        else if (obs.subType === 'BENCH') {
            const spr = level === 3 ? BEACH_CHAIR_SPRITE : BENCH_SPRITE;
            drawSprite(ctx, spr, obs.x, obs.y);
        }
        else if (obs.subType === 'CRATE') {
            const spr = level === 1 ? CRATE_SPRITE : (level === 2 ? HAY_BALE_SPRITE : SANDCASTLE_SPRITE);
            drawSprite(ctx, spr, obs.x, obs.y);
        }
        else if (obs.subType === 'BONE') drawSprite(ctx, BONE_SPRITE, obs.x, obs.y);
        else if (obs.subType === 'BISCUIT') drawSprite(ctx, BISCUIT_SPRITE, obs.x, obs.y);
        else if (obs.subType === 'HEART') drawSprite(ctx, HEART_SPRITE, obs.x, obs.y);
        else if (obs.type === 'OBSTACLE_AIR') {
            let birdSprite;
            if (level === 1) {
                birdSprite = (Math.floor(state.frame / 8) % 2 === 0) ? BIRD_SPRITE : BIRD_SPRITE_FLAP;
            } else if (level === 2) {
                birdSprite = (Math.floor(state.frame / 8) % 2 === 0) ? FALCON_SPRITE : FALCON_SPRITE_FLAP;
            } else {
                birdSprite = (Math.floor(state.frame / 8) % 2 === 0) ? SEAGULL_SPRITE : SEAGULL_SPRITE_FLAP;
            }
            drawSprite(ctx, birdSprite, obs.x, obs.y);
        }
      });

      if (state.invincibleFrames % 10 < 5) {
        const isRunning = Math.floor(state.frame / 6) % 2 === 0;
        const activeSprite = state.isJumping ? runPlayerSprite : (isRunning ? runPlayerSprite : basePlayerSprite);
        
        if (state.landingFrame > 0) {
            state.landingFrame--;
            // Simple squash and stretch animation: wider and shorter
            const progress = state.landingFrame / 8; // Normalized progress 1.0 -> 0.0
            const squashFactor = progress * 0.3; // Max 30% squash at impact
            
            const scaleX = 1 + squashFactor;
            const scaleY = 1 - squashFactor;
            
            // Pivot point is bottom-center of the sprite to keep feet on ground
            const pivotX = PLAYER_X + playerWidth / 2;
            const pivotY = state.playerY + playerHeight;
            
            ctx.save();
            ctx.translate(pivotX, pivotY);
            ctx.scale(scaleX, scaleY);
            ctx.translate(-pivotX, -pivotY);
            
            drawSprite(ctx, activeSprite, PLAYER_X, state.playerY);
            
            ctx.restore();
        } else {
            drawSprite(ctx, activeSprite, PLAYER_X, state.playerY);
        }
      }
      animationFrameId = requestAnimationFrame(render);
    };
    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [status, basePlayerSprite, runPlayerSprite, onGameOver, onVictory, onUpdateScore, onUpdateHealth, onUpdateKibble, nickname, playerWidth, playerHeight, character, difficulty, level, isPaused]);

  return (
    <canvas
      ref={canvasRef}
      width={GAME_WIDTH}
      height={GAME_HEIGHT}
      style={{ objectFit: 'contain', width: '100%', height: '100%', imageRendering: 'pixelated' }}
      className="bg-[#111827]"
    />
  );
};

export default GameCanvas;
