import Enemy from './Enemy';
import { GameState } from './Game_v2';

export default class Bullet {
  public x: number;
  public y: number;
  public width: number = 6;
  public height: number = 8;
  public speed: number;
  public damage: number;
  public isDestroyed: boolean = false;
  public maxHits: number = 1;
  public hitCount: number = 0;
  public hitEnemies: Set<number> = new Set();
  public canSplit: boolean = false;
  public splitLevel: number = 0;
  public splitCount: number = 0;
  public splitDamageMultiplier: number = 1;
  public target: Enemy | null = null;
  public trackingSpeed: number = 10;
  public angle: number = 0;
  public isMainBullet: boolean = true; // 标记是否为主子弹
  public isIce: boolean = false;
  public freezeChance: number = 0;
  public freezeDuration: number = 0;
  public freezeDotDamagePerSecond: number = 0;
  public freezeDotStackLimit: number = 5;
  public hasFourWaySplit: boolean = false;
  public fourWaySplitDamageMult: number = 0.4;
  public fourWaySplitFreezeDuration: number = 0.5;
  public explosionChance: number = 0;
  public explosionRadius: number = 0;
  public explosionDamageMultiplier: number = 0;
  public explosionTriggersOnSplit: boolean = false;
  public bonusDamageMultiplierAgainstStunned: number = 1;

  constructor(x: number, y: number, speed: number, damage: number, target?: Enemy, angle: number = 0) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.damage = damage;
    this.target = target || null;
    this.angle = angle;
    this.isMainBullet = target !== undefined || angle === 0; // 有目标或角度为0的是主子弹
  }

  // 子弹命中回调，返回 true 表示需要销毁子弹（如果穿透次数用完）
  // 默认实现不做特殊处理，具体逻辑由子类覆盖
  // 返回 void，销毁逻辑仍由 Collision 控制
  onHit(target: Enemy | any, state: GameState): void {
     void target;
     void state;
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

        // 更新角度以匹配当前飞行方向
        // 注意：我们的坐标系中，y轴向下增加。
        // atan2(dy, dx) 返回标准数学角度（x轴正向为0，顺时针为正）
        // 而我们的渲染和直线移动逻辑是：
        // x += sin(angle) * speed
        // y -= cos(angle) * speed
        // 这意味着 angle=0 -> y负方向(上) -> sin(0)=0, -cos(0)=-1. 正确。
        // angle=PI/2 -> x正方向(右) -> sin(PI/2)=1, -cos(PI/2)=0. 正确。
        // 
        // 标准 atan2(dy, dx): 
        // (0, -1) [Up] -> -PI/2
        // (1, 0) [Right] -> 0
        // (0, 1) [Down] -> PI/2
        //
        // 转换公式: BulletAngle = atan2(dy, dx) + PI/2
        this.angle = Math.atan2(dy, dx) + Math.PI / 2;
      }
    } else {
      this.x += Math.sin(this.angle) * this.speed * deltaTime * 60;
      this.y -= Math.cos(this.angle) * this.speed * deltaTime * 60;
    }
    
    // 边界检查 - 使用更大的范围以适应新画布
    if (this.y < -10 || this.y > 1000 || this.x < -10 || this.x > 600) {
      this.isDestroyed = true;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    const length = Math.max(this.height * 2, 12);
    const radius = Math.max(this.width / 2, 3);
    const isSplit = this.canSplit || this.splitLevel > 0 || !this.isMainBullet;

    let coreStart = '#ffd54f';
    let coreEnd = '#ff9800';
    let glow = 'rgba(255, 200, 80, 0.55)';
    let rim = '#ffb300';
    if (this.isIce) {
      coreStart = '#d6f4ff';
      coreEnd = '#4fc3ff';
      glow = 'rgba(120, 210, 255, 0.6)';
      rim = '#29b6f6';
    } else if (isSplit) {
      coreStart = '#ffcc80';
      coreEnd = '#ff6d00';
      glow = 'rgba(255, 140, 0, 0.45)';
      rim = '#ff8f00';
    }

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(this.angle);

    ctx.globalAlpha = 0.9;
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(0, -length * 0.15, radius * 2.2, radius * 1.6, 0, 0, Math.PI * 2);
    ctx.fill();

    const gradient = ctx.createLinearGradient(0, -length * 0.7, 0, length * 0.7);
    gradient.addColorStop(0, coreStart);
    gradient.addColorStop(1, coreEnd);
    ctx.fillStyle = gradient;
    ctx.strokeStyle = rim;
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(-radius, -length * 0.6);
    ctx.lineTo(radius, -length * 0.6);
    ctx.arc(radius, -length * 0.6 + radius, radius, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(-radius, length * 0.6);
    ctx.arc(-radius, -length * 0.6 + radius, radius, Math.PI / 2, -Math.PI / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (this.isIce) {
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, -length * 0.4, 1.5, 0, Math.PI * 2);
      ctx.arc(-2, 0, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  applySkillEffects(effects: any): void {
    if (effects.damage) this.damage += effects.damage;
    if (effects.maxHits) this.maxHits = effects.maxHits;
    if (effects.trackingSpeed) this.trackingSpeed = effects.trackingSpeed;
  }
}
