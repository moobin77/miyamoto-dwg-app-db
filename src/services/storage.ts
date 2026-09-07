import { Drawing, OfflineQueueItem, DepartmentInfo, AttachedDrawingFile } from '../types';
import { INITIAL_DRAWINGS } from '../data/sampleDrawings';
import { INITIAL_DEPARTMENTS } from '../data/departmentsData';

const DRAWINGS_KEY = 'cloud_drawings_cache_v1';
const DEPARTMENTS_KEY = 'cloud_departments_cache_v1';
const QUEUE_KEY = 'cloud_drawings_offline_queue_v1';
const SETTINGS_KEY = 'cloud_drawings_station_settings_v1';

export interface StationSettings {
  operatorName: string;
  operatorId: string;
  stationLine: string;
  machineId: string;
  soundAlertsEnabled: boolean;
  theme: 'blueprint' | 'dark' | 'light';
}

export const DEFAULT_SETTINGS: StationSettings = {
  operatorName: 'อนันต์ ชัยเจริญ',
  operatorId: 'OP-4491',
  stationLine: 'Line PTS - Precision Turning',
  machineId: 'CNC-04',
  soundAlertsEnabled: true,
  theme: 'blueprint',
};

export function getLocalDepartments(): DepartmentInfo[] {
  try {
    const raw = localStorage.getItem(DEPARTMENTS_KEY);
    if (!raw) {
      saveLocalDepartments(INITIAL_DEPARTMENTS);
      return INITIAL_DEPARTMENTS;
    }
    const parsed = JSON.parse(raw);
    if (!parsed.find((d: any) => d.id === 'BOM')) {
      saveLocalDepartments(INITIAL_DEPARTMENTS);
      return INITIAL_DEPARTMENTS;
    }
    return parsed;
  } catch (e) {
    console.error('Failed to read local departments:', e);
    return INITIAL_DEPARTMENTS;
  }
}

export function saveLocalDepartments(departments: DepartmentInfo[]): void {
  try {
    localStorage.setItem(DEPARTMENTS_KEY, JSON.stringify(departments));
  } catch (e) {
    console.error('Failed to cache departments locally:', e);
  }
}

export function getLocalDrawings(): Drawing[] {
  try {
    const raw = localStorage.getItem(DRAWINGS_KEY);
    if (!raw) {
      saveLocalDrawings(INITIAL_DRAWINGS);
      return INITIAL_DRAWINGS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read local drawings:', e);
    return INITIAL_DRAWINGS;
  }
}

export function saveLocalDrawings(drawings: Drawing[]): void {
  try {
    // Strip giant dataUrls (>30KB) before saving to localStorage to prevent QuotaExceededError
    const safeDrawings = drawings.map((d) => {
      if (!d.attachedFiles || d.attachedFiles.length === 0) return d;
      return {
        ...d,
        attachedFiles: d.attachedFiles.map((f) => {
          if (f.dataUrl && f.dataUrl.length > 30000) {
            // Keep fileUrl and omit the giant base64 dataUrl from localStorage
            const { dataUrl, ...rest } = f;
            return rest as AttachedDrawingFile;
          }
          return f;
        }),
      };
    });
    localStorage.setItem(DRAWINGS_KEY, JSON.stringify(safeDrawings));
  } catch (e) {
    console.error('Failed to cache drawings locally:', e);
  }
}

export function getOfflineQueue(): OfflineQueueItem[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to read offline queue:', e);
    return [];
  }
}

export function addToOfflineQueue(item: Omit<OfflineQueueItem, 'id' | 'timestamp'>): OfflineQueueItem {
  const queue = getOfflineQueue();
  const queueItem: OfflineQueueItem = {
    ...item,
    id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: Date.now(),
  };
  queue.push(queueItem);
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('Failed to save offline item:', e);
  }
  return queueItem;
}

export function clearOfflineQueue(): void {
  try {
    localStorage.removeItem(QUEUE_KEY);
  } catch (e) {
    console.error('Failed to clear queue:', e);
  }
}

export function getStationSettings(): StationSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveStationSettings(settings: StationSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}
