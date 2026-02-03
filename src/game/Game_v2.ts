import Player from './Player';
import Enemy from './Enemy';
import Bullet from './Bullet';
import DamageText from './DamageText';
import Collision from './Collision';
import SkillSystem from './SkillSystem';
import LevelSystem from './LevelSystem';
import Spawner from './Spawner';
import Barrier from './Barrier';
import HomePage from '../ui/HomePage/HomePage';
import LevelUpUI from '../ui/LevelUpUI';
import ResultUI from '../ui/ResultUI';
import GameUI from '../ui/GameUI';
import RewardUI from '../ui/RewardUI';
import LevelManager from '../data/LevelManager';
// @ts-ignore
// import bgImageSrc from '../../assets/images/xj.png';

export interface GameState {
  player: Player;
  enemies: Enemy[];
  bullets: Bullet[];
  damageTexts: DamageText[];
  iceStorms: IceStorm[];
  isRunning: boolean;
  isPaused: boolean;
  gameOver: boolean;
  score: number;
  time: number;
  barrier: Barrier;
  level: number;
  experience: number;
  experienceToNextLevel: number;
  levelName: string;
  lightningCount: number;
  activeSkills: any[];
  equipment: any[];
  leftMercenary: any;
  rightMercenary: any;
  barrierHealth: number;
  barrierMaxHealth: number;
  gameSpeed: number; // 游戏速度倍率
  isFiringEnabled: boolean; // 是否开启射击
  pendingRewardSkillChoices?: number;
  dryIceHitCount?: number;
}

import ThermobaricEmitter from './emitters/ThermobaricEmitter';
import IceStormEmitter from './emitters/IceStormEmitter';
import DryIceEmitter from './emitters/DryIceEmitter';
import IceStorm from './IceStorm';

