const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// Player
const player = {
  x: 120,
  y: HEIGHT - 120,
  size: 32,
  vy: 0,
  onGround: false,
  rotation: 0
};

const GRAVITY = 0.9;
const JUMP_FORCE = -18;
const SPEED = 8;

const groundY = HEIGHT - 80;

let cameraX = 0;
let gameOver = false;
let score = 0;

// Level arrays
let spikes = [];
let platforms = [];
let decorations = [];

// Random helper
function rand(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

// Generate procedural level
function generateLevel() {
  spikes = [];
  platforms = [];
  decorations = [];

  let x = 600;

  for (let i = 0; i < 60; i++) {
    const type = rand(1, 6);

    if (type === 1) {
      // Single spike
      spikes.push({ x, y: groundY - 40, size: 40 });
      x += rand(200, 350);
    }

    if (type === 2) {
      // Double spike
      spikes.push({ x, y: groundY - 40, size: 40 });
      spikes.push({ x: x + 50, y: groundY - 40, size: 40 });
      x += rand(250, 400);
    }

    if (type === 3) {
      // Platform jump
      platforms.push({
        x,
        y: groundY - rand(120, 200),
        w: rand(120, 200),
        h: 20
      });
      x += rand(250, 350);
    }

    if (type === 4) {
      // Spike on platform
      const py = groundY - rand(140, 200);
      platforms.push({ x, y: py, w: 160, h: 20 });
      spikes.push({ x: x + 60, y: py - 40, size: 40 });
      x += rand(250, 350);
    }

    if (type === 5) {
      // Decoration chain
      decorations.push({
        x,
        y: rand(40, 120),
        length: rand(40, 120)
      });
      x += rand(200, 300);
    }
  }
}

generateLevel();

function reset() {
  player.y = HEIGHT - 120;
  player.vy = 0;
  cameraX = 0;
  score = 0;
  gameOver = false;
  generateLevel();
}

function update() {
  if (gameOver) return;

  player.vy += GRAVITY;
  player.y += player.vy;

  if (player.y + player.size >= groundY) {
    player.y = groundY - player.size;
    player.vy = 0;
    player.onGround = true;
  } else {
    player.onGround = false;
  }

  cameraX += SPEED;
  score = Math.floor(cameraX / 10);

  // Spike collision
  for (const s of spikes) {
    const px = player.x + cameraX;
    if (
      px < s.x + s.size &&
      px + player.size > s.x &&
      player.y + player.size > s.y
    ) {
      gameOver = true;
    }
  }

  // Platform collision
  for (const p of platforms) {
    const px = player.x + cameraX;

    if (
      px < p.x + p.w &&
      px + player.size > p.x &&
      player.y + player.size > p.y &&
      player.y + player.size < p.y + 20 &&
      player.vy > 0
    ) {
      player.y = p.y - player.size;
      player.vy = 0;
      player.onGround = true;
    }
  }

  if (player.y > HEIGHT) gameOver = true;

  // Rotate cube
  if (!player.onGround) player.rotation += 0.2;
}

function drawSpike(x, y, size) {
  ctx.fillStyle = "#ef4444";
  ctx.beginPath();
  ctx.moveTo(x, y + size);
  ctx.lineTo(x + size / 2, y);
  ctx.lineTo(x + size, y + size);
  ctx.closePath();
  ctx.fill();
}

function drawChain(x, y, length) {
  ctx.strokeStyle = "#64748b";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + length);
  ctx.stroke();
}

function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  // Background
  const grad = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  grad.addColorStop(0, "#1e293b");
  grad.addColorStop(1, "#0f172a");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Decorations
  for (const d of decorations) {
    const screenX = d.x - cameraX;
    if (screenX > -50 && screenX < WIDTH + 50) {
      drawChain(screenX, d.y, d.length);
    }
  }

  // Ground
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, groundY, WIDTH, HEIGHT - groundY);

  // Platforms
  ctx.fillStyle
