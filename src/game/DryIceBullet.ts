import Bullet from './Bullet';
import Enemy from './Enemy';
import { GameState } from './Game_v2';
import IceStorm from './IceStorm';

interface DryIceConfig {
  freezeOnHit: boolean;
  freezeDuration: number;
  frostbiteDamagePerSecond: number;
  frostbiteDuration: number;
  frostbiteStackLimit: number;
  scatterOnHit: boolean;
  scatterCount: number;
  scatterDamageMultiplier: number;
  scatterFreezeDuration: number;
  bonusDamageMultiplierAgainstStunned: number;
  returnOnEdge: boolean;
  iceStormLink: boolean;
  zeroDegreeStorm: boolean;
  zeroDegreeHitThreshold: number;
  frostPath: boolean;
  frostPathRadius: number;
  frostPathTickInterval: number;
  frostPathSlowFactor: number;
  ultimate: boolean;
  ultimateSplitCount: number;
  ultimateSplitDamageMultiplier: number;
  ultimateSplitFreezeDuration: number;
  sizeMultiplier: number;
}

export default class DryIceBullet extends Bullet {
  private config: DryIceConfig;
  private state: GameState;
  private hasReturned: boolean = false;
  private scatterTriggered: boolean = false;
  private ultimateSplitTriggered: boolean = false;
  private iceStormLinkTriggered: boolean = false;
  private frostPathTimer: number = 0;

  constructor(
    state: GameState,
    x: number,
    y: number,
    speed: number,
    damage: number,
    config: DryIceConfig,
    target?: Enemy,
    angle: number = 0
  ) {
    super(x, y, speed, damage, target, angle);
    this.state = state;
    this.config = config;
    this.width = 6 * config.sizeMultiplier;
    this.height = 10 * config.sizeMultiplier;
    this.isIce = true;
    this.bonusDamageMultiplierAgainstStunned = config.bonusDamageMultiplierAgainstStunned;
  }

  update(deltaTime: number): void {
    if (this.target && !this.target.isDead) {
      const dx = this.target.x + this.target.width / 2 - (this.x + this.width / 2);
      const dy = this.target.y + this.target.height / 2 - (this.y + this.height / 2);
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > 0) {
        const normalizedDx = dx / distance;
        const normalizedDy = dy / distance;
        this.x += normalizedDx * this.trackingSpeed * deltaTime * 60;
        this.y += normalizedDy * this.trackingSpeed * deltaTime * 60;
        this.angle = Math.atan2(dy, dx) + Math.PI / 2;
      }
    } else {
      this.x += Math.sin(this.angle) * this.speed * deltaTime * 60;
      this.y -= Math.cos(this.angle) * this.speed * deltaTime * 60;
    }

