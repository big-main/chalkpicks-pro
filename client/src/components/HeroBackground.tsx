import { useEffect, useRef } from "react";

/**
 * Animated mesh gradient background with floating particles.
 * Pure canvas — no external dependencies.
 */
export function HeroBackground({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let particles: Particle[] = [];

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      opacity: number;
      color: string;
    }

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    const createParticles = () => {
      const count = Math.min(60, Math.floor((canvas.offsetWidth * canvas.offsetHeight) / 15000));
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.offsetWidth,
          y: Math.random() * canvas.offsetHeight,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          radius: Math.random() * 1.5 + 0.5,
          opacity: Math.random() * 0.4 + 0.1,
          color: Math.random() > 0.7 ? "rgba(57,255,20," : "rgba(212,160,23,",
        });
      }
    };

    const drawGradientOrbs = (time: number) => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;

      // Orb 1 - green
      const x1 = w * 0.3 + Math.sin(time * 0.0005) * w * 0.1;
      const y1 = h * 0.4 + Math.cos(time * 0.0007) * h * 0.1;
      const grad1 = ctx.createRadialGradient(x1, y1, 0, x1, y1, w * 0.35);
      grad1.addColorStop(0, "rgba(57,255,20,0.04)");
      grad1.addColorStop(1, "rgba(57,255,20,0)");
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, w, h);

      // Orb 2 - gold
      const x2 = w * 0.7 + Math.cos(time * 0.0004) * w * 0.12;
      const y2 = h * 0.6 + Math.sin(time * 0.0006) * h * 0.08;
      const grad2 = ctx.createRadialGradient(x2, y2, 0, x2, y2, w * 0.3);
      grad2.addColorStop(0, "rgba(212,160,23,0.03)");
      grad2.addColorStop(1, "rgba(212,160,23,0)");
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, w, h);

      // Orb 3 - subtle blue
      const x3 = w * 0.5 + Math.sin(time * 0.0003) * w * 0.15;
      const y3 = h * 0.2 + Math.cos(time * 0.0005) * h * 0.1;
      const grad3 = ctx.createRadialGradient(x3, y3, 0, x3, y3, w * 0.25);
      grad3.addColorStop(0, "rgba(100,150,255,0.02)");
      grad3.addColorStop(1, "rgba(100,150,255,0)");
      ctx.fillStyle = grad3;
      ctx.fillRect(0, 0, w, h);
    };

    const drawParticles = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color + p.opacity + ")";
        ctx.fill();
      });

      // Draw connections between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(57,255,20,${0.05 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    };

    const animate = (time: number) => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;

      ctx.clearRect(0, 0, w, h);
      drawGradientOrbs(time);
      drawParticles();
      animationId = requestAnimationFrame(animate);
    };

    resize();
    createParticles();
    animationId = requestAnimationFrame(animate);

    window.addEventListener("resize", () => {
      resize();
      createParticles();
    });

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{ opacity: 0.8 }}
    />
  );
}
