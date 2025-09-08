// ===========================
// Snake Game with:
// - Pause/Resume (buttons + keys)
// - Speed increase every 5th food
// - Sound effects
// - Background music
// - Mobile touch controls
// - Responsive canvas
// ===========================

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', { alpha: false });

const scoreEl = document.getElementById('score');
const overlay = document.getElementById('overlay');
const finalScoreEl = document.getElementById('finalScore');
const restartBtn = document.getElementById('restartBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resumeBtn = document.getElementById('resumeBtn');

// Mobile buttons
const upBtn = document.getElementById('upBtn');
const downBtn = document.getElementById('downBtn');
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');

// Grid config
const CELL = 20;
const COLS = canvas.width / CELL;
const ROWS = canvas.height / CELL;
let SPEED = 8;
let STEP_MS = 1000 / SPEED;

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

// Background music
const bgMusic = new Audio("https://assets.mixkit.co/active_sfx/mixkit-game-level-music-689.wav");
bgMusic.loop = true;
bgMusic.volume = 0.3; // Set volume to 30%

let snake, dir, nextDir, food, score, elapsed, lastTime, playing, paused, foodsEaten;
let musicStarted = false;

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
  SPEED = 8;
  STEP_MS = 1000 / SPEED;
  overlay.classList.add('hidden');
  
  // Start background music
  startBackgroundMusic();
  
  requestAnimationFrame(loop);
}

function startBackgroundMusic() {
  if (!musicStarted) {
    bgMusic.currentTime = 0;
    bgMusic.play().catch(e => {
      // Handle autoplay policy restrictions
      console.log('Background music blocked by browser autoplay policy');
    });
    musicStarted = true;
  } else {
    // Resume if paused
    if (bgMusic.paused) {
      bgMusic.play().catch(e => console.log('Could not resume background music'));
    }
  }
}

function pauseBackgroundMusic() {
  if (!bgMusic.paused) {
    bgMusic.pause();
  }
}

function loop(now) {
  if (!playing || paused) return;
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

    if (foodsEaten % 5 === 0) {
      SPEED += 1;
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
  pauseBackgroundMusic(); // Pause music when game ends
  gameOverSound.play();
  finalScoreEl.textContent = score;
  overlay.classList.remove('hidden');
}

// Keyboard controls
window.addEventListener('keydown', (e) => {
  const { key } = e;

  // Arrow keys for movement
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(key)) {
    e.preventDefault();
    const kd = keyDir(key);
    if (kd && !(kd.x === -dir.x && kd.y === -dir.y)) {
      nextDir = kd;
    }
  }

  // Shortcuts
  if (key === 'p' || key === 'P') {
    paused = true;
    pauseBackgroundMusic(); // Pause music when game is paused
  }
  if (key === 'r' || key === 'R') {
    if (playing && paused) {
      paused = false;
      startBackgroundMusic(); // Resume music when game resumes
      lastTime = performance.now();
      requestAnimationFrame(loop);
    }
  }
  if (key === 'Enter' && !playing) init();
  
  // Toggle music with 'M' key
  if (key === 'm' || key === 'M') {
    toggleMusic();
  }
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

function toggleMusic() {
  if (bgMusic.paused) {
    if (playing && !paused) {
      startBackgroundMusic();
    }
  } else {
    pauseBackgroundMusic();
  }
}

// Button controls
pauseBtn.addEventListener('click', () => {
  paused = true;
  pauseBackgroundMusic(); // Pause music when pause button is clicked
});

resumeBtn.addEventListener('click', () => {
  if (playing && paused) {
    paused = false;
    startBackgroundMusic(); // Resume music when resume button is clicked
    lastTime = performance.now();
    requestAnimationFrame(loop);
  }
});

restartBtn.addEventListener('click', init);

// Mobile buttons
upBtn.addEventListener('click', () => { if (dir.y !== 1) nextDir = {x:0,y:-1}; });
downBtn.addEventListener('click', () => { if (dir.y !== -1) nextDir = {x:0,y:1}; });
leftBtn.addEventListener('click', () => { if (dir.x !== 1) nextDir = {x:-1,y:0}; });
rightBtn.addEventListener('click', () => { if (dir.x !== -1) nextDir = {x:1,y:0}; });

// Handle page visibility change to pause/resume music
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (playing && !paused) {
      pauseBackgroundMusic();
    }
  } else {
    if (playing && !paused) {
      startBackgroundMusic();
    }
  }
});

init();
