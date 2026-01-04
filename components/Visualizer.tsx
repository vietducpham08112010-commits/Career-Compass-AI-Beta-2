import React, { useRef, useEffect } from 'react';

export const Visualizer = ({ isActive, level }: { isActive: boolean; level: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animationId: number;
    const barCount = 40; 
    const bars = new Array(barCount).fill(4);
    
    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) { canvas.width = rect.width * dpr; canvas.height = rect.height * dpr; }
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.scale(dpr, dpr);
      
      const width = rect.width; const height = rect.height; const spacing = width / barCount; const barWidth = spacing * 0.6; const maxBarHeight = height * 0.9;
      const isDark = document.documentElement.classList.contains('dark');
      
      for (let i = 0; i < barCount; i++) {
        const distanceFromCenter = Math.abs(i - (barCount - 1) / 2);
        const centerEmphasis = 1 - Math.pow(distanceFromCenter / (barCount / 2), 2);
        let noise = isActive ? (0.5 + Math.random() * 0.5) : 0.1;
        let targetHeight = isActive ? Math.max(4, level * maxBarHeight * centerEmphasis * noise * 1.5) : 4 + Math.random() * 2;
        bars[i] += (targetHeight - bars[i]) * 0.2;
        
        const x = i * spacing + (spacing - barWidth) / 2; const y = (height - bars[i]) / 2; const radius = barWidth / 2;
        const gradient = ctx.createLinearGradient(0, y, 0, y + bars[i]);
        if (isActive) {
            if (isDark) { gradient.addColorStop(0, '#818cf8'); gradient.addColorStop(1, '#6366f1'); } 
            else { gradient.addColorStop(0, '#6366f1'); gradient.addColorStop(1, '#4f46e5'); }
        } else { gradient.addColorStop(0, isDark ? '#334155' : '#cbd5e1'); gradient.addColorStop(1, isDark ? '#1e293b' : '#94a3b8'); }
        ctx.fillStyle = gradient;
        // @ts-ignore
        if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, barWidth, bars[i], radius); ctx.fill(); } else { ctx.fillRect(x, y, barWidth, bars[i]); }
      }
      animationId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animationId);
  }, [isActive, level]);
  
  return <canvas ref={canvasRef} className="w-full h-full" style={{ width: '100%', height: '100%' }} />;
};