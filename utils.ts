
import { CharacterType, LeaderboardEntry, SpriteMap } from './types';

const STORAGE_KEY = 'pet_rescue_leaderboard';

// Database Connection Information (Provided)
// Host: db.xtkzesqtjmoifyastnbk.supabase.co
// User: postgres
// Pass: QuantIT@2025
// Port: 5432
// Note: Browsers cannot connect directly to PostgreSQL via TCP. 
// A backend API would be required to securely handle these credentials.
// For this client-side application, we persist data to LocalStorage.

export const getLeaderboard = (): LeaderboardEntry[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const saveScore = (name: string, score: number) => {
  const current = getLeaderboard();
  current.push({ name, score, date: new Date().toISOString() });
  current.sort((a, b) => b.score - a.score); // Descending
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current.slice(0, 10))); // Keep top 10
  
  console.log(`Saved score for ${name}: ${score} (Local Storage)`);
};

// Draw pixel sprite to canvas
export const drawSprite = (
  ctx: CanvasRenderingContext2D,
  sprite: SpriteMap,
  x: number,
  y: number,
  scale: number = 1
) => {
  const pixelSize = sprite.pixelSize * scale;
  
  sprite.data.forEach((colorCode, index) => {
    if (colorCode === 0) return; // Transparent

    const col = index % sprite.width;
    const row = Math.floor(index / sprite.width);
    const color = sprite.palette[colorCode];

    ctx.fillStyle = color;
    ctx.fillRect(x + col * pixelSize, y + row * pixelSize, pixelSize, pixelSize);
  });
};

// --- AUDIO SYSTEM (Web Audio API) ---

let audioCtx: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioCtx) {
    // Use standard AudioContext
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

export const playJumpSound = (character: CharacterType) => {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    const now = ctx.currentTime;
    
    if (character === CharacterType.DOG) {
        // 8-bit Bark: Square wave, rapid pitch drop
        osc.type = 'square';
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        
        osc.start(now);
        osc.stop(now + 0.1);
    } else {
        // 8-bit Meow: Sawtooth, pitch rises then falls
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.linearRampToValueAtTime(700, now + 0.1);
        osc.frequency.linearRampToValueAtTime(500, now + 0.2);
        
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.2);
        
        osc.start(now);
        osc.stop(now + 0.2);
    }
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

export const playCollisionSound = () => {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    const now = ctx.currentTime;
    
    // Hit: Low frequency noise/crunch simulation
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(10, now + 0.15);
    
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    osc.start(now);
    osc.stop(now + 0.15);
  } catch (e) {}
};

export const playVictorySound = () => {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    
    const now = ctx.currentTime;
    // Calm Melody: C4 - E4 - G4 - C5 - G4 - E4 (Approx 3 seconds sustain)
    const notes = [
        { f: 261.63, start: 0, dur: 0.5 },   // C4
        { f: 329.63, start: 0.4, dur: 0.5 }, // E4
        { f: 392.00, start: 0.8, dur: 0.5 }, // G4
        { f: 523.25, start: 1.2, dur: 2.0 }, // C5 (Long)
    ];
    
    notes.forEach(note => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        // Triangle wave is softer/calmer than square
        osc.type = 'triangle'; 
        osc.frequency.setValueAtTime(note.f, now + note.start);
        
        const startTime = now + note.start;
        const stopTime = startTime + note.dur;
        
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.1, startTime + 0.1); // Attack
        gain.gain.setValueAtTime(0.1, stopTime - 0.1);
        gain.gain.linearRampToValueAtTime(0, stopTime); // Release
        
        osc.start(startTime);
        osc.stop(stopTime);
    });
    
  } catch (e) {}
};
