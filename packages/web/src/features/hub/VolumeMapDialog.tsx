import {
  defaultReachableLocationId,
  getVolumeMapView,
  mapLocationById,
  type PlayerState,
  type SpineLocationId,
} from '@moyu/game-core';
import { useEffect, useMemo, useState } from 'react';
import { initialMapSelection, VolumeMapWorldPane } from './VolumeMapWorldPane';

type VolumeMapDialogProps = {
  player: PlayerState;
  open: boolean;
  onClose: () => void;
  onMapNotice?: (message: string) => void;
};

export function VolumeMapDialog({
  player,
  open,
  onClose,
  onMapNotice,
}: VolumeMapDialogProps) {
  const [selectedLocationId, setSelectedLocationId] = useState<SpineLocationId | null>(null);

  const map = useMemo(() => (open ? getVolumeMapView(player) : null), [open, player]);

  const storyLocationId = map ? defaultReachableLocationId(map) : null;
  const selectedLoc =
    map && selectedLocationId ? mapLocationById(map, selectedLocationId) : null;
  const onStoryFocus =
    storyLocationId != null && selectedLocationId != null && storyLocationId === selectedLocationId;

  const contextLine = selectedLoc
    ? `${selectedLoc.townDisplayName} · ${selectedLoc.displayName}`
    : map?.currentTownDisplay
      ? `${map.currentTownDisplay}${map.currentLocationDisplay ? ` · ${map.currentLocationDisplay}` : ''}`
      : '卷一旅途';

  useEffect(() => {
    if (!open) return;
    setSelectedLocationId(initialMapSelection(player));
  }, [open, player]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !map) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal
        aria-label="卷一地图"
        className="flex max-h-[min(88vh,36rem)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-border/80 bg-[#0a0e14] shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex shrink-0 items-center gap-2 border-b border-border/50 px-3 py-2.5">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-base tracking-wide leading-tight">地图</h2>
            <p className="truncate font-mono text-[9px] text-muted-foreground">{contextLine}</p>
          </div>
          {storyLocationId && !onStoryFocus ? (
            <button
              type="button"
              onClick={() => setSelectedLocationId(storyLocationId)}
              className="shrink-0 rounded-md border border-primary/35 bg-primary/10 px-2 py-1 font-mono text-[9px] text-primary hover:bg-primary/18"
            >
              主线处
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md border border-border/60 px-2.5 py-1 font-mono text-[10px] text-muted-foreground hover:border-primary/40 hover:text-foreground"
          >
            关闭
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          <VolumeMapWorldPane
            player={player}
            selectedLocationId={selectedLocationId}
            onSelectLocation={setSelectedLocationId}
            onMapNotice={onMapNotice}
          />
        </div>
      </div>
    </div>
  );
}
