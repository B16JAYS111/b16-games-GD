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

// Ground
const groundY = HEIGHT - 80;

// Score
let score = 0;

// Level objects
const spikes = [];
const platforms = [];

// Generate spikes with better spacing
for (let i = 0; i < 30; i++) {
  const gap = 260;
  const baseX = 600 + i * gap;

  spikes.push({
    x: baseX,
    y: groundY - 40,
    size: 40
  });

  // Add platforms every few spikes
  if (i % 3 === 0) {
    platforms.push({
      x: baseX + 120,
      y: groundY - 160,
      w: 160,
      h: 20
    });
  }
}

let cameraX = 0;
let gameOver = false;

function reset() {
  player.y = HEIGHT - 120;
  player.vy = 0;
  cameraX = 0;
  score = 0;
  gameOver = false;
}

function update() {
  if (gameOver) return;

  // Physics
  player.vy += GRAVITY;
  player.y += player.vy;

  // Ground collision
  if (player.y + player.size >= groundY) {
    player.y = groundY - player.size;
    player.vy = 0;
    player.onGround = true;
  } else {
    player.onGround = false;
  }

  // Camera scroll
  cameraX += SPEED;

  // Score increases with distance
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

  // Fall off screen
  if (player.y > HEIGHT) {
    gameOver = true;
  }
}

function drawSpike(x, y, size) {
  ctx.fillStyle = "#f43f5e";
  ctx.beginPath();
  ctx.moveTo(x, y + size);
  ctx.lineTo(x + size / 2, y);
  ctx.lineTo(x + size, y + size);
  ctx.closePath();
  ctx.fill();
}

function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  // Background
  const grad = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  grad.addColorStop(0, "#1e293b");
  grad.addColorStop(1, "#0f172a");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Ground
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, groundY, WIDTH, HEIGHT - groundY);

  // Platforms
  ctx.fillStyle = "#38bdf8";
  for (const p of platforms) {
    const screenX = p.x - cameraX;
    if (screenX + p.w < 0 || screenX > WIDTH) continue;
    ctx.fillRect(screenX, p.y, p.w, p.h);
  }

  // Spikes
  for (const s of spikes) {
    const screenX = s.x - cameraX;
    if (screenX + s.size < 0 || screenX > WIDTH) continue;
    drawSpike(screenX, s.y, s.size);
  }

  // Player
  ctx.fillStyle = "#22c55e";
  ctx.fillRect(player.x, player.y, player.size, player.size);

  // Score
  ctx.fillStyle = "#facc15";
  ctx.font = "24px system-ui";
  ctx.fillText("Score: " + score, 20, 40);

  // Game over screen
  if (gameOver) {
    ctx.fillStyle = "rgba(15, 23, 42, 0.7)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = "#facc15";
    ctx.font = "32px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("Level Failed", WIDTH / 2, HEIGHT / 2);
    ctx.font = "18px system-ui";
    ctx.fillText("Press R or tap to restart", WIDTH / 2, HEIGHT / 2 + 40);
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
  if ((e.code === "Space" || e.code === "ArrowUp") && player.onGround && !gameOver) {
    player.vy = JUMP_FORCE;
  }
  if (e.code === "KeyR") reset();
});

canvas.addEventListener("pointerdown", () => {
  if (player.onGround && !gameOver) {
    player.vy = JUMP_FORCE;
  } else if (gameOver) {
    reset();
  }
});
