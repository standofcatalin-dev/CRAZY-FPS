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

// --- Игрок ---// ===== Сцена =====
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 20, 80);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// ===== Освещение =====
const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xffffff, 0.9);
sun.position.set(20, 40, 20);
sun.castShadow = true;
sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;
sun.shadow.camera.left = -60;
sun.shadow.camera.right = 60;
sun.shadow.camera.top = 60;
sun.shadow.camera.bottom = -60;
scene.add(sun);

// ===== Пол =====
const floorGeo = new THREE.PlaneGeometry(200, 200);
const floorMat = new THREE.MeshStandardMaterial({ color: 0x556655 });
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Сетка поверх пола для ориентира
const grid = new THREE.GridHelper(200, 100, 0x333333, 0x444444);
grid.position.y = 0.01;
scene.add(grid);

// ===== Стены по периметру =====
const wallMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
function makeWall(x, z, w, d) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, 8, d), wallMat);
    wall.position.set(x, 4, z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    scene.add(wall);
}
makeWall(0, -50, 100, 2);
makeWall(0, 50, 100, 2);
makeWall(-50, 0, 2, 100);
makeWall(50, 0, 2, 100);

// Несколько укрытий
const crateMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b });
for (let i = 0; i < 12; i++) {
    const size = 2 + Math.random() * 3;
    const crate = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), crateMat);
    crate.position.set(
        (Math.random() - 0.5) * 80,
        size / 2,
        (Math.random() - 0.5) * 80
    );
    crate.castShadow = true;
    crate.receiveShadow = true;
    scene.add(crate);
}

// ===== Игрок =====
const player = {
    position: new THREE.Vector3(0, 1.7, 0),
    yaw: 0,
    pitch: 0,
    speed: 0.12,
    health: 100
};

// ===== Управление мышью (Pointer Lock) =====
const canvas = renderer.domElement;
let isLocked = false;

document.getElementById('start-btn').addEventListener('click', () => {
    canvas.requestPointerLock();
});

document.getElementById('restart-btn').addEventListener('click', () => location.reload());

document.addEventListener('pointerlockchange', () => {
    isLocked = document.pointerLockElement === canvas;
    document.getElementById('start-screen').style.display = isLocked ? 'none' : 'flex';
});

document.addEventListener('mousemove', (e) => {
    if (!isLocked) return;
    player.yaw -= e.movementX * 0.002;
    player.pitch -= e.movementY * 0.002;
    // Ограничение по вертикали
    player.pitch = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, player.pitch));
});

// ===== Клавиатура =====
const keys = {};
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

// ===== Стрельба (Raycaster) =====
const raycaster = new THREE.Raycaster();
const enemies = [];
let score = 0;
let canShoot = true;

document.addEventListener('mousedown', (e) => {
    if (!isLocked || e.button !== 0 || !canShoot) return;
    shoot();
    canShoot = false;
    setTimeout(() => canShoot = true, 150);
});

function shoot() {
    raycaster.setFromCamera({ x: 0, y: 0 }, camera);
    const hits = raycaster.intersectObjects(enemies, false);
    if (hits.length > 0) {
        const enemy = hits[0].object;
        scene.remove(enemy);
        enemies.splice(enemies.indexOf(enemy), 1);
        score++;
        document.getElementById('score').textContent = 'Очки: ' + score;
    }
}

// ===== Враги =====
const enemyGeo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
const enemyMat = new THREE.MeshStandardMaterial({ color: 0xe74c3c });

function spawnEnemy() {
    // Спавн по кругу вокруг игрока, но подальше
    const angle = Math.random() * Math.PI * 2;
    const dist = 30 + Math.random() * 15;
    const x = player.position.x + Math.cos(angle) * dist;
    const z = player.position.z + Math.sin(angle) * dist;

    // Ограничим внутри стен
    if (Math.abs(x) > 48 || Math.abs(z) > 48) return;

    const enemy = new THREE.Mesh(enemyGeo, enemyMat.clone());
    enemy.position.set(x, 0.75, z);
    enemy.castShadow = true;
    scene.add(enemy);
    enemies.push(enemy);
}

let spawnTimer = 0;
const SPAWN_DELAY = 90; // кадров между спавнами

// ===== Коллизии со стенами =====
function clampPosition(pos) {
    pos.x = Math.max(-48, Math.min(48, pos.x));
    pos.z = Math.max(-48, Math.min(48, pos.z));
}

// ===== Игровой цикл =====
let running = false;
let animationId;

function update() {
    // --- Движение ---
    const forward = new THREE.Vector3(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
    const right = new THREE.Vector3(Math.cos(player.yaw), 0, -Math.sin(player.yaw));

    let move = new THREE.Vector3();
    if (keys['KeyW']) move.add(forward);
    if (keys['KeyS']) move.sub(forward);
    if (keys['KeyD']) move.add(right);
    if (keys['KeyA']) move.sub(right);

    if (move.lengthSq() > 0) {
        move.normalize().multiplyScalar(player.speed);
        player.position.add(move);
        clampPosition(player.position);
    }

    // --- Камера ---
    camera.position.copy(player.position);
    const dir = new THREE.Vector3(
        -Math.sin(player.yaw) * Math.cos(player.pitch),
        Math.sin(player.pitch),
        -Math.cos(player.yaw) * Math.cos(player.pitch)
    );
    camera.lookAt(camera.position.clone().add(dir));

    // --- Спавн врагов ---
    spawnTimer--;
    if (spawnTimer <= 0) {
        spawnEnemy();
        spawnTimer = Math.max(30, SPAWN_DELAY - Math.floor(score));
    }

    // --- Враги идут к игроку ---
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        const dirToPlayer = new THREE.Vector3().subVectors(player.position, e.position);
        dirToPlayer.y = 0;
        const dist = dirToPlayer.length();
        dirToPlayer.normalize();

        e.position.addScaledVector(dirToPlayer, 0.035);

        // Покачивание
        e.rotation.y += 0.05;
        e.position.y = 0.75 + Math.sin(Date.now() * 0.005 + i) * 0.1;

        // Дошёл до игрока
        if (dist < 1.5) {
            scene.remove(e);
            enemies.splice(i, 1);
            player.health -= 15;
            document.getElementById('health').textContent = '❤️ ' + player.health;
            if (player.health <= 0) gameOver();
        }
    }
}

function gameOver() {
    running = false;
    document.exitPointerLock();
    document.getElementById('gameover-screen').style.display = 'flex';
    document.getElementById('final-score').textContent = 'Очки: ' + score;
    cancelAnimationFrame(animationId);
}

function animate() {
    if (!running) return;
    animationId = requestAnimationFrame(animate);
    update();
    renderer.render(scene, camera);
}

// ===== Ресайз =====
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ===== Старт =====
document.getElementById('start-btn').addEventListener('click', () => {
    if (!running) {
        running = true;
        animate();
    }
});
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
