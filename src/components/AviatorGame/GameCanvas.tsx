import React, { useRef, useEffect } from 'react';

export type GamePhase = 'countdown' | 'in_flight' | 'crashed';

interface GameCanvasProps {
  phase: GamePhase;
  multiplier: number;
  countdownRemaining: number;
  crashMultiplier?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  color: string;
}

interface Cloud {
  x: number;
  y: number;
  speed: number;
  radius: number;
  alpha: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  phase,
  multiplier,
  countdownRemaining,
  crashMultiplier = 1.0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const cloudsRef = useRef<Cloud[]>([]);
  const shakeRef = useRef<number>(0);
  const animFrameIdRef = useRef<number | null>(null);

  // Initialize atmospheric background clouds
  useEffect(() => {
    const clouds: Cloud[] = [];
    for (let i = 0; i < 20; i++) {
      clouds.push({
        x: Math.random() * 1000,
        y: Math.random() * 600,
        speed: 0.5 + Math.random() * 1.5,
        radius: 20 + Math.random() * 45,
        alpha: 0.03 + Math.random() * 0.05,
      });
    }
    cloudsRef.current = clouds;
  }, []);

  // Trigger screen shake on crash
  useEffect(() => {
    if (phase === 'crashed') {
      shakeRef.current = 15;
    } else {
      shakeRef.current = 0;
    }
  }, [phase]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = rect.width;
      const height = rect.height;

      if (!width || !height || width <= 10 || height <= 10 || !Number.isFinite(width) || !Number.isFinite(height)) {
        animFrameIdRef.current = requestAnimationFrame(render);
        return;
      }

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Camera shake decay
      let offsetX = 0;
      let offsetY = 0;
      if (shakeRef.current > 0.1) {
        offsetX = (Math.random() - 0.5) * shakeRef.current;
        offsetY = (Math.random() - 0.5) * shakeRef.current;
        shakeRef.current *= 0.88;
      }
      ctx.translate(offsetX, offsetY);

      // Background gradient
      const safeRadius = Math.max(width, height, 100);
      const bgGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.6,
        10,
        width * 0.5,
        height * 0.5,
        safeRadius
      );
      bgGrad.addColorStop(0, '#151724');
      bgGrad.addColorStop(0.6, '#0c0d14');
      bgGrad.addColorStop(1, '#07080d');

      ctx.fillStyle = bgGrad;
      ctx.fillRect(-20, -20, width + 40, height + 40);

      // Grid Lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
      ctx.lineWidth = 1;
      const gridSpacingX = width / 8;
      const gridSpacingY = height / 6;

      for (let x = gridSpacingX; x < width; x += gridSpacingX) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      for (let y = gridSpacingY; y < height; y += gridSpacingY) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Safe sanitized multiplier
      const safeMult = (typeof multiplier === 'number' && Number.isFinite(multiplier) && multiplier >= 1.0)
        ? multiplier
        : 1.0;

