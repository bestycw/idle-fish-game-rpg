import {
  ARRIVAL_BY_PRESET,
  completeNarrativeOnboarding,
  PROLOGUE_BEATS,
  PROLOGUE_SKIP_DEFAULT_PRESET,
  skipPrologueToMainline,
  WORLD_PICK_OPTIONS,
  type PlayerState,
  type PrologueBeat,
  type PrologueLine,
  type PrologueMood,
  type WorldPreset,
} from '@moyu/game-core';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { PrologueLineView } from './prologue/PrologueLineView';
import {
  PrologueTransitionOverlay,
  type PrologueTransitionKind,
} from './prologue/PrologueTransitionOverlay';
import { PrologueGeneratingPlot } from './prologue/PrologueGeneratingPlot';
import { PrologueHeroNameStep } from './prologue/PrologueHeroNameStep';
import {
  ProloguePreferencesStep,
  type PrologueNarrativeProfile,
} from './prologue/ProloguePreferencesStep';
import { usePrologueReveal } from './prologue/usePrologueReveal';

const TRANSITION_MS: Record<PrologueTransitionKind, number> = {
  'flash-white': 520,
  'flash-glitch': 580,
  'fade-void': 720,
};

const STEP_WORLD = 6;
const STEP_ARRIVAL = 8;
const STEP_P10 = 9;
const STEP_HERO_NAME = 10;
const STEP_PREFERENCES = 11;
const STEP_GENERATING = 12;
const STEP_DONE = 13;

const PLOT_GEN_MS = 1100;

type PrologueScreenProps = {
  setPlayer: React.Dispatch<React.SetStateAction<PlayerState>>;
  onComplete: () => void;
};

