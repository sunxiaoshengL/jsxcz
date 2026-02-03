import { GameState } from '../Game_v2';
import IceStorm from '../IceStorm';
import Bullet from '../Bullet';

export default class IceStormEmitter {
  private state: GameState;
  private timer: number = 0;
  private interval: number = 5.0;
  private level: number = 0;
  private config = {
    radius: 90,
    duration: 3,
    damageMultiplier: 1,
    slowFactor: 0,
    frostExplosion: false,
    freezeDotDamagePerSecond: 0,
    freezeDotStackLimit: 5,
    chainStorm: false,
    hasCannon: false
  };

  constructor(state: GameState) {
    this.state = state;
  }

  update(deltaTime: number): void {
    const coreSkill = this.state.activeSkills.find(s => s.id === 'ice_storm_generator');
    if (!coreSkill) {
      this.timer = 0;
      return;
    }

    this.level = coreSkill.level;
    this.updateConfig();

    this.timer += deltaTime;
    if (this.timer >= this.interval) {
      this.timer = 0;
      this.fire();
    }
  }

  private updateConfig(): void {
    const skills = this.state.activeSkills;
    const hasSkill = (id: string) => skills.some(s => s.id === id);

    let duration = 3;
    if (hasSkill('ice_storm_duration')) duration += 2;

    let damageMultiplier = 1;
    if (hasSkill('ice_storm_damage_boost')) damageMultiplier += 0.6;
    if (hasSkill('frost_explosion')) damageMultiplier += 0.2;
    if (hasSkill('ice_storm_duration') && this.level < 31) {
      damageMultiplier *= 0.85;
    }

    let radius = 90;
    let slowFactor = 0;
    if (hasSkill('ice_storm_expansion')) {
      radius *= 1.5;
      slowFactor = 0.3;
    }

    const chainStorm = hasSkill('chain_ice_storm');
    this.interval = 5 + (chainStorm ? 1 : 0);

    let hasCannon = hasSkill('ice_storm_cannon') && this.level >= 14;
    if (chainStorm && this.level < 26) {
      hasCannon = false;
    }

    const freezeDotDamagePerSecond = hasSkill('freeze_dot') ? this.state.player.baseDamage * 0.3 : 0;
    const freezeDotStackLimit = this.level >= 31 ? 0 : 5;

    this.config = {
      radius,
      duration,
      damageMultiplier,
      slowFactor,
      frostExplosion: hasSkill('frost_explosion'),
      freezeDotDamagePerSecond,
      freezeDotStackLimit,
      chainStorm,
      hasCannon
    };
  }

  private fire(): void {
    const targets = this.state.enemies.filter(e => !e.isDead);
    if (targets.length === 0) return;

    const target = targets[Math.floor(Math.random() * targets.length)];
    const centerX = target.x + target.width / 2;
    const centerY = target.y + target.height / 2;

    const damagePerSecond = this.state.player.baseDamage * this.config.damageMultiplier;
    const storm = new IceStorm(
      centerX,
      centerY,
      {
        radius: this.config.radius,
        duration: this.config.duration,
        damagePerSecond,
        slowFactor: this.config.slowFactor,
        frostExplosion: this.config.frostExplosion,
        freezeDuration: 1,
        freezeDotDamagePerSecond: this.config.freezeDotDamagePerSecond,
        freezeDotStackLimit: this.config.freezeDotStackLimit
      },
      () => {
        if (this.config.hasCannon) {
          this.spawnCannon(centerX, centerY, this.config.damageMultiplier);
        }
      }
    );
    this.state.iceStorms.push(storm);

    if (this.config.chainStorm) {
      const offsetAngle = Math.random() * Math.PI * 2;
      const offsetDistance = this.config.radius * 0.5;
      const smallX = centerX + Math.cos(offsetAngle) * offsetDistance;
      const smallY = centerY + Math.sin(offsetAngle) * offsetDistance;
      const smallStorm = new IceStorm(
        smallX,
        smallY,
        {
          radius: this.config.radius * 0.6,
          duration: this.config.duration * 0.7,
          damagePerSecond: damagePerSecond * 0.7,
          slowFactor: this.config.slowFactor,
          frostExplosion: this.config.frostExplosion,
          freezeDuration: 1,
          freezeDotDamagePerSecond: this.config.freezeDotDamagePerSecond,
          freezeDotStackLimit: this.config.freezeDotStackLimit
        }
      );
      this.state.iceStorms.push(smallStorm);
    }
  }

  private spawnCannon(x: number, y: number, damageMultiplier: number): void {
    const baseDamage = this.state.player.baseDamage * 0.8 * damageMultiplier;
    const angles = [0, Math.PI / 12, -Math.PI / 12];

    for (const angle of angles) {
      const bullet = new Bullet(x, y, 10, baseDamage, undefined, angle);
      bullet.isIce = true;
      bullet.maxHits = 3;
      bullet.trackingSpeed = 0;
      this.state.bullets.push(bullet);
    }
  }
}
