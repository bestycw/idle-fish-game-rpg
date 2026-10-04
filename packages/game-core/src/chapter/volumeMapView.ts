/**
 * 卷一简图：城镇 + 10 地点 · 可点选详情（非自由走动）
 */

import type { PlayerState } from '../shared/types.js';
import { narrativeWorldPreset } from '../narrative/onboarding.js';
import { SPINE_LOCATIONS, SPINE_TOWN_IDS } from '../narrative/worldSpine.js';
import { resolveLocationDisplay, resolveTownDisplay } from '../narrative/worldSpine.js';
import { resolveWorldSkinNames } from '../narrative/worldSkinNamesResolve.js';
import {
  VOLUME1_BEATS,
  volumeBeatForChapter,
  type SpineLocationId,
  type SpineTownId,
} from '../narrative/volumeBeats.js';
import { maxChapterOrder } from './defs.js';

export type MapLocationStatus = 'cleared' | 'current' | 'ahead';

export interface VolumeMapLocationRow {
  locationId: SpineLocationId;
  chapterOrder: number;
  displayName: string;
  townDisplayName: string;
  beatTitle: string;
  beatSummary: string;
  status: MapLocationStatus;
}

/** 城镇下辖主场景（与章 progress 绑定） */
export interface VolumeMapTownScene {
  locationId: SpineLocationId;
  chapterOrder: number;
  displayName: string;
  beatTitle: string;
  beatSummary: string;
  status: MapLocationStatus;
  /** 主线已推进到此章 · 可点选 */
  reachable: boolean;
}

export interface VolumeMapTownRow {
  townId: SpineTownId;
  displayName: string;
  status: MapLocationStatus;
  /** 至少有一场景可抵达 */
  reachable: boolean;
  scenes: VolumeMapTownScene[];
}

export interface VolumeMapView {
  currentChapterOrder: number;
  currentTownDisplay: string | null;
  currentLocationDisplay: string | null;
  towns: VolumeMapTownRow[];
  locations: VolumeMapLocationRow[];
  finished: boolean;
}

function chapterStatus(
  chapterOrder: number,
  cleared: number,
  currentChapterOrder: number,
  finished: boolean,
): MapLocationStatus {
  if (finished || chapterOrder <= cleared) return 'cleared';
  if (chapterOrder === currentChapterOrder) return 'current';
  return 'ahead';
}

function townStatus(
  chapterOrders: number[],
  cleared: number,
  currentChapterOrder: number,
  finished: boolean,
): MapLocationStatus {
  if (chapterOrders.includes(currentChapterOrder) && !finished) return 'current';
  const maxInTown = Math.max(...chapterOrders);
  if (finished || maxInTown <= cleared) return 'cleared';
  const minInTown = Math.min(...chapterOrders);
  if (minInTown > currentChapterOrder) return 'ahead';
  return 'current';
}

export function getVolumeMapView(state: PlayerState): VolumeMapView {
  const cleared = Math.max(0, state.chapterCleared ?? 0);
  const maxOrder = maxChapterOrder();
  const finished = cleared >= maxOrder;
  const currentChapterOrder = finished ? maxOrder : cleared + 1;
  const preset = narrativeWorldPreset(state);
  const names = resolveWorldSkinNames(state);

  const beat = volumeBeatForChapter(currentChapterOrder);
  const currentTownDisplay = beat
    ? resolveTownDisplay(preset, beat.primaryTown, names?.towns)
    : null;
  const currentLocationDisplay = beat
    ? resolveLocationDisplay(preset, beat.primaryLocation, names?.locations)
    : null;

  const locations: VolumeMapLocationRow[] = SPINE_LOCATIONS.map((loc) => {
    const chapterBeat = volumeBeatForChapter(loc.chapterOrder)!;
    return {
      locationId: loc.id,
      chapterOrder: loc.chapterOrder,
      displayName: resolveLocationDisplay(preset, loc.id, names?.locations),
      townDisplayName: resolveTownDisplay(
        preset,
        chapterBeat.primaryTown,
        names?.towns,
      ),
      beatTitle: chapterBeat.beatTitle,
      beatSummary: chapterBeat.beatSummary,
      status: chapterStatus(loc.chapterOrder, cleared, currentChapterOrder, finished),
    };
  });

  const towns: VolumeMapTownRow[] = SPINE_TOWN_IDS.map((townId) => {
    const chapters = VOLUME1_BEATS.filter((b) => b.primaryTown === townId);
    const chapterOrders = chapters.map((b) => b.chapterOrder);
    const status = townStatus(chapterOrders, cleared, currentChapterOrder, finished);
    const scenes: VolumeMapTownScene[] = chapters.map((b) => {
      const st = chapterStatus(b.chapterOrder, cleared, currentChapterOrder, finished);
      return {
        locationId: b.primaryLocation,
        chapterOrder: b.chapterOrder,
        displayName: resolveLocationDisplay(preset, b.primaryLocation, names?.locations),
        beatTitle: b.beatTitle,
        beatSummary: b.beatSummary,
        status: st,
        reachable: st !== 'ahead',
      };
    });
    return {
      townId,
      displayName: resolveTownDisplay(preset, townId, names?.towns),
      status,
      reachable: status !== 'ahead',
      scenes,
    };
  });

  return {
    currentChapterOrder,
    currentTownDisplay,
    currentLocationDisplay,
    towns,
    locations,
    finished,
  };
}

export function mapLocationById(
  view: VolumeMapView,
  locationId: SpineLocationId,
): VolumeMapLocationRow | undefined {
  return view.locations.find((l) => l.locationId === locationId);
}

export function mapTownById(
  view: VolumeMapView,
  townId: SpineTownId,
): VolumeMapTownRow | undefined {
  return view.towns.find((t) => t.townId === townId);
}

/** 默认选中：当前主场景 */
export function defaultReachableLocationId(view: VolumeMapView): SpineLocationId | null {
  const current = view.locations.find((l) => l.status === 'current');
  if (current) return current.locationId;
  const lastCleared = [...view.locations].reverse().find((l) => l.status === 'cleared');
  return lastCleared?.locationId ?? null;
}
