import React, { useState, useEffect } from 'react';
import { Activity, Zap, Eye, Radar, Settings } from 'lucide-react';
import { GameState } from '../types/GameTypes';
import GameEngine from '../engine/GameEngine';

interface HUDProps {
  gameState: GameState;
  onSystemUpdate: (system: string, values: any) => void;
  engine: GameEngine | null;
}

const HUD: React.FC<HUDProps> = ({ gameState, onSystemUpdate, engine }) => {
  const [showSystemPanel, setShowSystemPanel] = useState(false);
  const [altitude, setAltitude] = useState(100);
  const [speed, setSpeed] = useState(0);
  const [heading, setHeading] = useState(0);

  useEffect(() => {
    // Update HUD readings from engine
    const updateInterval = setInterval(() => {
      if (engine) {
        // Get real-time data from physics engine
        const velocity = engine.physicsEngine?.getVelocity() || { x: 0, y: 0, z: 0 };
        const currentSpeed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2);
        setSpeed(Math.round(currentSpeed * 10) / 10);
      }
    }, 100);

    return () => clearInterval(updateInterval);
  }, [engine]);

  const handlePropulsionChange = (field: string, value: number) => {
    onSystemUpdate('propulsion', { [field]: value });
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const toggleCloaking = () => {
    const newState = !gameState.systems.cloaking.active;
    onSystemUpdate('cloaking', { active: newState });
    
    // Strong haptic feedback for cloaking
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Primary HUD Display */}
      <div className="absolute top-4 left-4 right-4 pointer-events-auto">
        <div className="bg-black/70 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-4">
          <div className="grid grid-cols-3 gap-4 text-cyan-400 font-mono">
            {/* Altitude */}
            <div className="text-center">
              <div className="text-xs text-cyan-300">ALT</div>
              <div className="text-2xl font-bold">{altitude}m</div>
            </div>
            
            {/* Speed */}
            <div className="text-center">
              <div className="text-xs text-cyan-300">SPD</div>
              <div className="text-2xl font-bold">{speed}</div>
            </div>
            
            {/* Heading */}
            <div className="text-center">
              <div className="text-xs text-cyan-300">HDG</div>
              <div className="text-2xl font-bold">{heading}°</div>
            </div>
          </div>
        </div>
      </div>

      {/* System Status Bar */}
      <div className="absolute top-20 left-4 right-4 pointer-events-auto">
        <div className="flex justify-between items-center">
          {/* Propulsion Status */}
          <div className="flex items-center space-x-2 bg-black/70 backdrop-blur-sm border border-blue-500/30 rounded-lg px-3 py-2">
            <Zap className="w-4 h-4 text-blue-400" />
            <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-300"
                style={{ width: `${gameState.systems.propulsion.plasmaRate * 100}%` }}
              />
            </div>
          </div>

          {/* Cloaking Status */}
          <button
            onClick={toggleCloaking}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg backdrop-blur-sm border transition-all duration-300 ${
              gameState.systems.cloaking.active
                ? 'bg-purple-900/70 border-purple-500/50 text-purple-300'
                : 'bg-black/70 border-gray-500/30 text-gray-400'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span className="text-xs font-mono">
              {gameState.systems.cloaking.active ? 'CLOAKED' : 'VISIBLE'}
            </span>
          </button>

          {/* Sensors Status */}
          <div className="flex items-center space-x-2 bg-black/70 backdrop-blur-sm border border-green-500/30 rounded-lg px-3 py-2">
            <Radar className="w-4 h-4 text-green-400" />
            <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-400 to-green-600 w-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Touch Flight Controls - Mobile Optimized */}
      <div className="absolute bottom-4 left-4 right-4 pointer-events-auto md:hidden">
        <div className="grid grid-cols-2 gap-4">
          {/* Left Control Pad */}
          <div className="bg-black/70 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-4">
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 rounded-full border-2 border-cyan-500/50"></div>
              <div className="absolute top-1/2 left-1/2 w-8 h-8 -mt-4 -ml-4 bg-cyan-500/80 rounded-full"></div>
            </div>
            <div className="text-center text-xs text-cyan-300 mt-2">FLIGHT</div>
          </div>

          {/* Right Control Pad */}
          <div className="bg-black/70 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-4">
            <div className="space-y-2">
              <button
                onTouchStart={() => handlePropulsionChange('plasmaRate', Math.min(1, gameState.systems.propulsion.plasmaRate + 0.1))}
                className="w-full py-2 bg-blue-600/50 rounded text-xs text-blue-200 active:bg-blue-600/80"
              >
                THRUST +
              </button>
              <button
                onTouchStart={() => handlePropulsionChange('plasmaRate', Math.max(0, gameState.systems.propulsion.plasmaRate - 0.1))}
                className="w-full py-2 bg-blue-600/50 rounded text-xs text-blue-200 active:bg-blue-600/80"
              >
                THRUST -
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Systems Panel Toggle */}
      <button
        onClick={() => setShowSystemPanel(!showSystemPanel)}
        className="absolute bottom-4 right-4 w-12 h-12 bg-black/70 backdrop-blur-sm border border-cyan-500/30 rounded-lg flex items-center justify-center pointer-events-auto"
      >
        <Settings className="w-6 h-6 text-cyan-400" />
      </button>

      {/* Advanced Systems Panel */}
      {showSystemPanel && (
        <div className="absolute bottom-20 right-4 w-80 bg-black/90 backdrop-blur-sm border border-cyan-500/50 rounded-lg p-4 pointer-events-auto">
          <h3 className="text-cyan-400 font-bold mb-4">SYSTEM DIAGNOSTICS</h3>
          
          {/* Propulsion Controls */}
          <div className="mb-4">
            <h4 className="text-blue-400 text-sm mb-2">PROPULSION MATRIX</h4>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-300">Plasma Rate: {Math.round(gameState.systems.propulsion.plasmaRate * 100)}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={gameState.systems.propulsion.plasmaRate * 100}
                  onChange={(e) => handlePropulsionChange('plasmaRate', parseInt(e.target.value) / 100)}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
                />
              </div>
              <div>
                <label className="text-xs text-gray-300">Coil Temperature: {Math.round(gameState.systems.propulsion.coilTemp * 100)}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={gameState.systems.propulsion.coilTemp * 100}
                  onChange={(e) => handlePropulsionChange('coilTemp', parseInt(e.target.value) / 100)}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div>
                <label className="text-xs text-gray-300">Anti-Gravity: {Math.round(gameState.systems.propulsion.antiGravity * 100)}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={gameState.systems.propulsion.antiGravity * 100}
                  onChange={(e) => handlePropulsionChange('antiGravity', parseInt(e.target.value) / 100)}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Cloaking Status */}
          <div className="mb-4">
            <h4 className="text-purple-400 text-sm mb-2">METAMATERIAL CLOAK</h4>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-300">Integrity:</span>
              <span className="text-xs text-purple-300">{Math.round(gameState.systems.cloaking.integrity * 100)}%</span>
            </div>
            <div className="w-full h-2 bg-gray-700 rounded-full mt-1">
              <div 
                className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full transition-all duration-300"
                style={{ width: `${gameState.systems.cloaking.integrity * 100}%` }}
              />
            </div>
          </div>

          {/* Neural Link Status */}
          <div className="mb-4">
            <h4 className="text-green-400 text-sm mb-2">NEURAL INTERFACE</h4>
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-green-400" />
              <span className="text-xs text-green-300">SYNCHRONIZED</span>
            </div>
          </div>
        </div>
      )}

      {/* Mission Objectives */}
      <div className="absolute top-4 right-4 w-64 bg-black/70 backdrop-blur-sm border border-amber-500/30 rounded-lg p-3 pointer-events-auto">
        <h4 className="text-amber-400 text-sm font-bold mb-2">MISSION OBJECTIVES</h4>
        <div className="space-y-1 text-xs text-amber-200">
          <div>• Maintain stealth integrity</div>
          <div>• Complete reconnaissance sweep</div>
          <div>• Return to base undetected</div>
        </div>
      </div>
    </div>
  );
};

export default HUD;