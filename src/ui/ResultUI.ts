export default class ResultUI {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private onRestart: () => void;
  private onNextLevel: () => void;
  private onBackToHome: () => void;
  private visible: boolean = false;
  private score: number = 0;
  private time: number = 0;
  private isVictory: boolean = false;

  constructor(canvas: HTMLCanvasElement, onRestart: () => void, onNextLevel: () => void, onBackToHome: () => void) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.onRestart = onRestart;
    this.onNextLevel = onNextLevel;
    this.onBackToHome = onBackToHome;
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
    this.canvas.addEventListener('touchstart', (e) => this.handleTouch(e));
  }

  show(score: number, time: number, isVictory: boolean): void {
    this.visible = true;
    this.score = score;
    this.time = time;
    this.isVictory = isVictory;
    this.render();
  }

  hide(): void {
    this.visible = false;
  }

  public isVisible(): boolean {
    return this.visible;
  }

  private handleClick(event: MouseEvent): void {
    if (!this.visible) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    
    this.handleInput(x, y);
  }

  private handleTouch(event: TouchEvent): void {
    if (!this.visible) return;
    
    event.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const x = (event.touches[0].clientX - rect.left) * scaleX;
    const y = (event.touches[0].clientY - rect.top) * scaleY;
    
    this.handleInput(x, y);
  }

  private handleInput(x: number, y: number): void {
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // Modal dimensions (match render logic)
    const modalWidth = Math.min(400, width * 0.85);
    const modalHeight = Math.min(300, height * 0.5);
    const modalY = (height - modalHeight) / 2;
    
    const buttonWidth = Math.min(140, modalWidth * 0.4);
    const buttonHeight = 44;
    const buttonGap = 20;
    const buttonStartY = modalY + modalHeight - buttonHeight - 30;
    
    if (this.isVictory) {
      // 胜利时两个按钮：下一关(右)和回到首页(左)
      const backHomeX = width / 2 - buttonWidth - buttonGap / 2;
      const nextLevelX = width / 2 + buttonGap / 2;
      
      // 下一关按钮
      if (x > nextLevelX && x < nextLevelX + buttonWidth &&
          y > buttonStartY && y < buttonStartY + buttonHeight) {
        this.hide();
        this.onNextLevel(); // This is Next Level in context of Victory
      }
      
      // 回到首页按钮
      if (x > backHomeX && x < backHomeX + buttonWidth &&
          y > buttonStartY && y < buttonStartY + buttonHeight) {
        this.hide();
        this.onBackToHome();
      }
    } else {
      // 失败时两个按钮：再来一局(右)和回到首页(左)
      const backHomeX = width / 2 - buttonWidth - buttonGap / 2;
      const restartX = width / 2 + buttonGap / 2;
      
      // 再来一局
      if (x > restartX && x < restartX + buttonWidth &&
          y > buttonStartY && y < buttonStartY + buttonHeight) {
        this.hide();
        this.onRestart();
      }

      // 回到首页
      if (x > backHomeX && x < backHomeX + buttonWidth &&
          y > buttonStartY && y < buttonStartY + buttonHeight) {
        this.hide();
        this.onBackToHome();
      }
    }
  }

  public render(): void {
    if (!this.visible) return;

    const width = this.canvas.width;
    const height = this.canvas.height;

    this.ctx.save();
    
    // Dark Overlay with blur effect simulation (just semi-transparent black)
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, width, height);

    // Modal Window
    const modalWidth = Math.min(400, width * 0.85);
    const modalHeight = Math.min(300, height * 0.5);
    const modalX = (width - modalWidth) / 2;
    const modalY = (height - modalHeight) / 2;

    // Drop Shadow
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    this.ctx.shadowBlur = 20;
    this.ctx.shadowOffsetY = 10;

    // Modal Background
    this.roundRect(this.ctx, modalX, modalY, modalWidth, modalHeight, 20);
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.fill();
    
    // Reset Shadow
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetY = 0;

    // Header Background (Top part of modal)
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.moveTo(modalX + 20, modalY);
    this.ctx.lineTo(modalX + modalWidth - 20, modalY);
    this.ctx.quadraticCurveTo(modalX + modalWidth, modalY, modalX + modalWidth, modalY + 20);
    this.ctx.lineTo(modalX + modalWidth, modalY + 60);
    this.ctx.lineTo(modalX, modalY + 60);
    this.ctx.lineTo(modalX, modalY + 20);
    this.ctx.quadraticCurveTo(modalX, modalY, modalX + 20, modalY);
    this.ctx.closePath();
    this.ctx.fillStyle = this.isVictory ? '#f1c40f' : '#e74c3c'; // Gold for victory, Red for defeat
    this.ctx.fill();
    this.ctx.restore();

    // Title
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 28px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(this.isVictory ? '关卡胜利!' : '关卡失败', width / 2, modalY + 30);

    // Content
    this.ctx.fillStyle = '#ecf0f1';
    this.ctx.font = '18px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    const contentCenterY = modalY + 60 + (modalHeight - 60 - 60) / 2; // Middle of content area
    
    // Score
    this.ctx.font = 'bold 24px Arial';
    this.ctx.fillText(`得分: ${this.score}`, width / 2, contentCenterY - 15);
    
    // Time
    this.ctx.font = '16px Arial';
    this.ctx.fillStyle = '#bdc3c7';
    const minutes = Math.floor(this.time / 60);
    const seconds = Math.floor(this.time % 60);
    const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    this.ctx.fillText(`生存时间: ${timeStr}`, width / 2, contentCenterY + 15);

    // Buttons
    const buttonWidth = Math.min(140, modalWidth * 0.4);
    const buttonHeight = 44;
    const buttonGap = 20;
    const buttonStartY = modalY + modalHeight - buttonHeight - 30;
    
    // Left Button (Home)
    const leftBtnX = width / 2 - buttonWidth - buttonGap / 2;
    this.drawButton(this.ctx, leftBtnX, buttonStartY, buttonWidth, buttonHeight, '回到首页', '#95a5a6');

    // Right Button (Next Level / Restart)
    const rightBtnX = width / 2 + buttonGap / 2;
    const rightBtnText = this.isVictory ? '下一关' : '再来一局';
    const rightBtnColor = this.isVictory ? '#2ecc71' : '#3498db';
    this.drawButton(this.ctx, rightBtnX, buttonStartY, buttonWidth, buttonHeight, rightBtnText, rightBtnColor);

    this.ctx.restore();
  }

  private drawButton(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, text: string, color: string) {
    this.roundRect(ctx, x, y, w, h, 10);
    ctx.fillStyle = color;
    ctx.fill();
    
    // Button Shine (Top half)
    ctx.save();
    ctx.clip();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(x, y, w, h/2);
    ctx.restore();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + w / 2, y + h / 2);
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}