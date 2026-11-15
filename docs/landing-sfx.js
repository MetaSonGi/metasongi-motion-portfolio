export async function playIntroSound(context) {
  await context.resume();
  if (context.state !== 'running') return;
  const now = context.currentTime + .035;
  const bus = context.createGain();
  bus.gain.value = .29;
  bus.connect(context.destination);

  const sample = context.createBuffer(1, Math.floor(context.sampleRate * 2.5), context.sampleRate);
  const samples = sample.getChannelData(0);
  for (let index = 0; index < samples.length; index++) samples[index] = Math.random() * 2 - 1;

  function noise(at, duration, frequencies, volume) {
    const source = context.createBufferSource();
    source.buffer = sample;
    const filter = context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = .7;
    filter.frequency.setValueAtTime(frequencies[0], at);
    filter.frequency.exponentialRampToValueAtTime(frequencies[1], at + duration);
    const envelope = context.createGain();
    envelope.gain.setValueAtTime(.001, at);
    envelope.gain.exponentialRampToValueAtTime(volume, at + duration * .28);
    envelope.gain.exponentialRampToValueAtTime(.001, at + duration);
    source.connect(filter).connect(envelope).connect(bus);
    source.start(at);
    source.stop(at + duration);
  }

  function tone(at, duration, from, to, volume, wave = 'sine') {
    const source = context.createOscillator();
    source.type = wave;
    source.frequency.setValueAtTime(from, at);
    source.frequency.exponentialRampToValueAtTime(to, at + duration);
    const envelope = context.createGain();
    envelope.gain.setValueAtTime(.001, at);
    envelope.gain.exponentialRampToValueAtTime(volume, at + .022);
    envelope.gain.exponentialRampToValueAtTime(.001, at + duration);
    source.connect(envelope).connect(bus);
    source.start(at);
    source.stop(at + duration);
  }

  noise(now, 1.3, [220, 5200], .31);
  tone(now + .06, 1.27, 46, 96, .16);
  const hit = now + 1.08;
  noise(hit, .34, [2100, 160], .45);
  tone(hit, .75, 104, 32, .64);
  for (const frequency of [330, 495, 741, 1110]) {
    tone(hit + .018, 1.45, frequency, frequency * .97, .055, 'triangle');
  }
  noise(hit + .24, 1.3, [1800, 650], .14);
}
export function createCutAudio() {
  let context;
  let buffer;
  let enabled = false;
  let previousTime = -Infinity;

  return {
    async enable() {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return false;
      context ??= new Audio();
      await context.resume();
      enabled = context.state === 'running';
      if (enabled && !buffer) {
        buffer = context.createBuffer(1, Math.ceil(context.sampleRate * .6), context.sampleRate);
        const samples = buffer.getChannelData(0);
        for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
      }
      return enabled;
    },
    disable() {
      enabled = false;
      if (context?.state === 'running') void context.suspend().catch(() => {});
    },
    play(index, reverse) {
      if (!enabled || context.state !== 'running') return;
      const start = context.currentTime + .025;
      if (start - previousTime < .23) return;
      previousTime = start;
      const noise = context.createBufferSource();
      noise.buffer = buffer;
      const filter = context.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.value = .8;
      filter.frequency.setValueAtTime(reverse ? 4300 : 230, start);
      filter.frequency.exponentialRampToValueAtTime(reverse ? 330 : 4800, start + .22);
      filter.frequency.exponentialRampToValueAtTime(540, start + .53);
      const level = context.createGain();
      level.gain.setValueAtTime(.001, start);
      level.gain.exponentialRampToValueAtTime(.12, start + .19);
      level.gain.exponentialRampToValueAtTime(.001, start + .55);
      noise.connect(filter).connect(level).connect(context.destination);
      noise.start(start);
      noise.stop(start + .56);

      const pulse = context.createOscillator();
      const hit = start + .23;
      const tail = context.createGain();
      pulse.frequency.setValueAtTime([92,115,75][index], hit);
      pulse.frequency.exponentialRampToValueAtTime(38, hit + .32);
      tail.gain.setValueAtTime(.001, hit);
      tail.gain.exponentialRampToValueAtTime(.19, hit + .024);
      tail.gain.exponentialRampToValueAtTime(.001, hit + .34);
      pulse.connect(tail).connect(context.destination);
      pulse.start(hit);
      pulse.stop(hit + .35);
    },
    dispose() {
      enabled = false;
      if (context && context.state !== 'closed') void context.close().catch(() => {});
    },
  };
}
