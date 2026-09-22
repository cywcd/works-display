const AudioBus = (() => {
  let ctx = null;
  let muted = false;
  let musicNodes = [];

  function ac() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function beep(freq, dur, type, gain, slide) {
    if (muted) return;
    const c = ac();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type || "square";
    o.frequency.setValueAtTime(freq, c.currentTime);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, c.currentTime + dur);
    g.gain.setValueAtTime(gain || 0.05, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g).connect(c.destination);
    o.start();
    o.stop(c.currentTime + dur + 0.02);
  }

  function jump() {
    beep(420, 0.12, "square", 0.04, 680);
  }

  function slide() {
    beep(240, 0.1, "triangle", 0.03, 90);
  }

  function coin() {
    beep(880, 0.08, "square", 0.045, 1320);
  }

  function apple() {
    beep(520, 0.16, "sawtooth", 0.04, 880);
    setTimeout(() => beep(780, 0.18, "square", 0.035, 1180), 70);
  }

  function crash() {
    beep(160, 0.28, "sawtooth", 0.08, 40);
  }

  function startMusic() {
    stopMusic();
    if (muted) return;
    const c = ac();
    const notes = [262, 294, 330, 392, 440, 392, 330, 294];
    let step = 0;
    const timer = setInterval(() => {
      if (muted || !musicNodes.length) return;
      beep(notes[step % notes.length], 0.18, "triangle", 0.012);
      step += 1;
    }, 420);
    musicNodes = [timer];
  }

  function stopMusic() {
    musicNodes.forEach((id) => clearInterval(id));
    musicNodes = [];
  }

  function unlock() {
    ac();
  }

  return { jump, slide, coin, apple, crash, startMusic, stopMusic, unlock };
})();
