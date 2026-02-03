export default class Enemy {
  static nextId = 0;
  public id: number;
  public x: number;
  public y: number;
  public width: number = 40;
  public height: number = 40;
  public health: number = 50;
  public maxHealth: number = 50;
  public speed: number = 0.5;
  public damage: number = 10;
  public isDead: boolean = false;
  public experience: number = 10;
  public reachedBarrier: boolean = false;
  private attackTimer: number = 0;
  public attackInterval: number = 1;
  public burnTimer: number = 0;
  public burnDamage: number = 0;
  public isBurning: boolean = false;
  public burnMaxHPDamageRate: number = 0;
  public isElite: boolean = false;
  public isBoss: boolean = false;
  public isFrozen: boolean = false;
  public freezeTimer: number = 0;
  public freezeDotDamagePerSecond: number = 0;
  public freezeDotStacks: number = 0;
  public freezeDotStackLimit: number = 5;
  public frostbiteTimer: number = 0;
  public frostbiteDamagePerSecond: number = 0;
  public frostbiteStacks: number = 0;
  public frostbiteStackLimit: number = 5;
  public stunTimer: number = 0;
  public isSlowed: boolean = false;
  public slowTimer: number = 0;
  public slowFactor: number = 0;

  constructor(x: number, y: number, type: number = 1, healthMultiplier: number = 1) {
    this.id = Enemy.nextId++;
    this.x = x;
    this.y = y;
    
    // 普通怪基础血量
    const baseNormalHealth = 50;
    const baseNormalHealthAlt = 80;
    
    // 应用血量倍率 (随波次/时间增加)
    if (type === 1 || type === 2) {
      const base = type === 2 ? baseNormalHealthAlt : baseNormalHealth;
      this.maxHealth = Math.floor(base * healthMultiplier);
      this.health = this.maxHealth;
      if (type === 2) {
        this.speed = 0.4;
        this.experience = 20;
      }
    } else if (type === 3) {
      // 精英怪
      this.isElite = true;
      this.width *= 2;
      this.height *= 2;
      this.speed = 0.5 * 0.65; // 60%~70% 取 65%
      this.damage = 100; // 每次攻击 100
      this.experience = 50; // 精英经验更高
      this.maxHealth = Math.floor(baseNormalHealth * 10 * healthMultiplier);
      this.health = this.maxHealth;
    } else if (type === 4) {
      // Boss
      this.isBoss = true;
      this.width *= 3;
      this.height *= 3;
      this.speed = 0.5 * 0.45; // 40%~50% 取 45%
      this.damage = 300; // 每次攻击 300
      this.experience = 200; // Boss经验更高
      this.maxHealth = Math.floor(baseNormalHealth * 15 * healthMultiplier);
      this.health = this.maxHealth;
    }
  }

  update(deltaTime: number): void {
    if (this.isFrozen) {
      this.freezeTimer -= deltaTime;
      if (this.freezeDotDamagePerSecond > 0) {
        this.takeDamage(this.freezeDotDamagePerSecond * deltaTime);
      }
      if (this.freezeTimer <= 0) {
        this.isFrozen = false;
        this.freezeDotDamagePerSecond = 0;
        this.freezeDotStacks = 0;
      }
    }

    if (this.stunTimer > 0) {
      this.stunTimer -= deltaTime;
      if (this.stunTimer < 0) this.stunTimer = 0;
    }

    if (this.isSlowed) {
      this.slowTimer -= deltaTime;
      if (this.slowTimer <= 0) {
        this.isSlowed = false;
        this.slowFactor = 0;
      }
    }

    if (this.isBurning) {
      this.burnTimer -= deltaTime;
      if (this.burnDamage > 0) {
        this.takeDamage(this.burnDamage * deltaTime);
      }
      if (this.burnMaxHPDamageRate > 0) {
        this.takeDamage(this.maxHealth * this.burnMaxHPDamageRate * deltaTime);
      }
      if (this.burnTimer <= 0) {
        this.isBurning = false;
        this.burnDamage = 0;
        this.burnMaxHPDamageRate = 0;
      }
    }

    if (this.frostbiteTimer > 0) {
      this.frostbiteTimer -= deltaTime;
      if (this.frostbiteDamagePerSecond > 0) {
        this.takeDamage(this.frostbiteDamagePerSecond * deltaTime);
      }
      if (this.frostbiteTimer <= 0) {
        this.frostbiteDamagePerSecond = 0;
        this.frostbiteStacks = 0;
      }
    }

    if (!this.reachedBarrier && !this.isFrozen && this.stunTimer <= 0) {
      let currentSpeed = this.speed;
      if (this.isSlowed) {
        currentSpeed *= (1 - this.slowFactor);
      }
      this.y += currentSpeed * 60 * deltaTime;
    } else if (this.reachedBarrier) {
      this.attackTimer += deltaTime;
    }
  }

  canAttack(): boolean {
    if (this.isFrozen) return false;
    if (this.stunTimer > 0) return false;
    if (this.attackTimer >= this.attackInterval) {
      this.attackTimer = 0;
      return true;
    }
    return false;
  }

  render(ctx: CanvasRenderingContext2D): void {
    const x = this.x;
    const y = this.y;
    const w = this.width;
    const h = this.height;
    const centerX = x + w / 2;
    const centerY = y + h / 2;
    const baseColor = this.isBoss ? '#7b1fa2' : this.isElite ? '#ff8f00' : '#e53935';
    const darkColor = this.isBoss ? '#4a148c' : this.isElite ? '#ef6c00' : '#8e1c1c';
    const eyeGlow = this.isBoss ? '#f8bbd0' : this.isElite ? '#ffe082' : '#ffebee';

    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#0b0f14';
    ctx.beginPath();
    ctx.ellipse(centerX, y + h + 6, w * 0.45, h * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const bodyGradient = ctx.createRadialGradient(centerX, centerY - h * 0.2, w * 0.1, centerX, centerY, w * 0.8);
    bodyGradient.addColorStop(0, '#ffffff');
    bodyGradient.addColorStop(0.35, baseColor);
    bodyGradient.addColorStop(1, darkColor);
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, w * 0.48, h * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = darkColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    const spikeCount = this.isBoss ? 7 : this.isElite ? 5 : 4;
    const spikeRadius = w * 0.08;
    for (let i = 0; i < spikeCount; i++) {
      const angle = (-Math.PI * 0.15) + (i / (spikeCount - 1)) * Math.PI * 0.3;
      const sx = centerX + Math.cos(angle) * w * 0.42;
      const sy = centerY + Math.sin(angle) * h * 0.42;
      ctx.fillStyle = darkColor;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx - spikeRadius, sy - spikeRadius * 1.4);
      ctx.lineTo(sx + spikeRadius, sy - spikeRadius * 1.4);
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillStyle = '#1b1b1b';
    ctx.beginPath();
    ctx.ellipse(centerX - w * 0.18, y + h * 0.38, w * 0.08, h * 0.12, 0, 0, Math.PI * 2);
    ctx.ellipse(centerX + w * 0.18, y + h * 0.38, w * 0.08, h * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = eyeGlow;
    ctx.beginPath();
    ctx.arc(centerX - w * 0.2, y + h * 0.34, w * 0.03, 0, Math.PI * 2);
    ctx.arc(centerX + w * 0.2, y + h * 0.34, w * 0.03, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#2d1c1c';
    ctx.beginPath();
    ctx.moveTo(centerX - w * 0.18, y + h * 0.62);
    ctx.lineTo(centerX, y + h * 0.7);
    ctx.lineTo(centerX + w * 0.18, y + h * 0.62);
    ctx.quadraticCurveTo(centerX, y + h * 0.75, centerX - w * 0.18, y + h * 0.62);
    ctx.closePath();
    ctx.fill();

    if (this.isFrozen) {
      ctx.save();
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = '#b3e5fc';
      ctx.fillRect(this.x, this.y, this.width, this.height);
      ctx.globalAlpha = 0.9;
      ctx.strokeStyle = '#e1f5fe';
      ctx.lineWidth = 2;
      ctx.strokeRect(this.x + 2, this.y + 2, this.width - 4, this.height - 4);
      ctx.restore();
    }

    // 精英怪血条（独立）
    if (this.isElite) {
      const barWidth = this.width;
      const barHeight = 6;
      const ratio = Math.max(0, Math.min(1, this.health / this.maxHealth));
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(this.x, this.y - 8, barWidth, barHeight);
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(this.x, this.y - 8, barWidth * ratio, barHeight);
    }
  }

  takeDamage(amount: number): void {
    this.health -= amount;
    if (this.health <= 0) {
      this.isDead = true;
    }
  }

  applyFreeze(duration: number, dotDamagePerSecond: number = 0, stackLimit: number = 5): void {
    let finalDuration = duration;
    if (this.isBoss) finalDuration *= 0.5;
    this.isFrozen = true;
    this.freezeTimer = Math.max(this.freezeTimer, finalDuration);
    if (dotDamagePerSecond > 0) {
      const limit = stackLimit <= 0 ? Number.POSITIVE_INFINITY : stackLimit;
      this.freezeDotStackLimit = limit;
      this.freezeDotStacks = Math.min(this.freezeDotStacks + 1, limit);
      this.freezeDotDamagePerSecond = dotDamagePerSecond * this.freezeDotStacks;
    }
  }

  applySlow(duration: number, factor: number): void {
    let finalDuration = duration;
    let finalFactor = factor;
    if (this.isBoss) {
      finalDuration *= 0.5;
      finalFactor *= 0.5;
    }
    this.isSlowed = true;
    this.slowTimer = Math.max(this.slowTimer, finalDuration);
    this.slowFactor = Math.max(this.slowFactor, finalFactor);
  }

  applyFrostbite(damagePerSecond: number, duration: number, stackLimit: number): void {
    const limit = stackLimit <= 0 ? Number.POSITIVE_INFINITY : stackLimit;
    this.frostbiteStackLimit = limit;
    this.frostbiteStacks = Math.min(this.frostbiteStacks + 1, limit);
    this.frostbiteDamagePerSecond = damagePerSecond * this.frostbiteStacks;
    this.frostbiteTimer = Math.max(this.frostbiteTimer, duration);
  }
}
