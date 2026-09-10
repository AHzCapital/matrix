"use client";

import { useEffect, useRef, useState } from "react";
import WaveField from "./WaveField";

export default function Home() {
  const [light, setLight] = useState(false);
  const statementRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    setLight(localStorage.getItem("matrix-theme") === "light");
  }, []);

  useEffect(() => {
    localStorage.setItem("matrix-theme", light ? "light" : "dark");
  }, [light]);

  useEffect(() => {
    const statement = statementRef.current;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!statement || reduceMotion.matches) return;

    let frame = 0;
    let last = performance.now();
    let elapsed = 0;
    let nextTarget = 0;
    let seed = Math.floor(Math.random() * 0xffffffff);
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };

    const position = { x: 0, y: 0, vx: 0, vy: 0 };
    const target = { x: 0, y: 0 };
    const chooseTarget = (initial = false) => {
      const mobile = window.innerWidth <= 700;
      const rangeX = window.innerWidth * (mobile ? 0.075 : 0.125);
      const rangeY = window.innerHeight * (mobile ? 0.06 : 0.095);
      const angle = random() * Math.PI * 2;
      const radius = initial ? 0.08 : 0.35 + random() * 0.65;
      target.x = Math.cos(angle) * rangeX * radius;
      target.y = Math.sin(angle) * rangeY * radius;
      nextTarget = elapsed + (initial ? 1.8 : 5 + random() * 7);
    };

    chooseTarget(true);

    const animate = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      elapsed += dt;

      if (elapsed >= nextTarget) chooseTarget();

      const dx = target.x - position.x;
      const dy = target.y - position.y;
      const distance = Math.hypot(dx, dy);
      const pull = distance < 12 ? 0.18 : 0.3;
      position.vx += dx * pull * dt;
      position.vy += dy * pull * dt;

      // Very-low-frequency field drift prevents the path from becoming predictable.
      position.vx += (Math.sin(elapsed * 0.19 + 0.7) * 0.65 + Math.cos(elapsed * 0.067) * 0.35) * dt;
      position.vy += (Math.cos(elapsed * 0.14 + 1.9) * 0.6 + Math.sin(elapsed * 0.051) * 0.3) * dt;
      position.vx *= Math.pow(0.88, dt * 60);
      position.vy *= Math.pow(0.88, dt * 60);
      position.x += position.vx * dt * 60;
      position.y += position.vy * dt * 60;

      const mobile = window.innerWidth <= 700;
      const maxX = window.innerWidth * (mobile ? 0.09 : 0.145);
      const maxY = window.innerHeight * (mobile ? 0.07 : 0.115);
      if (Math.abs(position.x) > maxX) {
        position.x = Math.sign(position.x) * maxX;
        position.vx *= -0.22;
      }
      if (Math.abs(position.y) > maxY) {
        position.y = Math.sign(position.y) * maxY;
        position.vy *= -0.22;
      }

      const microX = Math.sin(elapsed * 0.83) * 0.7;
      const microY = Math.cos(elapsed * 0.71 + 1.3) * 0.55;
      const rotation = Math.sin(elapsed * 0.37 + 0.8) * 0.1;
      statement.style.transform = `translate3d(${position.x + microX}px, ${position.y + microY}px, 0) rotate(${rotation}deg)`;
      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <main className={`stage${light ? " light" : ""}`}>
      <WaveField />
      <p ref={statementRef} className="statement">We are the Matrix.</p>
      <button
        className="theme-toggle"
        type="button"
        onClick={() => setLight((current) => !current)}
        aria-label={light ? "Switch to dark theme" : "Switch to light theme"}
        aria-pressed={light}
      >
        <span className="theme-toggle__dot" aria-hidden="true" />
      </button>
    </main>
  );
}
