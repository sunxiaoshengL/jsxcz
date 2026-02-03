import { ITab, TabId } from '../HomePageTypes';
import LevelManager from '../../../data/LevelManager';

export default class BattleTab implements ITab {
  id: TabId = TabId.BATTLE;
  private onStart: () => void;
  private onOpenLevelSelect: () => void;
  
  // Layout Cache
  private startButtonRect: { x: number, y: number, width: number, height: number } | null = null;
  private leftArrowRect: { x: number, y: number, width: number, height: number } | null = null;
  private rightArrowRect: { x: number, y: number, width: number, height: number } | null = null;
  private centerIconRect: { x: number, y: number, width: number, height: number } | null = null;

  // Image Cache
  private currentLevelId: number = -1;
  private currentBgImage: HTMLImageElement = new Image();

  constructor(onStart: () => void, onOpenLevelSelect: () => void) {
    this.onStart = onStart;
    this.onOpenLevelSelect = onOpenLevelSelect;
  }

  render(ctx: CanvasRenderingContext2D, rect: { x: number, y: number, width: number, height: number }): void {
    const levelManager = LevelManager.getInstance();
    const currentLevel = levelManager.getCurrentLevel();
    const levels = levelManager.getLevels();
    const currentIndex = levels.indexOf(currentLevel);

    // Update Image if Level Changed
    if (this.currentLevelId !== currentLevel.id) {
      this.currentLevelId = currentLevel.id;
      this.currentBgImage.src = levelManager.getLevelBackgroundImage(currentLevel.id);
    }

    // Background (Level Image with Overlay)
    if (this.currentBgImage.complete) {
      ctx.drawImage(this.currentBgImage, rect.x, rect.y, rect.width, rect.height);
      
      // Semi-transparent dark overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)'; // Adjust opacity as needed
      ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    } else {
      // Fallback Gradient if image not loaded
      const bgGradient = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.height);
      bgGradient.addColorStop(0, '#2c3e50');
      bgGradient.addColorStop(1, '#000000');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    }

    const centerX = rect.x + rect.width / 2;
    const centerY = rect.y + rect.height / 2;

    // 1. Level Title
    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 4;
    ctx.fillText(`${currentLevel.id}. ${currentLevel.name}`, centerX, centerY - 140);
    ctx.shadowBlur = 0;

    // 2. Center Icon (Level Image Preview)
    const iconWidth = Math.min(300, rect.width * 0.8);
    const iconHeight = iconWidth * 0.6; // 16:9 ish
    const iconX = centerX - iconWidth / 2;
    const iconY = centerY - iconHeight / 2 - 20;
    
    this.centerIconRect = { x: iconX, y: iconY, width: iconWidth, height: iconHeight };
    
    // Draw Card Shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 5;
    
    // Draw Rounded Box
    this.roundRect(ctx, iconX, iconY, iconWidth, iconHeight, 10);
    ctx.fillStyle = '#34495e';
    ctx.fill();
    ctx.restore();

    // Clip and Draw Image
    ctx.save();
    this.roundRect(ctx, iconX, iconY, iconWidth, iconHeight, 10);
    ctx.clip();
    
    if (this.currentBgImage.complete) {
      ctx.drawImage(this.currentBgImage, iconX, iconY, iconWidth, iconHeight);
    } else {
      // Loading placeholder
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(iconX, iconY, iconWidth, iconHeight);
      ctx.fillStyle = '#ecf0f1';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Loading...', centerX, iconY + iconHeight / 2);
    }
    
