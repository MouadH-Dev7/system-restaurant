let audioContext: AudioContext | null = null;
let audioUnlocked = false;

function ensureContext() {
  audioContext ??= new AudioContext();
  return audioContext;
}

export function unlockWaiterAudio() {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const ctx = ensureContext();
    audioUnlocked = true;
    void ctx.resume();
  } catch {
    // ignore
  }
}

export function playWaiterAlert() {
  if (typeof window === 'undefined' || !audioUnlocked) {
    return;
  }

  try {
    const ctx = ensureContext();
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }

    const now = ctx.currentTime;
    const sequence = [
      { frequency: 880, start: 0, duration: 0.16 },
      { frequency: 1174, start: 0.2, duration: 0.16 },
      { frequency: 1568, start: 0.4, duration: 0.22 },
    ];

    for (const tone of sequence) {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = 'square';
      oscillator.frequency.value = tone.frequency;
      gain.gain.setValueAtTime(0.0001, now + tone.start);
      gain.gain.exponentialRampToValueAtTime(0.85, now + tone.start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + tone.start + tone.duration);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(now + tone.start);
      oscillator.stop(now + tone.start + tone.duration + 0.05);
    }
  } catch {
    // ignore
  }
}
