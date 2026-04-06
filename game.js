const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// -------------------- PALETTE --------------------
const COLORS = {
  bgTop: "#020617",
  bgBottom: "#020617",
  bgMid: "#0b1120",
  ground: "#020617",
  groundTile: "#111827",
  player: "#22c55e",
  playerGlow: "rgba(34,197,94,0.4)",
  spike: "#f97373",
  spikeOutline: "#ef4444",
  platform: "#38bdf8",
  platformOutline: "#0ea5e9",
  text: "#facc15",
  trail: "rgba(34,197,94,0.3)",
  particle: "#e5e7eb"
};

// -------------------- PLAYER --------------------
const player = {
  x: 160,
  y: HEIGHT - 140,
  size: 32,
  vy: 0,
  rotation: 0,
  onGround: false,
  prevY: HEIGHT - 140
};

const GRAVITY = 0.9;
const JUMP_FORCE = -18;
const groundY = HEIGHT - 80;

let cameraX = 0;
let gameOver = false;
let score = 0;

// -------------------- LEVEL OBJECTS --------------------
let spikes = [];
let platforms = [];
let decorations = [];
let particles = [];
let trail = [];

// Random helper
function rand(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

// -------------------- LEVEL GENERATION --------------------
function generateLevel() {
  spikes = [];
  platforms = [];
  decorations = [];
  particles = [];
  trail = [];

  let x = 600;

  for (let i = 0; i < 80; i++) {
    const type = rand(1, 7);

    // Spike patterns
    if (type <= 3) {
      spikes.push({ x, y: groundY - 40, size: 40 });
      if (Math.random() < 0.4) {
        spikes.push({ x: x + 50, y: groundY - 40, size: 40 });
      }
      x += rand(220, 360);
    }

    // Platform jumps
    if (type === 4) {
      const py = groundY - rand(120, 200);
      const w = rand(140, 220);
      platforms.push({ x, y: py, w, h: 20 });

      if (Math.random() < 0.5) {
        spikes.push({ x: x + w / 2 - 20, y: py - 40, size: 40 });
      }

      x += rand(260, 360);
    }

    // Decoration chains
    if (type === 5) {
      decorations.push({
        x,
        y: rand(40, 120),
        length: rand(40, 120)
      });
      x += rand(200, 300);
    }

    // Small spike clusters
    if (type === 6) {
      const count = rand(2, 5);
      for (let j = 0; j < count; j++) {
        spikes.push({
          x: x + j * 40,
          y: groundY - 40,
          size: 40
        });
      }
      x += rand(260, 360);
    }

    // Chill gap
    if (type === 7) {
      x += rand(260, 380);
    }
  }
}

generateLevel();

// -------------------- RESET --------------------
function reset() {
  player.y = HEIGHT - 140;
  player.vy = 0;
  player.rotation = 0;
  cameraX = 0;
  score = 0;
  gameOver = false;
  generateLevel();
}

// -------------------- PARTICLES --------------------
function spawnParticles(x, y, count, color) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 1.2) * 6,
      life: rand(15, 30),
      color
    });
  }
}

// -------------------- UPDATE --------------------
function update() {
  if (gameOver) return;

  player.prevY = player.y;

  cameraX += 8;
  score = Math.floor(cameraX / 10);

  // Physics
  player.vy += GRAVITY;
  player.y += player.vy;

  // Ground collision
  if (player.y + player.size >= groundY) {
    if (!player.onGround && player.vy > 8) {
      spawnParticles(player.x + player.size / 2, groundY, 10, COLORS.particle);
    }
    player.y = groundY - player.size;
    player.vy = 0;
    player.onGround = true;
  } else {
    player.onGround = false;
  }

  // Rotation
  if (!player.onGround) player.rotation += 0.2;
  else player.rotation *= 0.7;

  // Trail
  trail.push({
    x: player.x + player.size / 2,
    y: player.y + player.size / 2,
    life: 18
  });
  if (trail.length > 40) trail.shift();

  // Spike collision
  for (const s of spikes) {
    const px = player.x + cameraX;
    if (
      px < s.x + s.size &&
      px + player.size > s.x &&
      player.y + player.size > s.y
    ) {
      spawnParticles(
        player.x + player.size / 2,
        player.y + player.size / 2,
        25,
        COLORS.spike
      );
      gameOver = true;
    }
  }

  // Platform collision — only from above
  for (const p of platforms) {
    const px = player.x + cameraX;
    const prevBottom = player.prevY + player.size;
    const currBottom = player.y + player.size;

    const horizontallyInside =
      px < p.x + p.w && px + player.size > p.x;

    const fallingOntoTop =
      prevBottom <= p.y && currBottom >= p.y && player.vy > 0;

    if (horizontallyInside && fallingOntoTop) {
      player.y = p.y - player.size;
      player.vy = 0;
      player.onGround = true;
      spawnParticles(
        player.x + player.size / 2,
        p.y,
        8,
        COLORS.platform
      );
    }
  }

  if (player.y > HEIGHT + 60) {
    spawnParticles(
      player.x + player.size / 2,
      HEIGHT - 40,
      20,
      COLORS.particle
    );
    gameOver = true;
  }

  // Update particles
  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.3;
    p.life--;
  }
  particles = particles.filter(p => p.life > 0);

  // Fade trail
  for (const t of trail) {
    t.life--;
  }
  trail = trail.filter(t => t.life > 0);
}

