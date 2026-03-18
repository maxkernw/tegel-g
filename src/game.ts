import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

class SynthAudio {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    public analyser: AnalyserNode | null = null;
    private dataArray: Uint8Array | null = null;
    private bgm: HTMLAudioElement | null = null;

    constructor() {}

    public async init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (this.ctx.state === 'suspended') {
            await this.ctx.resume();
        }
        this.masterGain = this.ctx.createGain();
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 256;
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        
        this.masterGain.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);
        
        this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
        this.masterGain.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + 0.5);
        this.startBGM();
        console.log("NEON AUDIO ENGINE INITIALIZED");
    }

    private startBGM() {
        if (!this.ctx || !this.masterGain) return;
        if (!this.bgm) {
            this.bgm = new Audio('/synthwave.finish.wav');
            this.bgm.loop = true;
            this.bgm.volume = 0.3;
            
            // Connect the HTMLAudioElement to the AudioContext so we can analyze it
            const source = this.ctx.createMediaElementSource(this.bgm);
            source.connect(this.masterGain);
        }
        
        this.bgm.currentTime = 0;
        this.bgm.play().catch(e => console.warn("Audio play failed:", e));
    }
    
    public stopBGM() {
        if (this.bgm) {
            this.bgm.pause();
        }
    }
    
    public restartBGM() {
        if (this.bgm) {
            this.bgm.currentTime = 0;
            this.bgm.play().catch(e => console.warn("Audio play failed:", e));
        } else {
            this.startBGM();
        }
    }

    public playGameOverVoice() {
        // AI computer interface game over voice
        if ('speechSynthesis' in window) {
            const msg = new SpeechSynthesisUtterance("Spelet är Över");
            msg.rate = 0.7; // Slow down slightly for dramatic effect
            msg.pitch = 0.1; // Very deep
            msg.volume = 1.0;
            // Try to find a Swedish voice, preferably female/artificial sounding if available
            const voices = window.speechSynthesis.getVoices();
            const svVoices = voices.filter(v => v.lang.includes('sv-') || v.lang.includes('sv_SE'));
            if(svVoices.length > 0) {
                // Try to grab a non-default voice or Google voice which often sounds more "digital"
                const altVoice = svVoices.find(v => v.name.includes('Google') || v.name.includes('Siri') || v.name.includes('Alva'));
                msg.voice = altVoice || svVoices[0];
            }
            
            window.speechSynthesis.speak(msg);
        }
    }

    public getAudioData(): number {
        if (!this.analyser || !this.dataArray) return 0;
        this.analyser.getByteFrequencyData(this.dataArray as any);
        let sum = 0;
        // Average the lower frequencies (bass/beats)
        const length = Math.floor(this.dataArray.length * 0.5);
        for (let i = 0; i < length; i++) {
            sum += this.dataArray[i];
        }
        return (sum / length) / 255.0; // Return normalized value 0.0 to 1.0
    }

    public playLaser() {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        osc.connect(gain); gain.connect(this.masterGain);
        osc.start(); osc.stop(this.ctx.currentTime + 0.1);
    }

    public playExplosion() {
        if (!this.ctx || !this.masterGain) return;
        const bufferSize = this.ctx.sampleRate * 0.4;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = this.ctx.createBufferSource(); noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter(); filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(10, this.ctx.currentTime + 0.4);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);
        noise.connect(filter); filter.connect(gain); gain.connect(this.masterGain);
        noise.start();
    }

    public playDamage() {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
        osc.type = 'square'; osc.frequency.setValueAtTime(120, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(20, this.ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
        osc.connect(gain); gain.connect(this.masterGain);
        osc.start(); osc.stop(this.ctx.currentTime + 0.3);
    }
}

const GRID_VERTEX_SHADER = `varying vec2 vUv; varying float vDist; void main() { vUv = uv; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); vDist = -mvPosition.z; gl_Position = projectionMatrix * mvPosition; }`;
const GRID_FRAGMENT_SHADER = `
varying vec2 vUv; 
varying float vDist; 
uniform float time; 
uniform vec3 color; 

void main() { 
    // Grid animation
    float speedY = time * 3.0; 
    
    // Vertical lines
    float gridX = step(0.96, fract(vUv.x * 60.0));
    
    // Horizontal lines (moving)
    float gridY = step(0.95, fract(vUv.y * 60.0 + speedY));
    
    float grid = max(gridX, gridY);
    
    // Add glowing horizon line effect
    float horizonGlow = pow(1.0 - vUv.y, 4.0) * 2.5;

    // Grid color mixing (cyan and pink)
    vec3 gridColor = mix(vec3(0.0, 1.0, 1.0), vec3(1.0, 0.0, 1.0), vUv.y);
    
    // Depth fade out (aggressive curve for synthwave look)
    float fade = exp(-vDist * 0.035); 
    
    vec3 finalColor = (gridColor * grid) + (vec3(1.0, 0.0, 0.8) * horizonGlow);
    
    gl_FragColor = vec4(finalColor, max(grid, horizonGlow * 0.5) * fade); 
}`;

class Particle {
    mesh: THREE.Mesh; velocity: THREE.Vector3; life: number = 1.0;
    constructor(pos: THREE.Vector3, color: number) {
        this.mesh = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), new THREE.MeshBasicMaterial({ color, transparent: true }));
        this.mesh.position.copy(pos);
        this.velocity = new THREE.Vector3((Math.random()-0.5)*0.6, (Math.random()-0.5)*0.6, (Math.random()-0.5)*0.6);
    }
    update(delta: number) { this.mesh.position.add(this.velocity); this.life -= delta * 1.5; (this.mesh.material as THREE.MeshBasicMaterial).opacity = this.life; this.mesh.scale.setScalar(this.life); }
}

