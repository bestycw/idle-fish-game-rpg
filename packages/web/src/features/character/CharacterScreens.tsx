import {
  PAPER_DOLL_HANDS,
  PAPER_DOLL_LEFT,
  PAPER_DOLL_RIGHT,
  RARITY_LABELS,
  SLOT_NAMES,
  SLOT_SHORT_NAMES,
  UNIT_TEMPLATES,
  MAX_PARTY_SIZE,
  applyGrowthTrack,
  breakthroughLabel,
  compareRosterTemplates,
  deriveGrowthStats,
  equipItem,
  getProgress,
  getSkill,
  getTemplate,
  grantCurrency,
  isOwned,
  itemsForSlot,
  jobLabel,
  levelCapForTier,
  listGrowthTracks,
  previewStarUp,
  ratingToPct,
  roleLabel,
  skillDisplayFor,
  sumEquipmentBonuses,
  unequipSlot,
  unlockedStarNodes,
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

const MAX_STAR_DISPLAY = 5;

type SheetTab = 'stats' | 'skill' | 'gear';

function StarRow({ star, max = MAX_STAR_DISPLAY }: { star: number; max?: number }) {
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
  const template = getTemplate(templateId);

  const progress = template ? getProgress(player, templateId) : null;
  const derived = template && progress ? deriveGrowthStats(template, progress) : null;
  const bonus = useMemo(() => sumEquipmentBonuses(player), [player]);
  const owned = template ? isOwned(player, templateId) : false;
  const tracks = useMemo(() => listGrowthTracks(), []);
  const starPreview = useMemo(
    () => (template ? previewStarUp(player, templateId) : null),
    [player, template, templateId],
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
  const unlocked = unlockedStarNodes(templateId, progress.star);
  const realm = breakthroughLabel(progress.breakthroughTier);
  const onField = player.formation[templateId] != null;

  const display = {
    physAtk: derived.physAtk + bonus.physAtk,
    spiritAtk: derived.spiritAtk + bonus.spiritAtk,
    physDef: derived.physDef + bonus.physDef,
    spiritDef: derived.spiritDef + bonus.spiritDef,
    maxHp: derived.maxHp + bonus.maxHp,
    spd: derived.spd + bonus.spd,
    critRating: derived.critRating + bonus.critRating,
    critDmgRating: derived.critDmgRating + bonus.critDmgRating,
    hasteRating: derived.hasteRating + bonus.hasteRating,
    versRating: derived.versRating + bonus.versRating,
    masteryRating: derived.masteryRating + bonus.masteryRating,
    finalDmgRating: derived.finalDmgRating + bonus.finalDmgRating,
    fortune: derived.fortune + bonus.fortune,
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
    { label: '急速', rating: display.hasteRating, pct: ratingToPct(display.hasteRating, 'hasteRating') },
    { label: '均衡', rating: display.versRating, pct: ratingToPct(display.versRating, 'versRating') },
    {
      label: '精通',
      rating: display.masteryRating,
      pct: ratingToPct(display.masteryRating, 'masteryRating'),
    },
    {
      label: '终伤',
      rating: display.finalDmgRating,
      pct: ratingToPct(display.finalDmgRating, 'finalDmgRating'),
    },
  ];

  const rareRows = [
    { label: '幸运', text: String(Math.round(display.fortune)), active: display.fortune > 0 },
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
      return result.state;
    });
  };

  const openSlot = (slot: EquipSlot) => {
    if (!owned) {
      notice('未获得伙伴不可换装。');
      return;
    }
    const list = itemsForSlot(player, slot);
    if (list.length === 0 && !player.equipped[slot]) {
      notice(`背包里没有「${SLOT_NAMES[slot] ?? slot}」可穿。`);
      return;
    }
    setPickingSlot(slot);
    setTab('gear');
  };

  const renderSlot = (slot: EquipSlot, wide = false) => {
    const item = itemById(player, player.equipped[slot]);
    return (
      <button
        key={slot}
        type="button"
        title={item ? item.name : SLOT_NAMES[slot]}
        onClick={() => openSlot(slot)}
        className={cn(
          'flex flex-col items-center justify-center gap-0.5 rounded-lg border bg-card/80 px-0.5 text-[10px]',
          wide ? 'h-10 w-14 shrink-0' : 'min-h-0 w-full flex-1',
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
            {item.name.replace(/^(普通|稀有|史诗)/, '')}
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
                <StarRow star={progress.star} />
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
                    ['攻击', display.physAtk],
                    ['灵力', display.spiritAtk],
                    ['防御', display.physDef],
                    ['灵防', display.spiritDef],
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
                tracks.map((track) => {
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
                        <p className="mt-0.5 text-[11px] text-primary/85">
                          {starPreview.attrDiffLine
                            ? `预览 ${starPreview.attrDiffLine}`
                            : ''}
                          {starPreview.nodeLine ? ` · ${starPreview.nodeLine}` : ''}
                        </p>
                      ) : null}
                      <Progress
                        value={growthPct(preview.current, preview.need)}
                        className="mt-1.5 h-1"
                      />
                    </button>
                  );
                })
              )}
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
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {skill.roleLine} · {skill.jobLine}
                {spec ? ` · ${spec.label}` : ''}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                目标 {skill.targetPattern}
                {skill.damageSchool === 'spirit'
                  ? ' · 灵系'
                  : skill.damageSchool === 'phys'
                    ? ' · 力系'
                    : ''}
                · 倍率 {skill.multiplier}
                {skill.statusLine ? ` · ${skill.statusLine}` : ''}
              </p>
              {skill.followUpLine ? (
                <p className="mt-1.5 text-sm text-primary/90">成长 · {skill.followUpLine}</p>
              ) : (
                <p className="mt-1.5 text-xs text-muted-foreground">成长 · 尚未点亮连击</p>
              )}
              {skill.nextFollowUpLine ? (
                <p className="mt-0.5 text-xs text-muted-foreground">{skill.nextFollowUpLine}</p>
              ) : null}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-xl border border-border/70 bg-card/40 p-3">
              <p className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
                已点亮升星
              </p>
              {unlocked.length > 0 ? (
                <ul className="mt-2 space-y-1.5 text-sm">
                  {unlocked.map((n) => (
                    <li key={n.star} className="flex gap-2">
                      <span className="shrink-0 text-primary">★{n.star}</span>
                      <span>{n.label}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  {owned ? '尚未解锁升星节点' : '获得后升星点亮能力'}
                </p>
              )}
              {starPreview?.node && owned ? (
                <p className="mt-3 border-t border-border/50 pt-2 text-xs text-muted-foreground">
                  下一星 · ★{starPreview.nextStar} {starPreview.node.label}
                </p>
              ) : null}
            </div>
          </div>
        )}

        {tab === 'gear' && (
          <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden">
            <p className="shrink-0 text-[11px] text-muted-foreground">共用衣柜 · 点槽换装</p>
            <div className="min-h-0 flex-1 overflow-hidden">
              <div className="grid h-full grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-stretch gap-1.5 sm:grid-cols-[2.75rem_minmax(0,1fr)_2.75rem]">
                <div className="flex min-h-0 flex-col gap-1">
                  {PAPER_DOLL_LEFT.map((s) => renderSlot(s))}
                </div>
                <div className="flex min-h-0 flex-col items-center justify-center rounded-xl border border-border/70 bg-card/40 p-2 text-center">
                  <div className="flex size-14 items-center justify-center rounded-full border border-primary/30 bg-primary/10 font-display text-2xl text-primary">
                    {template.name.slice(0, 1)}
                  </div>
                  <div className="font-display mt-2 text-lg leading-tight">{template.name}</div>
                  <div className="mt-1">
                    <StarRow star={progress.star} />
                  </div>
                </div>
                <div className="flex min-h-0 flex-col gap-1">
                  {PAPER_DOLL_RIGHT.map((s) => renderSlot(s))}
                </div>
              </div>
            </div>
            <div className="flex shrink-0 justify-center gap-2">
              {PAPER_DOLL_HANDS.map((s) => renderSlot(s, true))}
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
                  {player.equipped[pickingSlot] ? (
                    <button
                      type="button"
                      className="mb-2 w-full rounded-lg border border-border py-1.5 text-sm"
                      onClick={() => {
                        setPlayer((p) => unequipSlot(p, pickingSlot));
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
                        const worn = player.equipped[pickingSlot] === item.id;
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
                                setPlayer((p) => equipItem(p, item.id));
                                setPickingSlot(null);
                                notice(`已穿戴 ${item.name}`);
                              }}
                            >
                              <strong className="text-sm">
                                {item.name}
                                {worn ? ' · 已穿' : ''}
                              </strong>
                              <span className="text-[11px] text-muted-foreground">
                                {item.affixes.map((a) => `${a.name}+${a.value}`).join(' · ')}
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
            已有 {ownedCount}/{UNIT_TEMPLATES.length} · 修为 {player.currencies?.xiuwei ?? 0} · 星尘{' '}
            {player.currencies?.stardust ?? 0}
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
                  <StarRow star={progress.star} />
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