export default class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private state: GameState;
  private animationId: number | null = null;
  private lastTime: number = 0;
  private collision: Collision;
  private skillSystem: SkillSystem;
  private levelSystem: LevelSystem;
  private spawner: Spawner;
  private homePage: HomePage;
  private levelUpUI: LevelUpUI;
  private resultUI: ResultUI;
  private gameUI: GameUI;
  private rewardUI: RewardUI;
  private backgroundImage: HTMLImageElement;
  private readonly maxLevel: number = 20;
  private thermobaricEmitter!: ThermobaricEmitter;
  private iceStormEmitter!: IceStormEmitter;
  private dryIceEmitter!: DryIceEmitter;
  
  // Transition
  private transitionState: 'in' | 'out' | 'none' = 'none';
  private transitionAlpha: number = 0;
  private readonly transitionDuration: number = 0.5;

  private levelUpTimer: number = -1;

  // 预加载的背景图片缓存
  private static backgroundImageCache: Map<string, HTMLImageElement> = new Map();

  // 预加载所有背景图片
  private static preloadBackgroundImages(): void {
    // 预加载所有关卡的背景图片
    for (let i = 1; i <= 10; i++) {
      const bgSrc = LevelManager.getInstance().getLevelBackgroundImage(i);
      if (bgSrc && !Game.backgroundImageCache.has(bgSrc)) {
        const img = new Image();
        img.src = bgSrc;
        Game.backgroundImageCache.set(bgSrc, img);
      }
    }
  }

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    
    // 预加载所有背景图片
    Game.preloadBackgroundImages();
    
    // 加载背景图片
    this.backgroundImage = new Image();
    // Default background, will be updated in start()
    // this.backgroundImage.src = bgImageSrc; 

    // 初始化游戏状态
    this.state = {
      player: new Player(
        this.canvas.width / 2,
        this.canvas.height - 60 // 站在最底部，留出一点边距
      ),
      enemies: [],
      bullets: [],
      damageTexts: [],
      iceStorms: [],
      isRunning: false,
      isPaused: false,
      gameOver: false,
      score: 0,
      time: 0,
      barrier: new Barrier(0, 0, 0), // 临时初始化
      level: 1,
      experience: 0,
      experienceToNextLevel: 30,
      levelName: '音乐喷泉',
      lightningCount: 3,
      activeSkills: [],
      equipment: [],
      leftMercenary: null,
      rightMercenary: null,
      barrierHealth: 1000,
      barrierMaxHealth: 1000,
      gameSpeed: 1.0,
      isFiringEnabled: true,
      dryIceHitCount: 0
    };

    this.updateBarrierPosition();

    this.gameUI = new GameUI(this.canvas);
    this.skillSystem = new SkillSystem(this.state);
    this.levelSystem = new LevelSystem(this.skillSystem);
    this.collision = new Collision(this.levelSystem);
    this.spawner = new Spawner(this.state, 0, 0, this.canvas.width);
    this.thermobaricEmitter = new ThermobaricEmitter(this.state);
    this.iceStormEmitter = new IceStormEmitter(this.state);
    this.dryIceEmitter = new DryIceEmitter(this.state);
    this.homePage = new HomePage(this.canvas, () => this.start());
    this.levelUpUI = new LevelUpUI(this.canvas, (skillId) => this.handleSkillSelect(skillId));
    this.resultUI = new ResultUI(this.canvas, () => this.restart(), () => this.nextLevel(), () => this.backToHome());
    this.rewardUI = new RewardUI(this.canvas);
    this.bindInput();
  }

  private bindInput(): void {
    const handleInput = (e: MouseEvent | TouchEvent) => {
      // 防止在其他UI显示时触发（如升级、结算、奖励）
      if (this.levelUpUI.isVisible() || this.resultUI.isVisible() || this.rewardUI.isVisible()) return;

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

      if (this.state.isRunning && !this.state.gameOver) {
        if (!this.state.isPaused) {
          // 检查暂停按钮点击
          const pauseBounds = this.gameUI.getPauseButtonBounds();
          if (x >= pauseBounds.x && x <= pauseBounds.x + pauseBounds.width &&
              y >= pauseBounds.y && y <= pauseBounds.y + pauseBounds.height) {
            this.state.isPaused = true;
          }

          // 检查倍速按钮点击
          const speedBounds = this.gameUI.getSpeedButtonBounds();
          if (x >= speedBounds.x && x <= speedBounds.x + speedBounds.width &&
              y >= speedBounds.y && y <= speedBounds.y + speedBounds.height) {
            // 切换速度: 1 -> 3 -> 8 -> 1
            if (this.state.gameSpeed === 1) this.state.gameSpeed = 3;
            else if (this.state.gameSpeed === 3) this.state.gameSpeed = 8;
            else this.state.gameSpeed = 1;
          }

          // 检查子弹开关按钮点击
          const bulletBounds = this.gameUI.getBulletToggleButtonBounds();
          if (x >= bulletBounds.x && x <= bulletBounds.x + bulletBounds.width &&
              y >= bulletBounds.y && y <= bulletBounds.y + bulletBounds.height) {
            this.state.isFiringEnabled = !this.state.isFiringEnabled;
          }
        } else {
          // 检查暂停菜单点击
          const menuBounds = this.gameUI.getPauseMenuButtonsBounds();
          
          // 继续按钮
          if (x >= menuBounds.continueButton.x && x <= menuBounds.continueButton.x + menuBounds.continueButton.width &&
              y >= menuBounds.continueButton.y && y <= menuBounds.continueButton.y + menuBounds.continueButton.height) {
            this.state.isPaused = false;
            this.lastTime = performance.now(); // 重置时间，防止巨大的deltaTime
          }
          
          // 重新开始按钮
          if (x >= menuBounds.restartButton.x && x <= menuBounds.restartButton.x + menuBounds.restartButton.width &&
              y >= menuBounds.restartButton.y && y <= menuBounds.restartButton.y + menuBounds.restartButton.height) {
             this.state.isPaused = false; // 确保重新开始时状态正确
             this.restart();
          }

          // 回到首页按钮
          if (menuBounds.homeButton && // 检查是否存在（虽然我们在UI里加了，但为了安全）
              x >= menuBounds.homeButton.x && x <= menuBounds.homeButton.x + menuBounds.homeButton.width &&
              y >= menuBounds.homeButton.y && y <= menuBounds.homeButton.y + menuBounds.homeButton.height) {
            this.backToHome();
          }
        }
      }
    };

    this.canvas.addEventListener('mousedown', (e) => handleInput(e));
    this.canvas.addEventListener('touchstart', (e) => {
        if (e.cancelable) {
            e.preventDefault(); // 阻止默认行为（滚动、鼠标模拟事件）
        }
        handleInput(e);
    }, { passive: false });
  }

  private backToHome(): void {
    this.state.isRunning = false;
    this.state.isPaused = false;
    this.state.gameOver = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    // 清空画布并绘制黑色背景
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.homePage.show();
  }

  private updateBarrierPosition(): void {
    const barrierY = this.canvas.height - 100;
    const barrierWidth = this.canvas.width * 0.7;
    this.state.barrier = new Barrier(
      (this.canvas.width - barrierWidth) / 2,
      barrierY,
      barrierWidth
    );
  }

  public handleResize(): void {
    // 更新玩家位置（保持相对位置）
    if (this.state.player) {
      this.state.player.x = this.canvas.width / 2 - this.state.player.width / 2;
      this.state.player.y = this.canvas.height - 60; // 站在最底部
    }
    
    this.updateBarrierPosition();
    
    // 更新spawner
    if (this.spawner) {
      this.spawner = new Spawner(this.state, 0, 0, this.canvas.width);
    }
  }

  private start(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    // Start Transition In
    this.transitionState = 'in';
    this.transitionAlpha = 1;

    this.state.isRunning = true;
    this.state.gameOver = false;
    this.state.score = 0;
    this.state.time = 0;
    this.state.enemies = [];
    this.state.bullets = [];
    this.state.damageTexts = [];
    this.state.iceStorms = [];
    this.state.activeSkills = []; // Clear active skills visual list
    this.state.player.reset();
    this.state.barrier.reset();
    this.state.barrierHealth = this.state.barrierMaxHealth;
    this.state.gameSpeed = 1; // Reset game speed to 1.0 every level
    this.skillSystem.reset();
    this.levelSystem.reset();
    this.spawner.reset();
    
    // Sync level data
    const currentLevel = LevelManager.getInstance().getCurrentLevel();
    this.state.levelName = currentLevel.name;
    // Note: levelSystem uses its own internal level (1,2,3...) for difficulty ramping within a session
    // We might want to adjust initial difficulty based on selected Level ID in future.
    // For now, Level ID just changes the name and completion tracking.
    
    // Update background image for current level
    const bgSrc = LevelManager.getInstance().getLevelBackgroundImage(currentLevel.id);
    if (bgSrc) {
      // 从缓存中获取背景图片
      const cachedImage = Game.backgroundImageCache.get(bgSrc);
      if (cachedImage) {
        this.backgroundImage = cachedImage;
      } else {
        this.backgroundImage.src = bgSrc;
      }
    }

    this.state.level = this.levelSystem.getLevel();
    this.state.experience = this.levelSystem.getExperience();
    this.state.experienceToNextLevel = this.levelSystem.getExperienceToNextLevel();
    this.state.pendingRewardSkillChoices = 0;
    this.state.dryIceHitCount = 0;
    this.lastTime = performance.now();
    this.gameLoop();
  }

  private restart(): void {
    this.start();
  }

  private nextLevel(): void {
    const levelManager = LevelManager.getInstance();
    const current = levelManager.getCurrentLevel();
    // Level IDs are 1-based, index is 0-based.
    // current.id is the current level ID.
    // Next level ID is current.id + 1.
    // Corresponding index is (current.id + 1) - 1 = current.id.
    const nextIndex = current.id; 
    
    if (levelManager.isLevelUnlocked(nextIndex)) {
      levelManager.setCurrentLevel(nextIndex);
      this.start();
    } else {
      // Fallback to home if next level not available/unlocked
      this.backToHome();
    }
  }

  private handleSkillSelect(skillId: string): void {
    // 奖励技能现在是自动发放的，不再走这里
    // 只有升级选择会走这里
    this.state.player.increaseGunLevel();
    this.skillSystem.acquireSkill(skillId);
    this.levelSystem.levelUp();
    
    this.levelUpUI.hide();
    if (this.levelSystem.getLevel() >= this.maxLevel) {
      this.state.isPaused = false;
      this.finishGame(true);
      return;
    }
    this.state.isPaused = false;
    this.gameLoop();
  }

  private gameLoop(): void {
    if (!this.state.isRunning) return;

    const currentTime = performance.now();
    let deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // 防止deltaTime过大
    if (deltaTime > 0.1) deltaTime = 0.1;

    if (!this.state.isPaused) {
      // 应用游戏倍速
      const scaledDeltaTime = deltaTime * (this.state.gameSpeed || 1);
      this.update(scaledDeltaTime);
    }

    this.render();

    if (this.state.player.health <= 0 || this.state.barrier.isDestroyed) {
      this.finishGame(false);
      return;
    }

    this.animationId = requestAnimationFrame(() => this.gameLoop());
  }

  private update(deltaTime: number): void {
    // Transition Update
    if (this.transitionState !== 'none') {
        if (this.transitionState === 'in') {
            this.transitionAlpha -= deltaTime / this.transitionDuration;
            if (this.transitionAlpha <= 0) {
                this.transitionAlpha = 0;
                this.transitionState = 'none';
            }
        } else if (this.transitionState === 'out') {
            this.transitionAlpha += deltaTime / this.transitionDuration;
            if (this.transitionAlpha >= 1) {
                this.transitionAlpha = 1;
                this.transitionState = 'none';
            }
        }
    }

    this.state.time += deltaTime;
    // Removed time-based experience gain

    this.spawner.update(deltaTime);
    this.thermobaricEmitter.update(deltaTime);
    this.iceStormEmitter.update(deltaTime);
    this.dryIceEmitter.update(deltaTime);

    this.state.player.update(deltaTime, this.state);
    this.state.enemies.forEach(enemy => enemy.update(deltaTime));
    this.state.bullets.forEach(bullet => bullet.update(deltaTime));
    this.state.iceStorms.forEach(storm => storm.update(deltaTime, this.state));
    this.state.damageTexts.forEach(text => text.update(deltaTime));

    this.checkBarrierCollision();
    this.collision.checkAll(this.state);

    this.state.enemies = this.state.enemies.filter(e => !e.isDead);
    this.state.bullets = this.state.bullets.filter(b => !b.isDestroyed && b.y > -10);
    this.state.iceStorms = this.state.iceStorms.filter(s => !s.isFinished);
    this.state.damageTexts = this.state.damageTexts.filter(text => !text.isDead);

    // 限制伤害数字数量，防止过多卡顿
    if (this.state.damageTexts.length > 50) {
      // 移除最早生成的
      this.state.damageTexts.splice(0, this.state.damageTexts.length - 50);
    }

    // 更新防线血量显示
    this.state.barrierHealth = this.state.barrier.health;

    // Sync level data (Moved to end of update to reflect latest changes)
    this.state.level = this.levelSystem.getLevel();
    this.state.experience = this.levelSystem.getExperience();
    this.state.experienceToNextLevel = this.levelSystem.getExperienceToNextLevel();

    this.rewardUI.update(deltaTime);

    if (this.state.pendingRewardSkillChoices && this.state.pendingRewardSkillChoices >= 100 && !this.rewardUI.isVisible()) {
      const isBoss = this.state.pendingRewardSkillChoices >= 102;
      const title = isBoss ? '打败 Boss 奖励' : '打败精英奖励';
      const duration = 2.0;
      
      const count = Math.floor(Math.random() * 3) + 5;
      const candidates = this.skillSystem.getAvailableSkills(count);
      
      if (candidates.length > 0) {
        this.rewardUI.show(candidates, title, duration, (skill) => {
          this.skillSystem.acquireSkill(skill.id);
        });
      }

      // 扣除标记
      if (isBoss) {
        this.state.pendingRewardSkillChoices -= 102;
      } else {
        this.state.pendingRewardSkillChoices -= 101;
      }
    }

    if (this.levelSystem.shouldLevelUp()) {
      const currentLevel = this.levelSystem.getLevel();
      if (currentLevel + 1 >= this.maxLevel) {
        this.levelSystem.levelUp();
        this.state.level = this.levelSystem.getLevel();
        this.state.experience = this.levelSystem.getExperience();
        this.state.experienceToNextLevel = this.levelSystem.getExperienceToNextLevel();
        this.finishGame(true);
        return;
      }
      
      // Add delay before showing level up UI
      if (this.levelUpTimer === -1) {
        this.levelUpTimer = 0.5; // 0.5 seconds delay
      }

      this.levelUpTimer -= deltaTime;

      if (this.levelUpTimer <= 0) {
        this.levelUpTimer = -1; // Reset
        this.state.isPaused = true;
        const skills = this.skillSystem.getAvailableSkills(3, { excludeAcquiredCore: true });
        this.levelUpUI.show(skills);
      }
    } else {
      this.levelUpTimer = -1;
    }
  }

  private checkBarrierCollision(): void {
    const barrier = this.state.barrier;
    for (const enemy of this.state.enemies) {
      if (enemy.isDead) continue;

      if (enemy.y + enemy.height >= barrier.y && !enemy.reachedBarrier) {
        if (enemy.x + enemy.width > barrier.x && enemy.x < barrier.x + barrier.width) {
          enemy.reachedBarrier = true;
          enemy.y = barrier.y - enemy.height;
        }
      }

      if (enemy.reachedBarrier && enemy.canAttack()) {
        barrier.takeDamage(enemy.damage);
      }
    }
  }

  private render(): void {
    const topBarHeight = this.gameUI.getTopBarHeight();
    this.ctx.save();
    // Removed clipping to allow background to show behind transparent top bar
    
    if (this.backgroundImage && this.backgroundImage.complete) {
        this.ctx.drawImage(this.backgroundImage, 0, 0, this.canvas.width, this.canvas.height);
    } else {
        this.ctx.fillStyle = '#3a3a4e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)'; // 降低透明度，避免干扰背景
    this.ctx.lineWidth = 2;
    const laneCount = 4;
    for (let i = 1; i < laneCount; i++) {
      const x = (this.canvas.width / laneCount) * i;
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }

    this.state.barrier.render(this.ctx);
    this.state.player.render(this.ctx);
    this.state.iceStorms.forEach(storm => storm.render(this.ctx));
    this.state.enemies.forEach(enemy => enemy.render(this.ctx));
    this.state.damageTexts.forEach(text => text.render(this.ctx));
    this.state.bullets.forEach(bullet => bullet.render(this.ctx));
    this.ctx.restore();

    const boss = this.state.enemies.find(e => e.isBoss && !e.isDead);
    if (boss) {
      const width = this.canvas.width;
      const barWidth = Math.min(500, width * 0.8);
      const barHeight = 14;
      const x = (width - barWidth) / 2;
      const y = topBarHeight + 10;
      const ratio = Math.max(0, Math.min(1, boss.health / boss.maxHealth));
      this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
      this.ctx.fillRect(x, y, barWidth, barHeight);
      this.ctx.fillStyle = '#FF5252';
      this.ctx.fillRect(x, y, barWidth * ratio, barHeight);
      this.ctx.strokeStyle = '#FFFFFF';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(x, y, barWidth, barHeight);
    }

    this.gameUI.render(this.state);
    
    // 如果暂停且没有显示其他UI，则显示暂停菜单
    if (this.state.isPaused && !this.levelUpUI.isVisible() && !this.homePage.isVisible() && !this.resultUI.isVisible()) {
      this.gameUI.renderPauseMenu(this.state);
    }
    
    this.rewardUI.render();
    this.levelUpUI.render();
    this.homePage.render();
    this.resultUI.render();

    // Transition Overlay
    if (this.transitionAlpha > 0) {
        this.ctx.save();
        this.ctx.fillStyle = `rgba(0, 0, 0, ${this.transitionAlpha})`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
    }
  }

  public init(): void {
    this.homePage.show();
  }

  public destroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  private finishGame(isVictory: boolean): void {
    this.state.gameOver = true;
    this.state.isRunning = false;

    // Record Completion
    if (isVictory) {
      const currentLevel = LevelManager.getInstance().getCurrentLevel();
      const healthPercent = (this.state.barrier.health / this.state.barrier.maxHealth) * 100;
      LevelManager.getInstance().completeLevel(currentLevel.id, healthPercent);
    }

    this.resultUI.show(this.state.score, this.state.time, isVictory);
  }
}
