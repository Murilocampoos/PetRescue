
import { SpriteMap } from './types';

export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 400;
export const GRAVITY = 0.6;
export const JUMP_STRENGTH = -12;
export const GROUND_Y = 320;
export const INITIAL_SPEED = 5;
export const MAX_HEALTH = 3;
export const WIN_SCORE = 100;

// Pixel Art Bitmaps (0 = transparent, 1 = main color, 2 = secondary, 3 = detail)

// --- DOG ---
// Frame 1 (Standing / Mid-stride)
export const DOG_SPRITE: SpriteMap = {
  pixelSize: 4,
  width: 10,
  height: 8,
  palette: { 1: '#D97706', 2: '#92400E', 3: '#000000' }, // Amber-600
  data: [
    0,0,0,0,0,1,1,1,0,0,
    0,0,0,0,1,1,1,3,1,0,
    0,0,0,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,1,1, // Body
    1,1,1,1,1,1,1,1,1,1, // Body
    1,1,1,1,1,1,1,0,0,0, // Lower Body
    0,1,0,0,0,0,0,1,0,0, // Legs (Inner)
    0,1,0,0,0,0,0,1,0,0, // Feet
  ]
};

// Frame 2 (Running / Splayed)
export const DOG_SPRITE_RUN: SpriteMap = {
  ...DOG_SPRITE,
  data: [
    0,0,0,0,0,1,1,1,0,0,
    0,0,0,0,1,1,1,3,1,0,
    0,0,0,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,0,0,0,
    1,0,0,0,0,0,0,0,1,0, // Legs (Outer/Splayed)
    1,0,0,0,0,0,0,0,1,0, // Feet
  ]
};

// --- CAT ---
// Frame 1
export const CAT_SPRITE: SpriteMap = {
  pixelSize: 4,
  width: 10,
  height: 8,
  palette: { 1: '#F97316', 2: '#C2410C', 3: '#000000' }, // Orange-500
  data: [
    0,0,0,0,0,1,0,1,0,0,
    0,0,0,0,1,1,1,1,1,0,
    0,0,0,1,1,1,3,1,3,0,
    0,0,1,1,1,1,1,1,1,0,
    1,1,1,1,1,1,1,1,1,0,
    1,1,1,1,1,1,1,0,0,0,
    0,1,0,0,0,0,0,1,0,0,
    0,1,0,0,0,0,0,1,0,0,
  ]
};

// Frame 2
export const CAT_SPRITE_RUN: SpriteMap = {
  ...CAT_SPRITE,
  data: [
    0,0,0,0,0,1,0,1,0,0,
    0,0,0,0,1,1,1,1,1,0,
    0,0,0,1,1,1,3,1,3,0,
    0,0,1,1,1,1,1,1,1,0,
    1,1,1,1,1,1,1,1,1,0,
    1,1,1,1,1,1,1,0,0,0,
    1,0,0,0,0,0,0,0,1,0,
    1,0,0,0,0,0,0,0,1,0,
  ]
};

export const TRASH_SPRITE: SpriteMap = {
  pixelSize: 4,
  width: 8,
  height: 10,
  palette: { 1: '#4B5563', 2: '#10B981', 3: '#1F2937' }, // Gray, Green, Dark Gray
  data: [
    0,1,1,1,1,1,0,0,
    1,1,3,3,3,1,1,0,
    1,2,2,2,2,2,1,0,
    1,2,1,2,1,2,1,0,
    1,2,1,2,1,2,1,0,
    1,2,1,2,1,2,1,0,
    1,2,1,2,1,2,1,0,
    1,1,1,1,1,1,1,0,
    0,0,0,0,0,0,0,0,
    0,0,0,0,0,0,0,0,
  ]
};

export const BIRD_SPRITE: SpriteMap = {
  pixelSize: 4,
  width: 10,
  height: 6,
  palette: { 1: '#9CA3AF', 2: '#FFFFFF', 3: '#FCD34D' }, // Gray, White, Beak
  data: [
    0,0,0,0,0,1,1,1,0,0,
    0,0,0,0,1,2,3,3,0,0,
    1,1,1,1,1,1,1,0,0,0,
    0,1,1,1,1,1,0,0,0,0,
    0,0,1,0,0,1,0,0,0,0,
    0,0,0,0,0,0,0,0,0,0,
  ]
};

export const HOUSE_SPRITE: SpriteMap = {
  pixelSize: 5,
  width: 16,
  height: 16,
  palette: { 1: '#DC2626', 2: '#FEF3C7', 3: '#4B5563', 4: '#7C2D12' }, // Red roof, cream walls, door
  data: [
    0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,
    0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,
    0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,
    0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,
    0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,
    0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,
    0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,
    1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
    0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0,
    0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0,
    0,2,2,2,4,4,4,4,4,4,4,2,2,2,2,0,
    0,2,2,2,4,4,4,4,4,4,4,2,2,2,2,0,
    0,2,2,2,4,4,4,4,4,4,4,2,2,2,2,0,
    0,2,2,2,4,4,4,4,4,4,4,2,2,2,2,0,
    0,2,2,2,4,4,4,4,4,4,4,2,2,2,2,0,
    1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
  ]
};
