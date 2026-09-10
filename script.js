(() => {
  const stage = document.querySelector('.stage');
  if (!stage || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let raf = 0;
  let x = 50;
  let y = 50;
  let tx = 50;
  let ty = 50;

  const move = (event) => {
    tx = (event.clientX / window.innerWidth) * 100;
    ty = (event.clientY / window.innerHeight) * 100;
    if (!raf) raf = requestAnimationFrame(render);
  };

  const render = () => {
    x += (tx - x) * 0.035;
    y += (ty - y) * 0.035;
    stage.style.setProperty('--mx', `${x}%`);
    stage.style.setProperty('--my', `${y}%`);
    if (Math.abs(tx - x) > 0.01 || Math.abs(ty - y) > 0.01) {
      raf = requestAnimationFrame(render);
    } else {
      raf = 0;
    }
  };

  window.addEventListener('pointermove', move, { passive: true });
})();
