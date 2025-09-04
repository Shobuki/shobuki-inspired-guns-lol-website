"use client";

import React, { useLayoutEffect, useEffect, useRef, useState } from "react";
import * as THREE from "three";

type KeyMap = Record<string, boolean>;
type Zombie = { id: number; group: THREE.Group; hp: number; speed: number };
type Obstacle = { mesh: THREE.Mesh; pos: THREE.Vector3; hx: number; hz: number };

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

const SETTINGS = {
  playerHeight: 1.7,
  playerRadius: 0.38,
  baseMoveSpeed: 5.2,
  sprintMultiplier: 1.45,
  mouseSensitivity: 0.0023,
  fireRate: 7.5,
  damage: 40,
  maxHealth: 100,
  zombieBaseHP: 100,
  zombieBaseSpeed: 1.5,
  waveSpawnBase: 5,
  waveSpawnInc: 3,
  spawnRadius: 28,
  minSpawnDistance: 10,
  attackDistance: 1.2,
  attackDamagePerSecond: 16,
  mapHalfSize: 60,
  fogColor: 0x0a0a0a,
  magCap: 30,
  reloadTime: 1.7,
  obstacleCount: 24,
  obstacleMinSize: 1.2,
  obstacleMaxSize: 3.6,
  infiniteReserve: true, // ⬅️ 30/unlimited (true = reserve tidak habis)
} as const;

const isTouchDevice = () =>
  typeof window !== "undefined" &&
  ("ontouchstart" in window || navigator.maxTouchPoints > 0);

