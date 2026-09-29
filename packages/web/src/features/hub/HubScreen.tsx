import {
  MAX_PARTY_SIZE,
  STAMINA_COST_ABYSS,
  STAMINA_COST_GEAR,
  STAMINA_COST_STARDUST,
  STAMINA_COST_TOWER,
  advanceStoryNode,
  canClaimDaily,
  canMine,
  climbTower,
  doMine,
  getChapterBand,
  getChapterRoute,
  ENCOUNTERS,
  getChapterView,
  getTowerFloor,
  isContentUnlocked,
  isTowerMilestone,
  MINE_DAILY_LIMIT,
  MINE_DEFS,
  MINE_STAMINA_COST,
  nodePlace,
  formationResonancePreview,
  partyPower,
  pressureForDungeon,
  runStardustRealm,
  tryClaimDaily,
  trySpendStamina,
  xiuweiForFloor,
  type PlayerState,
} from '@moyu/game-core';
import { useState } from 'react';
import { EntryCard } from '@/components/game/EntryCard';
import { ChapterRoute } from './ChapterRoute';
import { HubOnboarding } from './HubOnboarding';

type HubScreenProps = {
  player: PlayerState;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerState>>;
  onStartGearTrial: () => void;
  onStartAbyssMirror: () => void;
  onStartChapterBattle: () => void;
  onOpenFormation: () => void;
  pushNotice: (msg: string) => void;
};

const LOCKED_ENTRIES = [
  { id: 'quest', title: '悬赏', mark: '悬', subtitle: '日常战斗委托' },
  { id: 'arena', title: '竞技', mark: '竞', subtitle: '切磋演武' },
] as const;

/**
 * 冒险首页：只放战斗/刷本相关
 * - 真：补给、星尘秘境、猎装、修炼塔
 * - 灰锁：悬赏、竞技（战斗向占位）
 * - 图鉴→伙伴；商会→背包；邮件/设置→顶栏
 */
