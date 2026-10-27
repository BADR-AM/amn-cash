// Professional Financial Audio Alert System using Web Audio API (100% offline, zero lag)

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// 1. Iconic Cash Register "Ka-Ching!" Sound for Incoming Payments
export function playCashInSound(volume = 0.8) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(Math.max(0.1, Math.min(volume, 1.0)), now);
    masterGain.connect(ctx.destination);

    // Part A: Mechanical Drawer "Clack"
    const oscClick = ctx.createOscillator();
    const gainClick = ctx.createGain();
    oscClick.type = 'square';
    oscClick.frequency.setValueAtTime(320, now);
    oscClick.frequency.exponentialRampToValueAtTime(80, now + 0.05);
    gainClick.gain.setValueAtTime(0.4, now);
    gainClick.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    oscClick.connect(gainClick);
    gainClick.connect(masterGain);
    oscClick.start(now);
    oscClick.stop(now + 0.05);

    // Part B: Ringing Bell 1 (E6 - 1318.5 Hz)
    const bell1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    bell1.type = 'sine';
    bell1.frequency.setValueAtTime(1318.5, now + 0.04);
    gain1.gain.setValueAtTime(0.6, now + 0.04);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
    bell1.connect(gain1);
    gain1.connect(masterGain);
    bell1.start(now + 0.04);
    bell1.stop(now + 0.6);

    // Part C: High Harmonic Crystal Ring (B6 - 1975.5 Hz)
    const bell2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    bell2.type = 'triangle';
    bell2.frequency.setValueAtTime(1975.5, now + 0.08);
    gain2.gain.setValueAtTime(0.7, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.9);
    bell2.connect(gain2);
    gain2.connect(masterGain);
    bell2.start(now + 0.08);
    bell2.stop(now + 0.9);

    // Part D: Highest Sparkle (E7 - 2637 Hz)
    const bell3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    bell3.type = 'sine';
    bell3.frequency.setValueAtTime(2637, now + 0.12);
    gain3.gain.setValueAtTime(0.8, now + 0.12);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    bell3.connect(gain3);
    gain3.connect(masterGain);
    bell3.start(now + 0.12);
    bell3.stop(now + 1.2);
  } catch (e) {
    console.warn('Audio alert failed:', e);
  }
}

// 2. Distinct Cash-Out / Withdrawal Sound (Descending Two-Tone)
export function playCashOutSound(volume = 0.7) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const master = ctx.createGain();
    master.gain.setValueAtTime(Math.max(0.1, Math.min(volume, 1.0)), now);
    master.connect(ctx.destination);

    // Tone 1: F5 (698.46 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(698.46, now);
    gain1.gain.setValueAtTime(0.5, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    osc1.connect(gain1);
    gain1.connect(master);
    osc1.start(now);
    osc1.stop(now + 0.25);

    // Tone 2: C5 (523.25 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(523.25, now + 0.18);
    gain2.gain.setValueAtTime(0.5, now + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(master);
    osc2.start(now + 0.18);
    osc2.stop(now + 0.55);
  } catch (e) {
    console.warn('Audio alert failed:', e);
  }
}

// 3. Urgent Warning Sound for Phone Disconnection (Double Warning Beep)
export function playDeviceDisconnectedSound(volume = 0.85) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const master = ctx.createGain();
    master.gain.setValueAtTime(Math.max(0.1, Math.min(volume, 1.0)), now);
    master.connect(ctx.destination);

    // Beep 1: 880 Hz
    const b1 = ctx.createOscillator();
    const g1 = ctx.createGain();
    b1.type = 'sawtooth';
    b1.frequency.setValueAtTime(880, now);
    g1.gain.setValueAtTime(0.4, now);
    g1.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
    b1.connect(g1);
    g1.connect(master);
    b1.start(now);
    b1.stop(now + 0.18);

    // Beep 2: 587.33 Hz
    const b2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    b2.type = 'sawtooth';
    b2.frequency.setValueAtTime(587.33, now + 0.22);
    g2.gain.setValueAtTime(0.4, now + 0.22);
    g2.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
    b2.connect(g2);
    g2.connect(master);
    b2.start(now + 0.22);
    b2.stop(now + 0.45);
  } catch (e) {
    console.warn('Audio alert failed:', e);
  }
}

// 4. Pleasant Uplifting Chime when Phone Reconnects
export function playDeviceConnectedSound(volume = 0.7) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const master = ctx.createGain();
    master.gain.setValueAtTime(Math.max(0.1, Math.min(volume, 1.0)), now);
    master.connect(ctx.destination);

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = now + idx * 0.08;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.4, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.35);
      osc.connect(gain);
      gain.connect(master);
      osc.start(startTime);
      osc.stop(startTime + 0.35);
    });
  } catch (e) {
    console.warn('Audio alert failed:', e);
  }
}
