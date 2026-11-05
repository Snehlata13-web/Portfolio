import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// Simplex noise (Ashima Arts / Stefan Gustavson)
const NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

const vertexShader = /* glsl */ `
uniform float uTime;
uniform float uMorph;
uniform float uSize;
uniform float uPixelRatio;
uniform float uIntro;
uniform vec3 uMouse;
uniform float uMouseStrength;
uniform float uHasPhoto;
uniform float uExplode;
attribute vec3 aS0;
attribute vec3 aPhoto;
attribute vec3 aS1;
attribute vec3 aS2;
attribute vec3 aS3;
attribute vec3 aS4;
attribute float aRand;
varying vec3 vColor;
varying float vAlpha;
${NOISE}

vec3 getShape(float i){
  if(i < 0.5) return aS0;
  if(i < 1.5) return aS1;
  if(i < 2.5) return aS2;
  if(i < 3.5) return aS3;
  return aS4;
}

void main(){
  float m = clamp(uMorph, 0., 4.);
  float fi = min(floor(m), 3.);
  float f = m - fi;
  // per-particle stagger so morphs ripple instead of snapping
  float t = clamp((f - aRand * 0.35) / 0.65, 0., 1.);
  t = t * t * (3. - 2. * t);
  vec3 pos = mix(getShape(fi), getShape(fi + 1.), t);
  // how much of the photo portrait is currently formed (shape 0)
  float pw = (fi < 0.5 ? 1. - t : 0.) * uHasPhoto;

  // explode from the center on intro
  pos *= mix(0.0, 1.0, smoothstep(0., 1., clamp(uIntro * 1.4 - aRand * 0.4, 0., 1.)));

  // click shockwave: fling particles outward with a twist, then they spring back
  float ex = uExplode * (0.6 + aRand * 1.6);
  pos += normalize(pos + 0.0001) * ex * 3.2;
  pos.xz = mat2(cos(ex * 1.4), -sin(ex * 1.4), sin(ex * 1.4), cos(ex * 1.4)) * pos.xz;

  // organic flow (kept subtle on the portrait so the face stays readable)
  float n = snoise(pos * 0.45 + vec3(uTime * 0.12));
  pos += normalize(pos + 0.0001) * n * mix(0.22, 0.03, pw);
  pos.z += pw * sin(uTime * 1.2 + pos.y * 2.5 + pos.x) * 0.04;
  pos.x += sin(uTime * 0.6 + aRand * 20.) * 0.015;
  pos.y += cos(uTime * 0.5 + aRand * 30.) * 0.015;

  // ocean wave when the plane shape is active
  float wave = smoothstep(3.0, 4.0, m);
  pos.y += wave * (sin(pos.x * 0.9 + uTime * 0.9) * 0.35 + cos(pos.z * 1.1 + uTime * 0.7) * 0.3);

  vec4 world = modelMatrix * vec4(pos, 1.);

  // mouse repulsion
  vec3 d = world.xyz - uMouse;
  float dist = length(d.xy);
  float radius = mix(1.6, 0.75, pw);
  float force = smoothstep(radius, 0., dist) * uMouseStrength;
  vec3 push = normalize(d + vec3(0., 0., 0.001));
  // on the portrait particles swirl out and lift towards the camera
  push += pw * vec3(-d.y, d.x, 0.) * 0.8 + pw * vec3(0., 0., 1.2);
  world.xyz += push * force * mix(0.9, 0.55, pw);

  vec4 mv = viewMatrix * world;
  gl_Position = projectionMatrix * mv;

  float size = uSize * (0.35 + aRand * 0.9) * mix(1., 0.8, pw);
  gl_PointSize = size * uPixelRatio * (1. / -mv.z);

  vec3 violet = vec3(1.0, 0.18, 0.53);  // hot pink
  vec3 cyan = vec3(0.84, 1.0, 0.23);    // acid lime
  vec3 pink = vec3(1.0, 0.42, 0.12);    // ember
  float g = smoothstep(-2.5, 2.5, pos.y + n * 0.8);
  vec3 col = mix(violet, cyan, g);
  col = mix(col, pink, smoothstep(0.82, 1.0, aRand));
  vec3 photo = pow(aPhoto, vec3(1.1)) * 0.95 + violet * 0.05;
  col = mix(col, mix(photo, col, force), pw);
  col += force * mix(0.9, 0.5, pw);
  vColor = col;
  vAlpha = (0.35 + aRand * 0.5) * uIntro * mix(1., 0.62, pw);
}`;

