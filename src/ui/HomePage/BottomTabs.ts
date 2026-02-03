import { TabId } from './HomePageTypes';
import mallIcon from '../../assets/tabsIcon/mall.png';
import roleIcon from '../../assets/tabsIcon/role.png';
import coreIcon from '../../assets/tabsIcon/core.png';
import battleIcon from '../../assets/tabsIcon/battle.png';

export default class BottomTabs {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private height: number = 80;
  private activeTab: TabId = TabId.BATTLE; // Default to Battle
  private iconImages: Map<TabId, HTMLImageElement> = new Map();
  private onNeedRender?: () => void;
  
  private tabs: { id: TabId, label: string }[] = [
    { id: TabId.SHOP, label: '商城' },
    { id: TabId.ROLE, label: '角色' },
    { id: TabId.CORE, label: '核心' },
    { id: TabId.BATTLE, label: '战斗' }
  ];

  constructor(canvas: HTMLCanvasElement, onNeedRender?: () => void) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.onNeedRender = onNeedRender;
    this.loadIcons();
  }

  private loadIcons() {
    const icons = [
      { id: TabId.SHOP, src: mallIcon },
      { id: TabId.ROLE, src: roleIcon },
      { id: TabId.CORE, src: coreIcon },
      { id: TabId.BATTLE, src: battleIcon }
    ];

    icons.forEach(item => {
      const img = new Image();
      img.onload = () => this.onNeedRender?.();
      img.src = item.src;
      this.iconImages.set(item.id, img);
    });
  }

  public getHeight(): number {
    return this.height;
  }

  public getActiveTab(): TabId {
    return this.activeTab;
  }

  public setActiveTab(id: TabId): void {
    this.activeTab = id;
  }

  public render(): void {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const y = height - this.height;

    // Background
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.fillRect(0, y, width, this.height);
    this.ctx.strokeStyle = '#34495e';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(0, y, width, this.height);

    // Tabs
    const tabWidth = width / this.tabs.length;
    
    this.tabs.forEach((tab, index) => {
      const tabX = index * tabWidth;
      const isActive = tab.id === this.activeTab;

      if (isActive) {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.fillRect(tabX, y, tabWidth, this.height);
      }

      // Icon
      const img = this.iconImages.get(tab.id);
      if (img && img.complete && img.naturalWidth > 0) {
        const iconSize = 40; // Adjust size as needed
        const iconX = tabX + (tabWidth - iconSize) / 2;
        const iconY = y + 10;
        
        // Draw icon
        // Optional: reduce opacity for inactive tabs if desired, but user didn't specify
        this.ctx.globalAlpha = isActive ? 1.0 : 0.6;
        this.ctx.drawImage(img, iconX, iconY, iconSize, iconSize);
        this.ctx.globalAlpha = 1.0;
      }

      // Label
      this.ctx.textAlign = 'center';
      this.ctx.fillStyle = isActive ? '#f1c40f' : '#95a5a6';
      this.ctx.font = isActive ? 'bold 14px Arial' : '14px Arial';
      this.ctx.fillText(tab.label, tabX + tabWidth/2, y + 65);
    });
  }

  public handleClick(x: number, y: number): TabId | null {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const tabsY = height - this.height;

    if (y >= tabsY) {
      const tabWidth = width / this.tabs.length;
      const index = Math.floor(x / tabWidth);
      if (index >= 0 && index < this.tabs.length) {
        this.activeTab = this.tabs[index].id;
        return this.activeTab;
      }
    }
    return null;
  }
}
