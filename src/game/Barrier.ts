export default class Barrier {
  public x: number;
  public y: number;
  public width: number;
  public height: number = 20;
  public health: number = 2000;
  public maxHealth: number = 2000;
  public shield: number = 10;
  public maxShield: number = 10;
  public isDestroyed: boolean = false;

  constructor(x: number, y: number, width: number) {
    this.x = x;
    this.y = y;
    this.width = width;
  }

  takeDamage(amount: number): void {
    // 先消耗护盾
    if (this.shield > 0) {
      this.shield--;
      return;
    }
    
    // 护盾耗尽后扣血
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.isDestroyed = true;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    void ctx;
  }

  reset(): void {
    this.health = this.maxHealth;
    this.shield = this.maxShield;
    this.isDestroyed = false;
  }
}
