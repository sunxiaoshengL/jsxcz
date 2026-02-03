import Bullet from './Bullet';
import { GameState } from './Game_v2';
import Enemy from './Enemy';

export default class Player {
  public x: number;
  public y: number;
  public width: number = 40;
  public height: number = 50;
  public health: number = 100;
  public maxHealth: number = 100;
  public baseDamage: number = 25;
  public baseFireRate: number = 0.6;
  public levelDamageMultiplier: number = 1;
  public levelFireRateMultiplier: number = 1;
  public damage: number = 25;
  public fireRate: number = 0.6;
  public gunLevel: number = 1;
  public splitLevel: number = 0; // 新增：当前分裂等级 (0=无, 1=分裂2, 2=分裂4)
  private lastFireTime: number = 0;
  private skillLevels: Map<string, number> = new Map();
  
  // 连发相关属性
  private burstRemaining: number = 0;
  private burstTimer: number = 0;
  private readonly burstInterval: number = 0.1; // 连发间隔 0.1秒

  constructor(x: number, y: number) {
    // 人物固定在指定位置
    this.x = x - this.width / 2;
    this.y = y;
  }

  move(): void {
    // 人物固定位置，不可移动
    return;
  }

  update(deltaTime: number, state: GameState): void {
    this.lastFireTime += deltaTime;
    
    // 只有当有敌人时才尝试射击
    const hasAliveEnemy = state.enemies.some(enemy => !enemy.isDead);
    if (this.lastFireTime >= this.fireRate && hasAliveEnemy && state.isFiringEnabled) {
      this.startBurst();
      this.lastFireTime = 0;
    }

    // 处理连发逻辑
    if (this.burstRemaining > 0) {
      this.burstTimer += deltaTime;
      if (this.burstTimer >= this.burstInterval) {
        this.performSalvo(state);
        this.burstRemaining--;
        this.burstTimer = 0;
      }
    }
  }

  // 开始一轮射击（初始化连发）
  private startBurst(): void {
    const rapidFireLevel = this.skillLevels.get('rapid_fire') || 0;
    // 连发数量：0级=1发，1级=2发...
    const totalBurstCount = rapidFireLevel + 1;
    
    // 立即发射第一发
    // 注意：这里我们不立即发射，而是设置 burstRemaining，让 update 里的逻辑去发射
    // 但为了响应及时性，我们应该立即发射第一发，剩下的放入队列
    // 或者将 burstTimer 设为 burstInterval 从而在下一帧立即触发
    
    this.burstRemaining = totalBurstCount;
    this.burstTimer = this.burstInterval; // 确保第一发立即发射
  }

  // 执行一次齐射 (Salvo)
  private performSalvo(state: GameState): void {
    // 重新寻找目标，确保每次射击都以当前目标为准（规则3）
    const target = this.findTarget(state);
    
    // 如果没有目标，默认向上发射 (angle = 0)
    // 注意：Bullet.ts 中 0 是向上 (y-), PI/2 是向右 (x+)
    let baseAngle = 0;
    
    if (target) {
      // 计算指向目标的角度
      // atan2 返回的是以 x+ 为 0 的角度，顺时针为正 (屏幕坐标系 y 向下)
      // dx, dy
      const dx = target.x + target.width/2 - (this.x + this.width/2);
      const dy = target.y + target.height/2 - (this.y + this.height/2);
      
      // Bullet.ts 的逻辑: x += sin(a), y -= cos(a)
      // 这意味着 a=0 -> y- (Up)
      // a=PI/2 -> x+ (Right)
      // 标准 atan2(dy, dx) : 0 -> Right, PI/2 -> Down
      // 我们需要转换:
      // Target Right (1, 0) -> atan2=0. Bullet Expects PI/2.
      // Target Up (0, -1) -> atan2=-PI/2. Bullet Expects 0.
      // Target Down (0, 1) -> atan2=PI/2. Bullet Expects PI.
      // so BulletAngle = atan2(dy, dx) + PI/2
      baseAngle = Math.atan2(dy, dx) + Math.PI / 2;
    } else {
       // 如果没有目标，就不射击了？或者沿用上一次？
       // 原逻辑是 findTarget 没找到就不射击 (update里判断了 enemies.length > 0)
       // 但在连发过程中，可能所有敌人都死了。此时停止射击是合理的。
       return;
    }

    const multiShotLevel = this.skillLevels.get('multi_shot') || 0;
    const salvoCount = 1 + multiShotLevel;
    const spreadAngle = 5 * Math.PI / 180; // 规则1: 固定 5度

    // 寻找最接近中心（主子弹）的索引
    // 对于奇数 (e.g. 3): (2)/2 = 1. i=1 是中心.
    // 对于偶数 (e.g. 2): (1)/2 = 0.5. i=0, i=1 都可以. 我们选 Math.floor -> 0
    const centerIndex = Math.floor((salvoCount - 1) / 2);

    for (let i = 0; i < salvoCount; i++) {
      // 规则4: angle = baseAngle + (i - (count - 1) / 2) * spreadAngle
      const angleOffset = (i - (salvoCount - 1) / 2) * spreadAngle;
      const finalAngle = baseAngle + angleOffset;

      // 判断是否为主子弹 (索引匹配)
      // 如果是偶数，且只有1个敌人，我们强制让其中一颗去追踪，确保命中（规则5）
      // 这里我们选 index 0 (如果是2发) 或者 index 1 (如果是3发)
      // 简单来说，i === centerIndex 的那颗被视为主子弹
      const isMainBullet = (i === centerIndex);

      // 规则2 & 5: 只有主子弹参与目标追踪
      const bulletTarget = isMainBullet ? target : undefined;

      // 规则5: 初始位置完全相同
      const bullet = new Bullet(
        this.x + this.width / 2 - 3,
        this.y,
        10,
        this.damage,
        bulletTarget, // 传入 target (如果是主子弹)
        finalAngle
      );
      
      this.applyBulletEffects(bullet);
      state.bullets.push(bullet);
    }
  }