export default function ZombieFPS() {
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // UI state
  const [ready, setReady] = useState(false);
  const [locked, setLocked] = useState(false);
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [health, setHealth] = useState<number>(SETTINGS.maxHealth);
  const [wave, setWave] = useState(1);
  const [kills, setKills] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // Ammo state (mag + reserve unlimited)
  const [ammoMag, setAmmoMag] = useState<number>(SETTINGS.magCap);
  const [reloading, setReloading] = useState(false);

  // Refs (runtime)
  const lockedRef = useRef(false);
  const pausedRef = useRef(false);
  const healthRef = useRef<number>(SETTINGS.maxHealth);
  const waveRef = useRef(1);
  const gameOverRef = useRef(false);
  const ammoMagRef = useRef<number>(SETTINGS.magCap);
  const reloadingRef = useRef(false);
  const reloadEndRef = useRef(0);

  // Drag/Touch look fallback
  const dragActiveRef = useRef(false);
  const lastXYRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Mobile inputs
  const moveVecRef = useRef({ x: 0, y: 0 }); // -1..1
  const sprintRef = useRef(false);
  const touchLookActiveRef = useRef(false);
  // Touch gesture start position for simple look
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Audio
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const ensureAudio = () => {
    if (!audioCtxRef.current) {
      const CtxCtor = typeof AudioContext !== "undefined" ? AudioContext : window.webkitAudioContext;
      if (!CtxCtor) return;
      const ctx: AudioContext = new CtxCtor();
      const gain = ctx.createGain();
      gain.gain.value = 0.25;
      gain.connect(ctx.destination);
      audioCtxRef.current = ctx;
      masterGainRef.current = gain;
    } else if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume().catch(() => { });
    }
  };
  const playClickEmpty = () => {
    const ctx = audioCtxRef.current; if (!ctx) return;
    const g = ctx.createGain(); g.gain.value = 0.4; g.connect(masterGainRef.current!);
    const o = ctx.createOscillator(); o.type = "square"; o.frequency.value = 120; o.connect(g);
    const t = ctx.currentTime; g.gain.setValueAtTime(0.4, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.06); o.start(t); o.stop(t + 0.07);
  };
  const playShot = () => {
    const ctx = audioCtxRef.current; if (!ctx) return;
    const t = ctx.currentTime;
    const sine = ctx.createOscillator(); sine.type = "triangle"; sine.frequency.setValueAtTime(800, t);
    sine.frequency.exponentialRampToValueAtTime(220, t + 0.08);
    const g1 = ctx.createGain(); g1.gain.setValueAtTime(0.6, t);
    g1.gain.exponentialRampToValueAtTime(0.001, t + 0.1); sine.connect(g1).connect(masterGainRef.current!);
    const buffer = ctx.createBuffer(1, 4410, 44100), data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const noise = ctx.createBufferSource(); noise.buffer = buffer;
    const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 1200;
    const g2 = ctx.createGain(); g2.gain.setValueAtTime(0.6, t);
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    noise.connect(hp).connect(g2).connect(masterGainRef.current!);
    sine.start(t); sine.stop(t + 0.1); noise.start(t); noise.stop(t + 0.12);
  };
  const playReload = () => {
    const ctx = audioCtxRef.current; if (!ctx) return; const t = ctx.currentTime;
    const ping = (freq: number, dt: number) => {
      const o = ctx.createOscillator(); o.type = "square"; o.frequency.value = freq;
      const g = ctx.createGain(); g.gain.value = 0.25; const end = t + dt + 0.05;
      g.gain.setValueAtTime(0.25, t + dt); g.gain.exponentialRampToValueAtTime(0.001, end);
      o.connect(g).connect(masterGainRef.current!); o.start(t + dt); o.stop(end);
    };
    ping(220, 0.0); ping(440, 0.25);
  };

  useLayoutEffect(() => {
    const host = wrapRef.current; if (!host) return;

    let disposed = false;

    // THREE core
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(SETTINGS.fogColor, 18, 80);

    const camera = new THREE.PerspectiveCamera(75, host.clientWidth / host.clientHeight, 0.1, 200);
    camera.position.set(0, SETTINGS.playerHeight, 0);

    // Lights
    const hemi = new THREE.HemisphereLight(0xffffff, 0x202020, 0.8); scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff, 0.35); dir.position.set(10, 18, 6); scene.add(dir);

    // Ground & arena
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(400, 400),
      new THREE.MeshStandardMaterial({ color: 0x0f0f12, metalness: 0.1, roughness: 0.95 })
    );
    ground.rotation.x = -Math.PI / 2; ground.position.y = 0; scene.add(ground);
    const grid = new THREE.GridHelper(200, 100, 0x222, 0x222);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.15; scene.add(grid);
    const wallMat = new THREE.MeshBasicMaterial({ color: 0x111114 });
    const wallGeo = new THREE.BoxGeometry(SETTINGS.mapHalfSize * 2, 5, 0.5);
    const wallZ1 = new THREE.Mesh(wallGeo, wallMat); wallZ1.position.set(0, 2.5, -SETTINGS.mapHalfSize);
    const wallZ2 = wallZ1.clone(); wallZ2.position.z = SETTINGS.mapHalfSize;
    const wallXGeo = new THREE.BoxGeometry(0.5, 5, SETTINGS.mapHalfSize * 2);
    const wallX1 = new THREE.Mesh(wallXGeo, wallMat); wallX1.position.set(-SETTINGS.mapHalfSize, 2.5, 0);
    const wallX2 = wallX1.clone(); wallX2.position.x = SETTINGS.mapHalfSize;
    scene.add(wallZ1, wallZ2, wallX1, wallX2);

    // Obstacles
    const obstacles: Obstacle[] = [];
    const obsMat = new THREE.MeshStandardMaterial({ color: 0x15151a, metalness: 0.2, roughness: 0.9 });
    const rnd = (a: number, b: number) => a + Math.random() * (b - a);
    for (let i = 0; i < SETTINGS.obstacleCount; i++) {
      const sx = rnd(SETTINGS.obstacleMinSize, SETTINGS.obstacleMaxSize);
      const sz = rnd(SETTINGS.obstacleMinSize, SETTINGS.obstacleMaxSize);
      const hx = sx / 2, hz = sz / 2;
      let x = rnd(-SETTINGS.mapHalfSize + 4, SETTINGS.mapHalfSize - 4);
      let z = rnd(-SETTINGS.mapHalfSize + 4, SETTINGS.mapHalfSize - 4);
      if (Math.hypot(x, z) < 8) { x += 9 * Math.sign(x || 1); z += 9 * Math.sign(z || 1); }
      const h = rnd(0.8, 2.2);
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, h, sz), obsMat);
      mesh.position.set(x, h / 2, z);
      scene.add(mesh);
      obstacles.push({ mesh, pos: new THREE.Vector3(x, 0, z), hx, hz });
    }

    // Crosshair
    const crosshair = document.createElement("div");
    crosshair.style.cssText =
      "position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:12px;height:12px;pointer-events:none;user-select:none;z-index:2;";
    crosshair.innerHTML =
      '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 1v2M6 9v2M1 6h2M9 6h2" stroke="white" stroke-width="1.4" stroke-linecap="round" opacity="0.8"/></svg>';
    host.appendChild(crosshair);

    // Player state
    const keys: KeyMap = {};
    let yaw = 0, pitch = 0;
    const playerPos = new THREE.Vector3(0, SETTINGS.playerHeight, 0);
    let lastShotTime = 0;

    // Muzzle line
    const shotMat = new THREE.LineBasicMaterial({ color: 0xffffff });
    const shotGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -1)]);
    const shotLine = new THREE.Line(shotGeo, shotMat); shotLine.visible = false;
    camera.add(shotLine); scene.add(camera);

    // Zombies
    let zombieId = 1; const zombies: Zombie[] = [];
    const makeZombie = (position: THREE.Vector3, hp: number, speed: number) => {
      const group = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 0.9, 6, 12),
        new THREE.MeshStandardMaterial({ color: 0x6f9a6f, roughness: 1 }));
      body.position.set(0, 1.1, 0); group.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0x91b591 }));
      head.position.set(0, 1.8, 0); group.add(head);
      // silly eyes
      const eyeCanvas = (() => {
        const c = document.createElement("canvas"); c.width = 64; c.height = 32;
        const ctx = c.getContext("2d")!; ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, 64, 32);
        ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(20, 16, 6, 0, Math.PI * 2); ctx.arc(44, 16, 6, 0, Math.PI * 2); ctx.fill(); return c;
      })();
      const eyeTex = new THREE.CanvasTexture(eyeCanvas);
      const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: eyeTex })); spr.scale.set(0.35, 0.35, 1);
      spr.position.set(0, 1.8, 0.29); group.add(spr);
      group.position.copy(position); scene.add(group);
      return { id: zombieId++, group, hp, speed } as Zombie;
    };
    const randOnRing = (rMin: number, rMax: number) => {
      const a = Math.random() * Math.PI * 2; const r = rMin + Math.random() * (rMax - rMin);
      return new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r);
    };
    const spawnWave = (waveNum: number) => {
      const count = SETTINGS.waveSpawnBase + SETTINGS.waveSpawnInc * (waveNum - 1);
      for (let i = 0; i < count; i++) {
        const posXZ = randOnRing(Math.max(SETTINGS.minSpawnDistance, SETTINGS.spawnRadius - 6), SETTINGS.spawnRadius);
        const pos = new THREE.Vector3(posXZ.x, 0, posXZ.z);
        const hp = SETTINGS.zombieBaseHP + Math.floor((waveNum - 1) * 10);
        const speed = SETTINGS.zombieBaseSpeed + (waveNum - 1) * 0.08;
        const z = makeZombie(pos, hp, speed); zombies.push(z);
      }
    };
    spawnWave(1);

    // Raycaster
    const raycaster = new THREE.Raycaster();
    type RaycasterWithCamera = THREE.Raycaster & { camera?: THREE.Camera };
    (raycaster as RaycasterWithCamera).camera = camera;

    // Resize
    const onResize = () => {
      const w = host.clientWidth, h = host.clientHeight;
      renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    // Pointer lock + pause/resume logic
    const canvas = renderer.domElement as HTMLCanvasElement;
    canvas.tabIndex = 0; canvas.style.outline = "none"; canvas.oncontextmenu = e => e.preventDefault();

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      touchStartRef.current = { x: t.clientX, y: t.clientY };
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current) return;
      const t = e.touches[0];
      const dx = t.clientX - touchStartRef.current.x;
      const dy = t.clientY - touchStartRef.current.y;
      yaw -= dx * 0.005; // geser kiri/kanan
      pitch -= dy * 0.005; // geser atas/bawah
      pitch = Math.max(-Math.PI / 2 + 0.02, Math.min(Math.PI / 2 - 0.02, pitch)); // clamp
      touchStartRef.current = { x: t.clientX, y: t.clientY };
    };

    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });

    const setPaused = (v: boolean) => { pausedRef.current = v; };
    const onPointerLockChange = () => {
      const isLocked = document.pointerLockElement === canvas;
      setLocked(isLocked);
      lockedRef.current = isLocked;
      if (isLocked) {
        setPaused(false);   // balik main
        canvas.focus();
      } else if (!gameOverRef.current) {
        setPaused(true);    // pause game
      }
    };
    document.addEventListener("pointerlockchange", onPointerLockChange);
    document.addEventListener("pointerlockerror", () => { lockedRef.current = false; setLocked(false); setPaused(true); });

    // Auto-pause kalau tab disembunyikan
    const onVisibility = () => {
      if (document.hidden) setPaused(true);
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Input (keyboard)
    const onKeyDown = (e: KeyboardEvent) => {
      keys[e.code] = true;
      if (e.code === "Space") e.preventDefault();
      if (e.code === "KeyR") startReload();
      if (e.code === "Escape") {
        // biarkan browser melepas lock -> pointerlockchange akan set paused
      }
    };
    const onKeyUp = (e: KeyboardEvent) => { keys[e.code] = false; };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    // Mouse / Pointer look
    const onPointerMove = (e: PointerEvent) => {
      // Touch-look handled separately
      if (isTouchDevice()) return;

      if (lockedRef.current) {
        yaw -= e.movementX * SETTINGS.mouseSensitivity;
        pitch -= e.movementY * SETTINGS.mouseSensitivity;
      } else if (dragActiveRef.current) {
        const dx = e.clientX - lastXYRef.current.x;
        const dy = e.clientY - lastXYRef.current.y;
        lastXYRef.current = { x: e.clientX, y: e.clientY };
        yaw -= dx * SETTINGS.mouseSensitivity;
        pitch -= dy * SETTINGS.mouseSensitivity;
      } else return;

      pitch = Math.max(-Math.PI / 2 + 0.02, Math.min(Math.PI / 2 - 0.02, pitch));
    };
    window.addEventListener("pointermove", onPointerMove);

    // Click to (re)lock OR shoot
    const tryPointerLock = () => {
      if (isTouchDevice()) return;
      try { canvas.requestPointerLock(); } catch { }
    };
    const onMouseDown = (e: MouseEvent) => {
      if (!started) setStarted(true);
      ensureAudio();
      if (!lockedRef.current) {
        tryPointerLock();
      } else {
        if (e.button === 0) tryShoot(performance.now());
      }
    };
    canvas.addEventListener("mousedown", onMouseDown);

    // Touch controls (mobile)
    // Left half: virtual joystick; Right half: look
    const touchState = {
      leftId: -1, rightId: -1,
      leftStart: { x: 0, y: 0 }, rightStart: { x: 0, y: 0 },
    };
    const handleTouchStart = (e: TouchEvent) => {
      if (!started) setStarted(true);
      ensureAudio();
      for (const t of Array.from(e.changedTouches)) {
        const rect = canvas.getBoundingClientRect();
        const x = t.clientX - rect.left, y = t.clientY - rect.top;
        if (x < rect.width * 0.45 && touchState.leftId === -1) {
          touchState.leftId = t.identifier; touchState.leftStart = { x, y };
          moveVecRef.current = { x: 0, y: 0 };
        } else if (touchState.rightId === -1) {
          touchState.rightId = t.identifier; touchState.rightStart = { x, y };
          touchLookActiveRef.current = true;
        }
      }
      setPaused(false); // mobile: start unpaused
    };
    const handleTouchMove = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        const rect = canvas.getBoundingClientRect();
        const x = t.clientX - rect.left, y = t.clientY - rect.top;
        if (t.identifier === touchState.leftId) {
          const dx = x - touchState.leftStart.x;
          const dy = y - touchState.leftStart.y;
          const maxR = 60; // px deadzone radius
          const len = Math.hypot(dx, dy);
          const k = Math.min(1, len / maxR);
          const nx = (dx / (len || 1)) * k;
          const ny = (dy / (len || 1)) * k;
          // joystick: up = forward (negative y)
          moveVecRef.current = { x: nx, y: -ny };
        } else if (t.identifier === touchState.rightId) {
          const dx = x - touchState.rightStart.x;
          const dy = y - touchState.rightStart.y;
          yaw -= dx * 0.003;
          pitch -= dy * 0.003;
          pitch = Math.max(-Math.PI / 2 + 0.02, Math.min(Math.PI / 2 - 0.02, pitch));
          touchState.rightStart = { x, y };
        }
      }
    };
    const handleTouchEnd = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === touchState.leftId) {
          touchState.leftId = -1; moveVecRef.current = { x: 0, y: 0 };
        } else if (t.identifier === touchState.rightId) {
          touchState.rightId = -1; touchLookActiveRef.current = false;
        }
      }
    };
    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd);
    canvas.addEventListener("touchcancel", handleTouchEnd);

    // Reload helpers
    const canReload = () =>
      !reloadingRef.current && ammoMagRef.current < SETTINGS.magCap;
    const startReload = () => {
      if (!canReload()) return;
      reloadingRef.current = true; setReloading(true);
      reloadEndRef.current = performance.now() + SETTINGS.reloadTime * 1000;
      playReload();
    };
    const finishReloadIfDue = (nowMs: number) => {
      if (!reloadingRef.current) return;
      if (nowMs >= reloadEndRef.current) {
        const need = SETTINGS.magCap - ammoMagRef.current;
        // reserve unlimited → selalu bisa mengisi penuh
        const take = need;
        ammoMagRef.current += take; setAmmoMag(ammoMagRef.current);
        reloadingRef.current = false; setReloading(false);
      }
    };

    // Shooting
    const tryShoot = (now: number) => {
      if (pausedRef.current) return;
      if (!lockedRef.current && !isTouchDevice()) return; // desktop: hanya saat locked
      if (reloadingRef.current) return;
      if (ammoMagRef.current <= 0) { playClickEmpty(); return; }
      const fireDelay = 1000 / SETTINGS.fireRate;
      if (now - lastShotTime < fireDelay) return;
      lastShotTime = now;
      ammoMagRef.current -= 1; setAmmoMag(ammoMagRef.current);
      ensureAudio(); playShot();
      shotLine.visible = true; setTimeout(() => (shotLine.visible = false), 40);

      const dir = new THREE.Vector3(); camera.getWorldDirection(dir);
      raycaster.set(camera.getWorldPosition(new THREE.Vector3()), dir);
      scene.updateMatrixWorld(true);
      const hits = raycaster.intersectObjects(zombies.map(z => z.group), true);
      if (hits.length) {
        // find parent group
        let p: THREE.Object3D | null = hits[0].object; let grp: THREE.Group | undefined;
        while (p && !grp) { if (p.type === "Group") grp = p as THREE.Group; p = p.parent; }
        const z = zombies.find(zz => zz.group === grp);
        if (z) {
          z.hp -= SETTINGS.damage;
          const pushDir = new THREE.Vector3().subVectors(z.group.position, camera.position).normalize();
          z.group.position.addScaledVector(pushDir, 0.2);
          const blood = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6),
            new THREE.MeshBasicMaterial({ color: 0x9c1a1a }));
          blood.position.copy(hits[0].point); scene.add(blood);
          setTimeout(() => {
            scene.remove(blood);
            blood.geometry.dispose();
            const mat = blood.material as THREE.Material | THREE.Material[];
            if (Array.isArray(mat)) {
              mat.forEach((m) => m.dispose?.());
            } else {
              mat.dispose?.();
            }
          }, 120);
        }
      }
    };

    // Movement helpers
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    const clampToArena = (v: THREE.Vector3) => {
      v.x = THREE.MathUtils.clamp(v.x, -SETTINGS.mapHalfSize + 1, SETTINGS.mapHalfSize - 1);
      v.z = THREE.MathUtils.clamp(v.z, -SETTINGS.mapHalfSize + 1, SETTINGS.mapHalfSize - 1);
    };
    const resolvePlayerVsObstacles = (next: THREE.Vector3) => {
      for (const ob of obstacles) {
        const dx = next.x - ob.pos.x, dz = next.z - ob.pos.z;
        const ox = ob.hx + SETTINGS.playerRadius - Math.abs(dx);
        const oz = ob.hz + SETTINGS.playerRadius - Math.abs(dz);
        if (ox > 0 && oz > 0) {
          if (ox < oz) next.x += dx > 0 ? ox : -ox;
          else next.z += dz > 0 ? oz : -oz;
        }
      }
      clampToArena(next);
    };

    // Game loop
    let prev = performance.now();
    let spawnCooldown = 0;
    const animate = () => {
      if (disposed) return;
      const now = performance.now();
      const dt = Math.min((now - prev) / 1000, 0.05);
      prev = now;

      // Camera rot
      const quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, yaw, 0, "YXZ"));
      camera.quaternion.copy(quat);
      camera.position.copy(playerPos);

      // Update muzzle line
      (shotLine.geometry as THREE.BufferGeometry).setFromPoints([new THREE.Vector3(0, -0.02, 0), new THREE.Vector3(0, -0.02, -2.5)]);

      if (!pausedRef.current && !gameOverRef.current) {
        // Movement (keyboard OR mobile joystick)
        const running = sprintRef.current || keys["ShiftLeft"] || keys["ShiftRight"];
        let moveSpeed = SETTINGS.baseMoveSpeed * (running ? SETTINGS.sprintMultiplier : 1);
        forward.set(0, 0, -1).applyQuaternion(camera.quaternion).setY(0).normalize();
        right.copy(new THREE.Vector3().crossVectors(forward, up)).normalize();

        const mv = new THREE.Vector3();

        if (!isTouchDevice()) {
          if (keys["KeyW"]) mv.add(forward);
          if (keys["KeyS"]) mv.addScaledVector(forward, -1);
          if (keys["KeyA"]) mv.addScaledVector(right, -1);
          if (keys["KeyD"]) mv.add(right);
        } else {
          // joystick → moveVecRef: x (right), y (forward)
          mv.addScaledVector(forward, moveVecRef.current.y);
          mv.addScaledVector(right, moveVecRef.current.x);
        }

        if (mv.lengthSq() > 0) {
          mv.normalize().multiplyScalar(moveSpeed * dt);
          const next = playerPos.clone().add(mv);
          resolvePlayerVsObstacles(next);
          playerPos.copy(next);
        }

        // Zombies
        const playerXZ = new THREE.Vector3(playerPos.x, 0, playerPos.z);
        for (let i = zombies.length - 1; i >= 0; i--) {
          const z = zombies[i]; const pos = z.group.position;
          const dir = new THREE.Vector3().subVectors(playerXZ, new THREE.Vector3(pos.x, 0, pos.z));
          const dist = dir.length(); if (dist > 0.0001) dir.normalize();
          z.group.lookAt(playerPos.x, SETTINGS.playerHeight, playerPos.z);
          const step = Math.min(dist, z.speed * dt); pos.x += dir.x * step; pos.z += dir.z * step;

          if (dist < SETTINGS.attackDistance) {
            healthRef.current = Math.max(0, healthRef.current - SETTINGS.attackDamagePerSecond * dt);
            setHealth(healthRef.current);
          }

          if (z.hp <= 0) {
            z.group.position.y += 0.5 * dt; z.group.scale.multiplyScalar(1 - 3 * dt);
            if (z.group.scale.x < 0.1) {
              scene.remove(z.group); zombies.splice(i, 1); setKills(k => k + 1);
            }
          }
        }

        // Waves
        if (zombies.length === 0) {
          spawnCooldown -= dt;
          if (spawnCooldown <= 0) { const nxt = waveRef.current + 1; waveRef.current = nxt; setWave(nxt); spawnWave(nxt); spawnCooldown = 2.5; }
        } else spawnCooldown = 1.2;

        // Reload timing
        finishReloadIfDue(now);

        // Death
        if (healthRef.current <= 0) { gameOverRef.current = true; setGameOver(true); }
      }

      renderer.setClearColor(SETTINGS.fogColor, 1);
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    setReady(true);
    requestAnimationFrame(animate);

    // Cleanup
    return () => {
      disposed = true;
      try { host.removeChild(renderer.domElement); } catch { }
      window.removeEventListener("resize", onResize);
      document.removeEventListener("pointerlockchange", onPointerLockChange);
      document.removeEventListener("pointerlockerror", () => { });
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
      canvas.removeEventListener("touchcancel", handleTouchEnd);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      renderer.dispose();
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        const m = mesh.material as THREE.Material | THREE.Material[] | undefined;
        const g = (mesh as any).geometry as THREE.BufferGeometry | undefined;
        if (Array.isArray(m)) m.forEach((mm) => mm.dispose?.());
        else m?.dispose?.();
        g?.dispose?.();
      });
    };
  }, []);


  const startGame = () => {
    setStarted(true);
    ensureAudio();
    const el = wrapRef.current?.querySelector("canvas") as HTMLCanvasElement | null;
    if (!el) return;
    if (isTouchDevice()) {
      pausedRef.current = false;
      setPaused(false);
    } else {
      try {
        el.focus({ preventScroll: true });
        el.requestPointerLock();
      } catch { }
    }
  };

  const resumeGame = () => {
    pausedRef.current = false;
    setPaused(false);
    const el = wrapRef.current?.querySelector("canvas") as HTMLCanvasElement | null;
    if (!el) return;
    if (!isTouchDevice()) {
      try {
        el.focus({ preventScroll: true });
        el.requestPointerLock();   // ⬅️ WAJIB dipanggil lagi waktu resume
      } catch { }
    }
  };
  const pauseGame = () => { pausedRef.current = true; setPaused(true); };

  // keep refs in sync
  useEffect(() => { lockedRef.current = locked; }, [locked]);
  useEffect(() => { ammoMagRef.current = ammoMag; }, [ammoMag]);
  useEffect(() => { reloadingRef.current = reloading; }, [reloading]);
  useEffect(() => { healthRef.current = health; }, [health]);

  // Mobile buttons handlers
  const fire = () => tryFireNow();
  const tryFireNow = () => {
    // trigger shoot in "mobile mode" by faking time
    const now = performance.now();
    // little hack: find the tryShoot in closure via event; we expose via ref:
    // Simpler: dispatch a custom event the loop listens? Easier: bind on window:
    window.dispatchEvent(new CustomEvent("zfps-shoot", { detail: { now } }));
  };
  const reload = () => {
    window.dispatchEvent(new CustomEvent("zfps-reload"));
  };
  const runToggle = (v: boolean) => { sprintRef.current = v; };

  // Bridge for mobile buttons to internal closures
  useEffect(() => {
    const shootListener: EventListener = () => {
      // no-op here; just to prevent error if none registered
    };
    window.addEventListener("zfps-shoot", shootListener);
    return () => { window.removeEventListener("zfps-shoot", shootListener); };
  }, []);

  // Register handlers into the running effect (once DOM/scene exists)
  useEffect(() => {
    // We re-register simple proxies after mount; the real shoot/reload are inside layoutEffect closure,
    // but to keep code contained we also add minimal proxies there via window (below).
    return;
  }, []);

  // Minimal HUD (including mobile controls)
  return (
    <div className="relative w-full h-[640px] md:h-[720px] select-none rounded-2xl overflow-hidden bg-black/80 ring-1 ring-white/10">
      <div ref={wrapRef} className="relative z-0 w-full h-full" />

      {/* HUD */}
      <div className="absolute inset-0 text-white font-mono z-[100]">
        {/* Stats */}
        <div className="pointer-events-none absolute top-3 left-3 text-xs sm:text-sm bg-black/40 px-3 py-2 rounded-md backdrop-blur">
          <div>Wave: <b>{wave}</b></div>
          <div>Kills: <b>{kills}</b></div>
        </div>

        {/* Health bar */}
        <div className="pointer-events-none absolute top-3 right-3 w-40 sm:w-56 bg-white/10 rounded-md h-3 overflow-hidden">
          <div className="h-full bg-green-500" style={{ width: `${Math.max(0, Math.min(100, (health / SETTINGS.maxHealth) * 100))}%` }} />
        </div>

        {/* Ammo */}
        <div className="pointer-events-none absolute bottom-3 right-3 text-sm bg-black/40 px-3 py-2 rounded-md backdrop-blur">
          <div>
            Ammo: <b>{ammoMag}</b>/{SETTINGS.infiniteReserve ? <b>∞</b> : <b>—</b>}
            {reloading ? <span className="ml-2 text-yellow-300">(reloading)</span> : null}
          </div>
          {!reloading && ammoMag < SETTINGS.magCap && (
            <div className="text-[11px] text-white/70">Press R / tap Reload</div>
          )}
        </div>

        {/* Pause / Resume helpers */}
        {started && paused && !gameOver && (
          <div className="pointer-events-auto absolute inset-0 grid place-items-center">
            <div className="text-center max-w-sm p-6 rounded-xl bg-black/70 ring-1 ring-white/10">
              <h3 className="text-lg font-semibold mb-2">Paused</h3>
              <p className="text-white/80 text-sm mb-3">
                {isTouchDevice() ? "Tap Resume to continue." : "Click Resume to re-enter pointer lock."}
              </p>
              <button
                onClick={resumeGame}   // ⬅️ ganti ke resumeGame
                className="inline-flex items-center px-4 py-2 rounded-lg bg-white/90 text-black font-semibold hover:bg-white"
              >
                Resume
              </button>
            </div>
          </div>
        )}

        {!started && (
          <div className="pointer-events-auto absolute inset-0 grid place-items-center">
            <div className="text-center max-w-sm p-6 rounded-xl bg-black/70 ring-1 ring-white/10">
              <h3 className="text-lg font-semibold mb-2">Zombie FPS</h3>
              <p className="text-white/80 text-sm mb-3">
                <span className="block">WASD + Shift · Click to shoot</span>
                <span className="block">ESC = Pause</span>
                <span className="block mt-1">Ammo: 30/mag · Reserve ∞</span>
              </p>
              <button onClick={startGame} className="inline-flex items-center px-4 py-2 rounded-lg bg-white/90 text-black font-semibold hover:bg-white">
                Start
              </button>
            </div>
          </div>
        )}

        {/* Game Over */}
        {ready && gameOver && (
          <div className="pointer-events-auto absolute inset-0 grid place-items-center">
            <div className="text-center max-w-sm p-6 rounded-xl bg-black/70 ring-1 ring-white/10">
              <h3 className="text-lg font-semibold mb-2">You Died</h3>
              <p className="text-white/80 text-sm mb-4">Kills: {kills} · Wave: {wave}</p>
              <button onClick={() => location.reload()} className="inline-flex items-center px-4 py-2 rounded-lg bg-white/90 text-black font-semibold hover:bg-white">
                Restart
              </button>
            </div>
          </div>
        )}

        {/* Mobile controls */}
        {isTouchDevice() && started && !gameOver && (
          <>
            {/* Left joystick visual (simple circle) */}
            <div className="absolute left-3 bottom-3 w-28 h-28 rounded-full border border-white/30 bg-white/5 pointer-events-none" />
            {/* Right action buttons */}
            <div className="absolute right-3 bottom-3 flex flex-col gap-2">
              <button
                onTouchStart={() => runToggle(true)}
                onTouchEnd={() => runToggle(false)}
                className="px-4 py-2 rounded-lg bg-white/20 backdrop-blur border border-white/30"
              >
                Run
              </button>
              <button
                onTouchStart={fire}
                className="px-4 py-2 rounded-lg bg-white/80 text-black font-semibold"
              >
                Fire
              </button>
              <button
                onTouchStart={reload}
                className="px-4 py-2 rounded-lg bg-white/20 backdrop-blur border border-white/30"
              >
                Reload
              </button>
              <button
                onClick={pauseGame}
                className="px-4 py-2 rounded-lg bg-white/10 border border-white/30"
              >
                Pause
              </button>
            </div>
          </>
        )}
        {paused && !gameOver && (
          <div className="absolute inset-0 grid place-items-center bg-black/70 text-white z-[200]">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-3">Paused</h3>
              <button
                onClick={startGame}
                className="px-4 py-2 rounded-lg bg-white/10 border border-white/30"
              >
                Resume
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