const fragmentShader = /* glsl */ `
uniform float uOpacity;
varying vec3 vColor;
varying float vAlpha;
void main(){
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  a *= a;
  if(a < 0.01) discard;
  gl_FragColor = vec4(vColor, a * vAlpha * uOpacity);
}`;

// ---------- shape generators ----------
function sphere(n) {
  const out = new Float32Array(n * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = golden * i;
    const R = 2.3 + (Math.random() - 0.5) * 0.08;
    out.set([Math.cos(th) * r * R, y * R, Math.sin(th) * r * R], i * 3);
  }
  return shuffle(out, n);
}

function torusKnot(n, p = 2, q = 3) {
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const u = Math.random() * Math.PI * 2 * p;
    const cu = Math.cos(u), su = Math.sin(u);
    const quOverP = (q / p) * u;
    const cs = Math.cos(quOverP);
    const r = 1.6;
    const x = r * (2 + cs) * 0.5 * cu;
    const y = r * (2 + cs) * 0.5 * su;
    const z = r * Math.sin(quOverP) * 0.5;
    const tube = 0.32 * Math.sqrt(Math.random());
    const a = Math.random() * Math.PI * 2;
    out.set([x + Math.cos(a) * tube, y + Math.sin(a) * tube, z + Math.cos(a * 1.3) * tube], i * 3);
  }
  return out;
}

function galaxy(n) {
  const out = new Float32Array(n * 3);
  const arms = 4;
  for (let i = 0; i < n; i++) {
    const r = Math.pow(Math.random(), 1.6) * 4.2 + 0.1;
    const arm = ((i % arms) / arms) * Math.PI * 2;
    const spin = r * 1.1;
    const rp = () => Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.5 * r * 0.6;
    const x = Math.cos(arm + spin) * r + rp();
    const z = Math.sin(arm + spin) * r + rp();
    const y = rp() * 0.35;
    // tilt
    const tilt = 0.45;
    out.set([x, y * Math.cos(tilt) - z * Math.sin(tilt), y * Math.sin(tilt) + z * Math.cos(tilt)], i * 3);
  }
  return out;
}

function helix(n) {
  // DNA double helix
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const t = (Math.random() - 0.5) * 9;
    const strand = Math.random();
    const a = t * 1.4;
    let x, z;
    if (strand < 0.8) {
      const s = strand < 0.4 ? 0 : Math.PI;
      x = Math.cos(a + s) * 1.3;
      z = Math.sin(a + s) * 1.3;
    } else {
      // rungs
      const k = Math.random() * 2 - 1;
      x = Math.cos(Math.round(a * 2) / 2) * 1.3 * k;
      z = Math.sin(Math.round(a * 2) / 2) * 1.3 * k;
    }
    const j = 0.08;
    out.set([t * 0.55 + (Math.random() - 0.5) * j, x + (Math.random() - 0.5) * j, z + (Math.random() - 0.5) * j], i * 3);
  }
  return out;
}

function plane(n) {
  const out = new Float32Array(n * 3);
  const side = Math.ceil(Math.sqrt(n));
  for (let i = 0; i < n; i++) {
    const gx = (i % side) / side - 0.5;
    const gz = Math.floor(i / side) / side - 0.5;
    out.set([gx * 14, -1.6, gz * 9 - 1], i * 3);
  }
  return out;
}

function shuffle(arr, n) {
  for (let i = n - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    for (let k = 0; k < 3; k++) {
      const t = arr[i * 3 + k];
      arr[i * 3 + k] = arr[j * 3 + k];
      arr[j * 3 + k] = t;
    }
  }
  return arr;
}

