import { DUCK, GLIDE, MIX, SCHOOL_REHEARSAL_SRC, TIMING } from './ambienceConfig';
import type { Proximity } from './ambienceMath';

const rand = (min: number, max: number) => min + Math.random() * (max - min);

type Noise = 'white' | 'pink' | 'brown';

/**
 * The island's sound, synthesised live with the Web Audio API -- no audio
 * files, so it weighs nothing and every layer can follow the map smoothly:
 *
 *   river      brown noise (the flow) + a band of pink noise wobbling slowly
 *              (the babble), louder near the shore
 *   waterfall  bright noise over a low rumble, near the falls only
 *   rain       a hiss plus a patter of single drops, following the showers
 *   wind       a whoosh sweeping across the stereo field on each gust
 *   leaves     short rustles now and then, and in every gust
 *   fire       the campfire once lit: a soft roar with crackles and the odd snap
 *   fountain   a gentle splash with droplets plinking into the basin (little
 *              rising "bloops"), near the fountain; livelier while it sprays
 *   school     the band rehearsing the chorus of "Errauts eskuak" inside the
 *              music school: a recording, but heard through the walls --
 *              filtered, with the room's echo -- clearer the closer you get
 *   splash     the beaver's plop as it dives
 *   birds      chirps, whistles and trills from a few made-up species, with
 *              a touch of echo so they sound far off; quieter in the rain
 *
 * Everything runs into an "ambience" bus (ducked while the vendor speaks or
 * music plays), then a master gain (the sound toggle and volume). Nothing is
 * created until the first user gesture (`unlock`), as browsers require; the
 * context is suspended whenever it's silent (sound off, tab hidden).
 */
