let audioContext: AudioContext | null = null;
let audioUnlocked = false;

export function playNewOrderAlert() {
  if (typeof window === 'undefined') {
    return;
  }

  if (!audioUnlocked) {
    return;
  }

  try {
    audioContext ??= new AudioContext();
    const ctx = audioContext;

    if (ctx.state === 'suspended') {
      void ctx.resume();
    }

    const now = ctx.currentTime;

    const playTone = (
      frequency: number,
      start: number,
      duration: number,
      volume = 0.9,
      type: OscillatorType = 'square',
    ) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.exponentialRampToValueAtTime(volume, now + start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(now + start);
      oscillator.stop(now + start + duration + 0.05);
    };

    for (let repeat = 0; repeat < 3; repeat += 1) {
      const offset = repeat * 0.55;
      playTone(880, offset, 0.18);
      playTone(1320, offset + 0.2, 0.18);
      playTone(1760, offset + 0.38, 0.22);
    }
  } catch {
    // Browsers may block audio until user gesture; ignore silently.
  }
}

export function unlockKitchenAudio() {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    audioContext ??= new AudioContext();
    audioUnlocked = true;
    void audioContext.resume();
  } catch {
    // ignore
  }
}