// Turns a photo into particle positions + colors. Works best with a cut-out PNG
// (transparent background) or a photo on a plain background.
export const PORTRAIT_HEIGHT = 5.4;
async function portrait(url, n) {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = url;
  await img.decode();

  const W = 240;
  const H = Math.round((W * img.naturalHeight) / img.naturalWidth);
  const cvs = document.createElement('canvas');
  cvs.width = W; cvs.height = H;
  const ctx = cvs.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, W, H);
  const px = ctx.getImageData(0, 0, W, H).data;

  // estimate the background colour from the four corners
  const bg = [0, 0, 0]; let bgN = 0;
  const corner = (x0, y0) => {
    for (let y = y0; y < y0 + 8; y++) for (let x = x0; x < x0 + 8; x++) {
      const k = (y * W + x) * 4;
      bg[0] += px[k]; bg[1] += px[k + 1]; bg[2] += px[k + 2]; bgN++;
    }
  };
  corner(0, 0); corner(W - 8, 0); corner(0, H - 8); corner(W - 8, H - 8);
  bg.forEach((v, i) => (bg[i] = v / bgN));

  const weights = new Float32Array(W * H);
  let total = 0;
  for (let i = 0; i < W * H; i++) {
    const k = i * 4;
    const r = px[k], g = px[k + 1], b = px[k + 2], a = px[k + 3] / 255;
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    const dist = Math.hypot(r - bg[0], g - bg[1], b - bg[2]) / 441;
    const subject = a < 0.99 ? a : Math.min(1, Math.max(0, (dist - 0.08) / 0.22));
    // soft oval mask so any leftover background fades out at the edges
    const ex = ((i % W) / W - 0.5) / 0.5, ey = (((i / W) | 0) / H - 0.42) / 0.62;
    const oval = Math.min(1, Math.max(0, (1 - Math.hypot(ex, ey)) / 0.35));
    const w = subject * oval * (0.12 + 0.88 * lum);
    weights[i] = w; total += w;
  }
  if (total < W * H * 0.01) { // background detection failed, fall back to brightness
    total = 0;
    for (let i = 0; i < W * H; i++) { const k = i * 4; weights[i] = (px[k] + px[k + 1] + px[k + 2]) / 765; total += weights[i]; }
  }

  // cumulative distribution sampling
  const cdf = new Float32Array(W * H);
  let acc = 0;
  for (let i = 0; i < W * H; i++) { acc += weights[i]; cdf[i] = acc; }
  const pos = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  const scale = PORTRAIT_HEIGHT / H;
  for (let j = 0; j < n; j++) {
    const target = Math.random() * acc;
    let lo = 0, hi = W * H - 1;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (cdf[mid] < target) lo = mid + 1; else hi = mid; }
    const x = lo % W, y = (lo / W) | 0, k = lo * 4;
    const lum = (0.299 * px[k] + 0.587 * px[k + 1] + 0.114 * px[k + 2]) / 255;
    pos[j * 3] = (x + Math.random() - W / 2) * scale;
    pos[j * 3 + 1] = (H / 2 - y - Math.random()) * scale;
    pos[j * 3 + 2] = (lum - 0.5) * 0.9 + (Math.random() - 0.5) * 0.06; // brightness → depth relief
    col[j * 3] = px[k] / 255; col[j * 3 + 1] = px[k + 1] / 255; col[j * 3 + 2] = px[k + 2] / 255;
  }
  return { pos, col };
}

