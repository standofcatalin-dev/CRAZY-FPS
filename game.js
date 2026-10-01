const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const healthEl = document.getElementById('health');

// Размер канваса под экран
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

// --- Игрок ---
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 20,
    speed: 4,
    health: 100
};

// --- Управление ---
const keys = {};
window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

// --- Мышь (прицел) ---
const mouse = { x: 0, y: 0 };
canvas.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

// --- Пули ---
const bullets = [];
const BULLET_SPEED = 12;
const BULLET_RADIUS = 4;
let shootCooldown = 0;

canvas.addEventListener('mousedown', () => {
    if (shootCooldown <= 0) {
        shoot();
        shootCooldown = 8; // задержка между выстрелами
    }
});

function shoot() {
    const dx = mouse.x - player.x;
    const dy = mouse.y - player.y;
    const len = Math.hypot(dx, dy) || 1;
    bullets.push({
        x: player.x,
        y: player.y,
        vx: (dx / len) * BULLET_SPEED,
        vy: (dy / len) * BULLET_SPEED
    });
}

// --- Враги ---
const enemies = [];
let spawnTimer = 0;
let score = 0;

function spawnEnemy() {
    // Спавн за краем экрана
    const side = Math.floor(Math.random() * 4);
    let x, y;
    if (side === 0) { x = Math.random() * canvas.width; y = -30; }
    if (side === 1) { x = canvas.width + 30; y = Math.random() * canvas.height; }
    if (side === 2) { x = Math.random() * canvas.width; y = canvas.height + 30; }
    if (side === 3) { x = -30; y = Math.random() * canvas.height; }

    enemies.push({
        x, y,
        radius: 18,
        speed: 1.2 + Math.random() * 0.8,
        health: 1
    });
}

// --- Игровой цикл ---
function update() {
    // Движение игрока (WASD + стрелки)
    let dx = 0, dy = 0;
    if (keys['w'] || keys['arrowup']) dy -= 1;
    if (keys['s'] || keys['arrowdown']) dy += 1;
    if (keys['a'] || keys['arrowleft']) dx -= 1;
    if (keys['d'] || keys['arrowright']) dx += 1;
    const len = Math.hypot(dx, dy) || 1;
    player.x += (dx / len) * player.speed;
    player.y += (dy / len) * player.speed;

    // Не выходим за границы
    player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));

    // Кулдаун стрельбы
    if (shootCooldown > 0) shootCooldown--;

    // Пули
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx;
        b.y += b.vy;
        if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
            bullets.splice(i, 1);
        }
    }

    // Спавн врагов
    spawnTimer--;
    if (spawnTimer <= 0) {
        spawnEnemy();
        spawnTimer = Math.max(20, 60 - Math.floor(score / 5));
    }

    // Враги: движение к игроку + столкновение
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        const dx2 = player.x - e.x;
        const dy2 = player.y - e.y;
        const dist = Math.hypot(dx2, dy2) || 1;
        e.x += (dx2 / dist) * e.speed;
        e.y += (dy2 / dist) * e.speed;

        // Враг добрался до игрока
        if (dist < e.radius + player.radius) {
            player.health -= 10;
            enemies.splice(i, 1);
            if (player.health <= 0) gameOver();
            continue;
        }

        // Проверка попадания пуль
        for (let j = bullets.length - 1; j >= 0; j--) {
            const b = bullets[j];
            const bd = Math.hypot(b.x - e.x, b.y - e.y);
            if (bd < e.radius + BULLET_RADIUS) {
                bullets.splice(j, 1);
                enemies.splice(i, 1);
                score++;
                scoreEl.textContent = 'Очки: ' + score;
                break;
            }
        }
    }

    healthEl.textContent = '❤️ ' + player.health;
}

function draw() {
    // Фон
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Сетка (для ощущения движения)
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 50) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 50) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    // Пули
    ctx.fillStyle = '#ffdd00';
    bullets.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, BULLET_RADIUS, 0, Math.PI * 2);
        ctx.fill();
    });

    // Враги
    enemies.forEach(e => {
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
        ctx.fill();
        // Глаз
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(e.x, e.y, 4, 0, Math.PI * 2);
        ctx.fill();
    });

    // Игрок
    ctx.fillStyle = '#3498db';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();

    // Ствол (смотрит на мышь)
    const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(
        player.x + Math.cos(angle) * (player.radius + 15),
        player.y + Math.sin(angle) * (player.radius + 15)
    );
    ctx.stroke();

    // Прицел
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, 10, 0, Math.PI * 2);
    ctx.moveTo(mouse.x - 15, mouse.y);
    ctx.lineTo(mouse.x - 5, mouse.y);
    ctx.moveTo(mouse.x + 5, mouse.y);
    ctx.lineTo(mouse.x + 15, mouse.y);
    ctx.moveTo(mouse.x, mouse.y - 15);
    ctx.lineTo(mouse.x, mouse.y - 5);
    ctx.moveTo(mouse.x, mouse.y + 5);
    ctx.lineTo(mouse.x, mouse.y + 15);
    ctx.stroke();
}

let gameRunning = true;
function gameOver() {
    gameRunning = false;
    alert('Игра окончена! Очки: ' + score);
    location.reload();
}

function loop() {
    if (!gameRunning) return;
    update();
    draw();
    requestAnimationFrame(loop);
}
loop();