      // Draw drifting atmospheric clouds
      const clouds = cloudsRef.current;
      ctx.fillStyle = '#ffffff';
      clouds.forEach((cloud) => {
        cloud.x -= cloud.speed * (phase === 'in_flight' ? Math.min(2 + safeMult * 0.4, 6) : 0.6);
        if (cloud.x + cloud.radius < 0) {
          cloud.x = width + cloud.radius;
          cloud.y = Math.random() * height;
        }
        ctx.save();
        ctx.globalAlpha = cloud.alpha;
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Axis labels
      ctx.font = '10px monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillText('0s', 12, height - 12);
      ctx.fillText('1.00x', 12, height - 32);

      // Main flight path calculations
      const paddingLeft = 40;
      const paddingBottom = 40;
      const startX = paddingLeft;
      const startY = Math.max(paddingBottom, height - paddingBottom);

      if (phase === 'in_flight' || phase === 'crashed') {
        // Multiplier progression mapping to (0..1) normalized curve
        const progress = Math.max(0, Math.min(Math.log(safeMult) / Math.log(20), 0.95));
        const rawTargetX = startX + (width - paddingLeft - 80) * Math.min(progress * 1.1 + 0.08, 0.92);
        const rawTargetY = startY - (height - paddingBottom - 70) * Math.min(Math.pow(progress, 0.85) * 1.05 + 0.05, 0.9);

        const targetX = Number.isFinite(rawTargetX) ? rawTargetX : startX + 20;
        const targetY = Number.isFinite(rawTargetY) ? rawTargetY : startY - 20;

        // Control point for smooth bezier flight climb
        const cpX = startX + (targetX - startX) * 0.55;
        const cpY = startY - 10;

        // Draw filled gradient area under curve
        const safeY1 = Number.isFinite(targetY) ? targetY : startY - 20;
        const safeY2 = Number.isFinite(startY) ? startY : height;
        const gradTop = Math.min(safeY1, safeY2 - 1);
        const gradBottom = Math.max(safeY2, gradTop + 1);

        const fillGrad = ctx.createLinearGradient(0, gradTop, 0, gradBottom);
        fillGrad.addColorStop(0, 'rgba(239, 68, 68, 0.35)');
        fillGrad.addColorStop(0.6, 'rgba(239, 68, 68, 0.12)');
        fillGrad.addColorStop(1, 'rgba(239, 68, 68, 0.0)');

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(cpX, cpY, targetX, targetY);
        ctx.lineTo(targetX, startY);
        ctx.closePath();
        ctx.fillStyle = fillGrad;
        ctx.fill();

        // Draw curved flight line with glow
        ctx.save();
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 14;
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(cpX, cpY, targetX, targetY);
        ctx.stroke();
        ctx.restore();

        // Spawn engine jet exhaust particles
        if (phase === 'in_flight') {
          for (let i = 0; i < 3; i++) {
            particlesRef.current.push({
              x: targetX - 10,
              y: targetY + 2,
              vx: -(1.5 + Math.random() * 2.5),
              vy: (Math.random() - 0.4) * 1.5,
              alpha: 0.9,
              size: 2 + Math.random() * 3.5,
              color: Math.random() > 0.4 ? '#f97316' : '#ef4444',
            });
          }
        }

        // Render and update exhaust particles
        const particles = particlesRef.current;
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= 0.025;
          p.size *= 0.96;

          if (p.alpha <= 0 || p.size <= 0.5) {
            particles.splice(i, 1);
            continue;
          }

          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Draw Airplane or Crash explosion
        if (phase === 'in_flight') {
          // Tangent angle of curve for realistic flight pitch
          const t = 1.0;
          const dX = 2 * (1 - t) * (cpX - startX) + 2 * t * (targetX - cpX);
          const dY = 2 * (1 - t) * (cpY - startY) + 2 * t * (targetY - cpY);
          const angle = Math.atan2(dY, dX);

          ctx.save();
          ctx.translate(targetX, targetY);
          ctx.rotate(angle);

          // Draw sleek aerodynamic jet plane (red & silver accents)
          ctx.shadowColor = 'rgba(239, 68, 68, 0.8)';
          ctx.shadowBlur = 10;

          // Jet Fuselage
          ctx.fillStyle = '#dc2626';
          ctx.beginPath();
          ctx.moveTo(24, 0); // nose
          ctx.lineTo(-14, -6);
          ctx.lineTo(-20, -1);
          ctx.lineTo(-20, 1);
          ctx.lineTo(-14, 6);
          ctx.closePath();
          ctx.fill();

          // Cockpit windshield
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.moveTo(14, -2);
          ctx.lineTo(6, -4);
          ctx.lineTo(6, 0);
          ctx.lineTo(14, 0);
          ctx.closePath();
          ctx.fill();

          // Main Delta Wings
          ctx.fillStyle = '#b91c1c';
          ctx.beginPath();
          ctx.moveTo(2, -4);
          ctx.lineTo(-10, -18);
          ctx.lineTo(-16, -18);
          ctx.lineTo(-8, -4);
          ctx.closePath();
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(2, 4);
          ctx.lineTo(-10, 18);
          ctx.lineTo(-16, 18);
          ctx.lineTo(-8, 4);
          ctx.closePath();
          ctx.fill();

          // Wingtip lights
          ctx.fillStyle = '#f87171';
          ctx.beginPath();
          ctx.arc(-13, -18, 1.5, 0, Math.PI * 2);
          ctx.arc(-13, 18, 1.5, 0, Math.PI * 2);
          ctx.fill();

          // Tail fin
          ctx.fillStyle = '#991b1b';
          ctx.beginPath();
          ctx.moveTo(-12, 0);
          ctx.lineTo(-22, -10);
          ctx.lineTo(-26, -10);
          ctx.lineTo(-18, 0);
          ctx.closePath();
          ctx.fill();

          // Jet engine afterburner glow
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(-20, 0, 3, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        } else if (phase === 'crashed') {
          // Crash explosion ring
          ctx.save();
          ctx.translate(targetX, targetY);
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, 0, 18, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.arc(0, 0, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // Draw Center Multiplier / Overlays
      ctx.save();
      const centerX = width * 0.5;
      const centerY = height * 0.42;

      if (phase === 'countdown') {
        // Countdown circular loader
        const radius = Math.min(width, height) * 0.16;
        const progress = Math.max(0, Math.min(1, countdownRemaining / 5.0));

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - progress));
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px "Outfit", sans-serif';
        ctx.fillText(`${countdownRemaining.toFixed(1)}s`, centerX, centerY - 4);

        ctx.font = '600 11px sans-serif';
        ctx.fillStyle = '#f87171';
        ctx.fillText('NEXT ROUND IN', centerX, centerY + 20);

        ctx.font = '500 13px sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.fillText('WAITING FOR TAKEOFF · PLACE YOUR BETS', centerX, centerY + radius + 32);
      } else if (phase === 'in_flight') {
        // In flight huge multiplier
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.shadowColor = 'rgba(239, 68, 68, 0.6)';
        ctx.shadowBlur = 24;

        ctx.fillStyle = '#ffffff';
        const fontSize = Math.min(width * 0.14, 68);
        ctx.font = `900 ${fontSize}px "Outfit", monospace`;
        ctx.fillText(`${multiplier.toFixed(2)}x`, centerX, centerY);

        ctx.shadowBlur = 0;
        ctx.font = '700 11px sans-serif';
        ctx.fillStyle = '#f43f5e';
        ctx.fillText('CLIMBING MULTIPLIER', centerX, centerY + fontSize * 0.55);
      } else if (phase === 'crashed') {
        // Crashed status
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 28;

        ctx.fillStyle = '#ef4444';
        const titleSize = Math.min(width * 0.11, 48);
        ctx.font = `900 ${titleSize}px "Outfit", sans-serif`;
        ctx.fillText('FLEW AWAY!', centerX, centerY - 14);

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fecaca';
        ctx.font = 'bold 24px monospace';
        ctx.fillText(`@ ${crashMultiplier.toFixed(2)}x`, centerX, centerY + titleSize * 0.55);
      }

      ctx.restore();
      ctx.restore();

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [phase, multiplier, countdownRemaining, crashMultiplier]);

  return (
    <div className="relative w-full h-[320px] sm:h-[380px] md:h-[430px] rounded-xl overflow-hidden border border-red-950/40 shadow-inner bg-[#0a0b10] flex items-center justify-center">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};
