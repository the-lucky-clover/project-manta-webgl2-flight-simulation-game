import { vec3, quat } from 'gl-matrix';
import { Transform, Vector3 } from '../types/GameTypes';

interface ControlInput {
  pitch?: number;
  yaw?: number;
  roll?: number;
  thrust?: number;
}

export default class PhysicsEngine {
  private velocity: Vector3 = { x: 0, y: 0, z: 0 };
  private angularVelocity: Vector3 = { x: 0, y: 0, z: 0 };
  private lastControlInput: ControlInput = {};
  
  // Anti-gravity constants
  private readonly PLASMA_EFFICIENCY = 0.85;
  private readonly MAGNETIC_FLUX_CONSTANT = 432.7; // THz resonance
  private readonly GRAVITY_CONSTANT = 9.81;
  
  update(deltaTime: number, systemStates: any, transform: Transform): void {
    // Apply anti-gravity propulsion physics
    this.updatePropulsion(deltaTime, systemStates.propulsion, transform);
    
    // Apply cloaking effects on mass
    this.updateCloakingPhysics(systemStates.cloaking, transform);
    
    // Integrate velocity
    transform.position.x += this.velocity.x * deltaTime;
    transform.position.y += this.velocity.y * deltaTime;
    transform.position.z += this.velocity.z * deltaTime;
    
    // Integrate angular velocity
    const rotationQuat = quat.create();
    quat.set(rotationQuat, transform.rotation.x, transform.rotation.y, transform.rotation.z, transform.rotation.w);
    
    const angularQuatStep = quat.create();
    quat.fromEuler(angularQuatStep, 
      this.angularVelocity.x * deltaTime * 57.2958, // Convert to degrees
      this.angularVelocity.y * deltaTime * 57.2958,
      this.angularVelocity.z * deltaTime * 57.2958
    );
    
    quat.multiply(rotationQuat, rotationQuat, angularQuatStep);
    quat.normalize(rotationQuat, rotationQuat);
    
    transform.rotation.x = rotationQuat[0];
    transform.rotation.y = rotationQuat[1];
    transform.rotation.z = rotationQuat[2];
    transform.rotation.w = rotationQuat[3];
    
    // Apply damping
    this.velocity.x *= 0.98;
    this.velocity.y *= 0.98;
    this.velocity.z *= 0.98;
    
    this.angularVelocity.x *= 0.95;
    this.angularVelocity.y *= 0.95;
    this.angularVelocity.z *= 0.95;
  }
  
  private updatePropulsion(deltaTime: number, propulsion: any, transform: Transform): void {
    // Calculate plasma ring efficiency
    const plasmaEfficiency = propulsion.plasmaRate * this.PLASMA_EFFICIENCY;
    const coilResonance = Math.sin(Date.now() * 0.001 * this.MAGNETIC_FLUX_CONSTANT) * 0.1 + 0.9;
    const antiGravityForce = propulsion.antiGravity * coilResonance;
    
    // Apply anti-gravity lift
    const gravitationalForce = -this.GRAVITY_CONSTANT * (1.0 - antiGravityForce);
    this.velocity.y += gravitationalForce * deltaTime;
    
    // Apply directional thrust from control input
    if (this.lastControlInput.thrust) {
      const thrustMagnitude = this.lastControlInput.thrust * plasmaEfficiency * 50.0;
      
      // Convert craft orientation to thrust direction
      const forward = this.getForwardVector(transform);
      this.velocity.x += forward.x * thrustMagnitude * deltaTime;
      this.velocity.y += forward.y * thrustMagnitude * deltaTime;
      this.velocity.z += forward.z * thrustMagnitude * deltaTime;
    }
    
    // Heat generation from plasma circulation
    const heatGeneration = propulsion.plasmaRate * propulsion.coilTemp * deltaTime;
    // This would affect cloaking integrity in a real implementation
  }
  
  private updateCloakingPhysics(cloaking: any, transform: Transform): void {
    if (cloaking.active) {
      // Cloaking affects mass distribution
      const cloakingMassReduction = cloaking.integrity * 0.3;
      // This would modify inertia and handling characteristics
      
      // Cloaking power consumption affects available thrust
      const powerDrain = 0.1 * (1.0 - cloaking.integrity);
      // Reduce available propulsion power when cloaking
    }
  }
  
  applyControlInput(input: ControlInput): void {
    this.lastControlInput = { ...this.lastControlInput, ...input };
    
    // Apply rotational forces
    if (input.pitch !== undefined) {
      this.angularVelocity.x += input.pitch;
    }
    if (input.yaw !== undefined) {
      this.angularVelocity.y += input.yaw;
    }
    if (input.roll !== undefined) {
      this.angularVelocity.z += input.roll;
    }
  }
  
  private getForwardVector(transform: Transform): Vector3 {
    // Calculate forward vector from quaternion rotation
    const quat_array = [transform.rotation.x, transform.rotation.y, transform.rotation.z, transform.rotation.w];
    const forward = vec3.create();
    
    // Default forward is -Z in our coordinate system
    vec3.set(forward, 0, 0, -1);
    vec3.transformQuat(forward, forward, quat_array);
    
    return { x: forward[0], y: forward[1], z: forward[2] };
  }
  
  getVelocity(): Vector3 {
    return { ...this.velocity };
  }
  
  getSpeed(): number {
    return Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2 + this.velocity.z ** 2);
  }
}