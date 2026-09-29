import {
  DISPLAY_ROWS,
  MAX_PARTY_SIZE,
  RARITY_LABELS,
  UNIT_TEMPLATES,
  benchUnit,
  formationHints,
  getProgress,
  getSkill,
  isOwned,
  jobLabel,
  placeUnit,
  roleLabel,
  rowLabel,
  type GridSlot,
  type PlayerState,
  type Rarity,
  type UnitTemplate,
} from '@moyu/game-core';
import { useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { rarityFrame } from '@/lib/tones';

export type FormationEditorProps = {
  player: PlayerState;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerState>>;
  pushNotice: (msg: string) => void;
  /** 战前嵌入：更紧凑的格子与伙伴条 */
  compact?: boolean;
  /** 战前：由外层容器滚动，席下不再套一层 max-height 滚动 */
  parentScroll?: boolean;
  /** 独立布阵页：选中后可在操作条打开养卡详情 */
  onOpenCharacter?: (templateId: string) => void;
};

/** 席下超过此人数时用搜索面板，避免刷一长条 chip */
const BENCH_INLINE_MAX = 10;

const RARITY_TIER_ORDER: Rarity[] = ['legendary', 'epic', 'rare', 'uncommon', 'common'];

type BenchRarityFilter = 'all' | Rarity;

const LONG_PRESS_MS = 480;

const BENCH_GRID_CLASS = 'grid grid-cols-4 gap-1 sm:grid-cols-5';

function partnerIntroText(t: UnitTemplate): { title: string; lines: string[] } {
  const skill = getSkill(t.skillId);
  const lines = [
    `${RARITY_LABELS[t.rarity]} · ${roleLabel(t.role)} · ${jobLabel(t.job)} · 荐 ${t.preferredSlot} 格`,
    `技能：${skill.name}${skill.qiCost > 0 ? `（气 ${skill.qiCost}）` : ''}`,
  ];
  if (skill.blurb) lines.push(skill.blurb);
  return { title: t.name, lines };
}

function formationUnchanged(a: PlayerState['formation'], b: PlayerState['formation']) {
  const ak = Object.keys(a);
  const bk = Object.keys(b);
  if (ak.length !== bk.length) return false;
  return ak.every((k) => a[k] === b[k]);
}

function PartnerChip({
  template,
  selected,
  onField,
  dense,
  onClick,
  onShowIntro,
}: {
  template: UnitTemplate;
  selected: boolean;
  onField: boolean;
  dense?: boolean;
  onClick: () => void;
  onShowIntro: () => void;
}) {
  const longTimer = useRef<number | null>(null);
  const longFired = useRef(false);

  const clearLongPress = () => {
    if (longTimer.current != null) {
      window.clearTimeout(longTimer.current);
      longTimer.current = null;
    }
  };

  return (
    <button
      type="button"
      onPointerDown={() => {
        longFired.current = false;
        clearLongPress();
        longTimer.current = window.setTimeout(() => {
          longFired.current = true;
          onShowIntro();
        }, LONG_PRESS_MS);
      }}
      onPointerUp={clearLongPress}
      onPointerLeave={clearLongPress}
      onPointerCancel={clearLongPress}
      onClick={() => {
        if (longFired.current) {
          longFired.current = false;
          return;
        }
        onClick();
      }}
      className={cn(
        'rounded-lg border text-left transition select-none touch-manipulation',
        dense ? 'min-w-0 px-1 py-1 text-[10px]' : 'px-2.5 py-1.5 text-xs',
        rarityFrame(template.rarity),
        selected && 'formation-slot-selected brightness-110',
        onField && !selected && 'opacity-80',
      )}
    >
      <span className={cn('block truncate font-medium', dense && 'leading-tight')}>
        {template.name}
      </span>
      {!dense ? (
        <span
          className={cn(
            'ml-1.5 inline-block rounded px-1 py-px font-mono text-[8px] leading-none',
            onField ? 'bg-teal-500/25 text-teal-100/90' : 'bg-muted text-muted-foreground',
          )}
        >
          {onField ? '阵' : '席'}
        </span>
      ) : null}
    </button>
  );
}

/** 九宫布阵 + 伙伴池（战前 / 伙伴页同一套交互） */
export function FormationEditor({
  player,
  setPlayer,
  pushNotice,
  compact,
  parentScroll,
  onOpenCharacter,
}: FormationEditorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [benchPanelOpen, setBenchPanelOpen] = useState(false);
  const [benchRarityFilter, setBenchRarityFilter] = useState<BenchRarityFilter>('all');
  const [introTemplate, setIntroTemplate] = useState<UnitTemplate | null>(null);
  const gridLongTimer = useRef<number | null>(null);
  const gridLongFired = useRef(false);
  const owned = UNIT_TEMPLATES.filter((t) => isOwned(player, t.id));
  const formationCount = Object.keys(player.formation).length;
  const hints = useMemo(() => formationHints(player), [player]);

  const { onFieldPartners, benchPartners } = useMemo(() => {
    const onField: UnitTemplate[] = [];
    const bench: UnitTemplate[] = [];
    for (const t of owned) {
      if (player.formation[t.id]) onField.push(t);
      else bench.push(t);
    }
    onField.sort((a, b) => a.name.localeCompare(b.name, 'zh'));
    bench.sort((a, b) => a.name.localeCompare(b.name, 'zh'));
    return { onFieldPartners: onField, benchPartners: bench };
  }, [owned, player.formation]);

  const selectedTemplate =
    selectedId != null ? UNIT_TEMPLATES.find((t) => t.id === selectedId) : undefined;
  const selectedPreferred = selectedTemplate?.preferredSlot;
  const selectedOnField = selectedId != null && player.formation[selectedId] != null;

  const applyPlacement = (slot: GridSlot) => {
    if (!selectedId) {
      pushNotice('先点选伙伴（阵上或席下），再点九宫格。');
      return;
    }
    setPlayer((p) => {
      const next = placeUnit(p, selectedId, slot);
      if (formationUnchanged(p.formation, next.formation)) {
        pushNotice('阵已满：请下阵，或与格上伙伴互换位置。');
        return p;
      }
      return next;
    });
    setSelectedId(null);
  };

  const handleOccupiedCell = (slot: GridSlot, occupantId: string) => {
    if (selectedId && selectedId !== occupantId) {
      setPlayer((p) => {
        const next = placeUnit(p, selectedId, slot);
        if (formationUnchanged(p.formation, next.formation)) {
          pushNotice('无法放入该格，请换一格或先下阵。');
          return p;
        }
        return next;
      });
      setSelectedId(null);
      return;
    }
    if (selectedId === occupantId) {
      setSelectedId(null);
      return;
    }
    setSelectedId(occupantId);
  };

  const benchSelected = () => {
    if (!selectedId || !selectedTemplate || selectedTemplate.isHero) return;
    setPlayer((p) => benchUnit(p, selectedId));
    setSelectedId(null);
  };

  const selectPartner = (id: string) => {
    setSelectedId((cur) => (cur === id ? null : id));
  };

  const selectFromBench = (id: string) => {
    setSelectedId(id);
    if (benchPartners.length > BENCH_INLINE_MAX) {
      setBenchPanelOpen(false);
    }
  };

  const benchCountByRarity = useMemo(() => {
    const counts: Record<Rarity, number> = {
      common: 0,
      uncommon: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
    };
    for (const t of benchPartners) counts[t.rarity] += 1;
    return counts;
  }, [benchPartners]);

  const filteredBench = useMemo(() => {
    if (benchRarityFilter === 'all') return benchPartners;
    return benchPartners.filter((t) => t.rarity === benchRarityFilter);
  }, [benchPartners, benchRarityFilter]);

  const benchShowGrouped = benchRarityFilter === 'all' && filteredBench.length > 0;

  const useBenchPanel = benchPartners.length > BENCH_INLINE_MAX;

  const showIntro = (templateId: string) => {
    const t = UNIT_TEMPLATES.find((u) => u.id === templateId);
    if (t) setIntroTemplate(t);
  };

  const clearGridLongPress = () => {
    if (gridLongTimer.current != null) {
      window.clearTimeout(gridLongTimer.current);
      gridLongTimer.current = null;
    }
  };

  const intro = introTemplate ? partnerIntroText(introTemplate) : null;

  return (
    <div className={cn('space-y-2', compact ? 'text-sm' : 'space-y-3')}>
      {!compact ? (
        <p className="font-mono text-[10px] text-muted-foreground">
          出战 {formationCount}/{MAX_PARTY_SIZE} · 点格子或席下伙伴调整
        </p>
      ) : null}
      {hints.missingRoleLine ? (
        <p className="font-mono text-[10px] text-amber-200/85">{hints.missingRoleLine}</p>
      ) : null}
      {!compact && hints.resonanceLine ? (
        <p className="font-mono text-[10px] text-teal-200/85">{hints.resonanceLine}</p>
      ) : null}

      {selectedTemplate ? (
        <div
          className={cn(
            'flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/40 bg-primary/10',
            compact ? 'px-2 py-1.5' : 'px-3 py-2',
          )}
        >
          <p className="text-xs leading-snug text-foreground/90">
            已选{' '}
            <span className="font-semibold text-primary">{selectedTemplate.name}</span>
            {selectedOnField ? ' · 点其他格换位 / 互换' : ' · 点空格上阵'}
          </p>
          <div className="flex shrink-0 flex-wrap gap-1.5">
            {onOpenCharacter ? (
              <button
                type="button"
                onClick={() => onOpenCharacter(selectedTemplate.id)}
                className="rounded-md border border-border bg-secondary/80 px-2 py-1 font-mono text-[10px] text-primary hover:bg-secondary"
              >
                详情
              </button>
            ) : null}
            {selectedOnField && !selectedTemplate.isHero ? (
              <button
                type="button"
                onClick={benchSelected}
                className="rounded-md border border-destructive/40 bg-destructive/15 px-2 py-1 font-mono text-[10px] text-destructive hover:bg-destructive/25"
              >
                下阵
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="rounded-md border border-border bg-secondary/80 px-2 py-1 font-mono text-[10px] text-muted-foreground hover:text-foreground"
            >
              取消
            </button>
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          'space-y-2 rounded-xl border border-teal-500/20 bg-card/40',
          compact ? 'p-2' : 'space-y-2.5 p-3',
        )}
      >
        {DISPLAY_ROWS.map(({ row, slots }) => (
          <div key={row}>
            <p className="mb-0.5 font-mono text-[9px] tracking-widest text-muted-foreground">
              {rowLabel(row)}
            </p>
            <div className="grid grid-cols-3 gap-1">
              {slots.map((slot) => {
                const id = Object.entries(player.formation).find(([, s]) => s === slot)?.[0];
                const t = id ? UNIT_TEMPLATES.find((u) => u.id === id) : undefined;
                const prog = id ? getProgress(player, id) : null;
                const recommendEmpty =
                  !id &&
                  (selectedPreferred === slot ||
                    (!selectedId && hints.preferredSlots.includes(slot)));
                const isSelected = selectedId === id;
                const isMoveTarget = Boolean(selectedId && !id);
                const isSwapTarget = Boolean(selectedId && id && selectedId !== id);
                return (
                  <button
                    key={slot}
                    type="button"
                    onPointerDown={() => {
                      if (!id) return;
                      gridLongFired.current = false;
                      clearGridLongPress();
                      gridLongTimer.current = window.setTimeout(() => {
                        gridLongFired.current = true;
                        showIntro(id);
                      }, LONG_PRESS_MS);
                    }}
                    onPointerUp={clearGridLongPress}
                    onPointerLeave={clearGridLongPress}
                    onPointerCancel={clearGridLongPress}
                    onClick={() => {
                      if (id && gridLongFired.current) {
                        gridLongFired.current = false;
                        return;
                      }
                      if (id) handleOccupiedCell(slot, id);
                      else applyPlacement(slot);
                    }}
                    className={cn(
                      'relative rounded-lg border px-1.5 py-1.5 text-left transition duration-150',
                      compact ? 'min-h-[2.85rem]' : 'min-h-[4rem] px-2 py-2',
                      id && t
                        ? cn(rarityFrame(t.rarity), 'hover:brightness-110')
                        : 'border-dashed border-border bg-muted/30 hover:border-primary/50',
                      isSelected && 'formation-slot-selected',
                      (isMoveTarget || isSwapTarget) && 'formation-slot-target',
                      recommendEmpty && !selectedId && 'border-primary/45 bg-primary/10',
                    )}
                  >
                    {isSelected ? (
                      <span className="pointer-events-none absolute -right-0.5 -top-0.5 z-[2] rounded-sm bg-primary px-1 py-px font-mono text-[8px] font-bold leading-none text-primary-foreground shadow-sm">
                        选中
                      </span>
                    ) : null}
                    {t ? (
                      <>
                        <div
                          className={cn(
                            'truncate text-xs font-medium',
                            isSelected && 'text-primary',
                          )}
                        >
                          {t.name}
                        </div>
                        {!compact ? (
                          <div className="font-mono text-[10px] text-muted-foreground">
                            {RARITY_LABELS[t.rarity]} · Lv{prog?.level ?? 1} · ★{prog?.star ?? 0}
                          </div>
                        ) : (
                          <div className="font-mono text-[9px] text-muted-foreground">
                            Lv{prog?.level ?? 1}
                          </div>
                        )}
                      </>
                    ) : (
                      <span
                        className={cn(
                          'font-mono text-[10px]',
                          isMoveTarget
                            ? 'font-semibold text-primary'
                            : 'text-muted-foreground',
                        )}
                      >
                        {isMoveTarget ? '换位' : recommendEmpty ? '荐' : slot}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {benchPartners.length > 0 ? (
        <div className="space-y-2">
          {!compact ? (
            <div>
              <p className="mb-1 font-mono text-[9px] tracking-[0.14em] text-muted-foreground">
                阵上 · {onFieldPartners.length} 人
              </p>
              <div className="flex flex-wrap gap-1.5">
                {onFieldPartners.map((t) => (
                  <PartnerChip
                    key={t.id}
                    template={t}
                    selected={selectedId === t.id}
                    onField
                    onClick={() => selectPartner(t.id)}
                    onShowIntro={() => showIntro(t.id)}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {useBenchPanel ? (
            <div className="rounded-lg border border-border/80 bg-card/50">
              <button
                type="button"
                onClick={() => setBenchPanelOpen((v) => !v)}
                className="flex w-full items-center justify-between gap-2 px-2.5 py-2 text-left"
              >
                <span className="font-mono text-[10px] text-muted-foreground">
                  席下 <span className="text-foreground">{benchPartners.length}</span> 人 ·
                  按品级换入
                </span>
                <span className="font-mono text-[10px] text-primary">
                  {benchPanelOpen ? '收起' : '展开'}
                </span>
              </button>
              {benchPanelOpen ? (
                <div className="space-y-2 border-t border-border/60 px-2.5 pb-2.5 pt-2">
                  <div className="flex gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <button
                      type="button"
                      onClick={() => setBenchRarityFilter('all')}
                      className={cn(
                        'shrink-0 rounded-md border px-2 py-1 font-mono text-[10px] transition',
                        benchRarityFilter === 'all'
                          ? 'border-primary/60 bg-primary/15 text-primary'
                          : 'border-border bg-muted/40 text-muted-foreground',
                      )}
                    >
                      全部 {benchPartners.length}
                    </button>
                    {RARITY_TIER_ORDER.map((r) =>
                      benchCountByRarity[r] > 0 ? (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setBenchRarityFilter(r)}
                          className={cn(
                            'shrink-0 rounded-md border px-2 py-1 font-mono text-[10px] transition',
                            benchRarityFilter === r
                              ? 'border-primary/60 bg-primary/15 text-primary'
                              : cn('border-border bg-muted/40 text-muted-foreground', rarityFrame(r)),
                          )}
                        >
                          {RARITY_LABELS[r]} {benchCountByRarity[r]}
                        </button>
                      ) : null,
                    )}
                  </div>
                  <p className="font-mono text-[9px] text-muted-foreground">
                    {benchRarityFilter === 'all'
                      ? '按品级分组 · 点选后点空格 · 长按看介绍'
                      : `${RARITY_LABELS[benchRarityFilter]} · ${filteredBench.length} 人 · 长按看介绍`}
                  </p>
                  <div className={cn(parentScroll ? undefined : 'max-h-[min(40dvh,320px)] overflow-y-auto overscroll-contain')}>
                    {filteredBench.length === 0 ? (
                      <p className="py-4 text-center text-xs text-muted-foreground">
                        该品级下没有伙伴
                      </p>
                    ) : benchShowGrouped ? (
                      <div className="space-y-3">
                        {RARITY_TIER_ORDER.map((r) => {
                          const group = filteredBench.filter((t) => t.rarity === r);
                          if (group.length === 0) return null;
                          return (
                            <div key={r}>
                              <p className="sticky top-0 z-[1] mb-1.5 bg-card/95 py-0.5 font-mono text-[9px] tracking-[0.12em] text-muted-foreground">
                                {RARITY_LABELS[r]} · {group.length}
                              </p>
                              <div className={BENCH_GRID_CLASS}>
                                {group.map((t) => (
                                  <PartnerChip
                                    key={t.id}
                                    template={t}
                                    selected={selectedId === t.id}
                                    onField={false}
                                    dense
                                    onClick={() => selectFromBench(t.id)}
                                    onShowIntro={() => showIntro(t.id)}
                                  />
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className={BENCH_GRID_CLASS}>
                        {filteredBench.map((t) => (
                          <PartnerChip
                            key={t.id}
                            template={t}
                            selected={selectedId === t.id}
                            onField={false}
                            dense
                            onClick={() => selectFromBench(t.id)}
                            onShowIntro={() => showIntro(t.id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="font-mono text-[9px] tracking-[0.14em] text-muted-foreground">
                席下 · {benchPartners.length} 人（按品级）
              </p>
              {RARITY_TIER_ORDER.map((r) => {
                const group = benchPartners.filter((t) => t.rarity === r);
                if (group.length === 0) return null;
                return (
                  <div key={r}>
                    <p className="mb-1 font-mono text-[9px] text-muted-foreground/90">
                      {RARITY_LABELS[r]} · {group.length}
                    </p>
                    <div className={BENCH_GRID_CLASS}>
                      {group.map((t) => (
                        <PartnerChip
                          key={t.id}
                          template={t}
                          selected={selectedId === t.id}
                          onField={false}
                          dense
                          onClick={() => selectPartner(t.id)}
                          onShowIntro={() => showIntro(t.id)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {intro ? (
        <div
          className={cn(
            'fixed inset-x-3 z-50 mx-auto max-w-lg rounded-xl border border-border/80 bg-card/95 p-3 shadow-xl backdrop-blur-sm sm:inset-x-auto sm:left-1/2 sm:w-[min(100%,24rem)] sm:-translate-x-1/2',
            compact ? 'bottom-[5.5rem]' : 'bottom-3',
          )}
          role="dialog"
          aria-label={`${intro.title}介绍`}
        >
          <div className="mb-2 flex items-start justify-between gap-2">
            <p className="font-display text-base text-primary">{intro.title}</p>
            <button
              type="button"
              onClick={() => setIntroTemplate(null)}
              className="shrink-0 font-mono text-[10px] text-muted-foreground hover:text-foreground"
            >
              关闭
            </button>
          </div>
          <div className="space-y-1 font-mono text-[11px] leading-relaxed text-foreground/90">
            {intro.lines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          <p className="mt-2 font-mono text-[9px] text-muted-foreground">长按伙伴或阵格可查看</p>
        </div>
      ) : null}
    </div>
  );
}
