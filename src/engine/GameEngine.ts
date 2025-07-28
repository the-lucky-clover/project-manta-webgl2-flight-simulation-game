import { mat4, vec3, quat } from 'gl-matrix';
import { Mission, Vector3, Transform } from '../types/GameTypes';
import PhysicsEngine from './PhysicsEngine';
import RenderEngine from './RenderEngine';
import AudioEngine from './AudioEngine';
import InputManager from './InputManager';

export default class GameEngine {
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext | null = null;
  public physicsEngine: PhysicsEngine;
  private renderEngine: RenderEngine | null = null;
  private audioEngine: AudioEngine;
  private inputManager: InputManager;
  
  private lastTime = 0;
  private deltaTime = 0;
  private isRunning = false;
  
  private craftTransform: Transform = {
    position: { x: 0, y: 100, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 }
  };
  
  private currentMission: Mission | null = null;
  private systemStates = {
    propulsion: { plasmaRate: 0.5, coilTemp: 0.3, antiGravity: 0.7 },
    cloaking: { active: false, integrity: 1.0, heat: 0 },
    sensors: { active: true, range: 1000, quantum: false }
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.physicsEngine = new PhysicsEngine();
    this.audioEngine = new AudioEngine();
    this.inputManager = new InputManager(canvas);
    
    this.setupEventListeners();
  }

  async initialize(): Promise<void> {
    // Initialize WebGL2 context with error handling
    const gl = this.canvas.getContext('webgl2', {
      alpha: false,
      antialias: true,
      depth: true,
      stencil: false,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance'
    });
    
    if (!gl) {
      throw new Error('WebGL2 not supported. Please use a modern browser with WebGL2 support.');
    }
    
    this.gl = gl;
    
    // Initialize render engine
    this.renderEngine = new RenderEngine(gl);
    await this.renderEngine.initialize();
    
    // Initialize other subsystems
    await this.audioEngine.initialize();
    this.inputManager.initialize();
    
    // Setup viewport
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    
    // Enable WebGL features
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.enable(this.gl.CULL_FACE);
    this.gl.cullFace(this.gl.BACK);
    this.gl.frontFace(this.gl.CCW);
    
    this.isRunning = true;
    console.log('Project MANTA - Game Engine Initialized');
  }

  private setupEventListeners(): void {
    // Handle input events
    this.inputManager.onTouch = (type, touches) => {
      this.handleTouchInput(type, touches);
    };
    
    this.inputManager.onKey = (key, pressed) => {
      this.handleKeyInput(key, pressed);
    };
    
    // Handle visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pause();
      } else {
        this.resume();
      }
    });
  }

  private resizeCanvas(): void {
    const devicePixelRatio = window.devicePixelRatio || 1;
    const displayWidth = this.canvas.clientWidth * devicePixelRatio;
    const displayHeight = this.canvas.clientHeight * devicePixelRatio;
    
    if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
      this.canvas.width = displayWidth;
      this.canvas.height = displayHeight;
      
      if (this.gl) {
        this.gl.viewport(0, 0, displayWidth, displayHeight);
      }
      
      // Update render engine with new dimensions
      if (this.renderEngine) {
        this.renderEngine.updateViewport(displayWidth, displayHeight);
      }
    }
  }

  render(): void {
    if (!this.isRunning || !this.gl || !this.renderEngine) return;
    
    const currentTime = performance.now();
    this.deltaTime = (currentTime - this.lastTime) / 1000.0;
    this.lastTime = currentTime;
    
    // Update physics
    this.physicsEngine.update(this.deltaTime, this.systemStates, this.craftTransform);
    
    // Update audio
    this.audioEngine.update(this.deltaTime, this.systemStates, this.craftTransform);
    
    // Clear buffers
    this.gl.clearColor(0.02, 0.02, 0.1, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    
    // Render scene
    this.renderEngine.render(this.deltaTime, this.craftTransform, this.systemStates);
  }

  startMission(missionId: string): void {
    // Load mission data
    this.currentMission = this.getMissionById(missionId);
    if (this.currentMission) {
      console.log(`Starting mission: ${this.currentMission.name}`);
      
      // Initialize mission environment
      if (this.renderEngine) {
        this.renderEngine.loadEnvironment(this.currentMission.environment);
      }
      this.audioEngine.playMissionAudio(this.currentMission.type);
      
      // Reset craft position
      this.craftTransform.position = { x: 0, y: 100, z: 0 };
      this.craftTransform.rotation = { x: 0, y: 0, z: 0, w: 1 };
    }
  }

  updateSystem(system: string, values: any): void {
    if (system in this.systemStates) {
      this.systemStates[system as keyof typeof this.systemStates] = {
        ...this.systemStates[system as keyof typeof this.systemStates],
        ...values
      };
      
      // Trigger audio feedback
      this.audioEngine.playSystemSound(system, values);
    }
  }

  private handleTouchInput(type: string, touches: Touch[]): void {
    // Handle touch-based flight controls
    if (touches.length === 1) {
      const touch = touches[0];
      const normalizedX = (touch.clientX / this.canvas.clientWidth) * 2 - 1;
      const normalizedY = (touch.clientY / this.canvas.clientHeight) * 2 - 1;
      
      // Convert touch to flight input
      this.physicsEngine.applyControlInput({
        pitch: -normalizedY * 0.02,
        yaw: normalizedX * 0.02,
        roll: 0,
        thrust: 0.7
      });
    }
  }

  private handleKeyInput(key: string, pressed: boolean): void {
    // Handle keyboard controls for desktop
    const inputStrength = pressed ? 1 : 0;
    
    switch (key.toLowerCase()) {
      case 'w':
        this.physicsEngine.applyControlInput({ pitch: -0.02 * inputStrength, yaw: 0, roll: 0, thrust: 0.8 });
        break;
      case 's':
        this.physicsEngine.applyControlInput({ pitch: 0.02 * inputStrength, yaw: 0, roll: 0, thrust: 0.8 });
        break;
      case 'a':
        this.physicsEngine.applyControlInput({ pitch: 0, yaw: -0.02 * inputStrength, roll: 0, thrust: 0.8 });
        break;
      case 'd':
        this.physicsEngine.applyControlInput({ pitch: 0, yaw: 0.02 * inputStrength, roll: 0, thrust: 0.8 });
        break;
    }
  }

  private getMissionById(id: string): Mission | null {
    const missions: Mission[] = [
      {
        id: 'urban-recon-01',
        name: 'Urban Reconnaissance Alpha',
        type: 'atmospheric',
        difficulty: 1,
        description: 'Conduct stealth surveillance over metropolitan area.',
        objectives: ['Maintain cloak integrity', 'Scan designated targets', 'Avoid radar detection'],
        environment: 'urban-night',
        duration: 300
      },
      {
        id: 'lunar-survey-01',
        name: 'Lunar Anomaly Survey',
        type: 'deep-space',
        difficulty: 3,
        description: 'Investigate quantum signatures detected on lunar surface.',
        objectives: ['Navigate to coordinates', 'Deploy sensor probes', 'Analyze quantum data'],
        environment: 'lunar-surface',
        duration: 600
      }
    ];
    
    return missions.find(m => m.id === id) || null;
  }

  pause(): void {
    this.isRunning = false;
  }

  resume(): void {
    this.isRunning = true;
    this.lastTime = performance.now();
  }

  cleanup(): void {
    this.isRunning = false;
    if (this.renderEngine) {
      this.renderEngine.cleanup();
    }
    this.audioEngine.cleanup();
    this.inputManager.cleanup();
  }
}