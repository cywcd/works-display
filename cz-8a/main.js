import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const STAGES = [
  { name: '塔架待命',  meta: '海南商业航天发射场 · 待命倒计时', dur: 11.4,  ts: 'T-00:05',
    text: '长征八号甲遥九火箭·海南商业航天发射场·待命倒计时。' },
  { name: '点火起飞',  meta: '4台YF-100液氧煤油发动机 · 起飞推力480吨', dur: 14.2,  ts: 'T+00:00',
    text: '点火！芯一级+助推器4台YF-100液氧煤油发动机工作，起飞推力480吨，火箭缓慢离开发射塔。' },
  { name: '助推器分离', meta: 'T+174秒 · 2台YF-100关机脱离', dur: 8.4,  ts: 'T+02:54',
    text: 'T+174秒，助推器分离。2台助推器完成使命，带尾迹坠落。' },
  { name: '一级分离',  meta: 'T+184秒 · 芯二级YF-75DA氢氧发动机点火', dur: 9.9,  ts: 'T+03:04',
    text: 'T+184秒，一二级分离。芯二级YF-75DA氢氧发动机点火，蓝色氢氧火焰比冲更高。' },
  { name: '抛整流罩',  meta: 'T+215秒 · 5.2米整流罩对半分离', dur: 9.8,  ts: 'T+03:35',
    text: 'T+215秒，抛整流罩。两片壳体旋转飞离，20颗千帆平板卫星堆叠组暴露于太空。' },
  { name: '二级滑行',  meta: 'T+479秒 · 无动力滑行段', dur: 8.5,  ts: 'T+07:59',
    text: 'T+479秒，二级一次关机，进入无动力滑行段。火箭在惯性作用下继续飞行，地球弧面可见。' },
  { name: '二次点火',  meta: 'T+885秒 · 目标轨道1100公里', dur: 11.7,  ts: 'T+14:45',
    text: 'T+885秒，二级二次点火。改进型YF-75DB发动机工作，推送卫星至1100公里极地轨道。' },
  { name: '星箭分离',  meta: 'T+1056秒 · 一箭20星 · 在轨238颗', dur: 17.1,  ts: 'T+17:36',
    text: 'T+1056秒，星箭分离！20颗平板卫星如打水漂般依次有序抛撒，帆板展开。千帆极轨15组全部入轨，在轨总数达238颗。' }
];
const TOTAL_DUR = STAGES.reduce((s, v) => s + v.dur, 0);

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();

function makeSkyTexture() {
  const c = document.createElement('canvas'); c.width = 16; c.height = 512;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0.0,  '#01030a');
  g.addColorStop(0.4,  '#040a18');
  g.addColorStop(0.7,  '#081428');
  g.addColorStop(1.0,  '#0e223f');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 16, 512);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
const sky = new THREE.Mesh(
  new THREE.SphereGeometry(8000, 32, 32),
  new THREE.MeshBasicMaterial({ map: makeSkyTexture(), side: THREE.BackSide, depthWrite: false, fog: false })
);
scene.add(sky);
scene.fog = new THREE.FogExp2(0x040810, 0.00085);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 20000);
camera.position.set(55, 32, 75);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.target.set(0, 34, 0);
controls.minDistance = 8;
controls.maxDistance = 4000;

const insetCamera = new THREE.PerspectiveCamera(38, 380/460, 0.1, 6000);
const insetTarget = new THREE.Vector3(0, 28, 0);
const insetPos = new THREE.Vector3(12, 32, 20);
let insetW = 380, insetH = 460;
let insetScale = 1;

const INSET_PRESETS = [
  { fov: 34, title: '火箭待命 · CZ-8A', bodyLen: 56, focusFrac: 0.55 },
  { fov: 38, title: 'YF-100 点火 · 尾焰特写', bodyLen: 56, focusFrac: 0.5 },
  { fov: 36, title: '助推器分离', bodyLen: 56, focusFrac: 0.55 },
  { fov: 36, title: '一二级分离 · YF-75DA 点火', bodyLen: 42, focusFrac: 0.55 },
  { fov: 34, title: '抛整流罩', bodyLen: 24, focusFrac: 0.6 },
  { fov: 40, title: '二级滑行 · 地球弧面', bodyLen: 22, focusFrac: 0.5 },
  { fov: 36, title: 'YF-75DB 二次点火', bodyLen: 22, focusFrac: 0.5 },
  { fov: 42, title: '星箭分离 · 帆板展开', bodyLen: 20, focusFrac: 0.45 }
];

const hemi = new THREE.HemisphereLight(0x8aa8d0, 0x141c2c, 0.7);
scene.add(hemi);
const ambient = new THREE.AmbientLight(0x334466, 0.35);
scene.add(ambient);
const sun = new THREE.DirectionalLight(0xfff0d8, 1.4);
sun.position.set(-80, 140, 90);
scene.add(sun);
const fill = new THREE.DirectionalLight(0x5577aa, 0.5);
fill.position.set(100, 60, -80);
scene.add(fill);
const rim = new THREE.DirectionalLight(0x4a78c0, 0.6);
rim.position.set(0, 40, -120);
scene.add(rim);
const keyFront = new THREE.DirectionalLight(0xffffff, 0.9);
keyFront.position.set(60, 50, 100);
scene.add(keyFront);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.55, 0.45, 0.3
);
composer.addPass(bloom);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  updateInsetSize();
});

function updateInsetSize() {
  insetScale = Math.min(window.devicePixelRatio, 2);
  insetCamera.aspect = 380/460;
  insetCamera.updateProjectionMatrix();
}

function makeMat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color, metalness: opts.metalness ?? 0.65, roughness: opts.roughness ?? 0.45,
    emissive: opts.emissive ?? 0x000000, emissiveIntensity: opts.emissiveIntensity ?? 0,
    transparent: opts.transparent ?? false, opacity: opts.opacity ?? 1
  });
}
function cylinder(rTop, rBot, h, seg = 32) {
  return new THREE.CylinderGeometry(rTop, rBot, h, seg);
}

/* ========================================================================
 * 火箭贴图工具（国旗 / 中国航天 logo / CZ-8A 字样）
 * ====================================================================== */
function finalizeTexture(cnv) {
  const tex = new THREE.CanvasTexture(cnv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  tex.needsUpdate = true;
  return tex;
}

function makeCascVertTexture() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 1024;
  const ctx = c.getContext('2d');
  ctx.clearRect(0,0,512,1024);
  ctx.fillStyle = '#0a2d7a';
  ctx.beginPath(); ctx.arc(256, 150, 105, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(256, 60); ctx.lineTo(322, 210); ctx.lineTo(256, 180); ctx.lineTo(190, 210);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#0a2d7a';
  ctx.beginPath(); ctx.arc(256, 158, 36, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#0a2d7a';
  ctx.font = 'bold 150px "Microsoft YaHei", "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('中', 256, 340);
  ctx.fillText('国', 256, 490);
  ctx.fillText('航', 256, 640);
  ctx.fillText('天', 256, 790);
  return finalizeTexture(c);
}
const _cascVertTex = makeCascVertTexture();

function makeFlagTexture() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 320;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#de2910'; ctx.fillRect(0, 0, 512, 320);
  ctx.fillStyle = '#ffde00';
  function star(cx, cy, r, rot) {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = rot + i * Math.PI*2/5 - Math.PI/2;
      const x = cx + Math.cos(a)*r;
      const y = cy + Math.sin(a)*r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      const a2 = a + Math.PI/5;
      ctx.lineTo(cx + Math.cos(a2)*r*0.4, cy + Math.sin(a2)*r*0.4);
    }
    ctx.closePath(); ctx.fill();
  }
  star(90, 90, 52, 0);
  [[170,50,18,-0.2],[210,90,18,0.15],[210,150,18,0.4],[170,185,18,0.7]].forEach(([x,y,r,t])=>star(x,y,r,t));
  return finalizeTexture(c);
}

function makeCascTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 768;
  const ctx = c.getContext('2d');
  ctx.clearRect(0,0,256,768);
  ctx.fillStyle = '#0a2d7a';
  ctx.beginPath();
  ctx.arc(128, 130, 70, 0, Math.PI*2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(128, 70); ctx.lineTo(165, 165); ctx.lineTo(128, 145); ctx.lineTo(91, 165);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#0a2d7a';
  ctx.beginPath(); ctx.arc(128, 128, 24, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 62px "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('中国航天', 128, 320);
  ctx.font = 'bold 30px "Arial", sans-serif';
  ctx.fillText('CASC', 128, 370);
  ctx.fillStyle = '#0a2d7a';
  ctx.font = 'bold 26px "Arial", sans-serif';
  ctx.fillText('LONG MARCH', 128, 430);
  return finalizeTexture(c);
}

function makeCZ8ATexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 1024;
  const ctx = c.getContext('2d');
  ctx.clearRect(0,0,256,1024);
  ctx.fillStyle = '#0a1d4a';
  ctx.font = 'bold 150px "Arial Black", Arial, sans-serif';
  ctx.textAlign = 'center';
  const chars = ['C','Z','-','8','A'];
  let y = 150;
  chars.forEach(ch => { ctx.fillText(ch, 128, y); y += 165; });
  return finalizeTexture(c);
}

const _flagTex = makeFlagTexture();
const _cascTex = makeCascTexture();
const _czTex = makeCZ8ATexture();

function makeCurvedDecal(radius, height, arcWidth, texture) {
  const geo = new THREE.CylinderGeometry(
    radius + 0.03, radius + 0.03, height, 40, 1, true,
    -arcWidth/2, arcWidth
  );
  const mat = new THREE.MeshStandardMaterial({
    map: texture, transparent: true, alphaTest: 0.05,
    side: THREE.DoubleSide, roughness: 0.55, metalness: 0.2,
    depthWrite: false
  });
  return new THREE.Mesh(geo, mat);
}

function makeFlagPlane(w, h) {
  const geo = new THREE.PlaneGeometry(w, h);
  const mat = new THREE.MeshStandardMaterial({
    map: _flagTex, transparent: true, side: THREE.DoubleSide,
    roughness: 0.6, metalness: 0.1
  });
  return new THREE.Mesh(geo, mat);
}

