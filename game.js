const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// Player modes
const MODE_CUBE = "cube";
const MODE_SHIP = "ship";
const MODE_WAVE = "wave";
const MODE_BALL = "ball";
const MODE_UFO = "ufo";

let speedMultiplier = 1;

// Player
const player = {
  x: 120,
  y: HEIGHT - 120,
  size: 32,
  vy: 0,
  vx: 0,
  rotation: 0,
  onGround: false,
  mode: MODE_CUBE,
  mini: false
};

const GRAVITY = 0.9;
const JUMP_FORCE = -18;
const SHIP_FORCE = -0.6;
const WAVE_SPEED = 6;
const BALL_JUMP = -16;

const groundY = HEIGHT - 80;

let cameraX = 0;
let gameOver = false;
let score = 0;

// Level objects
let spikes = [];
let platforms = [];
let portals = [];
let decorations = [];

// Random helper
function rand(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

// Portal types
const PORTAL_SHIP = "ship";
const PORTAL_WAVE = "wave";
const PORTAL_BALL = "ball";
const PORTAL_UFO = "ufo";
const PORTAL_MINI = "mini";
const PORTAL_NORMAL = "normal";
const PORTAL_SPEED = "speed";

// Generate procedural level
function generateLevel() {
  spikes = [];
  platforms = [];
  portals = [];
  decorations = [];

  let x = 600;

  for (let i = 0; i < 80; i++) {
    const type = rand(1, 12);

    if (type <= 4) {
      // Spikes
      spikes.push({ x, y: groundY - 40, size: 40 });
      x += rand(200, 350);
    }

    if (type === 5) {
      // Platform
      platforms.push({
        x,
        y: groundY - rand(120, 200),
        w: rand(120, 200),
        h: 20
      });
      x += rand(250, 350);
    }

    if (type === 6) {
      // Ship portal
      portals.push({ x, y: groundY - 80, type: PORTAL_SHIP });
      x += 200;
    }

    if (type === 7) {
      portals.push({ x, y: groundY - 80, type: PORTAL_WAVE });
      x += 200;
    }

    if (type === 8) {
      portals.push({ x, y: groundY - 80, type: PORTAL_BALL });
      x += 200;
    }

    if (type === 9) {
      portals.push({ x, y: groundY - 80, type: PORTAL_UFO });
      x += 200;
    }

    if (type === 10) {
      portals.push({ x, y: groundY - 80, type: PORTAL_MINI });
      x += 200;
    }

    if (type === 11) {
      portals.push({ x, y: groundY - 80, type: PORTAL_NORMAL });
      x += 200;
    }

    if (type === 12) {
      portals.push({
        x,
        y: groundY - 80,
        type: PORTAL_SPEED,
        speed: [0.5, 1, 2, 3][rand(0, 4)]
      });
      x += 200;
    }
  }
}

generateLevel();

function reset() {
  player.y = HEIGHT - 120;
  player.vy = 0;
  player.mode = MODE_CUBE;
  player.mini = false;
  speedMultiplier = 1;
  cameraX = 0;
  score = 0;
  gameOver = false;
  generateLevel();
}

function updateCube() {
  player.vy += GRAVITY;
  player.y += player.vy;

  if (player.y + player.size >= groundY) {
    player.y = groundY - player.size;
    player.vy = 0;
    player.onGround = true;
  } else {
    player.onGround = false;
  }

  if (!player.onGround) player.rotation += 0.2;
}

function updateShip() {
  if (keys.space) {
    player.vy += SHIP_FORCE;
  } else {
    player.vy += GRAVITY * 0.4;
  }
  player.y += player.vy;
  player.rotation = player.vy * 0.1;
}

function updateWave() {
  if (keys.space) {
    player.vy = -WAVE_SPEED;
  } else {
    player.vy = WAVE_SPEED;
  }
  player.y += player.vy;
  player.rotation = player.vy * 0.15;
}

function updateBall() {
  player.vy += GRAVITY;
  player.y += player.vy;

  if (player.y + player.size >= groundY) {
    player.y = groundY - player.size;
    player.vy = 0;
    player.onGround = true;
  } else {
    player.onGround = false;
  }
}

function updateUFO() {
  player.vy += GRAVITY;
  player.y += player.vy;
}

function update() {
  if (gameOver) return;

  cameraX += 8 * speedMultiplier;
  score = Math.floor(cameraX / 10);

  // Mode physics
  if (player.mode === MODE_CUBE) updateCube();
  if (player.mode === MODE_SHIP) updateShip();
  if (player.mode === MODE_WAVE) updateWave();
  if (player.mode === MODE_BALL) updateBall();
  if (player.mode === MODE_UFO) updateUFO();

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

  // Portal collision
  for (const portal of portals) {
    const px = player.x + cameraX;

    if (px < portal.x + 40 && px + player.size > portal.x) {
      if (portal.type === PORTAL_SHIP) player.mode = MODE_SHIP;
      if (portal.type === PORTAL_WAVE) player.mode = MODE_WAVE;
      if (portal.type === PORTAL_BALL) player.mode = MODE_BALL;
      if (portal.type === PORTAL_UFO) player.mode = MODE_UFO;
      if (portal.type === PORTAL_NORMAL) player.mode = MODE_CUBE;

      if (portal.type === PORTAL_MINI) {
        player.mini = !player.mini;
        player.size = player.mini ? 20 : 32;
      }

      if (portal.type === PORTAL_SPEED) {
        speedMultiplier = portal.speed;
      }
    }
  }

  if (player.y > HEIGHT) gameOver = true;
}

function drawPortal(x, y, type) {
  ctx.fillStyle = {
    ship: "#3b82f6",
    wave: "#a855f7",
    ball: "#eab308",
    ufo: "#22c55e",
    mini: "#f43f5e",
    normal: "#ffffff",
    speed: "#f97316"
  }[type];

  ctx.fillRect(x, y, 40, 80);
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
    ctx.fillRect(screenX, p.y, p.w, p.h);
  }

  // Spikes
  for (const s of spikes) {
    const screenX = s.x - cameraX;
    drawSpike(screenX, s.y, s.size);
  }

  // Portals
  for (const portal of portals) {
    const screenX = portal.x - cameraX;
    drawPortal(screenX, portal.y, portal.type);
  }

  // Player
  ctx.save();
  ctx.translate(player.x + player.size / 2, player.y + player.size / 2);
  ctx.rotate(player.rotation);
  ctx.fillStyle = "#22c55e";
  ctx.fillRect(-player.size / 2, -player.size / 2, player.size, player.size);
  ctx.restore();

  // Score
  ctx.fillStyle = "#facc15";
  ctx.font = "24px system-ui";
  ctx.fillText("Score: " + score, 20, 40);

  if (gameOver) {
    ctx.fillStyle = "rgba(15, 23, 42, 0.7)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = "#facc15";
    ctx.font = "32px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("Level Failed", WIDTH / 2, HEIGHT / 2);
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();

const keys = { space: false };

window.addEventListener("keydown", (e) => {
  if (e.code === "Space") keys.space = true;

  if (player.mode === MODE_CUBE && player.onGround && !gameOver) {
    if (e.code === "Space") player.vy = JUMP_FORCE;
  }

  if (player.mode === MODE_BALL && !gameOver) {
    if (e.code === "Space") {
      player.vy = -player.vy;
    }
  }

  if (player.mode === MODE_UFO && !gameOver) {
    if (e.code === "Space") player.vy = BALL_JUMP;
  }

  if (e.code === "KeyR") reset();
});

window.addEventListener("keyup", (e) => {
  if (e.code === "Space") keys.space = false;
});

canvas.addEventListener("pointerdown", () => {
  keys.space = true;

  if (player.mode === MODE_CUBE && player.onGround && !gameOver) {
    player.vy = JUMP_FORCE;
  }

  if (player.mode === MODE_BALL && !gameOver) {
    player.vy = -player.vy;
  }

  if (player.mode === MODE_UFO && !gameOver) {
    player.vy = BALL_JUMP;
  }

  if (gameOver) reset();
});

canvas.addEventListener("pointerup", () => {
  keys.space = false;
});
