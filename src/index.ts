import Game from './game/Game_v2';

const canvas = document.createElement('canvas');
canvas.style.display = 'block';
canvas.style.margin = '0 auto';
canvas.style.maxWidth = '100%';
canvas.style.maxHeight = '100vh';
document.body.appendChild(canvas);

// 响应式设置Canvas尺寸
function resizeCanvas() {
  const aspectRatio = 9 / 16; // 宽高比 9:16
  const maxWidth = window.innerWidth;
  const maxHeight = window.innerHeight;
  
  let width = maxWidth;
  let height = maxHeight;
  
  // 根据宽高比调整
  if (width / height > aspectRatio) {
    width = height * aspectRatio;
  } else {
    height = width / aspectRatio;
  }
  
  // 设置最小尺寸
  width = Math.max(320, Math.min(width, 600));
  height = width / aspectRatio;

  canvas.width = width;
  canvas.height = height;
}

resizeCanvas();
const game = new Game(canvas);
game.init();

// 监听窗口大小变化
window.addEventListener('resize', () => {
  resizeCanvas();
  game.handleResize();
});

window.addEventListener('beforeunload', () => {
  game.destroy();
});
