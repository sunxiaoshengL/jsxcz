import { ITab, TabId } from '../HomePageTypes';
// @ts-ignore
import dryIceBombIcon from '../../../assets/coreSkillIcon/dryIceBomb.png';
// @ts-ignore
import electromagneticRailgunIcon from '../../../assets/coreSkillIcon/electromagneticRailgun.png';
// @ts-ignore
import thermobaricBombIcon from '../../../assets/coreSkillIcon/thermobaricBomb.png';
// @ts-ignore
import iceStormGeneratorIcon from '../../../assets/coreSkillIcon/iceStormGenerator.png';

export default class CoreTab implements ITab {
  id: TabId = TabId.CORE;
  
  private icons: { name: string, img: HTMLImageElement, desc: string }[] = [];
  
  // Scrolling
  private scrollY: number = 0;
  private maxScroll: number = 0;
  private isDragging: boolean = false;
  private lastY: number = 0;
  private contentHeight: number = 0;

  constructor() {
    this.loadIcons();
  }

  private loadIcons(): void {
    const createIcon = (name: string, src: string, desc: string) => {
      const img = new Image();
      img.src = src;
      return { name, img, desc };
    };

    this.icons = [
      createIcon('干冰弹', dryIceBombIcon, '核心技能'),
      createIcon('电磁穿刺', electromagneticRailgunIcon, '核心技能'),
      createIcon('温压弹', thermobaricBombIcon, '核心技能'),
      createIcon('冰暴发生器', iceStormGeneratorIcon, '核心技能')
    ];
    // Duplicate for testing scroll if needed, but 4 is enough to test if small screen
  }

  render(ctx: CanvasRenderingContext2D, rect: { x: number, y: number, width: number, height: number }): void {
    // Background
    const bgGradient = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.height);
    bgGradient.addColorStop(0, '#2b3a4a');
    bgGradient.addColorStop(1, '#1f2a36');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

    const headerHeight = Math.max(54, Math.min(70, rect.height * 0.12));
    
    // Header
    ctx.save();
    ctx.fillStyle = '#243140';
    ctx.fillRect(rect.x, rect.y, rect.width, headerHeight);
    
