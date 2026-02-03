export default class DamageText {
  public x: number;
  public y: number;
  public value: number;
  public color: string;
  public lifeTime: number = 0.5;
  public maxLifeTime: number = 0.5;
  public isDead: boolean = false;
  private velocityY: number;

  constructor(x: number, y: number, value: number, isCritical: boolean) {
    this.x = x + (Math.random() * 10 - 5); // ±5px random offset
    this.y = y + (Math.random() * 10 - 5);
    this.value = Math.floor(value); // Integer display
    this.color = isCritical ? '#FF0000' : '#FFFF00'; // Red for crit, Yellow for normal
    
    // Move up 10-20 pixels over 0.5s
    // Distance = 15px (avg)
    // Speed = Distance / Time = 15 / 0.5 = 30px/s
    // Using 60fps delta time scale in update usually, but let's stick to seconds
    this.velocityY = 30 + Math.random() * 20; // 30-50 px/s upward
  }

  update(deltaTime: number): void {
    this.lifeTime -= deltaTime;
    this.y -= this.velocityY * deltaTime;

    if (this.lifeTime <= 0) {
      this.isDead = true;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (this.isDead) return;

    // Calculate opacity
    // Total 0.5s.
    // First 0.1s (lifeTime > 0.4): Opacity 1
    // Last 0.4s (lifeTime <= 0.4): Fade out
    let alpha = 1;
    if (this.lifeTime < 0.4) {
      alpha = this.lifeTime / 0.4;
    }

    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    
    // Optional: Add shadow/outline for better visibility
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 2;
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'black';
    
    // Draw text with stroke for better contrast
    ctx.strokeText(this.value.toString(), this.x, this.y);
    ctx.fillText(this.value.toString(), this.x, this.y);

    // Reset context
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }
}
