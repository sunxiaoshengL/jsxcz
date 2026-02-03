import citySuburb from '../assets/bgImage/citySuburb.png';
import convenienceMarket from '../assets/bgImage/convenienceMarket.png';
import riversideWalk from '../assets/bgImage/riversideWalk.png';
import musicSquare from '../assets/bgImage/musicSquare.png';
import warehouseCenter from '../assets/bgImage/warehouseCenter.png';
import intercityViaduct from '../assets/bgImage/intercityViaduct.png';
import sportsPark from '../assets/bgImage/sportsPark.png';
import riverCrossingBridge from '../assets/bgImage/riverCrossingBridge.png';
import techPark from '../assets/bgImage/techPark.png';
import intercityStation from '../assets/bgImage/intercityStation.png';

export interface LevelData {
  id: number;
  name: string;
  unlocked: boolean;
  bestHealth: number; // -1: not cleared, 0-100: cleared with health %
}

const LEVEL_NAMES = [
  "城郊街区",
  "便民市场",
  "滨河步道",
  "音乐广场",
  "仓储中心",
  "城际高架",
  "体育公园",
  "跨江大桥",
  "科技园区",
  "城际车站"
];

const LEVEL_IMAGES = [
  citySuburb,
  convenienceMarket,
  riversideWalk,
  musicSquare,
  warehouseCenter,
  intercityViaduct,
  sportsPark,
  riverCrossingBridge,
  techPark,
  intercityStation
];

const STORAGE_KEY = 'zj_survivor_progress_v1';

export default class LevelManager {
  private static instance: LevelManager;
  private levels: LevelData[] = [];
  private currentLevelIndex: number = 0;

  private constructor() {
    this.load();
  }

  public static getInstance(): LevelManager {
    if (!LevelManager.instance) {
      LevelManager.instance = new LevelManager();
    }
    return LevelManager.instance;
  }

  private load(): void {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        this.levels = data.levels || [];
        this.currentLevelIndex = data.currentLevelIndex || 0;
        
        // Validate levels count, if mismatch (update), re-init missing ones
        if (this.levels.length !== LEVEL_NAMES.length) {
          this.initLevels();
        }
      } catch (e) {
        this.initLevels();
      }
    } else {
      this.initLevels();
    }
  }

  private initLevels(): void {
    this.levels = LEVEL_NAMES.map((name, index) => ({
      id: index + 1,
      name,
      unlocked: index === 0, // Only first level unlocked by default
      bestHealth: -1
    }));
    this.currentLevelIndex = 0;
    this.save();
  }

  public save(): void {
    const data = {
      levels: this.levels,
      currentLevelIndex: this.currentLevelIndex
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  public getLevels(): LevelData[] {
    return this.levels;
  }

  public getCurrentLevel(): LevelData {
    return this.levels[this.currentLevelIndex];
  }

  public setCurrentLevel(index: number): void {
    if (index >= 0 && index < this.levels.length) {
      this.currentLevelIndex = index;
      this.save();
    }
  }

  public getLevelBackgroundImage(levelId: number): string {
    const index = levelId - 1;
    if (index >= 0 && index < LEVEL_IMAGES.length) {
      return LEVEL_IMAGES[index];
    }
    return LEVEL_IMAGES[0]; // Fallback to first level
  }

  public completeLevel(levelId: number, healthPercent: number): void {
    const levelIndex = this.levels.findIndex(l => l.id === levelId);
    if (levelIndex === -1) return;

    const level = this.levels[levelIndex];
    
    // Update best health record
    if (healthPercent > level.bestHealth) {
      level.bestHealth = healthPercent;
    }

    // Unlock next level
    const nextLevelIndex = levelIndex + 1;
    if (nextLevelIndex < this.levels.length) {
      if (!this.levels[nextLevelIndex].unlocked) {
        this.levels[nextLevelIndex].unlocked = true;
      }
    }

    this.save();
  }

  public isLevelUnlocked(index: number): boolean {
    if (index >= 0 && index < this.levels.length) {
      return this.levels[index].unlocked;
    }
    return false;
  }
}
