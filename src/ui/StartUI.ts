export default class StartUI {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private onStart: () => void;
  private visible: boolean = false;

  constructor(canvas: HTMLCanvasElement, onStart: () => void) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.onStart = onStart;
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
    this.canvas.addEventListener('touchstart', (e) => this.handleTouch(e));
  }

  show(): void {
    this.visible = true;
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
    // 坐标转换：从屏幕坐标转换到Canvas坐标
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    
    const width = this.canvas.width;
    const height = this.canvas.height;
    const buttonWidth = Math.min(200, width * 0.55);
    const buttonHeight = Math.min(50, height * 0.08);
    const buttonX = width / 2 - buttonWidth / 2;
    const buttonY = height / 2 - buttonHeight / 2;
    
    if (x > buttonX && x < buttonX + buttonWidth &&
        y > buttonY && y < buttonY + buttonHeight) {
      this.hide();
      this.onStart();
    }
  }

  private handleTouch(event: TouchEvent): void {
    if (!this.visible) return;
    
    event.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    // 坐标转换：从屏幕坐标转换到Canvas坐标
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const x = (event.touches[0].clientX - rect.left) * scaleX;
    const y = (event.touches[0].clientY - rect.top) * scaleY;
    
    const width = this.canvas.width;
    const height = this.canvas.height;
    const buttonWidth = Math.min(200, width * 0.55);
    const buttonHeight = Math.min(50, height * 0.08);
    const buttonX = width / 2 - buttonWidth / 2;
    const buttonY = height / 2 - buttonHeight / 2;
    
    if (x > buttonX && x < buttonX + buttonWidth &&
        y > buttonY && y < buttonY + buttonHeight) {
      this.hide();
      this.onStart();
    }
  }

  render(): void {
    if (!this.visible) return;

    const width = this.canvas.width;
    const height = this.canvas.height;

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, width, height);

    // 响应式标题
    const titleSize = Math.min(36, width * 0.1);
    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = `${titleSize}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.fillText('僵尸幸存者', width / 2, height / 2 - height * 0.12);

    // 响应式按钮
    const buttonWidth = Math.min(200, width * 0.55);
    const buttonHeight = Math.min(50, height * 0.08);
    const buttonX = width / 2 - buttonWidth / 2;
    const buttonY = height / 2 - buttonHeight / 2;

    this.ctx.fillStyle = '#4CAF50';
    this.ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
    this.ctx.strokeStyle = '#2E7D32';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);

    const buttonTextSize = Math.min(24, width * 0.065);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = `${buttonTextSize}px Arial`;
    this.ctx.fillText('开始游戏', width / 2, buttonY + buttonHeight / 2 + buttonTextSize / 3);

    // 响应式提示文字
    const hintSize = Math.min(16, width * 0.044);
    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = `${hintSize}px Arial`;
    this.ctx.fillText('🎮 拖动移动 | 🔫 自动射击', width / 2, height / 2 + height * 0.09);
    this.ctx.fillText('🔥 燃烧弹 | 💪 齐射 | ⚡ 连发', width / 2, height / 2 + height * 0.13);
  }
}
