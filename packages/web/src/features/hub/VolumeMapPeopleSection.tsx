import type { ChapterSceneNpc, PlayerState, SpineTownId, TownHubNpcView, TownNpcKind } from '@moyu/game-core';
import {
  getVolumeMapView,
  listSceneNpcsForChapterOrder,
  listTownHubNpcs,
  mapLocationById,
  type SpineLocationId,
} from '@moyu/game-core';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { mapPersonKindClass, mapPersonKindGlyph } from './mapPersonKind';
import { TownMerchantShell } from './town/TownMerchantShell';
import { TownServiceShell } from './town/TownServiceShell';
import { NpcFlavorDialogue } from './NpcFlavorDialogue';
import { TownNpcActionSheet } from './town/TownNpcActionSheet';

type Shell =
  | { type: 'chat'; name: string; epithet: string | null; lines: string[] }
  | { type: 'merchant'; npc: TownHubNpcView }
  | { type: 'quest' }
  | { type: 'inn' };

type MapPerson =
  | { key: string; source: 'scene'; scene: ChapterSceneNpc; town?: TownHubNpcView }
  | { key: string; source: 'town'; town: TownHubNpcView };

function mergePeople(scene: ChapterSceneNpc[], town: TownHubNpcView[]): MapPerson[] {
  const out: MapPerson[] = [];
  const townByName = new Map(town.map((t) => [t.name, t]));

  for (const s of scene) {
    const hub = townByName.get(s.name);
    if (hub) townByName.delete(s.name);
    out.push({
      key: hub ? `both-${hub.id}` : `scene-${s.slot}`,
      source: 'scene',
      scene: s,
      town: hub,
    });
  }
  for (const t of townByName.values()) {
    out.push({ key: `town-${t.id}`, source: 'town', town: t });
  }
  return out;
}

function personHub(person: MapPerson): TownHubNpcView | undefined {
  return person.source === 'town' ? person.town : person.town;
}

function personKind(person: MapPerson): TownNpcKind | 'scene' {
  return personHub(person)?.kind ?? 'scene';
}

function personName(person: MapPerson): string {
  const hub = personHub(person);
  if (hub) return hub.name;
  if (person.source === 'scene') return person.scene.name;
  return '';
}

function personEpithet(person: MapPerson): string | null {
  const hub = personHub(person);
  if (hub?.epithet) return hub.epithet;
  if (person.source === 'scene') {
    return person.scene.epithet ?? person.scene.roleLabel;
  }
  return hub?.roleLabel ?? null;
}

type VolumeMapPeopleSectionProps = {
  player: PlayerState;
  townId: SpineTownId;
  /** 用于拉当章剧情人物；无则只列本城常驻 */
  sceneLocationId: SpineLocationId | null;
};