export class Game {
    private scene: THREE.Scene; private camera: THREE.PerspectiveCamera; private renderer: THREE.WebGLRenderer; private clock: THREE.Clock;
    private score = 0; private isGameOver = false; private speed = 0.45; private shieldHealth = 5;
    private ship: THREE.Object3D | null = null; private shieldMesh: THREE.Mesh | null = null; private grid!: THREE.Mesh;
    private obstacles: THREE.Mesh[] = []; private bullets: THREE.Mesh[] = []; private particles: Particle[] = [];
    private mountains: THREE.Group[] = []; private stars!: THREE.Points; private rings: THREE.Mesh[] = [];
    private gridMaterial!: THREE.ShaderMaterial;  private invulnerableTime = 0;
    private targetShipX = 0; private targetShipY = 2; private targetShipRotZ = 0; private targetShipRotX = -0.3;
    private fadeScene?: THREE.Scene;
    private fadeCamera?: THREE.OrthographicCamera;
    private audio = new SynthAudio();
    private onGameOver: (score: number) => void;
    private readonly BASE_PITCH = -0.6; // Correct base tilt for the model

    constructor(container: HTMLElement, onGameOver: (score: number) => void) {
        this.onGameOver = onGameOver; this.clock = new THREE.Clock();
        container.innerHTML = `
            <div id="game-ui">
                <div style="font-size: 1.5rem; color: #ff00ff; text-shadow: 0 0 15px #ff00ff; font-family: 'Press Start 2P', cursive; margin-bottom: 10px;">SCORE: <span id="game-score">0</span></div>
                <div id="shield-container" style="width: 240px; height: 10px; border: 2px solid #00ffff; margin: 10px auto; background: rgba(0,0,0,0.5); position: relative;">
                    <div id="shield-bar" style="width: 100%; height: 100%; background: linear-gradient(90deg, #00ffff, #ff00ff); box-shadow: 0 0 15px #00ffff; transition: width 0.3s;"></div>
                </div>
                <button id="init-audio" class="retro-font" style="background: transparent; border: 1px solid #00ffff; color: #00ffff; cursor: pointer; padding: 10px 20px; font-size: 0.6rem; margin-top: 5px; box-shadow: 0 0 10px rgba(0,255,255,0.3); text-transform: uppercase;">INITIATE COMMS & AUDIO</button>
            </div>
            <div id="canvas-container" class="game-container-wrapper"></div>
        `;
        
        const initAudio = () => {
            this.audio.init();
            const btn = document.getElementById('init-audio');
            if (btn) btn.remove();
            window.removeEventListener('mousedown', initAudio);
            window.removeEventListener('touchstart', initAudio);
        };
        document.getElementById('init-audio')?.addEventListener('click', initAudio);
        window.addEventListener('mousedown', initAudio);
        window.addEventListener('touchstart', initAudio);

        this.scene = new THREE.Scene(); this.scene.background = new THREE.Color(0x000000); this.scene.fog = new THREE.Fog(0x3a005c, 10, 150);
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
        this.camera.position.set(0, 5, 12); this.camera.lookAt(0, 3, -30);
        this.renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
        this.renderer.autoClear = false; this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        // Force a low-resolution pixelated retro look
        const pixelSize = 0.25; // Even chunkier retro!
        this.renderer.setPixelRatio(pixelSize);
        // Ensure the canvas stretches to fill the screen without blurring using CSS
        this.renderer.domElement.style.imageRendering = 'pixelated';
        
        document.getElementById('canvas-container')!.appendChild(this.renderer.domElement);
        this.initScene(); this.loadModel(); this.initEvents(); this.animate();
        window.addEventListener('resize', () => this.onWindowResize());
    }