export class AmbienceEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private ambience!: GainNode;
  private noise = new Map<Noise, AudioBuffer>();
  private river!: { gain: GainNode; pan: StereoPannerNode };
  private waterfall!: { gain: GainNode; pan: StereoPannerNode };
  private rain!: GainNode;
  private fire!: { gain: GainNode; pan: StereoPannerNode };
  private fireLevel = 0;
  private fountain!: { gain: GainNode; pan: StereoPannerNode; drops: GainNode };
  private fountainLevel = 0;
  private fountainSpraying = false;
  private school!: { input: GainNode; gain: GainNode; muffle: BiquadFilterNode; pan: StereoPannerNode };
  private schoolLevel = 0;
  private schoolBusy = false;
  private schoolSrc = SCHOOL_REHEARSAL_SRC;
  private birdBus!: GainNode;
  private timers = new Set<number>();
  private suspendTimer = 0;

  private enabled = false;
  private visible = true;
  private volume = 0.6;
  private duck = 1;
  private voiceDuck = 1;
  private rainIntensity = 0;
  private voicePlaying = false;
  private voiceBuffers = new Map<string, Promise<AudioBuffer | null>>();

  /** Call from a user gesture (tap, click, key): creates or resumes the audio, which mobile browsers only allow then. */
  unlock(): void {
    if (!this.ctx) this.build();
    this.applyRunning();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.applyRunning();
  }

  /** The tab being in view; everything pauses while it's hidden. */
  setVisible(visible: boolean): void {
    this.visible = visible;
    this.applyRunning();
  }

  setVolume(volume: number): void {
    this.volume = volume;
    this.applyMaster();
  }

  /** 0-1: how loud the ambience is allowed to be (sections, music, videos). */
  setDuck(level: number): void {
    this.duck = level;
    this.applyDuck();
  }

  setProximity({ river, riverPan, waterfall, waterfallPan }: Proximity): void {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.river.gain.gain.setTargetAtTime(MIX.riverBase + MIX.riverNear * river, t, GLIDE.proximity);
    this.river.pan.pan.setTargetAtTime(riverPan, t, GLIDE.proximity);
    this.waterfall.gain.gain.setTargetAtTime(MIX.waterfallNear * Math.pow(waterfall, 1.6), t, GLIDE.proximity);
    this.waterfall.pan.pan.setTargetAtTime(waterfallPan, t, GLIDE.proximity);
  }

  /** 0-1: how loud the campfire is (0 while it's out), and where it sits left-right. */
  setFire(level: number, pan: number): void {
    this.fireLevel = level;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.fire.gain.gain.setTargetAtTime(MIX.fire * level, t, level > 0 ? 0.5 : 0.8);
    this.fire.pan.pan.setTargetAtTime(pan, t, GLIDE.proximity);
  }

  /** 0-1: how near the fountain is, and where it sits left-right. */
  setFountain(level: number, pan: number): void {
    this.fountainLevel = level;
    this.applyFountain(pan);
  }

  /** Its spray going (the snail came near): a bit more splash and more drops. */
  setFountainSpray(spraying: boolean): void {
    this.fountainSpraying = spraying;
    this.applyFountain();
  }

  private applyFountain(pan?: number): void {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const boost = this.fountainSpraying ? MIX.fountainSpray : 1;
    this.fountain.gain.gain.setTargetAtTime(MIX.fountain * this.fountainLevel * boost, t, GLIDE.proximity);
    if (pan !== undefined) this.fountain.pan.pan.setTargetAtTime(pan, t, GLIDE.proximity);
  }

  /**
   * 0-1: how near the music school is, and where it sits left-right. The
   * band starts a run-through of the chorus whenever you're in earshot and
   * they aren't already playing; nearer, the walls muffle it less.
   */
  setSchool(level: number, pan: number): void {
    this.schoolLevel = level;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.school.gain.gain.setTargetAtTime(MIX.school * level, t, GLIDE.proximity);
    // Through the walls from afar (only the low end gets out), opening up close by.
    this.school.muffle.frequency.setTargetAtTime(380 + 1500 * level * level, t, GLIDE.proximity);
    this.school.pan.pan.setTargetAtTime(pan, t, GLIDE.proximity);
    if (level > 0.02 && !this.schoolBusy) void this.rehearse();
  }

  /** Where the rehearsal recording lives (resolved for the deploy's base path). */
  setSchoolSource(src: string): void {
    this.schoolSrc = src;
  }

  /** The beaver's plop: a dull splash with a few droplets after it; bigger when it was startled. */
  splash(pan: number, big: boolean): void {
    if (!this.isRunning()) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const size = big ? 1.6 : 1;
    const out = ctx.createStereoPanner();
    out.pan.value = pan;
    out.connect(this.ambience);

    const burst = this.noiseSource('white');
    const burstGain = ctx.createGain();
    burstGain.gain.setValueAtTime(0.0001, t);
    burstGain.gain.exponentialRampToValueAtTime(MIX.splash * size, t + 0.012);
    burstGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35 * size);
    burst.connect(this.filter('lowpass', 1600)).connect(burstGain).connect(out);
    burst.start(t, rand(0, 3));
    burst.stop(t + 0.5 * size);

    const plop = ctx.createOscillator();
    plop.frequency.setValueAtTime(260, t);
    plop.frequency.exponentialRampToValueAtTime(90, t + 0.16);
    const plopGain = ctx.createGain();
    plopGain.gain.setValueAtTime(0.0001, t);
    plopGain.gain.exponentialRampToValueAtTime(MIX.splash * 0.9 * size, t + 0.008);
    plopGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    plop.connect(plopGain).connect(out);
    plop.start(t);
    plop.stop(t + 0.25);

    for (let i = 0; i < (big ? 6 : 3); i += 1) {
      const at = t + rand(0.08, 0.45);
      const f0 = rand(700, 1500);
      const drop = ctx.createOscillator();
      drop.frequency.setValueAtTime(f0, at);
      drop.frequency.exponentialRampToValueAtTime(f0 * 2.2, at + 0.05);
      const dropGain = ctx.createGain();
      dropGain.gain.setValueAtTime(0.0001, at);
      dropGain.gain.exponentialRampToValueAtTime(MIX.splash * rand(0.2, 0.45), at + 0.004);
      dropGain.gain.exponentialRampToValueAtTime(0.0001, at + 0.06);
      drop.connect(dropGain).connect(out);
      drop.start(at);
      drop.stop(at + 0.08);
    }
  }

  /** One run-through of the chorus; then, after a pause, another -- while you're still in earshot. */
  private async rehearse(): Promise<void> {
    if (!this.isRunning()) return;
    this.schoolBusy = true;
    const buffer = await this.loadVoice(this.schoolSrc);
    if (!buffer || !this.isRunning()) {
      this.schoolBusy = false;
      return;
    }
    const source = this.ctx!.createBufferSource();
    source.buffer = buffer;
    source.connect(this.school.input);
    source.onended = () => {
      const gap = rand(...TIMING.rehearsalGap) * 1000;
      const id = window.setTimeout(() => {
        this.timers.delete(id);
        this.schoolBusy = false;
        if (this.schoolLevel > 0.02) void this.rehearse();
      }, gap);
      this.timers.add(id);
    };
    source.start();
  }

  /** 0-1, following the map's rain showers. */
  setRain(intensity: number): void {
    this.rainIntensity = Math.max(0, Math.min(1, intensity));
    if (!this.ctx) return;
    this.rain.gain.setTargetAtTime(MIX.rain * this.rainIntensity, this.ctx.currentTime, 0.6);
  }

  /** A gust of wind across the view, with leaves caught in it. */
  gust(fromLeft: boolean): void {
    if (!this.isRunning()) return;
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const src = this.noiseSource('white');
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.Q.value = 0.9;
    band.frequency.setValueAtTime(260, t);
    band.frequency.exponentialRampToValueAtTime(720, t + 1.2);
    band.frequency.exponentialRampToValueAtTime(340, t + 3.6);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(MIX.gust, t + 1.1);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 3.8);
    const pan = ctx.createStereoPanner();
    pan.pan.setValueAtTime(fromLeft ? -0.8 : 0.8, t);
    pan.pan.linearRampToValueAtTime(fromLeft ? 0.8 : -0.8, t + 3.8);
    src.connect(band).connect(gain).connect(pan).connect(this.ambience);
    src.start(t, rand(0, 2));
    src.stop(t + 4);
    this.rustle(1.4, t + 0.7, fromLeft ? -0.4 : 0.4);
    this.rustle(1, t + 1.8, fromLeft ? 0.4 : -0.4);
  }

  /**
   * Plays a short recording (the vendor's greeting) over the world, ducking
   * the ambience while it lasts. Never overlaps itself: a call while it's
   * still playing is ignored. Missing or unreadable files are skipped quietly.
   */
  async playVoice(src: string): Promise<void> {
    if (!this.isRunning() || this.voicePlaying) return;
    this.voicePlaying = true;
    const buffer = await this.loadVoice(src);
    if (!buffer || !this.isRunning()) {
      this.voicePlaying = false;
      return;
    }
    const ctx = this.ctx!;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = MIX.voice;
    source.connect(gain).connect(this.master);
    this.voiceDuck = DUCK.voice;
    this.applyDuck();
    source.onended = () => {
      this.voicePlaying = false;
      this.voiceDuck = 1;
      this.applyDuck();
    };
    source.start();
  }

  destroy(): void {
    this.timers.forEach((id) => window.clearTimeout(id));
    this.timers.clear();
    window.clearTimeout(this.suspendTimer);
    void this.ctx?.close();
    this.ctx = null;
  }

  // ------------------------------------------------------------------ setup

  private build(): void {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    this.ctx = ctx;

    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);
    this.ambience = ctx.createGain();
    this.ambience.gain.value = this.duck;
    this.ambience.connect(this.master);

    (['white', 'pink', 'brown'] as Noise[]).forEach((kind) => this.noise.set(kind, this.makeNoise(kind)));
    this.buildRiver();
    this.buildWaterfall();
    this.buildRain();
    this.buildFire();
    this.buildFountain();
    this.buildSchool();
    this.buildBirds();
    this.setRain(this.rainIntensity);
    this.loop(TIMING.birds, () => this.bird(), () => 1 + (TIMING.birdsRainFactor - 1) * this.rainIntensity);
    this.loop(TIMING.leaves, () => this.rustle(rand(0.7, 1.3), this.ctx!.currentTime, rand(-0.6, 0.6)));
    this.loop([0.04, 0.04], () => this.rainDrops(0.04));
    this.loop([0.04, 0.04], () => this.crackles(0.04));
    this.loop([0.04, 0.04], () => this.fountainDrops(0.04));
  }

  private makeNoise(kind: Noise): AudioBuffer {
    const ctx = this.ctx!;
    const length = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch += 1) {
      const data = buffer.getChannelData(ch);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
      for (let i = 0; i < length; i += 1) {
        const white = Math.random() * 2 - 1;
        if (kind === 'white') {
          data[i] = white;
        } else if (kind === 'pink') {
          // Paul Kellet's pink filter.
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.969 * b2 + white * 0.153852;
          b3 = 0.8665 * b3 + white * 0.3104856;
          b4 = 0.55 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.016898;
          data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
          b6 = white * 0.115926;
        } else {
          last = (last + 0.02 * white) / 1.02;
          data[i] = last * 3.5;
        }
      }
    }
    return buffer;
  }

  private noiseSource(kind: Noise, loop = false): AudioBufferSourceNode {
    const src = this.ctx!.createBufferSource();
    src.buffer = this.noise.get(kind)!;
    src.loop = loop;
    return src;
  }

  private filter(type: BiquadFilterType, frequency: number, q = 0.7): BiquadFilterNode {
    const f = this.ctx!.createBiquadFilter();
    f.type = type;
    f.frequency.value = frequency;
    f.Q.value = q;
    return f;
  }

  /** A slow wobble added onto `param`. */
  private lfo(param: AudioParam, rate: number, depth: number): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.frequency.value = rate;
    const amount = ctx.createGain();
    amount.gain.value = depth;
    osc.connect(amount).connect(param);
    osc.start();
  }

  private buildRiver(): void {
    const ctx = this.ctx!;
    const gain = ctx.createGain();
    gain.gain.value = MIX.riverBase;
    const pan = ctx.createStereoPanner();
    gain.connect(pan).connect(this.ambience);

    const flow = this.noiseSource('brown', true);
    flow.connect(this.filter('lowpass', 700)).connect(gain);
    flow.start(0, rand(0, 3));

    const babble = this.noiseSource('pink', true);
    const band = this.filter('bandpass', 520, 1.3);
    const babbleGain = ctx.createGain();
    babbleGain.gain.value = 0.55;
    this.lfo(band.frequency, 0.23, 220);
    this.lfo(babbleGain.gain, 0.9, 0.22);
    this.lfo(babbleGain.gain, 0.37, 0.15);
    babble.connect(band).connect(babbleGain).connect(gain);
    babble.start(0, rand(0, 3));

    this.river = { gain, pan };
  }

  private buildWaterfall(): void {
    const ctx = this.ctx!;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    const pan = ctx.createStereoPanner();
    gain.connect(pan).connect(this.ambience);

    const spray = this.noiseSource('white', true);
    spray.connect(this.filter('highpass', 300)).connect(this.filter('lowpass', 2800)).connect(gain);
    spray.start(0, rand(0, 3));
    const rumble = this.noiseSource('brown', true);
    const rumbleGain = ctx.createGain();
    rumbleGain.gain.value = 0.7;
    rumble.connect(this.filter('lowpass', 180)).connect(rumbleGain).connect(gain);
    rumble.start(0, rand(0, 3));

    this.waterfall = { gain, pan };
  }

  private buildRain(): void {
    const ctx = this.ctx!;
    this.rain = ctx.createGain();
    this.rain.gain.value = 0;
    this.rain.connect(this.ambience);
    const hiss = this.noiseSource('white', true);
    hiss.connect(this.filter('highpass', 1200)).connect(this.filter('lowpass', 7500)).connect(this.rain);
    hiss.start(0, rand(0, 3));
  }

  /** The campfire's bed: a low, breathing roar of brown noise with a flickering band of hiss over it. */
  private buildFire(): void {
    const ctx = this.ctx!;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    const pan = ctx.createStereoPanner();
    gain.connect(pan).connect(this.ambience);

    const roar = this.noiseSource('brown', true);
    const roarGain = ctx.createGain();
    roarGain.gain.value = 0.8;
    this.lfo(roarGain.gain, 0.6, 0.18);
    roar.connect(this.filter('lowpass', 420)).connect(roarGain).connect(gain);
    roar.start(0, rand(0, 3));

    const hiss = this.noiseSource('pink', true);
    const hissGain = ctx.createGain();
    hissGain.gain.value = 0.35;
    this.lfo(hissGain.gain, 3.1, 0.12);
    this.lfo(hissGain.gain, 1.7, 0.1);
    hiss.connect(this.filter('bandpass', 1400, 0.7)).connect(hissGain).connect(gain);
    hiss.start(0, rand(0, 3));

    this.fire = { gain, pan };
  }

  /** The fountain's bed: a soft, airy splash of water falling into the basin, gently swaying. */
  private buildFountain(): void {
    const ctx = this.ctx!;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    const pan = ctx.createStereoPanner();
    gain.connect(pan).connect(this.ambience);

    const splash = this.noiseSource('pink', true);
    const splashGain = ctx.createGain();
    splashGain.gain.value = 0.7;
    this.lfo(splashGain.gain, 0.5, 0.12);
    this.lfo(splashGain.gain, 1.3, 0.08);
    splash
      .connect(this.filter('highpass', 500))
      .connect(this.filter('bandpass', 1900, 0.5))
      .connect(splashGain)
      .connect(gain);
    splash.start(0, rand(0, 3));

    // The drops go through the same panner, at their own level.
    const drops = ctx.createGain();
    drops.gain.value = 1;
    drops.connect(pan);

    this.fountain = { gain, pan, drops };
  }

  /**
   * Droplets falling into the basin: each a tiny sine "bloop" sweeping
   * quickly upward, the sound a drop makes as its bubble rings -- soft and
   * pleasant rather than hissy.
   */
  private fountainDrops(span: number): void {
    const level = this.fountainLevel * (this.fountainSpraying ? MIX.fountainSpray : 1);
    if (level < 0.05) return;
    const ctx = this.ctx!;
    const expected = MIX.fountainDropsPerSecond * level * span;
    const count = Math.floor(expected) + (Math.random() < expected % 1 ? 1 : 0);
    for (let i = 0; i < count; i += 1) {
      const t = ctx.currentTime + rand(0, span);
      const f0 = rand(500, 1300);
      const length = rand(0.04, 0.09);
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f0, t);
      osc.frequency.exponentialRampToValueAtTime(f0 * rand(1.8, 2.6), t + length);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(rand(0.4, 1) * MIX.fountain * Math.min(1, level) * 0.6, t + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
      const pan = ctx.createStereoPanner();
      pan.pan.value = rand(-0.25, 0.25);
      osc.connect(gain).connect(pan).connect(this.fountain.drops);
      osc.start(t);
      osc.stop(t + length + 0.02);
    }
  }

  /**
   * The rehearsal heard from outside: band-limited like sound through a wall
   * (the low-pass opens up as you come near), plus a room -- a synthetic
   * reverb tail -- that makes it sound like it's happening in there.
   */
  private buildSchool(): void {
    const ctx = this.ctx!;
    const input = ctx.createGain();
    const gain = ctx.createGain();
    gain.gain.value = 0;
    const pan = ctx.createStereoPanner();
    const muffle = this.filter('lowpass', 380, 0.5);
    const thin = this.filter('highpass', 140, 0.5);
    input.connect(thin).connect(muffle);

    const dry = ctx.createGain();
    dry.gain.value = 0.55;
    const room = ctx.createConvolver();
    room.buffer = this.makeRoom(1.8);
    const wet = ctx.createGain();
    wet.gain.value = 0.7;
    muffle.connect(dry).connect(gain);
    muffle.connect(room).connect(wet).connect(gain);
    gain.connect(pan).connect(this.ambience);

    this.school = { input, gain, muffle, pan };
  }

  /** An impulse response for a medium room: decaying stereo noise, darker as it fades. */
  private makeRoom(seconds: number): AudioBuffer {
    const ctx = this.ctx!;
    const length = Math.round(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch += 1) {
      const data = buffer.getChannelData(ch);
      let smooth = 0;
      for (let i = 0; i < length; i += 1) {
        const t = i / length;
        // Smoothing grows over the tail, so late reflections lose their highs.
        const k = 0.15 + 0.8 * t;
        smooth = smooth * k + (Math.random() * 2 - 1) * (1 - k);
        data[i] = smooth * Math.pow(1 - t, 2.6) * (i < ctx.sampleRate * 0.012 ? i / (ctx.sampleRate * 0.012) : 1);
      }
    }
    return buffer;
  }

  /** Wood crackling: tiny bright clicks, now and then a deeper snap. */
  private crackles(span: number): void {
    if (this.fireLevel < 0.05) return;
    const ctx = this.ctx!;
    const expected = MIX.fireCracklesPerSecond * this.fireLevel * span;
    const count = Math.floor(expected) + (Math.random() < expected % 1 ? 1 : 0);
    for (let i = 0; i < count; i += 1) {
      const t = ctx.currentTime + rand(0, span);
      const snap = Math.random() < 0.12;
      const length = snap ? rand(0.03, 0.06) : rand(0.004, 0.014);
      const src = this.noiseSource('white');
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(rand(0.25, snap ? 0.9 : 0.55) * this.fireLevel * MIX.fire * 1.6, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
      const pan = ctx.createStereoPanner();
      pan.pan.value = Math.max(-1, Math.min(1, this.fire.pan.pan.value + rand(-0.15, 0.15)));
      const tone = snap ? this.filter('bandpass', rand(700, 1400), 1.2) : this.filter('bandpass', rand(2500, 7000), 1.4);
      src.connect(tone).connect(gain).connect(pan).connect(this.ambience);
      src.start(t, rand(0, 3.5));
      src.stop(t + length + 0.02);
    }
  }

  /** Birds go through a soft filter and a little echo, so they read as somewhere off in the trees. */
  private buildBirds(): void {
    const ctx = this.ctx!;
    this.birdBus = ctx.createGain();
    const soften = this.filter('lowpass', 7000);
    this.birdBus.connect(soften).connect(this.ambience);
    const delay = ctx.createDelay(1);
    delay.delayTime.value = 0.13;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.25;
    const wet = ctx.createGain();
    wet.gain.value = 0.3;
    this.birdBus.connect(delay);
    delay.connect(feedback).connect(delay);
    delay.connect(wet).connect(soften);
  }

  // ------------------------------------------------------------------ sounds

  /** Runs `play` again and again, `range` seconds apart (stretched by `stretch()`), while the sound is on. */
  private loop(range: [number, number], play: () => void, stretch: () => number = () => 1): void {
    const next = () => {
      const id = window.setTimeout(() => {
        this.timers.delete(id);
        if (this.isRunning()) play();
        next();
      }, rand(range[0], range[1]) * stretch() * 1000);
      this.timers.add(id);
    };
    next();
  }

  /** A few dry-leaf rustles: tiny bursts of high, airy noise. */
  private rustle(seconds: number, at: number, center: number): void {
    if (!this.isRunning()) return;
    const ctx = this.ctx!;
    const bursts = Math.round(rand(8, 15) * seconds);
    for (let i = 0; i < bursts; i += 1) {
      const t = at + rand(0, seconds);
      const length = rand(0.03, 0.09);
      const src = this.noiseSource('white');
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(rand(0.4, 1) * MIX.leaves, t + length * 0.3);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
      const pan = ctx.createStereoPanner();
      pan.pan.value = Math.max(-1, Math.min(1, center + rand(-0.3, 0.3)));
      src.connect(this.filter('bandpass', rand(2600, 4200), 0.8)).connect(gain).connect(pan).connect(this.ambience);
      src.start(t, rand(0, 3.5));
      src.stop(t + length + 0.02);
    }
  }

  /** Single raindrops tapping on leaves and stone, as many as the shower is heavy. */
  private rainDrops(span: number): void {
    if (this.rainIntensity < 0.05) return;
    const ctx = this.ctx!;
    const expected = MIX.rainDropsPerSecond * this.rainIntensity * span;
    const count = Math.floor(expected) + (Math.random() < expected % 1 ? 1 : 0);
    for (let i = 0; i < count; i += 1) {
      const t = ctx.currentTime + rand(0, span);
      const length = rand(0.012, 0.03);
      const src = this.noiseSource('white');
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(rand(0.015, 0.05) * this.rainIntensity, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
      const pan = ctx.createStereoPanner();
      pan.pan.value = rand(-0.9, 0.9);
      src.connect(this.filter('bandpass', rand(2200, 6000), 1.6)).connect(gain).connect(pan).connect(this.ambience);
      src.start(t, rand(0, 3.5));
      src.stop(t + length + 0.02);
    }
  }

  /** One bird's call, from one of a few made-up species. */
  private bird(): void {
    const ctx = this.ctx!;
    const t0 = ctx.currentTime + 0.05;
    const peak = rand(MIX.birdMin, MIX.birdMax);
    const pan = ctx.createStereoPanner();
    pan.pan.value = rand(-0.75, 0.75);
    pan.connect(this.birdBus);

    const note = (t: number, f0: number, f1: number, length: number, level = 1) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f0, t);
      osc.frequency.exponentialRampToValueAtTime(f1, t + length * 0.8);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(peak * level, t + Math.min(0.012, length * 0.2));
      gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
      osc.connect(gain).connect(pan);
      osc.start(t);
      osc.stop(t + length + 0.02);
    };

    const species = Math.random();
    if (species < 0.4) {
      // Quick rising tweets.
      const f = rand(2600, 3800);
      const n = Math.round(rand(2, 4));
      for (let i = 0; i < n; i += 1) note(t0 + i * rand(0.12, 0.17), f, f * 1.35, 0.09);
    } else if (species < 0.7) {
      // A two-note whistle, falling.
      const f = rand(2800, 3400);
      note(t0, f, f * 1.02, 0.22);
      note(t0 + 0.3, f * 0.84, f * 0.8, 0.28, 0.9);
    } else {
      // A fast trill, fading.
      const f = rand(3600, 4400);
      const n = Math.round(rand(8, 14));
      for (let i = 0; i < n; i += 1) note(t0 + i * 0.045, i % 2 ? f * 0.9 : f, i % 2 ? f * 0.86 : f * 1.05, 0.035, 1 - (i / n) * 0.6);
    }
  }

  // ------------------------------------------------------------------ levels

  private isRunning(): boolean {
    return Boolean(this.ctx && this.ctx.state === 'running' && this.enabled && this.visible);
  }

  private applyMaster(): void {
    if (!this.ctx) return;
    const level = this.enabled && this.visible ? MIX.master * this.volume : 0;
    this.master.gain.setTargetAtTime(level, this.ctx.currentTime, GLIDE.toggle);
  }

  private applyDuck(): void {
    if (!this.ctx) return;
    this.ambience.gain.setTargetAtTime(this.duck * this.voiceDuck, this.ctx.currentTime, GLIDE.duck);
  }

  /** On when wanted (fading in), off when not (fading out, then suspending to save battery). */
  private applyRunning(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    window.clearTimeout(this.suspendTimer);
    if (this.enabled && this.visible) {
      if (ctx.state !== 'running') void ctx.resume().then(() => this.applyMaster());
      this.applyMaster();
    } else {
      this.applyMaster();
      this.suspendTimer = window.setTimeout(() => {
        if (!(this.enabled && this.visible)) void ctx.suspend();
      }, GLIDE.toggle * 4000);
    }
  }

  private loadVoice(src: string): Promise<AudioBuffer | null> {
    let loading = this.voiceBuffers.get(src);
    if (!loading) {
      loading = fetch(src)
        .then((response) => (response.ok ? response.arrayBuffer() : Promise.reject(new Error(String(response.status)))))
        .then((data) => this.ctx!.decodeAudioData(data))
        .catch(() => null);
      this.voiceBuffers.set(src, loading);
    }
    return loading;
  }
}

/**
 * The one engine for the whole app: the sound button (AudioProvider) unlocks
 * it inside its own click -- the gesture mobile browsers need -- and the map
 * (useWorldAmbience) feeds it the world's state.
 */
export const ambienceEngine = new AmbienceEngine();
