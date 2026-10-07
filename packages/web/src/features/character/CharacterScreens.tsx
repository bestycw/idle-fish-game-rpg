import {
  EQUIP_SLOTS,
  RARITY_LABELS,
  SLOT_NAMES,
  SLOT_SHORT_NAMES,
  UNIT_TEMPLATES,
  MAX_PARTY_SIZE,
  applyGrowthTrack,
  levelUpWithExpPills,
  previewPillLevelUp,
  expToNextLevel,
  autoEquipBest,
  bagCellSignature,
  breakthroughLabel,
  chooseStarBranch,
  compareRosterTemplates,
  deriveGrowthStats,
  countEquippedSets,
  equipItem,
  getProgress,
  getSkill,
  getTemplate,
  grantCurrency,
  isOwned,
  itemsForSlot,
  wearBlockedReason,
  levelCapForTier,
  listBreakthroughPerkRows,
  listGrowthTracks,
  listStarTrackRows,
  maxStarForTemplate,
  CULTIVATION_NODES_PER_TIER,
  MORPH_DEFS,
  previewStardustExchange,
  ratingToPct,
  respecStarBranch,
  roleLabel,
  skillDisplayFor,
  starBranchRespecCost,
  sumEquipmentBonuses,
  tryExchangeStardustForShard,
  unequipSlot,
  bindMorphStone,
  isItemUnseen,
  itemPower,
  characterPower,
  characterIntro,
  bondsFor,
  CIRCLE_LABELS,
  getZhongtuEntry,
  markItemSeen,
  previewLoadout,
  resolveSetId,
  type EquipSlot,
  type Equipment,
  type GrowthTrackId,
  type PlayerState,
  type Rarity,
  type Role,
} from '@moyu/game-core';
import { useMemo, useState, type ReactNode } from 'react';
import { Popover } from 'radix-ui';
import { skillSpecialty } from '../shared/unitViews';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { rarityFrame, rarityFrameLocked, rarityNameTone } from '@/lib/tones';
import { EquipTooltip } from '../inventory/EquipTooltip';
import { EquipPopoverContent } from '../inventory/EquipPopoverContent';
import { EquipBagCell } from '../inventory/EquipBagCell';
import { RealmMeridian } from './RealmMeridian';
import { SkillManual } from './SkillManual';
import { TermLabel } from '../shared/TermGloss';

type SheetTab = 'stats' | 'realm' | 'skill' | 'gear';

/** 人物卡：上身甲、中属性、下武器戒饰，格子一样大 */
const GEAR_BODY: EquipSlot[] = ['head', 'neck', 'chest', 'hands', 'legs', 'feet'];
const GEAR_BOTTOM: EquipSlot[] = ['ring1', 'ring2', 'weapon', 'offhand', 'trinket1', 'trinket2'];

function slotPopupPlacement(slot: EquipSlot): {
  side: 'top' | 'bottom' | 'left' | 'right';
  align: 'start' | 'center' | 'end';
} {
  const body = GEAR_BODY.indexOf(slot);
  if (body >= 0) {
    return { side: body < 3 ? 'right' : 'left', align: 'center' };
  }
  return { side: 'top', align: 'center' };
}

function slotEdge(rarity: Equipment['rarity']): string {
  if (rarity === 'legendary') return 'border-amber-400/80 bg-amber-500/12';
  if (rarity === 'epic') return 'border-fuchsia-400/70 bg-fuchsia-500/10';
  if (rarity === 'rare') return 'border-sky-400/70 bg-sky-500/10';
  if (rarity === 'uncommon') return 'border-emerald-400/65 bg-emerald-500/10';
  return 'border-border bg-card/80';
}

function signedInt(n: number): string | null {
  const r = Math.round(n);
  if (r === 0) return null;
  return r > 0 ? `+${r}` : `${r}`;
}

function signedPctPoints(n: number): string | null {
  if (Math.abs(n) < 0.0005) return null;
  const v = n * 100;
  const t = Math.abs(v) >= 10 ? v.toFixed(0) : v.toFixed(1);
  return n > 0 ? `+${t}%` : `${t}%`;
}

function DeltaMark({ text }: { text: string | null }) {
  if (!text) return null;
  const up = text.startsWith('+');
  return (
    <span className={cn('font-mono text-[9px] tabular-nums', up ? 'text-emerald-400' : 'text-rose-400')}>
      {text}
    </span>
  );
}

