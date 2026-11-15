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
