import {
  buildPlayerParty,
  chapterProgressLabel,
  chapterBattleAfterDefeat,
  currentChapterEncounterIndex,
  formatChapterBattleWaveProgress,
  pendingChapterBattleWaves,
  resolveChapterBattleAfterWin,
  buildBattleSettlement,
  EMPTY_SETTLEMENT,
  getChapterBand,
  getDungeon,
  grantDungeonReward,
  deployedPartyPower,
  type BattleSettlement,
  loadOrCreatePlayer,
  persistPlayer,
  pickUnlockedEncounterIndex,
  staminaCostForDungeon,
  runAutoBattle,
  stepBattle,
  syncStamina,
  trySpendStamina,
  needsPrologue,
  devClearCurrentChapter,
  devClearMainlineChapters,
  devForceBattleWin,
  clearParallelMainlineDefeatRipple,
  latestParallelArcReportId,
  markParallelArcReportSeen,
  previousParallelArcId,
  unseenParallelArcReport,
  STAMINA_MAX,
  type ParallelArcId,
  UNIT_TEMPLATES,
  type BattleState,
  type DungeonId,
  type PlayerState,
} from '@moyu/game-core';
import { useEffect, useRef, useState } from 'react';
import { localSaveAdapter } from './adapters/localSave';
import { BottomNav, type NavTab } from '@/components/game/BottomNav';
import { GameShell } from '@/components/game/GameShell';
import { StatusBar } from '@/components/game/StatusBar';
import { BattleScreen } from './features/battle/BattleScreen';
import type { BattleSpeed } from './features/battle/BattleSpeedControls';
import {
  BattlePrepScreen,
  type BattlePrepConfig,
} from './features/battle/BattlePrepScreen';
import { CharacterList, CharacterSheet } from './features/character/CharacterScreens';
import { FormationScreen } from './features/character/FormationScreen';
import { HubScreen } from './features/hub/HubScreen';
import {
  markHubFormationTipDone,
  markHubGearTipDone,
} from './features/hub/HubOnboarding';
import { GearDungeonScreen } from './features/hub/GearDungeonScreen';
import { ParallelArcScreen } from './features/hub/ParallelArcScreen';
import { PrologueScreen } from './features/hub/PrologueScreen';
import { GachaScreen } from './features/gacha/GachaScreen';
import { InventoryPanel } from './features/inventory/InventoryPanel';
import { ResultScreen } from './features/result/ResultScreen';

type Screen =
  | 'prologue'
  | 'hub'
  | 'battle_prep'
  | 'battle'
  | 'result'
  | 'characters'
  | 'character'
  | 'formation'
  | 'gacha'
  | 'bag'
  | 'gear_dungeons';
type BattleSource = 'dungeon' | 'chapter';

function screenToTab(screen: Screen): NavTab {
  if (screen === 'gacha') return 'gacha';
  if (screen === 'characters' || screen === 'character' || screen === 'formation') return 'characters';
  if (screen === 'bag') return 'bag';
  return 'hub';
}

const DEFAULT_BATTLE_DUNGEON: DungeonId = 'gear_break_wall';
const BATTLE_BASE_TICK_MS = 380;

function bootstrapSession() {
  const player = loadOrCreatePlayer(localSaveAdapter);
  const screen: Screen = needsPrologue(player) ? 'prologue' : 'hub';
  return { player, screen };
}

const sessionBoot = bootstrapSession();