export function HubScreen({
  player,
  setPlayer,
  onStartGearTrial,
  onStartAbyssMirror,
  onStartChapterBattle,
  onOpenFormation,
  pushNotice,
}: HubScreenProps) {
  const [showMinePicker, setShowMinePicker] = useState(false);
  const chapter = getChapterView(player);
  const route = getChapterRoute(player);
  const band = getChapterBand(player.chapterCleared ?? 0);
  const deployedPower = partyPower(player, Object.keys(player.formation));
  const gearUnlocked = isContentUnlocked(player, 'dungeon', 'gear_trial');
  const abyssUnlocked = isContentUnlocked(player, 'dungeon', 'abyss_mirror');
  const towerUnlocked = isContentUnlocked(player, 'dungeon', 'tower');
  const stardustUnlocked = isContentUnlocked(player, 'dungeon', 'stardust_realm');
  const formationCount = Object.keys(player.formation).length;
  const resonancePreview = formationResonancePreview(player);
  const node = chapter.node;
  const playing = chapter.playing;
  const dailyReady = canClaimDaily(player);
  const mineCount = (() => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return player.mineDay === todayStr ? (player.mineCountToday ?? 0) : 0;
  })();
  const mineReady = canMine(player);

  const onMine = () => {
    setShowMinePicker(true);
  };

  const onMineSelect = (mineId: string) => {
    const result = doMine(player, mineId);
    if (!result.ok) {
      pushNotice(result.message);
    } else {
      setPlayer(result.state);
      pushNotice(result.message);
    }
    setShowMinePicker(false);
  };

  const chapterTitle = playing?.name ?? route.chapter?.name ?? '旅途';
  const here = node ? nodePlace(node) : null;
  const battlePrep =
    node?.kind === 'battle' && node.encounterId
      ? ENCOUNTERS.find((e) => e.id === node.encounterId)?.prepHint
      : undefined;
  const blurb = chapter.finished
    ? '主线骨架已走完。猎装刷量、镜渊对症 T3、八题轮换 —— 按战前提示改阵即可。'
    : node
      ? [playing?.blurb ?? '', node.blurb, battlePrep ? `战前：${battlePrep}` : '']
          .filter(Boolean)
          .join(' ')
      : '夜色里，试炼的门还亮着。';

  const enterCurrent = () => {
    if (chapter.finished || !node) return;
    if (node.kind === 'story') {
      const r = advanceStoryNode(player);
      if (!r.ok) {
        pushNotice(r.message);
        return;
      }
      setPlayer(r.state);
      pushNotice(r.message);
      return;
    }
    onStartChapterBattle();
  };

  const onSelectStop = (stop: (typeof route.stops)[number]) => {
    if (stop.status === 'current') {
      enterCurrent();
      return;
    }
    const place = nodePlace(stop.node);
    if (stop.status === 'ahead') {
      pushNotice(`尚未抵达「${place}」。`);
      return;
    }
    pushNotice(`已经过了「${place}」。`);
  };

  const onDaily = () => {
    const r = tryClaimDaily(player);
    setPlayer(r.state);
    pushNotice(r.message);
  };

  const onStardustRealm = () => {
    if (!stardustUnlocked) {
      pushNotice('星尘秘境尚未解锁。');
      return;
    }
    const spend = trySpendStamina(player, STAMINA_COST_STARDUST);
    if (!spend.ok) {
      setPlayer(spend.state);
      pushNotice(spend.message);
      return;
    }
    const result = runStardustRealm(spend.state);
    setPlayer(result.state);
    pushNotice(`星尘秘境：星尘 +${result.gainedStardust}`);
  };

  const onTower = () => {
    const spend = trySpendStamina(player, STAMINA_COST_TOWER);
    if (!spend.ok) {
      setPlayer(spend.state);
      pushNotice(spend.message);
      return;
    }
    const result = climbTower(spend.state);
    setPlayer(result.state);
    const dustBit =
      result.gainedStardust > 0 ? `，里程碑星尘 +${result.gainedStardust}` : '';
    pushNotice(`通关第 ${result.clearedFloor} 层，修为 +${result.gainedXiuwei}${dustBit}`);
  };

  const storyPanel = (
    <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/20 via-card/90 to-[#0e141c] p-4 sm:p-5">
      <p className="font-mono text-[11px] tracking-[0.18em] text-primary/90">主线路程</p>
      <h2 className="font-display mt-1 text-2xl tracking-wide sm:text-3xl">{chapterTitle}</h2>
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-stretch">
        <ChapterRoute
          ticks={route.ticks}
          stops={route.stops}
          finished={route.finished}
          onSelect={onSelectStop}
        />
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          {here ? (
            <p className="text-sm text-primary/90">此地 · {here}</p>
          ) : (
            <p className="text-sm text-muted-foreground">路程已尽</p>
          )}
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-foreground/85">{blurb}</p>
          {!chapter.finished && node?.kind === 'battle' ? (
            <p className="mt-2 font-mono text-[11px] text-muted-foreground">
              建议战力 {band.recommendedPower}
              {deployedPower > 0 ? ` · 出战 ${deployedPower}` : ''}
            </p>
          ) : null}
          {!chapter.finished && node ? (
            <button
              type="button"
              onClick={enterCurrent}
              className="mt-4 w-full rounded-xl bg-primary px-4 py-3 text-center font-medium text-primary-foreground shadow-lg shadow-primary/20 transition hover:brightness-110 sm:w-auto sm:min-w-[12rem]"
            >
              进入 · {here}
            </button>
          ) : (
            <p className="mt-4 font-mono text-xs text-muted-foreground">主线已通关</p>
          )}
        </div>
      </div>
    </div>
  );

  const playPanel = (
    <div className="space-y-3 sm:space-y-4">
      <div>
        <p className="mb-2 font-mono text-[11px] tracking-[0.16em] text-muted-foreground">今日</p>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <EntryCard
            title="摸鱼补给"
            subtitle={dailyReady ? '体力 + 券 · 每日一次' : '今日已领'}
            mark="补"
            accent="amber"
            badge={dailyReady ? '可领' : undefined}
            disabled={!dailyReady}
            onClick={onDaily}
            wide
          />
          <EntryCard
            title="星尘秘境"
            subtitle={
              stardustUnlocked ? `刷星尘 · 体力 ${STAMINA_COST_STARDUST}` : '未解锁'
            }
            mark="星"
            accent="rose"
            disabled={!stardustUnlocked}
            onClick={onStardustRealm}
            wide
          />
        </div>
      </div>

      <div>
        <p className="mb-2 font-mono text-[11px] tracking-[0.16em] text-muted-foreground">历练</p>
        <p className="mb-2 text-xs leading-relaxed text-muted-foreground">
          周循环：八题看战前提示 · 缺装量→猎装 · 缺对症 T3→镜渊（第二章后）
        </p>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <EntryCard
            title="猎装试炼"
            subtitle={
              gearUnlocked
                ? `建议 ${band.recommendedPower} · 刷装量 · 体力 ${STAMINA_COST_GEAR}`
                : '未解锁'
            }
            mark="装"
            accent="amber"
            disabled={!gearUnlocked}
            onClick={onStartGearTrial}
            wide
          />
          <EntryCard
            title="镜渊试炼"
            subtitle={
              abyssUnlocked
                ? `建议 ${Math.round(band.recommendedPower * pressureForDungeon('abyss_mirror'))} · 对症 T3 · 体力 ${STAMINA_COST_ABYSS}`
                : '通关第二章解锁'
            }
            mark="渊"
            accent="rose"
            disabled={!abyssUnlocked}
            onClick={onStartAbyssMirror}
            wide
          />
          <EntryCard
            title="修炼塔"
            subtitle={
              towerUnlocked
                ? `第 ${getTowerFloor(player)} 层 · +${xiuweiForFloor(getTowerFloor(player))} 修为` +
                  (isTowerMilestone(getTowerFloor(player)) ? ' · 里程碑' : '')
                : '未解锁'
            }
            mark="塔"
            accent="teal"
            badge={`体力 ${STAMINA_COST_TOWER}`}
            disabled={!towerUnlocked}
            onClick={onTower}
            wide
          />
          <EntryCard
            title="挖矿"
            subtitle={`体力 ${MINE_STAMINA_COST} · 今日 ${mineCount}/${MINE_DAILY_LIMIT}`}
            mark="矿"
            accent="amber"
            disabled={!mineReady}
            onClick={onMine}
            wide
          />
        </div>
      </div>

      <div>
        <p className="mb-2 font-mono text-[11px] tracking-[0.16em] text-muted-foreground">挑战</p>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {LOCKED_ENTRIES.map((e) => (
            <EntryCard
              key={e.id}
              title={e.title}
              subtitle={e.subtitle}
              mark={e.mark}
              accent="slate"
              locked
              wide
              onClick={() => pushNotice(`${e.title}后置，本切片先占位。`)}
            />
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        出战 {formationCount}/{MAX_PARTY_SIZE}
        <span className="mx-1.5 text-border">·</span>
        <button
          type="button"
          onClick={onOpenFormation}
          className="text-primary underline-offset-2 hover:underline"
        >
          去布阵
        </button>
        {resonancePreview ? (
          <>
            <span className="mx-1.5 text-border">·</span>
            <span className="text-teal-300/85">{resonancePreview}</span>
          </>
        ) : null}
      </p>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-3 pb-3 sm:space-y-4 lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] lg:items-start lg:gap-5 lg:space-y-0">
      <div className="space-y-3 lg:col-span-2">
        <HubOnboarding />
      </div>
      {storyPanel}
      {playPanel}
      {showMinePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-72 rounded-xl border border-border bg-card p-4 shadow-xl">
            <p className="mb-3 text-sm font-medium">选择矿脉</p>
            <div className="space-y-2">
              {MINE_DEFS.filter((m) => player.chapterCleared >= m.unlockChapter).map((mine) => (
                <button
                  key={mine.id}
                  type="button"
                  onClick={() => onMineSelect(mine.id)}
                  className="w-full rounded-lg border border-border/60 bg-card/80 px-3 py-2 text-left text-sm hover:border-primary/40"
                >
                  <strong>{mine.name}</strong>
                  <span className="ml-2 text-[11px] text-muted-foreground">
                    强化石 {mine.stoneRange[0]}-{mine.stoneRange[1]} · 宝石概率 {Math.round(mine.gemBaseChance * 100)}%
                  </span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowMinePicker(false)}
              className="mt-3 w-full rounded-lg border border-border py-1.5 text-sm text-muted-foreground"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
