import { Skill } from '../game/SkillPool';

export default class LevelUpUI {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private onSelect: (skillId: string) => void;
  private visible: boolean = false;
  private skills: Skill[] = [];
  
  // 奖励展示模式相关
  private isRewardMode: boolean = false;
  private rewardTitle: string = '';
  private rewardTimer: number | null = null;
  
  constructor(canvas: HTMLCanvasElement, onSelect: (skillId: string) => void) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.onSelect = onSelect;
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
    this.canvas.addEventListener('touchstart', (e) => this.handleTouch(e));

  }

  show(skills: Skill[]): void {
    if (this.rewardTimer) {
        clearTimeout(this.rewardTimer);
        this.rewardTimer = null;
    }
    this.visible = true;
    this.isRewardMode = false;
    this.skills = skills;
    this.render();
  }
  
  // 显示奖励（非交互模式）
  showReward(skills: Skill[], title: string, duration: number): void {
    this.visible = true;
    this.isRewardMode = true;
    this.skills = skills;
    this.rewardTitle = title;
    
    if (this.rewardTimer) {
        clearTimeout(this.rewardTimer);
    }
    
    this.rewardTimer = window.setTimeout(() => {
        this.hide();
    }, duration);
    
    this.render();
  }

  hide(): void {
    this.visible = false;
    this.isRewardMode = false;
    if (this.rewardTimer) {
        clearTimeout(this.rewardTimer);
        this.rewardTimer = null;
    }
  }

  public isVisible(): boolean {
    return this.visible;
  }
  
  // 如果是奖励模式，不阻塞游戏逻辑，所以此方法可以用来判断是否需要暂停游戏
  public isInteractive(): boolean {
    return this.visible && !this.isRewardMode;
  }

  private handleClick(event: MouseEvent): void {
    if (!this.visible || this.isRewardMode) return; // 奖励模式下不可点击

    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    const width = this.canvas.width;
    const height = this.canvas.height;
    const buttonWidth = Math.max(80, Math.min(120, width * 0.22));
    const buttonHeight = Math.max(100, Math.min(140, height * 0.16));
    const gap = Math.max(10, Math.min(20, width * 0.04));
    const totalWidth = buttonWidth * this.skills.length + gap * (this.skills.length - 1);
    const startX = (width - totalWidth) / 2;
    const buttonY = height / 2 - buttonHeight / 2;

    for (let i = 0; i < this.skills.length; i++) {
      const buttonX = startX + i * (buttonWidth + gap);
      if (x > buttonX && x < buttonX + buttonWidth && y > buttonY && y < buttonY + buttonHeight) {
        this.hide();
        this.onSelect(this.skills[i].id);
        break;
      }
    }
  }

  private handleTouch(event: TouchEvent): void {
    if (!this.visible || this.isRewardMode) return; // 奖励模式下不可点击

    event.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const x = (event.touches[0].clientX - rect.left) * scaleX;
    const y = (event.touches[0].clientY - rect.top) * scaleY;

    const width = this.canvas.width;
    const height = this.canvas.height;
    const buttonWidth = Math.max(80, Math.min(120, width * 0.22));
    const buttonHeight = Math.max(100, Math.min(140, height * 0.16));
    const gap = Math.max(10, Math.min(20, width * 0.04));
    const totalWidth = buttonWidth * this.skills.length + gap * (this.skills.length - 1);
    const startX = (width - totalWidth) / 2;
    const buttonY = height / 2 - buttonHeight / 2;

    for (let i = 0; i < this.skills.length; i++) {
      const buttonX = startX + i * (buttonWidth + gap);
      if (x > buttonX && x < buttonX + buttonWidth && y > buttonY && y < buttonY + buttonHeight) {
        this.hide();
        this.onSelect(this.skills[i].id);
        break;
      }
    }
  }

  render(): void {
    if (!this.visible) return;

    const width = this.canvas.width;
    const height = this.canvas.height;

    this.ctx.save();

    // Semi-transparent background to focus on UI but keep game visible
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(0, 0, width, height);

    // Responsive Title
    const titleSize = Math.max(20, Math.min(36, width * 0.06));
    this.ctx.font = `bold ${titleSize}px Arial`;
    this.ctx.textAlign = 'center';
    
    // Title text
    const titleText = this.isRewardMode ? this.rewardTitle : '升级！选择一个技能';
    
    // Title Shadow/Glow
    this.ctx.shadowColor = 'rgba(0,0,0,0.8)';
    this.ctx.shadowBlur = 10;
    this.ctx.fillStyle = '#FFD700';
    this.ctx.fillText(titleText, width / 2, height * 0.2);
    this.ctx.shadowBlur = 0;

    // Responsive Button Layout
    const buttonWidth = Math.max(80, Math.min(130, width * 0.22)); // Slightly wider
    const buttonHeight = Math.max(120, Math.min(160, height * 0.22)); // Slightly taller
    const gap = Math.max(10, Math.min(25, width * 0.04));
    const totalWidth = buttonWidth * this.skills.length + gap * (this.skills.length - 1);
    const startX = (width - totalWidth) / 2;
    const buttonY = (height - buttonHeight) / 2;

    for (let i = 0; i < this.skills.length; i++) {
      const skill = this.skills[i];
      const buttonX = startX + i * (buttonWidth + gap);
      const theme = this.getSkillTheme(skill.id);
      
      // Card Shadow
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      this.ctx.shadowBlur = 15;
      this.ctx.shadowOffsetY = 8;

      // Card Background (Rounded)
      this.ctx.beginPath();
      this.ctx.roundRect(buttonX, buttonY, buttonWidth, buttonHeight, 15);
      const cardGradient = this.ctx.createLinearGradient(buttonX, buttonY, buttonX, buttonY + buttonHeight);
      cardGradient.addColorStop(0, theme.bgFrom);
      cardGradient.addColorStop(1, theme.bgTo);
      this.ctx.fillStyle = cardGradient;
      this.ctx.fill();
      
      // Reset Shadow
      this.ctx.shadowColor = 'transparent';
      this.ctx.shadowBlur = 0;
      this.ctx.shadowOffsetY = 0;

      // Card Border
      this.ctx.strokeStyle = theme.border;
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      
      // Shine Effect (Top half)
      this.ctx.save();
      this.ctx.clip();
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      this.ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight * 0.4);
      this.ctx.restore();

      const tags = this.getSkillTags(skill.id);
      if (tags.length > 0) {
        const tagText = tags.slice(0, 2).join(' · ');
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.roundRect(buttonX + 5, buttonY + 5, buttonWidth - 10, 20, 10);
        this.ctx.fill();
        
        this.ctx.fillStyle = theme.accent;
        this.ctx.font = 'bold 11px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(tagText, buttonX + buttonWidth / 2, buttonY + 19);
      }

      // Responsive Icon
      const iconSize = Math.max(30, Math.min(50, buttonWidth * 0.4));
      const iconY = buttonY + buttonHeight * 0.35;
      this.drawSkillIcon(skill.id, buttonX + buttonWidth / 2, iconY, iconSize, theme);

      // Skill Name
      const nameSize = Math.max(12, Math.min(16, buttonWidth * 0.13));
      this.ctx.fillStyle = theme.text;
      this.ctx.font = `bold ${nameSize}px Arial`;
      this.ctx.fillText(skill.name, buttonX + buttonWidth / 2, buttonY + buttonHeight * 0.65);
      
      // Description
      const descSize = Math.max(9, Math.min(11, buttonWidth * 0.09));
      this.ctx.font = `${descSize}px Arial`;
      this.ctx.fillStyle = 'rgba(255,255,255,0.8)';
      const maxWidth = buttonWidth - 10;
      const lines = this.wrapText(skill.description, maxWidth);
      const lineHeight = descSize * 1.3;
      const startTextY = buttonY + buttonHeight * 0.78;
      const maxLines = 2;
      
      const displayLines = lines.slice(0, maxLines);
      displayLines.forEach((line, index) => {
        if (index === maxLines - 1 && lines.length > maxLines) {
           line = line.substring(0, line.length - 2) + '...';
        }
        this.ctx.fillText(line, buttonX + buttonWidth / 2, startTextY + index * lineHeight);
      });
    }
    
    this.ctx.restore();
  }

  private wrapText(text: string, maxWidth: number): string[] {
    const chars = text.split('');
    const lines: string[] = [];
    let currentLine = '';

    for (const char of chars) {
      const testLine = currentLine + char;
      const metrics = this.ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = char;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine.length > 0) {
      lines.push(currentLine);
    }
    
    return lines;
  }

  private drawSkillIcon(skillId: string, x: number, y: number, size: number, theme: { accent: string; border: string; text: string }): void {
    const r = size * 0.55;
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    this.ctx.beginPath();
    this.ctx.arc(x, y + 2, r + 2, 0, Math.PI * 2);
    this.ctx.fill();

    const gradient = this.ctx.createRadialGradient(x, y - r * 0.2, r * 0.2, x, y, r);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.4, theme.accent);
    gradient.addColorStop(1, theme.border);
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(x, y, r, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.strokeStyle = theme.border;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(x, y, r, 0, Math.PI * 2);
    this.ctx.stroke();

    const label = this.getSkillGlyph(skillId);
    this.ctx.fillStyle = theme.text;
    this.ctx.font = `bold ${Math.max(12, size * 0.55)}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(label, x, y + 1);
    this.ctx.textBaseline = 'alphabetic';
  }

  private getSkillGlyph(skillId: string): string {
    if (skillId === 'thermobaric_bomb') return '温';
    if (skillId === 'ice_storm_generator') return '暴';
    if (skillId.includes('ice') || skillId.includes('frost') || skillId.includes('freeze')) return '冰';
    if (skillId.includes('thermobaric') || skillId.includes('thermal') || skillId === 'bullet_explosion') return '火';
    if (skillId.includes('split')) return '裂';
    if (skillId === 'damage_boost') return '增';
    if (skillId === 'rapid_fire') return '速';
    if (skillId === 'penetration') return '穿';
    if (skillId === 'multi_shot') return '齐';
    return '技';
  }

  private getSkillTheme(skillId: string): { bgFrom: string; bgTo: string; border: string; accent: string; text: string } {
    const isCore = ['thermobaric_bomb', 'ice_storm_generator', 'dry_ice_bomb', 'electromagnetic_railgun'].includes(skillId);
    const isIce = skillId.includes('ice') || skillId.includes('frost') || skillId.includes('freeze');
    const isFire = skillId.includes('thermobaric') || skillId.includes('thermal') || skillId === 'bullet_explosion';
    const isSplit = skillId.includes('split');
    if (isCore && isIce) {
      return { bgFrom: '#1b2a4a', bgTo: '#0d1a33', border: '#6dd5ff', accent: '#7fd3ff', text: '#e6f7ff' };
    }
    if (isCore && isFire) {
      return { bgFrom: '#3a1a1a', bgTo: '#1f0d0d', border: '#ffb74d', accent: '#ffcc80', text: '#fff3e0' };
    }
    if (isIce) {
      return { bgFrom: '#1d3b5a', bgTo: '#0c233a', border: '#66c7ff', accent: '#8fe3ff', text: '#e0f7ff' };
    }
    if (isFire) {
      return { bgFrom: '#402016', bgTo: '#2a140d', border: '#ff8a65', accent: '#ffcc80', text: '#fff0e6' };
    }
    if (isSplit) {
      return { bgFrom: '#2c2b4a', bgTo: '#1b1a33', border: '#b39ddb', accent: '#d1c4e9', text: '#f3e5f5' };
    }
    if (skillId === 'damage_boost') {
      return { bgFrom: '#3b2b1a', bgTo: '#2a1f10', border: '#ffd54f', accent: '#ffe082', text: '#fff8e1' };
    }
    return { bgFrom: '#2d2d44', bgTo: '#1f1f2f', border: '#ffd700', accent: '#ffd700', text: '#ffffff' };
  }

  private getSkillTags(skillId: string): string[] {
    const tags: string[] = [];
    if (['thermobaric_bomb', 'ice_storm_generator', 'dry_ice_bomb', 'electromagnetic_railgun'].includes(skillId)) {
      tags.push('核心');
    }
    if (skillId.includes('ice') || skillId.includes('frost') || skillId.includes('freeze')) {
      tags.push('冰系');
    }
    if (skillId.includes('thermobaric') || skillId.includes('thermal') || skillId === 'bullet_explosion') {
      tags.push('火系');
    }
    if (skillId.includes('split')) {
      tags.push('分裂');
    }
    if (skillId === 'damage_boost') {
      tags.push('增伤');
    }
    return tags;
  }
}