    // Darken bottom of image for text
    const gradient = ctx.createLinearGradient(iconX, iconY + iconHeight - 40, iconX, iconY + iconHeight);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.7)');
    ctx.fillStyle = gradient;
    ctx.fillRect(iconX, iconY + iconHeight - 40, iconWidth, 40);
    
    ctx.restore();

    // Border
    ctx.strokeStyle = '#ecf0f1';
    ctx.lineWidth = 2;
    this.roundRect(ctx, iconX, iconY, iconWidth, iconHeight, 10);
    ctx.stroke();
    
    // Draw "Click to Select" Hint inside
    ctx.fillStyle = '#ecf0f1';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('点击切换关卡', centerX, iconY + iconHeight - 10);

    // 3. Arrows
    const arrowSize = 40;
    const arrowY = iconY + iconHeight / 2 - arrowSize / 2;
    
    // Left Arrow
    if (currentIndex > 0) {
      const leftArrowX = iconX - arrowSize - 20;
      this.leftArrowRect = { x: leftArrowX, y: arrowY, width: arrowSize, height: arrowSize };
      
      ctx.fillStyle = '#ecf0f1';
      ctx.beginPath();
      ctx.moveTo(leftArrowX + arrowSize, arrowY);
      ctx.lineTo(leftArrowX, arrowY + arrowSize / 2);
      ctx.lineTo(leftArrowX + arrowSize, arrowY + arrowSize);
      ctx.fill();
    } else {
      this.leftArrowRect = null;
    }

    // Right Arrow
    if (currentIndex < levels.length - 1) {
       // Only show right arrow if next level exists
       const rightArrowX = iconX + iconWidth + 20;
       this.rightArrowRect = { x: rightArrowX, y: arrowY, width: arrowSize, height: arrowSize };

       ctx.fillStyle = '#ecf0f1';
       ctx.beginPath();
       ctx.moveTo(rightArrowX, arrowY);
       ctx.lineTo(rightArrowX + arrowSize, arrowY + arrowSize / 2);
       ctx.lineTo(rightArrowX, arrowY + arrowSize);
       ctx.fill();
    } else {
      this.rightArrowRect = null;
    }

    // 4. Start Button
    const buttonWidth = Math.min(220, rect.width * 0.6);
    const buttonHeight = 60;
    const buttonX = centerX - buttonWidth / 2;
    const buttonY = rect.y + rect.height - buttonHeight - 40;

    this.startButtonRect = { x: buttonX, y: buttonY, width: buttonWidth, height: buttonHeight };
    
    // Button Shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 10;
    
    if (currentLevel.unlocked) {
       this.roundRect(ctx, buttonX, buttonY, buttonWidth, buttonHeight, 30);
       ctx.fillStyle = '#f1c40f';
       ctx.fill();
       ctx.restore();

       ctx.fillStyle = '#2c3e50';
       ctx.font = 'bold 24px Arial';
       ctx.textAlign = 'center';
       ctx.textBaseline = 'middle';
       
       let buttonText = '开始游戏';
       if (currentLevel.bestHealth >= 0) {
          buttonText = '重新挑战';
       }
       ctx.fillText(buttonText, centerX, buttonY + buttonHeight / 2);
       
       // Cost hint
       ctx.textBaseline = 'alphabetic';
       ctx.font = '14px Arial';
       ctx.fillStyle = '#c0392b';
       ctx.fillText('🍗 5', centerX, buttonY - 10);
    } else {
       this.roundRect(ctx, buttonX, buttonY, buttonWidth, buttonHeight, 30);
       ctx.fillStyle = '#7f8c8d';
       ctx.fill();
       ctx.restore();

       ctx.fillStyle = '#2c3e50';
       ctx.font = 'bold 24px Arial';
       ctx.textAlign = 'center';
       ctx.textBaseline = 'middle';
       ctx.fillText('等待解锁', centerX, buttonY + buttonHeight / 2);
    }
    ctx.textBaseline = 'alphabetic';
  }

  handleClick(x: number, y: number, _rect: { x: number, y: number, width: number, height: number }): void {
    const levelManager = LevelManager.getInstance();
    const levels = levelManager.getLevels();
    const currentIndex = levels.indexOf(levelManager.getCurrentLevel());

    // 1. Center Icon -> Level Select
    if (this.centerIconRect && 
        x >= this.centerIconRect.x && x <= this.centerIconRect.x + this.centerIconRect.width &&
        y >= this.centerIconRect.y && y <= this.centerIconRect.y + this.centerIconRect.height) {
      this.onOpenLevelSelect();
      return;
    }

    // 2. Left Arrow
    if (this.leftArrowRect && 
        x >= this.leftArrowRect.x && x <= this.leftArrowRect.x + this.leftArrowRect.width &&
        y >= this.leftArrowRect.y && y <= this.leftArrowRect.y + this.leftArrowRect.height) {
      if (currentIndex > 0) {
        levelManager.setCurrentLevel(currentIndex - 1);
      }
      return;
    }

    // 3. Right Arrow
    if (this.rightArrowRect && 
        x >= this.rightArrowRect.x && x <= this.rightArrowRect.x + this.rightArrowRect.width &&
        y >= this.rightArrowRect.y && y <= this.rightArrowRect.y + this.rightArrowRect.height) {
      if (currentIndex < levels.length - 1) {
        levelManager.setCurrentLevel(currentIndex + 1);
      }
      return;
    }

    // 4. Start Button
    if (this.startButtonRect && 
        x >= this.startButtonRect.x && x <= this.startButtonRect.x + this.startButtonRect.width &&
        y >= this.startButtonRect.y && y <= this.startButtonRect.y + this.startButtonRect.height) {
      if (levelManager.getCurrentLevel().unlocked) {
        this.onStart();
      }
    }
  }

  onShow(): void {}
  onHide(): void {}
  
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