    if (this.config.frostPath) {
      this.frostPathTimer += deltaTime;
      if (this.frostPathTimer >= this.config.frostPathTickInterval) {
        this.frostPathTimer = 0;
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        for (const enemy of this.state.enemies) {
          if (enemy.isDead) continue;
          const dx = enemy.x + enemy.width / 2 - cx;
          const dy = enemy.y + enemy.height / 2 - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= this.config.frostPathRadius) {
            enemy.applySlow(0.8, this.config.frostPathSlowFactor);
            if (this.config.frostbiteDamagePerSecond > 0) {
              enemy.applyFrostbite(
                this.config.frostbiteDamagePerSecond,
                this.config.frostbiteDuration,
                this.config.frostbiteStackLimit
              );
            }
          }
        }
      }
    }

    const outOfBounds = this.y < -10 || this.y > 1000 || this.x < -10 || this.x > 600;
    if (outOfBounds) {
      if (this.config.returnOnEdge && !this.hasReturned) {
        this.hasReturned = true;
        this.angle += Math.PI;
      } else {
        this.isDestroyed = true;
      }
    }
  }

  onHit(target: Enemy | any, state: GameState): void {
    if (target instanceof Enemy) {
      if (this.config.freezeOnHit) {
        target.applyFreeze(this.config.freezeDuration);
      }
      if (this.config.frostbiteDamagePerSecond > 0) {
        target.applyFrostbite(
          this.config.frostbiteDamagePerSecond,
          this.config.frostbiteDuration,
          this.config.frostbiteStackLimit
        );
      }
    }

    if (this.config.iceStormLink && !this.iceStormLinkTriggered) {
      this.iceStormLinkTriggered = true;
      this.spawnIceStorm(state, this.x + this.width / 2, this.y + this.height / 2, 1, false);
    }

    if (this.config.zeroDegreeStorm) {
      state.dryIceHitCount = (state.dryIceHitCount || 0) + 1;
      if (state.dryIceHitCount >= this.config.zeroDegreeHitThreshold) {
        state.dryIceHitCount = 0;
        this.spawnIceStorm(state, this.x + this.width / 2, this.y + this.height / 2, 1, true);
      }
    }

    if (this.config.scatterOnHit && !this.scatterTriggered) {
      this.scatterTriggered = true;
      this.spawnScatter(state);
    }

    if (this.config.ultimate && !this.ultimateSplitTriggered) {
      this.ultimateSplitTriggered = true;
      this.spawnUltimateSplit(state);
    }
  }

  private spawnIceStorm(state: GameState, x: number, y: number, damageMultiplier: number, frostExplosion: boolean): void {
    const storm = new IceStorm(
      x,
      y,
      {
        radius: 90,
        duration: 3,
        damagePerSecond: state.player.baseDamage * damageMultiplier,
        slowFactor: 0,
        frostExplosion,
        freezeDuration: 1,
        freezeDotDamagePerSecond: 0,
        freezeDotStackLimit: 5
      }
    );
    state.iceStorms.push(storm);
  }

  private spawnScatter(state: GameState): void {
    const baseAngle = this.angle;
    const spread = 18 * Math.PI / 180;
    for (let i = 0; i < this.config.scatterCount; i++) {
      const offset = (i - (this.config.scatterCount - 1) / 2) * spread;
      const child = this.createChildBullet(
        state,
        baseAngle + offset,
        this.damage * this.config.scatterDamageMultiplier,
        0.8,
        this.config.scatterFreezeDuration
      );
      state.bullets.push(child);
    }
  }

  private spawnUltimateSplit(state: GameState): void {
    const baseAngle = this.angle;
    const spread = 20 * Math.PI / 180;
    for (let i = 0; i < this.config.ultimateSplitCount; i++) {
      const offset = (i - (this.config.ultimateSplitCount - 1) / 2) * spread;
      const child = this.createChildBullet(
        state,
        baseAngle + offset,
        this.damage * this.config.ultimateSplitDamageMultiplier,
        0.7,
        this.config.ultimateSplitFreezeDuration
      );
      state.bullets.push(child);
    }
  }

  private createChildBullet(
    state: GameState,
    angle: number,
    damage: number,
    sizeMultiplier: number,
    freezeDuration: number
  ): DryIceBullet {
    const childConfig: DryIceConfig = {
      ...this.config,
      scatterOnHit: false,
      iceStormLink: false,
      zeroDegreeStorm: false,
      ultimate: false,
      sizeMultiplier: this.config.sizeMultiplier * sizeMultiplier,
      freezeDuration
    };

    const bullet = new DryIceBullet(
      state,
      this.x + this.width / 2,
      this.y + this.height / 2,
      this.speed,
      damage,
      childConfig,
      undefined,
      angle
    );
    bullet.maxHits = 1;
    return bullet;
  }

  render(ctx: CanvasRenderingContext2D): void {
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    const length = Math.max(this.height * 2.2, 14);
    const radius = Math.max(this.width / 2, 3);
    const coreStart = '#e8fbff';
    const coreEnd = '#33c9ff';
    const glow = 'rgba(90, 215, 255, 0.6)';
    const rim = '#7fe7ff';

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(this.angle);

    ctx.globalAlpha = 0.9;
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(0, -length * 0.1, radius * 2.6, radius * 1.8, 0, 0, Math.PI * 2);
    ctx.fill();

    const gradient = ctx.createLinearGradient(0, -length * 0.7, 0, length * 0.7);
    gradient.addColorStop(0, coreStart);
    gradient.addColorStop(1, coreEnd);
    ctx.fillStyle = gradient;
    ctx.strokeStyle = rim;
    ctx.lineWidth = 1.4;

    ctx.beginPath();
    ctx.moveTo(-radius, -length * 0.65);
    ctx.lineTo(radius, -length * 0.65);
    ctx.arc(radius, -length * 0.65 + radius, radius, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(-radius, length * 0.65);
    ctx.arc(-radius, -length * 0.65 + radius, radius, Math.PI / 2, -Math.PI / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.globalAlpha = 0.8;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, -length * 0.35, 1.6, 0, Math.PI * 2);
    ctx.arc(-2.2, 0, 1.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