  // 旧的 shoot 方法已废弃，保留占位或删除
  shoot(state: GameState): void {
     void state;
  }

  private applyBulletEffects(bullet: Bullet): void {
    const penetrationLevel = this.skillLevels.get('penetration') || 0;
    if (penetrationLevel > 0) {
      bullet.maxHits = 1 + penetrationLevel;
    }

    const explosionLevel = this.skillLevels.get('bullet_explosion') || 0;
    if (explosionLevel > 0) {
      bullet.explosionChance = 0.25;
      bullet.explosionRadius = 90;
      bullet.explosionDamageMultiplier = 1.25;
      if ((this.skillLevels.get('bullet_explosion_damage') || 0) > 0) {
        bullet.explosionDamageMultiplier += 0.6;
      }
      if ((this.skillLevels.get('bullet_explosion_range') || 0) > 0) {
        bullet.explosionRadius *= 1.5;
      }
      bullet.explosionTriggersOnSplit = (this.skillLevels.get('bullet_explosion_split') || 0) > 0;
    }

    const iceBulletLevel = this.skillLevels.get('ice_bullet') || 0;
    if (iceBulletLevel > 0) {
      const iceDamageBoostLevel = this.skillLevels.get('ice_storm_damage_boost') || 0;
      let multiplier = 1.0;
      if (iceDamageBoostLevel > 0) multiplier += 0.6;
      multiplier += 0.4;
      bullet.damage *= multiplier;
      bullet.isIce = true;
      bullet.freezeChance = 0.3;
      bullet.freezeDuration = 1.0;

      const iceStormLevel = this.skillLevels.get('ice_storm_generator') || 0;
      const freezeDotLevel = this.skillLevels.get('freeze_dot') || 0;
      if (freezeDotLevel > 0) {
        bullet.freezeDotDamagePerSecond = this.baseDamage * 0.3;
        bullet.freezeDotStackLimit = iceStormLevel >= 31 ? 0 : 5;
      }

      const fourWaySplitLevel = this.skillLevels.get('four_way_split') || 0;
      if (fourWaySplitLevel > 0) {
        bullet.hasFourWaySplit = true;
        bullet.fourWaySplitDamageMult = iceStormLevel >= 10 ? 0.6 : 0.4;
        bullet.fourWaySplitFreezeDuration = 0.5;
      }
    }

    // 从 skillLevels 获取分裂等级是不可靠的，因为我们现在有了多个分裂技能
    // 应该直接使用 Player 类上的 splitLevel 属性，该属性在 SkillSystem.applySkillEffects 中被正确设置
    // 并且我们不再需要单独检查 split_shot_2 或 split_shot_4 的等级，因为它们都会影响 player.splitLevel
    // 兼容旧代码：如果 Player 上没有 splitLevel 属性，则回退到 map 查找（虽然现在 SkillSystem 已经保证了属性存在）
    
    // 注意：我们在 SkillSystem 中已经根据 split_shot_2 和 split_shot_4 设置了 this.splitLevel
    // 1级分裂 = 2颗, 2级分裂 = 4颗
    const currentSplitLevel = (this as any).splitLevel || 0;
    
    if (currentSplitLevel > 0) {
      bullet.canSplit = true;
      bullet.splitLevel = currentSplitLevel;
      if (currentSplitLevel === 1) {
        bullet.splitCount = 2;
        bullet.splitDamageMultiplier = 0.6;
      } else {
        bullet.splitCount = 4;
        bullet.splitDamageMultiplier = 0.45;
      }
    }


  }

