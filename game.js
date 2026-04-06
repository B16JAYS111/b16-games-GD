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
  onGround: false
};

const GRAVITY = 0.9;
const JUMP_FORCE = -18;
const SPEED = 8;

// Simple ground + spikes level
const groundY = HEIGHT - 80;
const obstacles = [];

// Create a simple pattern of spikes
for (let i = 0; i < 40; i++) {
  const gap = 140;
  const baseX = 400 + i * gap;
  if (i % 2 === 0) {
    obstacles.push({
      x: baseX,
      y: groundY - 40,
      w: 40,
      h: 40
    });
  }
}

let cameraX = 0;
let gameOver = false;

function reset() {
  player.y = HEIGHT - 120;
  player.vy = 0;
  cameraX = 0;
  gameOver = false;
}

function update() {
  if (gameOver) return;

  // Physics
  player.vy += GRAVITY;
  player.y += player.vy;

  if (player.y + player.size >= groundY) {
    player.y = groundY - player.size;
    player.vy = 0;
    player.onGround = true;
  } else {
    player.onGround = false;
  }

  // Camera scroll
  cameraX += SPEED;

  // Collision with obstacles
  for (const o of obstacles) {
    const px = player.x + cameraX;
    if (
      px < o.x + o.w &&
      px + player.size > o.x &&
      player.y < o.y + o.h &&
      player.y + player.size > o.y
    ) {
      gameOver = true;
    }
  }

  // Fail if off screen
  if (player.y > HEIGHT) {
    gameOver = true;
  }
}

function drawGrid() {
  ctx.strokeStyle = "rgba(148, 163, 184, 0.15)";
  ctx.lineWidth = 1;
  const gridSize = 40;
  for (let x = -((cameraX % gridSize)); x < WIDTH; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y < HEIGHT; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y);
    ctx.stroke();
  }
}

function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  // Background glow
  const grad = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  grad.addColorStop(0, "#0f172a");
  grad.addColorStop(1, "#020617");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  drawGrid();

  // Ground
  ctx.fillStyle = "#020617";
  ctx.fillRect(0, groundY, WIDTH, HEIGHT - groundY);

  // Obstacles (spikes as squares for now)
  ctx.fillStyle = "#f97316";
  for (const o of obstacles) {
    const screenX = o.x - cameraX;
    if (screenX + o.w < 0 || screenX > WIDTH) continue;
    ctx.fillRect(screenX, o.y, o.w, o.h);
  }

  // Player
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.fillStyle = "#22c55e";
  ctx.fillRect(0, 0, player.size, player.size);
  ctx.restore();

  if (gameOver) {
    ctx.fillStyle = "rgba(15, 23, 42, 0.7)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = "#facc15";
    ctx.font = "32px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("B16 Games - Level Failed", WIDTH / 2, HEIGHT / 2);
    ctx.font = "18px system-ui";
    ctx.fillText("Press R or tap Restart", WIDTH / 2, HEIGHT / 2 + 40);
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();

// Controls
window.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "ArrowUp") {
    if (player.onGround && !gameOver) {
      player.vy = JUMP_FORCE;
    }
  }
  if (e.code === "KeyR") {
    reset();
  }
});

document.getElementById("btn-restart").addEventListener("click", reset);

// Simple mobile tap jump
canvas.addEventListener("pointerdown", () => {
  if (player.onGround && !gameOver) {
    player.vy = JUMP_FORCE;
  } else if (gameOver) {
    reset();
  }
});
