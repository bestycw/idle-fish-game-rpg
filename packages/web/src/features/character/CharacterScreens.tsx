import {
  EQUIP_SLOTS,
  RARITY_LABELS,
  SLOT_NAMES,
  SLOT_SHORT_NAMES,
  UNIT_TEMPLATES,
  MAX_PARTY_SIZE,
  applyGrowthTrack,
  breakthroughLabel,
  chooseStarBranch,
  compareRosterTemplates,
  deriveGrowthStats,
  equipItem,
  getEffectAffixDef,
  getGemDef,
  getProgress,
  getSetDef,
  getSkill,
  getTemplate,
  grantCurrency,
  isOwned,
  itemsForSlot,
  jobLabel,
  levelCapForTier,
  listBreakthroughPerkRows,
  listGrowthTracks,
  listStarTrackRows,
  maxStarForTemplate,
  MORPH_DEFS,
  previewStarUp,
  previewStardustExchange,
  ratingToPct,
  respecStarBranch,
  roleLabel,
  skillDisplayFor,
  starBranchRespecCost,
  sumEquipmentBonuses,
  tryExchangeStardustForShard,
  unequipSlot,
  tryEnhance,
  enhanceCost,
  inheritEnhance,
  getChainBonus,
  getTeamChainBonus,
  socketGem,
  canSocketGem,
  reforgeT3,
  canReforgeT3,
  tryDisassemble,
  bindMorphStone,
  GEM_DEFS,
  type EquipSlot,
  type Equipment,
  type GrowthTrackId,
  type PlayerState,
  type Rarity,
  type Role,
} from '@moyu/game-core';
import { useMemo, useState } from 'react';
import { skillSpecialty } from '../shared/unitViews';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { rarityFrame, rarityFrameLocked, rarityTone } from '@/lib/tones';

type SheetTab = 'stats' | 'skill' | 'gear';

function StarRow({ star, max }: { star: number; max: number }) {
  return (
    <span className="inline-flex gap-0.5 text-sm leading-none" aria-label={`星级 ${star}`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < star ? 'text-primary' : 'text-border'}>
          ★
        </span>
      ))}
    </span>
  );
}

function itemById(player: PlayerState, id: string | undefined): Equipment | undefined {
  if (!id) return undefined;
  return player.inventory.find((e) => e.id === id);
}

function growthPct(value: number, max: number) {
  return max <= 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
}

type CharacterSheetProps = {
  player: PlayerState;
  templateId: string;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerState>>;
  onBack: () => void;
  onNotice?: (msg: string) => void;
  onGoGacha?: () => void;
};

/* ─── Equipment Action Panel ─────────────────────────────────── */

