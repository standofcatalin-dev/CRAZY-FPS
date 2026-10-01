// ===== НАСТРОЙКИ ОРУЖИЯ =====
const WEAPON = {
    damage: 25,
    fireRate: 100,
    spread: 0.02,
    recoil: 0.015,
    recoilRecovery: 0.85,
    magSize: 30,
    reloadTime: 2500,
    zoomFov: 45,
    normalFov: 75
};

// ===== СЦЕНА =====
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 20, 80);

const camera = new THREE.PerspectiveCamera(WEAPON.normalFov, window.innerWidth / window.innerHeight, 0.1, 200);
camera.rotation.order = 'YXZ';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// ===== СВЕТ =====
scene.add(new THREE.AmbientLight(0xffffff, 0.7));

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
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshStandardMaterial({ color: 0x556655 })
);
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

// ===== ЯЩИКИ =====
const crateMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b });
for (let i = 0; i < 12; i++) {
    const size = 2 + Math.random() * 3;
    const crate = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), crateMat);
    crate.position.set((Math.random() - 0.5) * 80, size / 2, (Math.random() - 0.5) * 80);
    crate.castShadow = true;
    crate.receiveShadow = true;
    scene.add(crate);
}

// ===== МОДЕЛЬ AK-47 =====
const gunGroup = new THREE.Group();

// Материалы
const metalBlack = new THREE.MeshStandardMaterial({ color: 0x151515, metalness: 0.85, roughness: 0.35 });
const metalGray  = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.9,  roughness: 0.4 });
const metalLight = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.95, roughness: 0.25 });
const woodBrown  = new THREE.MeshStandardMaterial({ color: 0x7a3f17, roughness: 0.85 });
const woodDark   = new THREE.MeshStandardMaterial({ color: 0x4a2610, roughness: 0.9 });

// --- СТВОЛЬНАЯ КОРОБКА ---
const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.14, 0.42), metalBlack);
receiver.position.set(0, 0, -0.05);
gunGroup.add(receiver);

const topCover = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.03, 0.42), metalGray);
topCover.position.set(0, 0.085, -0.05);
gunGroup.add(topCover);

// --- СТВОЛ ---
const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.75, 16), metalGray);
barrel.rotation.x = Math.PI / 2;
barrel.position.set(0, 0.02, -0.63);
gunGroup.add(barrel);

// --- ГАЗОВАЯ ТРУБКА ---
const gasTube = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.4, 12), metalGray);
gasTube.rotation.x = Math.PI / 2;
gasTube.position.set(0, 0.075, -0.5);
gunGroup.add(gasTube);

// --- ГАЗОВАЯ КАМЕРА ---
const gasBlock = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.1, 0.09), metalBlack);
gasBlock.position.set(0, 0.04, -0.72);
gunGroup.add(gasBlock);

// --- ДУЛЬНЫЙ ТОРМОЗ ---
const muzzleBrake = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.09, 12), metalBlack);
muzzleBrake.rotation.x = Math.PI / 2;
muzzleBrake.position.set(0, 0.02, -1.03);
gunGroup.add(muzzleBrake);

// --- ДЕРЕВЯННОЕ ЦЕВЬЁ ---
const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.11, 0.32), woodBrown);
handguard.position.set(0, -0.015, -0.4);
gunGroup.add(handguard);

const upperHandguard = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.055, 0.28), woodBrown);
upperHandguard.position.set(0, 0.12, -0.42);
gunGroup.add(upperHandguard);

// --- МАГАЗИН ---
const magGroup = new THREE.Group();
const magTop = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 0.13), metalBlack);
magTop.position.y = -0.06;
magGroup.add(magTop);

const magBottom = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.22, 0.12), metalBlack);
magBottom.position.set(0, -0.22, 0.055);
magBottom.rotation.x = -0.35;
magGroup.add(magBottom);

magGroup.position.set(0, -0.13, -0.08);
gunGroup.add(magGroup);

// --- РУКОЯТКА ---
const grip = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.22, 0.09), woodDark);
grip.position.set(0, -0.19, 0.12);
grip.rotation.x = 0.28;
gunGroup.add(grip);

// Спусковая скоба
const triggerGuard = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.008, 6, 12, Math.PI), metalGray);
triggerGuard.rotation.z = Math.PI;
triggerGuard.rotation.x = Math.PI / 2;
triggerGuard.position.set(0, -0.1, 0.12);
gunGroup.add(triggerGuard);

// Курок
const hammer = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.07, 0.02), metalGray);
hammer.position.set(0, -0.09, 0.22);
hammer.rotation.x = 0.3;
gunGroup.add(hammer);

// --- ПРИКЛАД ---
const stock = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.11, 0.3), woodBrown);
stock.position.set(0, -0.03, 0.36);
stock.rotation.x = -0.06;
gunGroup.add(stock);

