import {
  defaultReachableLocationId,
  getVolumeMapView,
  listTownHubNpcs,
  mapLocationById,
  type PlayerState,
  type SpineLocationId,
  type SpineTownId,
  type VolumeMapView,
} from '@moyu/game-core';
import { cn } from '@/lib/utils';
import { useEffect, useMemo, useState } from 'react';
import { VolumeMapPeopleSection } from './VolumeMapPeopleSection';

type VolumeMapWorldPaneProps = {
  player: PlayerState;
  selectedLocationId: SpineLocationId | null;
  onSelectLocation: (locationId: SpineLocationId) => void;
  onMapNotice?: (message: string) => void;
};

function statusLabel(status: string): string {
  if (status === 'current') return '当前';
  if (status === 'cleared') return '已过';
  return '锁';
}

function townForLocation(map: VolumeMapView, locationId: SpineLocationId): SpineTownId | null {
  for (const town of map.towns) {
    if (town.scenes.some((s) => s.locationId === locationId)) return town.townId;
  }
  return null;
}

type MapTown = VolumeMapView['towns'][number];

function sceneLocationForTown(
  town: MapTown,
  selectedLocationId: SpineLocationId | null,
): SpineLocationId | null {
  const ok = (id: SpineLocationId) => {
    const s = town.scenes.find((sc) => sc.locationId === id);
    return s && s.reachable && s.status !== 'ahead' ? id : null;
  };
  if (selectedLocationId) {
    const hit = ok(selectedLocationId);
    if (hit) return hit;
  }
  const current = town.scenes.find((s) => s.status === 'current' && s.reachable);
  if (current) return current.locationId;
  const cleared = town.scenes.filter((s) => s.reachable && s.status === 'cleared');
  if (cleared.length) return cleared[cleared.length - 1]!.locationId;
  const first = town.scenes.find((s) => s.reachable && s.status !== 'ahead');
  return first?.locationId ?? null;
}

function primaryExpandedTownId(map: VolumeMapView): SpineTownId | null {
  const current = map.towns.find((t) => t.status === 'current');
  if (current) return current.townId;
  const reachable = map.towns.filter((t) => t.reachable);
  if (reachable.length > 0) return reachable[reachable.length - 1]!.townId;
  return null;
}

function defaultExpandedTownIds(map: VolumeMapView): Set<SpineTownId> {
  const id = primaryExpandedTownId(map);
  return id ? new Set([id]) : new Set();
}

function addTownId(prev: Set<SpineTownId>, townId: SpineTownId): Set<SpineTownId> {
  if (prev.has(townId)) return prev;
  const next = new Set(prev);
  next.add(townId);
  return next;
}

function townProgressLabel(town: MapTown): string {
  const reachable = town.scenes.filter((s) => s.reachable);
  const cleared = reachable.filter((s) => s.status === 'cleared').length;
  if (!town.reachable) return '未到';
  if (town.status === 'current') return '途经';
  return `${cleared}/${reachable.length}`;
}

