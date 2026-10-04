import type {
  NarrativeBondLine,
  NarrativeFortuneArc,
  NarrativeHeroEdge,
  NarrativeLens,
  NarrativePreferences,
  NarrativePressureTone,
  StoryMotifId,
  WorldPreset,
  WorldTextureId,
} from '@moyu/game-core';
import {
  BOND_LINE_LABEL,
  defaultNarrativePreferences,
  FORTUNE_ARC_LABEL,
  HERO_EDGE_LABEL,
  NARRATIVE_LENS_LABEL,
  PRESSURE_TONE_LABEL,
  STORY_MOTIF_OPTIONS,
  WORLD_TEXTURE_OPTIONS,
} from '@moyu/game-core';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

type Tone = NarrativePreferences['tone'];
type Pace = NarrativePreferences['pace'];

export type PrologueNarrativeProfile = {
  preferences: NarrativePreferences;
};

function toggleMotif(current: StoryMotifId[], id: StoryMotifId): StoryMotifId[] {
  if (current.includes(id)) return current.filter((m) => m !== id);
  if (current.length >= 2) return [current[1]!, id];
  return [...current, id];
}

export function ProloguePreferencesStep({
  heroName,
  worldPreset,
  onConfirm,
}: {
  heroName: string;
  worldPreset: WorldPreset;
  onConfirm: (profile: PrologueNarrativeProfile) => void;
}) {
  const defaults = useMemo(() => defaultNarrativePreferences(worldPreset), [worldPreset]);
  const textures = WORLD_TEXTURE_OPTIONS[worldPreset];

  const [worldTexture, setWorldTexture] = useState<WorldTextureId>(defaults.vector.worldTexture);
  const [storyMotifs, setStoryMotifs] = useState<StoryMotifId[]>(defaults.vector.storyMotifs);
  const [bondLine, setBondLine] = useState<NarrativeBondLine>(defaults.control.bondLine);
  const [fortuneArc, setFortuneArc] = useState<NarrativeFortuneArc>(defaults.control.fortuneArc);
  const [heroEdge, setHeroEdge] = useState<NarrativeHeroEdge>(defaults.control.heroEdge);
  const [narrativeLens, setNarrativeLens] = useState<NarrativeLens>(defaults.control.narrativeLens);
  const [pressureTone, setPressureTone] = useState<NarrativePressureTone>(
    defaults.control.pressureTone,
  );
  const [tone, setTone] = useState<Tone>(defaults.tone);
  const [pace, setPace] = useState<Pace>(defaults.pace);

  const buildPrefs = (): NarrativePreferences => ({
    vector: { worldTexture, storyMotifs },
    novelFrameId: defaults.novelFrameId,
    control: { bondLine, fortuneArc, heroEdge, narrativeLens, pressureTone },
    tone,
    pace,
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <p className="font-mono text-[10px] tracking-[0.14em] text-cyan-300/85">序章终幕 · 定参</p>
      <h2 className="font-display mt-1 text-xl tracking-wide sm:text-2xl">{heroName}，这趟什么质感？</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        只影响<strong className="font-normal text-foreground/85">剧情填充</strong>；不选也可一键用推荐默认（与 Skill 官方包一致）。
      </p>

      <button
        type="button"
        onClick={() => onConfirm({ preferences: defaults })}
        className="mt-3 w-full rounded-lg border border-primary/40 bg-primary/10 py-2.5 text-sm text-primary hover:bg-primary/15"
      >
        使用推荐默认 · 直接继续
      </button>

      <p className="mt-4 font-mono text-[9px] tracking-wide text-muted-foreground">世界质感（选一）</p>
      <div className="mt-1.5 space-y-2">
        {textures.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => setWorldTexture(o.id)}
            className={cn(
              'w-full rounded-lg border px-3 py-2 text-left text-sm transition',
              worldTexture === o.id
                ? 'border-primary/50 bg-primary/15'
                : 'border-border/70 bg-background/30',
            )}
          >
            <span className="font-display text-primary">{o.title}</span>
            <span className="ml-2 text-xs text-muted-foreground">{o.hint}</span>
          </button>
        ))}
      </div>

      <p className="mt-4 font-mono text-[9px] tracking-wide text-muted-foreground">母题（最多 2 个）</p>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {STORY_MOTIF_OPTIONS.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => setStoryMotifs((m) => toggleMotif(m, o.id))}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-xs transition',
              storyMotifs.includes(o.id) ? 'border-primary/50 bg-primary/15' : 'border-border/70',
            )}
          >
            {o.title}
          </button>
        ))}
      </div>

      <p className="mt-4 font-mono text-[9px] text-muted-foreground">控制点 · 文风 · 节奏（默认可不改）</p>
      <div className="prologue-scroll mt-2 max-h-[28vh] space-y-3 overflow-y-auto pr-0.5 text-[11px]">
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ['bond', bondLine, setBondLine, BOND_LINE_LABEL],
              ['fortune', fortuneArc, setFortuneArc, FORTUNE_ARC_LABEL],
              ['edge', heroEdge, setHeroEdge, HERO_EDGE_LABEL],
              ['lens', narrativeLens, setNarrativeLens, NARRATIVE_LENS_LABEL],
              ['pressure', pressureTone, setPressureTone, PRESSURE_TONE_LABEL],
            ] as const
          ).map(([key, val, setVal, labels]) => (
            <div key={key} className="w-full">
              {Object.entries(labels).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setVal(id as never)}
                  className={cn(
                    'mr-1 mb-1 rounded border px-2 py-1',
                    val === id ? 'border-primary/50 bg-primary/15' : 'border-border/60',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          {(['witty', 'earnest'] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setTone(id)}
              className={cn(
                'flex-1 rounded border py-1.5',
                tone === id ? 'border-primary/50 bg-primary/15' : 'border-border/60',
              )}
            >
              {id === 'witty' ? '诙谐' : '正剧'}
            </button>
          ))}
          {(['slow_burn', 'fast'] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setPace(id)}
              className={cn(
                'flex-1 rounded border py-1.5',
                pace === id ? 'border-primary/50 bg-primary/15' : 'border-border/60',
              )}
            >
              {id === 'slow_burn' ? '慢热' : '快'}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onConfirm({ preferences: buildPrefs() })}
        className="prologue-continue-in mt-4 w-full rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 hover:brightness-110"
      >
        提交定参 · 加载官方剧情包
      </button>
    </div>
  );
}