const buttPlate = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.13, 0.03), metalBlack);
buttPlate.position.set(0, -0.03, 0.52);
buttPlate.rotation.x = -0.06;
gunGroup.add(buttPlate);

// --- МУШКА ---
const frontSightBase = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.04), metalBlack);
frontSightBase.position.set(0, 0.1, -0.85);
gunGroup.add(frontSightBase);

const frontSightPin = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.06, 0.008), metalGray);
frontSightPin.position.set(0, 0.15, -0.85);
gunGroup.add(frontSightPin);

// --- ЦЕЛИК ---
const rearSight = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.025, 0.05), metalBlack);
rearSight.position.set(0, 0.11, -0.18);
gunGroup.add(rearSight);

const rearSightNotch = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.03, 0.012), metalGray);
rearSightNotch.position.set(0, 0.13, -0.18);
gunGroup.add(rearSightNotch);

// --- РУКОЯТКА ЗАТВОРА ---
const chargingHandle = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.015, 0.02), metalGray);
chargingHandle.position.set(0.07, 0.06, -0.1);
gunGroup.add(chargingHandle);

// --- ВСПЫШКА ---
const muzzleFlash = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffcc33, transparent: true, opacity: 0.95 })
);
muzzleFlash.position.set(0, 0.02, -1.1);
muzzleFlash.visible = false;
gunGroup.add(muzzleFlash);

const muzzleLight = new THREE.PointLight(0xffaa00, 0, 6);
muzzleLight.position.set(0, 0.02, -1.1);
gunGroup.add(muzzleLight);

// --- ПОЗИЦИЯ В РУКАХ ---
gunGroup.position.set(0.28, -0.24, -0.55);
gunGroup.rotation.set(0, 0.12, 0.02);

camera.add(gunGroup);
scene.add(camera);

const gunBasePos = gunGroup.position.clone();
const gunBaseRot = gunGroup.rotation.clone();

// ===== ИГРОК =====
const player = {
    position: new THREE.Vector3(0, 1.7, 0),
    yaw: 0,
    pitch: 0,
    speed: 0.12,
    health: 100
};

// ===== СОСТОЯНИЕ ОРУЖИЯ =====
const weapon = {
    ammo: WEAPON.magSize,
    reloading: false,
    shooting: false,
    lastShot: 0,
    recoilAmount: 0,
    isZooming: false
};

// ===== POINTER LOCK =====
const canvas = renderer.domElement;
let isLocked = false;
let running = false;

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
    const sens = weapon.isZooming ? 0.001 : 0.002;
    player.yaw -= e.movementX * sens;
    player.pitch -= e.movementY * sens;
    player.pitch = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, player.pitch));
});

// ===== КЛАВИАТУРА =====
const keys = {};
window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'KeyR') startReload();
});
window.addEventListener('keyup', e => keys[e.code] = false);

// ===== СТРЕЛЬБА =====
const raycaster = new THREE.Raycaster();
const enemies = [];
let score = 0;

document.addEventListener('mousedown', (e) => {
    if (!isLocked) return;
    if (e.button === 0) weapon.shooting = true;
    if (e.button === 2) startZoom();
});

document.addEventListener('mouseup', (e) => {
    if (e.button === 0) weapon.shooting = false;
    if (e.button === 2) stopZoom();
});

document.addEventListener('contextmenu', e => e.preventDefault());

function startZoom() {
    if (weapon.reloading) return;
    weapon.isZooming = true;
    gunGroup.position.set(0, -0.16, -0.45);
    gunGroup.rotation.set(0, 0, 0);
}

function stopZoom() {
    weapon.isZooming = false;
    gunGroup.position.copy(gunBasePos);
    gunGroup.rotation.copy(gunBaseRot);
}

function startReload() {
    if (weapon.reloading || weapon.ammo === WEAPON.magSize) return;
    weapon.reloading = true;

    const startY = gunGroup.position.y;
    const startRotX = gunGroup.rotation.x;
    const t0 = performance.now();

    function anim() {
        const t = Math.min(1, (performance.now() - t0) / (WEAPON.reloadTime / 2));
        gunGroup.position.y = startY - t * 0.3;
        gunGroup.rotation.x = startRotX + t * 0.6;
        if (t < 1) requestAnimationFrame(anim);
        else {
            weapon.ammo = WEAPON.magSize;
            updateAmmoUI();
            const t1 = performance.now();
            function animBack() {
                const t2 = Math.min(1, (performance.now() - t1) / (WEAPON.reloadTime / 2));
                gunGroup.position.y = (startY - 0.3) + t2 * 0.3;
                gunGroup.rotation.x = (startRotX + 0.6) - t2 * 0.6;
                if (t2 < 1) requestAnimationFrame(animBack);
                else {
                    gunGroup.position.copy(gunBasePos);
                    gunGroup.rotation.copy(gunBaseRot);
                    weapon.reloading = false;
                }
            }
            animBack();
        }
    }
    anim();
}