export function VolumeMapPeopleSection({
  player,
  townId,
  sceneLocationId,
}: VolumeMapPeopleSectionProps) {
  const map = getVolumeMapView(player);
  const loc = sceneLocationId ? mapLocationById(map, sceneLocationId) : null;

  const sceneNpcs = useMemo(() => {
    if (!loc || loc.status === 'ahead') return [];
    return listSceneNpcsForChapterOrder(player, loc.chapterOrder);
  }, [player, loc]);

  const townNpcs = useMemo(() => listTownHubNpcs(player, townId), [player, townId]);

  const people = useMemo(() => mergePeople(sceneNpcs, townNpcs), [sceneNpcs, townNpcs]);

  const [picker, setPicker] = useState<TownHubNpcView | null>(null);
  const [shell, setShell] = useState<Shell | null>(null);

  const openPerson = (person: MapPerson) => {
    const hub = personHub(person);
    if (hub) {
      if (hub.kind === 'flavor' || hub.kind === 'story') {
        setShell({
          type: 'chat',
          name: hub.name,
          epithet: hub.epithet,
          lines: hub.lines,
        });
        return;
      }
      setPicker(hub);
      return;
    }
    if (person.source !== 'scene') return;
    const s = person.scene;
    setShell({
      type: 'chat',
      name: s.name,
      epithet: s.epithet,
      lines: s.lines,
    });
  };

  if (people.length === 0) {
    return (
      <div className="border-t border-border/35 px-2 py-1.5">
        <p className="font-mono text-[9px] text-muted-foreground">本城人物尚未露面，继续推主线。</p>
      </div>
    );
  }

  return (
    <>
      <div className="border-t border-border/35 bg-card/20 px-2 py-1.5">
        <p className="mb-1 font-mono text-[8px] text-muted-foreground">
          人物 <span className="text-foreground/75">{people.length}</span>
          {loc && loc.status !== 'ahead' ? (
            <span className="text-muted-foreground/80"> · 按第{loc.chapterOrder}章场景</span>
          ) : null}
        </p>

        <div
          className="max-h-[5.5rem] overflow-y-auto overflow-x-hidden pr-0.5 [-ms-overflow-style:none] [scrollbar-width:thin]"
          role="list"
          aria-label={`${people.length} 位可交谈人物`}
        >
          <div className="flex flex-wrap gap-1">
            {people.map((person) => {
              const kind = personKind(person);
              const hub = personHub(person);
              const name = personName(person);
              const epithet = personEpithet(person);
              const locked = hub?.kind === 'merchant' && hub.merchantShell?.locked;

              return (
                <button
                  key={person.key}
                  type="button"
                  role="listitem"
                  title={epithet ? `${name} · ${epithet}` : name}
                  onClick={() => openPerson(person)}
                  className={cn(
                    'inline-flex max-w-full items-center gap-0.5 rounded border px-1.5 py-0.5',
                    'text-left transition hover:brightness-110 active:scale-[0.98]',
                    mapPersonKindClass(kind),
                    locked && 'opacity-75',
                  )}
                >
                  <span className="shrink-0 font-mono text-[8px] leading-none opacity-85">
                    {mapPersonKindGlyph(kind)}
                  </span>
                  <span className="truncate text-[10px] font-medium leading-tight">{name}</span>
                  {locked ? (
                    <span className="shrink-0 font-mono text-[7px] opacity-80">锁</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {picker ? (
        <TownNpcActionSheet
          npc={picker}
          onClose={() => setPicker(null)}
          onTalk={() => {
            const n = picker;
            setPicker(null);
            setShell({ type: 'chat', name: n.name, epithet: n.epithet, lines: n.lines });
          }}
          onService={() => {
            const n = picker;
            setPicker(null);
            if (n.kind === 'merchant') setShell({ type: 'merchant', npc: n });
            else if (n.kind === 'quest') setShell({ type: 'quest' });
            else if (n.kind === 'inn') setShell({ type: 'inn' });
          }}
        />
      ) : null}

      {shell?.type === 'chat' ? (
        <NpcFlavorDialogue
          npcName={shell.name}
          epithet={shell.epithet}
          lines={shell.lines}
          onClose={() => setShell(null)}
        />
      ) : null}

      {shell?.type === 'merchant' ? (
        <TownMerchantShell
          shopName={shell.npc.name}
          locked={shell.npc.merchantShell?.locked ?? false}
          lockedHint={shell.npc.merchantShell?.lockedHint ?? '尚未开放'}
          onClose={() => setShell(null)}
        />
      ) : null}

      {shell?.type === 'quest' ? (
        <TownServiceShell
          subtitle="悬赏 · 筹备中"
          title="告示板"
          body="支线与日常委托将挂在这里。引擎任务系统接入后，可接取、追踪与交付；目前请先走主线与猎装本。"
          onClose={() => setShell(null)}
        />
      ) : null}

      {shell?.type === 'inn' ? (
        <TownServiceShell
          subtitle="驿舍 · 筹备中"
          title="歇脚"
          body="将来可在此恢复体力或触发短休剧情。当前不影响战斗与体力规则。"
          onClose={() => setShell(null)}
        />
      ) : null}
    </>
  );
}
