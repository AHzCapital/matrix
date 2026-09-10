"use client";

import { useEffect, useRef, useState } from "react";

export default function Home() {
  const [light, setLight] = useState(false);
  const stageRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (localStorage.getItem("matrix-theme") === "light") setLight(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("matrix-theme", light ? "light" : "dark");
  }, [light]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let x = 50;
    let y = 50;
    let tx = 50;
    let ty = 50;

    const render = () => {
      x += (tx - x) * 0.035;
      y += (ty - y) * 0.035;
      stage.style.setProperty("--mx", `${x}%`);
      stage.style.setProperty("--my", `${y}%`);
      raf = Math.abs(tx - x) > 0.01 || Math.abs(ty - y) > 0.01 ? requestAnimationFrame(render) : 0;
    };

    const move = (event: PointerEvent) => {
      tx = (event.clientX / window.innerWidth) * 100;
      ty = (event.clientY / window.innerHeight) * 100;
      if (!raf) raf = requestAnimationFrame(render);
    };

    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <main ref={stageRef} className={`stage${light ? " light" : ""}`} aria-label="We are the Matrix.">
      <div className="atmosphere" aria-hidden="true" />
      <p className="statement">We are the Matrix.</p>
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