function tryShoot() {
    const now = performance.now();
    if (weapon.reloading) return;
    if (now - weapon.lastShot < WEAPON.fireRate) return;
    if (weapon.ammo <= 0) {
        startReload();
        return;
    }

    weapon.lastShot = now;
    weapon.ammo--;
    updateAmmoUI();

    muzzleFlash.visible = true;
    muzzleLight.intensity = 3;
    setTimeout(() => {
        muzzleFlash.visible = false;
        muzzleLight.intensity = 0;
    }, 40);

    weapon.recoilAmount += WEAPON.recoil;
    gunGroup.position.z = gunBasePos.z + 0.08;
    setTimeout(() => {
        gunGroup.position.z = gunBasePos.z;
    }, 40);

    const spreadX = (Math.random() - 0.5) * WEAPON.spread;
    const spreadY = (Math.random() - 0.5) * WEAPON.spread;
    raycaster.setFromCamera({ x: spreadX, y: spreadY }, camera);

    const hits = raycaster.intersectObjects(enemies, false);
    if (hits.length > 0) {
        const enemy = hits[0].object;
        enemy.userData.hp = (enemy.userData.hp || 100) - WEAPON.damage;
        if (enemy.userData.hp <= 0) {
            scene.remove(enemy);
            enemies.splice(enemies.indexOf(enemy), 1);
            score++;
            document.getElementById('score').textContent = 'Очки: ' + score;
        } else {
            enemy.material.color.setHex(0xffffff);
            setTimeout(() => enemy.material.color.setHex(0xe74c3c), 50);
        }
    }
}

function updateAmmoUI() {
    let el = document.getElementById('ammo');
    if (!el) {
        el = document.createElement('div');
        el.id = 'ammo';
        el.style.cssText = 'position:fixed;bottom:30px;right:40px;font-size:36px;font-weight:bold;color:#fff;text-shadow:2px 2px 4px #000;z-index:10;letter-spacing:2px;';
        document.body.appendChild(el);
    }
    el.textContent = weapon.ammo + ' / ' + WEAPON.magSize;
    el.style.color = weapon.ammo === 0 ? '#f00' : '#fff';
}

// ===== ВРАГИ =====
const enemyGeo = new THREE.BoxGeometry(1.5, 1.5, 1.5);

function spawnEnemy() {
    const angle = Math.random() * Math.PI * 2;
    const dist = 30 + Math.random() * 15;
    const x = player.position.x + Math.cos(angle) * dist;
    const z = player.position.z + Math.sin(angle) * dist;
    if (Math.abs(x) > 48 || Math.abs(z) > 48) return;

    const mat = new THREE.MeshStandardMaterial({ color: 0xe74c3c });
    const enemy = new THREE.Mesh(enemyGeo, mat);
    enemy.position.set(x, 0.75, z);
    enemy.castShadow = true;
    enemy.userData.hp = 100;
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
let animationId;
let bobTime = 0;

function update() {
    if (weapon.shooting) tryShoot();

    const forward = new THREE.Vector3(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
    const right = new THREE.Vector3(Math.cos(player.yaw), 0, -Math.sin(player.yaw));

    const move = new THREE.Vector3();
    if (keys['KeyW']) move.add(forward);
    if (keys['KeyS']) move.sub(forward);
    if (keys['KeyD']) move.add(right);
    if (keys['KeyA']) move.sub(right);

    const isMoving = move.lengthSq() > 0;
    if (isMoving) {
        move.normalize().multiplyScalar(player.speed);
        player.position.add(move);
        clampPosition(player.position);
    }

    if (isMoving) {
        bobTime += 0.15;
    } else {
        bobTime += 0.03;
    }
    if (!weapon.isZooming) {
        const bobY = Math.sin(bobTime) * (isMoving ? 0.015 : 0.004);
        const bobX = Math.cos(bobTime * 0.5) * (isMoving ? 0.012 : 0.003);
        gunGroup.position.y = gunBasePos.y + bobY;
        gunGroup.position.x = gunBasePos.x + bobX;
    }

    player.pitch += weapon.recoilAmount;
    weapon.recoilAmount *= WEAPON.recoilRecovery;

    camera.position.copy(player.position);
    camera.rotation.y = player.yaw;
    camera.rotation.x = player.pitch;

    spawnTimer--;
    if (spawnTimer <= 0) {
        spawnEnemy();
        spawnTimer = Math.max(30, SPAWN_DELAY - Math.floor(score));
    }

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

updateAmmoUI();
