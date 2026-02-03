import LevelManager from '../../data/LevelManager';

export default class LevelSelectUI {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private visible: boolean = false;
  private onClose: () => void;
  private onSelect: (levelIndex: number) => void;
  
  // Layout
  private itemHeight: number = 100;
  private scrollY: number = 0;
  private maxScrollY: number = 0;
  private headerHeight: number = 70;
  
  // Cache
  private bgImages: Map<number, HTMLImageElement> = new Map();
  
  // Touch/Drag
  private isDragging: boolean = false;
  private isInteractionValid: boolean = false; // Ensures interaction started when visible
  private lastY: number = 0;
  private startY: number = 0; // To distinguish click vs drag

  constructor(canvas: HTMLCanvasElement, onClose: () => void, onSelect: (levelIndex: number) => void) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.onClose = onClose;
    this.onSelect = onSelect;
    
    this.bindInput();
  }

  public show(): void {
    this.visible = true;
    this.scrollY = 0; // Reset scroll
    this.isInteractionValid = false;
    this.isDragging = false;
    
    // Calculate max scroll
    const levels = LevelManager.getInstance().getLevels();
    const totalHeight = levels.length * (this.itemHeight + 10) + this.headerHeight + 20; // 10px padding, 20px bottom padding
    this.maxScrollY = Math.max(0, totalHeight - this.canvas.height);
    
    this.render();
  }

  public hide(): void {
    this.visible = false;
    this.isInteractionValid = false;
    this.isDragging = false;
  }

  public isVisible(): boolean {
    return this.visible;
  }

  public render(): void {
    if (!this.visible) return;

    const width = this.canvas.width;
    const height = this.canvas.height;
    const levels = LevelManager.getInstance().getLevels();

    // 1. Background (Dark Overlay)
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    this.ctx.fillRect(0, 0, width, height);

    // 2. Header
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.fillRect(0, 0, width, this.headerHeight);
    
    // Back Button (Left)
    this.ctx.fillStyle = '#ecf0f1';
    this.ctx.font = '24px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('← 返回', 20, 45);

    // Title (Center)
    this.ctx.fillStyle = '#f1c40f';
    this.ctx.font = 'bold 24px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.shadowColor = 'rgba(0,0,0,0.5)';
    this.ctx.shadowBlur = 4;
    this.ctx.fillText('关卡选择', width / 2, 45);
    this.ctx.shadowBlur = 0;

    // 3. List
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.rect(0, this.headerHeight, width, height - this.headerHeight);
    this.ctx.clip();

    let currentY = this.headerHeight + 15 - this.scrollY;

    levels.forEach((level: any) => {
      // Item Box
      const itemX = 20;
      const itemWidth = width - 40;
      
      // Get Image
      let img = this.bgImages.get(level.id);
      if (!img) {
        img = new Image();
        img.src = LevelManager.getInstance().getLevelBackgroundImage(level.id);
        this.bgImages.set(level.id, img);
      }
      
      // 1. Draw Card Shape & Background
      this.ctx.save();
      this.roundRect(this.ctx, itemX, currentY, itemWidth, this.itemHeight, 15);
      this.ctx.clip();

      if (img.complete) {
        this.ctx.drawImage(img, itemX, currentY, itemWidth, this.itemHeight);
      } else {
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(itemX, currentY, itemWidth, this.itemHeight);
      }

      // 2. Overlay (Gradient/Dim)
      if (level.unlocked) {
        const grad = this.ctx.createLinearGradient(itemX, currentY, itemX, currentY + this.itemHeight);
        grad.addColorStop(0, 'rgba(0,0,0,0.3)');
        grad.addColorStop(1, 'rgba(0,0,0,0.8)');
        this.ctx.fillStyle = grad;
      } else {
        this.ctx.fillStyle = 'rgba(0,0,0,0.85)'; // Darker for locked
      }
      this.ctx.fillRect(itemX, currentY, itemWidth, this.itemHeight);
      this.ctx.restore();

      // 3. Border
      this.ctx.save();
      this.roundRect(this.ctx, itemX, currentY, itemWidth, this.itemHeight, 15);
      this.ctx.lineWidth = 2;
      if (level.unlocked) {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      } else {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      }
      this.ctx.stroke();
      this.ctx.restore();

      // 4. Content
      // Level Name
      this.ctx.textAlign = 'left';
      this.ctx.font = 'bold 22px Arial';
      this.ctx.fillStyle = level.unlocked ? '#ecf0f1' : '#7f8c8d';
      this.ctx.shadowColor = 'rgba(0,0,0,0.8)';
      this.ctx.shadowBlur = 4;
      this.ctx.fillText(`${level.id}. ${level.name}`, itemX + 20, currentY + 40);
      this.ctx.shadowBlur = 0;

      // Lock Status / Result
      this.ctx.textAlign = 'right';
      if (!level.unlocked) {
        this.ctx.fillStyle = '#7f8c8d';
        this.ctx.font = '24px Arial';
        this.ctx.fillText('🔒 未解锁', itemX + itemWidth - 20, currentY + 60);
      } else {
        if (level.bestHealth === 100) {
           this.ctx.fillStyle = '#2ecc71';
           this.ctx.font = 'bold 16px Arial';
           this.ctx.fillText('⭐ 完美通关', itemX + itemWidth - 20, currentY + 60);
        } else if (level.bestHealth >= 0) {
           this.ctx.fillStyle = '#f39c12';
           this.ctx.font = 'bold 16px Arial';
           this.ctx.fillText(`⚔️ ${Math.floor(level.bestHealth)}%血量通关`, itemX + itemWidth - 20, currentY + 60);
        } else {
           this.ctx.fillStyle = '#f1c40f';
           this.ctx.font = 'bold 16px Arial';
           this.ctx.fillText('🔥 点击挑战', itemX + itemWidth - 20, currentY + 60);
        }
      }

      currentY += (this.itemHeight + 15);
    });

    this.ctx.restore();
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

  private getCanvasPosition(e: MouseEvent | TouchEvent): { x: number, y: number } | null {
    let clientX, clientY;
    if (e instanceof MouseEvent) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else if (window.TouchEvent && e instanceof TouchEvent) {
        if (e.type === 'touchend') {
            // For touchend, use changedTouches
            if (e.changedTouches.length > 0) {
                clientX = e.changedTouches[0].clientX;
                clientY = e.changedTouches[0].clientY;
            } else {
                return null;
            }
        } else {
            if (e.touches.length > 0) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                return null;
            }
        }
    } else {
      return null;
    }

    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }

  private bindInput(): void {
    const handleStart = (e: MouseEvent | TouchEvent) => {
      if (!this.visible) return;
      
      const pos = this.getCanvasPosition(e);
      if (!pos) return;

      this.isInteractionValid = true;
      this.isDragging = true;
      this.lastY = pos.y;
      this.startY = pos.y;
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!this.visible || !this.isDragging || !this.isInteractionValid) return;
      
      const pos = this.getCanvasPosition(e);
      if (!pos) return;

      const deltaY = pos.y - this.lastY;
      this.scrollY -= deltaY;
      
      // Clamp Scroll
      if (this.scrollY < 0) this.scrollY = 0;
      if (this.scrollY > this.maxScrollY) this.scrollY = this.maxScrollY;
      
      this.lastY = pos.y;
      this.render();
    };

    const handleEnd = (e: MouseEvent | TouchEvent) => {
      if (!this.visible) return;
      
      // Only process if the interaction started when visible
      if (!this.isInteractionValid) return;
      
      this.isDragging = false;
      this.isInteractionValid = false;

      const pos = this.getCanvasPosition(e);
      if (!pos) return;

      const x = pos.x;
      const y = pos.y;
      
      // Determine if it was a click (small movement)
      const moveDist = Math.abs(y - this.startY);
      if (moveDist < 10) {
        // It's a click
        
        // Check Back Button
        if (y < this.headerHeight && x < 100) {
          this.onClose();
          return;
        }

        // Check List Items
        if (y > this.headerHeight) {
          const listY = y - this.headerHeight + this.scrollY - 15;
          const index = Math.floor(listY / (this.itemHeight + 15));
          const levels = LevelManager.getInstance().getLevels();
          
          if (index >= 0 && index < levels.length) {
            const level = levels[index];
            if (level.unlocked) {
              this.onSelect(index);
            }
          }
        }
      }
    };

    // Mouse Events
    this.canvas.addEventListener('mousedown', handleStart);
    this.canvas.addEventListener('mousemove', handleMove);
    this.canvas.addEventListener('mouseup', handleEnd);
    
    // Touch Events
    this.canvas.addEventListener('touchstart', (e) => {
        // Prevent default if we are scrolling (simple heuristic)
        if (this.visible && e.target === this.canvas) {
            // e.preventDefault(); // Maybe don't prevent default globally
        }
        handleStart(e);
    }, { passive: false });
    
    this.canvas.addEventListener('touchmove', (e) => {
       if (this.visible && this.isDragging) {
         e.preventDefault(); // Prevent page scroll when dragging list
       }
       handleMove(e);
    }, { passive: false });
    
    this.canvas.addEventListener('touchend', handleEnd);
  }
}