    ctx.fillStyle = '#f3f6fb';
    const titleSize = Math.max(18, Math.min(24, rect.width * 0.055));
    ctx.font = `bold ${titleSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('核心技能预览', rect.x + rect.width / 2, rect.y + headerHeight / 2);
    
    // Header Shadow
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 2;
    ctx.fillRect(rect.x, rect.y + headerHeight - 2, rect.width, 2);
    ctx.restore();

    // Scrollable Content Area
    const contentY = rect.y + headerHeight;
    const contentHeight = rect.height - headerHeight;
    
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, contentY, rect.width, contentHeight);
    ctx.clip();

    // Grid Layout
    const cols = rect.width >= 520 ? 3 : 2;
    const gap = Math.max(10, Math.min(18, rect.width * 0.04));
    const sidePadding = Math.max(12, Math.min(20, rect.width * 0.045));
    const itemWidth = (rect.width - sidePadding * 2 - gap * (cols - 1)) / cols;
    const itemHeight = Math.max(120, itemWidth * 1.05);
    
    // Calculate total content height
    const rows = Math.ceil(this.icons.length / cols);
    this.contentHeight = rows * itemHeight + (rows + 1) * gap + sidePadding;
    this.maxScroll = Math.max(0, this.contentHeight - contentHeight);
    
    // Clamp scroll
    this.scrollY = Math.max(0, Math.min(this.scrollY, this.maxScroll));

    const startY = contentY - this.scrollY + sidePadding;

    this.icons.forEach((item, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = rect.x + sidePadding + col * (itemWidth + gap);
      const y = startY + row * (itemHeight + gap);
      
      // Optimization: Skip rendering if out of view
      if (y + itemHeight < contentY || y > contentY + contentHeight) return;

      const centerX = x + itemWidth / 2;

      const cardRadius = Math.max(10, itemWidth * 0.08);

      // Card Shadow
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 4;

      // Card Background (Rounded)
      this.roundRect(ctx, x, y, itemWidth, itemHeight, cardRadius);
      const cardGradient = ctx.createLinearGradient(x, y, x, y + itemHeight);
      cardGradient.addColorStop(0, '#324357');
      cardGradient.addColorStop(1, '#263445');
      ctx.fillStyle = cardGradient;
      ctx.fill();
      ctx.restore();

      // Card Border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      this.roundRect(ctx, x, y, itemWidth, itemHeight, cardRadius);
      ctx.stroke();

      // Card Highlight
      ctx.save();
      this.roundRect(ctx, x, y, itemWidth, itemHeight, cardRadius);
      ctx.clip();
      const highlight = ctx.createLinearGradient(x, y, x, y + itemHeight * 0.6);
      highlight.addColorStop(0, 'rgba(255,255,255,0.08)');
      highlight.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = highlight;
      ctx.fillRect(x, y, itemWidth, itemHeight * 0.6);
      ctx.restore();

      // Tag
      const tagText = '核心';
      const tagHeight = Math.max(16, itemWidth * 0.14);
      const tagPaddingX = Math.max(10, itemWidth * 0.12);
      const tagWidth = Math.min(itemWidth * 0.42, tagPaddingX + tagText.length * (tagHeight * 0.6));
      const tagX = x + itemWidth - tagWidth - 10;
      const tagY = y + 10;
      this.roundRect(ctx, tagX, tagY, tagWidth, tagHeight, tagHeight / 2);
      ctx.fillStyle = 'rgba(241, 196, 15, 0.15)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(241, 196, 15, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#f1c40f';
      ctx.font = `bold ${Math.max(10, tagHeight * 0.6)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tagText, tagX + tagWidth / 2, tagY + tagHeight / 2);

      // Icon Background Circle
      const iconSize = itemWidth * 0.42;
      const iconY = y + itemHeight * 0.22;
      const iconR = iconSize / 2 + 6;
      ctx.beginPath();
      ctx.arc(centerX, iconY + iconSize / 2, iconR, 0, Math.PI * 2);
      const iconBg = ctx.createRadialGradient(centerX, iconY + iconSize / 2 - iconR * 0.3, iconR * 0.2, centerX, iconY + iconSize / 2, iconR);
      iconBg.addColorStop(0, 'rgba(255,255,255,0.18)');
      iconBg.addColorStop(1, 'rgba(0,0,0,0.25)');
      ctx.fillStyle = iconBg;
      ctx.fill();

      // Icon
      if (item.img.complete) {
        ctx.drawImage(item.img, centerX - iconSize / 2, iconY, iconSize, iconSize);
      } else {
        ctx.fillStyle = '#7f8c8d';
        ctx.beginPath();
        ctx.arc(centerX, iconY + iconSize / 2, iconSize / 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Name
      ctx.fillStyle = '#f4f7fb';
      ctx.font = `bold ${Math.max(14, itemWidth * 0.1)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.name, centerX, y + itemHeight * 0.72);
      
      // Desc
      ctx.fillStyle = 'rgba(224, 229, 235, 0.85)';
      ctx.font = `${Math.max(11, itemWidth * 0.075)}px Arial`;
      ctx.fillText(item.desc, centerX, y + itemHeight * 0.86);
    });

    ctx.restore();
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

  handleStart(x: number, y: number): void {
    void x;
    this.isDragging = true;
    this.lastY = y;
  }

  handleMove(x: number, y: number): void {
    void x;
    if (!this.isDragging) return;
    
    const deltaY = y - this.lastY;
    this.scrollY -= deltaY;
    // Clamp will happen in render
    
    this.lastY = y;
  }

  handleEnd(): void {
    this.isDragging = false;
  }

  handleClick(_x: number, _y: number, _rect: { x: number, y: number, width: number, height: number }): void {
    // No interaction for now
  }

  onShow(): void {}
  onHide(): void {}
}