  setSkillLevel(skillId: string, level: number): void {
    this.skillLevels.set(skillId, level);
  }

  increaseGunLevel(): void {
    this.gunLevel += 1;
    this.levelDamageMultiplier *= 1.05;
    this.levelFireRateMultiplier *= 0.97;
  }

  private findTarget(state: GameState): Enemy | null {
    if (state.enemies.length === 0) return null;

    let target: Enemy | null = null;
    let minDistance = Infinity;

    for (const enemy of state.enemies) {
      if (enemy.isDead) continue;
      const dx = enemy.x - this.x;
      const dy = enemy.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < minDistance) {
        minDistance = distance;
        target = enemy;
      }
    }

    return target;
  }

  render(ctx: CanvasRenderingContext2D): void {
    const x = this.x;
    const y = this.y;
    const w = this.width;
    const h = this.height;
    const centerX = x + w / 2;
    const r = Math.min(10, w * 0.25);

    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#0b0f14';
    ctx.beginPath();
    ctx.ellipse(centerX, y + h + 8, w * 0.45, h * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const bodyGradient = ctx.createLinearGradient(x, y, x, y + h);
    bodyGradient.addColorStop(0, '#4dd0e1');
    bodyGradient.addColorStop(0.5, '#26a69a');
    bodyGradient.addColorStop(1, '#1b5e20');

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 3;
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = '#0f3d2e';
    ctx.lineWidth = 2;
    ctx.stroke();

    const chestGradient = ctx.createLinearGradient(x, y + h * 0.25, x, y + h * 0.85);
    chestGradient.addColorStop(0, 'rgba(255,255,255,0.18)');
    chestGradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = chestGradient;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.18, y + h * 0.3);
    ctx.lineTo(x + w * 0.82, y + h * 0.3);
    ctx.lineTo(x + w * 0.72, y + h * 0.85);
    ctx.lineTo(x + w * 0.28, y + h * 0.85);
    ctx.closePath();
    ctx.fill();

    const helmetY = y + h * 0.08;
    const helmetH = h * 0.32;
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.moveTo(x + w * 0.18, helmetY + helmetH);
    ctx.lineTo(x + w * 0.82, helmetY + helmetH);
    ctx.quadraticCurveTo(centerX, helmetY - helmetH * 0.25, x + w * 0.18, helmetY + helmetH);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#1c2833';
    ctx.lineWidth = 2;
    ctx.stroke();

    const visorGradient = ctx.createLinearGradient(x, helmetY, x, helmetY + helmetH);
    visorGradient.addColorStop(0, '#90caf9');
    visorGradient.addColorStop(1, '#1565c0');
    ctx.fillStyle = visorGradient;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.28, helmetY + helmetH * 0.45);
    ctx.lineTo(x + w * 0.72, helmetY + helmetH * 0.45);
    ctx.lineTo(x + w * 0.62, helmetY + helmetH * 0.78);
    ctx.lineTo(x + w * 0.38, helmetY + helmetH * 0.78);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#0d47a1';
    ctx.stroke();

    ctx.fillStyle = '#f5d76e';
    ctx.beginPath();
    ctx.roundRect(centerX - w * 0.18, y + h * 0.56, w * 0.36, h * 0.12, h * 0.06);
    ctx.fill();
    ctx.strokeStyle = '#cfa640';
    ctx.stroke();

    ctx.fillStyle = '#1b5e20';
    ctx.beginPath();
    ctx.roundRect(x + w * 0.18, y + h * 0.88, w * 0.24, h * 0.1, h * 0.05);
    ctx.roundRect(x + w * 0.58, y + h * 0.88, w * 0.24, h * 0.1, h * 0.05);
    ctx.fill();
    ctx.strokeStyle = '#0b3d2e';
    ctx.stroke();
  }

  takeDamage(amount: number): void {
    this.health -= amount;
    if (this.health < 0) this.health = 0;
  }

  reset(): void {
    this.health = this.maxHealth;
    this.baseDamage = 25;
    this.baseFireRate = 0.6;
    this.levelDamageMultiplier = 1;
    this.levelFireRateMultiplier = 1;
    this.damage = this.baseDamage;
    this.fireRate = this.baseFireRate;
    this.lastFireTime = 0;
    this.skillLevels.clear();
    this.gunLevel = 1;
    this.burstRemaining = 0;
    this.burstTimer = 0;
    this.splitLevel = 0;
  }

  applySkillEffects(effects: any): void {
    if (effects.damage) this.damage += effects.damage;
    if (effects.fireRate) this.fireRate *= effects.fireRate;
    if (effects.health) this.health = Math.min(this.health + effects.health, this.maxHealth);
  }
}
