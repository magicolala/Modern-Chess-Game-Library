import { Position } from './ChessGame';
import { ChessRenderer } from './ChessRenderer';

export interface AnimationOptions {
  duration: number;
  easing: (t: number) => number;
}

export class ChessAnimator {
  private renderer: ChessRenderer;
  private activeAnimations: Map<string, Animation> = new Map();
  private animationId: number | null = null;

  constructor(renderer: ChessRenderer) {
    this.renderer = renderer;
  }

  public animateMove(
    from: Position,
    to: Position,
    options: Partial<AnimationOptions> = {}
  ): Promise<void> {
    return new Promise((resolve) => {
      const animationOptions: AnimationOptions = {
        duration: 300,
        easing: this.easeOutCubic,
        ...options
      };

      const animationKey = `${from.row}-${from.col}-${to.row}-${to.col}`;
      const startTime = performance.now();

      const animation: Animation = {
        from,
        to,
        startTime,
        options: animationOptions,
        onComplete: () => {
          this.activeAnimations.delete(animationKey);
          if (this.activeAnimations.size === 0) {
            this.stopAnimationLoop();
          }
          resolve();
        }
      };

      this.activeAnimations.set(animationKey, animation);
      this.startAnimationLoop();
    });
  }

  public animateCapture(position: Position): Promise<void> {
    return new Promise((resolve) => {
      const animationKey = `capture-${position.row}-${position.col}`;
      const startTime = performance.now();

      const animation: Animation = {
        from: position,
        to: position,
        startTime,
        options: {
          duration: 200,
          easing: this.easeInCubic
        },
        type: 'capture',
        onComplete: () => {
          this.activeAnimations.delete(animationKey);
          if (this.activeAnimations.size === 0) {
            this.stopAnimationLoop();
          }
          resolve();
        }
      };

      this.activeAnimations.set(animationKey, animation);
      this.startAnimationLoop();
    });
  }

  private startAnimationLoop(): void {
    if (this.animationId === null) {
      this.animationId = requestAnimationFrame(this.animate.bind(this));
    }
  }

  private stopAnimationLoop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private animate(currentTime: number): void {
    let hasActiveAnimations = false;

    for (const [key, animation] of this.activeAnimations.entries()) {
      const elapsed = currentTime - animation.startTime;
      const progress = Math.min(elapsed / animation.options.duration, 1);

      if (progress >= 1) {
        animation.onComplete();
      } else {
        hasActiveAnimations = true;
        this.updateAnimation(animation, progress);
      }
    }

    if (hasActiveAnimations) {
      this.animationId = requestAnimationFrame(this.animate.bind(this));
    } else {
      this.animationId = null;
    }

    this.renderer.render();
  }

  private updateAnimation(animation: Animation, progress: number): void {
    const easedProgress = animation.options.easing(progress);
    
    if (animation.type === 'capture') {
      // Scale and fade animation for captures
      animation.scale = 1 - easedProgress;
      animation.opacity = 1 - easedProgress;
    } else {
      // Movement animation
      const fromPixel = this.getPixelFromSquare(animation.from);
      const toPixel = this.getPixelFromSquare(animation.to);
      
      animation.currentPosition = {
        x: fromPixel.x + (toPixel.x - fromPixel.x) * easedProgress,
        y: fromPixel.y + (toPixel.y - fromPixel.y) * easedProgress
      };
    }
  }

  private getPixelFromSquare(position: Position): { x: number; y: number } {
    const squareSize = 60; // This should match renderer's square size
    return {
      x: position.col * squareSize,
      y: position.row * squareSize
    };
  }

  // Easing functions
  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  private easeInCubic(t: number): number {
    return t * t * t;
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  public isAnimating(): boolean {
    return this.activeAnimations.size > 0;
  }

  public clearAnimations(): void {
    this.activeAnimations.clear();
    this.stopAnimationLoop();
  }
}

interface Animation {
  from: Position;
  to: Position;
  startTime: number;
  options: AnimationOptions;
  type?: 'move' | 'capture';
  currentPosition?: { x: number; y: number };
  scale?: number;
  opacity?: number;
  onComplete: () => void;
}