import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

// ============================================================================
// CPU PERLIN NOISE & FRACTAL BROWNIAN MOTION (FBM)
// ============================================================================
class Vector2D {
    constructor(public x: number, public y: number) {}
    dot(other: Vector2D): number {
        return this.x * other.x + this.y * other.y;
    }
}

const CONSTANT_VECTORS: Vector2D[] = [
    new Vector2D(1.0, 1.0),
    new Vector2D(-1.0, 1.0),
    new Vector2D(-1.0, -1.0),
    new Vector2D(1.0, -1.0)
];

function shuffleArray(arrayToShuffle: number[]) {
    for (let e = arrayToShuffle.length - 1; e > 0; e--) {
        const index = Math.round(Math.random() * (e - 1));
        const temp = arrayToShuffle[e];
        arrayToShuffle[e] = arrayToShuffle[index];
        arrayToShuffle[index] = temp;
    }
}

function makePermutation(): number[] {
    const permutation: number[] = [];
    for (let i = 0; i < 256; i++) {
        permutation.push(i);
    }
    shuffleArray(permutation);
    for (let i = 0; i < 256; i++) {
        permutation.push(permutation[i]);
    }
    return permutation;
}

const Permutation = makePermutation();

function getConstantVector(v: number): Vector2D {
    return CONSTANT_VECTORS[v & 3];
}

function fade(t: number): number {
    return ((6 * t - 15) * t + 10) * t * t * t;
}

function lerp(t: number, a1: number, a2: number): number {
    return a1 + t * (a2 - a1);
}

export function noise2D(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;

    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    const topRight = new Vector2D(xf - 1.0, yf - 1.0);
    const topLeft = new Vector2D(xf, yf - 1.0);
    const bottomRight = new Vector2D(xf - 1.0, yf);
    const bottomLeft = new Vector2D(xf, yf);

    const valueTopRight = Permutation[Permutation[X + 1] + Y + 1];
    const valueTopLeft = Permutation[Permutation[X] + Y + 1];
    const valueBottomRight = Permutation[Permutation[X + 1] + Y];
    const valueBottomLeft = Permutation[Permutation[X] + Y];

    const dotTopRight = topRight.dot(getConstantVector(valueTopRight));
    const dotTopLeft = topLeft.dot(getConstantVector(valueTopLeft));
    const dotBottomRight = bottomRight.dot(getConstantVector(valueBottomRight));
    const dotBottomLeft = bottomLeft.dot(getConstantVector(valueBottomLeft));

    const u = fade(xf);
    const v = fade(yf);

    return lerp(
        u,
        lerp(v, dotBottomLeft, dotTopLeft),
        lerp(v, dotBottomRight, dotTopRight)
    );
}

export function fractalBrownianMotion(
    x: number,
    y: number,
    numOctaves = 6,
    startFrequency = 0.015
): number {
    let result = 0.0;
    let amplitude = 1.0;
    let frequency = startFrequency;

    for (let octave = 0; octave < numOctaves; octave++) {
        const n = amplitude * noise2D(x * frequency, y * frequency);
        result += n;
        amplitude *= 0.5;
        frequency *= 2.0;
    }

    return result;
}

interface BiomePalette {
    name: string;
    cardinal: string;
    subtitle: string;
    weather: string;
    flora: string;
    skyColor: number;
    fogColor: number;
    nebulaPrimary: number;
    nebulaSecondary: number;
    sunCore: number;
    sunHalo: number;
    planetOcean: number;
    planetLand: number;
    planetAtmo: number;
    ringColor: number;
    crystalColor: number;
}

const BIOMES: BiomePalette[] = [
    {
        name: "VERIDIA-9",
        cardinal: "N",
        subtitle: "OUTRUN SYNTHWAVE WORLD",
        weather: "NEON SOLAR SHIMMER",
        flora: "ORBITAL SYNTH CRYSTALS",
        skyColor: 0x050012,
        fogColor: 0x12022b,
        nebulaPrimary: 0xff007f,
        nebulaSecondary: 0x00f0ff,
        sunCore: 0xfff75e,
        sunHalo: 0xff007f,
        planetOcean: 0x140538,
        planetLand: 0xff007f,
        planetAtmo: 0x00f0ff,
        ringColor: 0x00f0ff,
        crystalColor: 0xff007f
    },
    {
        name: "CYBERIA PRIME",
        cardinal: "E",
        subtitle: "ELECTRIC CYAN SUPER-EARTH",
        weather: "IONIC LASER DRIFT",
        flora: "CHROME VOID SPIRES",
        skyColor: 0x030114,
        fogColor: 0x0c0428,
        nebulaPrimary: 0x7209b7,
        nebulaSecondary: 0x00f5d4,
        sunCore: 0xffbe0b,
        sunHalo: 0xf72585,
        planetOcean: 0x0b093b,
        planetLand: 0x00f5d4,
        planetAtmo: 0xffbe0b,
        ringColor: 0xf72585,
        crystalColor: 0x00f0ff
    },
    {
        name: "SOLARIS MIRAGE",
        cardinal: "S",
        subtitle: "SUNSET GOLD & MAGENTA EXOPLANET",
        weather: "RETROWAVE PLASMA BREEZE",
        flora: "ASTRAL MONOLITH FRAGMENTS",
        skyColor: 0x080014,
        fogColor: 0x1c0329,
        nebulaPrimary: 0xff0055,
        nebulaSecondary: 0xffbe0b,
        sunCore: 0xfff75e,
        sunHalo: 0xff0055,
        planetOcean: 0x24042e,
        planetLand: 0xffbe0b,
        planetAtmo: 0xff007f,
        ringColor: 0x00f0ff,
        crystalColor: 0xffbe0b
    },
    {
        name: "ASTRAL ELYSIUM",
        cardinal: "W",
        subtitle: "ULTRAVIOLET DREAMWAVE GIANT",
        weather: "VELVET SYNTH WAVES",
        flora: "AMETHYST SPACE CORAL",
        skyColor: 0x040010,
        fogColor: 0x100326,
        nebulaPrimary: 0x9d4edd,
        nebulaSecondary: 0x00f0ff,
        sunCore: 0xffea79,
        sunHalo: 0xb5179e,
        planetOcean: 0x10002b,
        planetLand: 0xe0aaff,
        planetAtmo: 0x00f5d4,
        ringColor: 0xff007f,
        crystalColor: 0x00f5d4
    }
];

interface CameraPreset {
    name: string;
    localOffset: THREE.Vector3;
    lookAheadDist: number;
    lookUpOffset: number;
    bankFactor: number;
    baseFov: number;
}

const CAMERA_PRESETS: CameraPreset[] = [
    {
        name: "LOW CHASE",
        localOffset: new THREE.Vector3(0, 1.45, 7.4),
        lookAheadDist: 42,
        lookUpOffset: 1.5,
        bankFactor: 0.32,
        baseFov: 68
    },
    {
        name: "WING CAM",
        localOffset: new THREE.Vector3(3.1, 1.25, 5.8),
        lookAheadDist: 38,
        lookUpOffset: 1.1,
        bankFactor: 0.42,
        baseFov: 66
    },
    {
        name: "CLOSE TAIL",
        localOffset: new THREE.Vector3(0, 0.9, 4.8),
        lookAheadDist: 48,
        lookUpOffset: 1.2,
        bankFactor: 0.48,
        baseFov: 74
    },
    {
        name: "WIDE VISTA",
        localOffset: new THREE.Vector3(-2.6, 3.8, 12.0),
        lookAheadDist: 45,
        lookUpOffset: 1.8,
        bankFactor: 0.2,
        baseFov: 62
    }
];

interface PlanetNode {
    group: THREE.Group;
    mesh: THREE.Mesh;
    material: THREE.ShaderMaterial;
    ring: THREE.Mesh;
    moonPivot: THREE.Group;
    moon: THREE.Mesh;
    biomeIdx: number;
    discoveredCount: number;
}

interface AIPlayer {
    group: THREE.Group;
    nameSprite: THREE.Sprite;
    callsign: string;
    status: string;
    colorHex: number;
    yaw: number;
    targetYaw: number;
    roll: number;
    pitch: number;
    speed: number;
    targetY: number;
    decisionTimer: number;
    beamCooldown: number;
}

const DEFAULT_TRAVELLER_PROFILES: { callsign: string; status: string; colorHex: number }[] = [
    { callsign: 'ASTRA_99', status: 'SCANNING', colorHex: 0x00f0ff },
    { callsign: 'VALKYRIE_SE', status: 'WARP DRIFT', colorHex: 0xffbe6b },
    { callsign: 'NOVA_DRIFTER', status: 'EXPLORING', colorHex: 0x00f5d4 },
    { callsign: 'KRONOS_VII', status: 'HARVESTING', colorHex: 0xc77dff },
    { callsign: 'LYRA_SYNTH', status: 'CRUISING', colorHex: 0xff5e7e },
    { callsign: 'ORION_PULSE', status: 'MAPPING', colorHex: 0x72efdd },
    { callsign: 'ZEPHYR_01', status: 'PATROLLING', colorHex: 0xff2a9d }
];

class AmbientAudio {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private reverbNode: ConvolverNode | null = null;
    private isMuted = false;
    private isRunning = false;
    private chordTimer: number | null = null;
    private arpTimer: number | null = null;
    private bassTimer: number | null = null;
    private chordIndex = 0;
    private bassStep = 0;

    private readonly chords: { root: number; notes: number[] }[] = [
        { root: 55.00, notes: [110.00, 164.81, 220.00, 261.63, 329.63] },
        { root: 43.65, notes: [87.31, 174.61, 220.00, 261.63, 329.63] },
        { root: 65.41, notes: [130.81, 196.00, 246.94, 293.66, 392.00] },
        { root: 49.00, notes: [98.00, 196.00, 246.94, 293.66, 369.99] }
    ];

    private readonly scaleNotes: number[] = [
        440.00, 523.25, 587.33, 659.25, 783.99, 880.00, 987.77, 1046.50, 1174.66
    ];

    public async init() {
        if (this.ctx) {
            if (this.ctx.state === 'suspended') await this.ctx.resume();
            return;
        }
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioCtx();
        if (this.ctx.state === 'suspended') {
            await this.ctx.resume();
        }

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.01, this.ctx.currentTime);
        this.masterGain.gain.linearRampToValueAtTime(0.36, this.ctx.currentTime + 2.0);

        this.reverbNode = this.createReverb(4.5, 2.0);

        const dryGain = this.ctx.createGain();
        dryGain.gain.value = 0.52;
        const wetGain = this.ctx.createGain();
        wetGain.gain.value = 0.72;

        this.masterGain.connect(dryGain);
        this.masterGain.connect(this.reverbNode);
        this.reverbNode.connect(wetGain);

        dryGain.connect(this.ctx.destination);
        wetGain.connect(this.ctx.destination);