export function createScene(canvas, { photo } = {}) {
  const isMobile = window.matchMedia('(max-width: 900px)').matches;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const COUNT = isMobile ? 9000 : 24000;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
  const pr = Math.min(window.devicePixelRatio, 2);
  renderer.setPixelRatio(pr);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x08070b, 1);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x08070b);
  scene.fog = new THREE.FogExp2(0x08070b, 0.05);
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 9);

  // ---------- main morphing particles ----------
  const geo = new THREE.BufferGeometry();
  const s0 = sphere(COUNT);
  geo.setAttribute('position', new THREE.BufferAttribute(s0, 3));
  geo.setAttribute('aS0', new THREE.BufferAttribute(s0, 3));
  geo.setAttribute('aS1', new THREE.BufferAttribute(torusKnot(COUNT), 3));
  geo.setAttribute('aS2', new THREE.BufferAttribute(helix(COUNT), 3));
  geo.setAttribute('aS3', new THREE.BufferAttribute(galaxy(COUNT), 3));
  geo.setAttribute('aS4', new THREE.BufferAttribute(plane(COUNT), 3));
  geo.setAttribute('aPhoto', new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3));
  const rand = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) rand[i] = Math.random();
  geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 1));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 20);

  const uniforms = {
    uTime: { value: 0 },
    uMorph: { value: 0 },
    uSize: { value: isMobile ? 26 : 30 },
    uPixelRatio: { value: pr },
    uIntro: { value: 0 },
    uOpacity: { value: 1 },
    uMouse: { value: new THREE.Vector3(99, 99, 0) },
    uMouseStrength: { value: 0 },
    uHasPhoto: { value: 0 },
    uExplode: { value: 0 },
  };

  const mat = new THREE.ShaderMaterial({
    vertexShader, fragmentShader, uniforms,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geo, mat);
  const group = new THREE.Group();
  group.add(points);
  scene.add(group);

  // ---------- photo portrait replaces the hero sphere ----------
  let hasPhoto = false;
  const photoReady = photo
    ? portrait(photo, COUNT)
        .then(({ pos, col }) => {
          geo.setAttribute('aS0', new THREE.BufferAttribute(pos, 3));
          geo.setAttribute('aPhoto', new THREE.BufferAttribute(col, 3));
          uniforms.uHasPhoto.value = 1;
          hasPhoto = true;
          return true;
        })
        .catch((err) => { console.warn('[portfolio] photo not loaded, using sphere:', photo, err); return false; })
    : Promise.resolve(false);

  // ---------- background star dust ----------
  const starCount = isMobile ? 800 : 2000;
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    starPos.set([(Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40, -Math.random() * 30 - 2], i * 3);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
    size: 0.035, color: 0xfff1d6, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
  }));
  scene.add(stars);

  // ---------- wireframe halo ----------
  const halo = new THREE.Mesh(
    new THREE.IcosahedronGeometry(3.4, 1),
    new THREE.MeshBasicMaterial({ color: 0xd7ff3a, wireframe: true, transparent: true, opacity: 0.06, depthWrite: false })
  );
  group.add(halo);

  // ---------- post processing ----------
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.7, 0.6, 0.1);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // ---------- state driven from the DOM ----------
  const state = { morph: 0, x: 0, y: 0, scale: 1, opacity: 1, rotSpeed: 1, scroll: 0 };
  const pointer = new THREE.Vector2(0, 0);
  const pointerSmooth = new THREE.Vector2(0, 0);
  const raycaster = new THREE.Raycaster();
  const mousePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const hit = new THREE.Vector3();
  let mouseActive = 0;

  window.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    mouseActive = 1;
  });
  document.addEventListener('pointerleave', () => { mouseActive = 0; });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
  });

  let spin = 0;
  const clock = new THREE.Clock();
  let running = true;
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running) { clock.getDelta(); tick(); }
  });

  function tick() {
    if (!running) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    uniforms.uTime.value = reduced ? 0 : t;
    uniforms.uMorph.value = state.morph;
    uniforms.uOpacity.value = state.opacity;

    pointerSmooth.lerp(pointer, 0.08);
    raycaster.setFromCamera(pointer, camera);
    raycaster.ray.intersectPlane(mousePlane, hit);
    if (hit) uniforms.uMouse.value.lerp(hit, 0.2);
    uniforms.uMouseStrength.value += (mouseActive - uniforms.uMouseStrength.value) * 0.05;

    group.position.x += (state.x - group.position.x) * 0.05;
    group.position.y += (state.y - group.position.y) * 0.05;
    const s = group.scale.x + (state.scale - group.scale.x) * 0.05;
    group.scale.setScalar(s);

    const flat = Math.max(0, state.morph - 3); // keep the ocean plane un-rotated
    const face = hasPhoto ? Math.max(0, 1 - state.morph) : 0; // keep the portrait facing the camera
    spin += dt * 0.12 * state.rotSpeed * (1 - flat) * (1 - face);
    const upright = Math.round(spin / (Math.PI * 2)) * Math.PI * 2;
    spin += (upright - spin) * 0.06 * Math.max(face, flat);
    group.rotation.y = spin + pointerSmooth.x * 0.35 * face;
    group.rotation.x += ((pointerSmooth.y * 0.25) * (1 - flat) * (1 - face * 0.4) + flat * 0.25 - group.rotation.x) * 0.05;
    group.rotation.z = Math.sin(t * 0.2) * 0.05 * (1 - flat) * (1 - face);

    halo.rotation.x = t * 0.05;
    halo.rotation.z = t * 0.03;
    halo.material.opacity = hasPhoto ? 0 : 0.06 * (1 - Math.min(1, state.morph)) * uniforms.uIntro.value * state.opacity;

    camera.position.x += (pointerSmooth.x * 0.4 - camera.position.x) * 0.04;
    camera.position.y += (pointerSmooth.y * 0.25 - camera.position.y) * 0.04;
    camera.lookAt(camera.position.x * 0.9, camera.position.y * 0.9, 0);

    stars.rotation.y = t * 0.01;
    stars.position.y = state.scroll * 0.0015;

    composer.render();
    requestAnimationFrame(tick);
  }
  tick();

  // maps a DOM rect to world units on the z=0 plane, used to place the portrait inside .hero__visual
  function rectToWorld(rect) {
    const visH = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const visW = visH * camera.aspect;
    const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
    return {
      x: (cx / window.innerWidth - 0.5) * visW,
      y: -(cy / window.innerHeight - 0.5) * visH,
      h: (rect.height / window.innerHeight) * visH,
    };
  }

  return { state, uniforms, isMobile, photoReady, rectToWorld };
}