/* ---- 星空 ---- */
function buildStarfield() {
  const count = 7000;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const sz = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const r = 4000 + Math.random() * 4500;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    pos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
    pos[i*3+1] = Math.abs(r * Math.cos(phi)) * (Math.random() > 0.5 ? 1 : 0.3);
    pos[i*3+2] = r * Math.sin(phi) * Math.sin(theta);
    const t = Math.random();
    const c = new THREE.Color().setHSL(0.58 + t*0.12, 0.5, 0.6 + Math.random()*0.4);
    col[i*3] = c.r; col[i*3+1] = c.g; col[i*3+2] = c.b;
    sz[i] = Math.random() * 2.5 + 0.5;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(sz, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `
      attribute float aSize; varying vec3 vColor;
      uniform float uTime;
      void main() {
        vColor = color;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        float tw = 0.6 + 0.4 * sin(uTime*2.0 + position.x*0.01 + position.y*0.01);
        gl_PointSize = aSize * tw * (300.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying vec3 vColor;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float d = length(c);
        float a = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(vColor, a);
      }`,
    vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
  });
  const points = new THREE.Points(geo, mat);
  points.userData.mat = mat;
  return points;
}
const stars = buildStarfield();
scene.add(stars);

/* ---- 地球：曲面大地 + 大气层辉光 ---- */
const EARTH_R = 1200;
const earthGroup = new THREE.Group();
scene.add(earthGroup);

const earthGeo = new THREE.SphereGeometry(EARTH_R, 96, 64);
const earthCanvas = (() => {
  const c = document.createElement('canvas'); c.width = 2048; c.height = 1024;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 1024);
  g.addColorStop(0, '#0a1d4a'); g.addColorStop(0.5, '#0f3a6e'); g.addColorStop(1, '#071733');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 2048, 1024);
  for (let i = 0; i < 600; i++) {
    const x = Math.random()*2048, y = 300 + Math.random()*500;
    const r = 20 + Math.random()*90;
    ctx.fillStyle = `rgba(${20+Math.random()*40},${70+Math.random()*50},${110+Math.random()*60},${0.08+Math.random()*0.12})`;
    ctx.beginPath(); ctx.ellipse(x, y, r, r*0.6, Math.random()*Math.PI, 0, Math.PI*2); ctx.fill();
  }
  for (let i = 0; i < 200; i++) {
    ctx.fillStyle = `rgba(180,220,255,${0.3+Math.random()*0.5})`;
    ctx.beginPath(); ctx.arc(Math.random()*2048, 250+Math.random()*550, 1+Math.random()*2, 0, Math.PI*2); ctx.fill();
  }
  return c;
})();
const earthTex = new THREE.CanvasTexture(earthCanvas);
earthTex.colorSpace = THREE.SRGBColorSpace;
const earthMat = new THREE.MeshStandardMaterial({
  map: earthTex, roughness: 0.85, metalness: 0.0, emissive: 0x041028, emissiveIntensity: 0.6
});
const earth = new THREE.Mesh(earthGeo, earthMat);
earth.position.y = -EARTH_R;
earthGroup.add(earth);

