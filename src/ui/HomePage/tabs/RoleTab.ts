import { ITab, TabId } from '../HomePageTypes';

export default class RoleTab implements ITab {
  id: TabId = TabId.ROLE;

  render(ctx: CanvasRenderingContext2D, rect: { x: number, y: number, width: number, height: number }): void {
    ctx.fillStyle = '#34495e';
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

    ctx.fillStyle = '#ecf0f1';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('角色 - 功能待开发', rect.x + rect.width / 2, rect.y + rect.height / 2);
  }

  handleClick(_x: number, _y: number, _rect: { x: number, y: number, width: number, height: number }): void {
    // No interaction
  }

  onShow(): void {}
  onHide(): void {}
}
