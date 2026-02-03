export default class TopBar {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private height: number = 80;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  public getHeight(): number {
    this.height = this.computeHeight();
    return this.height;
  }

  public render(): void {
    const width = this.canvas.width;
    const height = this.getHeight();
    const safeInset = this.computeSafeInset();
    const barHeight = height - safeInset;
    const sidePadding = Math.max(12, Math.min(24, width * 0.04));
    const groupGap = Math.max(10, Math.min(18, width * 0.035));

    this.ctx.fillStyle = '#2c3e50';
    this.ctx.fillRect(0, 0, width, height);
    this.ctx.strokeStyle = '#34495e';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(0, 0, width, height);

    const avatarSize = Math.max(36, Math.min(48, barHeight * 0.85));
    const avatarX = sidePadding;
    const avatarY = safeInset + (barHeight - avatarSize) / 2;

    const avatarImage = new Image();
    avatarImage.src = './src/assets/tabsIcon/avatar.png';
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    this.ctx.clip();
    this.ctx.drawImage(avatarImage, avatarX, avatarY, avatarSize, avatarSize);
    this.ctx.restore();
    this.ctx.beginPath();
    this.ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    this.ctx.strokeStyle = '#ecf0f1';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    const nameFontSize = Math.max(12, Math.min(16, barHeight * 0.3));
    const name = '超级管理员';
    this.ctx.font = `${nameFontSize}px Arial`;
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'middle';

    const resources = [
      { icon: '💎', value: '99999+' },
      { icon: '💰', value: '99999+' },
      { icon: '❤️', value: '99999+' }
    ];

    const iconFontSize = Math.max(12, Math.min(18, barHeight * 0.34));
    const valueFontSize = Math.max(12, Math.min(16, barHeight * 0.3));
    const pillHeight = Math.max(26, Math.min(32, barHeight * 0.6));
    const pillY = safeInset + (barHeight - pillHeight) / 2;
    const pillRadius = pillHeight / 2;
    const pillPaddingX = Math.max(8, Math.min(12, width * 0.02));
    const iconGap = Math.max(4, Math.min(8, width * 0.015));
    const itemGap = Math.max(8, Math.min(12, width * 0.02));
    const rightMaxWidth = Math.max(140, width * 0.52);

    const resolveValues = (digitLimit: number | null) => {
      return resources.map(res => {
        if (digitLimit === null) return res.value;
        return this.compactValue(res.value, digitLimit);
      });
    };

    let displayValues = resolveValues(null);
    let rightWidth = this.measureRightGroupWidth(resources, displayValues, iconFontSize, valueFontSize, pillPaddingX, iconGap, itemGap);
    if (rightWidth > rightMaxWidth) {
      displayValues = resolveValues(4);
      rightWidth = this.measureRightGroupWidth(resources, displayValues, iconFontSize, valueFontSize, pillPaddingX, iconGap, itemGap);
    }
    if (rightWidth > rightMaxWidth) {
      displayValues = resolveValues(3);
      rightWidth = this.measureRightGroupWidth(resources, displayValues, iconFontSize, valueFontSize, pillPaddingX, iconGap, itemGap);
    }
    if (rightWidth > rightMaxWidth) {
      displayValues = resolveValues(2);
      rightWidth = this.measureRightGroupWidth(resources, displayValues, iconFontSize, valueFontSize, pillPaddingX, iconGap, itemGap);
    }

    const rightStartX = width - sidePadding - rightWidth;
    let currentX = rightStartX;

    for (let i = 0; i < resources.length; i++) {
      const res = resources[i];
      const value = displayValues[i];
      const itemWidth = this.measureResourceItemWidth(res.icon, value, iconFontSize, valueFontSize, pillPaddingX, iconGap);

      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      this.ctx.beginPath();
      this.ctx.roundRect(currentX, pillY, itemWidth, pillHeight, pillRadius);
      this.ctx.fill();

      this.ctx.textAlign = 'left';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = `${iconFontSize}px Arial`;
      const iconX = currentX + pillPaddingX;
      const iconY = pillY + pillHeight / 2;
      this.ctx.fillText(res.icon, iconX, iconY);

      this.ctx.font = `${valueFontSize}px Arial`;
      const valueX = iconX + this.ctx.measureText(res.icon).width + iconGap;
      this.ctx.fillText(value, valueX, iconY);

      currentX += itemWidth + itemGap;
    }

    const leftGroupMaxWidth = Math.max(0, rightStartX - sidePadding - groupGap);
    const nameMaxWidth = Math.max(0, leftGroupMaxWidth - avatarSize - groupGap);
    const nameText = this.ellipsisText(name, nameMaxWidth, nameFontSize);
    const nameX = avatarX + avatarSize + groupGap;
    const nameY = safeInset + barHeight / 2;

    this.ctx.fillStyle = '#ecf0f1';
    this.ctx.font = `${nameFontSize}px Arial`;
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(nameText, nameX, nameY);
    this.ctx.textBaseline = 'alphabetic';
  }

  public handleClick(_x: number, y: number): boolean {
    if (y <= this.height) {
      // Clicked on TopBar
      // Future: check specific resource clicks
      return true;
    }
    return false;
  }

  private computeSafeInset(): number {
    const height = this.canvas.height;
    return Math.max(18, Math.min(36, height * 0.04));
  }

  private computeHeight(): number {
    const safeInset = this.computeSafeInset();
    const barHeight = Math.max(52, Math.min(76, this.canvas.height * 0.09));
    return safeInset + barHeight;
  }

  private compactValue(value: string, digits: number): string {
    const digitsOnly = value.replace(/\D/g, '');
    if (!digitsOnly) return value;
    const num = parseInt(digitsOnly, 10);
    const max = Math.pow(10, digits) - 1;
    if (Number.isNaN(num)) return value;
    if (num > max || digitsOnly.length > digits) {
      return `${'9'.repeat(digits)}+`;
    }
    return value;
  }

  private measureResourceItemWidth(
    icon: string,
    value: string,
    iconFontSize: number,
    valueFontSize: number,
    paddingX: number,
    iconGap: number
  ): number {
    this.ctx.font = `${iconFontSize}px Arial`;
    const iconWidth = this.ctx.measureText(icon).width;
    this.ctx.font = `${valueFontSize}px Arial`;
    const valueWidth = this.ctx.measureText(value).width;
    return paddingX * 2 + iconWidth + iconGap + valueWidth;
  }

  private measureRightGroupWidth(
    resources: Array<{ icon: string; value: string }>,
    values: string[],
    iconFontSize: number,
    valueFontSize: number,
    paddingX: number,
    iconGap: number,
    itemGap: number
  ): number {
    let total = 0;
    for (let i = 0; i < resources.length; i++) {
      total += this.measureResourceItemWidth(resources[i].icon, values[i], iconFontSize, valueFontSize, paddingX, iconGap);
      if (i < resources.length - 1) total += itemGap;
    }
    return total;
  }

  private ellipsisText(text: string, maxWidth: number, fontSize: number): string {
    if (maxWidth <= 0) return '';
    this.ctx.font = `${fontSize}px Arial`;
    if (this.ctx.measureText(text).width <= maxWidth) return text;
    let end = text.length;
    while (end > 0 && this.ctx.measureText(`${text.slice(0, end)}…`).width > maxWidth) {
      end -= 1;
    }
    return end > 0 ? `${text.slice(0, end)}…` : '';
  }
}