const atmoMat = new THREE.ShaderMaterial({
  uniforms: { uColor: { value: new THREE.Color(0x4a9bff) } },
  vertexShader: `
    varying vec3 vNormal; varying vec3 vView;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vView = normalize(-mv.xyz);
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: `
    uniform vec3 uColor; varying vec3 vNormal; varying vec3 vView;
    void main() {
      float f = pow(1.0 - abs(dot(vNormal, vView)), 3.0);
      gl_FragColor = vec4(uColor, f * 0.9);
    }`,
  side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
});
const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(EARTH_R * 1.035, 64, 48), atmoMat);
atmosphere.position.y = -EARTH_R;
earthGroup.add(atmosphere);

/* ---- 近地地面 + 发射坪 ---- */
const launchSite = new THREE.Group();
scene.add(launchSite);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x1a2433, roughness: 0.95, metalness: 0.1 });
const ground = new THREE.Mesh(new THREE.CircleGeometry(600, 96), groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.05;
launchSite.add(ground);

const padMat = makeMat(0x133d80, { metalness: 0.55, roughness: 0.55 });
const pad = new THREE.Mesh(new THREE.BoxGeometry(30, 5, 22), padMat);
pad.position.y = 2.5;
launchSite.add(pad);
const padTop = new THREE.Mesh(new THREE.BoxGeometry(31, 0.8, 23), makeMat(0x1a4a90, { metalness: 0.6, roughness: 0.4 }));
padTop.position.y = 5.4; launchSite.add(padTop);
const padRailF = new THREE.Mesh(new THREE.BoxGeometry(31, 1.4, 0.3), makeMat(0x1e5fb8, { metalness: 0.7, roughness: 0.35 }));
padRailF.position.set(0, 6.3, -11.5); launchSite.add(padRailF);
const padRailB = padRailF.clone(); padRailB.position.set(0, 6.3, 11.5); launchSite.add(padRailB);

function makeFrontTexture() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0,0,0,512);
  g.addColorStop(0,'#2360b0'); g.addColorStop(1,'#143f85');
  ctx.fillStyle = g; ctx.fillRect(0,0,1024,512);
  ctx.fillStyle = '#d83028'; ctx.fillRect(0,0,1024,72);
  ctx.fillStyle = '#ffd84d';
  ctx.font = 'bold 46px "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('国  庆  快  乐', 512, 54);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(512,120); ctx.lineTo(472,235); ctx.lineTo(500,235);
  ctx.lineTo(500,290); ctx.lineTo(524,290); ctx.lineTo(524,235); ctx.lineTo(552,235);
  ctx.closePath(); ctx.fill();
  ctx.fillRect(488,185,12,65); ctx.fillRect(524,185,12,65);
  ctx.font = 'bold 56px Arial, sans-serif';
  ctx.fillText('HICAL', 512, 360);
  ctx.font = 'bold 68px "Microsoft YaHei", sans-serif';
  ctx.fillText('海 南 商 发', 512, 452);
  return finalizeTexture(c);
}
const frontPanel = new THREE.Mesh(
  new THREE.PlaneGeometry(30, 5),
  new THREE.MeshStandardMaterial({ map: makeFrontTexture(), roughness: 0.6, metalness: 0.2 })
);
frontPanel.position.set(0, 2.5, 11.01);
launchSite.add(frontPanel);

const trench = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 1.2, 32),
  new THREE.MeshStandardMaterial({ color: 0x0a0e16, roughness: 0.9 }));
trench.position.y = 6.0;
launchSite.add(trench);

for (let i=-2;i<=2;i++) {
  const pipe = new THREE.Mesh(cylinder(0.4,0.4,22,12), makeMat(0x2a3548,{metalness:0.8,roughness:0.4}));
  pipe.rotation.x = Math.PI/2; pipe.position.set(i*4, 0.3, 0); launchSite.add(pipe);
}

const oceanMat = new THREE.MeshStandardMaterial({
  color: 0x0a2440, roughness: 0.3, metalness: 0.6, transparent: true, opacity: 0.85
});
const ocean = new THREE.Mesh(new THREE.RingGeometry(60, 600, 96, 1, 0, Math.PI*2), oceanMat);
ocean.rotation.x = -Math.PI/2; ocean.position.y = -0.1;
launchSite.add(ocean);

/* ---- 发射塔架 ---- */
function makeBaseTexture() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0,0,0,512);
  g.addColorStop(0,'#1f57a8'); g.addColorStop(1,'#133d80');
  ctx.fillStyle = g; ctx.fillRect(0,0,1024,512);
  ctx.fillStyle = '#d83028'; ctx.fillRect(0,0,1024,70);
  ctx.fillStyle = '#ffd84d';
  ctx.font = 'bold 46px "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('国  庆  快  乐', 512, 54);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(512,120); ctx.lineTo(470,230); ctx.lineTo(500,230);
  ctx.lineTo(500,280); ctx.lineTo(524,280); ctx.lineTo(524,230); ctx.lineTo(554,230);
  ctx.closePath(); ctx.fill();
  ctx.fillRect(488,180,12,60); ctx.fillRect(524,180,12,60);
  ctx.font = 'bold 56px Arial, sans-serif';
  ctx.fillText('HICAL', 512, 350);
  ctx.font = 'bold 64px "Microsoft YaHei", sans-serif';
  ctx.fillText('海 南 商 发', 512, 440);
  return finalizeTexture(c);
}
const _baseTex = makeBaseTexture();

function buildTower() {
  const g = new THREE.Group();
  const blue = makeMat(0x1e5fb8, { metalness: 0.75, roughness: 0.35 });
  const blueDark = makeMat(0x144a96, { metalness: 0.75, roughness: 0.4 });
  const orange = makeMat(0xe8701e, { metalness: 0.55, roughness: 0.45, emissive: 0x4a1e00, emissiveIntensity: 0.25 });
  const steel = makeMat(0x9aa6b5, { metalness: 0.85, roughness: 0.3 });
  const deckMat = makeMat(0x2c3a4e, { metalness: 0.7, roughness: 0.5 });
  const red = makeMat(0xc0392b, { metalness: 0.4, roughness: 0.5, emissive: 0x4a1010, emissiveIntensity: 0.5 });

  const tw = 13, th = 72;
  const corners = [[-tw/2,-tw/2],[tw/2,-tw/2],[tw/2,tw/2],[-tw/2,tw/2]];

  corners.forEach(([x,z]) => {
    const leg = new THREE.Mesh(cylinder(0.6,0.6,th,12), blue);
    leg.position.set(x, th/2, z); g.add(leg);
  });
  corners.forEach(([x,z]) => {
    const leg2 = new THREE.Mesh(cylinder(0.35,0.35,th,10), blueDark);
    leg2.position.set(x*0.5, th/2, z*0.5); g.add(leg2);
  });

  for (let y = 5; y < th; y += 4.2) {
    corners.forEach(([x,z], i) => {
      const [nx,nz] = corners[(i+1)%4];
      const hLen = Math.hypot(nx-x, nz-z);
      const h1 = new THREE.Mesh(new THREE.BoxGeometry(hLen, 0.5, 0.5), blue);
      h1.position.set((x+nx)/2, y, (z+nz)/2);
      h1.rotation.y = Math.atan2(nz-z, nx-x);
      g.add(h1);
    });
    const deck = new THREE.Mesh(new THREE.BoxGeometry(tw,0.35,tw), deckMat);
    deck.position.set(0, y-0.2, 0); g.add(deck);
    const rail1 = new THREE.Mesh(new THREE.BoxGeometry(tw,0.2,0.15), steel);
    rail1.position.set(0,y+1.2,-tw/2); g.add(rail1);
    const rail2 = rail1.clone(); rail2.position.set(0,y+1.2,tw/2); g.add(rail2);
    const rail3 = new THREE.Mesh(new THREE.BoxGeometry(0.15,0.2,tw), steel);
    rail3.position.set(-tw/2,y+1.2,0); g.add(rail3);
    const rail4 = rail3.clone(); rail4.position.set(tw/2,y+1.2,0); g.add(rail4);
  }

  for (let i = 0; i < corners.length; i++) {
    const [x1,z1] = corners[i];
    const [x2,z2] = corners[(i+1)%4];
    for (let y = 0; y < th-4; y += 4.2) {
      const diag = new THREE.Mesh(new THREE.BoxGeometry(7,0.22,0.22), blueDark);
      diag.position.set((x1+x2)/2, y+2.1, (z1+z2)/2);
      diag.rotation.y = Math.atan2(z2-z1, x2-x1);
      diag.rotation.z = (i%2 ? -1 : 1) * 0.55;
      g.add(diag);
    }
  }

  const armLen = 18;
  for (let y = 16; y < th-4; y += 8) {
    const arm = new THREE.Group();
    const pivot = new THREE.Mesh(new THREE.BoxGeometry(1.6,2.6,1.6), orange);
    arm.add(pivot);
    const beam = new THREE.Mesh(new THREE.BoxGeometry(1.2,0.9,armLen), orange);
    beam.position.set(0, 0, armLen/2); arm.add(beam);
    for (let s = 0; s < 7; s++) {
      const cab = new THREE.Mesh(new THREE.BoxGeometry(0.8,0.6,0.8), orange);
      cab.position.set((s%2 ? 0.9 : -0.9), -1.6, 2 + s*1.4); arm.add(cab);
    }
    const hose = new THREE.Mesh(cylinder(0.18,0.18,armLen-1,8), steel);
    hose.rotation.x = Math.PI/2; hose.position.set(1.1, -0.6, armLen/2); arm.add(hose);
    const plate = new THREE.Mesh(new THREE.BoxGeometry(3.5,0.4,3), steel);
    plate.position.set(0, -2, armLen-0.5); arm.add(plate);
    arm.position.set(0, y, tw/2);
    g.add(arm);
  }
  for (let y = 20; y < th-4; y += 12) {
    [-4, 4].forEach(x => {
      const arm = new THREE.Group();
      const beam = new THREE.Mesh(new THREE.BoxGeometry(1,0.7,armLen), orange);
      beam.position.set(0, 0, armLen/2); arm.add(beam);
      const plate = new THREE.Mesh(new THREE.BoxGeometry(2.5,0.3,2), steel);
      plate.position.set(0, -1.8, armLen-0.5); arm.add(plate);
      arm.position.set(x, y, tw/2);
      g.add(arm);
    });
  }

  const gantryW = tw + 14, gantryD = tw + 20;
  const gantryDeck = new THREE.Mesh(
    new THREE.BoxGeometry(gantryW, 0.8, gantryD), deckMat);
  gantryDeck.position.set(0, 0.4, 0); g.add(gantryDeck);
  [-gantryW/2, gantryW/2].forEach(x => {
    const girder = new THREE.Mesh(new THREE.BoxGeometry(0.9,1.4,gantryD), blue);
    girder.position.set(x, 1.1, 0); g.add(girder);
  });
  [-gantryD/2, gantryD/2].forEach(z => {
    const girder = new THREE.Mesh(new THREE.BoxGeometry(gantryW,1.4,0.9), blue);
    girder.position.set(0, 1.1, z); g.add(girder);
  });
  for (let x=-gantryW/2; x<=gantryW/2; x+=3.5) {
    for (let z=-gantryD/2; z<=gantryD/2; z+=3.5) {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.7,3,0.7), blueDark);
      col.position.set(x, -1, z); g.add(col);
    }
  }
  const gRailF = new THREE.Mesh(new THREE.BoxGeometry(gantryW,1,0.2), steel);
  gRailF.position.set(0, 2.3, -gantryD/2); g.add(gRailF);
  const gRailB = gRailF.clone(); gRailB.position.set(0,2.3,gantryD/2); g.add(gRailB);
  const gRailL = new THREE.Mesh(new THREE.BoxGeometry(0.2,1,gantryD), steel);
  gRailL.position.set(-gantryW/2,2.3,0); g.add(gRailL);
  const gRailR = gRailL.clone(); gRailR.position.set(gantryW/2,2.3,0); g.add(gRailR);

  for (let i=-1;i<=1;i++) {
    const foot = new THREE.Mesh(new THREE.BoxGeometry(4,1.2,4), blueDark);
    foot.position.set(i*tw/2, -0.2, tw/2+2); g.add(foot);
    const foot2 = foot.clone(); foot2.position.set(i*tw/2, -0.2, -tw/2-2); g.add(foot2);
  }

  const craneBeam = new THREE.Mesh(new THREE.BoxGeometry(2.2,2.2,42), orange);
  craneBeam.position.set(0, th+6, 2); g.add(craneBeam);
  const craneTop = new THREE.Mesh(new THREE.BoxGeometry(3.5,1.6,3), orange);
  craneTop.position.set(-3, th+7.5, -18); g.add(craneTop);
  for (let z = -18; z <= 20; z += 2) {
    const truss = new THREE.Mesh(new THREE.BoxGeometry(0.2,1.6,0.2), steel);
    truss.position.set(0, th+4.4, z); g.add(truss);
  }
  const craneLeg1 = new THREE.Mesh(cylinder(0.7,0.7,8,10), blue);
  craneLeg1.position.set(-4, th+1, -8); g.add(craneLeg1);
  const craneLeg2 = craneLeg1.clone(); craneLeg2.position.set(4,th+1,-8); g.add(craneLeg2);

  for (let x = -tw/2; x <= tw/2; x += 2.5) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.3,th+4,0.3), blueDark);
    bar.position.set(x, (th+4)/2, -tw/2-0.5); g.add(bar);
  }

  const mast = new THREE.Mesh(cylinder(0.35,0.5,16,8), steel);
  mast.position.set(-tw/2-1, th+8, -tw/2-1); g.add(mast);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.8,12,12), red);
  beacon.position.set(-tw/2-1, th+16, -tw/2-1); g.add(beacon);
  g.userData.beacon = beacon;

  g.position.set(0, 0, -24);
  return g;
}
const tower = buildTower();
launchSite.add(tower);

const towerLight = new THREE.SpotLight(0xdfeaff, 45, 250, Math.PI/4.5, 0.45, 1.1);
towerLight.position.set(0, 70, -10);
towerLight.target.position.set(0, 30, 0);
scene.add(towerLight, towerLight.target);

const rocketKey = new THREE.SpotLight(0xffffff, 28, 150, Math.PI/5, 0.5, 1.2);
rocketKey.position.set(30, 55, 40);
rocketKey.target.position.set(0, 28, 0);
scene.add(rocketKey, rocketKey.target);

const siteLights = [];
for (let i = 0; i < 6; i++) {
  const ang = (i/6)*Math.PI*2;
  const pl = new THREE.PointLight(0xfff0d0, 1.2, 60, 2);
  pl.position.set(Math.cos(ang)*30, 8, Math.sin(ang)*30);
  scene.add(pl); siteLights.push(pl);
}

/* ========================================================================
 * 火箭模型 — 比例：1单位≈1米（芯级直径3.35m / 总高约50.5m）
 * ====================================================================== */
const rocket = new THREE.Group();
scene.add(rocket);

const bodyMat = makeMat(0xdfe5ee, { metalness: 0.5, roughness: 0.38, emissive: 0x0a0e16, emissiveIntensity: 0.0 });
const bodyMat2 = makeMat(0xc9d0dc, { metalness: 0.55, roughness: 0.42, emissive: 0x0a0e16, emissiveIntensity: 0.0 });
const redMat = makeMat(0xc8312a, { metalness: 0.4, roughness: 0.5, emissive: 0x3a0c08, emissiveIntensity: 0.2 });
const nozzleMat = makeMat(0x20252e, { metalness: 0.92, roughness: 0.28, emissive: 0x1a0a04, emissiveIntensity: 0.2 });
const fairMat = makeMat(0xe3e8f0, { metalness: 0.5, roughness: 0.35, emissive: 0x0a0e16, emissiveIntensity: 0.0 });

function makeNozzle(len, w) {
  const g = new THREE.Group();
  const bell = new THREE.Mesh(
    new THREE.CylinderGeometry(w*0.45, w, len, 24, 1, true), nozzleMat);
  bell.position.y = -len/2; g.add(bell);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(w*0.45,w*0.45,0.3,16), nozzleMat);
  cap.position.y = 0.1; g.add(cap);
  return g;
}

/* 助推器（直径2.25m） */
function makeBooster() {
  const g = new THREE.Group();
  const r = 1.125, h = 20;
  const body = new THREE.Mesh(cylinder(r, r, h, 28), bodyMat2);
  body.position.y = h/2; g.add(body);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(r, 3.2, 28), bodyMat2);
  nose.position.y = h + 1.6; g.add(nose);
  const skirt = new THREE.Mesh(cylinder(r*1.05, r*1.25, 1.6, 28), redMat);
  skirt.position.y = 0.8; g.add(skirt);
  const nozzle = makeNozzle(2.2, 0.9);
  nozzle.position.y = 0; g.add(nozzle);
  g.userData.nozzle = nozzle;
  g.userData.nozzleLocal = new THREE.Vector3(0, -2.2, 0);
  return g;
}
const boosters = [];
[-1, 1].forEach(side => {
  const b = makeBooster();
  b.position.set(side * 2.55, 9.1, 0);
  b.userData.home = new THREE.Vector3(side*2.55, 9.1, 0);
  rocket.add(b);
  boosters.push(b);
});

/* 芯一级（直径3.35m，高约25m，2台YF-100） */
const firstStage = new THREE.Group();
{
  const r = 1.675, h = 25;
  const body = new THREE.Mesh(cylinder(r, r, h, 40), bodyMat);
  body.position.y = h/2; firstStage.add(body);
  const band = new THREE.Mesh(cylinder(r+0.02, r+0.02, 1.2, 40), redMat);
  band.position.y = h - 1.5; firstStage.add(band);
  const skirt = new THREE.Mesh(cylinder(r*1.08, r*1.25, 2, 40), bodyMat2);
  skirt.position.y = 1; firstStage.add(skirt);
  [-0.75, 0.75].forEach(x => {
    const n = makeNozzle(2.6, 1.0);
    n.position.set(x, 0, 0); firstStage.add(n);
  });
  firstStage.userData.nozzleLocal = new THREE.Vector3(0, -2.6, 0);

  const czDecal = makeCurvedDecal(r, 16, 1.1, _czTex);
  czDecal.position.y = h * 0.55;
  firstStage.add(czDecal);

  const ribBand1 = new THREE.Mesh(cylinder(r+0.01, r+0.01, 0.4, 40), bodyMat2);
  ribBand1.position.y = 5; firstStage.add(ribBand1);
  const ribBand2 = new THREE.Mesh(cylinder(r+0.01, r+0.01, 0.4, 40), bodyMat2);
  ribBand2.position.y = 18; firstStage.add(ribBand2);
}
firstStage.position.y = 6.6;
rocket.add(firstStage);

/* 芯二级（直径3.35m，高约14m，2台YF-75DA，真空型小喷管） */
const secondStage = new THREE.Group();
{
  const r = 1.675, h = 14;
  const body = new THREE.Mesh(cylinder(r, r, h, 40), bodyMat);
  body.position.y = h/2; secondStage.add(body);
  const band = new THREE.Mesh(cylinder(r+0.02, r+0.02, 0.9, 40), redMat);
  band.position.y = h*0.55; secondStage.add(band);
  [-0.6, 0.6].forEach(x => {
    const n = makeNozzle(2.0, 0.75);
    n.position.set(x, 0, 0); secondStage.add(n);
  });
  secondStage.userData.nozzleLocal = new THREE.Vector3(0, -2.0, 0);

  const ribA = new THREE.Mesh(cylinder(r+0.01, r+0.01, 0.35, 40), bodyMat2);
  ribA.position.y = 3; secondStage.add(ribA);
  const ribB = new THREE.Mesh(cylinder(r+0.01, r+0.01, 0.35, 40), bodyMat2);
  ribB.position.y = 11; secondStage.add(ribB);
}
secondStage.position.y = 6.6 + 25 + 0.3;
rocket.add(secondStage);

/* 卫星堆叠组（20颗平板卫星，扁平长方体交错堆叠） */
const satStack = new THREE.Group();
satStack.position.y = secondStage.position.y + 14 + 2;
satStack.userData.localTopNozzle = new THREE.Vector3(0, 0, 0);
rocket.add(satStack);
const sats = [];
const satBodyMat = makeMat(0x232a38, { metalness: 0.5, roughness: 0.5, emissive: 0x051020, emissiveIntensity: 0.3 });
const panelMat = makeMat(0x1a3a6e, { metalness: 0.4, roughness: 0.3, emissive: 0x10306a, emissiveIntensity: 0.3 });
for (let i = 0; i < 20; i++) {
  const sat = new THREE.Group();
  const core = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.25, 0.9), satBodyMat);
  sat.add(core);
  const panelL = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.04, 0.8), panelMat);
  panelL.position.set(-1.45, 0, 0); panelL.userData.foldAxis = 'x'; panelL.userData.foldSign = -1;
  sat.add(panelL);
  const panelR = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.04, 0.8), panelMat);
  panelR.position.set(1.45, 0, 0); panelR.userData.foldAxis = 'x'; panelR.userData.foldSign = 1;
  sat.add(panelR);
  panelL.rotation.z = -Math.PI/2; panelR.rotation.z = Math.PI/2;
  sat.position.y = i * 0.38;
  sat.rotation.y = (i % 2) * 0.08;
  sat.userData.panels = [panelL, panelR];
  sat.userData.home = sat.position.clone();
  sat.userData.homeRot = sat.rotation.clone();
  satStack.add(sat);
  sats.push(sat);
}
const stackTop = 19 * 0.38 + 0.3;

/* 整流罩（5.2m直径，下部圆柱 + 上部圆锥，可纵向对半分离） */
const fairing = new THREE.Group();
{
  const r = 2.6, hCyl = 7.5, hCone = 5.5;
  const makeHalf = (sign) => {
    const halfG = new THREE.Group();
    const t0 = sign > 0 ? -Math.PI/2 : Math.PI/2;
    const len = Math.PI;
    const cyl = new THREE.Mesh(
      new THREE.CylinderGeometry(r, r, hCyl, 48, 1, true, t0, len),
      fairMat);
    cyl.position.y = -hCone/2;
    halfG.add(cyl);
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(r, hCone, 48, 1, true, t0, len),
      fairMat);
    cone.position.y = hCyl/2;
    halfG.add(cone);
    if (sign > 0) {
      const flag = makeFlagPlane(3.0, 1.85);
      flag.position.set(0, hCyl/2 - 0.4, r + 0.05);
      halfG.add(flag);
      const cascDecal = makeCurvedDecal(r, 6.8, 1.15, _cascVertTex);
      cascDecal.position.y = -hCone/2 - 0.2;
      halfG.add(cascDecal);
    }
    halfG.userData.home = new THREE.Vector3(0,0,0);
    return halfG;
  };
  const halfL = makeHalf(1);
  const halfR = makeHalf(-1);
  fairing.add(halfL); fairing.add(halfR);
  fairing.userData.halves = [halfL, halfR];
}
fairing.position.y = satStack.position.y - 0.5;
rocket.add(fairing);

rocket.position.y = 0;
const ROCKET_BASE_Y = 5.4;

/* 火焰光 */
const firstFlameLight = new THREE.PointLight(0xff7a20, 0, 60, 2);
firstFlameLight.position.set(0, 0, 0);
scene.add(firstFlameLight);
const secondFlameLight = new THREE.PointLight(0x88c8ff, 0, 80, 2);
scene.add(secondFlameLight);

/* ========================================================================
 * 通用 GPU 粒子池
 * ====================================================================== */
class ParticlePool {
  constructor(max, { color0, color1, size, additive = true, soft = true, depthWrite = false } = {}) {
    this.max = max; this.idx = 0; this.alive = 0;
    const geo = new THREE.BufferGeometry();
    this.pos = new Float32Array(max*3);
    this.col = new Float32Array(max*3);
    this.sz  = new Float32Array(max);
    this.vel = new Float32Array(max*3);
    this.life = new Float32Array(max);
    this.maxLife = new Float32Array(max);
    this.sz0 = new Float32Array(max);
    this.grav = new Float32Array(max);
    this.drag = new Float32Array(max);
    this.tgtR = new Float32Array(max);
    this.tgtG = new Float32Array(max);
    this.tgtB = new Float32Array(max);
    this.c0 = new THREE.Color(color0 ?? 0xffffff);
    this.c1 = new THREE.Color(color1 ?? 0x444444);
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(this.col, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(this.sz, 1));
    const cnv = document.createElement('canvas'); cnv.width = cnv.height = 128;
    const ctx = cnv.getContext('2d');
    const grd = ctx.createRadialGradient(64,64,0,64,64,64);
    grd.addColorStop(0,'rgba(255,255,255,1)');
    grd.addColorStop(0.35,'rgba(255,255,255,0.7)');
    grd.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle = grd; ctx.fillRect(0,0,128,128);
    const tex = new THREE.CanvasTexture(cnv);
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTex: { value: tex } },
      vertexShader: `
        attribute vec3 aColor; attribute float aSize;
        varying vec3 vColor;
        void main() {
          vColor = aColor;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * (300.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform sampler2D uTex; varying vec3 vColor;
        void main() {
          vec4 t = texture2D(uTex, gl_PointCoord);
          gl_FragColor = vec4(vColor, t.a);
        }`,
      transparent: true, depthWrite,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending
    });
    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
    scene.add(this.points);
  }
  emit(x,y,z, vx,vy,vz, life, size, grav=0, drag=0.0, col0, col1) {
    const i = this.idx; this.idx = (this.idx+1) % this.max;
    this.pos[i*3]=x; this.pos[i*3+1]=y; this.pos[i*3+2]=z;
    this.vel[i*3]=vx; this.vel[i*3+1]=vy; this.vel[i*3+2]=vz;
    this.life[i]=life; this.maxLife[i]=life; this.sz0[i]=size;
    this.grav[i]=grav; this.drag[i]=drag;
    const c0 = new THREE.Color(col0 ?? this.c0);
    const c1 = new THREE.Color(col1 ?? this.c1);
    this.col[i*3]=c0.r; this.col[i*3+1]=c0.g; this.col[i*3+2]=c0.b;
    this.tgtR[i]=c1.r; this.tgtG[i]=c1.g; this.tgtB[i]=c1.b;
    this.sz[i] = size;
    return i;
  }
  update(dt, color1Override) {
    const c1 = color1Override || this.c1;
    let alive = 0;
    for (let i=0;i<this.max;i++) {
      if (this.life[i] <= 0) { this.sz[i]=0; continue; }
      this.life[i] -= dt;
      if (this.life[i] <= 0) { this.sz[i]=0; continue; }
      alive++;
      const k = 1 - this.life[i]/this.maxLife[i];
      this.vel[i*3+1] -= this.grav[i]*dt;
      const d = 1 - this.drag[i]*dt;
      this.vel[i*3] *= d; this.vel[i*3+1] *= d; this.vel[i*3+2] *= d;
      this.pos[i*3]   += this.vel[i*3]*dt;
      this.pos[i*3+1] += this.vel[i*3+1]*dt;
      this.pos[i*3+2] += this.vel[i*3+2]*dt;
      const tr = color1Override ? c1.r : this.tgtR[i];
      const tg = color1Override ? c1.g : this.tgtG[i];
      const tb = color1Override ? c1.b : this.tgtB[i];
      this.col[i*3]   += (tr-this.col[i*3])*0.04;
      this.col[i*3+1] += (tg-this.col[i*3+1])*0.04;
      this.col[i*3+2] += (tb-this.col[i*3+2])*0.04;
      this.sz[i] = this.sz0[i] * (0.4 + k*1.4);
    }
    this.alive = alive;
    this.points.geometry.attributes.position.needsUpdate = true;
    this.points.geometry.attributes.aColor.needsUpdate = true;
    this.points.geometry.attributes.aSize.needsUpdate = true;
  }
  reset() {
    this.life.fill(0); this.sz.fill(0); this.idx = 0;
  }
}

/* 尾焰粒子（橙红液氧煤油） */
const flamePool = new ParticlePool(1800, { color0: 0xfff2c0, color1: 0x3a0a00, size: 3, additive: true });
/* 芯二级氢氧尾焰（淡蓝白） */
const flame2Pool = new ParticlePool(800, { color0: 0xdfeeff, color1: 0x10306a, size: 2.4, additive: true });
/* 蒸汽云/烟雾（非加法，白灰） */
const steamPool = new ParticlePool(1200, { color0: 0xffffff, color1: 0x353a45, size: 14, additive: false, depthWrite: false });
/* 飞行尾迹 */
const trailPool = new ParticlePool(900, { color0: 0xaad0ff, color1: 0x101828, size: 4, additive: true });
/* 分离闪光 + 碎片 */
const burstPool = new ParticlePool(700, { color0: 0xffffff, color1: 0xff6a20, size: 5, additive: true });
const debrisPool = new ParticlePool(400, { color0: 0xdddde0, color1: 0x222530, size: 1.6, additive: false, depthWrite: false });

/* 尾焰核心锥体 */
function makeFlameCone(color, innerColor) {
  const cnv = document.createElement('canvas'); cnv.width=64; cnv.height=256;
  const ctx = cnv.getContext('2d');
  const g = ctx.createLinearGradient(0,0,0,256);
  g.addColorStop(0,'rgba(255,255,255,1)');
  g.addColorStop(0.2, innerColor);
  g.addColorStop(0.7, color);
  g.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0,0,64,256);
  const tex = new THREE.CanvasTexture(cnv);
  const geo = new THREE.ConeGeometry(1, 1, 20, 1, true);
  geo.translate(0, -0.5, 0);
  const mat = new THREE.MeshBasicMaterial({
    map: tex, transparent: true, blending: THREE.AdditiveBlending,
    depthWrite: false, side: THREE.DoubleSide
  });
  return new THREE.Mesh(geo, mat);
}
const flameCones = [];
function attachFlameCones(parent, count, color, inner) {
  for (let i=0;i<count;i++) {
    const c = makeFlameCone(color, inner);
    c.visible = false;
    parent.add(c);
    flameCones.push(c);
  }
  return flameCones.slice(-count);
}
const core1Cones = attachFlameCones(firstStage, 2, '#ff5a18', '#ffd060');
core1Cones.forEach((c,i)=> c.position.set(i===0?-0.75:0.75, -2.6, 0));
const boosterCones = boosters.map(b => {
  const c = makeFlameCone('#ff5a18','#ffd060');
  c.visible = false; b.add(c); c.position.set(0,-2.2,0); return c;
});
const core2Cones = attachFlameCones(secondStage, 2, '#88c8ff','#ffffff');
core2Cones.forEach((c,i)=> c.position.set(i===0?-0.6:0.6, -2.0, 0));

/* ========================================================================
 * 状态机
 * ====================================================================== */
const state = {
  stage: 0,
  stageT: 0,
  globalT: 0,
  playing: false,
  thrust1: 0,
  thrust2: 0,
  alt: 0,
  rocketY: ROCKET_BASE_Y,
  tilt: 0,
  boostersGone: false,
  firstGone: false,
  fairingGone: false,
  satsDeployed: false,
  cameraShake: 0,
  boosterData: [null, null],
  firstData: null,
  fairingData: [null, null],
  satData: [],
  spin: 0
};

function getNozzleWorld(obj) {
  const local = obj.userData.nozzleLocal || new THREE.Vector3(0,-1,0);
  const v = local.clone();
  obj.localToWorld(v);
  return v;
}

function triggerFlash(intensity = 0.8) {
  const el = document.getElementById('flash');
  el.style.transition = 'none'; el.style.opacity = intensity;
  requestAnimationFrame(() => {
    el.style.transition = 'opacity 0.5s';
    el.style.opacity = 0;
  });
}

function emitBurst(pos, count, speed, color0, color1, pool = burstPool) {
  for (let i=0;i<count;i++) {
    const dir = new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).normalize();
    const sp = speed * (0.4 + Math.random()*0.8);
    pool.emit(pos.x,pos.y,pos.z, dir.x*sp,dir.y*sp,dir.z*sp,
      0.6+Math.random()*0.6, 2+Math.random()*3, 0, 1.5, color0, color1);
  }
}
function emitDebris(pos, count) {
  for (let i=0;i<count;i++) {
    const dir = new THREE.Vector3((Math.random()-0.5)*2, Math.random()*0.8-0.2, (Math.random()-0.5)*2).normalize();
    const sp = 3 + Math.random()*5;
    debrisPool.emit(pos.x,pos.y,pos.z, dir.x*sp,dir.y*sp,dir.z*sp,
      2+Math.random()*2, 0.8+Math.random()*0.8, 5, 0.2);
  }
}

function stageEnter(idx, direct) {
  state.stage = idx;
  state.stageT = 0;

  if (idx === 0) {
    resetAll();
  } else if (direct) {
    syncStateForStage(idx);
  }

  if (idx === 1) {
    state.cameraShake = 1.2;
    if (direct) emitSteamCloud(400);
    else emitSteamCloud(900);
  }
  if (idx === 2 && !direct) {
    state.thrust1 = 1.0;
    separateBoosters();
  }
  if (idx === 3 && !direct) {
    state.thrust1 = 0;
    separateFirstStage();
    state.thrust2 = 0;
  }
  if (idx === 4 && !direct) {
    state.thrust2 = 1.0;
    jettisonFairing();
  }
  if (idx === 5 && !direct) {
    state.thrust2 = 0;
  }
  if (idx === 6) {
    if (!direct) state.thrust2 = 1.0;
    const p = getNozzleWorld(secondStage);
    emitBurst(p, 80, 8, 0xffffff, 0x4a9bff);
    triggerFlash(0.4);
  }
  if (idx === 7) {
    if (!direct) {
      state.thrust2 = 0;
      deploySatellites();
    }
  }
  updateHUDStage(idx);
  setInsetPreset(idx);
  playVoice(idx);
}

function syncStateForStage(idx) {
  resetAll();
  state.stage = idx;
  if (idx >= 2) {
    state.boostersGone = true;
    boosters.forEach((b,i) => {
      b.visible = false;
    });
  }
  if (idx >= 3) {
    state.firstGone = true;
    firstStage.visible = false;
    state.thrust1 = 0;
  }
  if (idx >= 4) {
    state.fairingGone = true;
    fairing.visible = false;
  }
  if (idx >= 7) {
    state.satsDeployed = true;
  }
  if (idx >= 1) state.thrust1 = 1.0;
  if (idx === 3) state.thrust2 = 0;
  if (idx === 4) state.thrust2 = 1.0;
  if (idx === 5) state.thrust2 = 0;
  if (idx === 6) state.thrust2 = 1.0;
  if (idx === 7) state.thrust2 = 0;

  const tiltMap = [0,0.02,0.12,0.22,0.3,0.5,0.7,Math.PI/2];
  const yMap = [ROCKET_BASE_Y, 40, 120, 160, 200, 220, 225, 220];
  state.tilt = tiltMap[idx];
  state.rocketY = yMap[idx];

  if (idx === 7) {
    sats.forEach((s,i) => {
      const ang = (i / 20) * Math.PI * 2;
      const r = 30 + i*1.2;
      s.parent = scene;
      s.position.set(Math.cos(ang)*r, 200, Math.sin(ang)*r);
      s.userData.panels.forEach(p => p.rotation.z = 0);
      state.satData.push({
        obj: s, pos: s.position.clone(),
        vel: new THREE.Vector3(), rot: new THREE.Vector3(),
        rotV: new THREE.Vector3(), t: 0, deployed: true,
        orbitR: r, orbitAng: ang, orbitSpd: 0.2 + Math.random()*0.15
      });
    });
    state.spin = 3;
  }
}

function resetAll() {
  state.globalT = 0; state.alt = 0; state.rocketY = ROCKET_BASE_Y;
  state.tilt = 0; state.spin = 0;
  state.thrust1 = 0; state.thrust2 = 0;
  state.boostersGone = false; state.firstGone = false; state.fairingGone = false; state.satsDeployed = false;
  state.boosterData = [null,null]; state.firstData = null; state.fairingData = [null,null];
  state.satData = []; state.cameraShake = 0;
  rocket.position.set(0, ROCKET_BASE_Y, 0);
  rocket.rotation.set(0,0,0);
  boosters.forEach((b,i) => {
    b.visible = true;
    if (b.parent !== rocket) rocket.attach(b);
    b.position.set(i === 0 ? -2.55 : 2.55, 9.1, 0);
    b.rotation.set(0,0,0);
  });
  firstStage.visible = true;
  if (firstStage.parent !== rocket) rocket.attach(firstStage);
  firstStage.position.set(0,6.6,0); firstStage.rotation.set(0,0,0);
  secondStage.position.set(0, 6.6+25+0.3, 0); secondStage.rotation.set(0,0,0);
  fairing.visible = true; fairing.position.y = satStack.position.y - 0.5;
  if (fairing.parent !== rocket) rocket.attach(fairing);
  fairing.userData.halves.forEach(h => {
    if (h.parent !== fairing) fairing.attach(h);
    h.position.set(0,0,0); h.rotation.set(0,0,0);
  });
  satStack.rotation.set(0,0,0);
  sats.forEach((s) => {
    if (s.parent !== satStack) satStack.attach(s);
    s.position.copy(s.userData.home);
    s.rotation.copy(s.userData.homeRot);
    s.userData.panels.forEach(p => { p.rotation.z = p.userData.foldSign > 0 ? Math.PI/2 : -Math.PI/2; });
  });
  flameCones.forEach(c => c.visible = false);
  firstFlameLight.intensity = 0; secondFlameLight.intensity = 0;
  [flamePool,flame2Pool,steamPool,trailPool,burstPool,debrisPool].forEach(p=>p.reset());
  controls.target.set(0, 34, 0);
  camera.position.set(52, 36, 78);
  fogNearCheck();
}

/* 分离动作 */
function separateBoosters() {
  if (state.boostersGone) return;
  state.boostersGone = true;
  boosters.forEach((b, i) => {
    const w = b.getWorldPosition(new THREE.Vector3());
    state.boosterData[i] = {
      obj: b,
      pos: w.clone(),
      vel: new THREE.Vector3((i===0?-1:1)*4.5, 2, (Math.random()-0.5)*2),
      rot: new THREE.Vector3(0,0,0),
      rotV: new THREE.Vector3((Math.random()-0.5)*2,(Math.random()-0.5)*2,(i===0?-1:1)*1.5)
    };
    b.parent = scene;
    b.position.copy(w);
    emitBurst(w, 60, 6, 0xffffff, 0xff7a30);
    emitDebris(w, 15);
  });
  triggerFlash(0.6);
  state.cameraShake = 0.5;
}
function separateFirstStage() {
  if (state.firstGone) return;
  state.firstGone = true;
  const w = firstStage.getWorldPosition(new THREE.Vector3());
  state.firstData = {
    obj: firstStage, pos: w.clone(),
    vel: new THREE.Vector3(0, -1, 0),
    rot: new THREE.Vector3(),
    rotV: new THREE.Vector3(0.3, 0.1, 0.6)
  };
  firstStage.parent = scene;
  firstStage.position.copy(w);
  const p = getNozzleWorld(firstStage);
  emitBurst(p, 80, 7, 0xffffff, 0x88c8ff);
  emitDebris(p, 20);
  triggerFlash(0.7);
  state.cameraShake = 0.6;
}
function jettisonFairing() {
  if (state.fairingGone) return;
  state.fairingGone = true;
  const w = fairing.getWorldPosition(new THREE.Vector3());
  fairing.userData.halves.forEach((h, i) => {
    state.fairingData[i] = {
      obj: h,
      pos: new THREE.Vector3(0,0,0),
      vel: new THREE.Vector3((i===0?-1:1)*2.2, 0.5, 0),
      rot: new THREE.Vector3(),
      rotV: new THREE.Vector3(0.8*(i===0?-1:1), 1.2*(i===0?-1:1), 0)
    };
    h.parent = scene;
    h.position.copy(w);
  });
  emitBurst(w, 70, 5, 0xffffff, 0x88c8ff);
  triggerFlash(0.5);
  state.cameraShake = 0.35;
}
function deploySatellites() {
  if (state.satsDeployed) return;
  state.satsDeployed = true;
  sats.forEach((s, i) => {
    const w = s.getWorldPosition(new THREE.Vector3());
    const ang = (i / 20) * Math.PI * 2;
    const r = 4 + (i%3)*1.2;
    state.satData.push({
      obj: s,
      pos: w.clone(),
      vel: new THREE.Vector3(Math.cos(ang)*r*0.5, 1.2+Math.random()*0.6, Math.sin(ang)*r*0.5),
      rot: new THREE.Vector3(),
      rotV: new THREE.Vector3((Math.random()-0.5)*0.8,(Math.random()-0.5)*0.8,(Math.random()-0.5)*0.8),
      t: i * 0.22,
      deployed: false,
      orbitR: 30 + i*1.2,
      orbitAng: ang,
      orbitSpd: 0.2 + Math.random()*0.15
    });
    s.parent = scene;
  });
}

/* 蒸汽云 */
function emitSteamCloud(count) {
  for (let i=0;i<count;i++) {
    const a = Math.random()*Math.PI*2;
    const r = Math.random()*5;
    steamPool.emit(Math.cos(a)*r, 6.2, Math.sin(a)*r,
      Math.cos(a)*(2+Math.random()*4), 1+Math.random()*3, Math.sin(a)*(2+Math.random()*4),
      3+Math.random()*3, 12+Math.random()*18, -1.0, 0.3, 0xffffff, 0x3a4050);
  }
}

/* 持续火焰发射 */
function emitFlameAt(pos, dir, pool, count, isHydro) {
  for (let i=0;i<count;i++) {
    const spread = isHydro ? 0.6 : 1.0;
    const vx = (Math.random()-0.5)*spread;
    const vz = (Math.random()-0.5)*spread;
    const spd = isHydro ? 25+Math.random()*15 : 18+Math.random()*14;
    pool.emit(pos.x + (Math.random()-0.5)*0.6, pos.y, pos.z+(Math.random()-0.5)*0.6,
      vx, -spd*dir, vz,
      0.35+Math.random()*0.35,
      isHydro ? (1.2+Math.random()*1.4) : (1.6+Math.random()*2.2),
      0, 2.5,
      isHydro ? 0xffffff : 0xfff2c0,
      isHydro ? 0x2050a0 : 0x4a1000);
  }
}

const camPresets = [
  { pos: [52, 36, 78],  tgt: [0, 34, 0],   fov: 50 },
  { pos: [40,24,60],  tgt: [0,34,0],   fov: 58 },
  { pos: [70,58,96],  tgt: [0,66,0],   fov: 50 },
  { pos: [80,78,116], tgt: [0,96,0],   fov: 48 },
  { pos: [70,118,126],tgt: [0,126,0],  fov: 46 },
  { pos: [0,148,268], tgt: [0,148,0],  fov: 60 },
  { pos: [60,188,308],tgt: [0,188,0],  fov: 55 },
  { pos: [0,268,528], tgt: [0,208,0],  fov: 62 }
];
let camLerp = 1;
let camFrom = new THREE.Vector3(), camTo = new THREE.Vector3();
let camTFrom = new THREE.Vector3(), camTTo = new THREE.Vector3();
let camFovFrom = 55, camFovTo = 55;
function setCameraPreset(idx, snap) {
  const p = camPresets[idx];
  if (snap) {
    camera.position.set(...p.pos); controls.target.set(...p.tgt);
    camera.fov = p.fov; camera.updateProjectionMatrix(); camLerp = 1;
  } else {
    camFrom.copy(camera.position); camTFrom.copy(controls.target);
    camTo.set(...p.pos); camTTo.set(...p.tgt);
    camFovFrom = camera.fov; camFovTo = p.fov; camLerp = 0;
  }
}
function updateCamera(dt) {
  if (camLerp < 1) {
    camLerp = Math.min(1, camLerp + dt*0.9);
    const e = 1 - Math.pow(1-camLerp, 3);
    camera.position.lerpVectors(camFrom, camTo, e);
    controls.target.lerpVectors(camTFrom, camTTo, e);
    camera.fov = THREE.MathUtils.lerp(camFovFrom, camFovTo, e);
    camera.updateProjectionMatrix();
  }
  if (state.cameraShake > 0) {
    const s = state.cameraShake;
    camera.position.x += (Math.random()-0.5)*s*0.6;
    camera.position.y += (Math.random()-0.5)*s*0.4;
    state.cameraShake = Math.max(0, state.cameraShake - dt*1.5);
  }
}

function fogNearCheck() {
  if (state.stage >= 5) {
    scene.fog.density = 0.00035; scene.fog.color.setHex(0x000510);
    launchSite.visible = false;
  } else {
    scene.fog.density = 0.0012; scene.fog.color.setHex(0x05091a);
    launchSite.visible = true;
  }
}

function followRocket(dt, space) {
  controls.target.y += (state.rocketY - controls.target.y)*dt*1.2;
  if (space) {
    const dist = 200 + (state.stage-4)*60;
    const desired = new THREE.Vector3(
      Math.sin(state.tilt*0.5)*dist*0.4,
      state.rocketY + 40,
      Math.cos(state.tilt*0.5)*dist
    );
    camera.position.lerp(desired, dt*0.6);
  } else {
    camera.position.y += (state.rocketY + 18 - camera.position.y)*dt*0.6;
  }
}

function updateStage(dt) {
  const s = state;
  const p = STAGES[s.stage];
  const k = Math.min(1, s.stageT / p.dur);

  if (s.stage === 0) {
    const flick = 0.5 + 0.5*Math.sin(s.globalT*4);
    tower.userData.beacon.material.emissiveIntensity = 1 + flick*1.5;
    towerLight.intensity = 25 + Math.sin(s.globalT*0.8)*5;
  }
  if (s.stage === 1) {
    s.thrust1 = THREE.MathUtils.lerp(s.thrust1, 1.0, dt*2.2);
    if (k < 0.15) s.rocketY = ROCKET_BASE_Y;
    else s.rocketY = ROCKET_BASE_Y + (k-0.15)*120;
    if (k > 0.3) s.tilt = (k-0.3)*0.05;
    s.cameraShake = Math.max(s.cameraShake, 0.15 + (1-k)*0.25);
    if (Math.random() < 0.4) emitSteamCloud(3);
    controls.target.y = 30 + s.rocketY - ROCKET_BASE_Y;
    if (camLerp >= 1) camera.position.y += (controls.target.y + 2 - camera.position.y)*dt*0.6;
  }
  if (s.stage === 2) {
    s.thrust1 = 1.0;
    const startY = 135;
    const endY = 165;
    s.rocketY = startY + k*(endY-startY);
    s.tilt = 0.02 + k*0.10;
    followRocket(dt, false);
  }
  if (s.stage === 3) {
    s.thrust2 = THREE.MathUtils.lerp(s.thrust2, 1.0, dt*2.5);
    const startY = 165;
    const endY = 200;
    s.rocketY = startY + k*(endY-startY);
    s.tilt = 0.12 + k*0.10;
    followRocket(dt, false);
  }
  if (s.stage === 4) {
    s.thrust2 = 1.0;
    const startY = 200;
    const endY = 220;
    s.rocketY = startY + k*(endY-startY);
    s.tilt = 0.22 + k*0.08;
    followRocket(dt, false);
  }
  if (s.stage === 5) {
    const startY = 220;
    const endY = 222;
    s.rocketY = startY + k*(endY-startY);
    s.tilt = 0.3 + k*0.3;
    followRocket(dt, true);
  }
  if (s.stage === 6) {
    const startY = 222;
    const endY = 228;
    s.rocketY = startY + k*(endY-startY);
    s.tilt = 0.6 + k*0.3;
    followRocket(dt, true);
  }
  if (s.stage === 7) {
    s.tilt = THREE.MathUtils.lerp(s.tilt, Math.PI/2, dt*0.5);
    s.spin += dt*1.5;
    s.rocketY = THREE.MathUtils.lerp(s.rocketY, 220, dt*0.8);
  }

  rocket.position.y = s.rocketY;
  rocket.rotation.z = -s.tilt;
  secondStage.rotation.y = state.spin;
  satStack.rotation.y = state.spin;
}

function updateThrustEffects(dt, time) {
  const t1 = state.thrust1, t2 = state.thrust2;
  const boosterAlive = !state.boostersGone;

  boosterCones.forEach((c,i) => {
    c.visible = t1 > 0.05 && boosterAlive;
    if (c.visible) {
      const pulse = 0.8 + 0.2*Math.sin(time*30+i);
      c.scale.set(t1*0.9*pulse, t1*7*pulse, t1*0.9*pulse);
    }
  });
  core1Cones.forEach((c,i) => {
    c.visible = t1 > 0.05 && !state.firstGone;
    if (c.visible) {
      const pulse = 0.85 + 0.15*Math.sin(time*32+i);
      c.scale.set(t1*1.1*pulse, t1*9*pulse, t1*1.1*pulse);
    }
  });
  core2Cones.forEach((c,i) => {
    c.visible = t2 > 0.05;
    if (c.visible) {
      const pulse = 0.85 + 0.15*Math.sin(time*40+i);
      c.scale.set(t2*0.8*pulse, t2*6*pulse, t2*0.8*pulse);
    }
  });

  firstFlameLight.intensity = t1 * (state.firstGone ? 0 : 12);
  secondFlameLight.intensity = t2 * 10;
  const fp = getNozzleWorld(firstStage);
  firstFlameLight.position.copy(fp);
  const sp = getNozzleWorld(secondStage);
  secondFlameLight.position.copy(sp);

  if (t1 > 0.05 && !state.firstGone) {
    emitFlameAt(fp, 1, flamePool, Math.ceil(t1*14), false);
    if (Math.random() < t1*0.6) {
      trailPool.emit(fp.x, fp.y-2, fp.z,
        (Math.random()-0.5)*2, -2-Math.random()*3, (Math.random()-0.5)*2,
        1.2+Math.random()*1.2, 2+Math.random()*2, 1, 0.5, 0xff9050, 0x201018);
    }
  }
  if (!state.boostersGone) {
    boosters.forEach((b) => {
      if (t1 > 0.05) {
        const bp = getNozzleWorld(b);
        emitFlameAt(bp, 1, flamePool, Math.ceil(t1*8), false);
      }
    });
  }
  if (t2 > 0.05) {
    emitFlameAt(sp, 1, flame2Pool, Math.ceil(t2*12), true);
    if (Math.random() < t2*0.5) {
      trailPool.emit(sp.x, sp.y-1, sp.z,
        (Math.random()-0.5)*1.5, -3-Math.random()*3, (Math.random()-0.5)*1.5,
        1+Math.random(), 1.5+Math.random()*1.5, 0.5, 0.5, 0x9fc8ff, 0x0a1830);
    }
  }

  flamePool.update(dt);
  flame2Pool.update(dt);
  steamPool.update(dt);
  trailPool.update(dt);
  burstPool.update(dt);
  debrisPool.update(dt);
}

function updateSeparation(dt) {
  state.boosterData.forEach(d => {
    if (!d) return;
    d.vel.y -= 9*dt;
    d.pos.addScaledVector(d.vel, dt);
    d.rot.x += d.rotV.x*dt; d.rot.y += d.rotV.y*dt; d.rot.z += d.rotV.z*dt;
    d.obj.position.copy(d.pos);
    d.obj.rotation.set(d.rot.x,d.rot.y,d.rot.z);
    if (Math.random() < 0.4) {
      trailPool.emit(d.pos.x, d.pos.y-1, d.pos.z,
        (Math.random()-0.5)*2, -3-Math.random()*2, (Math.random()-0.5)*2,
        0.8+Math.random()*0.8, 1.5+Math.random(), 1, 0.6, 0xff8040, 0x201010);
    }
  });
  if (state.firstData) {
    const d = state.firstData;
    d.vel.y -= 6*dt;
    d.pos.addScaledVector(d.vel, dt);
    d.rot.x += d.rotV.x*dt; d.rot.y += d.rotV.y*dt; d.rot.z += d.rotV.z*dt;
    d.obj.position.copy(d.pos);
    d.obj.rotation.set(d.rot.x,d.rot.y,d.rot.z);
    if (Math.random() < 0.5) {
      trailPool.emit(d.pos.x, d.pos.y-2, d.pos.z,
        (Math.random()-0.5)*2, -4-Math.random()*2, (Math.random()-0.5)*2,
        1+Math.random(), 2+Math.random()*1.5, 1, 0.5, 0xff8040, 0x1a0a10);
    }
  }
  state.fairingData.forEach(d => {
    if (!d) return;
    d.vel.y -= 1.5*dt;
    d.pos.addScaledVector(d.vel, dt);
    d.rot.x += d.rotV.x*dt; d.rot.y += d.rotV.y*dt; d.rot.z += d.rotV.z*dt;
    d.obj.position.copy(d.pos);
    d.obj.rotation.set(d.rot.x,d.rot.y,d.rot.z);
  });
  state.satData.forEach(d => {
    d.t -= dt;
    if (d.t > 0) return;
    if (!d.deployed) {
      d.deployed = true;
      const w = d.obj.getWorldPosition(new THREE.Vector3());
      d.pos.copy(w); d.obj.position.copy(w);
    }
    d.rot.x += d.rotV.x*dt; d.rot.y += d.rotV.y*dt; d.rot.z += d.rotV.z*dt;
    d.orbitAng += d.orbitSpd*dt;
    const target = new THREE.Vector3(
      Math.cos(d.orbitAng)*d.orbitR,
      200 + Math.sin(d.orbitAng*0.5)*8,
      Math.sin(d.orbitAng)*d.orbitR
    );
    d.pos.lerp(target, dt*0.5);
    d.obj.position.copy(d.pos);
    d.obj.rotation.set(d.rot.x,d.rot.y,d.rot.z);
    d.obj.userData.panels.forEach(p => {
      p.rotation.z = THREE.MathUtils.lerp(p.rotation.z, 0, dt*1.2);
    });
    if (Math.random() < 0.05) {
      trailPool.emit(d.pos.x,d.pos.y,d.pos.z,0,0,0, 0.6, 0.8, 0, 0.5, 0x88ccff, 0x0a1830);
    }
  });
}

/* ========================================================================
 * UI
 * ====================================================================== */
const stageBtnRow = document.getElementById('stage-btns');
const stageBtns = [];
STAGES.forEach((st, i) => {
  const b = document.createElement('button');
  b.className = 'stage-btn';
  b.innerHTML = `<span class="n">${String(i).padStart(2,'0')}</span>${st.name}`;
  b.addEventListener('click', () => goToStage(i));
  stageBtnRow.appendChild(b);
  stageBtns.push(b);
});
const ticks = document.getElementById('progress-ticks');
let acc = 0;
STAGES.forEach((st, i) => {
  const t = document.createElement('div');
  t.className = 'tick';
  t.style.left = `${(acc/TOTAL_DUR)*100}%`;
  ticks.appendChild(t);
  const lab = document.createElement('div');
  lab.className = 'tick-label';
  lab.style.left = `${(acc/TOTAL_DUR)*100}%`;
  lab.textContent = st.ts;
  ticks.appendChild(lab);
  acc += st.dur;
});

const btnPlay = document.getElementById('btn-play');
const btnReset = document.getElementById('btn-reset');
const btnMute = document.getElementById('btn-mute');
let muted = false;
btnPlay.addEventListener('click', () => {
  initAudio();
  if (!state.playing && state.stage === STAGES.length - 1 && state.stageT >= STAGES[state.stage].dur) {
    goToStage(0);
  }
  state.playing = !state.playing;
  btnPlay.classList.toggle('playing', state.playing);
  btnPlay.textContent = state.playing ? '暂停' : '自动播放';
  if (state.playing && state.stage === 0) stageEnter(0);
});
btnReset.addEventListener('click', () => {
  state.playing = false;
  btnPlay.classList.remove('playing');
  btnPlay.textContent = '自动播放';
  goToStage(0);
});
btnMute.addEventListener('click', () => {
  muted = !muted;
  btnMute.textContent = muted ? '配音 关' : '配音 开';
});

function goToStage(i) {
  initAudio();
  stageEnter(i, true);
  setCameraPreset(i, i === 0);
  fogNearCheck();
}

function updateHUDStage(i) {
  const st = STAGES[i];
  document.getElementById('stage-tag').textContent = `STAGE ${i}`;
  document.getElementById('stage-name').textContent = st.name;
  document.getElementById('stage-meta').textContent = st.meta;
  document.getElementById('nar-ts').textContent = st.ts;
  document.getElementById('nar-text').textContent = st.text;
  stageBtns.forEach((b, j) => b.classList.toggle('active', j === i));
}

function updateProgress() {
  let acc = 0;
  for (let i=0;i<state.stage;i++) acc += STAGES[i].dur;
  acc += Math.min(state.stageT, STAGES[state.stage].dur);
  document.getElementById('progress-fill').style.width = `${(acc/TOTAL_DUR)*100}%`;
}

function updateCountdown() {
  if (state.stage !== 0) {
    document.getElementById('mission-time').textContent = STAGES[state.stage].ts;
    return;
  }
  const rem = Math.max(0, STAGES[0].dur - state.stageT);
  const countdown = Math.min(5, rem);
  document.getElementById('mission-time').textContent = `T-00:0${countdown.toFixed(1)}`;
  document.getElementById('nar-ts').innerHTML =
    `T-00:0${Math.ceil(countdown)} <span id="countdown">${countdown.toFixed(1)}</span>`;
}

let lastCountSec = -1;
function updateBigCountdown(dt) {
  const el = document.getElementById('big-countdown');
  if (state.stage !== 0 || !state.playing) { el.style.opacity = 0; lastCountSec = -1; return; }
  const rem = Math.max(0, STAGES[0].dur - state.stageT);
  const countdown = Math.min(5, rem);
  const sec = Math.ceil(countdown);
  if (countdown <= 5.2) { el.style.opacity = 1; }
  if (rem <= 0.4) {
    el.textContent = '点火!';
    el.classList.add('go');
  } else if (countdown <= 5) {
    el.classList.remove('go');
    el.textContent = String(sec);
  }
  if (sec !== lastCountSec && sec > 0 && sec <= 5 && countdown <= 5.2) {
    playBeep(sec === 1 ? 880 : 440, sec === 1 ? 0.5 : 0.2, sec === 1 ? 0.25 : 0.15);
    lastCountSec = sec;
  }
  if (rem <= 0.4 && lastCountSec !== 0) {
    playBoom();
    lastCountSec = 0;
  }
}

/* ---- Web Audio 配音 + 引擎轰鸣 ---- */
let audioCtx = null;
let voiceBuffers = [];
let currentVoice = null;
let rumbleGain = null;
let rumbleOsc = null;
let ambientGain = null;
let ambientNodes = null;

function initAudio() {
  if (audioCtx) { if (audioCtx.state === 'suspended') audioCtx.resume(); return; }
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  } catch(e) { return; }
  for (let i=0;i<8;i++) {
    const url = `audio/stage_${i}.mp3`;
    fetch(url).then(r => { if (r.ok) return r.arrayBuffer(); throw new Error(); })
      .then(b => audioCtx.decodeAudioData(b))
      .then(buf => { voiceBuffers[i] = buf; })
      .catch(() => { voiceBuffers[i] = null; });
  }
  rumbleGain = audioCtx.createGain();
  rumbleGain.gain.value = 0;
  rumbleGain.connect(audioCtx.destination);
  rumbleOsc = audioCtx.createOscillator();
  rumbleOsc.type = 'sawtooth'; rumbleOsc.frequency.value = 48;
  const filt = audioCtx.createBiquadFilter();
  filt.type = 'lowpass'; filt.frequency.value = 120;
  rumbleOsc.connect(filt); filt.connect(rumbleGain);
  rumbleOsc.start();

  ambientGain = audioCtx.createGain();
  ambientGain.gain.value = 0;
  ambientGain.connect(audioCtx.destination);
  const droneA = audioCtx.createOscillator();
  droneA.type = 'sine'; droneA.frequency.value = 55;
  const droneB = audioCtx.createOscillator();
  droneB.type = 'sine'; droneB.frequency.value = 82.5;
  const droneFilt = audioCtx.createBiquadFilter();
  droneFilt.type = 'lowpass'; droneFilt.frequency.value = 300;
  const droneLFO = audioCtx.createOscillator();
  droneLFO.type = 'sine'; droneLFO.frequency.value = 0.15;
  const lfoGain = audioCtx.createGain(); lfoGain.gain.value = 0.04;
  droneLFO.connect(lfoGain); lfoGain.connect(ambientGain.gain);
  droneA.connect(droneFilt); droneB.connect(droneFilt);
  droneFilt.connect(ambientGain);
  droneA.start(); droneB.start(); droneLFO.start();
  ambientNodes = { droneA, droneB, droneFilt };
}

function playBeep(freq, dur, vol) {
  if (!audioCtx || muted) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'sine'; o.frequency.value = freq;
  g.gain.setValueAtTime(0, audioCtx.currentTime);
  g.gain.linearRampToValueAtTime(vol, audioCtx.currentTime + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
  o.connect(g); g.connect(audioCtx.destination);
  o.start(); o.stop(audioCtx.currentTime + dur + 0.05);
}

function playBoom() {
  if (!audioCtx || muted) return;
  const dur = 1.8;
  const buf = audioCtx.createBuffer(1, audioCtx.sampleRate*dur, audioCtx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i=0;i<d.length;i++) {
    const t = i/d.length;
    d[i] = (Math.random()*2-1) * Math.pow(1-t, 2.5);
  }
  const src = audioCtx.createBufferSource(); src.buffer = buf;
  const filt = audioCtx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 220;
  const g = audioCtx.createGain(); g.gain.value = 0.8;
  src.connect(filt); filt.connect(g); g.connect(audioCtx.destination);
  src.start();
  const o = audioCtx.createOscillator(); o.type = 'sine';
  o.frequency.setValueAtTime(120, audioCtx.currentTime);
  o.frequency.exponentialRampToValueAtTime(35, audioCtx.currentTime + dur);
  const og = audioCtx.createGain();
  og.gain.setValueAtTime(0.7, audioCtx.currentTime);
  og.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
  o.connect(og); og.connect(audioCtx.destination);
  o.start(); o.stop(audioCtx.currentTime + dur);
}

function playVoice(i) {
  if (!audioCtx || muted) return;
  if (currentVoice) { try { currentVoice.stop(); } catch(e){} currentVoice = null; }
  const buf = voiceBuffers[i];
  if (!buf) return;
  const src = audioCtx.createBufferSource();
  src.buffer = buf; src.connect(audioCtx.destination);
  src.start(); currentVoice = src;
}

function updateRumble(dt) {
  if (!audioCtx || !rumbleGain) return;
  let target = 0;
  if (state.stage === 0 && state.playing) target = 0.05;
  if (state.stage >= 1 && state.stage <= 2) target = state.thrust1 * 0.12;
  if (state.stage >= 3 && state.stage <= 4) target = state.thrust2 * 0.06;
  if (state.stage === 6) target = state.thrust2 * 0.08;
  rumbleGain.gain.setTargetAtTime(target, audioCtx.currentTime, 0.2);
  if (rumbleOsc) rumbleOsc.frequency.setTargetAtTime(45 + state.rocketY*0.02, audioCtx.currentTime, 0.5);
  if (ambientGain) {
    const aTarget = (state.stage === 0 && state.playing) ? 0.12 : 0;
    ambientGain.gain.setTargetAtTime(aTarget, audioCtx.currentTime, 0.8);
  }
}

/* ========================================================================
 * 主循环
 * ====================================================================== */
let lastT = performance.now();
let elapsed = 0;

function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min(0.05, (now - lastT)/1000);
  lastT = now;
  elapsed += dt;
  state.globalT += dt;

  if (state.playing) {
    state.stageT += dt;
    if (state.stageT >= STAGES[state.stage].dur) {
      if (state.stage < STAGES.length-1) {
        stageEnter(state.stage+1);
        setCameraPreset(state.stage, false);
        fogNearCheck();
      } else {
        state.playing = false;
        btnPlay.classList.remove('playing');
        btnPlay.textContent = '自动播放';
      }
    }
  }

  updateStage(dt);
  updateThrustEffects(dt, elapsed);
  updateSeparation(dt);
  updateCamera(dt);
  updateRumble(dt);
  updateProgress();
  updateCountdown();
  updateInset(dt);
  updateBigCountdown(dt);

  earth.rotation.y += dt * 0.01;
  stars.userData.mat.uniforms.uTime.value = elapsed;
  stars.rotation.y += dt * 0.002;

  controls.update();
  composer.render();
  renderInset();
}

function setInsetPreset(idx) {
  insetCamera.fov = INSET_PRESETS[idx].fov;
  insetCamera.updateProjectionMatrix();
  document.getElementById('inset-title').textContent = INSET_PRESETS[idx].title;
}

function updateInset(dt) {
  const s = state.stage;
  const preset = INSET_PRESETS[s];
  let focus;

  const secondBottomWorld = (() => {
    const v = new THREE.Vector3(0, 0, 0);
    secondStage.localToWorld(v);
    return v;
  })();
  const stackTopWorld = (() => {
    const v = new THREE.Vector3(0, stackTop, 0);
    satStack.localToWorld(v);
    return v;
  })();
  const stageMidWorld = new THREE.Vector3().addVectors(secondBottomWorld, stackTopWorld).multiplyScalar(0.5);

  if (s === 0) focus = new THREE.Vector3(0, 34, 0);
  else if (s <= 2) focus = new THREE.Vector3(0, state.rocketY + 28, 0);
  else focus = stageMidWorld.clone();

  insetTarget.lerp(focus, dt * 5);

  const bodyLen = preset.bodyLen;
  const fovRad = THREE.MathUtils.degToRad(insetCamera.fov);
  const dist = (bodyLen * 0.85) / Math.tan(fovRad / 2);

  let desiredPos;
  if (s === 7) {
    const ang = elapsed * 0.35;
    desiredPos = focus.clone().add(new THREE.Vector3(
      Math.cos(ang) * dist * 0.95, dist * 0.15, Math.sin(ang) * dist * 0.95));
  } else if (s >= 3) {
    const axis = new THREE.Vector3(0.25, 0.25, 1).normalize();
    desiredPos = focus.clone().add(axis.multiplyScalar(dist));
  } else {
    desiredPos = focus.clone().add(new THREE.Vector3(dist * 0.35, 0, dist * 0.95));
  }

  insetPos.copy(desiredPos);
  insetCamera.position.copy(insetPos);
  insetCamera.up.set(0, 1, 0);
  insetCamera.lookAt(insetTarget);
}

function renderInset() {
  const pr = insetScale;
  const iw = Math.round(380 * pr), ih = Math.round(460 * pr);
  const w = window.innerWidth, h = window.innerHeight;
  const left = Math.round((w - 380 - 18) * pr);
  const bottom = Math.round((h - 460 - 110) * pr);
  renderer.autoClear = false;
  renderer.clearDepth();
  renderer.setViewport(left, bottom, iw, ih);
  renderer.setScissor(left, bottom, iw, ih);
  renderer.setScissorTest(true);
  renderer.render(scene, insetCamera);
  renderer.setViewport(0, 0, w*pr, h*pr);
  renderer.setScissor(0, 0, w*pr, h*pr);
  renderer.setScissorTest(false);
  renderer.autoClear = true;
}

function boot() {
  updateInsetSize();
  stageEnter(0);
  setCameraPreset(0, true);
  setInsetPreset(0);
  updateHUDStage(0);
  document.getElementById('loading').style.opacity = 0;
  setTimeout(() => document.getElementById('loading').style.display = 'none', 800);
  requestAnimationFrame((t) => { lastT = t; animate(t); });
}
boot();
