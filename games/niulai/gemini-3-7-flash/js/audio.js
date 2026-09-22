/**
 * 《牛来跑酷》 - 原生 Web Audio API 动态音效与背景节奏合成器
 * 零外部音频文件依赖，高保真合成跳跃、滑铲、吃金币、苹果狂热、碰撞撞击与动态BGM
 */

class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.bgmPlaying = false;
    this.bgmTimer = null;
    this.bgmStep = 0;
    this.isFever = false;
  }

  // 延迟初始化 AudioContext (兼容浏览器自动播放策略)
  init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleAudio() {
    this.enabled = !this.enabled;
    if (!this.enabled) {
      this.stopBGM();
    } else {
      this.init();
      this.startBGM();
    }
    return this.enabled;
  }

  // 1. 跳跃音效 (清脆向上滑音)
  playJump() {
    if (!this.enabled) return;
    this.init();
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(680, now + 0.18);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {}
  }

  // 2. 滑铲音效 (空气摩擦扫频)
  playSlide() {
    if (!this.enabled) return;
    this.init();
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.22);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.23);
    } catch (e) {}
  }

  // 3. 拾取金币 (水晶叮当声，狂热时音调更高更有成就感)
  playCoin(isFever = false) {
    if (!this.enabled) return;
    this.init();
    try {
      const now = this.ctx.currentTime;
      const baseFreq = isFever ? 1318 : 987; // E6 或 B5

      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';

      osc1.frequency.setValueAtTime(baseFreq, now);
      osc1.frequency.setValueAtTime(baseFreq * 1.5, now + 0.06);

      osc2.frequency.setValueAtTime(baseFreq * 1.25, now);
      osc2.frequency.setValueAtTime(baseFreq * 2.0, now + 0.06);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.22);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.24);
      osc2.stop(now + 0.24);
    } catch (e) {}
  }

  // 4. 拾取金苹果 (10秒狂热启动震撼和弦)
  playAppleFever() {
    if (!this.enabled) return;
    this.init();
    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C Major 琶音

      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = now + idx * 0.06;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.28, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.45);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.5);
      });
    } catch (e) {}
  }

  // 5. 撞击障碍物 (重击与失真杂音)
  playHit() {
    if (!this.enabled) return;
    this.init();
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.35);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.36);
    } catch (e) {}
  }

  // 6. 动态节拍背景音合成器 (Rhythmic Synth BGM)
  startBGM() {
    if (!this.enabled || this.bgmPlaying) return;
    this.init();
    this.bgmPlaying = true;
    this.bgmStep = 0;
    this.scheduleBgmTick();
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  setFeverMode(isFever) {
    this.isFever = isFever;
  }

  scheduleBgmTick() {
    if (!this.bgmPlaying || !this.enabled || !this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const bpm = this.isFever ? 175 : 132;
      const beatInterval = 60 / bpm / 2; // 8分音符步长

      // 8音步欢快旋律与贝斯线
      const bassMelody = [130.81, 130.81, 164.81, 196.00, 146.83, 146.83, 174.61, 220.00];
      const leadMelody = [523.25, 659.25, 783.99, 659.25, 880.00, 783.99, 659.25, 587.33];
      const feverLeadMelody = [783.99, 1046.50, 1318.51, 1046.50, 1567.98, 1318.51, 1046.50, 1174.66];

      const stepIdx = this.bgmStep % 8;

      // 贝斯底鼓
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'triangle';
      bassOsc.frequency.setValueAtTime(bassMelody[stepIdx], now);
      bassGain.gain.setValueAtTime(0.08, now);
      bassGain.gain.exponentialRampToValueAtTime(0.005, now + beatInterval * 0.9);
      bassOsc.connect(bassGain);
      bassGain.connect(this.ctx.destination);
      bassOsc.start(now);
      bassOsc.stop(now + beatInterval * 0.95);

      // 主旋律合成器 (每2步敲击一次)
      if (this.bgmStep % 2 === 0) {
        const leadOsc = this.ctx.createOscillator();
        const leadGain = this.ctx.createGain();
        leadOsc.type = this.isFever ? 'sawtooth' : 'sine';
        const leadFreq = this.isFever ? feverLeadMelody[stepIdx] : leadMelody[stepIdx];
        leadOsc.frequency.setValueAtTime(leadFreq, now);
        leadGain.gain.setValueAtTime(this.isFever ? 0.07 : 0.05, now);
        leadGain.gain.exponentialRampToValueAtTime(0.002, now + beatInterval * 1.5);
        leadOsc.connect(leadGain);
        leadGain.connect(this.ctx.destination);
        leadOsc.start(now);
        leadOsc.stop(now + beatInterval * 1.6);
      }

      this.bgmStep++;
      this.bgmTimer = setTimeout(() => {
        this.scheduleBgmTick();
      }, beatInterval * 1000);
    } catch (e) {
      this.bgmTimer = setTimeout(() => {
        this.scheduleBgmTick();
      }, 250);
    }
  }
}

// 挂载全局音频管理器
window.gameAudio = new SoundManager();
