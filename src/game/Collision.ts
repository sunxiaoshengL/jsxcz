import { GameState } from './Game_v2';
import LevelSystem from './LevelSystem';
import DamageText from './DamageText';
import Bullet from './Bullet';

export default class Collision {
  private levelSystem: LevelSystem;

  constructor(levelSystem: LevelSystem) {
    this.levelSystem = levelSystem;
  }

  checkAll(state: GameState): void {
    for (let i = state.bullets.length - 1; i >= 0; i--) {
      const bullet = state.bullets[i];
      for (let j = state.enemies.length - 1; j >= 0; j--) {
        const enemy = state.enemies[j];
        if (!this.checkRectCollision(bullet, enemy)) continue;

        if (bullet.hitEnemies.has(enemy.id)) continue;

        const wasFrozen = enemy.isFrozen;

        let finalDamage = bullet.damage;
        if ((enemy as any).stunTimer > 0 && bullet.bonusDamageMultiplierAgainstStunned > 1) {
          finalDamage *= bullet.bonusDamageMultiplierAgainstStunned;
        }
        const isCritical = Math.random() < 0.05;
        if (isCritical) finalDamage *= 2;
        // 精英 / Boss 单次伤害上限，避免秒杀
        if (enemy.isElite) {
          const cap = enemy.maxHealth * 0.10;
          if (finalDamage > cap) finalDamage = cap;
        } else if (enemy.isBoss) {
          const cap = enemy.maxHealth * 0.07;
          if (finalDamage > cap) finalDamage = cap;
        }

        enemy.takeDamage(finalDamage);
        
        state.damageTexts.push(new DamageText(bullet.x, bullet.y, finalDamage, isCritical));

        bullet.onHit(enemy, state);

        if (bullet.isIce) {
          if (Math.random() < bullet.freezeChance) {
            enemy.applyFreeze(bullet.freezeDuration, bullet.freezeDotDamagePerSecond, bullet.freezeDotStackLimit);
          }
        }

        if (bullet.explosionChance > 0 && Math.random() < bullet.explosionChance) {
          this.applyExplosion(state, bullet);
        }

        if (bullet.hasFourWaySplit && wasFrozen) {
          this.spawnFourWaySplit(state, bullet, enemy);
        }

        if (enemy.isDead) {
          state.score += 10;
          this.levelSystem.addExperience(enemy.experience);
          // 击杀精英/Boss奖励技能选择（不提升枪等级）
          if (enemy.isElite) {
            state.pendingRewardSkillChoices = (state.pendingRewardSkillChoices || 0) + 101; // 特殊标记：101 表示精英奖励
          }
          if (enemy.isBoss) {
            state.pendingRewardSkillChoices = (state.pendingRewardSkillChoices || 0) + 102; // 特殊标记：102 表示Boss奖励
          }
        }

        bullet.hitEnemies.add(enemy.id);
        bullet.hitCount++;

        if (bullet.target === enemy) {
          bullet.target = null;
        }
        
        if (bullet.canSplit && bullet.hitCount === 1) {
          this.spawnSplitBullets(state, bullet, enemy.id);
          bullet.canSplit = false; // 只触发一次
        }

        if (bullet.hitCount >= bullet.maxHits) {
          bullet.isDestroyed = true;
          break; // 子弹销毁，不再检测其他敌人
        }
      }
    }

    for (const enemy of state.enemies) {
      if (this.checkRectCollision(enemy, state.player)) {
        state.player.takeDamage(enemy.damage);
        enemy.isDead = true;
      }
    }
  }

  private checkRectCollision(a: any, b: any): boolean {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  private spawnSplitBullets(state: GameState, source: Bullet, hitEnemyId: number): void {
    const baseAngle = source.angle;
    const angles: number[] = [];
    if (source.splitLevel === 1) {
      const a = 30 * Math.PI / 180;
      angles.push(baseAngle - a, baseAngle + a);
    } else if (source.splitLevel === 2) {
      const a30 = 30 * Math.PI / 180;
      const a60 = 60 * Math.PI / 180;
      angles.push(baseAngle - a30, baseAngle + a30, baseAngle - a60, baseAngle + a60);
    }

    for (const ang of angles) {
      const forwardDistance = 15 + Math.random() * 10;
      const spawnX = source.x + Math.sin(baseAngle) * forwardDistance;
      const spawnY = source.y - Math.cos(baseAngle) * forwardDistance;
      const b = new Bullet(
        spawnX,
        spawnY,
        source.speed,
        source.damage * source.splitDamageMultiplier,
        undefined,
        ang
      );
      b.trackingSpeed = source.trackingSpeed;
      // 分裂子弹固定命中一次即销毁，不继承穿透
      b.maxHits = 1;
      b.canSplit = false;
      b.splitLevel = 0;
      b.splitCount = 0;
      b.splitDamageMultiplier = 1;
      b.bonusDamageMultiplierAgainstStunned = source.bonusDamageMultiplierAgainstStunned;
      if (source.explosionTriggersOnSplit) {
        b.explosionChance = source.explosionChance;
        b.explosionRadius = source.explosionRadius;
        b.explosionDamageMultiplier = source.explosionDamageMultiplier;
        b.explosionTriggersOnSplit = source.explosionTriggersOnSplit;
      }
      b.hitEnemies = new Set(source.hitEnemies);
      b.hitEnemies.add(hitEnemyId);
      state.bullets.push(b);
    }
  }

  private spawnFourWaySplit(state: GameState, source: Bullet, enemy: any): void {
    const angles = [
      Math.PI / 4,
      (3 * Math.PI) / 4,
      (-3 * Math.PI) / 4,
      -Math.PI / 4
    ];

    const damage = source.damage * source.fourWaySplitDamageMult;

    for (const angle of angles) {
      const b = new Bullet(
        enemy.x + enemy.width / 2,
        enemy.y + enemy.height / 2,
        10,
        damage,
        undefined,
        angle
      );
      b.isIce = true;
      b.freezeDuration = source.fourWaySplitFreezeDuration;
      b.freezeDotDamagePerSecond = source.freezeDotDamagePerSecond;
      b.freezeDotStackLimit = source.freezeDotStackLimit;
      b.maxHits = Math.max(2, source.maxHits);
      b.hasFourWaySplit = false;
      b.bonusDamageMultiplierAgainstStunned = source.bonusDamageMultiplierAgainstStunned;
      b.hitEnemies.add(enemy.id);
      state.bullets.push(b);
    }
  }

  private applyExplosion(state: GameState, source: Bullet): void {
    const radius = source.explosionRadius;
    if (radius <= 0) return;
    const damageMultiplier = source.explosionDamageMultiplier > 0 ? source.explosionDamageMultiplier : 1;
    const baseDamage = source.damage * damageMultiplier;

    for (const enemy of state.enemies) {
      if (enemy.isDead) continue;
      const dx = enemy.x + enemy.width / 2 - (source.x + source.width / 2);
      const dy = enemy.y + enemy.height / 2 - (source.y + source.height / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > radius) continue;

      let finalDamage = baseDamage;
      if (enemy.isElite) {
        const cap = enemy.maxHealth * 0.10;
        if (finalDamage > cap) finalDamage = cap;
      } else if (enemy.isBoss) {
        const cap = enemy.maxHealth * 0.07;
        if (finalDamage > cap) finalDamage = cap;
      }
      enemy.takeDamage(finalDamage);
      state.damageTexts.push(new DamageText(enemy.x, enemy.y, finalDamage, false));
    }
  }
}
