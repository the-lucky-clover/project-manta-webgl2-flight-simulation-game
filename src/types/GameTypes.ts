export interface PlayerData {
  rank: string;
  experience: number;
  unlockedTech: string[];
  missionStats: {
    completed: number;
    stealth: number;
    accuracy: number;
  };
}

export interface SystemState {
  propulsion: {
    plasmaRate: number;
    coilTemp: number;
    antiGravity: number;
  };
  cloaking: {
    active: boolean;
    integrity: number;
    heat: number;
  };
  sensors: {
    active: boolean;
    range: number;
    quantum: boolean;
  };
}

export interface GameState {
  isInitialized: boolean;
  isPlaying: boolean;
  currentMission: string | null;
  playerData: PlayerData;
  systems: SystemState;
}

export interface Mission {
  id: string;
  name: string;
  type: 'atmospheric' | 'deep-space' | 'hybrid';
  difficulty: number;
  description: string;
  objectives: string[];
  environment: string;
  duration: number;
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface Transform {
  position: Vector3;
  rotation: Quaternion;
  scale: Vector3;
}