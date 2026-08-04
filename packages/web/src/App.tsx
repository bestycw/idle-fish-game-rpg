import {
  buildPlayerParty,
  chapterProgressLabel,
  completeChapterBattle,
  createBattle,
  currentChapterEncounterIndex,
  getDungeon,
  grantDungeonReward,
  loadOrCreatePlayer,
  persistPlayer,
  pickUnlockedEncounterIndex,
  pressureForDungeon,
  staminaCostForDungeon,
  stepBattle,
  syncStamina,
  trySpendStamina,
  type ActionKind,
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
import { CharacterList, CharacterSheet } from './features/character/CharacterScreens';
import { FormationScreen } from './features/character/FormationScreen';
import { HubScreen } from './features/hub/HubScreen';
import { GachaScreen } from './features/gacha/GachaScreen';
import { InventoryPanel } from './features/inventory/InventoryPanel';
import { ResultScreen } from './features/result/ResultScreen';

type Screen =
  | 'hub'
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
const BATTLE_TICK_MS = 280;

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
  const [formationBack, setFormationBack] = useState<'hub' | 'characters'>('characters');
  const [notice, setNotice] = useState<string | null>(null);

  const timerRef = useRef<number | null>(null);
  const battleRef = useRef<BattleState | null>(null);
  const playerRef = useRef(player);
  const heroManualRef = useRef(player.heroManual);
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
    heroManualRef.current = player.heroManual;
  }, [player]);

  useEffect(() => {
    dungeonRef.current = activeDungeonId;
  }, [activeDungeonId]);

  useEffect(() => {
    persistPlayer(localSaveAdapter, player);
  }, [player]);

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
    if (cur.awaitingHeroAction) {
      stopPlayback();
      return;
    }

    const next = stepBattle(cur, playerRef.current.seed, {
      heroManual: heroManualRef.current,
    });
    battleRef.current = next;
    setBattle({ ...next, log: [...next.log], events: [...next.events] });

    if (next.status !== 'ongoing') {
      finishBattle(next, playerRef.current);
      return;
    }
    if (next.awaitingHeroAction) {
      stopPlayback();
    }
  };

  const startPlayback = () => {
    stopPlayback();
    setPlaying(true);
    timerRef.current = window.setInterval(tick, BATTLE_TICK_MS);
  };

  const startBattle = (dungeonId: DungeonId = DEFAULT_BATTLE_DUNGEON) => {
    stopPlayback();
    const dungeon = getDungeon(dungeonId);
    if (dungeon.runMode !== 'battle') return;
    const spend = trySpendStamina(player, staminaCostForDungeon(dungeonId));
    if (!spend.ok) {
      pushNotice(spend.message);
      setPlayer(spend.state);
      return;
    }
    setPlayer(spend.state);
    const party = buildPlayerParty(spend.state);
    if (party.length === 0) {
      pushNotice('阵上无人，先去布阵。');
      return;
    }
    battleSourceRef.current = 'dungeon';
    setActiveDungeonId(dungeonId);
    dungeonRef.current = dungeonId;
    const encIdx = pickUnlockedEncounterIndex(spend.state, dungeonId, spend.state.encounterIndex);
    const initial = createBattle(party, spend.state.seed + spend.state.wins, encIdx, {
      pressure: pressureForDungeon(dungeonId),
    });
    battleRef.current = initial;
    setBattle(initial);
    setLastLoot(null);
    setScreen('battle');
    startPlayback();
  };

  const startChapterBattle = () => {
    stopPlayback();
    const encIdx = currentChapterEncounterIndex(player);
    if (encIdx == null) {
      pushNotice('当前不是章节战斗节点。');
      return;
    }
    const party = buildPlayerParty(player);
    if (party.length === 0) {
      pushNotice('阵上无人，先去布阵。');
      return;
    }
    battleSourceRef.current = 'chapter';
    setActiveDungeonId(DEFAULT_BATTLE_DUNGEON);
    dungeonRef.current = DEFAULT_BATTLE_DUNGEON;
    const initial = createBattle(party, player.seed + player.wins + 1000, encIdx);
    battleRef.current = initial;
    setBattle(initial);
    setLastLoot(null);
    setScreen('battle');
    startPlayback();
  };

  const submitHeroAction = (kind: ActionKind) => {
    const cur = battleRef.current;
    if (!cur?.awaitingHeroAction) return;
    const next = stepBattle(cur, playerRef.current.seed, {
      heroManual: true,
      heroAction: kind,
    });
    battleRef.current = next;
    setBattle({ ...next, log: [...next.log], events: [...next.events] });
    if (next.status !== 'ongoing') {
      finishBattle(next, playerRef.current);
      return;
    }
    startPlayback();
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

  const handleHeroManualAuto = () => {
    setPlayer((p) => ({ ...p, heroManual: false }));
    heroManualRef.current = false;
    const cur = battleRef.current;
    if (cur?.awaitingHeroAction) {
      const next = stepBattle(cur, playerRef.current.seed, { heroManual: false });
      battleRef.current = next;
      setBattle({ ...next, log: [...next.log], events: [...next.events] });
      if (next.status !== 'ongoing') {
        finishBattle(next, playerRef.current);
      } else {
        startPlayback();
      }
    } else if (!playing && screen === 'battle') {
      startPlayback();
    }
  };

  const handleHeroManualManual = () => {
    setPlayer((p) => ({ ...p, heroManual: true }));
    heroManualRef.current = true;
    pushNotice('主角改为手动：轮到时暂停选招。');
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

  const openFormation = (back: 'hub' | 'characters' = 'characters') => {
    setFormationBack(back);
    setScreen('formation');
  };

  const dungeonName =
    battleSourceRef.current === 'chapter' ? '主线节点' : getDungeon(activeDungeonId).name;

  const subtitle =
    screen === 'battle'
      ? '战报翻页中'
      : screen === 'result'
        ? '尘埃落定'
        : screen === 'formation'
          ? '九宫站位'
          : '摸鱼十分钟 · 布阵刷装';

  const showDock = screen !== 'battle' && screen !== 'result';
  const onNav = (tab: NavTab) => {
    stopPlayback();
    if (tab === 'hub') setScreen('hub');
    else if (tab === 'gacha') setScreen('gacha');
    else if (tab === 'characters') setScreen('characters');
    else setScreen('bag');
  };

  return (
    <GameShell
      subtitle={subtitle}
      layout={
        screen === 'battle' || screen === 'character' || screen === 'formation' ? 'focus' : 'home'
      }
      hideBrand={screen === 'character' || screen === 'formation'}
      notice={notice}
      dock={
        showDock ? (
          <BottomNav active={screenToTab(screen)} onChange={onNav} />
        ) : undefined
      }
      status={
        <div className="space-y-1.5">
          <StatusBar
            player={player}
            chapterLabel={chapterProgressLabel(player)}
            onMail={() => pushNotice('邮件后置：系统信件将挂在顶栏。')}
            onSettings={() => {
              if (screen === 'hub') {
                pushNotice('设置后置。可用下方「清空存档」重置 Demo。');
              } else {
                pushNotice('设置后置；清档请回冒险页。');
              }
            }}
          />
          {screen === 'hub' ? (
            <div className="flex justify-end">
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
          onStartGearTrial={() => startBattle('gear_trial')}
          onStartAbyssMirror={() => startBattle('abyss_mirror')}
          onStartChapterBattle={startChapterBattle}
          onOpenFormation={() => openFormation('hub')}
          pushNotice={pushNotice}
        />
      )}

      {screen === 'battle' && battle && (
        <BattleScreen
          player={player}
          battle={battle}
          playing={playing}
          onSubmitHeroAction={submitHeroAction}
          onHeroManualAuto={handleHeroManualAuto}
          onHeroManualManual={handleHeroManualManual}
        />
      )}

      {screen === 'result' && battle && (
        <ResultScreen
          battle={battle}
          lastLoot={lastLoot}
          dungeonName={dungeonName}
          setPlayer={setPlayer}
          onRestartBattle={() =>
            battleSourceRef.current === 'chapter' ? startChapterBattle() : startBattle(activeDungeonId)
          }
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