    private initScene() {
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
        const p1 = new THREE.PointLight(0x00ffff, 25, 100); p1.position.set(-20, 15, 10); this.scene.add(p1);
        const p2 = new THREE.PointLight(0xff00ff, 25, 100); p2.position.set(20, 15, 10); this.scene.add(p2);
        this.gridMaterial = new THREE.ShaderMaterial({ uniforms: { time: { value: 0 }, color: { value: new THREE.Color(0x00ffff) } }, vertexShader: GRID_VERTEX_SHADER, fragmentShader: GRID_FRAGMENT_SHADER, transparent: true });
        this.grid = new THREE.Mesh(new THREE.PlaneGeometry(800, 1200), this.gridMaterial);
        this.grid.rotation.x = -Math.PI / 2; this.grid.position.y = -5; this.scene.add(this.grid);
        const starPos = []; for(let i = 0; i < 6000; i++) starPos.push((Math.random()-0.5)*1000, (Math.random()-0.5)*1000, (Math.random()-0.5)*1000);
        const starGeo = new THREE.BufferGeometry(); starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
        this.stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.5, transparent: true, opacity: 0.6 })); this.scene.add(this.stars);
        for(let i = 0; i < 30; i++) this.createMountainRow(i * -30);
        for(let i = 0; i < 15; i++) this.createRing(i * -80);
        
        // Synthwave Sun
        const sunGeo = new THREE.CircleGeometry(120, 64);
        const sunMat = new THREE.ShaderMaterial({
            uniforms: {
                color1: { value: new THREE.Color(0xff0055) },
                color2: { value: new THREE.Color(0xffaa00) },
                audioPulse: { value: 0.0 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                varying vec2 vUv;
                uniform vec3 color1;
                uniform vec3 color2;
                uniform float audioPulse;
                void main() {
                    vec3 color = mix(color2, color1, vUv.y);
                    float slice = 1.0;
                    if (vUv.y < 0.5) {
                        float dist = 0.5 - vUv.y;
                        float thickness = 0.05 + dist * 0.15 + (audioPulse * 0.05);
                        slice = step(thickness, fract(vUv.y * 14.0 - (audioPulse * 2.0)));
                    }
                    if (slice < 0.5) discard;
                    
                    // Add a bright core glow when the beat hits
                    vec3 finalColor = color + (vec3(1.0, 1.0, 0.5) * audioPulse * 0.5);
                    gl_FragColor = vec4(finalColor, 1.0);
                }
            `,
            transparent: true,
            fog: false
        });
        const sun = new THREE.Mesh(sunGeo, sunMat);
        sun.name = "synthSun"; // Add a name so we can find it in the update loop
        sun.position.set(0, 40, -400);
        this.scene.add(sun);
    }

    private loadModel() {
        const loader = new GLTFLoader();
        loader.load('/spaceship_gltf/scene.gltf', (gltf: any) => {
            this.ship = gltf.scene; 
            if (!this.ship) return;
            this.ship.scale.set(0.12, 0.12, 0.12); 
            this.ship.rotation.y = Math.PI;
            this.ship.rotation.x = this.BASE_PITCH;
            
            const frontLight = new THREE.PointLight(0xffffff, 15, 20); frontLight.position.set(0, 5, -5); this.ship.add(frontLight);
            this.ship.traverse((child) => { 
                if ((child as THREE.Mesh).isMesh) { 
                    const mesh = child as THREE.Mesh;
                    // Synthwave dark metallic base
                    mesh.material = new THREE.MeshStandardMaterial({
                        color: 0x050110,
                        metalness: 0.9,
                        roughness: 0.1,
                        emissive: 0x110022,
                        emissiveIntensity: 0.5
                    });
                    
                    // Hot pink neon wireframe outlines
                    const edges = new THREE.EdgesGeometry(mesh.geometry);
                    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ 
                        color: 0xff00ff, 
                        transparent: true, 
                        opacity: 0.9 
                    }));
                    mesh.add(line);
                } 
            });
            const shieldGeo = new THREE.IcosahedronGeometry(14, 2);
            const shieldMat = new THREE.MeshBasicMaterial({ 
                color: 0x00ffff, 
                transparent: true, 
                opacity: 0.15, 
                wireframe: true 
            });
            this.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat); 
            // Give it a subtle glowing core
            const innerShieldGeo = new THREE.IcosahedronGeometry(13.5, 1);
            const innerShieldMat = new THREE.MeshBasicMaterial({
                color: 0xff00ff,
                transparent: true,
                opacity: 0.05,
                blending: THREE.AdditiveBlending
            });
            this.shieldMesh.add(new THREE.Mesh(innerShieldGeo, innerShieldMat));
            this.ship.add(this.shieldMesh);
            this.ship.position.set(0, 2, 0); this.scene.add(this.ship); 
        });
    }

    private createMountainRow(z: number) {
        const row = new THREE.Group();
        const mountMat = new THREE.MeshStandardMaterial({ color: 0x9d00ff, wireframe: true, transparent: true, opacity: 0.4, emissive: 0x9d00ff, emissiveIntensity: 0.8 });
        const mountGeo = new THREE.IcosahedronGeometry(25, 1);
        const left = new THREE.Mesh(mountGeo, mountMat); left.position.set(-100, 0, z); left.scale.y = 3; row.add(left);
        const right = new THREE.Mesh(mountGeo, mountMat); right.position.set(100, 0, z); right.scale.y = 3; row.add(right);
        this.scene.add(row); this.mountains.push(row);
    }

    private createRing(z: number) {
        const ringGeo = new THREE.TorusGeometry(30, 0.5, 8, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.3, fog: true });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.set(0, 10, z);
        
        // Add a brighter inner line
        const innerRingGeo = new THREE.TorusGeometry(30, 0.2, 8, 32);
        const innerRingMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, fog: true });
        const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
        ring.add(innerRing);
        
        this.scene.add(ring);
        this.rings.push(ring);
    }

    private spawnObstacle() {
        if (Math.random() > 0.06) return;
        const geo = new THREE.DodecahedronGeometry(1.8, 0); const obs = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x050110 }));
        obs.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0xff0055 })));
        obs.position.set((Math.random() - 0.5) * 40, Math.random() * 20 + 1, -250); (obs as any).rotationSpeed = { x: Math.random()*0.08, y: Math.random()*0.08, z: Math.random()*0.08 };
        this.scene.add(obs); this.obstacles.push(obs);
    }

    private takeDamage() {
        if (this.invulnerableTime > 0) return;
        this.shieldHealth--; this.invulnerableTime = 2.0; this.audio.playDamage();
        const bar = document.getElementById('shield-bar'); if (bar) bar.style.width = `${(this.shieldHealth / 5) * 100}%`;
        if(this.ship) { for (let i = 0; i < 40; i++) { const p = new Particle(this.ship.position, 0xff00ff); this.scene.add(p.mesh); this.particles.push(p); } }
        if (this.shieldHealth <= 0) this.gameOver();
    }

    private initEvents() {
        const move = (cx: number, cy: number) => {
            if (this.isGameOver || !this.ship) return;
            const x = (cx / window.innerWidth) * 2 - 1; 
            const y = -((cy / window.innerHeight) * 2 - 1);

            const aspect = window.innerWidth / window.innerHeight;
            const horizontalRange = aspect > 1 ? 14 : 7; // More narrow for portrait

            // Update targets for smooth lerping in the update loop
            this.targetShipX = x * horizontalRange; 
            this.targetShipY = (y + 1) * 5 + 1;

            this.targetShipRotZ = -x * 1.0;
            this.targetShipRotX = this.BASE_PITCH + 0.3; // Lock pitch to look good and prevent forward tilt
        };        
        window.addEventListener('mousemove', (e) => move(e.clientX, e.clientY));
        
        // Touch move
        window.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                move(e.touches[0].clientX, e.touches[0].clientY);
                e.preventDefault();
            }
        }, { passive: false });

        const shoot = () => {
            if (this.isGameOver || !this.ship) return;
            this.audio.playLaser();
            const b = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 2), new THREE.MeshBasicMaterial({ color: 0x00ffff }));
            b.position.copy(this.ship.position); this.scene.add(b); this.bullets.push(b);
        };

        window.addEventListener('mousedown', shoot);
        window.addEventListener('touchstart', (e) => {
            // Only shoot on initial touch if it's not a move
            if (e.touches.length === 1) {
                shoot();
                // Initialize movement on first touch
                move(e.touches[0].clientX, e.touches[0].clientY);
                e.preventDefault();
            }
        }, { passive: false });
    }

    private update() {
        if (this.isGameOver || !this.ship) return;
        const delta = this.clock.getDelta(); const elapsed = this.clock.getElapsedTime();

        // Get audio reactiveness
        const audioIntensity = this.audio.getAudioData();

        // Smoothly interpolate ship position and rotation
        const lerpSpeed = 5 * delta;
        this.ship.position.x = THREE.MathUtils.lerp(this.ship.position.x, this.targetShipX, lerpSpeed);
        this.ship.position.y = THREE.MathUtils.lerp(this.ship.position.y, this.targetShipY, lerpSpeed);
        this.ship.rotation.z = THREE.MathUtils.lerp(this.ship.rotation.z, this.targetShipRotZ, lerpSpeed);
        this.ship.rotation.x = THREE.MathUtils.lerp(this.ship.rotation.x, this.targetShipRotX, lerpSpeed);

        this.score += Math.floor(delta * 250); document.getElementById('game-score')!.innerText = this.score.toString();
        this.gridMaterial.uniforms.time.value = elapsed + audioIntensity * 0.5; // Grid speed responds to music

        // Dynamic speed based on audio
        const currentSpeed = this.speed + (audioIntensity * 0.8);
        
        // Pulse camera FOV to the beat
        this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, 75 + (audioIntensity * 10), lerpSpeed);
        this.camera.updateProjectionMatrix();

        // Update the sun shader with audio pulse
        const sunMesh = this.scene.getObjectByName("synthSun") as THREE.Mesh;
        if (sunMesh) {
            const mat = sunMesh.material as THREE.ShaderMaterial;
            mat.uniforms.audioPulse.value = audioIntensity;
        }

        this.stars.position.z += currentSpeed * 0.2; if(this.stars.position.z > 200) this.stars.position.z = 0;

        if (this.shieldMesh) {
            this.shieldMesh.rotation.x += delta * 0.5;
            this.shieldMesh.rotation.y += delta * 1.2;
            this.shieldMesh.rotation.z -= delta * 0.8;

            // Pulse the shield scale slightly + react to audio
            const scale = 1.0 + Math.sin(elapsed * 5) * 0.05 + (audioIntensity * 0.2);
            this.shieldMesh.scale.set(scale, scale, scale);
        }

        for (let i = this.particles.length-1; i>=0; i--) { this.particles[i].update(delta); if(this.particles[i].life<=0) { this.scene.remove(this.particles[i].mesh); this.particles.splice(i,1); } }
        if (this.invulnerableTime > 0) { this.invulnerableTime -= delta; this.ship.visible = Math.floor(elapsed * 15) % 2 === 0; } else { this.ship.visible = true; }

        this.mountains.forEach(m => { 
            m.position.z += currentSpeed * 2; 
            if (m.position.z > 100) m.position.z = -1000; 
            // Audio reactive mountains scaling
            const targetScaleY = 3 + (audioIntensity * 2.0);
            m.scale.y = THREE.MathUtils.lerp(m.scale.y, targetScaleY, lerpSpeed * 2);
        });

        this.rings.forEach(r => { 
            r.position.z += currentSpeed * 2; 
            if (r.position.z > 50) r.position.z = -1150; 

            // Rings react to the beat
            const targetScale = 1.0 + (audioIntensity * 0.4);
            r.scale.setScalar(THREE.MathUtils.lerp(r.scale.x, targetScale, lerpSpeed * 3));
        });

        this.bullets.forEach((b, i) => { b.position.z -= 10; if (b.position.z < -400) { this.scene.remove(b); this.bullets.splice(i, 1); } });
        this.spawnObstacle();
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i]; obs.position.z += currentSpeed * 3;
            const rot = (obs as any).rotationSpeed; obs.rotation.x += rot.x; obs.rotation.y += rot.y;
            const shipBox = new THREE.Box3().setFromObject(this.ship).expandByScalar(-0.3);
            const obsBox = new THREE.Box3().setFromObject(obs).expandByScalar(-0.1);
            if (shipBox.intersectsBox(obsBox)) this.takeDamage();
            for (let j = this.bullets.length - 1; j >= 0; j--) {
                if (new THREE.Box3().setFromObject(this.bullets[j]).intersectsBox(obsBox)) {
                    this.score += 2000; this.audio.playExplosion();
                    for(let k=0; k<30; k++) { const p = new Particle(obs.position, 0xff0055); this.scene.add(p.mesh); this.particles.push(p); }
                    this.scene.remove(obs); this.obstacles.splice(i, 1);
                    this.scene.remove(this.bullets[j]); this.bullets.splice(j, 1);
                    break;
                }
            }
            if (obs.position.z > 50) { this.scene.remove(obs); this.obstacles.splice(i, 1); }
        }
        this.speed += 0.0003;
    }
    private gameOver() { 
        if (this.isGameOver) return;
        this.isGameOver = true; 
        
        // Stop music and play game over voice
        this.audio.stopBGM();
        this.audio.playGameOverVoice();
        
        // Explode the ship
        if (this.ship) {
            this.audio.playExplosion();
            for(let i = 0; i < 60; i++) { 
                const p = new Particle(this.ship.position, 0xff00ff); 
                this.scene.add(p.mesh); 
                this.particles.push(p); 
            }
            this.ship.visible = false;
        }
        
        // Red fade effect
        this.renderer.autoClear = true; 
        this.scene.background = new THREE.Color(0x660000); 
        this.scene.fog = new THREE.Fog(0x660000, 1, 100); 

        // Wait for explosion particles to animate before showing UI
        setTimeout(() => {
            this.onGameOver(this.score);
        }, 2000);
    }

    public destroy() {
        // Cleanup resources to allow clean restart
        this.isGameOver = true;
        this.renderer.dispose();
        document.getElementById('canvas-container')?.innerHTML === '';
        window.removeEventListener('resize', this.onWindowResize);
        // We'd ideally clean up all ThreeJS geometries and materials here,
        // but for a simple reload, discarding the canvas is mostly sufficient.
    }
    private onWindowResize() { this.camera.aspect = window.innerWidth / window.innerHeight; this.camera.updateProjectionMatrix(); this.renderer.setSize(window.innerWidth, window.innerHeight); }
    private animate() {
        requestAnimationFrame(() => this.animate());
        this.update();
        
        // Retro motion blur / trailing effect
        if (!this.isGameOver) {
            this.renderer.autoClearColor = false;
            // The scene has a dark background, so drawing a slightly transparent 
            // black box over the entire screen gives it that trailing phosphor effect.
            // Using a scene background override approach to leave trails.
        } else {
            this.renderer.autoClearColor = true;
        }

        // Draw the main scene
        this.renderer.render(this.scene, this.camera);
        
        if (!this.isGameOver) {
            // Draw a semi-transparent quad to create the fade-out blur effect
            const ctx = this.renderer.getContext();
            ctx.enable(ctx.BLEND);
            ctx.blendFunc(ctx.SRC_ALPHA, ctx.ONE_MINUS_SRC_ALPHA);
            
            // To do this properly without WebGL context hacking in ThreeJS, 
            // we render a full screen quad with a basic material on top.
            if (!this.fadeScene) {
                this.fadeScene = new THREE.Scene();
                this.fadeCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
                const fadeMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0x0a001a, 
                    transparent: true, 
                    opacity: 0.15,
                    depthTest: false,
                    depthWrite: false
                });
                const fadePlane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), fadeMaterial);
                this.fadeScene.add(fadePlane);
            }
            
            // Render the fade plane over the previous frame
            this.renderer.render(this.fadeScene, this.fadeCamera!);
        }
    }
}