export function VolumeMapWorldPane({
  player,
  selectedLocationId,
  onSelectLocation,
  onMapNotice,
}: VolumeMapWorldPaneProps) {
  const map = getVolumeMapView(player);
  const cleared = player.chapterCleared ?? 0;
  const hubCountByTown = useMemo(() => {
    const m = getVolumeMapView(player);
    const counts = new Map<SpineTownId, number>();
    for (const town of m.towns) {
      if (town.reachable) counts.set(town.townId, listTownHubNpcs(player, town.townId).length);
    }
    return counts;
  }, [cleared, player]);

  const [expandedTownIds, setExpandedTownIds] = useState<Set<SpineTownId>>(() =>
    defaultExpandedTownIds(map),
  );

  useEffect(() => {
    const m = getVolumeMapView(player);
    const id = primaryExpandedTownId(m);
    if (!id) return;
    setExpandedTownIds((prev) => addTownId(prev, id));
  }, [player.chapterCleared]);

  useEffect(() => {
    if (!selectedLocationId) return;
    const m = getVolumeMapView(player);
    const townId = townForLocation(m, selectedLocationId);
    if (!townId) return;
    setExpandedTownIds((prev) => addTownId(prev, townId));
  }, [selectedLocationId, player.chapterCleared]);

  const toggleTown = (townId: SpineTownId, reachable: boolean) => {
    if (!reachable) {
      onMapNotice?.('该城镇尚未随主线开放，继续推进主线即可抵达。');
      return;
    }
    setExpandedTownIds((prev) => {
      const next = new Set(prev);
      if (next.has(townId)) next.delete(townId);
      else next.add(townId);
      return next;
    });
  };

  return (
    <ul className="space-y-1.5" aria-label="卷一城镇">
      {map.towns.map((town) => {
        const expanded = expandedTownIds.has(town.townId);
        const sceneLocationId =
          expanded && town.reachable ? sceneLocationForTown(town, selectedLocationId) : null;
        const hubCount = hubCountByTown.get(town.townId) ?? 0;

        return (
          <li
            key={town.townId}
            className={cn(
              'overflow-hidden rounded-lg border',
              town.reachable ? 'border-border/65 bg-card/35' : 'border-border/35 bg-muted/10 opacity-70',
              expanded && town.reachable && 'ring-1 ring-primary/20',
            )}
          >
            <button
              type="button"
              onClick={() => toggleTown(town.townId, town.reachable)}
              className={cn(
                'flex w-full items-center gap-2 px-2.5 py-2 text-left transition',
                town.reachable && 'hover:bg-primary/5',
              )}
              aria-expanded={expanded}
            >
              <span
                className={cn(
                  'shrink-0 font-mono text-[9px] text-muted-foreground transition',
                  expanded && 'rotate-90',
                )}
                aria-hidden
              >
                ▶
              </span>
              <span className="min-w-0 flex-1 truncate font-display text-sm tracking-wide">
                {town.displayName}
              </span>
              {town.reachable && hubCount > 0 && !expanded ? (
                <span className="shrink-0 font-mono text-[8px] text-teal-300/75">{hubCount}人</span>
              ) : null}
              <span
                className={cn(
                  'shrink-0 rounded px-1.5 py-0.5 font-mono text-[8px]',
                  town.status === 'current' && 'bg-primary/20 text-primary',
                  town.status === 'cleared' && 'bg-muted/80 text-muted-foreground',
                  town.status === 'ahead' && 'bg-muted/60 text-muted-foreground',
                )}
              >
                {townProgressLabel(town)}
              </span>
            </button>

            {expanded && town.reachable ? (
              <div className="border-t border-border/35">
                <ul className="divide-y divide-border/25" aria-label="场景">
                  {town.scenes.map((scene) => {
                    const selected = selectedLocationId === scene.locationId;
                    const loc = mapLocationById(map, scene.locationId);
                    return (
                      <li key={scene.locationId}>
                        <button
                          type="button"
                          disabled={!scene.reachable}
                          onClick={() => {
                            if (!scene.reachable) {
                              onMapNotice?.(
                                `「${scene.displayName}」尚未随主线推进开放，请继续主线。`,
                              );
                              return;
                            }
                            onSelectLocation(scene.locationId);
                          }}
                          className={cn(
                            'flex w-full items-center gap-2 px-2 py-1.5 text-left transition',
                            scene.reachable && 'hover:bg-primary/6',
                            !scene.reachable && 'cursor-not-allowed opacity-60',
                            selected && scene.reachable && 'bg-primary/10',
                          )}
                        >
                          <span
                            className={cn(
                              'flex h-4 w-4 shrink-0 items-center justify-center rounded-full font-mono text-[8px]',
                              scene.status === 'current' && 'bg-primary text-primary-foreground',
                              scene.status === 'cleared' && 'bg-primary/25 text-primary',
                              scene.status === 'ahead' && 'bg-muted text-muted-foreground',
                            )}
                          >
                            {scene.status === 'cleared' ? '✓' : scene.status === 'current' ? '●' : '·'}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-baseline justify-between gap-1">
                              <span
                                className={cn(
                                  'truncate text-[11px] font-medium',
                                  scene.reachable ? 'text-foreground' : 'text-muted-foreground',
                                )}
                              >
                                {scene.displayName}
                              </span>
                              <span className="shrink-0 font-mono text-[8px] text-muted-foreground">
                                {statusLabel(scene.status)}
                              </span>
                            </span>
                            <span className="block truncate font-mono text-[8px] text-muted-foreground/90">
                              第{scene.chapterOrder}章 · {scene.beatTitle}
                            </span>
                            {selected && loc && scene.reachable ? (
                              <span className="mt-0.5 line-clamp-1 text-[10px] leading-snug text-foreground/70">
                                {loc.beatSummary}
                              </span>
                            ) : null}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <VolumeMapPeopleSection
                  player={player}
                  townId={town.townId}
                  sceneLocationId={sceneLocationId}
                />
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

export function initialMapSelection(player: PlayerState): SpineLocationId | null {
  const map = getVolumeMapView(player);
  return defaultReachableLocationId(map);
}