        this.isRunning = true;
        this.startPadLoop();
        this.startChillBassPulse();
        this.startDreamArp();
    }

    private createReverb(duration: number, decay: number): ConvolverNode {
        const ctx = this.ctx!;
        const rate = ctx.sampleRate;
        const length = rate * duration;
        const impulse = ctx.createBuffer(2, length, rate);
        for (let ch = 0; ch < 2; ch++) {
            const data = impulse.getChannelData(ch);
            for (let i = 0; i < length; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
            }
        }
        const convolver = ctx.createConvolver();
        convolver.buffer = impulse;
        return convolver;
    }

    private startPadLoop() {
        const playNextChord = () => {
            if (!this.ctx || !this.masterGain || !this.isRunning) return;
            const current = this.chords[this.chordIndex % this.chords.length];
            this.chordIndex++;

            const now = this.ctx.currentTime;
            const duration = 8.5;

            current.notes.forEach((freq, idx) => {
                if (!this.ctx || !this.masterGain) return;
                const osc1 = this.ctx.createOscillator();
                const osc2 = this.ctx.createOscillator();
                const filter = this.ctx.createBiquadFilter();
                const gain = this.ctx.createGain();

                osc1.type = 'sawtooth';
                osc2.type = 'triangle';

                osc1.frequency.setValueAtTime(freq * 0.997, now);
                osc2.frequency.setValueAtTime(freq * 1.004, now);

                filter.type = 'lowpass';
                filter.Q.value = 1.2;
                filter.frequency.setValueAtTime(280 + idx * 90, now);
                filter.frequency.exponentialRampToValueAtTime(950 + idx * 130, now + duration * 0.48);
                filter.frequency.exponentialRampToValueAtTime(300 + idx * 80, now + duration);

                const peakGain = 0.032 / Math.sqrt(idx + 1);
                gain.gain.setValueAtTime(0.0001, now);
                gain.gain.linearRampToValueAtTime(peakGain, now + duration * 0.3);
                gain.gain.linearRampToValueAtTime(peakGain * 0.85, now + duration * 0.7);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

                osc1.connect(filter);
                osc2.connect(filter);
                filter.connect(gain);
                gain.connect(this.masterGain);

                osc1.start(now);
                osc2.start(now);
                osc1.stop(now + duration + 0.1);
                osc2.stop(now + duration + 0.1);
            });
        };

        playNextChord();
        this.chordTimer = window.setInterval(playNextChord, 7200);
    }

    private startChillBassPulse() {
        const stepMs = 325;
        this.bassTimer = window.setInterval(() => {
            if (!this.ctx || !this.masterGain || !this.isRunning || this.isMuted) return;
            const currentChord = this.chords[(this.chordIndex - 1 + this.chords.length) % this.chords.length];
            const pattern = [1, 1, 2, 1, 1, 1.5, 1, 2];
            const mult = pattern[this.bassStep % pattern.length];
            this.bassStep++;

            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const filter = this.ctx.createBiquadFilter();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(currentChord.root * mult, now);

            filter.type = 'lowpass';
            filter.Q.value = 2.0;
            filter.frequency.setValueAtTime(360, now);
            filter.frequency.exponentialRampToValueAtTime(110, now + 0.26);

            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(0.042, now + 0.025);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.29);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);

            osc.start(now);
            osc.stop(now + 0.31);
        }, stepMs);
    }

    private startDreamArp() {
        let arpIdx = 0;
        const arpPattern = [0, 2, 4, 7, 4, 2, 5, 4];
        const scheduleArp = () => {
            if (!this.isRunning) return;
            // Classic 80s Outrun rhythmic 16th/8th-note synthwave arpeggiator
            const delay = 325;
            this.arpTimer = window.setTimeout(() => {
                if (this.ctx && this.masterGain && !this.isMuted) {
                    const noteIdx = arpPattern[arpIdx % arpPattern.length];
                    arpIdx++;
                    const note = this.scaleNotes[noteIdx % this.scaleNotes.length];
                    const octaveShift = arpIdx % 16 === 0 ? 1.0 : 0.5;
                    this.playSynthPluck(note * octaveShift, 0.026, 0.95);
                }
                scheduleArp();
            }, delay);
        };
        scheduleArp();
    }

    private playSynthPluck(freq: number, volume: number, duration: number) {
        if (!this.ctx || !this.masterGain) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1800, now);
        filter.frequency.exponentialRampToValueAtTime(400, now + duration);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(volume, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + duration + 0.05);
    }

    public playHarvestChime() {
        if (!this.ctx || !this.masterGain) return;
        const note = this.scaleNotes[Math.floor(Math.random() * this.scaleNotes.length)];
        this.playSynthPluck(note, 0.07, 1.6);
        setTimeout(() => this.playSynthPluck(note * 1.25, 0.045, 1.9), 85);
    }

    public playPortalChord() {
        if (!this.ctx || !this.masterGain) return;
        const base = [440.00, 523.25, 659.25, 783.99, 987.77];
        base.forEach((n, i) => {
            setTimeout(() => this.playSynthPluck(n, 0.055, 2.8), i * 70);
        });
    }

    public playBeamPulse() {
        if (!this.ctx || !this.masterGain) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(659.25, now);
        osc.frequency.exponentialRampToValueAtTime(329.63, now + 0.22);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.045, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.28);
    }

    public playScannerWave() {
        if (!this.ctx || !this.masterGain) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 1.0);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.055, now + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 1.15);
    }

    public toggleMute(): boolean {
        if (!this.ctx || !this.masterGain) {
            this.init();
            return false;
        }
        this.isMuted = !this.isMuted;
        const now = this.ctx.currentTime;
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.linearRampToValueAtTime(this.isMuted ? 0.0 : 0.36, now + 0.35);
        return this.isMuted;
    }

    public destroy() {
        this.isRunning = false;
        if (this.chordTimer) clearInterval(this.chordTimer);
        if (this.arpTimer) clearTimeout(this.arpTimer);
        if (this.bassTimer) clearInterval(this.bassTimer);
        if (this.ctx) {
            this.ctx.close().catch(() => {});
        }
    }
}

// ============================================================================
// TRUE DEEP-SPACE SKYBOX SHADER (Seamless Triplanar /perlin.png — ZERO flicker!)
// Mostly pitch-black cosmic void with subtle Milky Way nebula wisps & dark dust lanes
// ============================================================================
const NEBULA_VERTEX_SHADER = `
varying vec3 vWorldDir;
void main() {
    vWorldDir = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const NEBULA_FRAGMENT_SHADER = `
varying vec3 vWorldDir;
uniform sampler2D uPerlinTex;
uniform vec3 skyColor;
uniform vec3 nebulaPrimary;
uniform vec3 nebulaSecondary;

// Seamless 3D triplanar sampling on unit sphere direction — no atan() seam or mipmap flicker!
float sampleSeamlessPerlin(vec3 dir, float scale) {
    vec3 weights = abs(dir);
    weights = pow(weights, vec3(4.0));
    weights /= (weights.x + weights.y + weights.z + 0.0001);

    float xy = texture2D(uPerlinTex, dir.xy * scale + 0.5).r;
    float yz = texture2D(uPerlinTex, dir.yz * scale + 0.5).r;
    float zx = texture2D(uPerlinTex, dir.zx * scale + 0.5).r;
    return xy * weights.z + yz * weights.x + zx * weights.y;
}

void main() {
    vec3 dir = normalize(vWorldDir);

    // Multi-octave Perlin FBM across the 3D sphere
    float n1 = sampleSeamlessPerlin(dir, 0.85);
    float n2 = sampleSeamlessPerlin(dir + vec3(n1 * 0.22), 1.9);
    float n3 = sampleSeamlessPerlin(dir - vec3(n2 * 0.18), 3.8);
    float fbm = n1 * 0.55 + n2 * 0.30 + n3 * 0.15;

    // Tilted Milky Way galactic plane mask + Outrun Synthwave Horizon Aura
    float galacticPlane = exp(-abs(dir.y * 0.85 + dir.x * 0.35 - 0.08) * 2.8);
    float horizonGlow = exp(-abs(dir.y) * 5.2);
    float localClusters = smoothstep(0.54, 0.84, fbm);
    float nebulaIntensity = clamp(galacticPlane * smoothstep(0.38, 0.76, fbm) + localClusters * 0.55, 0.0, 1.0);

    // Dark cosmic dust lanes carved out of the nebula band
    float dustLane = smoothstep(0.44, 0.56, abs(n2 - 0.5) * 2.0);

    vec3 col = skyColor;
    // Synthwave ultraviolet-magenta horizon band
    col += mix(nebulaPrimary, nebulaSecondary, 0.25) * horizonGlow * 0.32;
    // Vibrant hot-magenta / violet Perlin nebula clouds
    col += nebulaPrimary * pow(nebulaIntensity, 1.35) * dustLane * 0.88;
    // Electric cyan / sunset gold ionized star-forming filaments
    float filament = smoothstep(0.56, 0.82, n2 * n3 * 2.05) * nebulaIntensity;
    col += nebulaSecondary * filament * 1.15;

    gl_FragColor = vec4(col, 1.0);
}
`;

// ============================================================================
// INFINITE NON-POPPING 3D STARFIELD SHADER
// Each star wraps individually in a 1600-unit cube around the ship with smooth edge fade
// ============================================================================
const STARFIELD_VERTEX_SHADER = `
attribute vec3 color;
attribute float aSize;
varying vec3 vColor;
varying float vAlpha;
uniform vec3 uShipPos;

void main() {
    vColor = color;
    float boxSize = 1600.0;
    float halfBox = 800.0;

    // Wrap each star smoothly relative to the ship so the starfield never snaps or flickers
    vec3 relPos = mod(position - uShipPos + halfBox, boxSize) - halfBox;
    vec3 worldPos = uShipPos + relPos;

    float dist = length(relPos);
    vAlpha = smoothstep(790.0, 450.0, dist);

    vec4 mvPos = modelViewMatrix * vec4(worldPos, 1.0);
    gl_Position = projectionMatrix * mvPos;
    gl_PointSize = clamp(aSize * (320.0 / max(-mvPos.z, 10.0)), 1.0, 4.5);
}
`;

const STARFIELD_FRAGMENT_SHADER = `
varying vec3 vColor;
varying float vAlpha;

void main() {
    vec2 c = gl_PointCoord - vec2(0.5);
    float r = length(c) * 2.0;
    if (r > 1.0) discard;
    float glow = pow(1.0 - r, 1.8);
    gl_FragColor = vec4(vColor, glow * vAlpha);
}
`;

// ============================================================================
// SOFT 3D VOLUMETRIC NEBULA CLOUD PUFF SHADER (Billboarded in 3D space — zero grid/plane flicker!)
// ============================================================================
const NEBULA_PUFF_VERTEX_SHADER = `
varying vec2 vUv;
varying float vDist;
void main() {
    vUv = uv;
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vDist = -mvPos.z;
    gl_Position = projectionMatrix * mvPos;
}
`;

const NEBULA_PUFF_FRAGMENT_SHADER = `
varying vec2 vUv;
varying float vDist;
uniform sampler2D uPerlinTex;
uniform vec3 puffColor1;
uniform vec3 puffColor2;
uniform float seedOffset;

void main() {
    vec2 centered = vUv - vec2(0.5);
    float r = length(centered) * 2.0;
    if (r > 1.0) discard;

    // Smooth radial mask so the cloud puff has zero hard edges
    float radialMask = pow(1.0 - r, 2.4);

    float n1 = texture2D(uPerlinTex, vUv * 1.4 + vec2(seedOffset, seedOffset * 0.7)).r;
    float n2 = texture2D(uPerlinTex, vUv * 2.8 - vec2(seedOffset * 0.5, n1 * 0.2)).r;
    float wisp = n1 * 0.6 + n2 * 0.4;

    float cloudAlpha = smoothstep(0.32, 0.78, wisp) * radialMask;
    vec3 col = mix(puffColor1, puffColor2, smoothstep(0.45, 0.75, n2));

    // Distance fade so puffs never pop when near camera or far away
    float depthFade = smoothstep(750.0, 220.0, vDist) * smoothstep(8.0, 45.0, vDist);

    gl_FragColor = vec4(col, cloudAlpha * depthFade * 0.28);
}
`;

// ============================================================================
// 3D PLANET SHADER (Uses /perlin.png for displacement, continents, clouds & specular reflection)
// ============================================================================
const PLANET_VERTEX_SHADER = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewDir;
varying float vHeight;
uniform sampler2D uPerlinTex;
uniform float time;

void main() {
    vUv = uv;
    float h1 = texture2D(uPerlinTex, uv * 1.8 + vec2(time * 0.008, 0.0)).r;
    float h2 = texture2D(uPerlinTex, uv * 4.2 - vec2(time * 0.004, 0.0)).r;
    float height = h1 * 0.7 + h2 * 0.3;
    vHeight = height;

    vec3 displaced = position + normal * (smoothstep(0.45, 0.8, height) * 3.2);
    vec4 mvPos = modelViewMatrix * vec4(displaced, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewDir = normalize(-mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
}
`;

