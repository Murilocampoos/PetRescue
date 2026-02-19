
import { CharacterType, LeaderboardEntry, SpriteMap, SoundSettings } from './types';

const STORAGE_KEY = 'pet_rescue_leaderboard';
const SETTINGS_KEY = 'pet_rescue_settings';
const PROGRESS_KEY = 'pet_rescue_unlocked_level';
const GALLERY_KEY = 'pet_rescue_gallery';

export const getSoundSettings = (): SoundSettings => {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    return data ? JSON.parse(data) : { animalSounds: true, systemSounds: true };
  } catch (e) {
    return { animalSounds: true, systemSounds: true };
  }
};

export const saveSoundSettings = (settings: SoundSettings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const getUnlockedLevel = (): number => {
  try {
    const data = localStorage.getItem(PROGRESS_KEY);
    return data ? parseInt(data, 10) : 1;
  } catch (e) {
    return 1;
  }
};

export const saveUnlockedLevel = (level: number) => {
  const current = getUnlockedLevel();
  if (level > current) {
    localStorage.setItem(PROGRESS_KEY, level.toString());
  }
};

export const getUnlockedPhotos = (): string[] => {
  try {
    const data = localStorage.getItem(GALLERY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const unlockPhoto = (photoId: string) => {
  const current = getUnlockedPhotos();
  if (!current.includes(photoId)) {
    current.push(photoId);
    localStorage.setItem(GALLERY_KEY, JSON.stringify(current));
  }
};

export const getLeaderboard = (): LeaderboardEntry[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.warn("Could not read leaderboard from storage", e);
    return [];
  }
};

export const saveScore = (name: string, score: number, kibble: number) => {
  try {
    const current = getLeaderboard();
    current.push({ name, score, kibble, date: new Date().toISOString() });
    current.sort((a, b) => b.score - a.score); 
    const top10 = current.slice(0, 10);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(top10));
  } catch (e) {
    console.error("Failed to save score to storage", e);
  }
};

export const drawSprite = (
  ctx: CanvasRenderingContext2D,
  sprite: SpriteMap,
  x: number,
  y: number,
  scale: number = 1
) => {
  const pixelSize = sprite.pixelSize * scale;
  sprite.data.forEach((colorCode, index) => {
    if (colorCode === 0) return;
    const col = index % sprite.width;
    const row = Math.floor(index / sprite.width);
    const color = sprite.palette[colorCode];
    ctx.fillStyle = color;
    ctx.fillRect(x + col * pixelSize, y + row * pixelSize, pixelSize, pixelSize);
  });
};

export const downloadImage = async (url: string) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = 'pet_rescue_photo.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  } catch (e) {
    window.open(url, '_blank');
  }
};

let audioCtx: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

export const playJumpSound = (character: CharacterType) => {
  const settings = getSoundSettings();
  if (!settings.animalSounds) return;

  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    
    if (character === CharacterType.DOG) {
        // Bark (Low Square)
        osc.type = 'square';
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (character === CharacterType.CAT) {
        // Meow (Mid Sawtooth)
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.linearRampToValueAtTime(700, now + 0.1);
        osc.frequency.linearRampToValueAtTime(500, now + 0.2);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
    } else {
        // Rabbit Squeak (High Sine/Square)
        osc.type = 'square';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    }
  } catch (e) {}
};

export const playCollisionSound = () => {
  const settings = getSoundSettings();
  if (!settings.systemSounds) return;

  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(10, now + 0.15);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc.start(now);
    osc.stop(now + 0.15);
  } catch (e) {}
};

export const playCollectSound = () => {
  const settings = getSoundSettings();
  if (!settings.systemSounds) return;

  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.start(now);
    osc.stop(now + 0.1);
  } catch (e) {}
};

export const playVictorySound = () => {
  const settings = getSoundSettings();
  if (!settings.systemSounds) return;

  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    const notes = [
        { f: 261.63, start: 0, dur: 0.5 },
        { f: 329.63, start: 0.4, dur: 0.5 },
        { f: 392.00, start: 0.8, dur: 0.5 },
        { f: 523.25, start: 1.2, dur: 2.0 },
    ];
    notes.forEach(note => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle'; 
        osc.frequency.setValueAtTime(note.f, now + note.start);
        const startTime = now + note.start;
        const stopTime = startTime + note.dur;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.1, startTime + 0.1);
        gain.gain.setValueAtTime(0.1, stopTime - 0.1);
        gain.gain.linearRampToValueAtTime(0, stopTime);
        osc.start(startTime);
        osc.stop(stopTime);
    });
  } catch (e) {}
};

export const playShutterSound = () => {
  const settings = getSoundSettings();
  if (!settings.systemSounds) return;

  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    
    const bufferSize = ctx.sampleRate * 0.15; // 150ms of noise
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Create white noise
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const gain = ctx.createGain();
    
    // Highpass filter to make it sound more crisp/mechanical
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1000;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    noise.start();
  } catch (e) {
      console.error("Audio error", e);
  }
};