function EquipActionPanel({
  player,
  item,
  templateId,
  setPlayer,
  notice,
  showGemPicker,
  setShowGemPicker,
}: {
  player: PlayerState;
  item: Equipment;
  templateId: string;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerState>>;
  notice: (msg: string) => void;
  showGemPicker: boolean;
  setShowGemPicker: (v: boolean) => void;
}) {
  const cost = enhanceCost(item.enhanceLevel);
  const canGem = canSocketGem(player, item.id).ok;
  const canReforge = canReforgeT3(player, item.id).ok;
  const playerGems = player.gems?.filter((g) => g.count > 0) ?? [];

  const onEnhance = () => {
    setPlayer((p) => {
      const result = tryEnhance(p, item.id);
      notice(result.message);
      return result.ok ? result.state : p;
    });
  };

  const onReforge = () => {
    setPlayer((p) => {
      const result = reforgeT3(p, item.id);
      notice(result.message);
      return result.ok ? result.state : p;
    });
  };

  const onUnequip = () => {
    setPlayer((p) => unequipSlot(p, item.slot, templateId));
    notice(`已卸下 ${item.name}`);
  };

  const onInherit = () => {
    // Find another item in same slot with higher enhance level in inventory (unequipped)
    setPlayer((p) => {
      const candidates = p.inventory.filter(
        (e) => e.slot === item.slot && e.id !== item.id && e.enhanceLevel > 0,
      );
      if (candidates.length === 0) {
        notice('无可继承的同槽位装备（需有其他已强化的同槽装备）');
        return p;
      }
      // Pick highest enhance level one
      const source = candidates.sort((a, b) => b.enhanceLevel - a.enhanceLevel)[0]!;
      const r = inheritEnhance(p, source.id, item.id);
      notice(r.message);
      return r.ok ? r.state : p;
    });
  };

  const onDisassemble = () => {
    setPlayer((p) => {
      const r = tryDisassemble(p, item.id);
      notice(r.message);
      return r.ok ? r.state : p;
    });
  };

  const onSelectGem = (gemId: string) => {
    setPlayer((p) => {
      const r = socketGem(p, item.id, gemId);
      notice(r.message);
      return r.ok ? r.state : p;
    });
    setShowGemPicker(false);
  };

  return (
    <div className="mt-1 rounded-lg border border-border/60 bg-card/40 px-2 py-2 space-y-2">
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={onEnhance}
          className="rounded border border-primary/40 bg-primary/10 px-2 py-1 text-[11px] text-primary"
        >
          强化+1 ({cost.stones}石{cost.gold}金)
        </button>
        {canGem && (
          <button
            type="button"
            onClick={() => setShowGemPicker(!showGemPicker)}
            className="rounded border border-sky-400/40 bg-sky-400/10 px-2 py-1 text-[11px] text-sky-300"
          >
            镶宝石
          </button>
        )}
        {canReforge && (
          <button
            type="button"
            onClick={onReforge}
            className="rounded border border-teal-400/40 bg-teal-400/10 px-2 py-1 text-[11px] text-teal-300"
          >
            重铸T3 (8石800金)
          </button>
        )}
        <button
          type="button"
          onClick={onInherit}
          className="rounded border border-amber-400/40 bg-amber-400/10 px-2 py-1 text-[11px] text-amber-300"
        >
          继承强化
        </button>
        <button
          type="button"
          onClick={onUnequip}
          className="rounded border border-border/60 bg-card/40 px-2 py-1 text-[11px] text-muted-foreground"
        >
          卸下
        </button>
        <button
          type="button"
          onClick={onDisassemble}
          className="rounded border border-red-400/40 bg-red-400/10 px-2 py-1 text-[11px] text-red-300"
        >
          分解
        </button>
      </div>
      {showGemPicker && (
        <div className="space-y-1 rounded border border-sky-400/30 bg-card/60 p-2">
          <p className="text-[10px] text-sky-300/80">选择宝石镶嵌：</p>
          {playerGems.length === 0 ? (
            <p className="text-[10px] text-muted-foreground">无可用宝石</p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {playerGems.map((g) => {
                const def = GEM_DEFS.find((d) => d.id === g.gemId);
                if (!def) return null;
                return (
                  <button
                    key={g.gemId}
                    type="button"
                    onClick={() => onSelectGem(g.gemId)}
                    className="rounded border border-sky-400/30 bg-sky-400/5 px-1.5 py-0.5 text-[10px] text-sky-200"
                  >
                    {def.name}×{g.count} ({def.stat}+{def.value})
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Morph Stone Section ─────────────────────────────────────── */

function MorphStoneSection({
  player,
  templateId,
  setPlayer,
  notice,
  showMorphPicker,
  setShowMorphPicker,
}: {
  player: PlayerState;
  templateId: string;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerState>>;
  notice: (msg: string) => void;
  showMorphPicker: boolean;
  setShowMorphPicker: (v: boolean) => void;
}) {
  const currentMorphId = player.characterMorphs?.[templateId];
  const currentMorph = currentMorphId ? MORPH_DEFS[currentMorphId] : undefined;
  const morphStones = player.morphStones ?? [];

  if (morphStones.length === 0 && !currentMorph) return null;

  const onSelectMorph = (morphId: string) => {
    setPlayer((p) => {
      const r = bindMorphStone(p, templateId, morphId);
      notice(r.message);
      return r.ok ? r.state : p;
    });
    setShowMorphPicker(false);
  };

  return (
    <div className="mt-3 rounded-lg border border-purple-400/30 bg-card/40 px-2.5 py-2">
      <div className="flex items-center justify-between">
        <div className="text-[11px]">
          <span className="text-purple-300/90">形态石</span>
          {currentMorph ? (
            <span className="ml-1.5 text-foreground/90">
              ◆ {currentMorph.name}（{currentMorph.description}）
            </span>
          ) : (
            <span className="ml-1.5 text-muted-foreground">未绑定</span>
          )}
        </div>
        {morphStones.length > 0 && (
          <button
            type="button"
            onClick={() => setShowMorphPicker(!showMorphPicker)}
            className="rounded border border-purple-400/40 bg-purple-400/10 px-1.5 py-0.5 text-[10px] text-purple-300"
          >
            更换
          </button>
        )}
      </div>
      {showMorphPicker && (
        <div className="mt-2 space-y-1 rounded border border-purple-400/20 bg-card/60 p-2">
          <p className="text-[10px] text-purple-300/80">选择形态石绑定：</p>
          <div className="flex flex-wrap gap-1">
            {morphStones.map((morphId, idx) => {
              const def = MORPH_DEFS[morphId];
              if (!def) return null;
              return (
                <button
                  key={`${morphId}-${idx}`}
                  type="button"
                  onClick={() => onSelectMorph(morphId)}
                  className="rounded border border-purple-400/30 bg-purple-400/5 px-1.5 py-0.5 text-[10px] text-purple-200"
                >
                  {def.name}（{def.description}）
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/** 伙伴详情 · 布局 A：立绘位 + 属性/技能/装备；养成按钮在属性页 */
export function CharacterSheet({
  player,
  templateId,
  setPlayer,
  onBack,
  onNotice,
  onGoGacha,
}: CharacterSheetProps) {
  const notice = onNotice ?? (() => undefined);
  const [pickingSlot, setPickingSlot] = useState<EquipSlot | null>(null);
  const [tab, setTab] = useState<SheetTab>('stats');
  /** 升星后待选岔路星；用于高亮技能页 */
  const [focusBranchStar, setFocusBranchStar] = useState<number | null>(null);
  /** Equipment action panel: selected item */
  const [actionItemId, setActionItemId] = useState<string | null>(null);
  /** Sub-panel state for gem/morph selection */
  const [showGemPicker, setShowGemPicker] = useState(false);
  const [showMorphPicker, setShowMorphPicker] = useState(false);
  const template = getTemplate(templateId);

  const progress = template ? getProgress(player, templateId) : null;
  const derived = template && progress ? deriveGrowthStats(template, progress) : null;
  const bonus = useMemo(() => sumEquipmentBonuses(player, templateId), [player, templateId]);
  const owned = template ? isOwned(player, templateId) : false;
  const tracks = useMemo(() => listGrowthTracks(), []);
  const starPreview = useMemo(
    () => (template ? previewStarUp(player, templateId) : null),
    [player, template, templateId],
  );
  const dustExchange = useMemo(
    () => (template ? previewStardustExchange(player, templateId) : null),
    [player, template, templateId],
  );
  const starCap = maxStarForTemplate(templateId);
  const starTrackRows = useMemo(
    () =>
      listStarTrackRows(
        templateId,
        progress?.star ?? 0,
        progress?.starBranch,
      ),
    [templateId, progress?.star, progress?.starBranch],
  );
  const respecCost = useMemo(() => starBranchRespecCost(player), [player]);
  const pendingBranchStars = useMemo(
    () =>
      starTrackRows
        .filter((r) => r.unlocked && r.branches?.length && !r.chosenBranch)
        .map((r) => r.star),
    [starTrackRows],
  );
  const btRows = useMemo(
    () => listBreakthroughPerkRows(templateId, progress?.breakthroughTier ?? 0),
    [templateId, progress?.breakthroughTier],
  );
  const skillInfo = useMemo(
    () => (template ? skillDisplayFor(templateId, player) : null),
    [player, template, templateId],
  );

  if (!template || !progress || !derived) {
    return (
      <div className="space-y-3 p-2">
        <p>未找到伙伴</p>
        <button type="button" className="text-primary underline" onClick={onBack}>
          返回
        </button>
      </div>
    );
  }

  const skill = skillInfo;
  const baseSkill = getSkill(template.skillId);
  const spec = baseSkill ? skillSpecialty(baseSkill) : null;
  const cap = levelCapForTier(progress.breakthroughTier);
  const realm = breakthroughLabel(progress.breakthroughTier);
  const onField = player.formation[templateId] != null;

  const display = {
    atk: derived.atk + bonus.atk,
    def: derived.def + bonus.def,
    res: derived.res + bonus.res,
    
    maxHp: derived.maxHp + bonus.maxHp,
    spd: derived.spd + bonus.spd,
    critRating: derived.critRating + bonus.critRating,
    critDmgRating: derived.critDmgRating + bonus.critDmgRating,
    penRating: derived.penRating + bonus.penRating,
    tenacityRating: derived.tenacityRating + bonus.tenacityRating,
    masteryRating: derived.masteryRating + bonus.masteryRating,
    fortuneRating: derived.fortuneRating + bonus.fortuneRating,
    
    dodge: derived.dodge + bonus.dodge,
    lifesteal: derived.lifesteal + bonus.lifesteal,
    critResist: derived.critResist + bonus.critResist,
    block: derived.block + bonus.block,
  };

  const secondaryRows = [
    { label: '暴击', rating: display.critRating, pct: ratingToPct(display.critRating, 'critRating') },
    {
      label: '暴伤',
      rating: display.critDmgRating,
      pct: ratingToPct(display.critDmgRating, 'critDmgRating'),
    },
    { label: '穿透', rating: display.penRating, pct: ratingToPct(display.penRating, 'penRating') },
    { label: '坚韧', rating: display.tenacityRating, pct: ratingToPct(display.tenacityRating, 'tenacityRating') },
    {
      label: '精通',
      rating: display.masteryRating,
      pct: ratingToPct(display.masteryRating, 'masteryRating'),
    },
    {
      label: '气运',
      rating: display.fortuneRating,
      pct: ratingToPct(display.fortuneRating, 'fortuneRating'),
    },
  ];

  const rareRows = [
    { label: '闪避', text: `${Math.round(display.dodge * 100)}%`, active: display.dodge > 0 },
    {
      label: '吸血',
      text: `${Math.round(display.lifesteal * 100)}%`,
      active: display.lifesteal > 0,
    },
    {
      label: '抗暴',
      text: `${Math.round(display.critResist * 100)}%`,
      active: display.critResist > 0,
    },
    { label: '格挡', text: `${Math.round(display.block * 100)}%`, active: display.block > 0 },
  ];

  const candidates = pickingSlot ? itemsForSlot(player, pickingSlot) : [];

  const run = (trackId: GrowthTrackId) => {
    if (!owned) {
      notice('尚未获得，请先去召唤。');
      return;
    }
    setPlayer((p) => {
      const result = applyGrowthTrack(p, trackId, templateId);
      if (!result.ok) {
        notice(result.message);
        return p;
      }
      notice(result.message);
      if (trackId === 'star' && result.needBranch) {
        setFocusBranchStar(result.state.roster[templateId]?.star ?? null);
        setTab('skill');
      }
      return result.state;
    });
  };

  const pickBranch = (star: number, branchId: string) => {
    setPlayer((p) => {
      const progressNow = getProgress(p, templateId);
      const existing = progressNow.starBranch?.[star];
      const result = existing
        ? respecStarBranch(p, templateId, star, branchId)
        : chooseStarBranch(p, templateId, star, branchId);
      notice(result.message);
      if (result.ok) {
        setFocusBranchStar(null);
        return result.state;
      }
      return p;
    });
  };

  const openSlot = (slot: EquipSlot) => {
    if (!owned) {
      notice('未获得伙伴不可换装。');
      return;
    }
    const charEquipMap = player.characterEquip?.[templateId] ?? {};
    const list = itemsForSlot(player, slot);
    if (list.length === 0 && !charEquipMap[slot]) {
      notice(`背包里没有「${SLOT_NAMES[slot] ?? slot}」可穿。`);
      return;
    }
    setPickingSlot(slot);
    setTab('gear');
  };

  const charEquipMap = player.characterEquip?.[templateId] ?? {};

  const renderSlot = (slot: EquipSlot) => {
    const item = itemById(player, charEquipMap[slot]);
    return (
      <button
        key={slot}
        type="button"
        title={item ? item.name : SLOT_NAMES[slot]}
        onClick={() => openSlot(slot)}
        className={cn(
          'flex flex-col items-center justify-center gap-0.5 rounded-lg border bg-card/80 px-1 py-1 text-[10px]',
          'min-h-[2.5rem] w-full',
          item
            ? cn('border-solid', rarityTone(item.rarity))
            : 'border-dashed border-border text-muted-foreground',
        )}
      >
        <span className="font-mono text-[8px] text-muted-foreground">
          {SLOT_SHORT_NAMES[slot] ?? slot}
        </span>
        {item ? (
          <span className="max-w-full truncate text-[8px] leading-tight text-foreground">
            {item.enhanceLevel > 0 ? `+${item.enhanceLevel} ` : ''}
            {item.name.replace(/^(普通|精良|稀有|史诗|传说)/, '')}
          </span>
        ) : (
          <span className="text-border">+</span>
        )}
      </button>
    );
  };

  const tabs: { id: SheetTab; label: string }[] = [
    { id: 'stats', label: '属性' },
    { id: 'skill', label: '技能' },
    { id: 'gear', label: '装备' },
  ];

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-lg flex-col overflow-hidden">
      {/* 立绘主导头区 · 稀有度框色 */}
      <div
        className={cn(
          'relative shrink-0 overflow-hidden rounded-2xl border',
          rarityFrame(template.rarity),
        )}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,rgba(212,160,74,0.12),transparent_55%)]" />
        <div className="relative flex min-h-[9.5rem] flex-col justify-between p-3 sm:min-h-[10.5rem] sm:p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-mono text-[10px] tracking-[0.16em] text-primary/85">
                {realm}
                {onField ? ' · 出战中' : ''}
              </p>
              <span className="rounded border border-border/60 bg-background/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                {RARITY_LABELS[template.rarity]}
              </span>
            </div>
            <button
              type="button"
              onClick={onBack}
              className="rounded-full border border-border/70 bg-background/50 px-2.5 py-0.5 font-mono text-[11px] text-muted-foreground backdrop-blur-sm"
            >
              返回
            </button>
          </div>

          <div className="flex items-end gap-3">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-primary/40 bg-primary/15 font-display text-3xl text-primary shadow-[inset_0_0_24px_rgba(212,160,74,0.12)] sm:size-20 sm:text-4xl">
              {template.name.slice(0, 1)}
            </div>
            <div className="min-w-0 pb-0.5">
              <h2 className="font-display truncate text-2xl tracking-wide sm:text-3xl">
                {template.isHero ? '★ ' : ''}
                {template.name}
              </h2>
              <p className="mt-0.5 truncate text-xs text-muted-foreground sm:text-sm">
                {roleLabel(template.role)} · {jobLabel(template.job)}
                {spec ? ` · ${spec.label}` : ''}
                {owned ? ` · Lv ${progress.level}/${cap}` : ' · 未获得'}
              </p>
              <div className="mt-1">
                <StarRow star={progress.star} max={starCap} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab */}
      <div className="mt-2 grid shrink-0 grid-cols-3 gap-1 rounded-xl border border-border/70 bg-card/50 p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              if (t.id !== 'gear') setPickingSlot(null);
            }}
            className={cn(
              'rounded-lg py-2 text-sm transition',
              tab === t.id
                ? 'bg-primary/20 font-medium text-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
            {t.id === 'skill' && pendingBranchStars.length > 0 ? ' ·选' : ''}
          </button>
        ))}
      </div>

      {/* 内容区：整页不滚，仅必要时区内滚 */}
      <div className="mt-2 min-h-0 flex-1 overflow-hidden">
        {tab === 'stats' && (
          <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden">
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-0.5">
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    ['攻击', display.atk],
                    ['防御', display.def],
                    ['抗性', display.res],
                    ['生命', display.maxHp],
                    ['身法', display.spd],
                  ] as const
                ).map(([label, value]) => (
                  <div
                    key={label}
                    className="flex flex-col rounded-xl border border-border/70 bg-card/50 px-2.5 py-2"
                  >
                    <span className="text-[10px] text-muted-foreground">{label}</span>
                    <strong className="font-mono text-base tabular-nums leading-tight sm:text-lg">
                      {value}
                    </strong>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-1">
                {secondaryRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-baseline justify-between rounded-lg border border-border/60 bg-card/40 px-2 py-1 text-[11px]"
                  >
                    <span className="text-muted-foreground">{row.label}</span>
                    <strong className="tabular-nums">{Math.round(row.pct * 100)}%</strong>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-5 gap-1">
                {rareRows.map((row) => (
                  <div
                    key={row.label}
                    className={cn(
                      'flex flex-col items-center rounded-lg border px-1 py-1 text-[10px]',
                      row.active
                        ? 'border-border/70 bg-card/50'
                        : 'border-dashed border-border/40 text-muted-foreground/60',
                    )}
                  >
                    <span>{row.label}</span>
                    <strong className="tabular-nums">{row.text}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="shrink-0 space-y-1.5 border-t border-border/50 pt-2">
              {!owned ? (
                <div className="rounded-xl border border-dashed border-border/70 bg-card/40 px-3 py-3 text-center">
                  <p className="text-sm text-muted-foreground">未获得 · 可预览技能与职能</p>
                  <button
                    type="button"
                    onClick={() => onGoGacha?.()}
                    className="mt-2 rounded-full border border-primary/45 bg-primary/15 px-4 py-1.5 text-sm text-primary"
                  >
                    去召唤
                  </button>
                </div>
              ) : (
                <>
                {pendingBranchStars.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setFocusBranchStar(pendingBranchStars[0] ?? null);
                      setTab('skill');
                    }}
                    className="w-full rounded-xl border border-primary/45 bg-primary/15 px-3 py-2 text-left text-sm text-primary hover:brightness-110"
                  >
                    星章路线待选 · ★{pendingBranchStars.join('、★')} → 去技能页选择
                  </button>
                ) : null}
                {tracks.map((track) => {
                  const preview = track.preview(player, templateId);
                  const isStar = track.id === 'star';
                  return (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => run(track.id)}
                      className={cn(
                        'w-full rounded-xl border px-3 py-2 text-left transition',
                        isStar
                          ? 'border-primary/40 bg-primary/10 hover:brightness-110'
                          : track.id === 'breakthrough'
                            ? 'border-teal-500/30 bg-card/70 hover:border-teal-500/50'
                            : 'border-primary/30 bg-card/70 hover:border-primary/50',
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <strong
                          className={cn(
                            'font-display text-base',
                            isStar && 'text-primary',
                          )}
                        >
                          {track.label}
                        </strong>
                        <span
                          className={cn(
                            'font-mono text-[11px]',
                            isStar ? 'text-primary/80' : 'text-muted-foreground',
                          )}
                        >
                          {preview.costLine}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {preview.effectLine}
                      </p>
                      {isStar && starPreview && starPreview.costKind !== 'max' ? (
                        <>
                          <p className="mt-0.5 text-[11px] text-primary/85">
                            {starPreview.attrDiffLine
                              ? `预览 ${starPreview.attrDiffLine}`
                              : ''}
                            {starPreview.nodeLine ? ` · ${starPreview.nodeLine}` : ''}
                          </p>
                          {starPreview.isBranch && starPreview.branches?.length ? (
                            <ul className="mt-1 space-y-0.5 text-[11px] text-muted-foreground">
                              {starPreview.branches.map((b) => (
                                <li key={b.id}>
                                  <span className="text-foreground/80">{b.label}</span>
                                  {' · '}
                                  {b.effectLine}
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </>
                      ) : null}
                      <Progress
                        value={growthPct(preview.current, preview.need)}
                        className="mt-1.5 h-1"
                      />
                    </button>
                  );
                })}
                </>
              )}
              {owned && dustExchange ? (
                <button
                  type="button"
                  disabled={!dustExchange.ready}
                  onClick={() => {
                    setPlayer((p) => {
                      const r = tryExchangeStardustForShard(p, templateId);
                      notice(r.message);
                      return r.ok ? r.state : p;
                    });
                  }}
                  className={cn(
                    'w-full rounded-xl border px-3 py-2 text-left transition',
                    dustExchange.ready
                      ? 'border-amber-500/40 bg-amber-500/10 hover:brightness-110'
                      : 'cursor-not-allowed border-border/50 bg-card/30 opacity-70',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <strong className="font-display text-base text-amber-200/90">
                      星尘兑碎片
                    </strong>
                    <span className="font-mono text-[11px] text-amber-200/70">
                      {dustExchange.dustHave}/{dustExchange.dustNeed} · 今日{' '}
                      {dustExchange.exchangesToday}/{dustExchange.dailyLimit}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {dustExchange.ready
                      ? `200 星尘 → 1 同名碎片（最多助到 ★${dustExchange.assistCap}）`
                      : dustExchange.blockedReason}
                  </p>
                </button>
              ) : null}
              {owned ? (
              <details className="rounded-lg border border-border/50 bg-card/20 px-2 py-1">
                <summary className="cursor-pointer font-mono text-[10px] text-muted-foreground">
                  调试
                </summary>
                <div className="mt-1 flex flex-wrap gap-1.5 pb-1">
                  <button
                    type="button"
                    className="rounded border border-border px-2 py-0.5 text-[11px]"
                    onClick={() =>
                      setPlayer((p) => {
                        const cur = getProgress(p, templateId);
                        return {
                          ...p,
                          roster: {
                            ...p.roster,
                            [templateId]: { ...cur, exp: cur.exp + 60 },
                          },
                        };
                      })
                    }
                  >
                    +经验
                  </button>
                  <button
                    type="button"
                    className="rounded border border-border px-2 py-0.5 text-[11px]"
                    onClick={() => setPlayer((p) => grantCurrency(p, 'xiuwei', 50))}
                  >
                    +修为
                  </button>
                  <button
                    type="button"
                    className="rounded border border-border px-2 py-0.5 text-[11px]"
                    onClick={() => setPlayer((p) => grantCurrency(p, 'stardust', 20))}
                  >
                    +星尘
                  </button>
                </div>
              </details>
              ) : null}
            </div>
          </div>
        )}

        {tab === 'skill' && skill && (
          <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden">
            <div className="shrink-0 rounded-xl border border-primary/30 bg-primary/10 p-3">
              <p className="font-mono text-[10px] tracking-[0.14em] text-primary/80">
                主动 · 耗能 {skill.qiCost}
                {!owned ? ' · 预览' : ''}
              </p>
              <h3 className="font-display mt-1 text-xl">{skill.name}</h3>
              {skill.blurb ? (
                <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">{skill.blurb}</p>
              ) : null}
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                目标 {skill.targetPattern}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-foreground/90">{skill.coeffLine}</p>
              {skill.statusLine ? (
                <p className="mt-1 text-sm text-muted-foreground">{skill.statusLine}</p>
              ) : null}
              {skill.growthModLine ? (
                <p className="mt-1.5 text-sm text-primary/90">养成修正 · {skill.growthModLine}</p>
              ) : null}
              {skill.morphLine ? (
                <p className="mt-1 text-sm text-primary/90">装形态 · {skill.morphLine}</p>
              ) : null}
              {skill.followUpLine ? (
                <p className="mt-1 text-sm text-primary/90">{skill.followUpLine}</p>
              ) : null}
              {skill.nextStarDiffLine ? (
                <p className="mt-0.5 text-xs text-muted-foreground">{skill.nextStarDiffLine}</p>
              ) : skill.nextFollowUpLine ? (
                <p className="mt-0.5 text-xs text-muted-foreground">{skill.nextFollowUpLine}</p>
              ) : null}
            </div>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain rounded-xl border border-border/70 bg-card/40 p-3">
              <div>
                <p className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
                  升星轨 · ★{progress.star}/{starCap}
                </p>
                {pendingBranchStars.length > 0 ? (
                  <p className="mt-1.5 rounded-lg border border-primary/35 bg-primary/10 px-2 py-1.5 text-xs text-primary">
                    请选择星章路线：★{pendingBranchStars.join('、★')}
                  </p>
                ) : null}
                <ul className="mt-2 space-y-2 text-sm">
                  {starTrackRows.map((n) => {
                    const isBranch = Boolean(n.branches?.length);
                    const needsPick =
                      n.unlocked && isBranch && !n.chosenBranch;
                    const focused =
                      focusBranchStar === n.star ||
                      pendingBranchStars.includes(n.star);
                    return (
                      <li
                        key={n.star}
                        className={cn(
                          'rounded-lg px-1 py-0.5',
                          n.unlocked ? 'text-foreground' : 'text-muted-foreground/70',
                          focused && 'bg-primary/10 ring-1 ring-primary/30',
                        )}
                      >
                        <div className="flex gap-2">
                          <span
                            className={cn(
                              'shrink-0',
                              n.unlocked ? 'text-primary' : 'text-border',
                            )}
                          >
                            ★{n.star}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className={n.unlocked ? '' : 'opacity-80'}>
                              {n.label}
                              {isBranch && !n.unlocked ? ' · 岔路' : ''}
                            </span>
                            {!isBranch || (n.unlocked && n.chosenBranch) ? (
                              <span className="mt-0.5 block font-mono text-[11px] text-muted-foreground">
                                {n.effectLine}
                                {!n.unlocked ? ' · 未点亮' : ''}
                              </span>
                            ) : null}
                            {needsPick ? (
                              <span className="mt-0.5 block text-[11px] text-primary">
                                请选择一条星章路线
                              </span>
                            ) : null}
                          </span>
                        </div>
                        {isBranch && n.branches ? (
                          <div className="mt-1.5 ml-6 space-y-1">
                            {n.branches.map((b) => {
                              const chosen = n.chosenBranch === b.id;
                              const locked = !n.unlocked;
                              const canPick =
                                n.unlocked && !chosen && owned;
                              const respecLabel =
                                respecCost === 0
                                  ? '今日首次免费'
                                  : `${respecCost} 星尘`;
                              return (
                                <button
                                  key={b.id}
                                  type="button"
                                  disabled={!canPick}
                                  onClick={() => pickBranch(n.star, b.id)}
                                  className={cn(
                                    'w-full rounded-lg border px-2 py-1.5 text-left text-[12px] transition',
                                    chosen
                                      ? 'border-primary/50 bg-primary/15 text-foreground'
                                      : locked
                                        ? 'cursor-default border-border/40 bg-transparent text-muted-foreground/60'
                                        : n.chosenBranch
                                          ? 'border-border/60 bg-card/30 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                                          : 'border-primary/35 bg-primary/5 text-foreground hover:bg-primary/10',
                                    !canPick && !chosen && 'opacity-70',
                                  )}
                                >
                                  <span className="font-medium">
                                    {chosen ? '✓ ' : ''}
                                    {b.label}
                                  </span>
                                  <span className="mt-0.5 block font-mono text-[11px] text-muted-foreground">
                                    {b.effectLine}
                                  </span>
                                  {n.unlocked && n.chosenBranch && !chosen ? (
                                    <span className="mt-0.5 block text-[10px] text-amber-200/80">
                                      重洗 · {respecLabel}
                                    </span>
                                  ) : null}
                                  {needsPick && canPick ? (
                                    <span className="mt-0.5 block text-[10px] text-primary">
                                      点选此支
                                    </span>
                                  ) : null}
                                </button>
                              );
                            })}
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div className="border-t border-border/50 pt-2">
                <p className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
                  破境被动 · {realm}
                </p>
                {btRows.unlocked.length > 0 ? (
                  <ul className="mt-2 space-y-1.5 text-sm">
                    {btRows.unlocked.map((p) => (
                      <li key={`${p.tier}-${p.label}`} className="flex gap-2">
                        <span className="shrink-0 text-teal-400/90">境{p.tier}</span>
                        <span>
                          {p.label}
                          <span className="mt-0.5 block font-mono text-[11px] text-muted-foreground">
                            {p.effectLine}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">破境后解锁被动</p>
                )}
                {btRows.next ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    下一境 · {btRows.next.label}
                    {btRows.next.effectLine ? ` · ${btRows.next.effectLine}` : ''}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        )}

        {tab === 'gear' && (
          <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden">
            <p className="shrink-0 text-[11px] text-muted-foreground">
              {template.name} 装备 · 点槽换装
              {(() => {
                const morphId = player.characterMorphs?.[templateId];
                const morphDef = morphId ? MORPH_DEFS[morphId] : undefined;
                return morphDef ? ` · 形态石·${morphDef.name}` : '';
              })()}
              {(() => {
                const chain = getChainBonus(player, templateId);
                const teamChain = getTeamChainBonus(player);
                const parts: string[] = [];
                if (chain.level > 0) parts.push(`连锁Lv${chain.level}(+${Math.round(chain.bonus * 100)}%)`);
                if (teamChain.level > 0) parts.push(`全队连锁Lv${teamChain.level}(+${Math.round(teamChain.bonus * 100)}%)`);
                return parts.length > 0 ? ` · ${parts.join(' · ')}` : '';
              })()}
            </p>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {/* 10-slot layout: 2 columns of 5 */}
              <div className="grid grid-cols-2 gap-1.5">
                <div className="flex flex-col gap-1">
                  {(['weapon', 'offhand', 'hands', 'neck', 'ring'] as EquipSlot[]).map((s) => renderSlot(s))}
                </div>
                <div className="flex flex-col gap-1">
                  {(['head', 'chest', 'feet', 'back', 'trinket'] as EquipSlot[]).map((s) => renderSlot(s))}
                </div>
              </div>

              {/* Equipped item detail */}
              {!pickingSlot && (() => {
                const equippedItems = EQUIP_SLOTS
                  .map((s) => charEquipMap[s] ? itemById(player, charEquipMap[s]) : undefined)
                  .filter(Boolean) as Equipment[];
                if (equippedItems.length === 0) return (
                  <p className="mt-3 text-center text-sm text-muted-foreground">尚未穿戴装备</p>
                );
                return (
                  <div className="mt-3 space-y-2">
                    {equippedItems.map((item) => {
                      const setDef = item.setId ? getSetDef(item.setId) : undefined;
                      const effectDef1 = item.effectAffixId ? getEffectAffixDef(item.effectAffixId) : undefined;
                      const effectDef2 = item.effectAffixId2 ? getEffectAffixDef(item.effectAffixId2) : undefined;
                      const gemDef = item.gemId ? getGemDef(item.gemId) : undefined;
                      const isSelected = actionItemId === item.id;
                      return (
                        <div key={item.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setActionItemId(isSelected ? null : item.id);
                              setShowGemPicker(false);
                              setShowMorphPicker(false);
                            }}
                            className={cn(
                              'w-full rounded-lg border bg-card/60 px-2.5 py-1.5 text-left',
                              rarityTone(item.rarity),
                              isSelected && 'ring-1 ring-primary/50',
                            )}
                          >
                            <div className="flex items-baseline justify-between gap-1">
                              <strong className="text-xs">
                                {item.enhanceLevel > 0 ? `+${item.enhanceLevel} ` : ''}{item.name}
                              </strong>
                              <span className="text-[10px] text-muted-foreground">{SLOT_NAMES[item.slot]}</span>
                            </div>
                            {/* baseStats */}
                            <div className="mt-0.5 font-mono text-[10px] text-foreground/80">
                              {Object.entries(item.baseStats).map(([k, v]) => `${k === 'maxHp' ? 'HP' : k.toUpperCase()} +${v}`).join(' · ')}
                            </div>
                            {/* affixes */}
                            {item.affixes.length > 0 && (
                              <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                                {item.affixes.map((a) => `${a.name}+${a.value}`).join(' · ')}
                              </div>
                            )}
                            {/* rareAffixes */}
                            {item.rareAffixes && item.rareAffixes.length > 0 && (
                              <div className="mt-0.5 font-mono text-[10px] text-amber-300/90">
                                {item.rareAffixes.map((a) => `${a.name}+${Math.round(a.value * 100)}%`).join(' · ')}
                              </div>
                            )}
                            {/* T3 effects */}
                            {effectDef1 && (
                              <div className="mt-0.5 text-[10px] text-teal-300/90">
                                T3·{effectDef1.name}：{effectDef1.description}
                              </div>
                            )}
                            {effectDef2 && (
                              <div className="mt-0.5 text-[10px] text-teal-300/90">
                                T3·{effectDef2.name}：{effectDef2.description}
                              </div>
                            )}
                            {/* gem */}
                            {item.socketCount > 0 && (
                              <div className="mt-0.5 text-[10px] text-sky-300/80">
                                {gemDef ? `宝石·${gemDef.name}（${gemDef.stat} +${gemDef.value}）` : '空孔×1'}
                              </div>
                            )}
                            {/* set */}
                            {setDef && (
                              <div className="mt-0.5 text-[10px] text-primary/80">
                                套装·{setDef.name}
                              </div>
                            )}
                          </button>
                          {/* Action panel */}
                          {isSelected && (
                            <EquipActionPanel
                              player={player}
                              item={item}
                              templateId={templateId}
                              setPlayer={setPlayer}
                              notice={notice}
                              showGemPicker={showGemPicker}
                              setShowGemPicker={setShowGemPicker}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* T4 Morph stone section */}
              {!pickingSlot && (
                <MorphStoneSection
                  player={player}
                  templateId={templateId}
                  setPlayer={setPlayer}
                  notice={notice}
                  showMorphPicker={showMorphPicker}
                  setShowMorphPicker={setShowMorphPicker}
                />
              )}
            </div>

            {pickingSlot && (
              <div className="flex min-h-0 max-h-[38%] flex-col overflow-hidden rounded-xl border border-primary/30 bg-card/80">
                <div className="flex shrink-0 items-center justify-between border-b border-border/50 px-3 py-2">
                  <p className="text-sm font-medium">更换 · {SLOT_NAMES[pickingSlot]}</p>
                  <button
                    type="button"
                    className="font-mono text-[11px] text-muted-foreground"
                    onClick={() => setPickingSlot(null)}
                  >
                    关闭
                  </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
                  {charEquipMap[pickingSlot] ? (
                    <button
                      type="button"
                      className="mb-2 w-full rounded-lg border border-border py-1.5 text-sm"
                      onClick={() => {
                        setPlayer((p) => unequipSlot(p, pickingSlot, templateId));
                        setPickingSlot(null);
                      }}
                    >
                      卸下
                    </button>
                  ) : null}
                  {candidates.length === 0 ? (
                    <p className="px-1 text-sm text-muted-foreground">该部位暂无装备</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {candidates.map((item) => {
                        const worn = charEquipMap[pickingSlot] === item.id;
                        return (
                          <li key={item.id}>
                            <button
                              type="button"
                              className={cn(
                                'flex w-full flex-col items-start gap-0.5 rounded-lg border bg-background/40 px-2.5 py-1.5 text-left',
                                rarityTone(item.rarity),
                                worn && 'border-primary bg-primary/10',
                              )}
                              onClick={() => {
                                setPlayer((p) => equipItem(p, item.id, templateId));
                                setPickingSlot(null);
                                notice(`已穿戴 ${item.name}`);
                              }}
                            >
                              <strong className="text-sm">
                                {item.enhanceLevel > 0 ? `+${item.enhanceLevel} ` : ''}
                                {item.name}
                                {worn ? ' · 已穿' : ''}
                              </strong>
                              <span className="text-[11px] text-muted-foreground">
                                {Object.entries(item.baseStats).map(([k, v]) => `${k === 'maxHp' ? 'HP' : k.toUpperCase()}+${v}`).join(' ')}
                                {item.affixes.length > 0 ? ' · ' + item.affixes.map((a) => `${a.name}+${a.value}`).join(' ') : ''}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

type CharacterListProps = {
  player: PlayerState;
  onOpen: (templateId: string) => void;
  onOpenFormation: () => void;
  onNotice?: (msg: string) => void;
};

/** 伙伴列表：全池 + 筛选排序 · 未有可只读预览 */
export function CharacterList({
  player,
  onOpen,
  onOpenFormation,
  onNotice,
}: CharacterListProps) {
  const notice = onNotice ?? (() => undefined);
  const [ownFilter, setOwnFilter] = useState<'all' | 'owned' | 'missing'>('all');
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all');
  const [rarityFilter, setRarityFilter] = useState<Rarity | 'all'>('all');

  const roster = useMemo(() => {
    let list = [...UNIT_TEMPLATES];
    if (ownFilter === 'owned') list = list.filter((t) => isOwned(player, t.id));
    if (ownFilter === 'missing') list = list.filter((t) => !isOwned(player, t.id));
    if (roleFilter !== 'all') list = list.filter((t) => t.role === roleFilter);
    if (rarityFilter !== 'all') list = list.filter((t) => t.rarity === rarityFilter);
    list.sort((a, b) => compareRosterTemplates(a, b, player));
    return list;
  }, [player, ownFilter, roleFilter, rarityFilter]);

  const ownedCount = UNIT_TEMPLATES.filter((t) => isOwned(player, t.id)).length;
  const formationCount = Object.keys(player.formation).length;

  const rolesInPool = useMemo(() => {
    const set = new Set(UNIT_TEMPLATES.map((t) => t.role));
    return [...set];
  }, []);

  return (
    <div className="space-y-4 pb-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] tracking-[0.18em] text-primary/80">伙伴</p>
          <h2 className="font-display mt-1 text-2xl tracking-wide">全员一览</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            全池 {UNIT_TEMPLATES.length} · 已拥有 {ownedCount}
            {ownedCount < UNIT_TEMPLATES.length ? '（灰卡可预览，召唤/通关解锁）' : ''}
            {' · '}修为 {player.currencies?.xiuwei ?? 0} · 星尘 {player.currencies?.stardust ?? 0}
          </p>
        </div>
        <div className="mt-1 flex shrink-0 flex-col items-end gap-1.5 sm:flex-row">
          <button
            type="button"
            onClick={() => notice('图鉴后置：将按职能与遭遇收录。')}
            className="rounded-full border border-dashed border-border/80 px-3 py-1.5 text-sm text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
          >
            图鉴
          </button>
          <button
            type="button"
            onClick={onOpenFormation}
            className="rounded-full border border-primary/45 bg-primary/15 px-3.5 py-1.5 text-sm text-primary transition hover:brightness-110"
          >
            布阵
            <span className="ml-1.5 font-mono text-[10px] text-primary/75">
              {formationCount}/{MAX_PARTY_SIZE}
            </span>
          </button>
        </div>
      </header>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ['all', '全部'],
              ['owned', '已有'],
              ['missing', '未获得'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setOwnFilter(id)}
              className={cn(
                'rounded-full border px-2.5 py-1 font-mono text-[11px] transition',
                ownFilter === id
                  ? 'border-primary/50 bg-primary/15 text-primary'
                  : 'border-border/70 text-muted-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setRoleFilter('all')}
            className={cn(
              'rounded-full border px-2.5 py-1 font-mono text-[11px]',
              roleFilter === 'all'
                ? 'border-primary/50 bg-primary/15 text-primary'
                : 'border-border/70 text-muted-foreground',
            )}
          >
            职能
          </button>
          {rolesInPool.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setRoleFilter(role)}
              className={cn(
                'rounded-full border px-2.5 py-1 font-mono text-[11px]',
                roleFilter === role
                  ? 'border-primary/50 bg-primary/15 text-primary'
                  : 'border-border/70 text-muted-foreground',
              )}
            >
              {roleLabel(role)}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setRarityFilter('all')}
            className={cn(
              'rounded-full border px-2.5 py-1 font-mono text-[11px]',
              rarityFilter === 'all'
                ? 'border-primary/50 bg-primary/15 text-primary'
                : 'border-border/70 text-muted-foreground',
            )}
          >
            稀有度
          </button>
          {(['legendary', 'epic', 'rare', 'common'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRarityFilter(r)}
              className={cn(
                'rounded-full border px-2.5 py-1 font-mono text-[11px]',
                rarityFilter === r
                  ? 'border-primary/50 bg-primary/15 text-primary'
                  : 'border-border/70 text-muted-foreground',
              )}
            >
              {RARITY_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {roster.map((t) => {
          const owned = isOwned(player, t.id);
          const progress = getProgress(player, t.id);
          const onField = player.formation[t.id] != null;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onOpen(t.id)}
              className={cn(
                'relative overflow-hidden rounded-2xl border p-3 text-left transition',
                rarityFrame(t.rarity),
                !owned && rarityFrameLocked(t.rarity),
                'hover:brightness-110',
              )}
            >
              {owned && onField ? (
                <span className="absolute right-2 top-2 rounded bg-primary/20 px-1.5 py-0.5 font-mono text-[9px] text-primary">
                  出战
                </span>
              ) : null}
              {!owned ? (
                <span className="absolute right-2 top-2 rounded bg-muted/80 px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
                  预览
                </span>
              ) : (
                <span className="absolute left-2 top-2 rounded bg-background/50 px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
                  {RARITY_LABELS[t.rarity]}
                </span>
              )}
              <div
                className={cn(
                  'mb-3 mt-4 flex size-12 items-center justify-center rounded-full border font-display text-lg',
                  owned
                    ? 'border-primary/30 bg-primary/10 text-primary'
                    : 'border-border/60 bg-muted/40 text-muted-foreground',
                )}
              >
                {t.name.slice(0, 1)}
              </div>
              <div className="font-display text-base leading-tight">
                {t.isHero ? '★ ' : ''}
                {t.name}
              </div>
              <div className="mt-1 font-mono text-[10px] text-muted-foreground">
                {owned
                  ? `Lv${progress.level} · ${breakthroughLabel(progress.breakthroughTier)}`
                  : `${roleLabel(t.role)} · ${jobLabel(t.job)}`}
              </div>
              {owned ? (
                <div className="mt-1">
                  <StarRow star={progress.star} max={maxStarForTemplate(t.id)} />
                </div>
              ) : (
                <p className="mt-1 text-[10px] text-muted-foreground/80">
                  {RARITY_LABELS[t.rarity]} · 点开预览
                </p>
              )}
            </button>
          );
        })}
      </div>
      {roster.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">没有符合筛选的伙伴</p>
      ) : null}
    </div>
  );
}
