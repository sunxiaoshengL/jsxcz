import { Skill } from '../game/SkillPool';

type RewardState = 'CLOSED' | 'SPINNING' | 'SHOW_RESULT';

export default class RewardUI {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  private visible = false;
  private state: RewardState = 'CLOSED';

  private displaySkills: Skill[] = [];
  private finalSkill: Skill | null = null;
  private finalIndex = 0;
  private highlightIndex = 0;

  private elapsed = 0;
  private nextStepAt = 0;
  private spinDuration = 0;

  private title = '';
  private onGrant: ((skill: Skill) => void) | null = null;
  private granted = false;

  private closeTimer: number | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;

    this.canvas.addEventListener('click', (e) => this.onClick(e));
    this.canvas.addEventListener(
      'touchstart',
      (e) => {
        if (e.cancelable) e.preventDefault();
        this.onClick(e);
      },
      { passive: false }
    );
  }

  /** ================= 显示 ================= */

  public show(
    candidates: Skill[],
    title: string,
    duration: number,
    onGrant: (skill: Skill) => void
  ) {
    if (candidates.length === 0) return;

    // 1. 确定最终技能
    this.finalSkill = candidates[Math.floor(Math.random() * candidates.length)];

    // 2. 构建 12 个格子的环形列表 (3x5 ring minus 3 center = 12)
    const ringSize = 12;
    const fillers: Skill[] = [];
    
    // 填充 fillers 直到 ringSize - 1
    // 如果 candidates 不够，循环使用
    while (fillers.length < ringSize - 1) {
      // 过滤掉 finalSkill 避免重复太多，但如果池子太小也无所谓
      const available = candidates.filter(s => s.id !== this.finalSkill!.id);
      if (available.length === 0) {
        // 只有一种技能？那就只能重复它
        fillers.push(this.finalSkill);
      } else {
        fillers.push(available[Math.floor(Math.random() * available.length)]);
      }
    }

    // 随机插入 finalSkill
    this.finalIndex = Math.floor(Math.random() * ringSize);
    this.displaySkills = [...fillers];
    this.displaySkills.splice(this.finalIndex, 0, this.finalSkill);

    // 3. 计算步数与起始位置
    const plannedSteps = this.countPlannedSteps(duration);
    this.highlightIndex =
      (this.finalIndex - (plannedSteps % this.displaySkills.length) + this.displaySkills.length) %
      this.displaySkills.length;

    this.title = title;
    this.spinDuration = duration;
    this.onGrant = onGrant;

    this.elapsed = 0;
    this.nextStepAt = 0.1;
    this.granted = false;

    this.visible = true;
    this.state = 'SPINNING';

    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
  }

  /** ================= 更新 ================= */

  public update(dt: number) {
    if (!this.visible) return;

    // 无论 SPINNING 还是 SHOW_RESULT 都要更新 elapsed，用于动画
    this.elapsed += dt;

    if (this.state === 'SPINNING') {
      const slowStart = this.spinDuration * 0.7;
      while (this.elapsed >= this.nextStepAt && this.state === 'SPINNING') {
        this.highlightIndex = (this.highlightIndex + 1) % this.displaySkills.length;
        const interval = this.nextStepAt >= slowStart ? 0.2 : 0.1;
        this.nextStepAt += interval;
      }

      if (this.elapsed >= this.spinDuration) {
        this.enterShowResult();
      }
    }
  }

  /** ================= 状态切换 ================= */

  private enterShowResult() {
    if (this.state !== 'SPINNING') return;

    this.state = 'SHOW_RESULT';
    this.highlightIndex = this.finalIndex;
    this.elapsed = 0; // 重置 elapsed 用于结果展示动画

    // 结果展示 1.5 秒后自动关闭（比之前久一点，让玩家看清结果）
    this.closeTimer = window.setTimeout(() => {
      this.grantOnce();
      this.hide();
    }, 1500);
  }

  private grantOnce() {
    if (this.granted) return;
    this.granted = true;

    const skill = this.displaySkills[this.highlightIndex];
    this.onGrant?.(skill);
  }

  public hide() {
    this.visible = false;
    this.state = 'CLOSED';
    this.displaySkills = [];
    this.finalSkill = null;

    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
  }

  public isVisible(): boolean {
    return this.visible;
  }

  /** ================= 输入 ================= */

  private onClick(_event: MouseEvent | TouchEvent) {
    if (!this.visible) return;

    // 全屏点击任何位置都有效
    if (this.state === 'SPINNING') {
      this.enterShowResult();
    } else if (this.state === 'SHOW_RESULT') {
      this.grantOnce();
      this.hide();
    }
  }

  /** ================= 渲染 ================= */

  public render() {
    if (!this.visible) return;

    const { width, height } = this.canvas;

    // 1. 全屏半透明遮罩
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    this.ctx.fillRect(0, 0, width, height);

    // 2. 布局计算
    // 转盘位于下方
    const spinnerY = height * 0.6;
    const spinnerH = height * 0.35;
    
    // 3. 渲染下方转盘 (Ring)
    this.renderRingSpinner(width / 2, spinnerY, width, spinnerH);

    // 4. 渲染上方结果卡片 (Result Card)
    if (this.state === 'SHOW_RESULT') {
      this.renderResultCard(width / 2, height * 0.2, width * 0.85, height * 0.25);
    }
  }

  private renderRingSpinner(cx: number, cy: number, w: number, _h: number): void {
    // 3 行 5 列布局，中间 3 个空出来
    // 0  1  2  3  4
    // 11          5
    // 10 9  8  7  6
    
    const cols = 5;
    const rows = 3;
    const gap = 12;
    
    // 计算单个格子大小
    const maxWidth = Math.min(600, w * 0.9);
    const cellSize = Math.min(80, (maxWidth - (cols - 1) * gap) / cols);
    
    const gridW = cols * cellSize + (cols - 1) * gap;
    const gridH = rows * cellSize + (rows - 1) * gap;
    
    const startX = cx - gridW / 2;
    const startY = cy - gridH / 2;

    // 环形索引映射：grid(row, col) -> index in displaySkills
    // Top Row: (0,0)->0, (0,1)->1, (0,2)->2, (0,3)->3, (0,4)->4
    // Right:   (1,4)->5
    // Bottom:  (2,4)->6, (2,3)->7, (2,2)->8, (2,1)->9, (2,0)->10
    // Left:    (1,0)->11
    
    const getRingIndex = (r: number, c: number): number | null => {
      if (r === 0) return c;
      if (r === 1 && c === 4) return 5;
      if (r === 2) return 6 + (4 - c);
      if (r === 1 && c === 0) return 11;
      return null;
    };

    // 渲染标题在中间 (Row 1, Cols 1-3)
    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = 'bold 24px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.shadowColor = 'rgba(0,0,0,0.8)';
    this.ctx.shadowBlur = 4;
    this.ctx.fillText(this.title, cx, cy);
    this.ctx.shadowBlur = 0;

    // 渲染格子
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const index = getRingIndex(r, c);
        if (index === null) continue;

        const skill = this.displaySkills[index];
        const isActive = index === this.highlightIndex;

        const cellX = startX + c * (cellSize + gap);
        const cellY = startY + r * (cellSize + gap);

        // 格子背景
        this.ctx.fillStyle = 'rgba(40, 40, 50, 0.9)';
        if (isActive) {
           this.ctx.fillStyle = 'rgba(80, 80, 100, 1)';
        }
        
        // 选中时稍微放大
        const scale = isActive ? 1.1 : 1.0;
        const size = cellSize * scale;
        const drawX = cellX + (cellSize - size) / 2;
        const drawY = cellY + (cellSize - size) / 2;

        this.ctx.beginPath();
        this.ctx.roundRect(drawX, drawY, size, size, 8);
        this.ctx.fill();

        // 边框
        this.ctx.lineWidth = isActive ? 4 : 2;
        this.ctx.strokeStyle = isActive ? '#FFD700' : '#555';
        if (isActive) {
           this.ctx.shadowColor = '#FFD700';
           this.ctx.shadowBlur = 15;
        }
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;

        // 图标
        this.ctx.font = `${size * 0.6}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#FFF';
        this.ctx.fillText(this.getSkillIcon(skill.id), drawX + size / 2, drawY + size / 2 + 2);
      }
    }
  }

  private renderResultCard(cx: number, topY: number, w: number, h: number): void {
    const skill = this.displaySkills[this.finalIndex];
    if (!skill) return;

    // 简单的过渡动画效果：基于 elapsed 移动透明度或位置
    // SHOW_RESULT 阶段 elapsed 从 0 开始增加
    const progress = Math.min(1, this.elapsed / 0.3); // 0.3秒淡入
    const alpha = progress;
    const slideOffset = (1 - progress) * 20;

    const cardW = Math.min(500, w);
    const cardH = Math.min(140, h);
    const x = cx - cardW / 2;
    const y = topY + slideOffset;

    // 卡片背景 (亮色，模仿图二)
    this.ctx.save();
    this.ctx.globalAlpha = alpha;

    // 辉光背景
    this.ctx.shadowColor = 'rgba(255, 215, 0, 0.5)';
    this.ctx.shadowBlur = 30;
    this.ctx.fillStyle = '#FFF8E1'; // 浅米色/金色背景
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, cardW, cardH, 12);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;

    // 金色边框
    this.ctx.lineWidth = 3;
    this.ctx.strokeStyle = '#FFD700';
    this.ctx.stroke();

    // 内容布局
    const padding = 20;
    
    // 左侧图标区
    const iconSize = cardH - padding * 2;
    const iconX = x + padding;
    const iconY = y + padding;
    
    // 图标背景框
    this.ctx.fillStyle = 'rgba(0,0,0,0.1)';
    this.ctx.beginPath();
    this.ctx.roundRect(iconX, iconY, iconSize, iconSize, 8);
    this.ctx.fill();
    
    // 图标
    this.ctx.font = `${iconSize * 0.7}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillStyle = '#333';
    this.ctx.fillText(this.getSkillIcon(skill.id), iconX + iconSize / 2, iconY + iconSize / 2);

    // 右侧文字区
    const textX = iconX + iconSize + 20;
    const textW = cardW - (iconSize + padding * 3);
    
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    
    // 名称
    this.ctx.fillStyle = '#8B4513'; // 深棕色字体
    this.ctx.font = 'bold 22px Arial';
    this.ctx.fillText(skill.name, textX, y + padding + 10);
    
    // 描述
    this.ctx.fillStyle = '#555';
    this.ctx.font = '16px Arial';
    const descLines = this.wrapText(skill.description, textW, 16, 2);
    for (let i = 0; i < descLines.length; i++) {
        this.ctx.fillText(descLines[i], textX, y + padding + 45 + i * 20);
    }

    // 底部提示
    this.ctx.fillStyle = '#999';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('点击任意处关闭', cx, y + cardH + 20);

    this.ctx.restore();
  }

  private wrapText(text: string, maxWidth: number, fontSize: number, maxLines: number): string[] {
    if (!text) return [];
    this.ctx.font = `${fontSize}px Arial`;

    const lines: string[] = [];
    const chars = text.split('');
    let current = '';

    for (let i = 0; i < chars.length; i++) {
      const next = current + chars[i];
      if (this.ctx.measureText(next).width > maxWidth && current.length > 0) {
        lines.push(current);
        current = chars[i];
        if (lines.length >= maxLines) break;
      } else {
        current = next;
      }
    }

    if (lines.length < maxLines && current.length > 0) {
      lines.push(current);
    }

    if (lines.length > maxLines) return lines.slice(0, maxLines);

    if (lines.length === maxLines && this.ctx.measureText(lines[maxLines - 1]).width > maxWidth) {
      let last = lines[maxLines - 1];
      while (last.length > 0 && this.ctx.measureText(last + '...').width > maxWidth) {
        last = last.slice(0, -1);
      }
      lines[maxLines - 1] = last + '...';
    }

    return lines;
  }

  private countPlannedSteps(duration: number): number {
    const slowStart = duration * 0.7;
    let t = 0.1;
    let steps = 0;
    while (t <= duration + 1e-9) {
      steps += 1;
      t += t >= slowStart ? 0.2 : 0.1;
    }
    return steps;
  }

  private getSkillIcon(id: string): string {
    const map: Record<string, string> = {
      damage_boost: '⚔️',
      split_shot_2: '✌️',
      split_shot_4: '🎇',
      fire_bullet: '🔥',
      multi_shot: '💪',
      rapid_fire: '⚡',
      penetration: '📏'
    };
    return map[id] || '✨';
  }
}