export function PrologueScreen({ setPlayer, onComplete }: PrologueScreenProps) {
  const [step, setStep] = useState(0);
  const [preset, setPreset] = useState<WorldPreset | null>(null);
  const [heroName, setHeroName] = useState('');
  const [narrativeProfile, setNarrativeProfile] = useState<PrologueNarrativeProfile | null>(null);
  const [transition, setTransition] = useState<PrologueTransitionKind | null>(null);

  const progressLabel = useMemo(() => {
    if (step < STEP_WORLD) return `序章 · ${step + 1} / ${STEP_WORLD}`;
    if (step === STEP_WORLD) return '【关键抉择】位面三选一';
    if (step < STEP_P10) return '落地 · 绑定说明';
    if (step === STEP_HERO_NAME) return '序章终幕 · 称呼';
    if (step === STEP_PREFERENCES) return '序章终幕 · 定锚';
    if (step === STEP_GENERATING) return '编织卷一';
    return '';
  }, [step]);

  const advancePlain = useCallback(() => {
    setStep((s) => Math.min(s + 1, STEP_DONE));
  }, []);

  const advanceFromBeat = useCallback(
    (beat: PrologueBeat) => {
      if (beat.transitionOut) {
        setTransition(beat.transitionOut);
        window.setTimeout(() => {
          setTransition(null);
          advancePlain();
        }, TRANSITION_MS[beat.transitionOut!]);
        return;
      }
      advancePlain();
    },
    [advancePlain],
  );

  useEffect(() => {
    if (step !== STEP_GENERATING || !preset || !narrativeProfile || !heroName) return;
    const world = preset;
    const prefs = narrativeProfile.preferences;
    const t = window.setTimeout(() => {
      setPlayer((p) =>
        completeNarrativeOnboarding(p, world, {
          heroName,
          preferences: prefs,
        }),
      );
      onComplete();
    }, PLOT_GEN_MS);
    return () => window.clearTimeout(t);
  }, [step, preset, narrativeProfile, heroName, onComplete, setPlayer]);

  const skipAll = () => {
    setPlayer((p) => skipPrologueToMainline(p));
    onComplete();
  };

  const transitionLayer = transition ? <PrologueTransitionOverlay kind={transition} /> : null;

  if (step < STEP_WORLD) {
    const beat = PROLOGUE_BEATS[step];
    return (
      <>
        {transitionLayer}
        <ScriptBeat
          progressLabel={progressLabel}
          beat={beat}
          stepKey={`beat-${beat.id}`}
          onSkip={skipAll}
          continueLabel={beat.continueLabel ?? '继续'}
          onContinue={() => advanceFromBeat(beat)}
        />
      </>
    );
  }

  if (step === STEP_WORLD) {
    return (
      <>
        {transitionLayer}
        <PrologueFrame mood="void" progressLabel={progressLabel} onSkip={skipAll} title="三扇门 · 选服" hideContinue>
        <p className="prologue-line-in mb-1 font-display text-base text-primary/90">
          风停了。你站在三条副本入口前——原服的工位灯，还在很远的地方亮着。
        </p>
        <p className="mb-4 text-xs text-muted-foreground">点击位面进入 · 历史投影将在该线与你绑定</p>
        <div className="space-y-2.5">
          {WORLD_PICK_OPTIONS.map((opt, i) => (
            <button
              key={opt.preset}
              type="button"
              onClick={() => {
                setPreset(opt.preset);
                setStep(STEP_WORLD + 1);
              }}
              className={cn(
                'prologue-world-card w-full rounded-xl border px-3 py-3 text-left transition',
                'border-border/80 bg-card/50 hover:border-primary/50 hover:bg-primary/10',
                opt.preset === 'xianxia' && 'border-primary/35 shadow-[0_0_24px_rgba(226,160,74,0.12)]',
              )}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-display text-lg text-primary">{opt.title}</p>
                <span className="font-mono text-[9px] text-muted-foreground">{opt.tagline}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{opt.subtitle}</p>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            setPreset(PROLOGUE_SKIP_DEFAULT_PRESET);
            setStep(STEP_WORLD + 1);
          }}
          className="mt-4 w-full font-mono text-[11px] text-muted-foreground underline-offset-2 hover:text-primary hover:underline"
        >
          我不挑了，就去修仙那个 →
        </button>
      </PrologueFrame>
      </>
    );
  }

  const world = preset ?? PROLOGUE_SKIP_DEFAULT_PRESET;

  if (step === STEP_WORLD + 1) {
    const beat = PROLOGUE_BEATS[6];
    return (
      <ScriptBeat
        progressLabel={progressLabel}
        beat={beat}
        stepKey={`beat-${beat.id}-${world}`}
        onSkip={skipAll}
        continueLabel={beat.continueLabel ?? '继续'}
        onContinue={advancePlain}
      />
    );
  }

  if (step === STEP_ARRIVAL) {
    const arrival = ARRIVAL_BY_PRESET[world];
    return (
      <ScriptBeat
        progressLabel={progressLabel}
        beat={{
          id: 'p08',
          title: arrival.place,
          hook: arrival.hook,
          mood: arrival.mood,
          lines: arrival.lines,
        }}
        stepKey={`arrival-${world}`}
        onSkip={skipAll}
        continueLabel="行，入队"
        onContinue={advancePlain}
      />
    );
  }

  if (step === STEP_ARRIVAL + 1) {
    const beat = PROLOGUE_BEATS[7];
    return (
      <ScriptBeat
        progressLabel={progressLabel}
        beat={beat}
        stepKey={`beat-${beat.id}-final`}
        onSkip={skipAll}
        continueLabel={beat.continueLabel ?? '创建角色'}
        onContinue={advancePlain}
        footer={
          <p className="mt-2 text-center font-mono text-[10px] text-muted-foreground">
            当前位面 · {WORLD_PICK_OPTIONS.find((o) => o.preset === world)?.title ?? world}
          </p>
        }
      />
    );
  }

  if (step === STEP_HERO_NAME) {
    return (
      <>
        {transitionLayer}
        <PrologueFrame
          mood="void"
          progressLabel={progressLabel}
          onSkip={skipAll}
          title="锚定称呼"
          hideContinue
        >
          <PrologueHeroNameStep
            onContinue={(name) => {
              setHeroName(name);
              setStep(STEP_PREFERENCES);
            }}
          />
        </PrologueFrame>
      </>
    );
  }

  if (step === STEP_PREFERENCES) {
    return (
      <>
        {transitionLayer}
        <PrologueFrame
          mood="void"
          progressLabel={progressLabel}
          onSkip={skipAll}
          title="叙事定参"
          hideContinue
        >
          <ProloguePreferencesStep
            heroName={heroName}
            worldPreset={preset ?? PROLOGUE_SKIP_DEFAULT_PRESET}
            onConfirm={(profile) => {
              setNarrativeProfile(profile);
              setStep(STEP_GENERATING);
            }}
          />
        </PrologueFrame>
      </>
    );
  }

  if (step === STEP_GENERATING) {
    return (
      <>
        {transitionLayer}
        <PrologueFrame
          mood="glitch"
          progressLabel={progressLabel}
          onSkip={skipAll}
          title="编织卷一主线"
          hideContinue
        >
          <PrologueGeneratingPlot heroName={heroName} />
        </PrologueFrame>
      </>
    );
  }

  return null;
}

function ScriptBeat({
  beat,
  stepKey,
  progressLabel,
  onSkip,
  continueLabel,
  onContinue,
  footer,
}: {
  beat: PrologueBeat;
  stepKey: string;
  progressLabel: string;
  onSkip: () => void;
  continueLabel: string;
  onContinue: () => void;
  footer?: React.ReactNode;
}) {
  const { revealed, revealAll, complete } = usePrologueReveal(
    beat.lines.length,
    stepKey,
    beat.revealMs,
  );

  const onTapBody = () => {
    if (!complete) revealAll();
  };

  return (
    <PrologueFrame
      mood={beat.mood}
      stepKey={stepKey}
      progressLabel={progressLabel}
      onSkip={onSkip}
      title={beat.title}
      hook={beat.hook}
      hideContinue={!complete}
      continueLabel={continueLabel}
      onContinue={onContinue}
      onTapBody={onTapBody}
      tapHint={complete ? undefined : '点击文稿 · 一次性显示本页'}
    >
      <PrologueScript lines={beat.lines} revealed={revealed} pageInstant={complete} />
      {footer}
    </PrologueFrame>
  );
}

function PrologueScript({
  lines,
  revealed,
  pageInstant,
}: {
  lines: PrologueLine[];
  revealed: number;
  pageInstant: boolean;
}) {
  const typingIndex = pageInstant ? -1 : revealed - 1;
  return (
    <div className="space-y-3">
      {lines.map((line, i) => (
        <PrologueLineView
          key={`${line.kind}-${i}-${line.text.slice(0, 12)}`}
          line={line}
          visible={i < revealed}
          index={i}
          emphasisTyping={i === typingIndex && line.kind === 'emphasis'}
          pageInstant={pageInstant}
        />
      ))}
    </div>
  );
}

function PrologueFrame({
  title,
  hook,
  mood,
  stepKey,
  progressLabel,
  children,
  continueLabel,
  onContinue,
  onSkip,
  hideContinue,
  onTapBody,
  tapHint,
}: {
  title: string;
  hook?: string;
  mood?: PrologueMood;
  stepKey?: string;
  progressLabel: string;
  children: React.ReactNode;
  continueLabel?: string;
  onContinue?: () => void;
  onSkip: () => void;
  hideContinue?: boolean;
  onTapBody?: () => void;
  tapHint?: string;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="font-mono text-[10px] tracking-[0.14em] text-amber-300/85">{progressLabel}</p>
        <button
          type="button"
          onClick={onSkip}
          className="shrink-0 font-mono text-[10px] text-muted-foreground hover:text-foreground"
        >
          跳过序章
        </button>
      </div>

      <article
        key={stepKey}
        className={cn(
          'prologue-frame prologue-page-enter relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border px-4 py-4 sm:px-5 sm:py-5',
          mood === 'office' && 'prologue-mood-office border-slate-500/30',
          mood === 'glitch' && 'prologue-mood-glitch border-fuchsia-400/40',
          mood === 'void' && 'prologue-mood-void border-indigo-400/35',
          (mood === 'world' || !mood) && 'prologue-mood-world border-amber-500/30',
        )}
      >
        {mood === 'glitch' ? (
          <div className="prologue-scanlines pointer-events-none absolute inset-0 rounded-xl opacity-[0.35]" aria-hidden />
        ) : null}
        {mood === 'void' ? (
          <div className="prologue-void-vignette pointer-events-none absolute inset-0 rounded-xl" aria-hidden />
        ) : null}
        {hook ? (
          <p className="prologue-hook relative z-[1] border-l-2 border-primary/50 pl-3 font-display text-sm leading-snug text-primary/95 sm:text-base">
            {hook}
          </p>
        ) : null}
        <h2
          className={cn(
            'prologue-chapter-title relative z-[1] font-display text-xl tracking-wide text-foreground sm:text-2xl',
            hook ? 'mt-3' : undefined,
          )}
        >
          {title}
        </h2>

        <button
          type="button"
          onClick={onTapBody}
          className="prologue-scroll mt-4 min-h-0 flex-1 overflow-y-auto overscroll-contain text-left outline-none"
        >
          {children}
        </button>

        {tapHint ? (
          <p className="mt-2 text-center font-mono text-[9px] tracking-widest text-muted-foreground/80 animate-pulse">
            {tapHint}
          </p>
        ) : null}

        {!hideContinue ? (
          <button
            type="button"
            onClick={onContinue}
            className="prologue-continue-in mt-3 w-full rounded-xl bg-primary py-3 text-center text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 hover:brightness-110"
          >
            {continueLabel}
          </button>
        ) : null}
      </article>
    </div>
  );
}