// -------------------- DRAW HELPERS --------------------
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
  ctx.lineWidth = 3;
  ctx.strokeStyle = COLORS.spikeOutline;
  ctx.stroke();
  ctx.restore();
}

function drawChain(x, y, length) {
  ctx.strokeStyle = "rgba(148,163,184,0.7)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + length);
  ctx.stroke();

  for (let i = 0; i < length; i += 16) {
    ctx.beginPath();
    ctx.arc(x, y + i, 3, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(148,163,184,0.9)";
    ctx.fill();
  }
}

function drawGroundTiles() {
  const tileSize = 40;
  for (let x = -((cameraX % tileSize) + tileSize); x < WIDTH + tileSize; x += tileSize) {
    ctx.fillStyle = COLORS.groundTile;
    ctx.fillRect(x, groundY, tileSize - 2, tileSize);

    ctx.fillStyle = "rgba(15,23,42,0.8)";
    ctx.fillRect(x, groundY, tileSize - 2, 6);
  }
}

// -------------------- DRAW --------------------
function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  grad.addColorStop(0, COLORS.bgTop);
  grad.addColorStop(0.5, COLORS.bgMid);
  grad.addColorStop(1, COLORS.bgBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Parallax stripes
  ctx.fillStyle = "rgba(15,23,42,0.7)";
  for (let i = 0; i < 6; i++) {
    const offset = (cameraX * 0.2 + i * 220) % (WIDTH + 220) - 220;
    ctx.fillRect(offset, 80 + i * 40, 180, 4);
  }

  // Decorations
  for (const d of decorations) {
    const screenX = d.x - cameraX * 0.7;
    if (screenX > -80 && screenX < WIDTH + 80) {
      drawChain(screenX, d.y, d.length);
    }
  }

  // Ground
  ctx.fillStyle = COLORS.ground;
  ctx.fillRect(0, groundY, WIDTH, HEIGHT - groundY);

  drawGroundTiles();

  // Platforms
  for (const p of platforms) {
    const screenX = p.x - cameraX;
    if (screenX + p.w < 0 || screenX > WIDTH) continue;

    ctx.fillStyle = COLORS.platform;
    ctx.fillRect(screenX, p.y, p.w, p.h);

    ctx.strokeStyle = COLORS.platformOutline;
    ctx.lineWidth = 3;
    ctx.strokeRect(screenX, p.y, p.w, p.h);
  }

  // Spikes
  for (const s of spikes) {
    const screenX = s.x - cameraX;
    if (screenX + s.size < 0 || screenX > WIDTH) continue;
    drawSpike(screenX, s.y, s.size);
  }

  // Trail
  for (const t of trail) {
    const alpha = t.life / 18;
    ctx.fillStyle = `rgba(34,197,94,${alpha * 0.5})`;
    ctx.beginPath();
    ctx.arc(t.x, t.y, 10 * (t.life / 18), 0, Math.PI * 2);
    ctx.fill();
  }

  // Player glow
  ctx.save();
  ctx.translate(player.x + player.size / 2, player.y + player.size / 2);
  const glowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 40);
  glowGrad.addColorStop(0, COLORS.playerGlow);
  glowGrad.addColorStop(1, "rgba(34,197,94,0)");
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(0, 0, 40, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Player
  ctx.save();
  ctx.translate(player.x + player.size / 2, player.y + player.size / 2);
  ctx.rotate(player.rotation);
  ctx.fillStyle = COLORS.player;
  ctx.fillRect(-player.size / 2, -player.size / 2, player.size, player.size);
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#16a34a";
  ctx.strokeRect(-player.size / 2, -player.size / 2, player.size, player.size);
  ctx.restore();

  // Particles
  for (const p of particles) {
    const alpha = p.life / 30;
    ctx.fillStyle = `rgba(229,231,235,${alpha})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // UI
  ctx.fillStyle = COLORS.text;
  ctx.font = "24px system-ui";
  ctx.textAlign = "left";
  ctx.fillText("Score: " + score, 20, 40);

  if (gameOver) {
    ctx.fillStyle = "rgba(15, 23, 42, 0.8)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = COLORS.text;
    ctx.font = "32px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("Level Failed", WIDTH / 2, HEIGHT / 2);
    ctx.font = "18px system-ui";
    ctx.fillText("Press R or tap to restart", WIDTH / 2, HEIGHT / 2 + 40);
  }
}

// -------------------- LOOP --------------------
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();

// -------------------- INPUT --------------------
const keys = { space: false };

window.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    keys.space = true;
    if (player.onGround && !gameOver) {
      player.vy = JUMP_FORCE;
      spawnParticles(
        player.x + player.size / 2,
        player.y + player.size,
        10,
        COLORS.player
      );
    }
  }

  if (e.code === "KeyR") reset();
});

window.addEventListener("keyup", (e) => {
  if (e.code === "Space") keys.space = false;
});

canvas.addEventListener("pointerdown", () => {
  if (player.onGround && !gameOver) {
    player.vy = JUMP_FORCE;
    spawnParticles(
      player.x + player.size / 2,
      player.y + player.size,
      10,
      COLORS.player
    );
  } else if (gameOver) {
    reset();
  }
});
