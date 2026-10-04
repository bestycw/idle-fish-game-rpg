import {
  MAX_PARTY_SIZE,
  STAMINA_COST_ABYSS,
  STAMINA_COST_GEAR,
  STAMINA_COST_STARDUST,
  STAMINA_COST_TOWER,
  advanceStoryNode,
  battleWavesForNode,
  canClaimDaily,
  currentChapterBattleContext,
  formatChapterBattleWaveProgress,
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
  resolveCurrentMainlineDialogueBeats,
  resolveCurrentNodeCopy,
  resolveNodeCopy,
  formationResonancePreview,
  partyPower,
  pressureForDungeon,
  runStardustRealm,
  tryClaimDaily,
  trySpendStamina,
  xiuweiForFloor,
  type PlayerState,
} from '@moyu/game-core';
import type { NarrativeDialogueBeat } from '@moyu/game-core';
import { useState } from 'react';
import { EntryCard } from '@/components/game/EntryCard';
import { MainlineJourneyCard } from './MainlineJourneyCard';
import { ParallelRealWorldCard } from './ParallelRealWorldCard';
import { HubOnboarding } from './HubOnboarding';
import { MainlineStoryDialogue } from './MainlineStoryDialogue';

type HubScreenProps = {
  player: PlayerState;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerState>>;
  onStartGearTrial: () => void;
  onStartAbyssMirror: () => void;
  onStartChapterBattle: () => void;
  onOpenFormation: () => void;
  pushNotice: (msg: string) => void;
  onOpenParallelRealWorld?: () => void;
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
  onOpenParallelRealWorld,
}: HubScreenProps) {
  const [showMinePicker, setShowMinePicker] = useState(false);
  const [storyDialogue, setStoryDialogue] = useState<{
    beats: NarrativeDialogueBeat[];
    place: string;
    title: string;
  } | null>(null);
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
  const resolvedNode = node ? resolveCurrentNodeCopy(player) : null;
  const here = resolvedNode
    ? resolvedNode.place || resolvedNode.title
    : node
      ? nodePlace(node)
      : null;
  const chapterBattleWave =
    node?.kind === 'battle' ? currentChapterBattleContext(player) : null;
  const battlePrep =
    node?.kind === 'battle' && chapterBattleWave
      ? ENCOUNTERS.find((e) => e.id === chapterBattleWave.encounterId)?.prepHint
      : node?.kind === 'battle' && node.encounterId
        ? ENCOUNTERS.find((e) => e.id === node.encounterId)?.prepHint
        : undefined;
  const heroName = player.narrative?.heroName;
  const storyDialogueBeats =
    node?.kind === 'story' ? resolveCurrentMainlineDialogueBeats(player) : null;
  const skinStub = player.narrative?.skinGenerationStatus === 'stub';

  const routeStopLabel = (stop: (typeof route.stops)[number]) => {
    const copy = resolveNodeCopy(player, stop.node.id);
    const waveCount =
      stop.node.kind === 'battle' ? battleWavesForNode(stop.node).length : 0;
    const baseTitle = copy?.title ?? stop.node.title;
    return {
      place: copy?.place ?? nodePlace(stop.node),
      title: waveCount > 1 ? `${baseTitle} · ${waveCount} 场` : baseTitle,
    };
  };

  const blurb = chapter.finished
    ? '卷一十章已通。猎装刷量、镜渊对症 T3、八题轮换 —— 按战前提示改阵；卷二将另开。'
    : node
      ? node.kind === 'story' && storyDialogueBeats && storyDialogueBeats.length > 0
        ? '与在场人物对话后再继续路程。'
        : [resolvedNode?.blurb ?? node.blurb, battlePrep ? `战前：${battlePrep}` : '']
            .filter(Boolean)
            .join(' ')
      : '夜色里，试炼的门还亮着。';

  const completeStoryNode = () => {
    setStoryDialogue(null);
    setPlayer((p) => {
      const r = advanceStoryNode(p);
      if (!r.ok) {
        pushNotice(r.message);
        return p;
      }
      pushNotice(r.message);
      return r.state;
    });
  };

  const enterCurrent = () => {
    if (chapter.finished || !node) return;
    if (node.kind === 'story') {
      const beats = resolveCurrentMainlineDialogueBeats(player);
      const copy = resolvedNode;
      if (beats && beats.length > 0) {
        setStoryDialogue({
          beats,
          place: copy?.place ?? here ?? nodePlace(node),
          title: copy?.title ?? node.title,
        });
        return;
      }
      completeStoryNode();
      return;
    }
    onStartChapterBattle();
  };

  const onSelectStop = (stop: (typeof route.stops)[number]) => {
    if (stop.status === 'current') {
      enterCurrent();
      return;
    }
    const place = routeStopLabel(stop).place;
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

  const ctaLabel = chapter.finished
    ? ''
    : !node
      ? ''
      : node.kind === 'battle' && chapterBattleWave && chapterBattleWave.waveTotal > 1
        ? `开战 · ${chapterBattleWave.waveIndex + 1}/${chapterBattleWave.waveTotal} 场`
        : node.kind === 'battle'
          ? '开战'
          : `进入 · ${here ?? '当前'}`;

  const storyPanel = (
    <MainlineJourneyCard
      player={player}
      chapterTitle={chapterTitle}
      chapterFinished={chapter.finished}
      sectionTotal={playing?.nodes.length ?? route.stops.length}
      sectionCurrent={chapter.nodeIndex + 1}
      here={here}
      blurb={blurb}
      skinStub={skinStub}
      battleWaveLine={
        node?.kind === 'battle' && chapterBattleWave
          ? formatChapterBattleWaveProgress(chapterBattleWave)
          : null
      }
      recommendedPower={band.recommendedPower}
      deployedPower={deployedPower}
      showBattleMeta={!chapter.finished && node?.kind === 'battle'}
      ctaLabel={ctaLabel}
      onEnter={enterCurrent}
      ticks={route.ticks}
      stops={route.stops}
      onSelectStop={onSelectStop}
      labelForStop={routeStopLabel}
      onMapNotice={pushNotice}
    />
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
    <>
    <div className="mx-auto w-full max-w-6xl space-y-3 pb-3 sm:space-y-3">
      <HubOnboarding />
      {storyPanel}
      {onOpenParallelRealWorld ? (
        <ParallelRealWorldCard player={player} onOpen={onOpenParallelRealWorld} />
      ) : null}
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
    {storyDialogue ? (
      <MainlineStoryDialogue
        place={storyDialogue.place}
        title={storyDialogue.title}
        heroName={heroName ?? '旅人'}
        beats={storyDialogue.beats}
        onComplete={completeStoryNode}
      />
    ) : null}
    </>
  );
}
