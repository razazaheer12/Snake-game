/* =========================
   Snake Game – with Pause/Resume
   Enhancements:
   - Sound effects
   - Speed increase every 5th food
   - Pause / Resume buttons
   ========================= */

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', { alpha: false });

const scoreEl = document.getElementById('score');
const overlay = document.getElementById('overlay');
const finalScoreEl = document.getElementById('finalScore');
const restartBtn = document.getElementById('restartBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resumeBtn = document.getElementById('resumeBtn');

// Grid config
const CELL = 20;
const COLS = canvas.width / CELL;
const ROWS = canvas.height / CELL;
let SPEED = 8;                // starting speed
let STEP_MS = 1000 / SPEED;   // ms per step

// Colors
const COLORS = {
  bg: '#0d1022',
  snake: '#8ab4ff',
  head: '#b388ff',
  food: '#6ee7b7',
  cellShadow: 'rgba(0,0,0,0.15)'
};

// Sounds
const eatSound = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-arcade-mechanical-bling-210.wav");
const gameOverSound = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-arcade-fast-game-over-233.wav");

let snake, dir, nextDir, food, score, elapsed, lastTime, playing, paused, foodsEaten;

function init() {
  const startX = Math.floor(COLS / 2);
  const startY = Math.floor(ROWS / 2);
  snake = [
    { x: startX,     y: startY },
    { x: startX - 1, y: startY },
    { x: startX - 2, y: startY }
  ];
  dir = { x: 1, y: 0 };
  nextDir = { ...dir };
  food = spawnFood();
  score = 0;
  foodsEaten = 0;
  scoreEl.textContent = score;
  elapsed = 0;
  lastTime = performance.now();
  playing = true;
  paused = false;
  SPEED = 8;              // reset speed
  STEP_MS = 1000 / SPEED;
  overlay.classList.add('hidden');
  requestAnimationFrame(loop);
}

function loop(now) {
  if (!playing || paused) return; // stop loop if paused or game over
  const delta = now - lastTime;
  lastTime = now;
  elapsed += delta;

  while (elapsed >= STEP_MS) {
    step();
    elapsed -= STEP_MS;
  }

  draw();
  requestAnimationFrame(loop);
}

function step() {
  dir = nextDir;

  const head = { ...snake[0] };
  head.x = wrap(head.x + dir.x, COLS);
  head.y = wrap(head.y + dir.y, ROWS);

  if (snake.some(seg => seg.x === head.x && seg.y === head.y)) {
    return gameOver();
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score += 5;
    foodsEaten++;
    scoreEl.textContent = score;
    food = spawnFood();
    eatSound.currentTime = 0;
    eatSound.play();

    // Increase speed every 5th food
    if (foodsEaten % 5 === 0) {
      SPEED += 1; // noticeable jump
      STEP_MS = 1000 / SPEED;
    }

  } else {
    snake.pop();
  }
}

function draw() {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawCell(food.x, food.y, COLORS.food, true);

  for (let i = snake.length - 1; i >= 0; i--) {
    const seg = snake[i];
    const isHead = i === 0;
    drawCell(seg.x, seg.y, isHead ? COLORS.head : COLORS.snake, false, isHead);
  }
}

function drawCell(gx, gy, color, pulse = false, isHead = false) {
  const x = gx * CELL;
  const y = gy * CELL;

  ctx.fillStyle = COLORS.cellShadow;
  ctx.fillRect(x + 2, y + 2, CELL - 4, CELL - 4);

  ctx.fillStyle = color;
  ctx.beginPath();
  const r = 6;
  roundRect(ctx, x + 1, y + 1, CELL - 2, CELL - 2, r);
  ctx.fill();

  if (isHead) {
    ctx.fillStyle = 'rgba(10,12,26,0.85)';
    ctx.fillRect(x + CELL / 2 + 3, y + CELL / 2 - 5, 3, 3);
  }

  if (pulse) {
    const t = performance.now() / 600;
    const alpha = 0.35 + 0.15 * Math.sin(t * 2 * Math.PI);
    ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 4, y + 4, CELL - 8, CELL - 8);
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function spawnFood() {
  let pos;
  const taken = new Set(snake.map(s => `${s.x},${s.y}`));
  do {
    pos = { x: randInt(0, COLS - 1), y: randInt(0, ROWS - 1) };
  } while (taken.has(`${pos.x},${pos.y}`));
  return pos;
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function wrap(v, max) {
  if (v < 0) return max - 1;
  if (v >= max) return 0;
  return v;
}

function gameOver() {
  playing = false;
  gameOverSound.play();
  finalScoreEl.textContent = score;
  overlay.classList.remove('hidden');
}

window.addEventListener('keydown', (e) => {
  const { key } = e;
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(key)) {
    e.preventDefault();
  }
  const kd = keyDir(key);
  if (!kd) return;
  if (kd.x === -dir.x && kd.y === -dir.y) return;
  nextDir = kd;
});

function keyDir(key) {
  switch (key) {
    case 'ArrowUp':    return { x: 0, y: -1 };
    case 'ArrowDown':  return { x: 0, y:  1 };
    case 'ArrowLeft':  return { x: -1, y: 0 };
    case 'ArrowRight': return { x:  1, y: 0 };
    default: return null;
  }
}

// Button controls
pauseBtn.addEventListener('click', () => {
  paused = true;
});
resumeBtn.addEventListener('click', () => {
  if (playing && paused) {
    paused = false;
    lastTime = performance.now(); // reset time tracking
    requestAnimationFrame(loop);
  }
});
restartBtn.addEventListener('click', init);

init();
