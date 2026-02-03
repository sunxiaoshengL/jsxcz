export default class GameUI {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  render(gameState: any): void {
    this.renderTopBar(gameState);
    this.renderLeftButtons(gameState);
    this.renderRightButtons(gameState);
    this.renderBottomInfo(gameState);
  }

  public getTopBarHeight(): number {
    return this.getTopBarLayout().totalHeight;
  }

  private renderTopBar(gameState: any): void {
    const width = this.canvas.width;
    const { safeInset, barHeight: layoutBarHeight } = this.getTopBarLayout();
    
    const fontSize = Math.min(18, width * 0.04);
    const smallFontSize = Math.min(16, width * 0.035);
    const primaryY = safeInset + layoutBarHeight * 0.4;
    const secondaryY = safeInset + layoutBarHeight * 0.7;

    // Add text shadow for visibility on transparent background
    this.ctx.save();
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    this.ctx.shadowBlur = 4;
    this.ctx.shadowOffsetX = 1;
    this.ctx.shadowOffsetY = 1;

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = `bold ${Math.min(24, width * 0.05)}px Arial`;
    this.ctx.textAlign = 'left';
    this.ctx.fillText('||', width * 0.03, primaryY);
    this.ctx.font = `${fontSize}px Arial`;
    const time = this.formatTime(gameState.time);
    this.ctx.fillText(time, width * 0.1, primaryY);
    
    this.ctx.font = `bold ${Math.min(20, width * 0.045)}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.fillText(gameState.levelName || '音乐喷泉', width / 2, primaryY - 5);
    
    this.ctx.font = `${smallFontSize}px Arial`;
    const exp = gameState.experience || 0;
    const expToNext = gameState.experienceToNextLevel || 30;
    const progress = Math.max(0, Math.min(1, expToNext > 0 ? exp / expToNext : 0));
    this.ctx.fillText(`${gameState.level}级  ${Math.floor(progress * 100)}%`, width / 2, secondaryY);
    
    this.ctx.textAlign = 'left';
    this.ctx.font = `bold ${Math.min(24, width * 0.05)}px Arial`;
    this.ctx.fillText('⋯', width - width * 0.08, primaryY);
    
    this.ctx.restore(); // Clear shadow

    const barWidth = width * 0.35;
    const expBarHeight = Math.min(6, this.canvas.height * 0.012);
    const barX = (width - barWidth) / 2;
    const barY = safeInset + layoutBarHeight * 0.85;
    
    this.ctx.fillStyle = 'rgba(255,255,255,0.3)';
    this.ctx.fillRect(barX, barY, barWidth, expBarHeight);
    this.ctx.fillStyle = '#FFD700';
    this.ctx.fillRect(barX, barY, barWidth * progress, expBarHeight);
    
    this.ctx.textAlign = 'left';
  }

  private renderLeftButtons(gameState: any): void {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const topHeight = this.getTopBarHeight();
    
    const buttonSize = Math.min(50, width * 0.12);
    const x = width * 0.04;
    const startY = topHeight + height * 0.02;
    
    const speed = gameState.gameSpeed || 1;
    this.drawRoundedButton(x, startY, buttonSize, buttonSize, '#FFD700', `x${speed}`, '#000');

    const bulletBtnY = startY + buttonSize + 20;
    const bulletColor = gameState.isFiringEnabled ? '#4CAF50' : '#F44336';
    const bulletText = gameState.isFiringEnabled ? '开火' : '停火';
    this.drawRoundedButton(x, bulletBtnY, buttonSize, buttonSize, bulletColor, bulletText, '#fff');
    
    this.ctx.textAlign = 'left';
  }

  private drawRoundedButton(x: number, y: number, sizeW: number, sizeH: number, bgColor: string, text: string, textColor: string) {
    this.ctx.save();
    
    this.ctx.shadowColor = 'rgba(0,0,0,0.4)';
    this.ctx.shadowBlur = 6;
    this.ctx.shadowOffsetY = 2;

    const radius = Math.max(8, Math.min(14, sizeW * 0.28));
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, sizeW, sizeH, radius);
    this.ctx.fillStyle = bgColor;
    this.ctx.fill();
    
    this.ctx.shadowColor = 'transparent';
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, sizeW, sizeH, radius);
    const grad = this.ctx.createLinearGradient(x, y, x, y + sizeH);
    grad.addColorStop(0, 'rgba(255,255,255,0.3)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.1)');
    this.ctx.fillStyle = grad;
    this.ctx.fill();

    this.ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    this.ctx.fillStyle = textColor;
    this.ctx.font = `bold ${Math.max(12, sizeW * 0.45)}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(text, x + sizeW / 2, y + sizeH / 2 + 1);
    
    this.ctx.restore();
  }

  private renderRightButtons(gameState: any): void {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const topHeight = this.getTopBarHeight();
    
    const buttonSize = Math.min(50, width * 0.12);
    const x = width - width * 0.04 - buttonSize;
    const startY = topHeight + height * 0.02;
    
    const gunLevel = gameState.player?.gunLevel || 1;
    this.drawRoundedButton(x, startY, buttonSize, buttonSize, '#9C27B0', `Lv.${gunLevel}`, '#fff');
    
    // 2. Active Skills (Grouped)
    const skillStartY = startY + buttonSize + 20;
    const skills = this.groupSkills(gameState.activeSkills || []);
    
    skills.forEach((skill: any, index: number) => {
      const iconY = skillStartY + (buttonSize + 15) * index;
      const iconX = x;
      const iconCenterX = iconX + buttonSize / 2;
      const iconCenterY = iconY + buttonSize / 2;
      const r = buttonSize / 2;

      this.drawSkillBadge(skill.iconId, iconX, iconY, buttonSize);

      if (skill.level > 0) {
        const badgeR = r * 0.35;
        const badgeX = iconCenterX + r * 0.7;
        const badgeY = iconCenterY + r * 0.7;
        
        this.ctx.beginPath();
        this.ctx.arc(badgeX, badgeY, badgeR, 0, Math.PI * 2);
        this.ctx.fillStyle = '#f1c40f';
        this.ctx.fill();
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        this.ctx.fillStyle = '#000';
        this.ctx.font = `bold ${Math.max(8, badgeR * 1.2)}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(`${skill.level}`, badgeX, badgeY + 1);
      }
    });
    
    this.ctx.textAlign = 'left';
  }

  private drawSkillBadge(skillId: string, x: number, y: number, size: number): void {
    const theme = this.getSkillTheme(skillId);
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    this.ctx.beginPath();
    this.ctx.roundRect(x, y + 2, size, size, Math.max(8, size * 0.25));
    this.ctx.fill();

    const gradient = this.ctx.createLinearGradient(x, y, x, y + size);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.4, theme.accent);
    gradient.addColorStop(1, theme.border);
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, size, size, Math.max(8, size * 0.25));
    this.ctx.fill();
    this.ctx.strokeStyle = theme.border;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, size, size, Math.max(8, size * 0.25));
    this.ctx.stroke();

    this.ctx.fillStyle = theme.text;
    this.ctx.font = `bold ${Math.max(10, size * 0.45)}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(this.getSkillGlyph(skillId), x + size / 2, y + size / 2 + 1);
    this.ctx.textBaseline = 'alphabetic';
  }

  private getSkillGlyph(skillId: string): string {
    if (skillId === 'thermobaric_bomb' || skillId === 'series_thermobaric') return '温';
    if (skillId === 'ice_storm_generator' || skillId === 'series_ice_storm') return '暴';
    if (skillId === 'dry_ice_bomb' || skillId === 'series_dry_ice') return '干';
    if (skillId === 'electromagnetic_railgun' || skillId === 'series_electromagnetic') return '电';
    
    if (skillId.includes('ice') || skillId.includes('frost') || skillId.includes('freeze')) return '冰';
    if (skillId.includes('thermobaric') || skillId.includes('thermal') || skillId === 'bullet_explosion') return '火';
    if (skillId.includes('split')) return '裂';
    if (skillId === 'damage_boost') return '增';
    if (skillId === 'rapid_fire') return '速';
    if (skillId === 'penetration') return '穿';
    if (skillId === 'multi_shot') return '齐';
    return '技';
  }

  private getSkillTheme(skillId: string): { border: string; accent: string; text: string } {
    // Check for series IDs or specific core skills
    if (skillId === 'series_dry_ice' || skillId.includes('dry_ice')) {
      // Dry Ice: White/Silver/Mist style
      return { border: '#bdc3c7', accent: '#ecf0f1', text: '#2c3e50' };
    }
    
    if (skillId === 'series_electromagnetic' || skillId.includes('electromagnetic')) {
      // Electromagnetic: Purple/Electric style
      return { border: '#9b59b6', accent: '#e056fd', text: '#f3e5f5' };
    }

    if (skillId === 'series_ice_storm' || skillId === 'ice_storm_generator') {
      // Ice Storm: Deep Blue/Cyan
      return { border: '#3498db', accent: '#2980b9', text: '#e0f7ff' };
    }

    const isCore = ['thermobaric_bomb', 'ice_storm_generator', 'dry_ice_bomb', 'electromagnetic_railgun'].includes(skillId);
    const isIce = skillId.includes('ice') || skillId.includes('frost') || skillId.includes('freeze');
    const isFire = skillId.includes('thermobaric') || skillId.includes('thermal') || skillId === 'bullet_explosion';
    
    if (isCore && isFire) {
      return { border: '#e67e22', accent: '#d35400', text: '#fff3e0' };
    }
    
    if (isIce) {
      // Generic Ice fallback
      return { border: '#66c7ff', accent: '#8fe3ff', text: '#e0f7ff' };
    }
    if (isFire) {
      // Generic Fire fallback
      return { border: '#ff8a65', accent: '#ffcc80', text: '#fff0e6' };
    }
    if (skillId === 'damage_boost') {
      return { border: '#ffd54f', accent: '#ffe082', text: '#fff8e1' };
    }
    return { border: '#ffd700', accent: '#ffd700', text: '#ffffff' };
  }

  private renderBottomInfo(gameState: any): void {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const fontSize = Math.min(18, width * 0.04);
    
    // 右下角显示护盾和血量 - 无背景
    this.ctx.font = `${fontSize}px Arial`;
    this.ctx.textAlign = 'right';
    
    // 护盾信息
    const shield = gameState.barrier?.shield || 0;
    this.ctx.fillStyle = '#4FC3F7';
    this.ctx.fillText(`🛡️ 护盾: ${shield}`, width - 15, height - 40);
    
    // 血量信息
    const health = Math.floor(gameState.barrierHealth || 0);
    this.ctx.fillStyle = health > 1000 ? '#4CAF50' : health > 500 ? '#FFA500' : '#f44336';
    this.ctx.fillText(`❤️ 血量: ${health}`, width - 15, height - 15);
    
    this.ctx.textAlign = 'left';
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  public renderPauseMenu(gameState: any): void {
    void gameState;
    const width = this.canvas.width;
    const height = this.canvas.height;

    this.ctx.save();

    // Dark Overlay with blur effect simulation
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, width, height);

    // Modal Window
    const modalWidth = Math.min(400, width * 0.85);
    const modalHeight = Math.min(350, height * 0.6);
    const modalX = (width - modalWidth) / 2;
    const modalY = (height - modalHeight) / 2;

    // Drop Shadow
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    this.ctx.shadowBlur = 20;
    this.ctx.shadowOffsetY = 10;

    // Modal Background
    this.ctx.beginPath();
    this.ctx.roundRect(modalX, modalY, modalWidth, modalHeight, 20);
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.fill();
    
    // Reset Shadow
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetY = 0;

    // Header Background
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
    this.ctx.fillStyle = '#f39c12'; // Orange for Pause
    this.ctx.fill();
    this.ctx.restore();

    // Title
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 28px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('游戏暂停', width / 2, modalY + 30);

    // Buttons
    const buttonWidth = Math.min(200, modalWidth * 0.7);
    const buttonHeight = 44;
    const buttonGap = 20;
    const buttonsStartY = modalY + 100;

    // 1. Continue
    this.drawMenuButton(width / 2 - buttonWidth / 2, buttonsStartY, buttonWidth, buttonHeight, '继续游戏', '#27ae60');

    // 2. Restart
    this.drawMenuButton(width / 2 - buttonWidth / 2, buttonsStartY + buttonHeight + buttonGap, buttonWidth, buttonHeight, '重新开始', '#e74c3c');

    // 3. Home
    this.drawMenuButton(width / 2 - buttonWidth / 2, buttonsStartY + (buttonHeight + buttonGap) * 2, buttonWidth, buttonHeight, '回到首页', '#3498db');

    this.ctx.restore();
  }

  private drawMenuButton(x: number, y: number, w: number, h: number, text: string, color: string) {
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, w, h, 10);
    this.ctx.fillStyle = color;
    this.ctx.fill();
    
    // Shine
    this.ctx.save();
    this.ctx.clip();
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.fillRect(x, y, w, h/2);
    this.ctx.restore();

    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(text, x + w / 2, y + h / 2);
  }

  public getSpeedButtonBounds() {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const topHeight = this.getTopBarHeight();
    const buttonSize = Math.min(50, width * 0.12);
    const x = width * 0.04;
    const startY = topHeight + height * 0.02;

    const padding = 10;

    return {
      x: x - padding,
      y: startY - padding,
      width: buttonSize + padding * 2,
      height: buttonSize + padding * 2
    };
  }

  public getBulletToggleButtonBounds() {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const topHeight = this.getTopBarHeight();
    const buttonSize = Math.min(50, width * 0.12);
    const x = width * 0.04;
    const startY = topHeight + height * 0.02;
    const bulletBtnY = startY + buttonSize + 20;

    const padding = 10;

    return {
      x: x - padding,
      y: bulletBtnY - padding,
      width: buttonSize + padding * 2,
      height: buttonSize + padding * 2
    };
  }

  public getPauseButtonBounds() {
    const width = this.canvas.width;
    const topHeight = this.getTopBarHeight();
    
    // The text '||' is drawn at width * 0.03, topHeight * 0.35
    // Let's define a clickable area around it
    return {
      x: 0,
      y: 0,
      width: width * 0.15, // generously sized for touch
      height: topHeight * 0.6
    };
  }

  private getTopBarLayout(): { safeInset: number; barHeight: number; totalHeight: number } {
    const height = this.canvas.height;
    const safeInset = Math.max(18, Math.min(36, height * 0.04));
    const barHeight = Math.max(52, Math.min(76, height * 0.09));
    return { safeInset, barHeight, totalHeight: safeInset + barHeight };
  }

  public getPauseMenuButtonsBounds() {
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    const modalWidth = Math.min(400, width * 0.85);
    const modalHeight = Math.min(350, height * 0.6);
    const modalY = (height - modalHeight) / 2;
    
    const buttonWidth = Math.min(200, modalWidth * 0.7);
    const buttonHeight = 44;
    const buttonGap = 20;
    const buttonsStartY = modalY + 100;

    const buttonX = (width - buttonWidth) / 2;
    
    const continueY = buttonsStartY;
    const restartY = buttonsStartY + buttonHeight + buttonGap;
    const homeY = buttonsStartY + (buttonHeight + buttonGap) * 2;

    return {
      continueButton: {
        x: buttonX,
        y: continueY,
        width: buttonWidth,
        height: buttonHeight
      },
      restartButton: {
        x: buttonX,
        y: restartY,
        width: buttonWidth,
        height: buttonHeight
      },
      homeButton: {
        x: buttonX,
        y: homeY,
        width: buttonWidth,
        height: buttonHeight
      }
    };
  }

  getGameAreaBounds() {
    return {
      x: 0,
      y: 0,
      width: this.canvas.width,
      height: this.canvas.height
    };
  }

  private getSkillSeriesKey(skillId: string): string | null {
    if (skillId.startsWith('dry_ice_')) return 'series_dry_ice';
    if (skillId.startsWith('thermobaric_') || skillId.startsWith('thermal_') || skillId === 'bullet_explosion' || skillId === 'explosion_spark') return 'series_thermobaric';
    if (skillId.startsWith('ice_') || skillId.startsWith('frost_') || skillId.startsWith('freeze_') || skillId === 'ice_storm_generator' || skillId === 'four_way_split' || skillId === 'chain_ice_storm') return 'series_ice_storm';
    if (skillId.startsWith('electromagnetic_')) return 'series_electromagnetic';
    return null;
  }

  private getSeriesIconId(seriesId: string): string {
    if (seriesId === 'series_dry_ice') return 'dry_ice_bomb';
    if (seriesId === 'series_thermobaric') return 'thermobaric_bomb';
    if (seriesId === 'series_ice_storm') return 'ice_storm_generator';
    if (seriesId === 'series_electromagnetic') return 'electromagnetic_railgun';
    return seriesId;
  }

  private groupSkills(skills: any[]): Array<{ seriesId: string; iconId: string; level: number }> {
    const grouped = new Map<string, { seriesId: string; iconId: string; level: number }>();
    for (const skill of skills) {
      const seriesId = this.getSkillSeriesKey(skill.id);
      if (!seriesId) continue; // Skip skills that don't belong to the 4 main series (e.g. generic gun upgrades)

      const iconId = this.getSeriesIconId(seriesId);
      const current = grouped.get(seriesId);
      const lv = Math.max(1, skill.level || 1);
      if (current) {
        current.level += lv;
      } else {
        grouped.set(seriesId, { seriesId, iconId, level: lv });
      }
    }
    return Array.from(grouped.values());
  }
}
