interface TouchHandler {
  (type: string, touches: Touch[]): void;
}

interface KeyHandler {
  (key: string, pressed: boolean): void;
}

export default class InputManager {
  private canvas: HTMLCanvasElement;
  private activeTouches: Map<number, Touch> = new Map();
  private pressedKeys: Set<string> = new Set();
  
  public onTouch: TouchHandler | null = null;
  public onKey: KeyHandler | null = null;
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }
  
  initialize(): void {
    // Touch events for mobile
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    this.canvas.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: false });
    
    // Mouse events for desktop (treat as touch)
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    
    // Keyboard events
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
    
    // Prevent context menu
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    
    console.log('Input Manager initialized');
  }
  
  private handleTouchStart(event: TouchEvent): void {
    event.preventDefault();
    
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      this.activeTouches.set(touch.identifier, touch);
    }
    
    this.triggerTouchEvent('start', Array.from(this.activeTouches.values()));
  }
  
  private handleTouchMove(event: TouchEvent): void {
    event.preventDefault();
    
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      this.activeTouches.set(touch.identifier, touch);
    }
    
    this.triggerTouchEvent('move', Array.from(this.activeTouches.values()));
  }
  
  private handleTouchEnd(event: TouchEvent): void {
    event.preventDefault();
    
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      this.activeTouches.delete(touch.identifier);
    }
    
    this.triggerTouchEvent('end', Array.from(this.activeTouches.values()));
  }
  
  private handleTouchCancel(event: TouchEvent): void {
    event.preventDefault();
    this.activeTouches.clear();
    this.triggerTouchEvent('cancel', []);
  }
  
  private handleMouseDown(event: MouseEvent): void {
    event.preventDefault();
    
    // Convert mouse to touch-like event
    const mockTouch = this.createMockTouch(event, 0);
    this.activeTouches.set(0, mockTouch);
    this.triggerTouchEvent('start', [mockTouch]);
  }
  
  private handleMouseMove(event: MouseEvent): void {
    if (this.activeTouches.has(0)) {
      const mockTouch = this.createMockTouch(event, 0);
      this.activeTouches.set(0, mockTouch);
      this.triggerTouchEvent('move', [mockTouch]);
    }
  }
  
  private handleMouseUp(event: MouseEvent): void {
    event.preventDefault();
    
    if (this.activeTouches.has(0)) {
      this.activeTouches.delete(0);
      this.triggerTouchEvent('end', []);
    }
  }
  
  private createMockTouch(event: MouseEvent, identifier: number): Touch {
    return {
      identifier,
      clientX: event.clientX,
      clientY: event.clientY,
      pageX: event.pageX,
      pageY: event.pageY,
      screenX: event.screenX,
      screenY: event.screenY,
      radiusX: 10,
      radiusY: 10,
      rotationAngle: 0,
      force: 1,
      target: event.target
    } as Touch;
  }
  
  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.pressedKeys.has(event.code)) {
      this.pressedKeys.add(event.code);
      this.triggerKeyEvent(event.code, true);
    }
  }
  
  private handleKeyUp(event: KeyboardEvent): void {
    if (this.pressedKeys.has(event.code)) {
      this.pressedKeys.delete(event.code);
      this.triggerKeyEvent(event.code, false);
    }
  }
  
  private triggerTouchEvent(type: string, touches: Touch[]): void {
    if (this.onTouch) {
      this.onTouch(type, touches);
    }
  }
  
  private triggerKeyEvent(key: string, pressed: boolean): void {
    if (this.onKey) {
      // Convert key codes to readable format
      const keyMap: { [key: string]: string } = {
        'KeyW': 'w',
        'KeyA': 'a',
        'KeyS': 's',
        'KeyD': 'd',
        'Space': ' ',
        'ShiftLeft': 'shift',
        'ControlLeft': 'ctrl'
      };
      
      const mappedKey = keyMap[key] || key.toLowerCase();
      this.onKey(mappedKey, pressed);
    }
  }
  
  // Haptic feedback simulation for mobile devices
  vibrate(pattern: number | number[]): void {
    if (navigator.vibrate && typeof pattern !== 'undefined') {
      navigator.vibrate(pattern);
    }
  }
  
  cleanup(): void {
    // Remove all event listeners
    this.activeTouches.clear();
    this.pressedKeys.clear();
  }
}