"use client";

import { useEffect, useRef } from "react";

type Point = { x: number; y: number };

export default function WaveField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = reduceMotion.matches;
    let frame = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let last = performance.now();
    let elapsed = 0;
    let nextTargetAt = 0;
    let target: Point = { x: 0, y: 0 };
    const position: Point = { x: 0, y: 0 };
    const velocity: Point = { x: 0, y: 0 };
    const pointer: Point = { x: 0.5, y: 0.5 };
    const pointerSmooth: Point = { x: 0.5, y: 0.5 };
    let pointerActive = false;
    let seed = 0;

    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };

    seed = Math.floor(Math.random() * 0xffffffff);

    const bounds = () => ({
      x: Math.max(28, width * (window.innerWidth <= 700 ? 0.075 : 0.13)),
      y: Math.max(24, height * (window.innerWidth <= 700 ? 0.055 : 0.1)),
    });

    const chooseTarget = (initial = false) => {
      const b = bounds();
      const angleBias = random() * Math.PI * 2;
      const radius = initial ? 0.08 : 0.35 + random() * 0.65;
      target.x = Math.cos(angleBias) * b.x * radius;
      target.y = Math.sin(angleBias) * b.y * radius;
      nextTargetAt = elapsed + (initial ? 2 : 5 + random() * 7);
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      chooseTarget(true);
    };

    const onPointer = (event: PointerEvent) => {
      pointer.x = event.clientX / Math.max(window.innerWidth, 1);
      pointer.y = event.clientY / Math.max(window.innerHeight, 1);
      pointerActive = true;
    };

    const onMotionChange = (event: MediaQueryListEvent) => {
      reduced = event.matches;
    };

    const drawField = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      if (reduced || width < 1 || height < 1) return;

      pointerSmooth.x += (pointer.x - pointerSmooth.x) * 0.018;
      pointerSmooth.y += (pointer.y - pointerSmooth.y) * 0.018;

      const centerX = width * 0.5 + position.x;
      const centerY = height * 0.5 + position.y;
      const pointerX = pointerActive ? pointerSmooth.x * width : width * 0.5;
      const pointerY = pointerActive ? pointerSmooth.y * height : height * 0.5;
      const localX = (pointerX - centerX) * 0.08;
      const localY = (pointerY - centerY) * 0.08;
      const minSide = Math.min(width, height);
      const rings = window.innerWidth <= 700 ? 7 : 10;
      const segments = window.innerWidth <= 700 ? 72 : 104;

      ctx.save();
      ctx.lineWidth = 0.65;
      ctx.lineCap = "round";

      for (let layer = 0; layer < 3; layer += 1) {
        const baseRadius = minSide * (0.065 + layer * 0.055);
        const amplitude = minSide * (0.0028 + layer * 0.0015);
        const alpha = 0.026 - layer * 0.006;
        ctx.strokeStyle = `rgba(126,154,137,${alpha})`;

        for (let ring = 0; ring < rings; ring += 1) {
          const radius = baseRadius + ring * minSide * 0.022;
          ctx.beginPath();
          for (let i = 0; i <= segments; i += 1) {
            const a = (i / segments) * Math.PI * 2;
            const wave =
              Math.sin(a * (2.1 + layer * 0.35) + time * 0.00016 + layer) * amplitude +
              Math.sin(a * (4.7 + ring * 0.13) - time * 0.00009 + ring) * amplitude * 0.42;
            const dx = Math.cos(a) * (radius + wave) + localX * Math.sin(a + layer);
            const dy = Math.sin(a) * (radius + wave) + localY * Math.cos(a - layer);
            const x = centerX + dx;
            const y = centerY + dy;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      }
      ctx.restore();
    };

    const animate = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      elapsed += dt;

      if (!reduced) {
        if (elapsed >= nextTargetAt) chooseTarget();

        const dx = target.x - position.x;
        const dy = target.y - position.y;
        const distance = Math.hypot(dx, dy);
        const attraction = distance < 8 ? 0.22 : 0.34;
        velocity.x += dx * attraction * dt;
        velocity.y += dy * attraction * dt;

        const driftX = Math.sin(elapsed * 0.17 + seed * 0.000001) * 0.9 + Math.sin(elapsed * 0.071 + 1.8) * 0.45;
        const driftY = Math.cos(elapsed * 0.13 + 2.1) * 0.8 + Math.sin(elapsed * 0.053 + 0.4) * 0.35;
        velocity.x += driftX * dt;
        velocity.y += driftY * dt;
        velocity.x *= Math.pow(0.86, dt * 60);
        velocity.y *= Math.pow(0.86, dt * 60);
        position.x += velocity.x * dt * 60;
        position.y += velocity.y * dt * 60;

        const b = bounds();
        if (Math.abs(position.x) > b.x) {
          position.x = Math.sign(position.x) * b.x;
          velocity.x *= -0.28;
        }
        if (Math.abs(position.y) > b.y) {
          position.y = Math.sign(position.y) * b.y;
          velocity.y *= -0.28;
        }
      }

      drawField(now);
      frame = requestAnimationFrame(animate);
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("pointermove", onPointer, { passive: true });
    reduceMotion.addEventListener("change", onMotionChange);
    frame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointer);
      reduceMotion.removeEventListener("change", onMotionChange);
    };
  }, []);

  return <canvas ref={canvasRef} className="field" aria-hidden="true" />;
}
