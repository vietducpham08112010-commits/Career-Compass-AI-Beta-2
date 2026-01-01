import React, { useRef, useEffect } from 'react';

interface VisualizerProps {
  isActive: boolean;
  level: number; // 0 to 1
}

export const Visualizer: React.FC<VisualizerProps> = ({ isActive, level }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const barCount = 40; // More bars for a dense look
    const bars = new Array(barCount).fill(4);

    const draw = () => {
      // Handle High DPI scaling
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      
      // Only resize if dimensions change
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
         canvas.width = rect.width * dpr;
         canvas.height = rect.height * dpr;
      }
      
      // Reset transform and clear
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Scale context to fit dpi
      ctx.scale(dpr, dpr);

      const width = rect.width;
      const height = rect.height;

      // Bar configuration
      const spacing = width / barCount;
      const barWidth = spacing * 0.6; // Bar width relative to spacing
      const maxBarHeight = height * 0.9;
      const isDark = document.documentElement.classList.contains('dark');

      for (let i = 0; i < barCount; i++) {
        // Create a symmetric bell-curve shape for the visualizer (higher in center)
        const distanceFromCenter = Math.abs(i - (barCount - 1) / 2);
        const centerEmphasis = 1 - Math.pow(distanceFromCenter / (barCount / 2), 2); // Parabolic falloff
        
        // Calculate Target Height
        // If active: based on audio level + random noise for liveness + center emphasis
        // If idle: small jitter
        let noise = isActive ? (0.5 + Math.random() * 0.5) : 0.1;
        let targetHeight = isActive 
          ? Math.max(4, level * maxBarHeight * centerEmphasis * noise * 1.5) 
          : 4 + Math.random() * 2;

        // Smooth interpolation (Ease out)
        bars[i] += (targetHeight - bars[i]) * 0.2;

        // Draw Bar
        const x = i * spacing + (spacing - barWidth) / 2;
        const y = (height - bars[i]) / 2;
        const radius = barWidth / 2;

        // Gradient styling
        const gradient = ctx.createLinearGradient(0, y, 0, y + bars[i]);
        if (isActive) {
            if (isDark) {
                gradient.addColorStop(0, '#818cf8'); // Indigo 400
                gradient.addColorStop(1, '#6366f1'); // Indigo 500
            } else {
                gradient.addColorStop(0, '#6366f1'); // Indigo 500
                gradient.addColorStop(1, '#4f46e5'); // Indigo 600
            }
        } else {
            gradient.addColorStop(0, isDark ? '#334155' : '#cbd5e1');
            gradient.addColorStop(1, isDark ? '#1e293b' : '#94a3b8');
        }

        ctx.fillStyle = gradient;
        
        // Use roundRect if available, otherwise fallback (though modern browsers support it)
        if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, bars[i], radius);
            ctx.fill();
        } else {
            ctx.fillRect(x, y, barWidth, bars[i]);
        }
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animationId);
  }, [isActive, level]);

  return <canvas ref={canvasRef} className="w-full h-full" style={{ width: '100%', height: '100%' }} />;
};