import { GameState } from './Game_v2';
import DamageText from './DamageText';

export interface IceStormConfig {
  radius: number;
  duration: number;
  damagePerSecond: number;
  slowFactor: number;
  frostExplosion: boolean;
  freezeDuration: number;
  freezeDotDamagePerSecond: number;
  freezeDotStackLimit: number;
}

export default class IceStorm {
  public x: number;
  public y: number;
  public radius: number;
  public isFinished: boolean = false;

  private duration: number;
  private elapsed: number = 0;
  private damagePerSecond: number;
  private slowFactor: number;
  private frostExplosion: boolean;
  private freezeDuration: number;
  private freezeDotDamagePerSecond: number;
  private freezeDotStackLimit: number;
  private damageTickInterval: number = 0.5;
  private damageTickTimer: number = 0;
  private frostExplosionInterval: number = 0.8;
  private frostTimer: number = 0;
  private onFinish?: () => void;
  private initialFreezeApplied: boolean = false;

  constructor(x: number, y: number, config: IceStormConfig, onFinish?: () => void) {
    this.x = x;
    this.y = y;
    this.radius = config.radius;
    this.duration = config.duration;
    this.damagePerSecond = config.damagePerSecond;
    this.slowFactor = config.slowFactor;
    this.frostExplosion = config.frostExplosion;
    this.freezeDuration = config.freezeDuration;
    this.freezeDotDamagePerSecond = config.freezeDotDamagePerSecond;
    this.freezeDotStackLimit = config.freezeDotStackLimit;
    this.onFinish = onFinish;
  }

  update(deltaTime: number, state: GameState): void {
    if (this.isFinished) return;

    this.elapsed += deltaTime;
    this.damageTickTimer += deltaTime;
    this.frostTimer += deltaTime;

    for (const enemy of state.enemies) {
      if (enemy.isDead) continue;
      const dx = enemy.x + enemy.width / 2 - this.x;
      const dy = enemy.y + enemy.height / 2 - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > this.radius) continue;
      if (!this.initialFreezeApplied && this.freezeDuration > 0) {
        enemy.applyFreeze(this.freezeDuration, this.freezeDotDamagePerSecond, this.freezeDotStackLimit);
      }
      if (this.slowFactor > 0) {
        enemy.applySlow(0.6, this.slowFactor);
      }
    }
    if (!this.initialFreezeApplied) {
      this.initialFreezeApplied = true;
    }

    while (this.damageTickTimer >= this.damageTickInterval) {
      this.damageTickTimer -= this.damageTickInterval;
      const damage = this.damagePerSecond * this.damageTickInterval;
      for (const enemy of state.enemies) {
        if (enemy.isDead) continue;
        const dx = enemy.x + enemy.width / 2 - this.x;
        const dy = enemy.y + enemy.height / 2 - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= this.radius) {
          enemy.takeDamage(damage);
          state.damageTexts.push(new DamageText(enemy.x, enemy.y, damage, false));
        }
      }
    }

    if (this.frostExplosion) {
      while (this.frostTimer >= this.frostExplosionInterval) {
        this.frostTimer -= this.frostExplosionInterval;
        for (const enemy of state.enemies) {
          if (enemy.isDead) continue;
          const dx = enemy.x + enemy.width / 2 - this.x;
          const dy = enemy.y + enemy.height / 2 - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= this.radius && Math.random() < 0.3) {
            enemy.applyFreeze(this.freezeDuration, this.freezeDotDamagePerSecond, this.freezeDotStackLimit);
          }
        }
      }
    }

    if (this.elapsed >= this.duration) {
      this.isFinished = true;
      if (this.onFinish) {
        this.onFinish();
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (this.isFinished) return;
    const lifeRatio = Math.max(0, 1 - this.elapsed / this.duration);
    ctx.save();
    ctx.globalAlpha = 0.3 + 0.4 * lifeRatio;
    const gradient = ctx.createRadialGradient(this.x, this.y, this.radius * 0.2, this.x, this.y, this.radius);
    gradient.addColorStop(0, 'rgba(210, 245, 255, 0.9)');
    gradient.addColorStop(0.6, 'rgba(140, 205, 255, 0.4)');
    gradient.addColorStop(1, 'rgba(80, 150, 255, 0.15)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 0.25 + 0.25 * lifeRatio;
    ctx.strokeStyle = 'rgba(120, 200, 255, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = 0.35 + 0.2 * lifeRatio;
    ctx.strokeStyle = 'rgba(200, 245, 255, 0.7)';
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6;
      const inner = this.radius * 0.35;
      const outer = this.radius * 0.92;
      const ix = this.x + Math.cos(angle) * inner;
      const iy = this.y + Math.sin(angle) * inner;
      const ox = this.x + Math.cos(angle) * outer;
      const oy = this.y + Math.sin(angle) * outer;
      ctx.beginPath();
      ctx.moveTo(ix, iy);
      ctx.lineTo(ox, oy);
      ctx.stroke();
    }
    ctx.restore();
  }
}
