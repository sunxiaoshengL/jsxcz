import { GameState } from './Game_v2';
import Enemy from './Enemy';

export default class Spawner {
  private state: GameState;
  private spawnTimer: number = 0;
  private spawnInterval: number = 2;
  private densityMultiplier: number = 1;
  private eliteSpawned: boolean = false;
  private bossSpawned: boolean = false;
  private gameAreaX: number;
  private gameAreaY: number;
  private gameAreaWidth: number;

  constructor(state: GameState, gameAreaX: number = 60, gameAreaY: number = 100, gameAreaWidth: number = 420) {
    this.state = state;
    this.gameAreaX = gameAreaX;
    this.gameAreaY = gameAreaY;
    this.gameAreaWidth = gameAreaWidth;
  }

  update(deltaTime: number): void {
    this.spawnTimer += deltaTime;

    const level = this.state.level || 1;
    const cappedLevel = Math.max(1, Math.min(level, 20));

    this.spawnInterval = 1.5;

    let frequencyMultiplier = 1;
    if (cappedLevel <= 1) {
      frequencyMultiplier = 1;
    } else if (cappedLevel <= 5) {
      const t = (cappedLevel - 1) / 4;
      frequencyMultiplier = 1 + t * (2 - 1);
    } else if (cappedLevel <= 10) {
      const t = (cappedLevel - 5) / 5;
      frequencyMultiplier = 2 + t * (3 - 2);
    } else if (cappedLevel <= 15) {
      const t = (cappedLevel - 10) / 5;
      frequencyMultiplier = 3 + t * (4 - 3);
    } else {
      const t = (cappedLevel - 15) / 5;
      frequencyMultiplier = 4 + t * (5 - 4);
    }
    this.densityMultiplier = frequencyMultiplier;

    // 精英 / Boss 存在期间降低普通怪刷新频率
    const eliteAlive = this.state.enemies.some(e => e.isElite && !e.isDead);
    const bossAlive = this.state.enemies.some(e => e.isBoss && !e.isDead);
    let effectiveInterval = Math.max(0.3, this.spawnInterval / this.densityMultiplier);
    if (eliteAlive) effectiveInterval *= 1.5;
    if (bossAlive) effectiveInterval *= 2.0;

    if (this.spawnTimer >= effectiveInterval) {
      this.spawnEnemy();
      this.spawnTimer = 0;
    }

    // 到达阈值生成精英 / Boss（仅一次）
    if (level >= 8 && !this.eliteSpawned) {
      this.spawnSpecial(3); // 精英怪
      this.eliteSpawned = true;
    }
    if (level >= 14 && !this.bossSpawned) {
      this.spawnSpecial(4); // Boss
      this.bossSpawned = true;
    }
  }

  private spawnEnemy(): void {
    // 在游戏区域内随机生成敌人
    const minX = this.gameAreaX + 20;
    const maxX = this.gameAreaX + this.gameAreaWidth - 60;
    const x = Math.random() * (maxX - minX) + minX;
    const y = this.gameAreaY;
    const level = this.state.level || 1;
    const type = Math.random() < (level >= 15 ? 0.2 : 0.3) ? 2 : 1;
    const cappedLevel = Math.max(1, Math.min(level, 20));
    let healthMultiplier = 1;
    if (cappedLevel <= 1) {
      healthMultiplier = 1;
    } else if (cappedLevel <= 5) {
      const t = (cappedLevel - 1) / 4;
      healthMultiplier = 1 + t * (3 - 1);
    } else if (cappedLevel <= 10) {
      const t = (cappedLevel - 5) / 5;
      healthMultiplier = 3 + t * (8 - 3);
    } else if (cappedLevel <= 15) {
      const t = (cappedLevel - 11) / 4;
      healthMultiplier = 12 + t * (15 - 12);
    } else {
      const t = (cappedLevel - 16) / 4;
      healthMultiplier = 15 + t * (20 - 15);
    }

    const enemy = new Enemy(x, y, type, healthMultiplier);
    const speedBoost =
      level <= 6 ? 0.15 :
      level <= 14 ? 0.10 :
      0.03;
    if (!enemy.isElite && !enemy.isBoss) {
      enemy.speed += speedBoost;
    }
    this.state.enemies.push(enemy);
  }

  private spawnSpecial(type: number): void {
    const minX = this.gameAreaX + 20;
    const maxX = this.gameAreaX + this.gameAreaWidth - 60;
    const x = Math.random() * (maxX - minX) + minX;
    const y = this.gameAreaY;
    const level = this.state.level || 1;
    // 特殊怪仍然采用当前健康倍率，便于随时间微调但不爆炸
    let healthMultiplier = 1;
    if (level <= 6) {
      healthMultiplier = 2.0;
    } else if (level <= 14) {
      healthMultiplier = 1.2;
    } else {
      healthMultiplier = 1.0;
    }
    const enemy = new Enemy(x, y, type, healthMultiplier);
    this.state.enemies.push(enemy);
  }

  reset(): void {
    this.spawnTimer = 0;
    this.spawnInterval = 2;
    this.eliteSpawned = false;
    this.bossSpawned = false;
  }
}
