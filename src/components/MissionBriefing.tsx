import React, { useState } from 'react';
import { Play, Lock, Star, Zap, Eye } from 'lucide-react';
import { PlayerData } from '../types/GameTypes';

interface MissionBriefingProps {
  onStartMission: (missionId: string) => void;
  playerData: PlayerData;
}

const MissionBriefing: React.FC<MissionBriefingProps> = ({ onStartMission, playerData }) => {
  const [selectedMission, setSelectedMission] = useState('urban-recon-01');

  const missions = [
    {
      id: 'urban-recon-01',
      name: 'Urban Reconnaissance Alpha',
      type: 'Atmospheric Operations',
      difficulty: 1,
      description: 'Conduct stealth surveillance over metropolitan area using adaptive metamaterial cloaking.',
      objectives: [
        'Maintain cloak integrity above 80%',
        'Scan 5 designated targets',
        'Avoid radar detection systems',
        'Complete mission in under 5 minutes'
      ],
      rewards: '+150 XP, Plasma Efficiency Upgrade',
      unlocked: true,
      environment: 'Night City',
      duration: '5-8 minutes'
    },
    {
      id: 'lunar-survey-01',
      name: 'Lunar Anomaly Survey',
      type: 'Deep Space Operations',
      difficulty: 3,
      description: 'Investigate quantum signatures detected on lunar surface. Neural stability required.',
      objectives: [
        'Navigate to coordinates 23.5°N, 17.3°E',
        'Deploy quantum sensor probes',
        'Analyze temporal distortion fields',
        'Maintain psychological coherence'
      ],
      rewards: '+300 XP, Quantum Entanglement Comms',
      unlocked: playerData.experience >= 200,
      environment: 'Lunar Surface',
      duration: '10-15 minutes'
    },
    {
      id: 'first-contact-01',
      name: 'First Contact Protocol',
      type: 'Hybrid Operations',
      difficulty: 5,
      description: 'Classified. Deep Black clearance required. Psychological evaluation mandatory.',
      objectives: [
        'CLASSIFIED',
        'CLASSIFIED',
        'CLASSIFIED'
      ],
      rewards: '???',
      unlocked: playerData.experience >= 1000,
      environment: 'Unknown',
      duration: 'Variable'
    }
  ];

  const selectedMissionData = missions.find(m => m.id === selectedMission);

  return (
    <div className="absolute inset-0 bg-gradient-to-b from-black via-blue-950/20 to-black flex items-center justify-center p-4">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Mission Selection Panel */}
        <div className="bg-black/80 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-cyan-400">PROJECT MANTA</h2>
            <div className="text-right">
              <div className="text-sm text-cyan-300">Deep Black Operations</div>
              <div className="text-xs text-gray-400">CLASSIFIED - EYES ONLY</div>
            </div>
          </div>

          {/* Pilot Status */}
          <div className="mb-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-cyan-400 font-semibold">Pilot Status</span>
              <span className="text-amber-400">{playerData.rank}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300">Experience</span>
              <span className="text-cyan-300">{playerData.experience} XP</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300">Missions Completed</span>
              <span className="text-green-400">{playerData.missionStats.completed}</span>
            </div>
          </div>

          {/* Mission List */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-cyan-400 mb-4">Available Operations</h3>
            {missions.map((mission) => (
              <div
                key={mission.id}
                onClick={() => mission.unlocked && setSelectedMission(mission.id)}
                className={`p-4 rounded-lg border transition-all duration-300 cursor-pointer ${
                  mission.unlocked
                    ? selectedMission === mission.id
                      ? 'bg-cyan-900/30 border-cyan-500/50'
                      : 'bg-gray-900/30 border-gray-600/30 hover:border-cyan-500/30'
                    : 'bg-gray-900/20 border-gray-700/20 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className={`font-semibold ${mission.unlocked ? 'text-white' : 'text-gray-500'}`}>
                    {mission.name}
                  </h4>
                  <div className="flex items-center space-x-2">
                    {!mission.unlocked && <Lock className="w-4 h-4 text-gray-500" />}
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < mission.difficulty ? 'text-amber-400 fill-current' : 'text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className={`text-sm ${mission.unlocked ? 'text-cyan-300' : 'text-gray-600'}`}>
                  {mission.type}
                </div>
                <div className={`text-xs mt-1 ${mission.unlocked ? 'text-gray-300' : 'text-gray-600'}`}>
                  {mission.duration} • {mission.environment}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mission Details Panel */}
        <div className="bg-black/80 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-6">
          {selectedMissionData && (
            <>
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-2">{selectedMissionData.name}</h3>
                <div className="flex items-center space-x-4 text-sm text-cyan-300 mb-4">
                  <span>{selectedMissionData.type}</span>
                  <span>•</span>
                  <span>{selectedMissionData.environment}</span>
                  <span>•</span>
                  <span>{selectedMissionData.duration}</span>
                </div>
                <p className="text-gray-300 leading-relaxed">{selectedMissionData.description}</p>
              </div>

              {/* Mission Objectives */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-amber-400 mb-3">Mission Objectives</h4>
                <div className="space-y-2">
                  {selectedMissionData.objectives.map((objective, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-300 text-sm">{objective}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* System Requirements */}
              <div className="mb-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700/50">
                <h4 className="text-lg font-semibold text-blue-400 mb-3">System Requirements</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <Zap className="w-6 h-6 text-blue-400 mx-auto mb-1" />
                    <div className="text-blue-300">Propulsion</div>
                    <div className="text-gray-400">Anti-Gravity</div>
                  </div>
                  <div className="text-center">
                    <Eye className="w-6 h-6 text-purple-400 mx-auto mb-1" />
                    <div className="text-purple-300">Cloaking</div>
                    <div className="text-gray-400">Metamaterial</div>
                  </div>
                  <div className="text-center">
                    <div className="w-6 h-6 bg-green-400 rounded-full mx-auto mb-1 flex items-center justify-center">
                      <div className="w-2 h-2 bg-black rounded-full"></div>
                    </div>
                    <div className="text-green-300">Neural Link</div>
                    <div className="text-gray-400">Synchronized</div>
                  </div>
                </div>
              </div>

              {/* Mission Rewards */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-green-400 mb-2">Mission Rewards</h4>
                <p className="text-green-300 text-sm">{selectedMissionData.rewards}</p>
              </div>

              {/* Start Mission Button */}
              <button
                onClick={() => selectedMissionData.unlocked && onStartMission(selectedMissionData.id)}
                disabled={!selectedMissionData.unlocked}
                className={`w-full py-4 rounded-lg font-bold text-lg transition-all duration-300 flex items-center justify-center space-x-3 ${
                  selectedMissionData.unlocked
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Play className="w-6 h-6" />
                <span>{selectedMissionData.unlocked ? 'INITIATE MISSION' : 'LOCKED'}</span>
              </button>

              {!selectedMissionData.unlocked && (
                <div className="mt-3 p-3 bg-amber-900/20 border border-amber-600/30 rounded-lg">
                  <p className="text-amber-300 text-sm text-center">
                    Insufficient clearance level. Complete previous missions to unlock.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MissionBriefing;