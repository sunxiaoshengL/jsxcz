import { GameState } from '../Game_v2';
import Enemy from '../Enemy';
import DryIceBullet from '../DryIceBullet';

export default class DryIceEmitter {
  private state: GameState;
  private timer: number = 0;
  private interval: number = 5.0;

  private config = {
    damageMultiplier: 1,
    freezeOnHit: false,
    freezeDuration: 2,
    penetrationBonus: 0,
    frostbiteDamagePerSecond: 0,
    frostbiteDuration: 10,
    frostbiteStackLimit: 5,
    scatterOnHit: false,
    scatterCount: 5,
    scatterDamageMultiplier: 0.8,
    scatterFreezeDuration: 0.5,
    bonusDamageMultiplierAgainstStunned: 1,
    returnOnEdge: false,
    iceStormLink: false,
    zeroDegreeStorm: false,
    zeroDegreeHitThreshold: 32,
    frostPath: false,
    frostPathRadius: 22,
    frostPathTickInterval: 0.15,
    frostPathSlowFactor: 0.1,
    ultimate: false,
    ultimateSplitCount: 6,
    ultimateSplitDamageMultiplier: 0.6,
    ultimateSplitFreezeDuration: 0.6,
    sizeMultiplier: 1,
    extraBullets: 0,
    damagePenalty: 0
  };

  constructor(state: GameState) {
    this.state = state;
  }

  update(deltaTime: number): void {
    const coreSkill = this.state.activeSkills.find(s => s.id === 'dry_ice_bomb');
    if (!coreSkill) return;

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

    this.config.damageMultiplier = 1;
    if (hasSkill('dry_ice_damage_boost')) this.config.damageMultiplier += 0.6;
    if (hasSkill('dry_ice_freeze')) this.config.damageMultiplier += 0.3;
    if (hasSkill('dry_ice_penetration')) this.config.damageMultiplier += 0.3;

    this.config.freezeOnHit = hasSkill('dry_ice_freeze');
    this.config.freezeDuration = 2;

    this.config.penetrationBonus = hasSkill('dry_ice_penetration') ? 2 : 0;

    this.config.frostbiteDamagePerSecond = hasSkill('dry_ice_frostbite') ? this.state.player.baseDamage * 0.3 : 0;
    this.config.frostbiteDuration = 10;
    this.config.frostbiteStackLimit = hasSkill('dry_ice_frostbite_unlimit') ? 99 : 5;

    this.config.scatterOnHit = hasSkill('dry_ice_scatter');
    this.config.scatterCount = 5;
    this.config.scatterDamageMultiplier = 0.8;
    this.config.scatterFreezeDuration = 0.5;

    this.config.bonusDamageMultiplierAgainstStunned = hasSkill('dry_ice_paralysis_bonus') ? 2 : 1;

    this.config.returnOnEdge = hasSkill('dry_ice_return');
    this.config.iceStormLink = hasSkill('dry_ice_ice_storm_link');
    this.config.zeroDegreeStorm = hasSkill('dry_ice_zero_degree_storm');
    this.config.zeroDegreeHitThreshold = 32;

    this.config.frostPath = hasSkill('dry_ice_frost_path');
    this.config.frostPathRadius = 22;
    this.config.frostPathTickInterval = 0.15;
    this.config.frostPathSlowFactor = 0.1;

    this.config.ultimate = hasSkill('dry_ice_ultimate');
    this.config.ultimateSplitCount = 6;
    this.config.ultimateSplitDamageMultiplier = 0.6;
    this.config.ultimateSplitFreezeDuration = 0.6;
    this.config.sizeMultiplier = this.config.ultimate ? 1.7 : 1;

    this.config.extraBullets = 0;
    this.config.damagePenalty = 0;
    if (hasSkill('dry_ice_burst')) {
      this.config.extraBullets += 1;
      this.config.damagePenalty += 0.2;
    }
    if (hasSkill('dry_ice_volley')) {
      this.config.extraBullets += 2;
    }
    if (hasSkill('dry_ice_burst_no_penalty')) {
      this.config.damagePenalty = 0;
    }
  }

  private fire(): void {
    const player = this.state.player;
    const baseDamage = player.damage * (1 - this.config.damagePenalty) * this.config.damageMultiplier;
    const count = 1 + this.config.extraBullets;
    const spreadAngle = 10 * Math.PI / 180;

    let target: Enemy | null = null;
    let minDist = Infinity;
    for (const enemy of this.state.enemies) {
      if (enemy.isDead) continue;
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        target = enemy;
      }
    }

    let baseAngle = 0;
    if (target) {
      const dx = target.x + target.width / 2 - (player.x + player.width / 2);
      const dy = target.y + target.height / 2 - (player.y + player.height / 2);
      baseAngle = Math.atan2(dy, dx) + Math.PI / 2;
    }

    for (let i = 0; i < count; i++) {
      const angleOffset = (i - (count - 1) / 2) * spreadAngle;
      const angle = baseAngle + angleOffset;
      const bullet = new DryIceBullet(
        this.state,
        player.x + player.width / 2,
        player.y + player.height / 2,
        9,
        baseDamage,
        {
          freezeOnHit: this.config.freezeOnHit,
          freezeDuration: this.config.freezeDuration,
          frostbiteDamagePerSecond: this.config.frostbiteDamagePerSecond,
          frostbiteDuration: this.config.frostbiteDuration,
          frostbiteStackLimit: this.config.frostbiteStackLimit,
          scatterOnHit: this.config.scatterOnHit,
          scatterCount: this.config.scatterCount,
          scatterDamageMultiplier: this.config.scatterDamageMultiplier,
          scatterFreezeDuration: this.config.scatterFreezeDuration,
          bonusDamageMultiplierAgainstStunned: this.config.bonusDamageMultiplierAgainstStunned,
          returnOnEdge: this.config.returnOnEdge,
          iceStormLink: this.config.iceStormLink,
          zeroDegreeStorm: this.config.zeroDegreeStorm,
          zeroDegreeHitThreshold: this.config.zeroDegreeHitThreshold,
          frostPath: this.config.frostPath,
          frostPathRadius: this.config.frostPathRadius,
          frostPathTickInterval: this.config.frostPathTickInterval,
          frostPathSlowFactor: this.config.frostPathSlowFactor,
          ultimate: this.config.ultimate,
          ultimateSplitCount: this.config.ultimateSplitCount,
          ultimateSplitDamageMultiplier: this.config.ultimateSplitDamageMultiplier,
          ultimateSplitFreezeDuration: this.config.ultimateSplitFreezeDuration,
          sizeMultiplier: this.config.sizeMultiplier
        },
        target || undefined,
        angle
      );
      bullet.maxHits = 1 + this.config.penetrationBonus;
      this.state.bullets.push(bullet);
    }
  }
}
