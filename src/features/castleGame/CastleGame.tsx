import { useCallback, useEffect, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { ArrowFatLeft, ArrowFatRight, ArrowFatUp, Pause, X } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { MAP_ROUTE } from '../../app/routes';
import { useFocusTrap } from '../../components/useFocusTrap';
import { SnailFigure } from '../../components/SnailFigure';
import { BOSS, COPY, LEADERBOARD, LIVES } from './config';
import { advance, createGame, type GameState } from './engine';
import { InputController, isGameKey, type TouchButton } from './input';
import { cleanAlias, loadLeaderboard, qualifies, saveScore, type LeaderboardEntry } from './leaderboard';
import { Camera, Effects, computeView, drawFrame, type View } from './render';
import styles from './CastleGame.module.css';

type Screen = 'menu' | 'playing' | 'paused' | 'gameOver' | 'victory';

type Hud = {
  score: number;
  /** Whole seconds on the clock (it only runs while playing). */
  seconds: number;
  lives: number;
  bossHp: number;
  /** The boss's name and health bar, from its entrance until it's beaten. */
  bossShown: boolean;
  bossIntro: boolean;
};

const HUD_START: Hud = { score: 0, seconds: 0, lives: LIVES, bossHp: BOSS.hp, bossShown: false, bossIntro: false };

/** 83.4 -> "1:23" */
function formatTime(seconds: number): string {
  const s = Math.floor(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** How long the last moment (the final hit, the door) plays out before the results card. */
const END_DELAY_MS = 900;

function hudFrom(state: GameState): Hud {
  const { phase, hp } = state.boss;
  return {
    score: state.score,
    seconds: Math.floor(state.time),
    lives: state.lives,
    bossHp: hp,
    bossShown: phase === 'intro' || phase === 'walk' || phase === 'windup',
    bossIntro: phase === 'intro',
  };
}

const sameHud = (a: Hud, b: Hud) =>
  a.score === b.score &&
  a.seconds === b.seconds && a.lives === b.lives && a.bossHp === b.bossHp && a.bossShown === b.bossShown && a.bossIntro === b.bossIntro;

function prefersTouch(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
}

function Leaderboard({ entries, highlightAt }: { entries: LeaderboardEntry[]; highlightAt: number | null }) {
  return (
    <section className={styles.board} aria-labelledby="castle-board-title">
      <h3 id="castle-board-title" className={styles.boardTitle}>
        {COPY.leaderboard}
      </h3>
      {entries.length === 0 ? (
        <p className={styles.boardEmpty}>{COPY.leaderboardEmpty}</p>
      ) : (
        <ol className={styles.boardList}>
          {entries.map((entry, i) => (
            <li key={`${entry.at}-${i}`} className={styles.boardRow} data-new={entry.at === highlightAt || undefined}>
              <span className={styles.boardPos}>{i + 1}.</span>
              <span className={styles.boardAlias}>{entry.alias}</span>
              <span className={styles.boardTime}>{entry.time !== undefined ? formatTime(entry.time) : ''}</span>
              <span className={styles.boardScore}>{entry.score.toLocaleString('eu')}</span>
            </li>
          ))}
        </ol>
      )}
      <p className={styles.boardNote}>{COPY.leaderboardNote}</p>
    </section>
  );
}

export type CastleGameProps = {
  /** Leaves the game (back to the map). Defaults to navigating to the map. */
  onClose?: () => void;
};

/**
 * "Xendra: Gaztelu Hondatua" -- the castle's platform minigame, as a
 * full-screen modal over the map (MapLayout renders it for /gaztelua and
 * blocks the map's controls meanwhile).
 *
 * The game itself is plain TypeScript: engine.ts simulates in fixed steps,
 * render.ts draws on a canvas, input.ts reads keys/touch. This component
 * runs the requestAnimationFrame loop while playing, and draws the menus,
 * HUD, touch buttons and ranking around it. Everything it starts (the loop,
 * listeners, the resize observer) is stopped when it unmounts.
 */
export function CastleGame({ onClose }: CastleGameProps) {
  const navigate = useNavigate();
  // Read through a ref so the key listeners below are set up once, not on every render.
  const closeRef = useRef<() => void>(() => {});
  useEffect(() => {
    closeRef.current = onClose ?? (() => navigate(MAP_ROUTE));
  });
  const close = useCallback(() => closeRef.current(), []);

  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const gameRef = useRef<GameState>(createGame());
  const inputRef = useRef(new InputController());
  const cameraRef = useRef(new Camera());
  const effectsRef = useRef(new Effects());
  const viewRef = useRef<View>(computeView(960, 540));

  const [screen, setScreen] = useState<Screen>('menu');
  /** Which game this is, so a result is only ever saved once. */
  const [run, setRun] = useState(0);
  const [hud, setHud] = useState<Hud>(HUD_START);
  const [board, setBoard] = useState<LeaderboardEntry[]>(() => loadLeaderboard());
  const [finalScore, setFinalScore] = useState(0);
  /** The finished game's time and speed bonus (the bonus only for a win). */
  const [finalTime, setFinalTime] = useState(0);
  const [finalBonus, setFinalBonus] = useState(0);
  const [savedRun, setSavedRun] = useState<number | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [alias, setAlias] = useState('');
  const [aliasError, setAliasError] = useState<string | null>(null);
  const [touchUi, setTouchUi] = useState(prefersTouch);
  const [notice, setNotice] = useState<string | null>(null);

  const screenRef = useRef(screen);
  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  useFocusTrap(containerRef, true);

  /** Draws the current state once (menus, pause, resizes). */
  const drawStill = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = canvas.width / Math.max(1, canvas.clientWidth);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    drawFrame(ctx, gameRef.current, viewRef.current, cameraRef.current, effectsRef.current);
  }, []);



  // Canvas size follows its box, at up to 2x for sharp lines on retina screens.
  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return undefined;
    const resize = () => {
      const { width, height } = stage.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      viewRef.current = computeView(width, height);
      cameraRef.current.follow(gameRef.current, viewRef.current, 0, true);
      if (screenRef.current !== 'playing') drawStill();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [drawStill]);

  const startGame = useCallback(() => {
    gameRef.current = createGame();
    setRun((n) => n + 1);
    inputRef.current.reset();
    effectsRef.current.clear();
    cameraRef.current.follow(gameRef.current, viewRef.current, 0, true);
    setHud(HUD_START);
    setSavedRun(null);
    setSavedAt(null);
    setAlias('');
    setAliasError(null);
    setNotice(null);
    screenRef.current = 'playing';
    setScreen('playing');
    stageRef.current?.focus({ preventScroll: true });
  }, []);

  const pause = useCallback(() => {
    if (screenRef.current !== 'playing') return;
    inputRef.current.reset();
    screenRef.current = 'paused';
    setScreen('paused');
  }, []);

  const resume = useCallback(() => {
    if (screenRef.current !== 'paused') return;
    screenRef.current = 'playing';
    setScreen('playing');
    stageRef.current?.focus({ preventScroll: true });
  }, []);

  // The game loop: only runs while playing. Fixed-step simulation (see
  // engine.advance), so it plays the same at any refresh rate; the first
  // frame after starting or resuming simulates nothing, so a pause never
  // turns into a jump in time.
  useEffect(() => {
    if (screen !== 'playing') {
      drawStill();
      return undefined;
    }
    let raf = 0;
    let last: number | null = null;
    let accumulator = 0;
    let endAt: number | null = null;
    let noticeTimer = 0;

    const frame = (now: number) => {
      const elapsed = last === null ? 0 : (now - last) / 1000;
      last = now;
      const game = gameRef.current;
      const input = inputRef.current;

      const result = advance(game, input.read(now), elapsed, accumulator);
      accumulator = result.accumulator;
      if (result.steps > 0) input.consumeJump();

      if (game.events.length > 0) {
        effectsRef.current.handle(game.events, game);
        for (const e of game.events) {
          if (e.type === 'bossDefeated' || e.type === 'checkpoint') {
            setNotice(e.type === 'bossDefeated' ? COPY.bossDefeated : COPY.checkpoint);
            window.clearTimeout(noticeTimer);
            noticeTimer = window.setTimeout(() => setNotice(null), 2200);
          }
        }
        game.events = [];
      }
      effectsRef.current.update(Math.min(elapsed, 0.1));
      cameraRef.current.follow(game, viewRef.current, Math.min(elapsed, 0.1));

      const next = hudFrom(game);
      setHud((prev) => (sameHud(prev, next) ? prev : next));
      drawStill();

      if (game.status !== 'playing') {
        endAt ??= now + END_DELAY_MS;
        if (now >= endAt) {
          setFinalScore(game.score);
          setFinalTime(game.time);
          setFinalBonus(game.timeBonus);
          setScreen(game.status === 'victory' ? 'victory' : 'gameOver');
          return;
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(noticeTimer);
    };
  }, [screen, drawStill]);

  // Keys, and pausing when the tab is hidden or the window loses focus.
  useEffect(() => {
    const input = inputRef.current;
    const inField = (target: EventTarget | null) =>
      target instanceof HTMLElement && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

    const onKeyDown = (event: KeyboardEvent) => {
      if (inField(event.target)) return;
      const playing = screenRef.current === 'playing';
      if (event.code === 'Escape' || event.code === 'KeyP') {
        if (playing) pause();
        else if (screenRef.current === 'paused') resume();
        else if (event.code === 'Escape') close();
        event.preventDefault();
        return;
      }
      if (playing && isGameKey(event.code)) {
        event.preventDefault();
        if (!event.repeat) input.keyDown(event.code);
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (isGameKey(event.code)) {
        input.keyUp(event.code);
        if (screenRef.current === 'playing') event.preventDefault();
      }
    };
    const onVisibility = () => {
      if (document.hidden) pause();
    };
    const onBlur = () => input.reset();

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      input.reset();
    };
  }, [pause, resume, close]);

  // Touch gestures on the play area (mouse clicks are left alone).
  const onStagePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' || screenRef.current !== 'playing') return;
    setTouchUi(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    inputRef.current.pointerDown(event.pointerId, event.clientX, event.clientY, event.timeStamp);
  };
  const onStagePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse') return;
    inputRef.current.pointerMove(event.pointerId, event.clientX, event.clientY, event.timeStamp);
  };
  const onStagePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse') return;
    inputRef.current.pointerUp(event.pointerId, event.clientX, event.clientY, event.timeStamp);
  };
  const onStagePointerCancel = (event: ReactPointerEvent<HTMLDivElement>) => {
    inputRef.current.pointerCancel(event.pointerId);
  };

  // The on-screen buttons, held like keys. Each says which it is in data-button.
  const buttonOf = (event: { currentTarget: HTMLButtonElement }) => event.currentTarget.dataset.button as TouchButton;
  const onButtonDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    inputRef.current.buttonDown(buttonOf(event));
  };
  const onButtonUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    inputRef.current.buttonUp(buttonOf(event));
  };
  const touchButtonProps = {
    onPointerDown: onButtonDown,
    onPointerUp: onButtonUp,
    onPointerCancel: onButtonUp,
    onLostPointerCapture: onButtonUp,
    onContextMenu: (event: React.MouseEvent) => event.preventDefault(),
  };

  const finished = screen === 'gameOver' || screen === 'victory';
  const canSave = finished && savedRun !== run && qualifies(finalScore, board);

  const submitAlias = (event: FormEvent) => {
    event.preventDefault();
    if (savedRun === run) return;
    const clean = cleanAlias(alias);
    if (!clean) {
      setAliasError(COPY.aliasEmpty);
      return;
    }
    const at = Date.now();
    setBoard(saveScore(clean, finalScore, at, screen === 'victory' ? finalTime : undefined));
    setSavedAt(at);
    setSavedRun(run);
    setAliasError(null);
  };

  const howTo = touchUi ? COPY.howToTouch : COPY.howToKeys;

  return (
    <>
      <div className={styles.scrim} />
      <div
        ref={containerRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="castle-game-title"
        tabIndex={-1}
      >
        <header className={styles.header}>
          <h2 id="castle-game-title" className={styles.title}>
            {COPY.title}
          </h2>
          <button type="button" className={`xnd-btn-secondary ${styles.backButton}`} onClick={close}>
            <X size={16} weight="bold" aria-hidden="true" />
            {COPY.backToMap}
          </button>
        </header>

        <div
          ref={stageRef}
          className={styles.stage}
          tabIndex={-1}
          onPointerDown={onStagePointerDown}
          onPointerMove={onStagePointerMove}
          onPointerUp={onStagePointerUp}
          onPointerCancel={onStagePointerCancel}
        >
          <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />

          {(screen === 'playing' || screen === 'paused') && (
            <div className={styles.hud}>
              <div className={styles.hudStats}>
                <span className={styles.lives} aria-label={`${COPY.lives}: ${hud.lives}`}>
                  {Array.from({ length: LIVES }, (_, i) => (
                    <SnailFigure key={i} direction="right" className={styles.lifeIcon} style={{ opacity: i < hud.lives ? 1 : 0.22 }} />
                  ))}
                </span>
                <span className={styles.score}>
                  <span className="visually-hidden">{COPY.score}: </span>
                  {hud.score.toLocaleString('eu')}
                </span>
                <span className={styles.timer}>
                  <span className="visually-hidden">{COPY.time}: </span>
                  {formatTime(hud.seconds)}
                </span>
              </div>

              {hud.bossShown && (
                <div className={styles.bossBar} aria-live="polite">
                  <span className={styles.bossName}>{BOSS.name}</span>
                  <span className={styles.bossHp} role="meter" aria-valuemin={0} aria-valuemax={BOSS.hp} aria-valuenow={hud.bossHp} aria-label={BOSS.name}>
                    {Array.from({ length: BOSS.hp }, (_, i) => (
                      <span key={i} className={styles.bossHpSegment} data-full={i < hud.bossHp || undefined} />
                    ))}
                  </span>
                </div>
              )}

              <button
                type="button"
                className={`xnd-btn-icon ${styles.pauseButton}`}
                onClick={pause}
                aria-label={COPY.pause}
                title={COPY.pause}
                disabled={screen !== 'playing'}
              >
                <Pause size={20} weight="fill" aria-hidden="true" />
              </button>
            </div>
          )}

          {screen === 'playing' && hud.bossIntro && (
            <div className={styles.bossIntro} aria-hidden="true">
              {BOSS.name}
            </div>
          )}
          {screen === 'playing' && notice && (
            <div className={styles.notice} role="status">
              {notice}
            </div>
          )}

          {screen === 'playing' && touchUi && (
            <div className={styles.touchControls}>
              <div className={styles.touchMove}>
                <button type="button" className={styles.touchButton} aria-label={COPY.touchLeft} data-button="left" {...touchButtonProps}>
                  <ArrowFatLeft size={26} weight="fill" aria-hidden="true" />
                </button>
                <button type="button" className={styles.touchButton} aria-label={COPY.touchRight} data-button="right" {...touchButtonProps}>
                  <ArrowFatRight size={26} weight="fill" aria-hidden="true" />
                </button>
              </div>
              <button type="button" className={styles.touchButton} aria-label={COPY.touchJump} data-button="jump" {...touchButtonProps}>
                <ArrowFatUp size={26} weight="fill" aria-hidden="true" />
              </button>
            </div>
          )}

          {screen === 'menu' && (
            <div className={styles.overlay}>
              <div className={styles.card}>
                <SnailFigure direction="right" className={styles.cardSnail} />
                <h3 className={styles.cardTitle}>{COPY.title}</h3>
                <p className={styles.cardText}>{howTo}</p>
                <p className={styles.cardText}>{COPY.howToGoal}</p>
                <button type="button" className="xnd-btn-primary" onClick={startGame} autoFocus>
                  {COPY.start}
                </button>
                <Leaderboard entries={board} highlightAt={null} />
              </div>
            </div>
          )}

          {screen === 'paused' && (
            <div className={styles.overlay}>
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>{COPY.paused}</h3>
                <div className={styles.actions}>
                  <button type="button" className="xnd-btn-primary" onClick={resume} autoFocus>
                    {COPY.resume}
                  </button>
                  <button type="button" className="xnd-btn-secondary" onClick={close}>
                    {COPY.backToMap}
                  </button>
                </div>
              </div>
            </div>
          )}

          {finished && (
            <div className={styles.overlay}>
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>{screen === 'victory' ? COPY.victory : COPY.gameOver}</h3>
                <p className={styles.cardText}>{screen === 'victory' ? COPY.victoryText : COPY.gameOverText}</p>
                <p className={styles.finalScore}>
                  <span>{COPY.finalScore}</span>
                  <strong>
                    {finalScore.toLocaleString('eu')} {COPY.points}
                  </strong>
                </p>
                <p className={styles.finalBreakdown}>
                  {COPY.time}: {formatTime(finalTime)}
                  {screen === 'victory' && (
                    <>
                      {' · '}
                      {COPY.timeBonus}: +{finalBonus.toLocaleString('eu')}
                    </>
                  )}
                </p>

                {canSave && (
                  <form className={styles.aliasForm} onSubmit={submitAlias} noValidate>
                    <label htmlFor="castle-alias">{COPY.newRecord}</label>
                    <div className={styles.aliasRow}>
                      <input
                        id="castle-alias"
                        value={alias}
                        maxLength={LEADERBOARD.aliasMaxLength}
                        onChange={(e) => setAlias(e.target.value)}
                        autoComplete="nickname"
                        aria-describedby="castle-alias-hint"
                        aria-invalid={Boolean(aliasError)}
                        autoFocus
                      />
                      <button type="submit" className="xnd-btn-secondary">
                        {COPY.save}
                      </button>
                    </div>
                    <p id="castle-alias-hint" className={aliasError ? styles.aliasError : styles.aliasHint} role={aliasError ? 'alert' : undefined}>
                      {aliasError ?? COPY.aliasHint}
                    </p>
                  </form>
                )}
                {savedRun === run && <p className={styles.saved} role="status">{COPY.saved}</p>}

                <Leaderboard entries={board} highlightAt={savedAt} />
                <div className={styles.actions}>
                  <button type="button" className="xnd-btn-primary" onClick={startGame} autoFocus={!canSave}>
                    {COPY.playAgain}
                  </button>
                  <button type="button" className="xnd-btn-secondary" onClick={close}>
                    {COPY.backToMap}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
