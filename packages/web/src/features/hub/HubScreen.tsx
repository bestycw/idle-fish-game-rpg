import {
  MAX_PARTY_SIZE,
  STAMINA_COST_GEAR,
  STAMINA_COST_STARDUST,
  STAMINA_COST_TOWER,
  advanceStoryNode,
  canClaimDaily,
  chapterProgressLabel,
  climbTower,
  getChapterView,
  getTowerFloor,
  isContentUnlocked,
  runStardustRealm,
  tryClaimDaily,
  trySpendStamina,
  xiuweiForFloor,
  type PlayerState,
} from '@moyu/game-core';
import { EntryCard } from '@/components/game/EntryCard';

type HubScreenProps = {
  player: PlayerState;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerState>>;
  onStartGearTrial: () => void;
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
  onStartChapterBattle,
  onOpenFormation,
  pushNotice,
}: HubScreenProps) {
  const chapter = getChapterView(player);
  const gearUnlocked = isContentUnlocked(player, 'dungeon', 'gear_trial');
  const towerUnlocked = isContentUnlocked(player, 'dungeon', 'tower');
  const stardustUnlocked = isContentUnlocked(player, 'dungeon', 'stardust_realm');
  const formationCount = Object.keys(player.formation).length;
  const node = chapter.node;
  const playing = chapter.playing;
  const dailyReady = canClaimDaily(player);

  const chapterTitle = playing?.name ?? '旅途';
  const nodeTitle = node?.title;
  const blurb = chapter.finished
    ? '主线骨架已走完。去刷装、秘境或召唤吧。'
    : node
      ? `${playing?.blurb ?? ''} ${node.blurb}`
      : '夜色里，试炼的门还亮着。';

  const primaryChapterAction = () => {
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
    pushNotice(`通关第 ${result.clearedFloor} 层，修为 +${result.gainedXiuwei}`);
  };

  const storyPanel = (
    <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/20 via-card/90 to-[#0e141c] p-4 sm:p-5 lg:flex lg:min-h-[18rem] lg:flex-col lg:justify-between">
      <div>
        <div className="absolute right-3 top-3 font-mono text-[10px] tracking-widest text-primary/70">
          {chapterProgressLabel(player)}
        </div>
        <p className="font-mono text-[11px] tracking-[0.18em] text-primary/90">主线章节</p>
        <h2 className="font-display mt-1 text-2xl tracking-wide sm:text-3xl">{chapterTitle}</h2>
        {nodeTitle ? (
          <p className="mt-1 text-sm text-primary/90">当前节点 · {nodeTitle}</p>
        ) : null}
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-foreground/85">{blurb}</p>
      </div>
      {!chapter.finished && node ? (
        <button
          type="button"
          onClick={primaryChapterAction}
          className="mt-4 w-full rounded-xl bg-primary px-4 py-3 text-center font-medium text-primary-foreground shadow-lg shadow-primary/20 transition hover:brightness-110 sm:w-auto sm:min-w-[12rem] lg:mt-6"
        >
          {node.kind === 'story' ? `推进 · ${node.title}` : `出击 · ${node.title}`}
        </button>
      ) : (
        <p className="mt-4 font-mono text-xs text-muted-foreground lg:mt-6">主线已通关</p>
      )}
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
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <EntryCard
            title="猎装试炼"
            subtitle={gearUnlocked ? `刷装备 · 体力 ${STAMINA_COST_GEAR}` : '未解锁'}
            mark="装"
            accent="amber"
            disabled={!gearUnlocked}
            onClick={onStartGearTrial}
            wide
          />
          <EntryCard
            title="修炼塔"
            subtitle={
              towerUnlocked
                ? `第 ${getTowerFloor(player)} 层 · +${xiuweiForFloor(getTowerFloor(player))} 修为`
                : '未解锁'
            }
            mark="塔"
            accent="teal"
            badge={`体力 ${STAMINA_COST_TOWER}`}
            disabled={!towerUnlocked}
            onClick={onTower}
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
      </p>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-3 pb-4 sm:space-y-4 lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] lg:items-start lg:gap-5 lg:space-y-0">
      {storyPanel}
      {playPanel}
    </div>
  );
}
