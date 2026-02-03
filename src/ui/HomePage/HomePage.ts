import TopBar from './TopBar';
import BottomTabs from './BottomTabs';
import { ITab, TabId } from './HomePageTypes';
import ShopTab from './tabs/ShopTab';
import RoleTab from './tabs/RoleTab';
import CoreTab from './tabs/CoreTab';
import BattleTab from './tabs/BattleTab';
import LevelSelectUI from './LevelSelectUI';
import LevelManager from '../../data/LevelManager';

export default class HomePage {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private visible: boolean = false;
  private onStartGame: () => void;

  private topBar: TopBar;
  private bottomTabs: BottomTabs;
  private tabs: Map<TabId, ITab> = new Map();
  private levelSelectUI: LevelSelectUI;
  
  // Layout Cache
  private contentRect!: { x: number, y: number, width: number, height: number };

  constructor(canvas: HTMLCanvasElement, onStartGame: () => void) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.onStartGame = onStartGame;

    this.topBar = new TopBar(canvas);
    this.bottomTabs = new BottomTabs(canvas, () => {
      if (this.visible) this.render();
    });
    this.levelSelectUI = new LevelSelectUI(
      canvas,
      () => this.levelSelectUI.hide(), // OnClose
      (levelIndex) => { // OnSelect
        LevelManager.getInstance().setCurrentLevel(levelIndex);
        this.levelSelectUI.hide();
        // Force re-render of BattleTab to update level info
        this.render(); 
      }
    );
    
    // Initialize Tabs
    this.tabs.set(TabId.SHOP, new ShopTab());
    this.tabs.set(TabId.ROLE, new RoleTab());
    this.tabs.set(TabId.CORE, new CoreTab());
    this.tabs.set(TabId.BATTLE, new BattleTab(
      () => {
        this.hide();
        this.onStartGame();
      },
      () => {
        this.levelSelectUI.show();
      }
    ));

    // Initial Layout Calculation
    this.updateLayout();

    // Bind Input
    this.bindInput();
  }

  private updateLayout(): void {
    const topHeight = this.topBar.getHeight();
    const bottomHeight = this.bottomTabs.getHeight();
    this.contentRect = {
      x: 0,
      y: topHeight,
      width: this.canvas.width,
      height: this.canvas.height - topHeight - bottomHeight
    };
  }

  public show(): void {
    this.visible = true;
    this.levelSelectUI.hide(); // Ensure sub-UI is hidden
    this.updateLayout(); // Ensure layout is fresh on show
    this.render();
  }

  public hide(): void {
    this.visible = false;
  }

  public isVisible(): boolean {
    return this.visible;
  }

  public render(): void {
    if (!this.visible) return;

    // Clear background
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Render Components
    this.topBar.render();
    this.bottomTabs.render();

    // Render Active Tab Content
    const activeTabId = this.bottomTabs.getActiveTab();
    const activeTab = this.tabs.get(activeTabId);
    if (activeTab) {
      activeTab.render(this.ctx, this.contentRect);
    }

    // Render Level Select UI (Overlay)
    if (this.levelSelectUI.isVisible()) {
      this.levelSelectUI.render();
    }
  }

  private bindInput(): void {
    const handleInput = (e: MouseEvent | TouchEvent) => {
      if (!this.visible) return;

      // Note: LevelSelectUI handles its own input when visible, 
      // but we need to ensure we don't double-handle or miss-handle.
      // Since LevelSelectUI attaches its own listeners to canvas in constructor,
      // it might be better to manage everything here or delegate.
      // 
      // Current architecture: LevelSelectUI attaches listeners. HomePage attaches listeners.
      // If LevelSelectUI is visible, it should consume input.
      // 
      // BUT: LevelSelectUI listeners are always active if we didn't add checks.
      // In LevelSelectUI.ts, I added `if (!this.visible) return;`. 
      // So LevelSelectUI only reacts when visible.
      // 
      // We should prevent HomePage from reacting if LevelSelectUI is visible.
      
      if (this.levelSelectUI.isVisible()) {
        // Let LevelSelectUI handle it (via its own listeners)
        // Prevent default only if necessary, but we can't stop propagation to other listeners easily 
        // because they are all on 'canvas'.
        // 
        // Actually, if LevelSelectUI has its own listeners, they will fire in parallel.
        // We just need to make sure HomePage logic ignores input if LevelSelectUI is visible.
        return; 
      }

      e.preventDefault(); // Prevent default behavior if on HomePage

      let clientX, clientY;
      if (e instanceof MouseEvent) {
        clientX = e.clientX;
        clientY = e.clientY;
      } else if (window.TouchEvent && e instanceof TouchEvent) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        return;
      }

      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const x = (clientX - rect.left) * scaleX;
      const y = (clientY - rect.top) * scaleY;

      this.handleClick(x, y);
    };
    
    this.canvas.addEventListener('mousedown', (e) => {
      if (this.visible && !this.levelSelectUI.isVisible()) handleInput(e);
    });
    this.canvas.addEventListener('touchstart', (e) => {
      if (this.visible && !this.levelSelectUI.isVisible()) handleInput(e);
    }, { passive: false });
  }

  private handleClick(x: number, y: number): void {
    // 1. Check TopBar
    if (this.topBar.handleClick(x, y)) {
      return;
    }

    // 2. Check BottomTabs
    const newTabId = this.bottomTabs.handleClick(x, y);
    if (newTabId) {
      // Tab switched
      this.render(); // Re-render immediately
      return;
    }

    // 3. Check Content Area
    if (x >= this.contentRect.x && x <= this.contentRect.x + this.contentRect.width &&
        y >= this.contentRect.y && y <= this.contentRect.y + this.contentRect.height) {
      
      const activeTabId = this.bottomTabs.getActiveTab();
      const activeTab = this.tabs.get(activeTabId);
      if (activeTab) {
        activeTab.handleClick(x, y, this.contentRect);
        this.render(); // Re-render to reflect changes (e.g. level switch)
      }
    }
  }
}
