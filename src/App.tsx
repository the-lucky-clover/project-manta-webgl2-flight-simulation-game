import React, { useEffect, useRef, useState } from 'react';
import GameEngine from './engine/GameEngine';
import HUD from './components/HUD';
import MissionBriefing from './components/MissionBriefing';
import { GameState } from './types/GameTypes';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    isInitialized: false,
    isPlaying: false,
    currentMission: null,
    playerData: {
      rank: 'Cadet',
      experience: 0,
      unlockedTech: [],
      missionStats: { completed: 0, stealth: 0, accuracy: 0 }
    },
    systems: {
      propulsion: { plasmaRate: 0.5, coilTemp: 0.3, antiGravity: 0.7 },
      cloaking: { active: false, integrity: 1.0, heat: 0 },
      sensors: { active: true, range: 1000, quantum: false }
    }
  });
  
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState('Initializing Deep Black Systems...');
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const initializeGame = async () => {
      if (canvasRef.current && !engineRef.current) {
        try {
          setLoadingStatus('Checking WebGL2 compatibility...');
          setLoadingProgress(10);
          
          // Check WebGL2 support
          const gl = canvasRef.current.getContext('webgl2');
          if (!gl) {
            throw new Error('WebGL2 not supported. Please use a modern browser.');
          }
          
          setLoadingStatus('Initializing quantum processors...');
          setLoadingProgress(25);
          
          const engine = new GameEngine(canvasRef.current);
          
          setLoadingStatus('Loading plasma ring calibration...');
          setLoadingProgress(50);
          
          await engine.initialize();
          engineRef.current = engine;
          
          setLoadingStatus('Synchronizing neural interface...');
          setLoadingProgress(75);
          
          // Simulate additional loading time for dramatic effect
          await new Promise(resolve => setTimeout(resolve, 500));
          
          setLoadingStatus('Systems online. Ready for deployment.');
          setLoadingProgress(100);
          
          // Wait a moment before showing the interface
          setTimeout(() => {
            setGameState(prev => ({ ...prev, isInitialized: true }));
          }, 1000);
          
          // Start render loop
          const renderLoop = () => {
            if (engineRef.current) {
              engineRef.current.render();
              requestAnimationFrame(renderLoop);
            }
          };
          renderLoop();
          
        } catch (error) {
          console.error('Failed to initialize game engine:', error);
          setInitError(error instanceof Error ? error.message : 'Unknown initialization error');
        }
      }
    };

    initializeGame();

    return () => {
      if (engineRef.current) {
        engineRef.current.cleanup();
      }
    };
  }, []);

  const handleStartMission = (missionId: string) => {
    if (engineRef.current) {
      engineRef.current.startMission(missionId);
      setGameState(prev => ({ 
        ...prev, 
        isPlaying: true,
        currentMission: missionId
      }));
    }
  };

  const handleSystemUpdate = (system: string, values: any) => {
    if (engineRef.current) {
      engineRef.current.updateSystem(system, values);
      setGameState(prev => ({
        ...prev,
        systems: { ...prev.systems, [system]: { ...prev.systems[system as keyof typeof prev.systems], ...values } }
      }));
    }
  };

  // Error state
  if (initError) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center text-red-400 max-w-md">
          <div className="text-4xl font-bold mb-4">SYSTEM ERROR</div>
          <div className="text-lg mb-4">PROJECT MANTA - INITIALIZATION FAILED</div>
          <div className="text-sm bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-4">
            {initError}
          </div>
          <div className="text-xs text-gray-400">
            Please ensure you're using a modern browser with WebGL2 support.
            <br />
            Chrome 56+, Firefox 51+, Safari 15+, or Edge 79+
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
          >
            RETRY INITIALIZATION
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (!gameState.isInitialized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-cyan-400">
          <div className="text-4xl font-bold mb-4 holographic">PROJECT MANTA</div>
          <div className="text-lg mb-6">{loadingStatus}</div>
          
          {/* Progress Bar */}
          <div className="w-80 h-3 bg-gray-800 rounded-full overflow-hidden mb-4">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500 ease-out"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
          
          {/* Progress Percentage */}
          <div className="text-sm text-cyan-300 mb-8">{loadingProgress}% Complete</div>
          
          {/* Loading Animation */}
          <div className="flex justify-center space-x-2">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
          
          {/* System Status */}
          <div className="mt-8 text-xs text-gray-400 space-y-1">
            <div className={loadingProgress >= 10 ? 'text-green-400' : ''}>✓ WebGL2 Compatibility Check</div>
            <div className={loadingProgress >= 25 ? 'text-green-400' : ''}>✓ Quantum Processor Array</div>
            <div className={loadingProgress >= 50 ? 'text-green-400' : ''}>✓ Plasma Ring Calibration</div>
            <div className={loadingProgress >= 75 ? 'text-green-400' : ''}>✓ Neural Interface Sync</div>
            <div className={loadingProgress >= 100 ? 'text-green-400' : ''}>✓ Deep Black Systems Online</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ touchAction: 'none' }}
      />
      
      {!gameState.isPlaying && (
        <MissionBriefing
          onStartMission={handleStartMission}
          playerData={gameState.playerData}
        />
      )}
      
      {gameState.isPlaying && (
        <HUD
          gameState={gameState}
          onSystemUpdate={handleSystemUpdate}
          engine={engineRef.current}
        />
      )}
    </div>
  );
}

export default App;