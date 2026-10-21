import React, { useEffect, useRef } from "react";

interface CursorParticleTrailProps {
  color?: string; // Default to luxury champagne "#E1C699"
  active?: boolean;
}

export default function CursorParticleTrail({
  color = "#E1C699",
  active = true,
}: CursorParticleTrailProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: -100, y: -100, lastX: -100, lastY: -100, speed: 0 });
  const isMovingRef = useRef(false);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    const maxParticles = 100;

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      maxLife: number;
      life: number;
      color: string;
      sparkleType: number;

      constructor(x: number, y: number, color: string) {
        this.x = x;
        this.y = y;
        // Natural premium slow drifting speed
        this.vx = (Math.random() - 0.5) * 1.4;
        this.vy = -0.4 - Math.random() * 0.9; // Drift upward like luxury sparkles
        this.size = 1.0 + Math.random() * 2.5;
        this.maxLife = 50 + Math.floor(Math.random() * 40); // 50 to 90 frames
        this.life = this.maxLife;
        this.color = color;
        this.sparkleType = Math.random() > 0.85 ? 1 : 0; // 15% chance to be a royal diamond star
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        // Slow down particle drift gradually
        this.vx *= 0.98;
        this.vy *= 0.98;
        this.life--;
      }

      draw(c: CanvasRenderingContext2D) {
        const progress = this.life / this.maxLife;
        const alpha = Math.sin(progress * Math.PI) * 0.65; // Smooth fade-in and fade-out envelope

        c.save();
        c.globalAlpha = alpha;

        // Subtle glow effect
        c.shadowBlur = 10;
        c.shadowColor = this.color;

        if (this.sparkleType === 1) {
          // Draw elegant 4-point cross star
          c.strokeStyle = "#FFFFFF";
          c.lineWidth = 1;
          
          c.beginPath();
          const arm = this.size * 2.5 * progress;
          c.moveTo(this.x - arm, this.y);
          c.lineTo(this.x + arm, this.y);
          c.moveTo(this.x, this.y - arm);
          c.lineTo(this.x, this.y + arm);
          c.stroke();

          // Small core
          c.beginPath();
          c.arc(this.x, this.y, this.size * 0.5, 0, Math.PI * 2);
          c.fillStyle = this.color;
          c.fill();
        } else {
          // Draw beautiful premium soft circular particle
          c.beginPath();
          c.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          c.fillStyle = this.color;
          c.fill();
        }

        c.restore();
      }
    }

    // Set canvas dimensions with high DPI support
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = parent.clientWidth * dpr;
      canvas.height = parent.clientHeight * dpr;
      canvas.style.width = `${parent.clientWidth}px`;
      canvas.style.height = `${parent.clientHeight}px`;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    
    // Resize Observer for dynamic resizing
    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    // Mouse & Touch tracking
    const handleMouseMove = (e: MouseEvent) => {
      const parent = canvas.parentElement;
      if (!parent) return;

      const rect = parent.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Calculate speed
      const dx = x - mouseRef.current.lastX;
      const dy = y - mouseRef.current.lastY;
      mouseRef.current.speed = Math.sqrt(dx * dx + dy * dy);

      mouseRef.current.x = x;
      mouseRef.current.y = y;
      mouseRef.current.lastX = x;
      mouseRef.current.lastY = y;
      isMovingRef.current = true;

      // Spawn particles based on distance moved
      const spawnCount = Math.min(4, Math.floor(mouseRef.current.speed / 6) + 1);
      for (let i = 0; i < spawnCount; i++) {
        if (particles.length < maxParticles) {
          // Add a tiny bit of random offset
          const offsetX = (Math.random() - 0.5) * 8;
          const offsetY = (Math.random() - 0.5) * 8;
          particles.push(new Particle(x + offsetX, y + offsetY, color));
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const parent = canvas.parentElement;
      if (!parent) return;

      const rect = parent.getBoundingClientRect();
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      mouseRef.current.x = x;
      mouseRef.current.y = y;
      isMovingRef.current = true;

      // Mobile friendly light spawns
      if (Math.random() > 0.4 && particles.length < maxParticles) {
        particles.push(new Particle(x, y, color));
      }
    };

    // Listeners
    const parent = canvas.parentElement;
    if (parent) {
      parent.addEventListener("mousemove", handleMouseMove, { passive: true });
      parent.addEventListener("touchmove", handleTouchMove, { passive: true });
    }

    // Animation Loop
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Filter and update remaining active particles
      particles = particles.filter((p) => {
        p.update();
        p.draw(ctx);
        return p.life > 0;
      });

      // Ambient sparkling: spawn a tiny passive stardust particle near the cursor if static
      if (!isMovingRef.current && mouseRef.current.x > 0 && Math.random() > 0.9 && particles.length < maxParticles) {
        const spreadX = (Math.random() - 0.5) * 35;
        const spreadY = (Math.random() - 0.5) * 35;
        particles.push(new Particle(mouseRef.current.x + spreadX, mouseRef.current.y + spreadY, color));
      }

      isMovingRef.current = false;
      animationFrameId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      if (parent) {
        parent.removeEventListener("mousemove", handleMouseMove);
        parent.removeEventListener("touchmove", handleTouchMove);
      }
    };
  }, [active, color]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-40 select-none mix-blend-screen opacity-90"
      id="ethereal-cursor-trail-canvas"
    />
  );
}