const PLANET_FRAGMENT_SHADER = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewDir;
varying float vHeight;
uniform sampler2D uPerlinTex;
uniform float time;
uniform vec3 oceanColor;
uniform vec3 landColor;
uniform vec3 atmoColor;

void main() {
    float landMask = smoothstep(0.48, 0.54, vHeight);
    float highlandMask = smoothstep(0.62, 0.78, vHeight);
    float coastGlow = smoothstep(0.05, 0.0, abs(vHeight - 0.50));

    float clouds = texture2D(uPerlinTex, vUv * 2.5 + vec2(-time * 0.018, time * 0.005)).r;
    float cloudMask = smoothstep(0.58, 0.82, clouds);

    vec3 surfaceCol = mix(oceanColor, landColor, landMask);
    surfaceCol = mix(surfaceCol, atmoColor, highlandMask * 0.55);
    surfaceCol += atmoColor * coastGlow * 1.25;

    // Iconic Synthwave holographic latitude/longitude topo-grid lines across the planet
    float latLine = smoothstep(0.93, 0.98, abs(sin(vUv.y * 62.8318)));
    float lonLine = smoothstep(0.93, 0.98, abs(sin(vUv.x * 62.8318)));
    float synthGrid = max(latLine, lonLine);
    surfaceCol += mix(atmoColor, landColor, landMask) * synthGrid * 0.45;

    surfaceCol = mix(surfaceCol, vec3(1.0, 0.92, 1.0), cloudMask * 0.42);

    vec3 lightDir = normalize(vec3(0.4, 0.6, 0.7));
    float diff = max(dot(vNormal, lightDir), 0.24);

    vec3 halfVec = normalize(lightDir + vViewDir);
    float spec = pow(max(dot(vNormal, halfVec), 0.0), 28.0) * (1.0 - landMask);

    float fresnel = pow(1.0 - max(dot(vNormal, vViewDir), 0.0), 2.2);

    vec3 finalCol = surfaceCol * diff + atmoColor * spec * 1.1 + atmoColor * fresnel * 1.65;
    gl_FragColor = vec4(finalCol, 1.0);
}
`;

class MoteParticle {
    mesh: THREE.Mesh;
    velocity: THREE.Vector3;
    life = 1.0;
    homingTarget: THREE.Object3D | null;

    constructor(pos: THREE.Vector3, color: number, homingTarget: THREE.Object3D | null = null, size = 0.26) {
        this.mesh = new THREE.Mesh(
            new THREE.OctahedronGeometry(size, 0),
            new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 })
        );
        this.mesh.position.copy(pos);
        this.homingTarget = homingTarget;
        this.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.45,
            (Math.random() - 0.5) * 0.45 + 0.12,
            (Math.random() - 0.5) * 0.45
        );
    }

    update(delta: number): boolean {
        if (this.homingTarget) {
            const targetPos = this.homingTarget.position;
            const dir = new THREE.Vector3().subVectors(targetPos, this.mesh.position);
            const dist = dir.length();
            if (dist < 1.8) {
                return false;
            }
            dir.normalize().multiplyScalar(delta * 28.0);
            this.velocity.lerp(dir, 0.18);
        }
        this.mesh.position.add(this.velocity);
        this.life -= delta * (this.homingTarget ? 0.65 : 1.35);
        (this.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, this.life);
        this.mesh.scale.setScalar(Math.max(0.01, this.life));
        return this.life > 0;
    }
}

export class Game {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private composer!: EffectComposer;
    private bloomPass!: UnrealBloomPass;
    private pmremGenerator!: THREE.PMREMGenerator;
    private envRT: THREE.WebGLRenderTarget | null = null;
    private clock: THREE.Clock;

    private score = 0;
    private mineralsHarvested = 0;
    private worldsExplored = 0;
    private isDestroyed = false;

    private baseSpeed = 42.0;
    private speedMultiplier = 1.0;
    private portalBoost = 0.0;

    // 360-degree WASD Navigation State
    private shipYaw = 0;
    private targetYaw = 0;
    private shipRoll = 0;
    private shipPitch = 0.04;
    private targetShipY = 3.6;
    private readonly MODEL_LEVEL_PITCH = 0.08;
    private keysPressed: Record<string, boolean> = {};

    private ship: THREE.Object3D | null = null;
    private shieldMesh: THREE.Mesh | null = null;
    private perlinTexture!: THREE.Texture;
    private nebulaDome!: THREE.Mesh;
    private nebulaMaterial!: THREE.ShaderMaterial;
    private starfieldMaterial!: THREE.ShaderMaterial;
    private sunMesh!: THREE.Mesh;
    private sunMaterial!: THREE.ShaderMaterial;

    private planets: PlanetNode[] = [];
    private aiPlayers: AIPlayer[] = [];
    private leaderboardPilotNames: string[] = [];
    private mmoFeedTimer = 2.5;
    private pendingReplyTimeout: number | null = null;
    private nebulaPuffs: THREE.Mesh[] = [];
    private crystals: THREE.Group[] = [];
    private asteroids: THREE.Mesh[] = [];
    private pulses: { mesh: THREE.Mesh; dir: THREE.Vector3; life: number }[] = [];
    private particles: MoteParticle[] = [];
    private rings: THREE.Mesh[] = [];
    private stars!: THREE.Points;

    private cameraPresetIdx = 0;
    private lookAtTarget = new THREE.Vector3(0, 3.5, -45);

    private currentBiomeIdx = 0;
    private targetBiome: BiomePalette = BIOMES[0];
    private currentSkyColor = new THREE.Color(BIOMES[0].skyColor);
    private currentFogColor = new THREE.Color(BIOMES[0].fogColor);
    private currentNebulaPrimary = new THREE.Color(BIOMES[0].nebulaPrimary);
    private currentNebulaSecondary = new THREE.Color(BIOMES[0].nebulaSecondary);
    private currentSunCore = new THREE.Color(BIOMES[0].sunCore);
    private currentSunHalo = new THREE.Color(BIOMES[0].sunHalo);

    private audio = new AmbientAudio();
    private onGameOver: (score: number) => void;
    private resizeHandler = () => this.onWindowResize();

    constructor(container: HTMLElement, onGameOver: (score: number) => void) {
        this.onGameOver = onGameOver;
        this.clock = new THREE.Clock();

        container.innerHTML = `
            <div id="game-ui">
                <div class="hud-top-bar">
                    <div class="hud-stat">
                        <span class="hud-label">DISCOVERY UNITS</span>
                        <span id="game-score" class="hud-value">0</span>
                    </div>
                    <div class="hud-divider"></div>
                    <div class="hud-stat">
                        <span class="hud-label">WORLDS DISCOVERED</span>
                        <span id="mineral-count" class="hud-value">0</span>
                    </div>
                    <div class="hud-divider"></div>
                    <div class="hud-stat">
                        <span class="hud-label">NEAREST WORLD</span>
                        <span id="system-name" class="hud-value">VERIDIA-9 [N]</span>
                    </div>
                </div>
                <div class="compass-bar">
                    <span id="compass-readout" class="compass-heading">HDG: N 000°</span>
                    <span class="compass-hint">WASD: TURN & THRUST (N/E/S/W)  •  MOUSE: PITCH & STEER</span>
                    <span id="mmo-online-count" class="mmo-online-badge">● 8 TRAVELLERS IN SECTOR</span>
                </div>
                <div class="harmony-bar-wrap" title="Planetary Approach Progress">
                    <div id="shield-bar" style="width: 0%;"></div>
                </div>
            </div>

            <div id="mmo-chat-panel">
                <div class="mmo-chat-header">
                    <span>SUBSPACE COMMS // SECTOR CHAT</span>
                    <span class="chat-live-dot">● LIVE</span>
                </div>
                <div id="mmo-chat-messages" class="mmo-chat-messages">
                    <div class="chat-msg system-event">✦ Connected to Synthwave Relay [Sector 84-A]</div>
                </div>
                <div class="mmo-chat-input-row">
                    <input id="mmo-chat-input" type="text" maxlength="110" placeholder="Transmit to sector [ENTER]..." autocomplete="off" />
                    <button id="mmo-chat-send" type="button">SEND</button>
                </div>
            </div>

            <div id="discovery-banner">
                <div class="discovery-tag">ATLAS // PLANET DISCOVERED (+1,500 UNITS)</div>
                <div id="banner-planet" class="discovery-planet">VERIDIA-9</div>
                <div id="banner-meta" class="discovery-meta">SYNTHWAVE BIOLUMINESCENT WORLD // WEATHER: ZERO-G SOLAR SHIMMER</div>
            </div>

            <div id="flight-controls-bar">
                <button id="mode-drift" class="hud-pill-btn" title="Slow meditative flight [1]">DRIFT</button>
                <button id="mode-cruise" class="hud-pill-btn active" title="Balanced exploration flight [2]">CRUISE</button>
                <button id="mode-pulse" class="hud-pill-btn" title="Fast low-altitude flight [3]">PULSE</button>
                <button id="btn-cam" class="hud-pill-btn" title="Cycle Spaceship Camera Angle [C]">CAM: LOW CHASE</button>
                <button id="btn-scan" class="hud-pill-btn" title="Scan nebula & crystals [SPACE]">SCAN</button>
                <button id="btn-warp" class="hud-pill-btn" title="Hyperjump forward [SHIFT / H]">HYPERJUMP</button>
                <button id="btn-audio" class="hud-pill-btn" title="Toggle Dreamwave Synth">SYNTH: ON</button>
            </div>

            <div id="canvas-container" class="game-container-wrapper"></div>
        `;

        this.scene = new THREE.Scene();
        this.scene.background = this.currentSkyColor.clone();
        this.scene.fog = new THREE.FogExp2(this.currentFogColor.getHex(), 0.0008);

        // Increase near plane to 0.5 for 24-bit depth buffer precision (prevents distant Z-fighting flicker!)
        this.camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.5, 2800);
        this.camera.rotation.order = 'YXZ';
        this.camera.position.set(0, 4.9, 7.2);
        this.camera.lookAt(0, 5.2, -45);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.25;

        // True Neon Synthwave Bloom Post-Processing Pipeline
        this.composer = new EffectComposer(this.renderer);
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);

        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.72,  // strength: lush neon synthwave halation
            0.55,  // radius: soft outrun glow
            0.58   // threshold: only neon highlights, sun, lasers & crystals bloom
        );
        this.composer.addPass(this.bloomPass);
        this.composer.addPass(new OutputPass());

        this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        this.pmremGenerator.compileCubemapShader();

        document.getElementById('canvas-container')!.appendChild(this.renderer.domElement);

        this.initScene();
        this.updateEnvironmentReflections(BIOMES[0]);
        this.loadModel();
        this.initEvents();
        this.animate();

        window.addEventListener('resize', this.resizeHandler);
    }

    public getScore(): number {
        return this.score;
    }

    public uploadDiscoveries() {
        this.onGameOver(this.score);
    }

    public cycleCameraPreset() {
        this.cameraPresetIdx = (this.cameraPresetIdx + 1) % CAMERA_PRESETS.length;
        const preset = CAMERA_PRESETS[this.cameraPresetIdx];
        const btn = document.getElementById('btn-cam');
        if (btn) btn.textContent = `CAM: ${preset.name}`;
    }

    private getForwardVector(): THREE.Vector3 {
        return new THREE.Vector3(
            -Math.sin(this.shipYaw) * Math.cos(this.shipPitch),
            Math.sin(this.shipPitch),
            -Math.cos(this.shipYaw) * Math.cos(this.shipPitch)
        ).normalize();
    }

    private formatCompassHeading(yawRad: number): string {
        const deg = (((-yawRad * 180) / Math.PI) % 360 + 360) % 360;
        const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        const idx = Math.round(deg / 45) % 8;
        return `HDG: ${dirs[idx]} ${Math.round(deg).toString().padStart(3, '0')}°`;
    }

    private updateEnvironmentReflections(biome: BiomePalette) {
        const envScene = new THREE.Scene();
        envScene.background = new THREE.Color(biome.skyColor);

        const topGlow = new THREE.Mesh(
            new THREE.SphereGeometry(40, 16, 16),
            new THREE.MeshBasicMaterial({ color: biome.nebulaSecondary, side: THREE.BackSide })
        );
        topGlow.position.set(0, 35, -30);
        envScene.add(topGlow);

        const bottomNebulaGlow = new THREE.Mesh(
            new THREE.SphereGeometry(45, 16, 16),
            new THREE.MeshBasicMaterial({ color: biome.nebulaPrimary, side: THREE.BackSide })
        );
        bottomNebulaGlow.position.set(0, -35, 0);
        envScene.add(bottomNebulaGlow);

        const sunReflectDisc = new THREE.Mesh(
            new THREE.SphereGeometry(25, 16, 16),
            new THREE.MeshBasicMaterial({ color: biome.sunCore })
        );
        sunReflectDisc.position.set(0, 15, -60);
        envScene.add(sunReflectDisc);

        const sideRibbon1 = new THREE.Mesh(
            new THREE.SphereGeometry(22, 12, 12),
            new THREE.MeshBasicMaterial({ color: biome.ringColor })
        );
        sideRibbon1.position.set(-50, 10, 0);
        envScene.add(sideRibbon1);

        const sideRibbon2 = new THREE.Mesh(
            new THREE.SphereGeometry(22, 12, 12),
            new THREE.MeshBasicMaterial({ color: biome.sunHalo })
        );
        sideRibbon2.position.set(50, 10, 0);
        envScene.add(sideRibbon2);

        if (this.envRT) {
            this.envRT.dispose();
        }
        this.envRT = this.pmremGenerator.fromScene(envScene, 0.04);
        this.scene.environment = this.envRT.texture;
    }

    private showDiscoveryBanner(biome: BiomePalette) {
        const banner = document.getElementById('discovery-banner');
        const planetEl = document.getElementById('banner-planet');
        const metaEl = document.getElementById('banner-meta');

        if (planetEl) planetEl.textContent = biome.name;
        if (metaEl) metaEl.textContent = `${biome.subtitle}  •  SECTOR: ${biome.cardinal}  •  WEATHER: ${biome.weather}`;

        if (banner) {
            banner.classList.add('visible');
            setTimeout(() => {
                banner.classList.remove('visible');
            }, 6000);
        }
    }

    public hyperjumpForward() {
        this.portalBoost = 65.0;
        this.audio.playPortalChord();
    }

    private createPlanetNode(biomeIdx: number, worldPos: THREE.Vector3): PlanetNode {
        const biome = BIOMES[biomeIdx % BIOMES.length];
        const group = new THREE.Group();
        group.position.copy(worldPos);

        const planetGeo = new THREE.SphereGeometry(58, 64, 64);
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uPerlinTex: { value: this.perlinTexture },
                time: { value: 0 },
                oceanColor: { value: new THREE.Color(biome.planetOcean) },
                landColor: { value: new THREE.Color(biome.planetLand) },
                atmoColor: { value: new THREE.Color(biome.planetAtmo) }
            },
            vertexShader: PLANET_VERTEX_SHADER,
            fragmentShader: PLANET_FRAGMENT_SHADER
        });
        const mesh = new THREE.Mesh(planetGeo, material);
        group.add(mesh);

        const ringGeo = new THREE.RingGeometry(76, 132, 72);
        const ringMat = new THREE.MeshBasicMaterial({
            color: biome.ringColor,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.48,
            fog: false
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI * (0.36 + (biomeIdx % 3) * 0.06);
        ring.rotation.y = (biomeIdx % 2 === 0 ? -1 : 1) * 0.28;
        group.add(ring);

        const moonPivot = new THREE.Group();
        const moonGeo = new THREE.IcosahedronGeometry(11, 3);
        const posAttr = moonGeo.attributes.position;
        for (let i = 0; i < posAttr.count; i++) {
            const vx = posAttr.getX(i);
            const vy = posAttr.getY(i);
            const vz = posAttr.getZ(i);
            const disp = 1.0 + fractalBrownianMotion(vx + 50, vy + vz + 50, 4, 0.08) * 0.16;
            posAttr.setXYZ(i, vx * disp, vy * disp, vz * disp);
        }
        moonGeo.computeVertexNormals();
        const moonMat = new THREE.MeshStandardMaterial({
            color: 0x1a0836,
            roughness: 0.2,
            metalness: 0.85,
            envMapIntensity: 1.8,
            emissive: biome.planetLand,
            emissiveIntensity: 0.35
        });
        const moon = new THREE.Mesh(moonGeo, moonMat);
        const moonWire = new THREE.LineSegments(
            new THREE.EdgesGeometry(moonGeo, 18),
            new THREE.LineBasicMaterial({ color: biome.ringColor, transparent: true, opacity: 0.5 })
        );
        moon.add(moonWire);
        moon.position.set(148, 18, 0);
        moonPivot.add(moon);
        group.add(moonPivot);

        this.scene.add(group);
        return {
            group,
            mesh,
            material,
            ring,
            moonPivot,
            moon,
            biomeIdx,
            discoveredCount: 0
        };
    }

    private onPlanetDiscovered(pNode: PlanetNode) {
        pNode.discoveredCount++;
        this.worldsExplored++;
        this.score += 1500;
        this.portalBoost = 35.0;

        const worldCountEl = document.getElementById('mineral-count');
        if (worldCountEl) worldCountEl.textContent = this.worldsExplored.toString();

        this.currentBiomeIdx = pNode.biomeIdx;
        this.targetBiome = BIOMES[this.currentBiomeIdx];
        this.updateEnvironmentReflections(this.targetBiome);
        this.audio.playPortalChord();
        this.showDiscoveryBanner(this.targetBiome);

        if (this.ship) {
            for (let k = 0; k < 28; k++) {
                const p = new MoteParticle(this.ship.position, this.targetBiome.planetAtmo, this.ship, 0.32);
                this.scene.add(p.mesh);
                this.particles.push(p);
            }
            const fwd = this.getForwardVector();
            const sideVec = new THREE.Vector3(-fwd.z, 0, fwd.x);
            const sideSign = Math.random() > 0.5 ? 1 : -1;
            pNode.group.position.set(
                this.ship.position.x + fwd.x * 780 + sideVec.x * sideSign * 95,
                36 + (Math.random() - 0.5) * 20,
                this.ship.position.z + fwd.z * 780 + sideVec.z * sideSign * 95
            );
        }
    }

    public triggerScanWave() {
        this.audio.playScannerWave();

        let scannedCount = 0;
        if (this.ship) {
            this.crystals.forEach(c => {
                if (c.position.distanceTo(this.ship!.position) < 240) {
                    scannedCount++;
                    for (let k = 0; k < 4; k++) {
                        const p = new MoteParticle(c.position, this.targetBiome.nebulaSecondary, this.ship);
                        this.scene.add(p.mesh);
                        this.particles.push(p);
                    }
                }
            });
        }
        if (scannedCount > 0) {
            this.score += scannedCount * 75;
        }
    }

    private initScene() {
        const texLoader = new THREE.TextureLoader();
        this.perlinTexture = texLoader.load('/perlin.png');
        this.perlinTexture.wrapS = THREE.RepeatWrapping;
        this.perlinTexture.wrapT = THREE.RepeatWrapping;
        // Disable mipmap switching to prevent texture LOD shimmering/flickering
        this.perlinTexture.generateMipmaps = false;
        this.perlinTexture.minFilter = THREE.LinearFilter;
        this.perlinTexture.magFilter = THREE.LinearFilter;

        const hemiLight = new THREE.HemisphereLight(0xffb3ec, 0x090218, 1.35);
        this.scene.add(hemiLight);

        const dirLight = new THREE.DirectionalLight(0xffe5b4, 1.8);
        dirLight.position.set(30, 75, -120);
        this.scene.add(dirLight);

        // 1. 360° True Deep-Space Skybox with Seamless Triplanar Perlin Milky Way Nebula
        this.nebulaMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uPerlinTex: { value: this.perlinTexture },
                skyColor: { value: this.currentSkyColor },
                nebulaPrimary: { value: this.currentNebulaPrimary },
                nebulaSecondary: { value: this.currentNebulaSecondary }
            },
            vertexShader: NEBULA_VERTEX_SHADER,
            fragmentShader: NEBULA_FRAGMENT_SHADER,
            side: THREE.BackSide,
            depthWrite: false,
            fog: false
        });
        this.nebulaDome = new THREE.Mesh(new THREE.SphereGeometry(2000, 48, 32), this.nebulaMaterial);
        this.scene.add(this.nebulaDome);

        // 2. Non-Popping 360° Deep Space Starfield (8,500 multi-sized stars wrapping individually in GLSL)
        const starCount = 8500;
        const starPos: number[] = [];
        const starColors: number[] = [];
        const starSizes: number[] = [];
        const palette = [
            new THREE.Color(0xffffff),
            new THREE.Color(0xade8f4),
            new THREE.Color(0xffcad4),
            new THREE.Color(0xffe599),
            new THREE.Color(0xd8bbff)
        ];
        for (let i = 0; i < starCount; i++) {
            starPos.push(
                (Math.random() - 0.5) * 1600,
                (Math.random() - 0.5) * 1600,
                (Math.random() - 0.5) * 1600
            );
            const c = palette[Math.floor(Math.random() * palette.length)];
            starColors.push(c.r, c.g, c.b);
            starSizes.push(0.8 + Math.pow(Math.random(), 3.0) * 3.2);
        }
        const starGeo = new THREE.BufferGeometry();
        starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
        starGeo.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));
        starGeo.setAttribute('aSize', new THREE.Float32BufferAttribute(starSizes, 1));

        this.starfieldMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uShipPos: { value: new THREE.Vector3(0, 0, 0) }
            },
            vertexShader: STARFIELD_VERTEX_SHADER,
            fragmentShader: STARFIELD_FRAGMENT_SHADER,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        this.stars = new THREE.Points(starGeo, this.starfieldMaterial);
        this.stars.frustumCulled = false;
        this.scene.add(this.stars);

        // 3. Soft Volumetric 3D Nebula Cloud Puffs floating in deep space (No flickering floor plane!)
        for (let i = 0; i < 24; i++) {
            const puffMat = new THREE.ShaderMaterial({
                uniforms: {
                    uPerlinTex: { value: this.perlinTexture },
                    puffColor1: { value: this.currentNebulaPrimary },
                    puffColor2: { value: this.currentNebulaSecondary },
                    seedOffset: { value: i * 0.37 }
                },
                vertexShader: NEBULA_PUFF_VERTEX_SHADER,
                fragmentShader: NEBULA_PUFF_FRAGMENT_SHADER,
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide
            });
            const size = 140 + Math.random() * 180;
            const puff = new THREE.Mesh(new THREE.PlaneGeometry(size, size), puffMat);
            const angle = (i / 24) * Math.PI * 2;
            const dist = 120 + Math.random() * 480;
            puff.position.set(
                Math.sin(angle) * dist,
                (Math.random() - 0.5) * 140 - 25,
                Math.cos(angle) * dist
            );
            this.scene.add(puff);
            this.nebulaPuffs.push(puff);
        }

        // 4. Iconic Giant Sliced Outrun Synthwave Sunset Star (North Horizon Beacon)
        const sunGeo = new THREE.CircleGeometry(275, 64);
        this.sunMaterial = new THREE.ShaderMaterial({
            uniforms: {
                coreColor: { value: this.currentSunCore },
                haloColor: { value: this.currentSunHalo },
                time: { value: 0 }
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
                uniform vec3 coreColor;
                uniform vec3 haloColor;
                uniform float time;
                void main() {
                    vec2 centered = vUv - vec2(0.5);
                    float d = length(centered) * 2.0;

                    float outerGlow = pow(smoothstep(1.0, 0.0, d), 1.6) * 0.65;
                    float disc = smoothstep(0.78, 0.75, d);

                    // Classic 80s Outrun 3-stop gradient: hot magenta bottom -> neon orange mid -> solar yellow top
                    float gradT = clamp((vUv.y - 0.12) * 1.35, 0.0, 1.0);
                    vec3 midOrange = vec3(1.0, 0.36, 0.05);
                    vec3 gradCol = gradT < 0.5
                        ? mix(haloColor, midOrange, gradT * 2.0)
                        : mix(midOrange, coreColor, (gradT - 0.5) * 2.0);

                    float sliceMask = 1.0;
                    if (vUv.y < 0.56) {
                        float depth = 0.56 - vUv.y;
                        float gapThickness = 0.07 + depth * 0.48;
                        float wave = fract(vUv.y * 18.0 - time * 0.25);
                        sliceMask = smoothstep(gapThickness - 0.015, gapThickness + 0.015, wave);
                    }

                    // Subtle neon cyan rim around the sun disc
                    float sunRim = smoothstep(0.79, 0.76, d) * smoothstep(0.72, 0.75, d) * sliceMask;

                    float finalAlpha = max(disc * sliceMask, outerGlow);
                    vec3 finalCol = mix(haloColor, gradCol * 1.35, disc) + vec3(0.0, 0.95, 1.0) * sunRim * 0.65;
                    gl_FragColor = vec4(finalCol, finalAlpha * 0.96);
                }
            `,
            transparent: true,
            fog: false,
            depthWrite: false
        });
        this.sunMesh = new THREE.Mesh(sunGeo, this.sunMaterial);
        this.sunMesh.position.set(0, 72, -1080);

        // Concentric neon cyan & magenta synthwave wireframe rings around the Outrun sun
        const sunRingMat = new THREE.MeshBasicMaterial({
            color: 0x00f0ff,
            wireframe: true,
            transparent: true,
            opacity: 0.35,
            fog: false
        });
        const sunOrbitalRing = new THREE.Mesh(new THREE.RingGeometry(235, 295, 48, 2), sunRingMat);
        sunOrbitalRing.rotation.x = Math.PI * 0.38;
        sunOrbitalRing.rotation.y = -0.22;
        this.sunMesh.add(sunOrbitalRing);

        this.scene.add(this.sunMesh);

        // 5. Place 4 Discoverable 3D Ringed Planets in the North, East, South, and West Sectors
        this.planets.push(this.createPlanetNode(0, new THREE.Vector3(-85, 36, -620)));  // North: VERIDIA-9
        this.planets.push(this.createPlanetNode(1, new THREE.Vector3(680, 42, -80)));   // East: CYBERIA PRIME
        this.planets.push(this.createPlanetNode(2, new THREE.Vector3(90, 34, 680)));    // South: SOLARIS MIRAGE
        this.planets.push(this.createPlanetNode(3, new THREE.Vector3(-680, 40, 85)));   // West: ASTRAL ELYSIUM

        // 6. Populate 360° Space with Portals, Reflective Asteroids, and Crystals
        for (let i = 0; i < 10; i++) {
            const angle = (i / 10) * Math.PI * 2;
            const dist = 120 + Math.random() * 240;
            this.createPortalRing(Math.sin(angle) * dist, Math.cos(angle) * dist);
        }
        for (let i = 0; i < 32; i++) {
            const angle = (i / 32) * Math.PI * 2 + Math.random() * 0.3;
            const dist = 70 + Math.random() * 320;
            this.createPerlinAsteroid(i, Math.sin(angle) * dist, Math.cos(angle) * dist);
        }
        for (let i = 0; i < 22; i++) {
            const angle = (i / 22) * Math.PI * 2 + Math.random() * 0.2;
            const dist = 45 + Math.random() * 240;
            this.spawnCrystalCluster(Math.sin(angle) * dist, Math.cos(angle) * dist);
        }
    }

    private loadModel() {
        const loader = new GLTFLoader();
        loader.load('/spaceship_gltf/scene.gltf', (gltf) => {
            const rawModel = gltf.scene;
            if (!rawModel) return;

            const shipGroup = new THREE.Group();
            shipGroup.rotation.order = 'YXZ';

            rawModel.scale.set(0.12, 0.12, 0.12);
            rawModel.rotation.y = Math.PI;
            rawModel.rotation.x = this.MODEL_LEVEL_PITCH;
            shipGroup.add(rawModel);

            const shipLight = new THREE.PointLight(0x00f0ff, 22, 45);
            shipLight.position.set(0, 4, -4);
            shipGroup.add(shipLight);

            const rearGlowLight = new THREE.PointLight(0xff2a9d, 18, 30);
            rearGlowLight.position.set(0, 1, 5);
            shipGroup.add(rearGlowLight);

            rawModel.traverse((child) => {
                if ((child as THREE.Mesh).isMesh) {
                    const mesh = child as THREE.Mesh;
                    const origMat = mesh.material as THREE.MeshStandardMaterial;
                    mesh.material = new THREE.MeshStandardMaterial({
                        color: 0x1c1236,
                        metalness: 0.95,
                        roughness: 0.07,
                        envMapIntensity: 2.5,
                        normalMap: origMat?.normalMap || null,
                        emissive: 0x260845,
                        emissiveMap: origMat?.emissiveMap || null,
                        emissiveIntensity: 0.65
                    });

                    const edges = new THREE.EdgesGeometry(mesh.geometry, 24);
                    const line = new THREE.LineSegments(
                        edges,
                        new THREE.LineBasicMaterial({
                            color: 0xff2a9d,
                            transparent: true,
                            opacity: 0.65
                        })
                    );
                    mesh.add(line);
                }
            });

            const auraGeo = new THREE.IcosahedronGeometry(1.6, 1);
            const auraMat = new THREE.MeshBasicMaterial({
                color: 0x00f0ff,
                transparent: true,
                opacity: 0.06,
                wireframe: true
            });
            this.shieldMesh = new THREE.Mesh(auraGeo, auraMat);
            shipGroup.add(this.shieldMesh);

            this.ship = shipGroup;
            this.ship.position.set(0, 3.6, 0);
            this.scene.add(this.ship);

            // Spawn MMO AI Travellers cloning the spaceship mesh
            this.spawnAIPlayers(rawModel);
        });
    }

    private createNametagSprite(callsign: string, status: string, colorHex: number): THREE.Sprite {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const ctx = canvas.getContext('2d')!;
        const hexStr = '#' + colorHex.toString(16).padStart(6, '0');

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Glassmorphic pill background
        ctx.fillStyle = 'rgba(8, 3, 24, 0.72)';
        ctx.strokeStyle = hexStr;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(26, 22, 460, 82, 41);
        ctx.fill();
        ctx.stroke();

        // Callsign text
        ctx.font = 'bold 30px "Orbitron", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = hexStr;
        ctx.shadowBlur = 12;
        ctx.fillText(`◈ ${callsign.toUpperCase()}`, 256, 62);

        // Status subtitle
        ctx.shadowBlur = 0;
        ctx.font = '20px "Share Tech Mono", monospace';
        ctx.fillStyle = hexStr;
        ctx.fillText(`[ ${status} ]`, 256, 90);

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;

        const mat = new THREE.SpriteMaterial({
            map: tex,
            transparent: true,
            depthWrite: false,
            fog: false
        });
        const sprite = new THREE.Sprite(mat);
        sprite.position.set(0, 3.3, 0);
        sprite.scale.set(13.5, 3.4, 1);
        return sprite;
    }

    private spawnAIPlayers(templateRawModel: THREE.Object3D) {
        DEFAULT_TRAVELLER_PROFILES.forEach((profile, idx) => {
            const callsign = this.leaderboardPilotNames[idx] || profile.callsign;
            const aiGroup = new THREE.Group();
            aiGroup.rotation.order = 'YXZ';

            const clonedMesh = templateRawModel.clone(true);
            clonedMesh.scale.set(0.105, 0.105, 0.105);
            clonedMesh.rotation.y = Math.PI;
            clonedMesh.rotation.x = this.MODEL_LEVEL_PITCH;

            clonedMesh.traverse((child) => {
                if ((child as THREE.Mesh).isMesh) {
                    const mesh = child as THREE.Mesh;
                    mesh.material = new THREE.MeshStandardMaterial({
                        color: 0x150d2a,
                        metalness: 0.92,
                        roughness: 0.1,
                        envMapIntensity: 2.2,
                        emissive: profile.colorHex,
                        emissiveIntensity: 0.25
                    });
                } else if ((child as THREE.LineSegments).isLineSegments) {
                    const line = child as THREE.LineSegments;
                    line.material = new THREE.LineBasicMaterial({
                        color: profile.colorHex,
                        transparent: true,
                        opacity: 0.8
                    });
                }
            });

            aiGroup.add(clonedMesh);

            const nameSprite = this.createNametagSprite(callsign, profile.status, profile.colorHex);
            aiGroup.add(nameSprite);

            const angle = (idx / DEFAULT_TRAVELLER_PROFILES.length) * Math.PI * 2;
            const dist = 42 + (idx % 3) * 38;
            const startY = 3.5 + (idx % 4) * 2.4;
            aiGroup.position.set(Math.sin(angle) * dist, startY, -Math.cos(angle) * dist - 35);

            const initialYaw = (Math.random() - 0.5) * 0.8;
            aiGroup.rotation.y = initialYaw;
            this.scene.add(aiGroup);

            this.aiPlayers.push({
                group: aiGroup,
                nameSprite,
                callsign,
                status: profile.status,
                colorHex: profile.colorHex,
                yaw: initialYaw,
                targetYaw: initialYaw,
                roll: 0,
                pitch: 0.04,
                speed: 36 + (idx % 4) * 5.5,
                targetY: startY,
                decisionTimer: 1.5 + idx * 0.7,
                beamCooldown: 2.0 + Math.random() * 4.0
            });
        });
    }

    public setLeaderboardPilots(names: string[]) {
        const cleaned = names.filter((n) => n && n.trim().length > 0).slice(0, DEFAULT_TRAVELLER_PROFILES.length);
        this.leaderboardPilotNames = cleaned;

        this.aiPlayers.forEach((bot, idx) => {
            if (cleaned[idx] && bot.callsign !== cleaned[idx]) {
                bot.callsign = cleaned[idx];
                this.updateBotNametag(bot, bot.status);
            }
        });
    }

    private updateBotNametag(bot: AIPlayer, subtitleText: string) {
        bot.group.remove(bot.nameSprite);
        (bot.nameSprite.material as THREE.SpriteMaterial).map?.dispose();
        bot.nameSprite.material.dispose();
        bot.nameSprite = this.createNametagSprite(bot.callsign, subtitleText, bot.colorHex);
        bot.group.add(bot.nameSprite);
    }

    private appendChatMessage(sender: string, colorHex: number, text: string, isSystem = false) {
        const box = document.getElementById('mmo-chat-messages');
        if (!box) return;

        const row = document.createElement('div');
        row.className = isSystem ? 'chat-msg system-event' : 'chat-msg';

        if (isSystem) {
            row.textContent = text;
        } else {
            const hexStr = '#' + colorHex.toString(16).padStart(6, '0');
            const senderSpan = document.createElement('span');
            senderSpan.className = 'chat-sender';
            senderSpan.style.color = hexStr;
            senderSpan.textContent = `[${sender}]:`;
            row.appendChild(senderSpan);

            // Highlight @mentions in neon gold
            const parts = text.split(/(@[A-Za-z0-9_-]+)/g);
            parts.forEach((part) => {
                if (part.startsWith('@')) {
                    const mention = document.createElement('span');
                    mention.className = 'chat-mention';
                    mention.textContent = part;
                    row.appendChild(mention);
                } else {
                    row.appendChild(document.createTextNode(part));
                }
            });
        }

        box.appendChild(row);
        while (box.children.length > 28) {
            box.removeChild(box.firstChild!);
        }
        box.scrollTop = box.scrollHeight;

        // Also show speech snippet on the 3D spaceship's floating nametag!
        const speakingBot = this.aiPlayers.find((b) => b.callsign === sender);
        if (speakingBot) {
            const snippet = text.length > 22 ? `💬 "${text.slice(0, 20)}.."` : `💬 "${text}"`;
            this.updateBotNametag(speakingBot, snippet);
            window.setTimeout(() => {
                if (!this.isDestroyed) {
                    this.updateBotNametag(speakingBot, speakingBot.status);
                }
            }, 4800);
        }
    }

    private triggerRandomBotChat() {
        if (this.aiPlayers.length < 2) return;

        const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
        const botA = pick(this.aiPlayers);
        let botB = pick(this.aiPlayers);
        if (botB === botA) {
            botB = this.aiPlayers[(this.aiPlayers.indexOf(botA) + 1) % this.aiPlayers.length];
        }

        const planetName = pick(BIOMES).name;

        // 55% chance of a hilarious 2-part conversation between botA and botB, 45% procedural weirdness
        if (Math.random() < 0.55) {
            const dialogues: [string, string][] = [
                [
                    `@${botB.callsign} why were you flying backwards in circles around ${planetName} for 10 mins??`,
                    `@${botA.callsign} my cat stepped on the W key and i spilled ramen on my synthpad ok dont judge me`
                ],
                [
                    `wait guys is the giant sun made of horizontal slices or is my windshield broken`,
                    `@${botA.callsign} bro did NOT read the synthwave manual before undocking 💀`
                ],
                [
                    `does anyone know if ${planetName} has a 7-Eleven my hyperdrive runs on slushies`,
                    `@${botA.callsign} yeah take a left at the pink asteroid and third portal on the right`
                ],
                [
                    `WTS [Slightly Cursed Perlin Crystal] 450 units obo, it hums 80s saxophone solos at night`,
                    `@${botA.callsign} i'll give you 12 discovery units and a half-eaten space burrito`
                ],
                [
                    `@${botB.callsign} stop tailgating me there is literally infinite 3D space in every direction`,
                    `@${botA.callsign} your neon engine trails smell likeblueberry vaporwave i cant help it`
                ],
                [
                    `i have been flying West for 4 hours and i think i left my stove on back on Earth`,
                    `@${botA.callsign} hit SHIFT to hyperjump back before your apartment turns into a nebula`
                ],
                [
                    `who keeps shooting lasers at the asteroids?? they are just vibing`,
                    `@${botA.callsign} sorry i thought it was a giant floating disco ball`
                ],
                [
                    `anyone else's cassette player stuck on loop playing arpeggios since 1984?`,
                    `@${botA.callsign} bold of you to assume that's a bug and not the meaning of life`
                ],
                [
                    `@${botB.callsign} race you to ${planetName} loser buys neon underglow for the whole sector`,
                    `@${botA.callsign} you're on, switching from DRIFT to PULSE mode right now!!`
                ],
                [
                    `just saw a guy do a 360 no-scope crystal harvest near the north ring`,
                    `@${botA.callsign} thank you i practiced that maneuver in a Wendy's parking lot`
                ]
            ];

            const [line1, line2] = pick(dialogues);
            this.appendChatMessage(botA.callsign, botA.colorHex, line1);

            if (this.pendingReplyTimeout) clearTimeout(this.pendingReplyTimeout);
            this.pendingReplyTimeout = window.setTimeout(() => {
                if (!this.isDestroyed) {
                    this.appendChatMessage(botB.callsign, botB.colorHex, line2);
                }
            }, 2200 + Math.random() * 1800);
        } else {
            // Combinatorial procedural randomness so it's endlessly unpredictable
            const openers = [
                'ngl',
                'hear me out:',
                'unpopular opinion:',
                'psa to everyone in this sector:',
                'wait a second...',
                'bro',
                'captains log day 402:',
                'urgent question:'
            ];
            const subjects = [
                'my onboard AI toaster',
                'the magenta nebula',
                `some dude near ${planetName}`,
                'my VHS copy of Top Gun',
                'a floating octo-crystal',
                'my spaceship warranty',
                'the fourth dimension',
                `@${botB.callsign}'s left wing thruster`
            ];
            const predicates = [
                'just started speaking fluent dolphin',
                'owes me 3,000 discovery units',
                'tastes suspiciously like purple Gatorade',
                'is vibrating at 120 BPM synthwave tempo',
                'just clipped through an asteroid and winked at me',
                'told me to invest in neon wireframe futures',
                'refuses to turn left on Tuesdays',
                'is 100% made of pure 1986 nostalgia'
            ];
            const endings = ['', ' 💀', ' lmao', ' ???', ' (real)', ' no cap', ' brb crying', ' ✨'];

            const randomSentence = `${pick(openers)} ${pick(subjects)} ${pick(predicates)}${pick(endings)}`;
            this.appendChatMessage(botA.callsign, botA.colorHex, randomSentence);
        }
    }

    private createPortalRing(x: number, z: number) {
        const ringGeo = new THREE.TorusGeometry(15, 0.35, 12, 48);
        const ringMat = new THREE.MeshStandardMaterial({
            color: 0x00f0ff,
            emissive: 0x00f0ff,
            emissiveIntensity: 0.6,
            metalness: 0.9,
            roughness: 0.1,
            envMapIntensity: 2.0,
            transparent: true,
            opacity: 0.75
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.set(x, 7 + Math.random() * 6, z);
        ring.rotation.y = Math.random() * Math.PI;

        const outerGeo = new THREE.TorusGeometry(15.8, 0.15, 8, 48);
        const outerMat = new THREE.MeshBasicMaterial({
            color: 0xff2a9d,
            transparent: true,
            opacity: 0.5
        });
        ring.add(new THREE.Mesh(outerGeo, outerMat));

        const innerGeo = new THREE.OctahedronGeometry(2.2, 0);
        const innerMat = new THREE.MeshBasicMaterial({
            color: 0xffbe6b,
            wireframe: true,
            transparent: true,
            opacity: 0.75
        });
        const glyph = new THREE.Mesh(innerGeo, innerMat);
        ring.add(glyph);
        (ring as unknown as { glyph: THREE.Mesh; cooldown: number }).glyph = glyph;
        (ring as unknown as { glyph: THREE.Mesh; cooldown: number }).cooldown = 0;

        this.scene.add(ring);
        this.rings.push(ring);
    }

    private createPerlinAsteroid(seedIdx: number, x: number, z: number) {
        const baseRadius = 3.5 + Math.abs(fractalBrownianMotion(seedIdx * 13.7, z * 0.1, 4, 0.08)) * 7.5;
        const geo = new THREE.IcosahedronGeometry(baseRadius, 2);
        const pos = geo.attributes.position;

        for (let i = 0; i < pos.count; i++) {
            const vx = pos.getX(i);
            const vy = pos.getY(i);
            const vz = pos.getZ(i);
            const fbmVal = fractalBrownianMotion(
                vx * 12 + seedIdx * 31,
                vy * 12 + vz * 12,
                5,
                0.045
            );
            const scale = 1.0 + fbmVal * 0.42;
            pos.setXYZ(i, vx * scale, vy * scale * 0.85, vz * scale);
        }
        geo.computeVertexNormals();

        const isMagenta = seedIdx % 2 === 0;
        const mat = new THREE.MeshStandardMaterial({
            color: 0x160a2e,
            roughness: 0.16,
            metalness: 0.88,
            envMapIntensity: 2.0,
            emissive: isMagenta ? 0x2a063b : 0x05263b,
            emissiveIntensity: 0.45
        });
        const asteroid = new THREE.Mesh(geo, mat);

        const wire = new THREE.LineSegments(
            new THREE.EdgesGeometry(geo, 24),
            new THREE.LineBasicMaterial({
                color: isMagenta ? 0xff2a9d : 0x00f0ff,
                transparent: true,
                opacity: 0.42
            })
        );
        asteroid.add(wire);

        asteroid.position.set(x, 6 + (Math.random() - 0.5) * 28, z);
        (asteroid as unknown as { rotVec: THREE.Vector3 }).rotVec = new THREE.Vector3(
            (Math.random() - 0.5) * 0.35,
            (Math.random() - 0.5) * 0.35,
            (Math.random() - 0.5) * 0.35
        );

        this.scene.add(asteroid);
        this.asteroids.push(asteroid);
    }

    private spawnCrystalCluster(x: number, z: number) {
        const group = new THREE.Group();
        const crystalColor = this.targetBiome.crystalColor;

        const mainGeo = new THREE.OctahedronGeometry(1.7, 0);
        const mainMat = new THREE.MeshStandardMaterial({
            color: crystalColor,
            emissive: crystalColor,
            emissiveIntensity: 0.65,
            roughness: 0.06,
            metalness: 0.92,
            envMapIntensity: 2.4,
            transparent: true,
            opacity: 0.94
        });
        const mainCrystal = new THREE.Mesh(mainGeo, mainMat);
        mainCrystal.scale.set(0.8, 1.9, 0.8);
        group.add(mainCrystal);

        const wire = new THREE.LineSegments(
            new THREE.EdgesGeometry(mainGeo),
            new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 })
        );
        mainCrystal.add(wire);

        const haloGeo = new THREE.RingGeometry(2.1, 2.38, 24);
        const haloMat = new THREE.MeshBasicMaterial({
            color: 0x00f0ff,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.45
        });
        const halo = new THREE.Mesh(haloGeo, haloMat);
        group.add(halo);

        group.position.set(x, 4.0 + Math.random() * 10, z);
        (group as unknown as { rotSpeed: number; baseY: number; phase: number }).rotSpeed = 0.6 + Math.random() * 0.8;
        (group as unknown as { rotSpeed: number; baseY: number; phase: number }).baseY = group.position.y;
        (group as unknown as { rotSpeed: number; baseY: number; phase: number }).phase = Math.random() * Math.PI * 2;

        this.scene.add(group);
        this.crystals.push(group);
    }

    private respawnAheadOfShip(obj: THREE.Object3D, minDist: number, maxDist: number, spread: number) {
        if (!this.ship) return;
        const fwd = this.getForwardVector();
        const right = new THREE.Vector3(-fwd.z, 0, fwd.x);
        const dist = minDist + Math.random() * (maxDist - minDist);
        const lateral = (Math.random() - 0.5) * spread;

        obj.position.x = this.ship.position.x + fwd.x * dist + right.x * lateral;
        obj.position.z = this.ship.position.z + fwd.z * dist + right.z * lateral;
    }

    private harvestCrystal(index: number) {
        const crystal = this.crystals[index];
        if (!crystal) return;

        this.score += 250;
        this.mineralsHarvested++;
        this.audio.playHarvestChime();

        for (let k = 0; k < 14; k++) {
            const mote = new MoteParticle(
                crystal.position,
                k % 2 === 0 ? this.targetBiome.crystalColor : this.targetBiome.nebulaSecondary,
                this.ship
            );
            this.scene.add(mote.mesh);
            this.particles.push(mote);
        }

        this.respawnAheadOfShip(crystal, 180, 340, 140);
        crystal.position.y = Math.random() * 10 + 2.0;
        (crystal as unknown as { baseY: number }).baseY = crystal.position.y;
    }

    private initEvents() {
        const ensureAudio = () => {
            this.audio.init();
            window.removeEventListener('pointerdown', ensureAudio);
            window.removeEventListener('keydown', ensureAudio);
        };
        window.addEventListener('pointerdown', ensureAudio);
        window.addEventListener('keydown', ensureAudio);

        const move = (_cx: number, cy: number) => {
            if (this.isDestroyed || !this.ship) return;
            const y = -((cy / window.innerHeight) * 2 - 1);
            this.targetShipY = THREE.MathUtils.clamp((y + 1) * 4.8 + 1.2, 0.5, 14.0);
            this.shipPitch = 0.04 + y * 0.16;
        };

        window.addEventListener('mousemove', (e) => move(e.clientX, e.clientY));
        window.addEventListener(
            'touchmove',
            (e) => {
                if (e.touches.length > 0) {
                    const tx = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
                    this.targetYaw -= tx * 0.035;
                    move(e.touches[0].clientX, e.touches[0].clientY);
                    e.preventDefault();
                }
            },
            { passive: false }
        );

        const emitResonanceBeam = () => {
            if (this.isDestroyed || !this.ship) return;
            this.audio.playBeamPulse();
            const fwd = this.getForwardVector();
            const beam = new THREE.Mesh(
                new THREE.SphereGeometry(0.42, 12, 12),
                new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.9 })
            );
            beam.scale.set(0.65, 0.65, 3.8);
            beam.position.copy(this.ship.position);
            beam.rotation.y = this.shipYaw;
            this.scene.add(beam);
            this.pulses.push({ mesh: beam, dir: fwd, life: 2.0 });
        };

        this.renderer.domElement.addEventListener('pointerdown', (e) => {
            emitResonanceBeam();
            move(e.clientX, e.clientY);
        });

        const setModeButton = (activeId: string, mult: number) => {
            this.speedMultiplier = mult;
            ['mode-drift', 'mode-cruise', 'mode-pulse'].forEach((id) => {
                document.getElementById(id)?.classList.toggle('active', id === activeId);
            });
        };

        document.getElementById('mode-drift')?.addEventListener('click', () => setModeButton('mode-drift', 0.55));
        document.getElementById('mode-cruise')?.addEventListener('click', () => setModeButton('mode-cruise', 1.0));
        document.getElementById('mode-pulse')?.addEventListener('click', () => setModeButton('mode-pulse', 1.85));
        document.getElementById('btn-cam')?.addEventListener('click', () => this.cycleCameraPreset());
        document.getElementById('btn-scan')?.addEventListener('click', () => this.triggerScanWave());
        document.getElementById('btn-warp')?.addEventListener('click', () => this.hyperjumpForward());
        document.getElementById('btn-audio')?.addEventListener('click', (e) => {
            const muted = this.audio.toggleMute();
            const btn = e.currentTarget as HTMLButtonElement;
            if (btn) btn.textContent = muted ? 'SYNTH: MUTE' : 'SYNTH: ON';
        });

        const chatInput = document.getElementById('mmo-chat-input') as HTMLInputElement | null;
        const chatSendBtn = document.getElementById('mmo-chat-send');

        const sendPlayerChat = () => {
            if (!chatInput) return;
            const msg = chatInput.value.trim();
            if (!msg) {
                chatInput.blur();
                return;
            }
            chatInput.value = '';
            chatInput.blur();
            this.appendChatMessage('YOU', 0xffea79, msg);

            // Have a random AI Traveller respond to the player!
            if (this.aiPlayers.length > 0) {
                const responder = this.aiPlayers[Math.floor(Math.random() * this.aiPlayers.length)];
                const playerReplies = [
                    `@YOU wait you can talk?! i thought you were an NPC`,
                    `@YOU 100% agree, here take my spare cassette tape`,
                    `@YOU facts bro, meet me by the giant sliced sun in 5 mins`,
                    `@YOU sir this is a Synthwave Wendy's`,
                    `@YOU hold on my cat is steering the ship right now`,
                    `@YOU big if true, scanning that sector rn 👀`,
                    `@YOU lmao i was literally just thinking the exact same thing`
                ];
                const reply = playerReplies[Math.floor(Math.random() * playerReplies.length)];
                window.setTimeout(() => {
                    if (!this.isDestroyed) {
                        this.appendChatMessage(responder.callsign, responder.colorHex, reply);
                    }
                }, 1400 + Math.random() * 1400);
            }
        };

        chatSendBtn?.addEventListener('click', sendPlayerChat);
        chatInput?.addEventListener('keydown', (e) => {
            e.stopPropagation();
            if (e.key === 'Enter') {
                e.preventDefault();
                sendPlayerChat();
            } else if (e.key === 'Escape') {
                chatInput.blur();
            }
        });

        window.addEventListener('keydown', (e) => {
            if (document.activeElement === chatInput) return;

            if (e.key === 'Enter' && chatInput) {
                e.preventDefault();
                this.keysPressed = {};
                chatInput.focus();
                return;
            }

            const key = e.key.toLowerCase();
            this.keysPressed[key] = true;
            this.keysPressed[e.code] = true;

            if (e.code === 'Space') {
                this.triggerScanWave();
            } else if (key === 'h' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
                this.hyperjumpForward();
            } else if (key === 'c') {
                this.cycleCameraPreset();
            } else if (key === '1') {
                setModeButton('mode-drift', 0.55);
            } else if (key === '2') {
                setModeButton('mode-cruise', 1.0);
            } else if (key === '3') {
                setModeButton('mode-pulse', 1.85);
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keysPressed[e.key.toLowerCase()] = false;
            this.keysPressed[e.code] = false;
        });
    }

    private update() {
        if (this.isDestroyed) return;
        const delta = Math.min(this.clock.getDelta(), 0.1);
        const elapsed = this.clock.getElapsedTime();

        const colorLerp = delta * 0.85;
        this.currentSkyColor.lerp(new THREE.Color(this.targetBiome.skyColor), colorLerp);
        this.currentFogColor.lerp(new THREE.Color(this.targetBiome.fogColor), colorLerp);
        this.currentNebulaPrimary.lerp(new THREE.Color(this.targetBiome.nebulaPrimary), colorLerp);
        this.currentNebulaSecondary.lerp(new THREE.Color(this.targetBiome.nebulaSecondary), colorLerp);
        this.currentSunCore.lerp(new THREE.Color(this.targetBiome.sunCore), colorLerp);
        this.currentSunHalo.lerp(new THREE.Color(this.targetBiome.sunHalo), colorLerp);

        this.scene.background = this.currentSkyColor;
        (this.scene.fog as THREE.FogExp2).color.copy(this.currentFogColor);

        // ====================================================================
        // WASD 360° NESW NAVIGATION & STEERING
        // ====================================================================
        let turnInput = 0;
        if (this.keysPressed['a'] || this.keysPressed['ArrowLeft']) turnInput += 1;
        if (this.keysPressed['d'] || this.keysPressed['ArrowRight']) turnInput -= 1;

        let thrustInput = 0;
        if (this.keysPressed['w'] || this.keysPressed['ArrowUp']) thrustInput += 1;
        if (this.keysPressed['s'] || this.keysPressed['ArrowDown']) thrustInput -= 1;

        const turnRate = 1.65;
        this.targetYaw += turnInput * turnRate * delta;
        this.shipYaw = THREE.MathUtils.lerp(this.shipYaw, this.targetYaw, delta * 5.0);

        const targetRoll = THREE.MathUtils.clamp(
            turnInput * 0.48 + (this.targetYaw - this.shipYaw) * 0.9,
            -0.52,
            0.52
        );
        this.shipRoll = THREE.MathUtils.lerp(this.shipRoll, targetRoll, delta * 5.0);

        const compassEl = document.getElementById('compass-readout');
        if (compassEl) {
            compassEl.textContent = this.formatCompassHeading(this.shipYaw);
        }

        this.portalBoost = THREE.MathUtils.lerp(this.portalBoost, 0, delta * 1.2);
        const throttleFactor = 1.0 + thrustInput * 0.65;
        const currentSpeed = this.baseSpeed * this.speedMultiplier * throttleFactor + this.portalBoost;

        const fwd = this.getForwardVector();
        const right = new THREE.Vector3(-fwd.z, 0, fwd.x);

        if (this.ship) {
            const lerpFactor = 4.0 * delta;
            const hoverBob = Math.sin(elapsed * 2.0) * 0.16;

            this.ship.position.x += fwd.x * currentSpeed * delta;
            this.ship.position.z += fwd.z * currentSpeed * delta;
            this.ship.position.y = THREE.MathUtils.lerp(this.ship.position.y, this.targetShipY + hoverBob, lerpFactor);

            this.ship.rotation.y = this.shipYaw;
            this.ship.rotation.z = this.shipRoll;
            this.ship.rotation.x = THREE.MathUtils.lerp(
                this.ship.rotation.x,
                this.shipPitch + thrustInput * 0.06,
                lerpFactor
            );

            // Keep sky dome centered on the ship; update starfield uniform for smooth per-star modulo wrapping
            this.nebulaDome.position.copy(this.ship.position);
            this.starfieldMaterial.uniforms.uShipPos.value.copy(this.ship.position);

            // Keep distant sunset star anchored in the North sky relative to the ship
            this.sunMesh.position.set(this.ship.position.x, 60, this.ship.position.z - 1100);

            // Billboard and recycle 3D nebula cloud puffs smoothly
            this.nebulaPuffs.forEach((puff) => {
                puff.quaternion.copy(this.camera.quaternion);
                if (this.ship && puff.position.distanceTo(this.ship.position) > 740) {
                    this.respawnAheadOfShip(puff, 420, 680, 480);
                    puff.position.y = (Math.random() - 0.5) * 140 - 25;
                }
            });

            // Orbit Camera smoothly behind the ship's current 360° heading
            const preset = CAMERA_PRESETS[this.cameraPresetIdx];
            const worldOffset = preset.localOffset.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), this.shipYaw);
            const desiredCamPos = this.ship.position.clone().add(worldOffset);

            this.camera.position.lerp(desiredCamPos, lerpFactor * 1.5);

            const desiredLookTarget = new THREE.Vector3(
                this.ship.position.x + fwd.x * preset.lookAheadDist,
                this.ship.position.y + preset.lookUpOffset + fwd.y * 12,
                this.ship.position.z + fwd.z * preset.lookAheadDist
            );
            this.lookAtTarget.lerp(desiredLookTarget, lerpFactor * 1.8);

            this.camera.up.set(0, 1, 0);
            this.camera.lookAt(this.lookAtTarget);
            this.camera.rotateZ(this.shipRoll * preset.bankFactor);

            const targetFov = preset.baseFov + (this.speedMultiplier * throttleFactor - 1.0) * 8 + this.portalBoost * 0.25;
            this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, delta * 3);
            this.camera.updateProjectionMatrix();

            // Twin synthwave neon thruster trails
            if (Math.random() < 0.7) {
                const sideSign = Math.random() > 0.5 ? 0.42 : -0.42;
                const trailPos = this.ship.position
                    .clone()
                    .sub(fwd.clone().multiplyScalar(1.5))
                    .add(right.clone().multiplyScalar(sideSign));
                const trailColor = Math.random() > 0.5 ? 0x00f0ff : 0xff2a9d;
                const trail = new MoteParticle(trailPos, trailColor, null, 0.18);
                trail.velocity.copy(fwd).multiplyScalar(-0.35);
                trail.life = 0.48;
                this.scene.add(trail.mesh);
                this.particles.push(trail);
            }
        }

        this.score += Math.floor(delta * 45 * this.speedMultiplier * Math.max(0.4, throttleFactor));
        const scoreEl = document.getElementById('game-score');
        if (scoreEl) scoreEl.textContent = this.score.toLocaleString();

        this.sunMaterial.uniforms.time.value = elapsed;

        let nearestPlanet = this.planets[0];
        let minDist = Infinity;

        this.planets.forEach((pNode) => {
            pNode.mesh.rotation.y += delta * 0.14;
            pNode.ring.rotation.z += delta * 0.06;
            pNode.moonPivot.rotation.y += delta * 0.35;
            pNode.moon.rotation.y += delta * 0.4;
            pNode.material.uniforms.time.value = elapsed;

            if (this.ship) {
                const dist = this.ship.position.distanceTo(pNode.group.position);
                if (dist < minDist) {
                    minDist = dist;
                    nearestPlanet = pNode;
                }
                if (dist < 165) {
                    this.onPlanetDiscovered(pNode);
                }
            }
        });

        if (nearestPlanet && this.ship) {
            const biome = BIOMES[nearestPlanet.biomeIdx];
            const distToOrbit = Math.max(0, Math.round(minDist - 165));
            const sysEl = document.getElementById('system-name');
            const barEl = document.getElementById('shield-bar');
            if (sysEl) sysEl.textContent = `${biome.name} [${biome.cardinal}] (${distToOrbit} KS)`;
            if (barEl) {
                const progress = THREE.MathUtils.clamp(1.0 - distToOrbit / 650, 0.05, 1.0) * 100;
                barEl.style.width = `${progress}%`;
            }
        }

        if (this.shieldMesh) {
            this.shieldMesh.rotation.y += delta * 0.45;
            this.shieldMesh.rotation.x += delta * 0.25;
        }

        // ====================================================================
        // MMO AI TRAVELLERS SIMULATION & RANDOM SECTOR CHAT
        // ====================================================================
        this.mmoFeedTimer -= delta;
        if (this.mmoFeedTimer <= 0 && this.aiPlayers.length > 0) {
            this.mmoFeedTimer = 5.5 + Math.random() * 4.5;
            if (Math.random() < 0.82) {
                this.triggerRandomBotChat();
            } else {
                const randomBot = this.aiPlayers[Math.floor(Math.random() * this.aiPlayers.length)];
                const randomPlanet = BIOMES[Math.floor(Math.random() * BIOMES.length)].name;
                this.appendChatMessage(
                    '',
                    0x00f0ff,
                    `✦ ${randomBot.callsign} entered high orbit around ${randomPlanet}`,
                    true
                );
            }
        }

        this.aiPlayers.forEach((bot, idx) => {
            bot.decisionTimer -= delta;
            bot.beamCooldown -= delta;

            if (bot.decisionTimer <= 0) {
                bot.decisionTimer = 2.8 + Math.random() * 4.2;
                // Bias AI steering loosely toward the player's general heading or nearby planets so the sector stays lively
                if (this.ship && Math.random() < 0.65) {
                    bot.targetYaw = this.shipYaw + (Math.random() - 0.5) * 1.3;
                } else {
                    bot.targetYaw += (Math.random() - 0.5) * 1.8;
                }
                bot.targetY = 2.2 + Math.random() * 11.5;
                bot.speed = 35 + Math.random() * 20;
            }

            const yawDiff = bot.targetYaw - bot.yaw;
            bot.yaw += yawDiff * delta * 2.2;
            bot.roll = THREE.MathUtils.lerp(bot.roll, THREE.MathUtils.clamp(yawDiff * 0.65, -0.48, 0.48), delta * 4.0);

            const botFwd = new THREE.Vector3(-Math.sin(bot.yaw), 0, -Math.cos(bot.yaw));
            const botRight = new THREE.Vector3(-botFwd.z, 0, botFwd.x);

            bot.group.position.x += botFwd.x * bot.speed * delta;
            bot.group.position.z += botFwd.z * bot.speed * delta;
            bot.group.position.y = THREE.MathUtils.lerp(
                bot.group.position.y,
                bot.targetY + Math.sin(elapsed * 1.8 + idx) * 0.25,
                delta * 2.5
            );

            bot.group.rotation.y = bot.yaw;
            bot.group.rotation.z = bot.roll;
            bot.group.rotation.x = 0.04;

            // Emit AI thruster trails
            if (Math.random() < 0.45) {
                const side = Math.random() > 0.5 ? 0.35 : -0.35;
                const tPos = bot.group.position
                    .clone()
                    .sub(botFwd.clone().multiplyScalar(1.3))
                    .add(botRight.clone().multiplyScalar(side));
                const trail = new MoteParticle(tPos, bot.colorHex, null, 0.14);
                trail.velocity.copy(botFwd).multiplyScalar(-0.25);
                trail.life = 0.38;
                this.scene.add(trail.mesh);
                this.particles.push(trail);
            }

            // Occasionally fire a colored resonance beam toward nearby crystals
            if (bot.beamCooldown <= 0 && this.crystals.length > 0) {
                for (let cIdx = 0; cIdx < this.crystals.length; cIdx++) {
                    const c = this.crystals[cIdx];
                    if (c.position.distanceTo(bot.group.position) < 55) {
                        bot.beamCooldown = 4.5 + Math.random() * 5.0;
                        const dirToCrystal = new THREE.Vector3().subVectors(c.position, bot.group.position).normalize();
                        const aiBeam = new THREE.Mesh(
                            new THREE.SphereGeometry(0.36, 10, 10),
                            new THREE.MeshBasicMaterial({ color: bot.colorHex, transparent: true, opacity: 0.85 })
                        );
                        aiBeam.scale.set(0.6, 0.6, 3.2);
                        aiBeam.position.copy(bot.group.position);
                        aiBeam.rotation.y = bot.yaw;
                        this.scene.add(aiBeam);
                        this.pulses.push({ mesh: aiBeam, dir: dirToCrystal, life: 1.4 });
                        break;
                    }
                }
            }

            // Keep AI Travellers in the active sector around the player
            if (this.ship && bot.group.position.distanceTo(this.ship.position) > 330) {
                this.respawnAheadOfShip(bot.group, 75, 210, 190);
                bot.group.position.y = 3.0 + Math.random() * 10.0;
                bot.yaw = this.shipYaw + (Math.random() - 0.5) * 1.1;
                bot.targetYaw = bot.yaw;
            }
        });

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const alive = this.particles[i].update(delta);
            if (!alive) {
                this.scene.remove(this.particles[i].mesh);
                this.particles.splice(i, 1);
            }
        }

        this.asteroids.forEach((a) => {
            const rot = (a as unknown as { rotVec: THREE.Vector3 }).rotVec;
            a.rotation.x += delta * rot.x;
            a.rotation.y += delta * rot.y;
            a.rotation.z += delta * rot.z;
            if (this.ship && a.position.distanceTo(this.ship.position) > 420) {
                this.respawnAheadOfShip(a, 240, 390, 260);
            }
        });

        this.rings.forEach((r) => {
            const ringData = r as unknown as { glyph: THREE.Mesh; cooldown: number };
            if (ringData.glyph) {
                ringData.glyph.rotation.y += delta * 1.2;
                ringData.glyph.rotation.x += delta * 0.7;
            }
            if (ringData.cooldown > 0) ringData.cooldown -= delta;

            if (this.ship && ringData.cooldown <= 0 && r.position.distanceTo(this.ship.position) < 17.5) {
                ringData.cooldown = 5.0;
                this.score += 500;
                this.portalBoost = 40.0;
                this.audio.playPortalChord();
                for (let k = 0; k < 18; k++) {
                    const p = new MoteParticle(this.ship.position, 0xffbe6b, this.ship);
                    this.scene.add(p.mesh);
                    this.particles.push(p);
                }
            }

            if (this.ship && r.position.distanceTo(this.ship.position) > 420) {
                this.respawnAheadOfShip(r, 220, 380, 180);
                r.rotation.y = this.shipYaw;
            }
        });

        for (let i = this.pulses.length - 1; i >= 0; i--) {
            const b = this.pulses[i];
            b.mesh.position.addScaledVector(b.dir, delta * 220);
            b.life -= delta;
            if (b.life <= 0) {
                this.scene.remove(b.mesh);
                this.pulses.splice(i, 1);
            }
        }

        for (let i = this.crystals.length - 1; i >= 0; i--) {
            const c = this.crystals[i];
            const meta = c as unknown as { rotSpeed: number; baseY: number; phase: number };
            c.position.y = meta.baseY + Math.sin(elapsed * 1.6 + meta.phase) * 1.1;
            c.rotation.y += delta * meta.rotSpeed;

            if (this.ship) {
                const distToShip = c.position.distanceTo(this.ship.position);
                if (distToShip < 9.0) {
                    this.harvestCrystal(i);
                    continue;
                }
                if (distToShip > 380) {
                    this.respawnAheadOfShip(c, 160, 340, 160);
                    continue;
                }
            }

            for (let j = this.pulses.length - 1; j >= 0; j--) {
                if (c.position.distanceTo(this.pulses[j].mesh.position) < 5.2) {
                    this.scene.remove(this.pulses[j].mesh);
                    this.pulses.splice(j, 1);
                    this.harvestCrystal(i);
                    break;
                }
            }
        }
    }

    public destroy() {
        this.isDestroyed = true;
        this.audio.destroy();
        if (this.envRT) this.envRT.dispose();
        this.pmremGenerator.dispose();
        this.composer.dispose();
        this.renderer.dispose();
        const container = document.getElementById('canvas-container');
        if (container) container.innerHTML = '';
        window.removeEventListener('resize', this.resizeHandler);
    }

    private onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
    }

    private animate() {
        if (this.isDestroyed) return;
        requestAnimationFrame(() => this.animate());
        this.update();
        this.composer.render();
    }
}