function GearStatStrip({
  mains,
  ratings,
  rares,
}: {
  mains: { label: string; value: number; delta: number }[];
  ratings: { label: string; pct: number; deltaPct: number }[];
  rares: { label: string; text: string; active: boolean; delta: string | null }[];
}) {
  const rareShown = rares.filter((row) => row.active || row.delta);
  return (
    <div className="flex flex-col justify-center gap-2.5 px-3 py-3">
      <div className="grid grid-cols-2 gap-x-6 gap-y-2">
        {mains.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-2 leading-none">
            <span className="text-[11px] text-muted-foreground">{row.label}</span>
            <span className="flex items-baseline gap-1">
              <strong className="font-mono text-base tabular-nums">{row.value}</strong>
              <DeltaMark text={signedInt(row.delta)} />
            </span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-x-3 gap-y-1.5 border-t border-border/40 pt-2.5">
        {ratings.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-1 leading-none">
            <TermLabel label={row.label} className="text-[10px] text-muted-foreground" />
            <span className="flex items-baseline gap-0.5">
              <strong className="font-mono text-[12px] tabular-nums">
                {Math.round(row.pct * 100)}%
              </strong>
              <DeltaMark text={signedPctPoints(row.deltaPct)} />
            </span>
          </div>
        ))}
      </div>
      {rareShown.length > 0 ? (
        <div className="border-t border-dashed border-amber-700/35 pt-2">
          <p className="mb-1 text-[9px] tracking-wide text-amber-200/45">稀有</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {rareShown.map((row) => (
              <span key={row.label} className="inline-flex items-baseline gap-1 text-[10px]">
                <TermLabel label={row.label} className="text-amber-200/70" />
                <strong className="font-mono tabular-nums">{row.text}</strong>
                <DeltaMark text={row.delta} />
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

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
  const [previewItemId, setPreviewItemId] = useState<string | null>(null);
  const [slotPopup, setSlotPopup] = useState(false);
  const [tab, setTab] = useState<SheetTab>('stats');
  const [focusBranchStar, setFocusBranchStar] = useState<number | null>(null);
  const [showMorphPicker, setShowMorphPicker] = useState(false);
  const template = getTemplate(templateId);

  const progress = template ? getProgress(player, templateId) : null;
  const derived = template && progress ? deriveGrowthStats(template, progress) : null;
  const bonus = useMemo(() => sumEquipmentBonuses(player, templateId), [player, templateId]);
  const liveBonus = useMemo(() => {
    if (!pickingSlot || !previewItemId) return bonus;
    return sumEquipmentBonuses(
      previewLoadout(player, templateId, { [pickingSlot]: previewItemId }),
      templateId,
    );
  }, [bonus, pickingSlot, previewItemId, player, templateId]);
  const owned = template ? isOwned(player, templateId) : false;
  const tracks = useMemo(() => listGrowthTracks(), []);
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
        .filter((r) => r.unlocked && r.branches?.length && !r.chosenBranch && !r.followsIdentity)
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
  const nodes = progress.cultivationNodes ?? 0;
  const levelTrack = tracks.find((t) => t.id === 'level');
  const starTrack = tracks.find((t) => t.id === 'star');
  const levelPrev = levelTrack?.preview(player, templateId);
  const cultivatePrev = tracks.find((t) => t.id === 'cultivate')?.preview(player, templateId);
  const btPrev = tracks.find((t) => t.id === 'breakthrough')?.preview(player, templateId);
  const starPrev = starTrack?.preview(player, templateId);
  const realmHint =
    nodes >= CULTIVATION_NODES_PER_TIER
      ? (btPrev?.costLine ?? '可破境')
      : (cultivatePrev?.costLine ?? `小节点 ${nodes}/${CULTIVATION_NODES_PER_TIER}`);
  const onField = player.formation[templateId] != null;
  const intro = characterIntro(templateId);

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
    counter: derived.counter + bonus.counter,
    echo: derived.echo + bonus.echo,
    qiSiphon: bonus.qiSiphon,
    qiRefund: bonus.qiRefund,
  };

  const liveDisplay = {
    atk: derived.atk + liveBonus.atk,
    def: derived.def + liveBonus.def,
    res: derived.res + liveBonus.res,
    maxHp: derived.maxHp + liveBonus.maxHp,
    spd: derived.spd + liveBonus.spd,
    critRating: derived.critRating + liveBonus.critRating,
    critDmgRating: derived.critDmgRating + liveBonus.critDmgRating,
    penRating: derived.penRating + liveBonus.penRating,
    tenacityRating: derived.tenacityRating + liveBonus.tenacityRating,
    masteryRating: derived.masteryRating + liveBonus.masteryRating,
    fortuneRating: derived.fortuneRating + liveBonus.fortuneRating,
    dodge: derived.dodge + liveBonus.dodge,
    lifesteal: derived.lifesteal + liveBonus.lifesteal,
    critResist: derived.critResist + liveBonus.critResist,
    block: derived.block + liveBonus.block,
    counter: derived.counter + liveBonus.counter,
    echo: derived.echo + liveBonus.echo,
    qiSiphon: liveBonus.qiSiphon,
    qiRefund: liveBonus.qiRefund,
  };

  const gearMains = [
    { label: '攻击', value: liveDisplay.atk, delta: liveDisplay.atk - display.atk },
    { label: '防御', value: liveDisplay.def, delta: liveDisplay.def - display.def },
    { label: '抗性', value: liveDisplay.res, delta: liveDisplay.res - display.res },
    { label: '生命', value: liveDisplay.maxHp, delta: liveDisplay.maxHp - display.maxHp },
    { label: '身法', value: liveDisplay.spd, delta: liveDisplay.spd - display.spd },
  ];

  const gearRatings = (
    [
      ['暴击', 'critRating'],
      ['暴伤', 'critDmgRating'],
      ['穿透', 'penRating'],
      ['坚韧', 'tenacityRating'],
      ['精通', 'masteryRating'],
    ] as const
  ).map(([label, key]) => {
    const cur = ratingToPct(display[key], key);
    const live = ratingToPct(liveDisplay[key], key);
    return { label, pct: live, deltaPct: live - cur };
  });

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
  ];

  const fortunePct = ratingToPct(liveDisplay.fortuneRating, 'fortuneRating');
  const fortuneCur = ratingToPct(display.fortuneRating, 'fortuneRating');
  const rareRows = [
    {
      label: '格挡',
      text: `${Math.round(liveDisplay.block * 100)}%`,
      active: liveDisplay.block > 0,
      delta: signedPctPoints(liveDisplay.block - display.block),
    },
    {
      label: '闪避',
      text: `${Math.round(liveDisplay.dodge * 100)}%`,
      active: liveDisplay.dodge > 0,
      delta: signedPctPoints(liveDisplay.dodge - display.dodge),
    },
    {
      label: '吸血',
      text: `${Math.round(liveDisplay.lifesteal * 100)}%`,
      active: liveDisplay.lifesteal > 0,
      delta: signedPctPoints(liveDisplay.lifesteal - display.lifesteal),
    },
    {
      label: '回响',
      text: `${Math.round(liveDisplay.echo * 100)}%`,
      active: liveDisplay.echo > 0,
      delta: signedPctPoints(liveDisplay.echo - display.echo),
    },
    {
      label: '锁息',
      text: `${liveDisplay.qiSiphon}`,
      active: liveDisplay.qiSiphon > 0,
      delta: signedInt(liveDisplay.qiSiphon - display.qiSiphon),
    },
    {
      label: '抗暴',
      text: `${Math.round(liveDisplay.critResist * 100)}%`,
      active: liveDisplay.critResist > 0,
      delta: signedPctPoints(liveDisplay.critResist - display.critResist),
    },
    {
      label: '反击',
      text: `${Math.round(liveDisplay.counter * 100)}%`,
      active: liveDisplay.counter > 0,
      delta: signedPctPoints(liveDisplay.counter - display.counter),
    },
    {
      label: '回元',
      text: `${liveDisplay.qiRefund}`,
      active: liveDisplay.qiRefund > 0,
      delta: signedInt(liveDisplay.qiRefund - display.qiRefund),
    },
    {
      label: '气运',
      text: `${Math.round(fortunePct * 100)}%`,
      active: true,
      delta: signedPctPoints(fortunePct - fortuneCur),
    },
  ];

  const basePower = characterPower(player, templateId);
  const previewPower =
    pickingSlot && previewItemId
      ? characterPower(
          previewLoadout(player, templateId, { [pickingSlot]: previewItemId }),
          templateId,
        )
      : basePower;

  const candidates = pickingSlot
    ? [...itemsForSlot(player, pickingSlot, templateId)].sort((a, b) => {
        const blockedA = wearBlockedReason(a, progress.breakthroughTier) ? 1 : 0;
        const blockedB = wearBlockedReason(b, progress.breakthroughTier) ? 1 : 0;
        if (blockedA !== blockedB) return blockedA - blockedB;
        return itemPower(b) - itemPower(a);
      })
    : [];

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
      const existing = progressNow.starBranch?.[3] ?? progressNow.starBranch?.[star];
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
    const map = player.characterEquip?.[templateId] ?? {};
    const list = itemsForSlot(player, slot, templateId);
    setTab('gear');
    setShowMorphPicker(false);
    if (pickingSlot === slot && map[slot]) {
      setPreviewItemId(null);
      setSlotPopup((v) => !v);
      return;
    }
    if (!map[slot] && list.length === 0) {
      notice(`背包里没有「${SLOT_NAMES[slot] ?? slot}」可穿。`);
      setPickingSlot(null);
      setSlotPopup(false);
      setPreviewItemId(null);
      return;
    }
    if (map[slot]) setPlayer((p) => markItemSeen(p, map[slot]!));
    setPickingSlot(slot);
    setPreviewItemId(null);
    setSlotPopup(Boolean(map[slot]));
  };

  const runAutoEquip = () => {
    setPlayer((p) => {
      const r = autoEquipBest(p, templateId);
      notice(
        r.changed > 0
          ? `已换上 ${r.changed} 件更高战力`
          : '当前可穿已是最优（不抢别人身上的）',
      );
      return r.state;
    });
    setPickingSlot(null);
    setPreviewItemId(null);
    setSlotPopup(false);
  };

  const charEquipMap = player.characterEquip?.[templateId] ?? {};
  const pickingSlotWorn =
    pickingSlot ? itemById(player, charEquipMap[pickingSlot]) : undefined;

  const renderSlot = (slot: EquipSlot) => {
    const item = itemById(player, charEquipMap[slot]);
    const signature = item ? bagCellSignature(item) : '';
    const active = pickingSlot === slot;
    const placement = slotPopupPlacement(slot);
    const slotBtn = (
      <button
        type="button"
        title={item ? item.name : SLOT_NAMES[slot]}
        onClick={() => openSlot(slot)}
        className={cn(
          'relative flex aspect-square w-full min-w-0 flex-col items-center justify-center overflow-hidden rounded-md border px-0.5',
          item ? slotEdge(item.rarity) : 'border-dashed border-border/70 bg-background/50 text-muted-foreground',
          active && 'border-primary/30',
        )}
      >
        {active ? (
          <svg
            className="pointer-events-none absolute inset-0 z-[2] h-full w-full overflow-visible"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden
          >
            <rect
              className="gear-slot-dash"
              x="1.6"
              y="1.6"
              width="96.8"
              height="96.8"
              rx="6"
              fill="none"
              stroke="rgb(226 160 74)"
              strokeWidth="2.2"
              strokeDasharray="6 5"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        ) : null}
        {item && isItemUnseen(player, item.id) ? (
          <span className="absolute right-0 top-0 z-10 rounded-bl bg-rose-500 px-1 py-0.5 font-mono text-[9px] font-bold leading-none text-white">
            新
          </span>
        ) : null}
        <span className="font-mono text-[11px] leading-none text-muted-foreground">
          {SLOT_SHORT_NAMES[slot] ?? slot}
        </span>
        {item ? (
          <span className={cn('max-w-full truncate text-[12px] leading-tight', rarityNameTone(item.rarity))}>
            {item.enhanceLevel > 0 ? `+${item.enhanceLevel} ` : ''}
            {signature || item.name.replace(/^(普通|精良|稀有|史诗|传说)/, '')}
          </span>
        ) : (
          <span className="font-display text-3xl leading-none text-muted-foreground/70">+</span>
        )}
        {item ? (
          <span className="font-mono text-[11px] tabular-nums text-primary/90">{itemPower(item)}</span>
        ) : null}
      </button>
    );

    if (!item) return <div key={slot} className="min-w-0 w-full">{slotBtn}</div>;

    const setKey = item.setId ? (resolveSetId(item.setId) ?? item.setId) : undefined;
    const equippedItems = EQUIP_SLOTS
      .map((s) => (charEquipMap[s] ? itemById(player, charEquipMap[s]) : undefined))
      .filter(Boolean) as Equipment[];
    const setCounts = countEquippedSets(equippedItems.map((it) => it.setId));

    return (
      <div key={slot} className="min-w-0 w-full">
      <Popover.Root
        modal={false}
        open={active && slotPopup}
        onOpenChange={(next) => {
          if (!next) setSlotPopup(false);
        }}
      >
        <Popover.Anchor asChild>{slotBtn}</Popover.Anchor>
        <EquipPopoverContent
          rarity={item.rarity}
          side={placement.side}
          align={placement.align}
          showArrow
          footer={
            <div className="border-t border-border/50 px-2.5 py-2">
              <button
                type="button"
                className="w-full rounded-md border border-border/70 py-1.5 text-sm text-muted-foreground"
                onClick={() => {
                  setPlayer((p) => unequipSlot(p, item.slot, templateId));
                  setSlotPopup(false);
                }}
              >
                卸下
              </button>
            </div>
          }
        >
          <EquipTooltip
            compact
            item={item}
            setPieceCount={setKey ? (setCounts.get(setKey) ?? 0) : undefined}
          />
        </EquipPopoverContent>
      </Popover.Root>
      </div>
    );
  };

  const tabs: { id: SheetTab; label: string }[] = [
    { id: 'stats', label: '属性' },
    { id: 'realm', label: '境界' },
    { id: 'skill', label: '技能' },
    { id: 'gear', label: '装备' },
  ];

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-lg flex-col overflow-hidden">
      <div
        className={cn(
          'flex shrink-0 items-start gap-2 rounded-xl border px-2.5 py-2',
          rarityFrame(template.rarity),
        )}
      >
        <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg border border-primary/40 bg-primary/15 font-display text-lg text-primary">
          {template.name.slice(0, 1)}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display truncate text-base tracking-wide">
            {template.isHero ? '★ ' : ''}
            {template.name}
          </h2>
          {tab === 'gear' ? (
            <p className="truncate font-mono text-[10px] text-muted-foreground">
              {realm}
              {onField ? ' · 出战' : ''}
              {' · 战力 '}
              {previewPower}
              {previewPower !== basePower ? (
                <DeltaMark text={signedInt(previewPower - basePower)} />
              ) : null}
            </p>
          ) : (
            <p className="flex min-w-0 items-center gap-1.5 truncate font-mono text-[10px] text-muted-foreground">
              <span className="truncate">
                {realm}
                {onField ? ' · 出战' : ''}
                {owned ? ` · Lv ${progress.level}/${cap}` : ' · 未获得'}
                {owned ? ` · 战力 ${basePower}` : ''}
                {spec ? ` · ${spec.label}` : ''}
              </span>
              <StarRow star={progress.star} max={starCap} />
            </p>
          )}
          {intro ? (
            <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-foreground/72">
              {intro}
            </p>
          ) : null}
          {(() => {
            const meta = getZhongtuEntry(templateId);
            const bonds = bondsFor(templateId);
            if (!meta?.circleId && bonds.length === 0) return null;
            const circle = meta?.circleId ? CIRCLE_LABELS[meta.circleId] : null;
            const bondText = bonds
              .slice(0, 4)
              .map((b) => `${b.label}·${getTemplate(b.with)?.name ?? b.with}`)
              .join('、');
            return (
              <p className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground">
                {circle ? `故事圈 · ${circle}` : null}
                {circle && bondText ? ' · ' : null}
                {bondText || null}
              </p>
            );
          })()}
        </div>
        {tab === 'gear' ? (
          <button
            type="button"
            disabled={!owned}
            onClick={runAutoEquip}
            className={cn(
              'shrink-0 rounded-md border border-primary/50 bg-primary/15 px-2 py-1 font-mono text-[11px] text-primary',
              !owned && 'opacity-40',
            )}
          >
            一键装备
          </button>
        ) : null}
        <button
          type="button"
          onClick={onBack}
          className="shrink-0 rounded-full border border-border/70 bg-background/50 px-2 py-0.5 font-mono text-[11px] text-muted-foreground"
        >
          返回
        </button>
      </div>

      <div className="mt-1.5 grid shrink-0 grid-cols-4 gap-1 rounded-xl border border-border/70 bg-card/50 p-0.5">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              if (t.id !== 'gear') {
                setPickingSlot(null);
                setPreviewItemId(null);
                setSlotPopup(false);
              }
            }}
            className={cn(
              'rounded-lg py-1.5 text-[12px] transition',
              tab === t.id
                ? 'bg-primary/20 font-medium text-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
            {t.id === 'skill' && pendingBranchStars.length > 0 ? ' ·待选' : ''}
            {t.id === 'realm' && owned && btPrev?.ready ? ' ·破' : ''}
          </button>
        ))}
      </div>

      <div className="mt-1.5 min-h-0 flex-1 overflow-hidden">
        {tab === 'stats' && (
          <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden">
            <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto overscroll-contain pr-0.5">
              <div className="grid grid-cols-3 gap-1.5">
                {gearMains.map((row) => (
                  <div
                    key={row.label}
                    className="flex flex-col rounded-xl border border-border/70 bg-card/50 px-2.5 py-1.5"
                  >
                    <span className="text-[10px] text-muted-foreground">{row.label}</span>
                    <strong className="font-mono text-base tabular-nums leading-tight">
                      {row.value}
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
                    <TermLabel label={row.label} className="text-muted-foreground" />
                    <strong className="tabular-nums">{Math.round(row.pct * 100)}%</strong>
                  </div>
                ))}
              </div>
              <div>
                <p className="mb-1 text-[10px] tracking-wide text-muted-foreground">稀有</p>
                <div className="flex flex-wrap gap-1">
                  {rareRows.map((row) => (
                    <div
                      key={row.label}
                      className={cn(
                        'flex min-w-[4.25rem] items-baseline justify-between gap-1.5 rounded-lg border px-2 py-1 text-[10px]',
                        row.active
                          ? 'border-amber-700/40 bg-card/50'
                          : 'border-dashed border-border/40 text-muted-foreground/60',
                      )}
                    >
                      <TermLabel label={row.label} />
                      <strong className="tabular-nums">{row.text}</strong>
                    </div>
                  ))}
                </div>
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
                      星章分支待选 · ★{pendingBranchStars.join('、★')} → 技能页
                    </button>
                  ) : null}
                        {levelTrack && levelPrev ? (
                          <div className="space-y-1.5">
                            <div
                              className={cn(
                                'w-full rounded-xl border px-3 py-1.5 text-left',
                                'border-border/60 bg-card/40',
                              )}
                            >
                              <div className="flex items-baseline justify-between gap-2">
                                <strong className="font-display text-[15px]">等级</strong>
                                <span className="font-mono text-[11px] text-muted-foreground">
                                  Lv {progress.level}
                                  {progress.level < cap
                                    ? ` · 余量 ${progress.exp}/${expToNextLevel(progress.level)}`
                                    : ' · 已达境限'}
                                </span>
                              </div>
                              <p className="mt-0.5 text-[11px] text-muted-foreground">
                                战斗经验自动升级；此处用经验丹补级（优先低档）
                              </p>
                              <Progress
                                value={growthPct(progress.exp, expToNextLevel(progress.level))}
                                className="mt-1.5 h-1"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-1.5">
                              <button
                                type="button"
                                disabled={!previewPillLevelUp(player, templateId, 1).ready}
                                onClick={() => {
                                  setPlayer((p) => {
                                    const r = levelUpWithExpPills(p, templateId, 1);
                                    notice(r.ok ? r.message : r.message);
                                    return r.ok ? r.state : p;
                                  });
                                }}
                                className={cn(
                                  'rounded-xl border px-3 py-2 text-left transition',
                                  previewPillLevelUp(player, templateId, 1).ready
                                    ? 'border-primary/40 bg-card/70 hover:border-primary/60'
                                    : 'border-border/50 bg-card/30 opacity-60',
                                )}
                              >
                                <strong className="font-display text-[14px]">升 1 级</strong>
                                <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                                  {previewPillLevelUp(player, templateId, 1).costLine}
                                </p>
                              </button>
                              <button
                                type="button"
                                disabled={!previewPillLevelUp(player, templateId, 10).ready}
                                onClick={() => {
                                  setPlayer((p) => {
                                    const r = levelUpWithExpPills(p, templateId, 10);
                                    notice(r.ok ? r.message : r.message);
                                    return r.ok ? r.state : p;
                                  });
                                }}
                                className={cn(
                                  'rounded-xl border px-3 py-2 text-left transition',
                                  previewPillLevelUp(player, templateId, 10).ready
                                    ? 'border-primary/40 bg-card/70 hover:border-primary/60'
                                    : 'border-border/50 bg-card/30 opacity-60',
                                )}
                              >
                                <strong className="font-display text-[14px]">升 10 级</strong>
                                <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                                  {previewPillLevelUp(player, templateId, 10).costLine}
                                </p>
                              </button>
                            </div>
                          </div>
                        ) : null}
                  {import.meta.env.DEV ? (
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
                              const materials = { ...(p.materials ?? {}) };
                              materials.exp_pill_1 = (materials.exp_pill_1 ?? 0) + 5;
                              materials.exp_pill_2 = (materials.exp_pill_2 ?? 0) + 2;
                              return { ...p, materials };
                            })
                          }
                        >
                          +经验丹
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
                </>
              )}
            </div>
          </div>
        )}

        {tab === 'realm' && (
          <div className="flex h-full min-h-0 flex-col overflow-hidden">
            <RealmMeridian
              templateId={templateId}
              currentTier={progress.breakthroughTier}
              filled={nodes}
              cultivateReady={Boolean(owned && cultivatePrev?.ready)}
              breakthroughReady={Boolean(owned && btPrev?.ready)}
              hint={realmHint}
              xiuwei={player.currencies?.xiuwei ?? 0}
              unlockedPerks={btRows.unlocked}
              nextPerk={btRows.next}
              owned={owned}
              onCultivate={() => run('cultivate')}
              onBreakthrough={() => run('breakthrough')}
              onGoGacha={onGoGacha}
            />
          </div>
        )}

        {tab === 'skill' && skill && (
          <div className="h-full min-h-0">
            <SkillManual
              skill={skill}
              specLabel={spec?.label}
              currentStar={progress.star}
              starCap={starCap}
              rows={starTrackRows}
              pendingStars={pendingBranchStars}
              focusStar={focusBranchStar}
              respecCost={respecCost}
              owned={owned}
              starReady={Boolean(starPrev?.ready)}
              starCostLine={starPrev?.costLine.replace(/ · 可兑碎片.*$/, '') ?? ''}
              starEffectLine={starPrev?.effectLine ?? ''}
              starPct={starPrev ? growthPct(starPrev.current, starPrev.need) : 0}
              exchangeReady={Boolean(dustExchange?.ready)}
              exchangeHint={dustExchange?.blockedReason ?? '200 星尘换 1 同名碎片'}
              onPickBranch={pickBranch}
              onStarUp={() => run('star')}
              onExchange={() => {
                setPlayer((p) => {
                  const r = tryExchangeStardustForShard(p, templateId);
                  notice(r.message);
                  return r.ok ? r.state : p;
                });
              }}
              onGoGacha={onGoGacha}
            />
          </div>
        )}

        {tab === 'gear' && (
          <div className="flex h-full min-h-0 flex-col overflow-hidden">
            <div className="shrink-0 space-y-2">
              <div className="grid grid-cols-6 gap-1.5">
                {GEAR_BODY.map((s) => renderSlot(s))}
              </div>
              <div className="rounded-xl border border-border/70 bg-card/50">
                <GearStatStrip mains={gearMains} ratings={gearRatings} rares={rareRows} />
                {(() => {
                  const morphId = player.characterMorphs?.[templateId];
                  const morphDef = morphId ? MORPH_DEFS[morphId] : undefined;
                  if (!morphDef && (player.morphStones ?? []).length === 0) return null;
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        setShowMorphPicker(true);
                        setPickingSlot(null);
                        setPreviewItemId(null);
                        setSlotPopup(false);
                      }}
                      className="w-full border-t border-border/40 py-1.5 text-center font-mono text-[10px] text-teal-300/90"
                    >
                      {morphDef ? `形态 · ${morphDef.name}` : '形态石'}
                    </button>
                  );
                })()}
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {GEAR_BOTTOM.map((s) => renderSlot(s))}
              </div>
            </div>

            {(pickingSlot || showMorphPicker) ? (
              <div className="mt-2 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-primary/35 bg-background/95">
                {pickingSlot ? (
                  <>
                    <div className="flex shrink-0 items-center justify-between border-b border-border/50 px-3 py-1.5">
                      <div>
                        <p className="text-sm font-medium">更换 · {SLOT_NAMES[pickingSlot]}</p>
                        <p className="font-mono text-[10px] text-muted-foreground">
                          点槽位看身上这件，点背包看候选
                        </p>
                      </div>
                      <button
                        type="button"
                        className="font-mono text-[11px] text-muted-foreground"
                        onClick={() => {
                          setPickingSlot(null);
                          setPreviewItemId(null);
                          setSlotPopup(false);
                        }}
                      >
                        收起
                      </button>
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
                      {candidates.filter((it) => it.id !== charEquipMap[pickingSlot]).length === 0 ? (
                        <p className="px-1 text-sm text-muted-foreground">背包里没有可换的同槽装备</p>
                      ) : (
                        <div className="grid grid-cols-6 gap-1.5">
                          {candidates
                            .filter((it) => it.id !== charEquipMap[pickingSlot])
                            .map((item) => {
                            const worn = charEquipMap[pickingSlot] === item.id;
                            const blocked = wearBlockedReason(item, progress.breakthroughTier);
                            const previewing = previewItemId === item.id;
                            const setKey = item.setId
                              ? (resolveSetId(item.setId) ?? item.setId)
                              : undefined;
                            const previewEquipped = EQUIP_SLOTS.map((s) => {
                              const id = s === pickingSlot ? item.id : charEquipMap[s];
                              return id ? itemById(player, id) : undefined;
                            }).filter(Boolean) as Equipment[];
                            const setCounts = countEquippedSets(
                              previewEquipped.map((it) => it.setId),
                            );
                            const powerDelta = pickingSlotWorn
                              ? itemPower(item) - itemPower(pickingSlotWorn)
                              : itemPower(item);
                            const isUpgrade =
                              !blocked && powerDelta > 0;
                            return (
                              <Popover.Root
                                key={item.id}
                                modal={false}
                                open={previewing}
                                onOpenChange={(next) => {
                                  if (!next) {
                                    setPreviewItemId((cur) => (cur === item.id ? null : cur));
                                  }
                                }}
                              >
                                <Popover.Anchor asChild>
                                  <div className="min-w-0 w-full">
                                    <EquipBagCell
                                      item={item}
                                      selected={previewing}
                                      worn={worn}
                                      blocked={Boolean(blocked)}
                                      showUpgradeArrow={isUpgrade}
                                      unseen={isItemUnseen(player, item.id)}
                                      onSelect={() => {
                                        if (blocked) {
                                          setPlayer((p) => markItemSeen(p, item.id));
                                          notice(blocked);
                                          return;
                                        }
                                        setPlayer((p) => markItemSeen(p, item.id));
                                        setSlotPopup(false);
                                        setPreviewItemId((cur) => (cur === item.id ? null : item.id));
                                      }}
                                    />
                                  </div>
                                </Popover.Anchor>
                                <EquipPopoverContent
                                  rarity={item.rarity}
                                  side="bottom"
                                  align="center"
                                  footer={
                                    <div className="border-t border-border/50 px-2.5 py-2">
                                      {blocked ? (
                                        <p className="text-center font-mono text-[11px] text-rose-300/90">
                                          {blocked}
                                        </p>
                                      ) : worn ? (
                                        <p className="text-center font-mono text-[11px] text-muted-foreground">
                                          当前穿戴
                                        </p>
                                      ) : (
                                        <button
                                          type="button"
                                          className="w-full rounded-md border border-primary/50 bg-primary/15 py-1.5 text-sm text-primary"
                                          onClick={() => {
                                            setPlayer((p) =>
                                              equipItem(
                                                markItemSeen(p, item.id),
                                                item.id,
                                                templateId,
                                              ),
                                            );
                                            setPreviewItemId(null);
                                            setSlotPopup(false);
                                            setPickingSlot(null);
                                          }}
                                        >
                                          穿上
                                        </button>
                                      )}
                                    </div>
                                  }
                                >
                                  <EquipTooltip
                                    compact
                                    item={item}
                                    setPieceCount={
                                      setKey ? (setCounts.get(setKey) ?? 0) : undefined
                                    }
                                  />
                                </EquipPopoverContent>
                              </Popover.Root>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex shrink-0 items-center justify-between border-b border-border/50 px-3 py-1.5">
                      <p className="text-sm font-medium">形态石</p>
                      <button
                        type="button"
                        className="font-mono text-[11px] text-muted-foreground"
                        onClick={() => setShowMorphPicker(false)}
                      >
                        收起
                      </button>
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
                      <MorphStoneSection
                        player={player}
                        templateId={templateId}
                        setPlayer={setPlayer}
                        notice={notice}
                        showMorphPicker
                        setShowMorphPicker={setShowMorphPicker}
                      />
                    </div>
                  </>
                )}
              </div>
            ) : null}
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

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-md border px-1.5 py-0.5 font-mono text-[10px] leading-none transition',
        active
          ? 'border-primary/50 bg-primary/15 text-primary'
          : 'border-border/60 text-muted-foreground',
      )}
    >
      {children}
    </button>
  );
}

/** 伙伴列表：名录印格，全池密排 */
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

  const filterTemplates = (list: typeof UNIT_TEMPLATES) => {
    let out = [...list];
    if (ownFilter === 'owned') out = out.filter((t) => isOwned(player, t.id));
    if (ownFilter === 'missing') out = out.filter((t) => !isOwned(player, t.id));
    if (roleFilter !== 'all') out = out.filter((t) => t.role === roleFilter);
    if (rarityFilter !== 'all') out = out.filter((t) => t.rarity === rarityFilter);
    out.sort((a, b) => compareRosterTemplates(a, b, player));
    return out;
  };

  const roster = useMemo(() => filterTemplates(UNIT_TEMPLATES), [player, ownFilter, roleFilter, rarityFilter]);

  const rosterOwned = useMemo(
    () =>
      ownFilter === 'all'
        ? filterTemplates(UNIT_TEMPLATES.filter((t) => isOwned(player, t.id)))
        : [],
    [player, ownFilter, roleFilter, rarityFilter],
  );

  const rosterMissing = useMemo(
    () =>
      ownFilter === 'all'
        ? filterTemplates(UNIT_TEMPLATES.filter((t) => !isOwned(player, t.id)))
        : [],
    [player, ownFilter, roleFilter, rarityFilter],
  );

  const ownedCount = UNIT_TEMPLATES.filter((t) => isOwned(player, t.id)).length;
  const formationCount = Object.keys(player.formation).length;

  const rolesInPool = useMemo(() => {
    const set = new Set(UNIT_TEMPLATES.map((t) => t.role));
    return [...set];
  }, []);

  return (
    <div className="space-y-2 pb-3">
      <header className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-display text-lg leading-none tracking-wide">名录</h2>
          <p className="mt-1 font-mono text-[10px] tabular-nums text-muted-foreground">
            {ownedCount}/{UNIT_TEMPLATES.length}
            {' · '}修为 {player.currencies?.xiuwei ?? 0}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => notice('图鉴后置：将按职能与遭遇收录。')}
            className="rounded-md border border-dashed border-border/70 px-2 py-1 font-mono text-[10px] text-muted-foreground"
          >
            图鉴
          </button>
          <button
            type="button"
            onClick={onOpenFormation}
            className="rounded-md border border-primary/45 bg-primary/15 px-2.5 py-1 font-mono text-[10px] text-primary"
          >
            布阵 {formationCount}/{MAX_PARTY_SIZE}
          </button>
        </div>
      </header>

      <div className="flex flex-nowrap gap-1 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {(
          [
            ['all', '全部'],
            ['owned', '已有'],
            ['missing', '未获'],
          ] as const
        ).map(([id, label]) => (
          <FilterChip key={id} active={ownFilter === id} onClick={() => setOwnFilter(id)}>
            {label}
          </FilterChip>
        ))}
        <span className="mx-0.5 w-px shrink-0 self-stretch bg-border/60" />
        <FilterChip active={roleFilter === 'all'} onClick={() => setRoleFilter('all')}>
          全职能
        </FilterChip>
        {rolesInPool.map((role) => (
          <FilterChip
            key={role}
            active={roleFilter === role}
            onClick={() => setRoleFilter(role)}
          >
            {roleLabel(role)}
          </FilterChip>
        ))}
        <span className="mx-0.5 w-px shrink-0 self-stretch bg-border/60" />
        <FilterChip active={rarityFilter === 'all'} onClick={() => setRarityFilter('all')}>
          品
        </FilterChip>
        {(['legendary', 'epic', 'rare', 'common'] as const).map((r) => (
          <FilterChip
            key={r}
            active={rarityFilter === r}
            onClick={() => setRarityFilter(r)}
          >
            {RARITY_LABELS[r]}
          </FilterChip>
        ))}
      </div>

      <p className="font-mono text-[9px] text-muted-foreground/90">
        {ownFilter === 'missing'
          ? '未获得 · 按品级'
          : ownFilter === 'owned'
            ? '已有 · 战力高在前'
            : '已有在上 · 战力序 · 未获按品级'}
      </p>

      {(() => {
        const renderGrid = (list: typeof roster, keyPrefix: string) => (
          <div
            key={keyPrefix}
            className="grid grid-cols-4 gap-1.5 sm:grid-cols-5 md:grid-cols-6"
          >
            {list.map((t) => {
              const owned = isOwned(player, t.id);
              const progress = getProgress(player, t.id);
              const onField = player.formation[t.id] != null;
              const power = owned ? characterPower(player, t.id) : 0;
              const realm = owned ? breakthroughLabel(progress.breakthroughTier) : RARITY_LABELS[t.rarity];
              const title = owned
                ? `${t.name} · ${realm} · Lv${progress.level} · ★${progress.star} · 战力 ${power}${onField ? ' · 出战' : ''}`
                : `${t.name} · ${RARITY_LABELS[t.rarity]} · ${roleLabel(t.role)} · 预览`;
              return (
                <button
                  key={t.id}
                  type="button"
                  title={title}
                  onClick={() => onOpen(t.id)}
                  className={cn(
                    'relative flex min-h-[3.55rem] w-full flex-col items-stretch justify-center rounded-md border px-1 py-1 transition',
                    rarityFrame(t.rarity),
                    !owned && rarityFrameLocked(t.rarity),
                    onField && 'ring-1 ring-primary/70',
                    'hover:brightness-110',
                  )}
                >
                  {onField ? (
                    <span className="absolute right-0.5 top-0.5 size-1.5 rounded-full bg-primary shadow-[0_0_6px_rgba(226,160,74,0.7)]" />
                  ) : null}
                  <span
                    className={cn(
                      'w-full truncate text-center font-display text-[11px] leading-tight sm:text-[12px]',
                      owned ? rarityNameTone(t.rarity) : 'text-muted-foreground',
                    )}
                  >
                    {t.isHero ? '★' : ''}
                    {t.name}
                  </span>
                  <span className="mt-0.5 truncate text-center font-mono text-[8px] leading-snug text-muted-foreground sm:text-[9px]">
                    {owned ? (
                      <>
                        Lv{progress.level} · ★{progress.star}
                        <span className="text-foreground/75"> · {power}</span>
                      </>
                    ) : (
                      <>
                        {realm}
                        <span className="opacity-80"> · {roleLabel(t.role)}</span>
                      </>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        );

        if (ownFilter === 'all') {
          return (
            <div className="space-y-3">
              {rosterOwned.length > 0 ? (
                <section>
                  <p className="mb-1.5 font-mono text-[9px] tracking-[0.12em] text-teal-200/75">
                    已有 · {rosterOwned.length}
                  </p>
                  {renderGrid(rosterOwned, 'owned')}
                </section>
              ) : null}
              {rosterMissing.length > 0 ? (
                <section>
                  <p className="mb-1.5 font-mono text-[9px] tracking-[0.12em] text-muted-foreground">
                    未获得 · {rosterMissing.length}
                  </p>
                  {renderGrid(rosterMissing, 'missing')}
                </section>
              ) : null}
            </div>
          );
        }

        return renderGrid(roster, 'single');
      })()}

      {roster.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">没有符合筛选的伙伴</p>
      ) : null}
    </div>
  );
}
