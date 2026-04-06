const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// COLORS
const COLORS = {
  bgTop: "#020617",
  bgMid: "#0b1120",
  bgBottom: "#020617",
  ground: "#020617",
  groundTile: "#111827",
  player: "#22c55e",
  playerGlow: "rgba(34,197,94,0.4)",
  spike: "#f97373",
  spikeOutline: "#ef4444",
  platform: "#38bdf8",
  platformOutline: "#0ea5e9",
  text: "#facc15",
  progressBg: "rgba(15,23,42,0.9)",
  progressFill: "#22c55e",
  progressBorder: "#e5e7eb"
};

// PLAYER
const player = {
  x: 200,
  y: HEIGHT - 160,
  size: 40,
  vy: 0,
  rotation: 0,
  onGround: false,
  prevY: HEIGHT - 160
};

const GRAVITY = 0.9;
const JUMP_FORCE = -18;
const groundY = HEIGHT - 80;

let cameraX = 0;
let gameOver = false;
let score = 0;

let spikes = [];
let platforms = [];
let particles = [];
let trail = [];
let levelEndX = 4000;

// RANDOM
function rand(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

// LEVEL GENERATION
function generateLevel() {
  spikes = [];
  platforms = [];
  particles = [];
  trail = [];

  let x = 600;

  for (let i = 0; i < 60; i++) {
    const type = rand(1, 6);

    if (type <= 2) {
      spikes.push({ x, y: groundY - 40, size: 40 });
      x += rand(200, 300);
    }

    if (type === 3) {
      const count = rand(1, 4);
      for (let j = 0; j < count; j++) {
        spikes.push({
          x: x + j * 30,
          y: groundY - 24,
          size: 24
        });
      }
      x += rand(200, 300);
    }

    if (type === 4) {
      const py = groundY - rand(80, 140);
      const w = rand(140, 220);
      platforms.push({ x, y: py, w, h: 24 });
      x += rand(240, 320);
    }

    if (type === 5) {
      x += rand(260, 360);
    }
  }

  levelEndX = x + 600;
}

generateLevel();

// RESET
function reset() {
  player.y = HEIGHT - 160;
  player.vy = 0;
  player.rotation = 0;
  cameraX = 0;
  score = 0;
  gameOver = false;
  generateLevel();
}

// PARTICLES
function spawnParticles(x, y, count, color) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 5,
      vy: (Math.random() - 1.2) * 5,
      life: rand(10, 25),
      color
    });
  }
}

// UPDATE
function update() {
  if (gameOver) return;

  player.prevY = player.y;

  cameraX += 8;
  score = Math.floor(cameraX / 10);

  player.vy += GRAVITY;
  player.y += player.vy;

  if (player.y + player.size >= groundY) {
    player.y = groundY - player.size;
    player.vy = 0;
    player.onGround = true;
  } else {
    player.onGround = false;
  }

  if (!player.onGround) player.rotation += 0.08;
  else player.rotation *= 0.5;

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
    const prevBottom = player.prevY + player.size;
    const currBottom = player.y + player.size;

    const insideX = px < p.x + p.w && px + player.size > p.x;
    const landing = prevBottom <= p.y && currBottom >= p.y && player.vy > 0;

    if (insideX && landing) {
      player.y = p.y - player.size;
      player.vy = 0;
      player.onGround = true;
    }
  }

  // Trail
  trail.push({
    x: player.x + player.size / 2,
    y: player.y + player.size / 2,
    life: 20
  });
  if (trail.length > 40) trail.shift();

  particles = particles.filter(p => p.life-- > 0);
}

// DRAW SPIKE
function drawSpike(x, y, size) {
  ctx.save();
  ctx.translate(x + size / 2, y + size / 2);
  ctx.beginPath();
  ctx.moveTo(-size / 2, size / 2);
  ctx.lineTo(0, -size / 2);
  ctx.lineTo(size / 2, size / 2);
  ctx.closePath();
  ctx.fillStyle = COLORS.spike;
  ctx.fill();
  ctx.strokeStyle = COLORS.spikeOutline;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

// DRAW PLATFORM
function drawPlatform(x, y, w, h) {
  ctx.fillStyle = COLORS.platform;
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = COLORS.platformOutline;
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
}

// DRAW CHAINS
function drawChains(x, y, w) {
  const count = Math.max(1, Math.floor(w / 80));
  const spacing = w / (count + 1);

  for (let i = 1; i <= count; i++) {
    const cx = x + spacing * i;
    ctx.strokeStyle = "rgba(148,163,184,0.9)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, 40);
    ctx.lineTo(cx, y);
    ctx.stroke();
  }
}

// DRAW
function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  // Background
  const bg = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  bg.addColorStop(0, COLORS.bgTop);
  bg.addColorStop(0.5, COLORS.bgMid);
  bg.addColorStop(1, COLORS.bgBottom);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Ground
  ctx.fillStyle = COLORS.ground;
  ctx.fillRect(0, groundY, WIDTH, HEIGHT - groundY);

  // Platforms
  for (const p of platforms) {
    const sx = p.x - cameraX;
    drawChains(sx, p.y, p.w);
    drawPlatform(sx, p.y, p.w, p.h);
  }

  // Spikes
  for (const s of spikes) {
    drawSpike(s.x - cameraX, s.y, s.size);
  }

  // Trail
  for (const t of trail) {
    ctx.fillStyle = `rgba(34,197,94,${t.life / 20})`;
    ctx.beginPath();
    ctx.arc(t.x - cameraX, t.y, 8 * (t.life / 20), 0, Math.PI * 2);
    ctx.fill();
  }

  // Player screen X
  const sx = player.x - cameraX;

  // Glow
  ctx.save();
  ctx.translate(sx + player.size / 2, player.y + player.size / 2);
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 50);
  glow.addColorStop(0, COLORS.playerGlow);
  glow.addColorStop(1, "rgba(34,197,94,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, 50, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Player
  ctx.save();
  ctx.translate(sx + player.size / 2, player.y + player.size / 2);
  ctx.rotate(player.rotation);
  ctx.fillStyle = COLORS.player;
  ctx.fillRect(-player.size / 2, -player.size / 2, player.size, player.size);
  ctx.strokeStyle = "#16a34a";
  ctx.lineWidth = 3;
  ctx.strokeRect(-player.size / 2, -player.size / 2, player.size, player.size);
  ctx.restore();

  // Progress bar
  const barW = 400;
  const barH = 10;
  const barX = (WIDTH - barW) / 2;
  const barY = 20;
  const progress = Math.min(1, cameraX / levelEndX);

  ctx.fillStyle = COLORS.progressBg;
  ctx.fillRect(barX, barY, barW, barH);

  ctx.fillStyle = COLORS.progressFill;
  ctx.fillRect(barX, barY, barW * progress, barH);

  ctx.strokeStyle = COLORS.progressBorder;
  ctx.strokeRect(barX, barY, barW, barH);

  // Score
  ctx.fillStyle = COLORS.text;
  ctx.font = "20px system-ui";
  ctx.fillText("Score: " + score, 20, 50);

  if (gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = COLORS.text;
    ctx.font = "32px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("Level Failed", WIDTH / 2, HEIGHT / 2);
  }
}

// LOOP
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();

// INPUT
window.addEventListener("keydown", (e) => {
  if (e.code === "Space" && player.onGround && !gameOver) {
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

// FULLSCREEN
document.getElementById("fullscreen-btn").addEventListener("click", () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});
