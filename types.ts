
export enum GameStatus {
  SPLASH = 'SPLASH',
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY'
}

export enum CharacterType {
  DOG = 'DOG', // Cachorro Caramelo
  CAT = 'CAT',  // Gato Laranja
  RABBIT = 'RABBIT' // Coelho Branco Secreto
}

export enum Difficulty {
  NORMAL = 'NORMAL',
  HARD = 'HARD'
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  kibble: number;
  date: string;
}

export interface SoundSettings {
  animalSounds: boolean;
  systemSounds: boolean;
}

export interface GameState {
  status: GameStatus;
  score: number;
  health: number; // Max 3
  nickname: string;
  character: CharacterType;
  difficulty: Difficulty;
  level: number;
}

export interface SpriteMap {
  pixelSize: number;
  width: number;
  height: number;
  palette: { [key: number]: string };
  data: number[];
}