export default function App() {
  const [player, setPlayer] = useState<PlayerState>(sessionBoot.player);
  const [screen, setScreen] = useState<Screen>(sessionBoot.screen);
  const [selectedId, setSelectedId] = useState<string | null>('hero');
  const [battle, setBattle] = useState<BattleState | null>(null);
  const [lastSettlement, setLastSettlement] = useState<BattleSettlement>(EMPTY_SETTLEMENT);
  const [activeDungeonId, setActiveDungeonId] = useState<DungeonId>(DEFAULT_BATTLE_DUNGEON);
  const [playing, setPlaying] = useState(false);
  const [characterBack, setCharacterBack] = useState<'hub' | 'characters' | 'formation'>(
    'characters',
  );
  const [formationBack, setFormationBack] = useState<'hub' | 'characters' | 'battle_prep'>(
    'characters',
  );
  const [battlePrep, setBattlePrep] = useState<BattlePrepConfig | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [battleSpeed, setBattleSpeed] = useState<BattleSpeed>(1);
  const [pendingParallelArc, setPendingParallelArc] = useState<ParallelArcId | null>(null);
  const [parallelArcBrowse, setParallelArcBrowse] = useState<ParallelArcId | null>(null);

  const timerRef = useRef<number | null>(null);
  const battleSpeedRef = useRef<BattleSpeed>(1);
  const battleRef = useRef<BattleState | null>(null);
  const playerRef = useRef(player);
  const dungeonRef = useRef<DungeonId>(activeDungeonId);
  const battleSourceRef = useRef<BattleSource>('dungeon');
  const noticeTimerRef = useRef<number | null>(null);
  /** 平行线结算：等离开战斗结算页再弹，避免盖住战利 */
  const deferredParallelArcRef = useRef<ParallelArcId | null>(null);
  const prepReturnScreenRef = useRef<Screen>('hub');

  const dismissNotice = () => {
    if (noticeTimerRef.current != null) {
      window.clearTimeout(noticeTimerRef.current);
      noticeTimerRef.current = null;
    }
    setNotice(null);
  };

  const pushNotice = (msg: string) => {
    setNotice(msg);
    if (noticeTimerRef.current != null) window.clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = window.setTimeout(() => dismissNotice(), 4200);
  };

  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  useEffect(() => {
    battleSpeedRef.current = battleSpeed;
  }, [battleSpeed]);

  useEffect(() => {
    dungeonRef.current = activeDungeonId;
  }, [activeDungeonId]);

  useEffect(() => {
    persistPlayer(localSaveAdapter, player);
  }, [player]);

  useEffect(() => {
    const arc = unseenParallelArcReport(playerRef.current);
    if (arc) setPendingParallelArc(arc);
  }, []);

  useEffect(() => {
    setPlayer((p) => syncStamina(p));
    const id = window.setInterval(() => {
      setPlayer((p) => syncStamina(p));
    }, 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current != null) window.clearInterval(timerRef.current);
      if (noticeTimerRef.current != null) window.clearTimeout(noticeTimerRef.current);
    };
  }, []);

  const stopPlayback = () => {
    if (timerRef.current != null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setPlaying(false);
  };

  const queueParallelArcAfterResult = (state: PlayerState) => {
    const arc = unseenParallelArcReport(state);
    if (arc) deferredParallelArcRef.current = arc;
  };

  const flushDeferredParallelArc = () => {
    const arc = deferredParallelArcRef.current;
    if (!arc) return;
    deferredParallelArcRef.current = null;
    setPendingParallelArc(arc);
  };

  const finishBattle = (finalState: BattleState, basePlayer: PlayerState) => {
    stopPlayback();
    dismissNotice();
    battleRef.current = finalState;
    setBattle(finalState);
    if (finalState.status === 'won') {
      if (battleSourceRef.current === 'chapter') {
        const done = resolveChapterBattleAfterWin(basePlayer);
        if (done.ok) {
          setPlayer(done.state);
          setLastSettlement(done.settlement);
          if (done.clearedChapter) {
            queueParallelArcAfterResult(done.state);
          }
        } else {
          setLastSettlement(EMPTY_SETTLEMENT);
        }
      } else {
        const { state, loot, bonusLoot, characterExpPerMember, partyExpRows } = grantDungeonReward(
          basePlayer,
          dungeonRef.current,
        );
        setPlayer(state);
        setLastSettlement(
          buildBattleSettlement({
            source: 'dungeon',
            before: basePlayer,
            after: state,
            equipment: loot,
            bonusEquipment: bonusLoot,
            characterExpPerMember,
            partyExpRows,
            lines: loot ? [] : ['本局未出装备，再试一把。'],
          }),
        );
      }
    } else {
      setLastSettlement(EMPTY_SETTLEMENT);
      if (battleSourceRef.current === 'chapter') {
        const afterDefeat = chapterBattleAfterDefeat(basePlayer);
        setPlayer(afterDefeat);
      }
    }
    setScreen('result');
  };

  const tick = () => {
    const cur = battleRef.current;
    if (!cur || cur.status !== 'ongoing') return;
    const next = stepBattle(cur, playerRef.current.seed, { heroManual: false });
    battleRef.current = next;
    setBattle({ ...next, log: [...next.log], events: [...next.events] });

    if (next.status !== 'ongoing') {
      finishBattle(next, playerRef.current);
      return;
    }
  };

  const startPlayback = () => {
    stopPlayback();
    setPlaying(true);
    const ms = Math.max(48, Math.round(BATTLE_BASE_TICK_MS / battleSpeedRef.current));
    timerRef.current = window.setInterval(tick, ms);
  };

  const setBattlePlaybackSpeed = (speed: BattleSpeed) => {
    setBattleSpeed(speed);
    battleSpeedRef.current = speed;
    if (battleRef.current?.status === 'ongoing') startPlayback();
  };

  const skipBattleToResult = () => {
    const cur = battleRef.current;
    if (!cur || cur.status !== 'ongoing') return;
    stopPlayback();
    const final = runAutoBattle(cur, playerRef.current.seed);
    battleRef.current = final;
    setBattle({ ...final, log: [...final.log], events: [...final.events] });
    finishBattle(final, playerRef.current);
  };

  const openDungeonPrep = (
    dungeonId: DungeonId = DEFAULT_BATTLE_DUNGEON,
    returnTo: Screen = 'hub',
  ) => {
    stopPlayback();
    const dungeon = getDungeon(dungeonId);
    if (dungeon.runMode !== 'battle') return;
    prepReturnScreenRef.current = returnTo;
    const encIdx = pickUnlockedEncounterIndex(player, dungeonId, player.encounterIndex);
    battleSourceRef.current = 'dungeon';
    setActiveDungeonId(dungeonId);
    dungeonRef.current = dungeonId;
    setBattlePrep({ kind: 'dungeon', dungeonId, encounterIndex: encIdx });
    setScreen('battle_prep');
  };

  const openGearDungeons = () => {
    stopPlayback();
    markHubGearTipDone();
    setScreen('gear_dungeons');
  };

  const openChapterPrep = () => {
    stopPlayback();
    const encIdx = currentChapterEncounterIndex(player);
    if (encIdx == null) {
      pushNotice('当前不是章节战斗节点。');
      return;
    }
    battleSourceRef.current = 'chapter';
    setActiveDungeonId(DEFAULT_BATTLE_DUNGEON);
    dungeonRef.current = DEFAULT_BATTLE_DUNGEON;
    setBattlePrep({
      kind: 'chapter',
      dungeonId: DEFAULT_BATTLE_DUNGEON,
      encounterIndex: encIdx,
    });
    setScreen('battle_prep');
  };

  const commitBattleStart = (initial: BattleState) => {
    stopPlayback();
    const prep = battlePrep;
    if (!prep) return;
    let base = player;
    if (prep.kind === 'dungeon') {
      const spend = trySpendStamina(player, staminaCostForDungeon(prep.dungeonId));
      if (!spend.ok) {
        pushNotice(spend.message);
        setPlayer(spend.state);
        return;
      }
      setPlayer(spend.state);
      base = spend.state;
    }
    if (buildPlayerParty(base).length === 0) {
      pushNotice('阵上无人，请先布阵。');
      return;
    }
    battleRef.current = initial;
    setBattle(initial);
    setLastSettlement(EMPTY_SETTLEMENT);
    setBattlePrep(null);
    setBattleSpeed(1);
    battleSpeedRef.current = 1;
    setScreen('battle');
    startPlayback();
  };

  /** 结算页「再打一局」：先进战前整备 */
  const restartBattlePrep = () => {
    if (battleSourceRef.current === 'chapter') {
      openChapterPrep();
    } else {
      openDungeonPrep(activeDungeonId, prepReturnScreenRef.current);
    }
  };

  const resetSave = () => {
    stopPlayback();
    localSaveAdapter.clear();
    const fresh = loadOrCreatePlayer(localSaveAdapter);
    setPlayer(fresh);
    battleRef.current = null;
    setBattle(null);
    setLastSettlement(EMPTY_SETTLEMENT);
    setActiveDungeonId(DEFAULT_BATTLE_DUNGEON);
    setScreen(needsPrologue(fresh) ? 'prologue' : 'hub');
    pushNotice('存档已清空，故事从头开始。');
  };

  /** DEV: 给所有角色加满资源，方便测试升星 */
  const devGrantAll = () => {
    setPlayer((p) => {
      const roster = { ...p.roster };
      for (const t of UNIT_TEMPLATES) {
        if (roster[t.id]) {
          roster[t.id] = { ...roster[t.id], owned: true, cardShards: 99, exp: 99999 };
        }
      }
      const next = {
        ...p,
        gold: 999999,
        stamina: STAMINA_MAX,
        staminaUpdatedAt: Date.now(),
        currencies: {
          ...p.currencies,
          xiuwei: 99999,
          stardust: 99999,
          ticket: 999,
        },
        enhanceStones: 9999,
        gems: [
          { gemId: 'gem_atk', count: 99 },
          { gemId: 'gem_def', count: 99 },
          { gemId: 'gem_res', count: 99 },
          { gemId: 'gem_hp', count: 99 },
          { gemId: 'gem_crit', count: 99 },
          { gemId: 'gem_pen', count: 99 },
          { gemId: 'gem_mastery', count: 99 },
          { gemId: 'gem_tenacity', count: 99 },
        ],
        morphStones: [
          'morph_bleed_edge', 'morph_frost_touch', 'morph_life_drain',
          'morph_shield_break', 'morph_chain', 'morph_guard_up',
          'morph_echo_strike', 'morph_cleanse_heal',
        ],
        roster,
      };
      return next;
    });
    pushNotice('🔧 DEV：全资源拉满（强化石/宝石/形态石）');
  };

  const applyDevPlayer = (next: PlayerState, message: string) => {
    setPlayer(next);
    const arc = unseenParallelArcReport(next);
    if (arc) {
      dismissNotice();
      setPendingParallelArc(arc);
    } else {
      pushNotice(message);
    }
  };

  const devClearOneChapter = () => {
    const r = devClearCurrentChapter(player);
    applyDevPlayer(r.state, r.message);
  };

  const devClearVolume = () => {
    const r = devClearMainlineChapters(player, 10);
    applyDevPlayer(r.state, r.message);
  };

  const devInstantWinBattle = () => {
    const cur = battleRef.current;
    if (!cur || cur.status !== 'ongoing') return;
    stopPlayback();
    finishBattle(devForceBattleWin(cur), playerRef.current);
  };

  const handleBackToHub = () => {
    stopPlayback();
    setPlayer((p) => clearParallelMainlineDefeatRipple(p));
    const dest =
      battleSourceRef.current === 'dungeon' ? prepReturnScreenRef.current : 'hub';
    setScreen(dest);
    window.requestAnimationFrame(() => flushDeferredParallelArc());
  };

  const activeParallelArcId = pendingParallelArc ?? parallelArcBrowse;

  const closeParallelArc = (markSeen: boolean) => {
    const arc = activeParallelArcId;
    if (markSeen && arc) {
      setPlayer((p) => markParallelArcReportSeen(p, arc));
    }
    setPendingParallelArc(null);
    setParallelArcBrowse(null);
  };

  const openParallelRealWorldFromHub = () => {
    const unread = unseenParallelArcReport(player);
    const latest = latestParallelArcReportId(player);
    const target = unread ?? latest;
    if (!target) {
      pushNotice('通完第 1–2 章主线后，这里会同步你的原世界结算。');
      return;
    }
    setParallelArcBrowse(target);
  };

  const openCharacter = (
    templateId: string,
    back: 'hub' | 'characters' | 'formation' = 'characters',
  ) => {
    setSelectedId(templateId);
    setCharacterBack(back);
    setScreen('character');
  };

  const openFormation = (back: 'hub' | 'characters' | 'battle_prep' = 'characters') => {
    markHubFormationTipDone();
    setFormationBack(back);
    setScreen('formation');
  };

  const chapterPendingWaves =
    battleSourceRef.current === 'chapter' ? pendingChapterBattleWaves(player) : null;
  const dungeonName =
    battleSourceRef.current === 'chapter'
      ? chapterPendingWaves
        ? `主线 · ${formatChapterBattleWaveProgress(chapterPendingWaves)}`
        : '主线节点'
      : getDungeon(activeDungeonId).name;
  const chapterBetweenWaves =
    battle?.status === 'won' &&
    battleSourceRef.current === 'chapter' &&
    (player.chapterBattleWaveIndex ?? 0) > 0;
  const chapterNextBattleHint =
    chapterBetweenWaves && chapterPendingWaves
      ? formatChapterBattleWaveProgress(chapterPendingWaves)
      : null;

  const subtitle =
    screen === 'prologue'
      ? '跨维入职（Beta）'
      : screen === 'battle'
        ? '战报翻页中'
        : screen === 'battle_prep'
          ? '战前整备'
          : screen === 'result'
            ? '尘埃落定'
            : screen === 'formation'
              ? '九宫站位'
              : screen === 'bag'
                ? '行囊'
                : screen === 'gear_dungeons'
                  ? '猎装秘境'
                  : '布阵刷装 · 摸鱼深构筑';

  const combatFocus =
    screen === 'battle_prep' || screen === 'battle' || screen === 'result';
  const showDock =
    screen !== 'prologue' &&
    screen !== 'battle' &&
    screen !== 'battle_prep' &&
    screen !== 'result';
  const scrollMain =
    screen === 'hub' ||
    screen === 'gacha' ||
    screen === 'characters' ||
    screen === 'bag' ||
    screen === 'character';
  const onNav = (tab: NavTab) => {
    stopPlayback();
    if (tab === 'hub') {
      setScreen(battlePrep ? 'battle_prep' : 'hub');
    } else if (tab === 'gacha') setScreen('gacha');
    else if (tab === 'characters') setScreen('characters');
    else setScreen('bag');
  };

  return (
    <GameShell
      scrollMain={scrollMain}
      subtitle={subtitle}
      layout={
        screen === 'gacha' || screen === 'characters' ? 'home' : 'focus'
      }
      hideBrand={
        screen === 'prologue' ||
        screen === 'battle' ||
        screen === 'battle_prep' ||
        screen === 'result' ||
        screen === 'character' ||
        screen === 'formation' ||
        screen === 'bag' ||
        screen === 'gear_dungeons'
      }
      notice={screen === 'result' || screen === 'battle' ? null : notice}
      onDismissNotice={dismissNotice}
      dock={
        showDock ? (
          <BottomNav active={screenToTab(screen)} onChange={onNav} />
        ) : undefined
      }
      className={combatFocus ? 'pt-2 sm:pt-2' : undefined}
      status={
        screen === 'prologue' || screen === 'result' ? null : (
        <div className="space-y-1.5">
          <StatusBar
            player={player}
            chapterLabel={chapterProgressLabel(player)}
            compact={combatFocus}
            onMail={
              combatFocus
                ? undefined
                : () => pushNotice('邮件后置：系统信件将挂在顶栏。')
            }
            onSettings={
              combatFocus
                ? undefined
                : () => {
                    if (screen === 'hub') {
                      pushNotice('设置后置。可用下方「清空存档」重置 Demo。');
                    } else {
                      pushNotice('设置后置；清档请回冒险页。');
                    }
                  }
            }
          />
          {screen === 'hub' ? (
            <div className="flex flex-wrap justify-end gap-x-3 gap-y-1">
              <button
                type="button"
                onClick={devGrantAll}
                className="font-mono text-[10px] tracking-wide text-amber-400 underline-offset-2 hover:text-amber-300 hover:underline"
              >
                🔧 资源拉满
              </button>
              {import.meta.env.DEV ? (
                <>
                  <button
                    type="button"
                    onClick={devClearOneChapter}
                    className="font-mono text-[10px] tracking-wide text-amber-400 underline-offset-2 hover:text-amber-300 hover:underline"
                  >
                    ⚡ 通本章
                  </button>
                  <button
                    type="button"
                    onClick={devClearVolume}
                    className="font-mono text-[10px] tracking-wide text-amber-400 underline-offset-2 hover:text-amber-300 hover:underline"
                  >
                    ⚡ 卷一通
                  </button>
                </>
              ) : null}
              <button
                type="button"
                onClick={resetSave}
                className="font-mono text-[10px] tracking-wide text-muted-foreground underline-offset-2 hover:text-destructive hover:underline"
              >
                清空存档
              </button>
            </div>
          ) : null}
        </div>
        )
      }
    >
      {screen === 'prologue' && (
        <PrologueScreen
          player={player}
          setPlayer={setPlayer}
          onComplete={() => {
            setScreen('hub');
            pushNotice('欢迎来到异世界整备区。先走主线；猎装通关第一章才开。');
          }}
        />
      )}

      {screen === 'hub' && (
        <HubScreen
          player={player}
          setPlayer={setPlayer}
          onOpenGearDungeons={openGearDungeons}
          onStartChapterBattle={openChapterPrep}
          onOpenFormation={() => openFormation('hub')}
          pushNotice={pushNotice}
          onOpenParallelRealWorld={openParallelRealWorldFromHub}
        />
      )}

      {screen === 'gear_dungeons' && (
        <GearDungeonScreen
          player={player}
          recommendedPower={getChapterBand(player.chapterCleared ?? 0).recommendedPower}
          deployedPower={deployedPartyPower(player)}
          onBack={() => setScreen('hub')}
          onEnter={(dungeonId) => openDungeonPrep(dungeonId, 'gear_dungeons')}
        />
      )}

      {screen === 'battle_prep' && battlePrep && (
        <BattlePrepScreen
          player={player}
          setPlayer={setPlayer}
          config={battlePrep}
          pushNotice={pushNotice}
          onBack={() => {
            setBattlePrep(null);
            setScreen(prepReturnScreenRef.current);
          }}
          onConfirmStart={commitBattleStart}
        />
      )}

      {screen === 'battle' && battle && (
        <BattleScreen
          battle={battle}
          playing={playing}
          speed={battleSpeed}
          onSpeed={setBattlePlaybackSpeed}
          onSkip={skipBattleToResult}
          onDevInstantWin={import.meta.env.DEV ? devInstantWinBattle : undefined}
        />
      )}

      {screen === 'result' && battle && (
        <ResultScreen
          player={player}
          battle={battle}
          settlement={lastSettlement}
          dungeonName={dungeonName}
          battleSource={battleSourceRef.current}
          chapterNextBattleHint={chapterNextBattleHint}
          setPlayer={setPlayer}
          onRestartBattle={restartBattlePrep}
          onBackToHub={handleBackToHub}
          onGoGacha={() => setScreen('gacha')}
          onGoGear={openGearDungeons}
          pushNotice={pushNotice}
        />
      )}

      {screen === 'gacha' && (
        <GachaScreen
          player={player}
          setPlayer={setPlayer}
          onBack={() => setScreen('hub')}
          pushNotice={pushNotice}
        />
      )}

      {screen === 'bag' && (
        <InventoryPanel
          player={player}
          setPlayer={setPlayer}
          onBack={() => setScreen('hub')}
          pushNotice={pushNotice}
        />
      )}

      {screen === 'characters' && (
        <CharacterList
          player={player}
          onOpen={(id) => openCharacter(id, 'characters')}
          onOpenFormation={() => openFormation('characters')}
          onNotice={pushNotice}
        />
      )}

      {screen === 'formation' && (
        <FormationScreen
          player={player}
          setPlayer={setPlayer}
          onBack={() => setScreen(formationBack)}
          onOpenCharacter={(id) => openCharacter(id, 'formation')}
          pushNotice={pushNotice}
        />
      )}

      {screen === 'character' && selectedId && (
        <CharacterSheet
          player={player}
          templateId={selectedId}
          setPlayer={setPlayer}
          onBack={() =>
            setScreen(
              characterBack === 'hub'
                ? 'hub'
                : characterBack === 'formation'
                  ? 'formation'
                  : 'characters',
            )
          }
          onNotice={pushNotice}
          onGoGacha={() => setScreen('gacha')}
        />
      )}

      {activeParallelArcId &&
      screen === 'hub' &&
      player.narrative?.parallelArcReports?.[activeParallelArcId] ? (
        <ParallelArcScreen
          report={player.narrative.parallelArcReports[activeParallelArcId]!}
          previousReport={
            previousParallelArcId(activeParallelArcId)
              ? player.narrative?.parallelArcReports?.[previousParallelArcId(activeParallelArcId)!] ??
                null
              : null
          }
          player={player}
          heroName={player.narrative?.heroName}
          onContinue={() => closeParallelArc(true)}
          onLater={() => closeParallelArc(false)}
        />
      ) : null}
    </GameShell>
  );
}
