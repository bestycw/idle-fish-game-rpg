import {
  buildPlayerParty,
  chapterProgressLabel,
  completeChapterBattle,
  currentChapterEncounterIndex,
  getDungeon,
  grantDungeonReward,
  grantSampleEquipment,
  loadOrCreatePlayer,
  persistPlayer,
  pickUnlockedEncounterIndex,
  staminaCostForDungeon,
  runAutoBattle,
  stepBattle,
  syncStamina,
  trySpendStamina,
  STAMINA_MAX,
  UNIT_TEMPLATES,
  type BattleState,
  type DungeonId,
  type Equipment,
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
import { GachaScreen } from './features/gacha/GachaScreen';
import { InventoryPanel } from './features/inventory/InventoryPanel';
import { ResultScreen } from './features/result/ResultScreen';

type Screen =
  | 'hub'
  | 'battle_prep'
  | 'battle'
  | 'result'
  | 'characters'
  | 'character'
  | 'formation'
  | 'gacha'
  | 'bag';
type BattleSource = 'dungeon' | 'chapter';

function screenToTab(screen: Screen): NavTab {
  if (screen === 'gacha') return 'gacha';
  if (screen === 'characters' || screen === 'character' || screen === 'formation') return 'characters';
  if (screen === 'bag') return 'bag';
  return 'hub';
}

const DEFAULT_BATTLE_DUNGEON: DungeonId = 'gear_trial';
const BATTLE_BASE_TICK_MS = 380;

export default function App() {
  const [player, setPlayer] = useState<PlayerState>(() => loadOrCreatePlayer(localSaveAdapter));
  const [screen, setScreen] = useState<Screen>('hub');
  const [selectedId, setSelectedId] = useState<string | null>('hero');
  const [battle, setBattle] = useState<BattleState | null>(null);
  const [lastLoot, setLastLoot] = useState<Equipment | null>(null);
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

  const timerRef = useRef<number | null>(null);
  const battleSpeedRef = useRef<BattleSpeed>(1);
  const battleRef = useRef<BattleState | null>(null);
  const playerRef = useRef(player);
  const dungeonRef = useRef<DungeonId>(activeDungeonId);
  const battleSourceRef = useRef<BattleSource>('dungeon');
  const noticeTimerRef = useRef<number | null>(null);

  const pushNotice = (msg: string) => {
    setNotice(msg);
    if (noticeTimerRef.current != null) window.clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = window.setTimeout(() => setNotice(null), 4200);
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
    setPlayer((p) => grantSampleEquipment(p));
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

  const finishBattle = (finalState: BattleState, basePlayer: PlayerState) => {
    stopPlayback();
    battleRef.current = finalState;
    setBattle(finalState);
    if (finalState.status === 'won') {
      if (battleSourceRef.current === 'chapter') {
        const done = completeChapterBattle(basePlayer);
        if (done.ok) {
          setPlayer(done.state);
          pushNotice(done.message);
        }
        setLastLoot(null);
      } else {
        const { state, loot } = grantDungeonReward(basePlayer, dungeonRef.current);
        setPlayer(state);
        setLastLoot(loot);
        if (loot) pushNotice(`掉落 ${loot.name}`);
      }
    } else {
      setLastLoot(null);
      if (finalState.defeatHint) pushNotice(finalState.defeatHint);
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

  const openDungeonPrep = (dungeonId: DungeonId = DEFAULT_BATTLE_DUNGEON) => {
    stopPlayback();
    const dungeon = getDungeon(dungeonId);
    if (dungeon.runMode !== 'battle') return;
    const encIdx = pickUnlockedEncounterIndex(player, dungeonId, player.encounterIndex);
    battleSourceRef.current = 'dungeon';
    setActiveDungeonId(dungeonId);
    dungeonRef.current = dungeonId;
    setBattlePrep({ kind: 'dungeon', dungeonId, encounterIndex: encIdx });
    setScreen('battle_prep');
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
    setLastLoot(null);
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
      openDungeonPrep(activeDungeonId);
    }
  };

  const resetSave = () => {
    stopPlayback();
    localSaveAdapter.clear();
    const fresh = loadOrCreatePlayer(localSaveAdapter);
    setPlayer(fresh);
    battleRef.current = null;
    setBattle(null);
    setLastLoot(null);
    setActiveDungeonId(DEFAULT_BATTLE_DUNGEON);
    setScreen('hub');
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
      return grantSampleEquipment(next, { replace: true });
    });
    pushNotice('🔧 DEV：全资源拉满（含样装/强化石/宝石/形态石）');
  };

  const handleBackToHub = () => {
    stopPlayback();
    setScreen('hub');
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
    setFormationBack(back);
    setScreen('formation');
  };

  const dungeonName =
    battleSourceRef.current === 'chapter' ? '主线节点' : getDungeon(activeDungeonId).name;

  const subtitle =
    screen === 'battle'
      ? '战报翻页中'
      : screen === 'battle_prep'
        ? '战前整备'
      : screen === 'result'
        ? '尘埃落定'
        : screen === 'formation'
          ? '九宫站位'
          : screen === 'bag'
            ? '行囊'
            : '布阵刷装 · 摸鱼深构筑';

  const combatFocus =
    screen === 'battle_prep' || screen === 'battle' || screen === 'result';
  const showDock = screen !== 'battle' && screen !== 'battle_prep' && screen !== 'result';
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
        screen === 'battle' ||
        screen === 'battle_prep' ||
        screen === 'result' ||
        screen === 'character' ||
        screen === 'formation' ||
        screen === 'bag'
      }
      notice={notice}
      dock={
        showDock ? (
          <BottomNav active={screenToTab(screen)} onChange={onNav} />
        ) : undefined
      }
      className={combatFocus ? 'pt-2 sm:pt-2' : undefined}
      status={
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
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={devGrantAll}
                className="font-mono text-[10px] tracking-wide text-amber-400 underline-offset-2 hover:text-amber-300 hover:underline"
              >
                🔧 资源拉满
              </button>
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
      }
    >
      {screen === 'hub' && (
        <HubScreen
          player={player}
          setPlayer={setPlayer}
          onStartGearTrial={() => openDungeonPrep('gear_trial')}
          onStartAbyssMirror={() => openDungeonPrep('abyss_mirror')}
          onStartChapterBattle={openChapterPrep}
          onOpenFormation={() => openFormation('hub')}
          pushNotice={pushNotice}
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
            setScreen('hub');
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
        />
      )}

      {screen === 'result' && battle && (
        <ResultScreen
          battle={battle}
          lastLoot={lastLoot}
          dungeonName={dungeonName}
          setPlayer={setPlayer}
          onRestartBattle={restartBattlePrep}
          onBackToHub={handleBackToHub}
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
    </GameShell>
  );
}
