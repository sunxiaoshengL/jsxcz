export enum TabId {
  SHOP = 'shop',
  ROLE = 'role',
  CORE = 'core',
  BATTLE = 'battle'
}

export interface ITab {
  id: TabId;
  render(ctx: CanvasRenderingContext2D, rect: { x: number, y: number, width: number, height: number }): void;
  handleClick(x: number, y: number, rect: { x: number, y: number, width: number, height: number }): void;
  onShow(): void;
  onHide(): void;
}
