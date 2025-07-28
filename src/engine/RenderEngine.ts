export default class RenderEngine {
  private gl: WebGL2RenderingContext;
  private shaderProgram: WebGLProgram | null = null;
  private vertexBuffer: WebGLBuffer | null = null;
  private indexBuffer: WebGLBuffer | null = null;
  private viewMatrix: Float32Array;
  private projectionMatrix: Float32Array;
  
  // Shader uniforms
  private uniformLocations: { [key: string]: WebGLUniformLocation | null } = {};
  
  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    this.viewMatrix = new Float32Array(16);
    this.projectionMatrix = new Float32Array(16);
  }
  
  async initialize(): Promise<void> {
    try {
      // Create shader program
      this.shaderProgram = this.createShaderProgram();
      if (!this.shaderProgram) {
        throw new Error('Failed to create shader program');
      }
      
      // Get uniform locations
      this.uniformLocations = {
        uModelMatrix: this.gl.getUniformLocation(this.shaderProgram, 'uModelMatrix'),
        uViewMatrix: this.gl.getUniformLocation(this.shaderProgram, 'uViewMatrix'),
        uProjectionMatrix: this.gl.getUniformLocation(this.shaderProgram, 'uProjectionMatrix'),
        uTime: this.gl.getUniformLocation(this.shaderProgram, 'uTime'),
        uCloakingActive: this.gl.getUniformLocation(this.shaderProgram, 'uCloakingActive'),
        uCloakingIntegrity: this.gl.getUniformLocation(this.shaderProgram, 'uCloakingIntegrity'),
        uPlasmaIntensity: this.gl.getUniformLocation(this.shaderProgram, 'uPlasmaIntensity')
      };
      
      // Create geometry
      this.createGeometry();
      
      // Setup projection matrix
      this.updateProjectionMatrix();
      
      console.log('Render Engine initialized successfully');
    } catch (error) {
      console.error('Render Engine initialization failed:', error);
      throw error;
    }
  }
  
  private createShaderProgram(): WebGLProgram | null {
    const vertexShaderSource = `#version 300 es
      precision highp float;
      
      in vec3 aPosition;
      in vec3 aNormal;
      in vec2 aTexCoord;
      
      uniform mat4 uModelMatrix;
      uniform mat4 uViewMatrix;
      uniform mat4 uProjectionMatrix;
      uniform float uTime;
      
      out vec3 vNormal;
      out vec2 vTexCoord;
      out vec3 vWorldPos;
      out float vTime;
      
      void main() {
        vec4 worldPos = uModelMatrix * vec4(aPosition, 1.0);
        vWorldPos = worldPos.xyz;
        vNormal = normalize((uModelMatrix * vec4(aNormal, 0.0)).xyz);
        vTexCoord = aTexCoord;
        vTime = uTime;
        
        gl_Position = uProjectionMatrix * uViewMatrix * worldPos;
      }
    `;
    
    const fragmentShaderSource = `#version 300 es
      precision highp float;
      
      in vec3 vNormal;
      in vec2 vTexCoord;
      in vec3 vWorldPos;
      in float vTime;
      
      uniform bool uCloakingActive;
      uniform float uCloakingIntegrity;
      uniform float uPlasmaIntensity;
      
      out vec4 fragColor;
      
      // Simple noise function for plasma effects
      float noise(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }
      
      // Plasma ring shader
      vec3 plasmaEffect(vec3 pos, float intensity) {
        float ringDist = length(pos.xz);
        float ringMask = smoothstep(0.8, 1.0, ringDist) * smoothstep(1.2, 1.0, ringDist);
        
        float plasmaFlow = sin(vTime * 10.0 + ringDist * 20.0) * 0.5 + 0.5;
        vec3 plasmaColor = mix(vec3(0.0, 0.5, 1.0), vec3(0.5, 0.0, 1.0), plasmaFlow);
        
        return plasmaColor * ringMask * intensity;
      }
      
      // Cloaking shimmer effect
      vec3 cloakingShimmer(vec3 baseColor, vec3 worldPos, float integrity) {
        float shimmer = noise(worldPos.xy * 5.0 + vTime * 2.0);
        shimmer = smoothstep(0.3, 0.7, shimmer);
        
        vec3 refraction = vec3(0.1, 0.2, 0.3) * (1.0 - integrity);
        return mix(baseColor + refraction, baseColor * 0.1, shimmer * (1.0 - integrity));
      }
      
      void main() {
        vec3 baseColor = vec3(0.1, 0.1, 0.15);
        
        // Add plasma ring effects
        vec3 plasmaColor = plasmaEffect(vWorldPos, uPlasmaIntensity);
        baseColor += plasmaColor;
        
        // Apply cloaking effects
        if (uCloakingActive) {
          baseColor = cloakingShimmer(baseColor, vWorldPos, uCloakingIntegrity);
          
          // Reduce opacity based on cloaking integrity
          fragColor = vec4(baseColor, uCloakingIntegrity * 0.3 + 0.1);
        } else {
          // Add normal lighting
          vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
          float NdotL = max(dot(vNormal, lightDir), 0.0);
          baseColor *= (0.3 + 0.7 * NdotL);
          
          fragColor = vec4(baseColor, 1.0);
        }
      }
    `;
    
    try {
      const vertexShader = this.compileShader(vertexShaderSource, this.gl.VERTEX_SHADER);
      const fragmentShader = this.compileShader(fragmentShaderSource, this.gl.FRAGMENT_SHADER);
      
      if (!vertexShader || !fragmentShader) {
        return null;
      }
      
      const program = this.gl.createProgram();
      if (!program) return null;
      
      this.gl.attachShader(program, vertexShader);
      this.gl.attachShader(program, fragmentShader);
      this.gl.linkProgram(program);
      
      if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
        console.error('Shader program linking failed:', this.gl.getProgramInfoLog(program));
        return null;
      }
      
      // Clean up shaders
      this.gl.deleteShader(vertexShader);
      this.gl.deleteShader(fragmentShader);
      
      return program;
    } catch (error) {
      console.error('Shader program creation failed:', error);
      return null;
    }
  }
  
  private compileShader(source: string, type: number): WebGLShader | null {
    const shader = this.gl.createShader(type);
    if (!shader) return null;
    
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('Shader compilation failed:', this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }
    
    return shader;
  }
  
  private createGeometry(): void {
    // Create simple triangle geometry for testing
    const vertices = new Float32Array([
      // Position (x,y,z), Normal (x,y,z), TexCoord (u,v)
       0.0,  0.5,  0.0,   0.0,  0.0,  1.0,   0.5, 1.0,
      -0.5, -0.5,  0.0,   0.0,  0.0,  1.0,   0.0, 0.0,
       0.5, -0.5,  0.0,   0.0,  0.0,  1.0,   1.0, 0.0,
    ]);
    
    const indices = new Uint16Array([0, 1, 2]);
    
    // Create vertex buffer
    this.vertexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);
    
    // Create index buffer
    this.indexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, indices, this.gl.STATIC_DRAW);
  }
  
  updateViewport(width: number, height: number): void {
    this.gl.viewport(0, 0, width, height);
    this.updateProjectionMatrix();
  }
  
  private updateProjectionMatrix(): void {
    const aspect = this.gl.canvas.width / this.gl.canvas.height;
    const fov = Math.PI / 4; // 45 degrees
    const near = 0.1;
    const far = 1000.0;
    
    // Create perspective projection matrix
    const f = Math.tan(Math.PI * 0.5 - 0.5 * fov);
    const rangeInv = 1.0 / (near - far);
    
    this.projectionMatrix.fill(0);
    this.projectionMatrix[0] = f / aspect;
    this.projectionMatrix[5] = f;
    this.projectionMatrix[10] = (near + far) * rangeInv;
    this.projectionMatrix[11] = -1;
    this.projectionMatrix[14] = near * far * rangeInv * 2;
  }
  
  render(deltaTime: number, craftTransform: any, systemStates: any): void {
    if (!this.shaderProgram) return;
    
    this.gl.useProgram(this.shaderProgram);
    
    // Update view matrix (simple camera)
    this.viewMatrix.fill(0);
    this.viewMatrix[0] = 1; this.viewMatrix[5] = 1; this.viewMatrix[10] = 1; this.viewMatrix[15] = 1;
    this.viewMatrix[14] = -5; // Move camera back
    
    // Create model matrix (identity for now)
    const modelMatrix = new Float32Array(16);
    modelMatrix.fill(0);
    modelMatrix[0] = 1; modelMatrix[5] = 1; modelMatrix[10] = 1; modelMatrix[15] = 1;
    
    // Set uniforms
    this.gl.uniformMatrix4fv(this.uniformLocations.uModelMatrix, false, modelMatrix);
    this.gl.uniformMatrix4fv(this.uniformLocations.uViewMatrix, false, this.viewMatrix);
    this.gl.uniformMatrix4fv(this.uniformLocations.uProjectionMatrix, false, this.projectionMatrix);
    this.gl.uniform1f(this.uniformLocations.uTime, performance.now() * 0.001);
    this.gl.uniform1i(this.uniformLocations.uCloakingActive, systemStates.cloaking.active ? 1 : 0);
    this.gl.uniform1f(this.uniformLocations.uCloakingIntegrity, systemStates.cloaking.integrity);
    this.gl.uniform1f(this.uniformLocations.uPlasmaIntensity, systemStates.propulsion.plasmaRate);
    
    // Bind vertex data
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    
    // Set vertex attributes
    const stride = 8 * Float32Array.BYTES_PER_ELEMENT;
    this.gl.vertexAttribPointer(0, 3, this.gl.FLOAT, false, stride, 0);
    this.gl.enableVertexAttribArray(0);
    this.gl.vertexAttribPointer(1, 3, this.gl.FLOAT, false, stride, 3 * Float32Array.BYTES_PER_ELEMENT);
    this.gl.enableVertexAttribArray(1);
    this.gl.vertexAttribPointer(2, 2, this.gl.FLOAT, false, stride, 6 * Float32Array.BYTES_PER_ELEMENT);
    this.gl.enableVertexAttribArray(2);
    
    // Enable blending for cloaking effects
    if (systemStates.cloaking.active) {
      this.gl.enable(this.gl.BLEND);
      this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    } else {
      this.gl.disable(this.gl.BLEND);
    }
    
    // Draw the geometry
    this.gl.drawElements(this.gl.TRIANGLES, 3, this.gl.UNSIGNED_SHORT, 0);
  }
  
  loadEnvironment(environment: string): void {
    console.log(`Loading environment: ${environment}`);
    // Load environment-specific assets and lighting
  }
  
  cleanup(): void {
    if (this.shaderProgram) {
      this.gl.deleteProgram(this.shaderProgram);
    }
    if (this.vertexBuffer) {
      this.gl.deleteBuffer(this.vertexBuffer);
    }
    if (this.indexBuffer) {
      this.gl.deleteBuffer(this.indexBuffer);
    }
  }
}