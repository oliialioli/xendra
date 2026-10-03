/**
 * The castle game's tension music: two bars built from the opening of
 * "Lurrazala" (bass and drums, from 2.145 s, slowed 6%, darkened, with an E
 * drone and a dissonant shimmer on the second bar -- see the commit that
 * added gaztelua-tentsioa.m4a), looped seamlessly while playing.
 *
 * It tightens during the boss fight (a touch faster and brighter) and
 * relaxes again once the boss is beaten. Its own small Web Audio graph,
 * created in the "Hasi" click (the gesture mobile browsers need) and closed
 * when the game closes.
 */

/** The loop's exact length in the file; anything else in the decoded buffer is the encoder's padding. */
const LOOP_SECONDS = 5.848;
const LEVEL = 0.38;
const CALM = { rate: 1, cutoff: 2400 };
const BOSS = { rate: 1.05, cutoff: 7000 };

export class GameMusic {
  private ctx: AudioContext | null = null;
  private buffer: Promise<AudioBuffer | null> | null = null;
  private source: AudioBufferSourceNode | null = null;
  private gain: GainNode | null = null;
  private tone: BiquadFilterNode | null = null;
  private volume = 0.6;
  private boss = false;
  private readonly src: string;

  constructor(src: string) {
    this.src = src;
  }

  setVolume(volume: number): void {
    this.volume = volume;
    if (this.ctx && this.gain && this.source) {
      this.gain.gain.setTargetAtTime(LEVEL * volume, this.ctx.currentTime, 0.2);
    }
  }

  /** Starts (or restarts) the loop, fading in. Call from a user gesture the first time. */
  start(): void {
    const ctx = this.context();
    if (!ctx) return;
    void ctx.resume();
    this.stopSource(0.05);
    this.boss = false;
    void this.load().then((buffer) => {
      if (!buffer || !this.ctx) return;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      // Skip the encoder's silent lead-in, so the loop has no gap.
      source.loopStart = leadIn(buffer);
      source.loopEnd = source.loopStart + Math.min(LOOP_SECONDS, buffer.duration - source.loopStart);
      source.playbackRate.value = CALM.rate;

      const tone = ctx.createBiquadFilter();
      tone.type = 'lowpass';
      tone.frequency.value = CALM.cutoff;
      tone.Q.value = 0.6;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(LEVEL * this.volume, ctx.currentTime + 0.8);
      source.connect(tone).connect(gain).connect(ctx.destination);
      source.start(ctx.currentTime, source.loopStart);
      this.source = source;
      this.tone = tone;
      this.gain = gain;
    });
  }

  /** The boss fight: a little faster and brighter; back to calm once it's over. */
  setBoss(fighting: boolean): void {
    if (fighting === this.boss) return;
    this.boss = fighting;
    if (!this.ctx || !this.source || !this.tone) return;
    const target = fighting ? BOSS : CALM;
    const t = this.ctx.currentTime;
    this.source.playbackRate.setTargetAtTime(target.rate, t, 0.6);
    this.tone.frequency.setTargetAtTime(target.cutoff, t, 0.6);
  }

  pause(): void {
    void this.ctx?.suspend();
  }

  resume(): void {
    void this.ctx?.resume();
  }

  /** Fades out and stops (game over, victory, back to the menu). */
  stop(): void {
    this.stopSource(0.6);
  }

  destroy(): void {
    this.stopSource(0);
    void this.ctx?.close();
    this.ctx = null;
  }

  private stopSource(fade: number): void {
    const { ctx, source, gain } = this;
    this.source = null;
    this.gain = null;
    this.tone = null;
    if (!ctx || !source || !gain) return;
    gain.gain.setTargetAtTime(0.0001, ctx.currentTime, Math.max(0.01, fade / 3));
    source.stop(ctx.currentTime + fade + 0.05);
  }

  private context(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    this.ctx = new Ctor();
    return this.ctx;
  }

  private load(): Promise<AudioBuffer | null> {
    this.buffer ??= fetch(this.src)
      .then((response) => (response.ok ? response.arrayBuffer() : Promise.reject(new Error(String(response.status)))))
      .then((data) => this.ctx!.decodeAudioData(data))
      .catch(() => null);
    return this.buffer;
  }
}

/** Seconds of near-silence an AAC decoder may leave before the first drum hit (at most ~0.1 s). */
function leadIn(buffer: AudioBuffer): number {
  const data = buffer.getChannelData(0);
  const limit = Math.min(data.length, Math.round(buffer.sampleRate * 0.1));
  for (let i = 0; i < limit; i += 1) {
    if (Math.abs(data[i]) > 0.003) return i / buffer.sampleRate;
  }
  return 0;
}
