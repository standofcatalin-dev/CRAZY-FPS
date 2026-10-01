// ===== СЦЕНА =====
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 20, 80);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// ===== СВЕТ =====
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

// ===== ПОЛ =====
const floorGeo = new THREE.PlaneGeometry(200, 200);
const floorMat = new THREE.MeshStandardMaterial({ color: 0x556655 });
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

const grid = new THREE.GridHelper(200, 100, 0x333333, 0x444444);
grid.position.y = 0.01;
scene.add(grid);

// ===== СТЕНЫ =====
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

// ===== ЯЩИКИ-УКРЫТИЯ =====
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

// ===== ИГРОК =====
const player = {
    position: new THREE.Vector3(0, 1.7, 0),
    yaw: 0,
    pitch: 0,
    speed: 0.12,
    health: 100
};

// ===== POINTER LOCK =====
const canvas = renderer.domElement;
let isLocked = false;

document.addEventListener('pointerlockchange', () => {
    isLocked = document.pointerLockElement === canvas;
    document.getElementById('start-screen').style.display = isLocked ? 'none' : 'flex';
    if (isLocked && !running) {
        running = true;
        animate();
    }
});

document.addEventListener('mousemove', (e) => {
    if (!isLocked) return;
    player.yaw -= e.movementX * 0.002;
    player.pitch -= e.movementY * 0.002;
    player.pitch = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, player.pitch));
});

// ===== КЛАВИАТУРА =====
const keys = {};
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

// ===== СТРЕЛЬБА =====
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

// ===== ВРАГИ =====
const enemyGeo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
const enemyMat = new THREE.MeshStandardMaterial({ color: 0xe74c3c });

function spawnEnemy() {
    const angle = Math.random() * Math.PI * 2;
    const dist = 30 + Math.random() * 15;
    const x = player.position.x + Math.cos(angle) * dist;
    const z = player.position.z + Math.sin(angle) * dist;
    if (Math.abs(x) > 48 || Math.abs(z) > 48) return;
    const enemy = new THREE.Mesh(enemyGeo, enemyMat.clone());
    enemy.position.set(x, 0.75, z);
    enemy.castShadow = true;
    scene.add(enemy);
    enemies.push(enemy);
}

let spawnTimer = 0;
const SPAWN_DELAY = 90;

// ===== ГРАНИЦЫ =====
function clampPosition(pos) {
    pos.x = Math.max(-48, Math.min(48, pos.x));
    pos.z = Math.max(-48, Math.min(48, pos.z));
}

// ===== ИГРОВОЙ ЦИКЛ =====
let running = false;
let animationId;

function update() {
    // Движение
    const forward = new THREE.Vector3(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
    const right = new THREE.Vector3(Math.cos(player.yaw), 0, -Math.sin(player.yaw));

    const move = new THREE.Vector3();
    if (keys['KeyW']) move.add(forward);
    if (keys['KeyS']) move.sub(forward);
    if (keys['KeyD']) move.add(right);
    if (keys['KeyA']) move.sub(right);

    if (move.lengthSq() > 0) {
        move.normalize().multiplyScalar(player.speed);
        player.position.add(move);
        clampPosition(player.position);
    }

    // Камера
    camera.position.copy(player.position);
    const dir = new THREE.Vector3(
        -Math.sin(player.yaw) * Math.cos(player.pitch),
        Math.sin(player.pitch),
        -Math.cos(player.yaw) * Math.cos(player.pitch)
    );
    camera.lookAt(camera.position.clone().add(dir));

    // Спавн врагов
    spawnTimer--;
    if (spawnTimer <= 0) {
        spawnEnemy();
        spawnTimer = Math.max(30, SPAWN_DELAY - Math.floor(score));
    }

    // Враги идут к игроку
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        const dirToPlayer = new THREE.Vector3().subVectors(player.position, e.position);
        dirToPlayer.y = 0;
        const dist = dirToPlayer.length();
        dirToPlayer.normalize();
        e.position.addScaledVector(dirToPlayer, 0.035);
        e.rotation.y += 0.05;
        e.position.y = 0.75 + Math.sin(Date.now() * 0.005 + i) * 0.1;

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

// ===== РЕСАЙЗ =====
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ===== КНОПКИ =====
document.getElementById('start-btn').addEventListener('click', () => {
    canvas.requestPointerLock();
});

document.getElementById('restart-btn').addEventListener('click', () => {
    location.reload();
});
