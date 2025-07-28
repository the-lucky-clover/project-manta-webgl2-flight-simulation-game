export default class AudioEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private plasmaOscillators: OscillatorNode[] = [];
  private systemSounds: { [key: string]: AudioBuffer } = {};
  
  async initialize(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = 0.3;
      
      // Create plasma ring resonance oscillators
      this.createPlasmaOscillators();
      
      console.log('Audio Engine initialized');
    } catch (error) {
      console.warn('Audio initialization failed:', error);
    }
  }
  
  private createPlasmaOscillators(): void {
    if (!this.audioContext || !this.masterGain) return;
    
    // Create three oscillators for the plasma rings (432.7 THz fundamental)
    const frequencies = [432.7, 865.4, 1298.1]; // Harmonics
    
    for (let i = 0; i < 3; i++) {
      const oscillator = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.value = frequencies[i];
      gain.gain.value = 0.0; // Start silent
      
      oscillator.connect(gain);
      gain.connect(this.masterGain);
      
      oscillator.start();
      this.plasmaOscillators.push(oscillator);
    }
  }
  
  update(deltaTime: number, systemStates: any, craftTransform: any): void {
    if (!this.audioContext || !this.masterGain) return;
    
    // Update plasma ring audio based on propulsion state
    this.updatePlasmaAudio(systemStates.propulsion);
    
    // Update 3D spatial audio positioning
    this.updateSpatialAudio(craftTransform);
    
    // Handle cloaking audio effects
    if (systemStates.cloaking.active) {
      this.applyDistortionEffects(systemStates.cloaking.integrity);
    }
  }
  
  private updatePlasmaAudio(propulsion: any): void {
    if (this.plasmaOscillators.length === 0) return;
    
    const intensity = propulsion.plasmaRate * propulsion.antiGravity;
    const temperature = propulsion.coilTemp;
    
    // Modulate oscillator volumes and frequencies
    this.plasmaOscillators.forEach((oscillator, index) => {
      const gainNode = oscillator.context.createGain();
      const baseFreq = 432.7 * (index + 1);
      const freqModulation = temperature * 50; // Temperature affects frequency
      
      oscillator.frequency.setValueAtTime(
        baseFreq + freqModulation,
        this.audioContext!.currentTime
      );
      
      // Volume based on plasma intensity
      gainNode.gain.setValueAtTime(
        intensity * 0.1,
        this.audioContext!.currentTime
      );
    });
  }
  
  private updateSpatialAudio(transform: any): void {
    // Implement 3D audio positioning based on craft movement
    // This would use Web Audio API's PannerNode for true 3D audio
  }
  
  private applyDistortionEffects(cloakingIntegrity: number): void {
    if (!this.masterGain) return;
    
    // Apply audio distortion when cloaking integrity is low
    const distortion = 1.0 - cloakingIntegrity;
    this.masterGain.gain.setValueAtTime(
      0.3 * (1.0 - distortion * 0.5),
      this.audioContext!.currentTime
    );
  }
  
  playSystemSound(system: string, values: any): void {
    if (!this.audioContext || !this.masterGain) return;
    
    // Play audio feedback for system changes
    switch (system) {
      case 'cloaking':
        if (values.active) {
          this.playCloakingActivation();
        }
        break;
      case 'propulsion':
        this.playPropulsionChange(values);
        break;
      case 'sensors':
        this.playSensorPing();
        break;
    }
  }
  
  private playCloakingActivation(): void {
    if (!this.audioContext || !this.masterGain) return;
    
    // Create a sweep effect for cloaking activation
    const oscillator = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(1000, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.5);
    
    gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
    
    oscillator.connect(gain);
    gain.connect(this.masterGain);
    
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.5);
  }
  
  private playPropulsionChange(values: any): void {
    // Play audio feedback for propulsion adjustments
    if (this.plasmaOscillators.length > 0) {
      // Temporary frequency sweep to indicate change
      const oscillator = this.plasmaOscillators[0];
      const currentTime = this.audioContext!.currentTime;
      
      oscillator.frequency.setValueAtTime(432.7, currentTime);
      oscillator.frequency.linearRampToValueAtTime(432.7 * (1 + values.plasmaRate * 0.1), currentTime + 0.1);
    }
  }
  
  private playSensorPing(): void {
    if (!this.audioContext || !this.masterGain) return;
    
    // Create a brief ping sound for sensor activation
    const oscillator = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.value = 800;
    
    gain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
    
    oscillator.connect(gain);
    gain.connect(this.masterGain);
    
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.1);
  }
  
  playMissionAudio(missionType: string): void {
    console.log(`Playing mission audio for: ${missionType}`);
    // Load and play mission-specific audio
  }
  
  cleanup(): void {
    if (this.audioContext) {
      this.plasmaOscillators.forEach(osc => osc.stop());
      this.audioContext.close();
    }
  }
}