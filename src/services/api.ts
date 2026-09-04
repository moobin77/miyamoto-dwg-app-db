import {
  Drawing,
  NotificationAlert,
  OfflineQueueItem,
  OperatorAcknowledgment,
  DepartmentId,
  DepartmentInfo,
  ProductModel,
  ModelLengthVariant,
  AttachedDrawingFile,
} from '../types';
import {
  addToOfflineQueue,
  clearOfflineQueue,
  getLocalDrawings,
  getOfflineQueue,
  saveLocalDrawings,
  getLocalDepartments,
  saveLocalDepartments,
} from './storage';
import { soundEffects } from './sound';
import {
  DATABASE_NAME,
  getDepartmentsFromFirestore,
  saveDepartmentToFirestore,
  saveAllDepartmentsToFirestore,
  getDrawingsFromFirestore,
  saveDrawingToFirestore,
  deleteDrawingFromFirestore,
  saveAllDrawingsToFirestore,
  getNotificationsFromFirestore,
  saveNotificationToFirestore,
  saveAcknowledgmentToFirestore,
  getAcknowledgmentsFromFirestore,
  syncAllToFirebaseDatabase,
  subscribeToFirebaseDrawings,
  subscribeToFirebaseDepartments,
} from './firebase';

export type SSECallback = (type: string, data: any) => void;

class ApiService {
  private sse: EventSource | null = null;
  private listeners: SSECallback[] = [];
  private isSimulatedOffline: boolean = false;

  setSimulatedOffline(val: boolean) {
    this.isSimulatedOffline = val;
  }

  getSimulatedOffline(): boolean {
    return this.isSimulatedOffline;
  }

  isEffectivelyOnline(): boolean {
    if (this.isSimulatedOffline) return false;
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  // Connect to SSE for instant real-time broadcasts
  connectSSE(callback: SSECallback) {
    this.listeners.push(callback);

    if (this.sse) return;

    try {
      this.sse = new EventSource('/api/events');

      this.sse.addEventListener('drawing_updated', (e) => {
        const data = JSON.parse(e.data);
        soundEffects.playUrgentAlert();
        this.notifyListeners('drawing_updated', data);
      });

      this.sse.addEventListener('drawing_created', (e) => {
        const data = JSON.parse(e.data);
        this.notifyListeners('drawing_created', data);
      });

      this.sse.addEventListener('drawing_acknowledged', (e) => {
        const data = JSON.parse(e.data);
        this.notifyListeners('drawing_acknowledged', data);
      });

      this.sse.addEventListener('inspection_updated', (e) => {
        const data = JSON.parse(e.data);
        this.notifyListeners('inspection_updated', data);
      });

      this.sse.addEventListener('annotation_added', (e) => {
        const data = JSON.parse(e.data);
        this.notifyListeners('annotation_added', data);
      });

      this.sse.addEventListener('model_added', (e) => {
        const data = JSON.parse(e.data);
        this.notifyListeners('model_added', data);
      });

      this.sse.addEventListener('model_deleted', (e) => {
        const data = JSON.parse(e.data);
        this.notifyListeners('model_deleted', data);
      });

      this.sse.addEventListener('length_added', (e) => {
        const data = JSON.parse(e.data);
        this.notifyListeners('length_added', data);
      });

      this.sse.addEventListener('length_deleted', (e) => {
        const data = JSON.parse(e.data);
        this.notifyListeners('length_deleted', data);
      });

      this.sse.addEventListener('notification', (e) => {
        const data = JSON.parse(e.data);
        if (data.severity === 'URGENT_CHANGE') {
          soundEffects.playUrgentAlert();
        }
        this.notifyListeners('notification', data);
      });

      this.sse.addEventListener('batch_synced', (e) => {
        const data = JSON.parse(e.data);
        this.notifyListeners('batch_synced', data);
      });

      this.sse.onerror = () => {
        // SSE error or reconnecting
      };
    } catch (e) {
      console.error('SSE initialization error:', e);
    }
  }

  unsubscribeSSE(callback: SSECallback) {
    this.listeners = this.listeners.filter((l) => l !== callback);
  }

  private notifyListeners(type: string, data: any) {
    this.listeners.forEach((fn) => fn(type, data));
  }

  getFirebaseDatabaseName(): string {
    return DATABASE_NAME;
  }

  // Complete sync of all local data to Firebase Firestore (miyamoto-dwg-app-db)
  async syncAllToFirebase(): Promise<{ success: boolean; syncedCount: number; message: string }> {
    const depts = getLocalDepartments();
    const dwgs = getLocalDrawings();
    const notifs = await this.getNotifications();
    return syncAllToFirebaseDatabase(depts, dwgs, notifs);
  }

  // Fetch departments (SAS, PTS, OTS) with models and length variants
  async getDepartments(): Promise<DepartmentInfo[]> {
    if (!this.isEffectivelyOnline()) {
      return getLocalDepartments();
    }

    try {
      // 1. Try Firebase Firestore (miyamoto-dwg-app-db)
      const firestoreDepts = await getDepartmentsFromFirestore();
      if (firestoreDepts && firestoreDepts.length > 0) {
        saveLocalDepartments(firestoreDepts);
        return firestoreDepts;
      }
    } catch (fbErr) {
      console.warn('Firebase departments fetch warning:', fbErr);
    }

    try {
      const res = await fetch('/api/departments');
      if (!res.ok) throw new Error('Failed to fetch departments');
      const data: DepartmentInfo[] = await res.json();
      saveLocalDepartments(data);
      // Automatically seed to Firebase Firestore
      saveAllDepartmentsToFirestore(data).catch(console.warn);
      return data;
    } catch (err) {
      console.warn('Network error, serving departments from local cache:', err);
      return getLocalDepartments();
    }
  }

  // Admin: Add a new model to department (SAS / PTS / OTS)
  async addModel(
    departmentId: DepartmentId,
    modelData: {
      code: string;
      name: string;
      nameEn?: string;
      category?: string;
      description?: string;
      svgType?: 'flange' | 'shaft' | 'manifold' | 'bracket';
      initialLengthMm?: number;
      machineNo?: string;
      initialFile?: {
        fileName: string;
        fileType: 'PDF' | 'DXF' | 'DWG' | 'STEP' | 'SVG' | 'IMAGE';
        fileSize: string;
        source?: 'DIRECT_UPLOAD' | 'PARAMETRIC_CAD' | 'PDM_SYNC';
        dataUrl?: string;
        fileUrl?: string;
        notes?: string;
      };
    }
  ): Promise<{ success: boolean; model?: ProductModel; drawing?: Drawing; offlineQueued?: boolean }> {
    const isOnline = this.isEffectivelyOnline();
    const initialLengthMm = modelData.initialLengthMm || 300;
    const modelId = `mod-${departmentId.toLowerCase()}-${Date.now().toString(36)}`;
    const lengthId = `len-${modelId}-${initialLengthMm}`;
    const drawingId = `dwg-${modelData.code.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${initialLengthMm}`;

    const localModel: ProductModel = {
      id: modelId,
      departmentId,
      code: modelData.code,
      name: modelData.name,
      nameEn: modelData.nameEn || modelData.name,
      category: modelData.category || 'อุปกรณ์ผลิตทั่วไป',
      description: modelData.description || '',
      svgType: modelData.svgType || 'shaft',
      lengths: [
        {
          id: lengthId,
          modelId,
          departmentId,
          lengthMm: initialLengthMm,
          lengthLabel: `L = ${initialLengthMm} mm`,
          drawingId,
          partNumber: `PN-${modelData.code}-L${initialLengthMm}`,
          drawingCode: `DWG-${modelData.code}-${String(initialLengthMm).padStart(4, '0')}`,
          nominalStroke: `${Math.round(initialLengthMm * 0.6)} mm`,
          machineNo: modelData.machineNo || 'CNC-01',
          createdAt: new Date().toISOString().substring(0, 10),
        },
      ],
      createdAt: new Date().toISOString().substring(0, 10),
    };

    // Update local cache optimistically
    const depts = getLocalDepartments();
    const d = depts.find((dept) => dept.id === departmentId);
    if (d) {
      d.models.unshift(localModel);
      saveLocalDepartments(depts);
    }

    if (!isOnline) {
      addToOfflineQueue({
        action: 'ADD_MODEL',
        payload: {
          departmentId,
          model: localModel,
          initialLength: localModel.lengths[0],
        },
      });
      return { success: true, model: localModel, offlineQueued: true };
    }

    try {
      const res = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ departmentId, ...modelData }),
      });
      if (!res.ok) throw new Error('Failed to add model');
      const data = await res.json();
      return data;
    } catch {
      addToOfflineQueue({
        action: 'ADD_MODEL',
        payload: {
          departmentId,
          model: localModel,
          initialLength: localModel.lengths[0],
        },
      });
      return { success: true, model: localModel, offlineQueued: true };
    }
  }

  // Admin: Update model header (code, name, nameEn, category, description, svgType)
  async updateModel(
    modelId: string,
    updates: {
      code?: string;
      name?: string;
      nameEn?: string;
      category?: string;
      description?: string;
      svgType?: 'flange' | 'shaft' | 'manifold' | 'bracket';
    }
  ): Promise<{ success: boolean; model?: ProductModel; offlineQueued?: boolean }> {
    const isOnline = this.isEffectivelyOnline();

    // Optimistically update local departments
    const depts = getLocalDepartments();
    let updatedModel: ProductModel | null = null;
    for (const d of depts) {
      const m = d.models.find((mod) => mod.id === modelId);
      if (m) {
        if (updates.code) m.code = updates.code.trim().toUpperCase();
        if (updates.name) m.name = updates.name.trim();
        if (updates.nameEn !== undefined) m.nameEn = updates.nameEn.trim();
        if (updates.category) m.category = updates.category.trim();
        if (updates.description !== undefined) m.description = updates.description.trim();
        if (updates.svgType) m.svgType = updates.svgType;
        updatedModel = m;

        // Also sync local drawings
        const localDwgs = getLocalDrawings();
        for (const len of m.lengths) {
          const dwg = localDwgs.find((dw) => dw.id === len.drawingId);
          if (dwg) {
            dwg.modelName = m.name;
            if (updates.name) dwg.title = `${m.name} ${len.lengthLabel}`;
            if (updates.nameEn) dwg.titleEn = `${m.nameEn} ${len.lengthLabel}`;
            if (updates.code) {
              dwg.code = `DWG-${m.code}-${String(len.lengthMm).padStart(4, '0')}`;
              len.drawingCode = dwg.code;
              len.partNumber = `PN-${m.code}-L${len.lengthMm}`;
              dwg.partNumber = len.partNumber;
            }
            if (updates.svgType && dwg.versions) {
              dwg.versions.forEach((v) => {
                v.svgType = updates.svgType!;
              });
            }
          }
        }
        saveLocalDrawings(localDwgs);
        saveLocalDepartments(depts);
        break;
      }
    }

    if (!isOnline) {
      addToOfflineQueue({
        action: 'UPDATE_MODEL' as any,
        payload: { modelId, updates },
      });
      soundEffects.playClick();
      return { success: true, model: updatedModel || undefined, offlineQueued: true };
    }

    try {
      const res = await fetch(`/api/models/${modelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      soundEffects.playClick();
      return data;
    } catch {
      addToOfflineQueue({
        action: 'UPDATE_MODEL' as any,
        payload: { modelId, updates },
      });
      return { success: true, model: updatedModel || undefined, offlineQueued: true };
    }
  }

  // Admin: Delete a model
  async deleteModel(modelId: string): Promise<{ success: boolean; offlineQueued?: boolean }> {
    const isOnline = this.isEffectivelyOnline();

    // Optimistic local update
    const depts = getLocalDepartments();
    for (const d of depts) {
      const idx = d.models.findIndex((m) => m.id === modelId);
      if (idx !== -1) {
        const removed = d.models[idx];
        const drawingIds = new Set(removed.lengths.map((l) => l.drawingId));
        d.models.splice(idx, 1);
        saveLocalDepartments(depts);

        const localDwgs = getLocalDrawings().filter((dwg) => !drawingIds.has(dwg.id));
        saveLocalDrawings(localDwgs);
        break;
      }
    }

    if (!isOnline) {
      addToOfflineQueue({
        action: 'DELETE_MODEL',
        payload: { modelId },
      });
      return { success: true, offlineQueued: true };
    }

    try {
      const res = await fetch(`/api/models/${modelId}`, { method: 'DELETE' });
      return res.json();
    } catch {
      addToOfflineQueue({
        action: 'DELETE_MODEL',
        payload: { modelId },
      });
      return { success: true, offlineQueued: true };
    }
  }

  // Admin: Add a length variant to a model
  async addLength(
    modelId: string,
    lengthData: {
      lengthMm: number;
      lengthLabel?: string;
      partNumber?: string;
      machineNo?: string;
      nominalStroke?: string;
    }
  ): Promise<{ success: boolean; length?: ModelLengthVariant; drawing?: Drawing; offlineQueued?: boolean }> {
    const isOnline = this.isEffectivelyOnline();
    const depts = getLocalDepartments();

    let targetModel: ProductModel | null = null;
    let targetDept: DepartmentInfo | null = null;
    for (const d of depts) {
      const m = d.models.find((mod) => mod.id === modelId);
      if (m) {
        targetModel = m;
        targetDept = d;
        break;
      }
    }

    const numLength = Number(lengthData.lengthMm);
    const lengthId = `len-${modelId}-${numLength}-${Date.now().toString(36)}`;
    const drawingId = `dwg-${targetModel ? targetModel.code.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'model'}-${numLength}`;

    const localLength: ModelLengthVariant = {
      id: lengthId,
      modelId,
      departmentId: targetDept ? targetDept.id : 'SAS',
      lengthMm: numLength,
      lengthLabel: lengthData.lengthLabel || `L = ${numLength} mm`,
      drawingId,
      partNumber: lengthData.partNumber || `PN-${targetModel?.code || 'MODEL'}-L${numLength}`,
      drawingCode: `DWG-${targetModel?.code || 'MODEL'}-${String(numLength).padStart(4, '0')}`,
      nominalStroke: lengthData.nominalStroke || `${Math.round(numLength * 0.6)} mm`,
      machineNo: lengthData.machineNo || 'CNC-01',
      createdAt: new Date().toISOString().substring(0, 10),
    };

    if (targetModel) {
      targetModel.lengths.push(localLength);
      saveLocalDepartments(depts);
    }

    if (!isOnline) {
      addToOfflineQueue({
        action: 'ADD_LENGTH',
        payload: { modelId, length: localLength },
      });
      return { success: true, length: localLength, offlineQueued: true };
    }

    try {
      const res = await fetch(`/api/models/${modelId}/lengths`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lengthData),
      });
      if (!res.ok) throw new Error('Failed to add length');
      const data = await res.json();
      return data;
    } catch {
      addToOfflineQueue({
        action: 'ADD_LENGTH',
        payload: { modelId, length: localLength },
      });
      return { success: true, length: localLength, offlineQueued: true };
    }
  }

  // Admin: Delete a length variant from a model
  async deleteLength(modelId: string, lengthId: string): Promise<{ success: boolean; offlineQueued?: boolean }> {
    const isOnline = this.isEffectivelyOnline();

    // Optimistic local update
    const depts = getLocalDepartments();
    for (const d of depts) {
      const m = d.models.find((mod) => mod.id === modelId);
      if (m) {
        const lenIdx = m.lengths.findIndex((l) => l.id === lengthId);
        if (lenIdx !== -1) {
          const removed = m.lengths[lenIdx];
          m.lengths.splice(lenIdx, 1);
          saveLocalDepartments(depts);

          const localDwgs = getLocalDrawings().filter((dwg) => dwg.id !== removed.drawingId);
          saveLocalDrawings(localDwgs);
          break;
        }
      }
    }

    if (!isOnline) {
      addToOfflineQueue({
        action: 'DELETE_LENGTH',
        payload: { modelId, lengthId },
      });
      return { success: true, offlineQueued: true };
    }

    try {
      const res = await fetch(`/api/models/${modelId}/lengths/${lengthId}`, { method: 'DELETE' });
      return res.json();
    } catch {
      addToOfflineQueue({
        action: 'DELETE_LENGTH',
        payload: { modelId, lengthId },
      });
      return { success: true, offlineQueued: true };
    }
  }

  // Fetch drawings (with local cache fallback and Firebase sync)
  async getDrawings(): Promise<Drawing[]> {
    if (!this.isEffectivelyOnline()) {
      return getLocalDrawings();
    }

    try {
      // 1. Try Firebase Firestore (miyamoto-dwg-app-db)
      const firestoreDwgs = await getDrawingsFromFirestore();
      if (firestoreDwgs && firestoreDwgs.length > 0) {
        saveLocalDrawings(firestoreDwgs);
        return firestoreDwgs;
      }
    } catch (fbErr) {
      console.warn('Firebase drawings fetch warning:', fbErr);
    }

    try {
      const res = await fetch('/api/drawings');
      if (!res.ok) throw new Error('Failed to fetch drawings');
      const data: Drawing[] = await res.json();
      saveLocalDrawings(data);
      // Automatically seed to Firebase Firestore
      saveAllDrawingsToFirestore(data).catch(console.warn);
      return data;
    } catch (err) {
      console.warn('Network error, serving from local cache:', err);
      return getLocalDrawings();
    }
  }

  // Fetch notifications
  async getNotifications(): Promise<NotificationAlert[]> {
    if (!this.isEffectivelyOnline()) return [];
    try {
      const res = await fetch('/api/notifications');
      return res.ok ? await res.json() : [];
    } catch {
      return [];
    }
  }

  // Acknowledge revision sign-off
  async acknowledgeRevision(
    drawingId: string,
    payload: {
      version: string;
      operatorName: string;
      operatorId: string;
      lineId: string;
      machineId?: string;
      comment?: string;
    }
  ): Promise<{ success: boolean; acknowledgment: OperatorAcknowledgment; offlineQueued?: boolean }> {
    const isOnline = this.isEffectivelyOnline();

    const localAck: OperatorAcknowledgment = {
      id: `ack-${Date.now()}`,
      version: payload.version,
      operatorName: payload.operatorName,
      operatorId: payload.operatorId,
      lineId: payload.lineId,
      machineId: payload.machineId,
      timestamp: new Date().toLocaleString('th-TH', { hour12: false }),
      comment: payload.comment,
    };

    // Update local cache optimistically
    const localDrawings = getLocalDrawings();
    const d = localDrawings.find((x) => x.id === drawingId);
    if (d) {
      d.acknowledgments.unshift(localAck);
      saveLocalDrawings(localDrawings);
    }

    if (!isOnline) {
      addToOfflineQueue({
        action: 'ACKNOWLEDGE',
        drawingId,
        payload: { ...payload, ...localAck },
      });
      return { success: true, acknowledgment: localAck, offlineQueued: true };
    }

    try {
      const res = await fetch(`/api/drawings/${drawingId}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      return data;
    } catch {
      addToOfflineQueue({
        action: 'ACKNOWLEDGE',
        drawingId,
        payload: { ...payload, ...localAck },
      });
      return { success: true, acknowledgment: localAck, offlineQueued: true };
    }
  }

  // Create new revision
  async createRevision(
    drawingId: string,
    revisionData: {
      version?: string;
      changeDescription: string;
      changeDepartment: 'R&D' | 'Tooling' | 'Production' | 'Quality';
      releasedBy: string;
      ecoNumber?: string;
      isApprovedForProduction?: boolean;
      diffHighlights?: any[];
    }
  ): Promise<{ success: boolean; offlineQueued?: boolean }> {
    const isOnline = this.isEffectivelyOnline();

    if (!isOnline) {
      addToOfflineQueue({
        action: 'CREATE_REVISION',
        drawingId,
        payload: revisionData,
      });

      // Optimistic local update
      const localDrawings = getLocalDrawings();
      const d = localDrawings.find((x) => x.id === drawingId);
      if (d) {
        const nextLetter = String.fromCharCode((d.currentVersion.charCodeAt(4) || 65) + 1);
        const newVer = revisionData.version || `Rev ${nextLetter}`;
        d.versions.unshift({
          version: newVer,
          releaseDate: new Date().toLocaleString('th-TH'),
          releasedBy: revisionData.releasedBy,
          ecoNumber: revisionData.ecoNumber || `ECO-LOCAL-${Date.now()}`,
          changeDescription: revisionData.changeDescription,
          changeDepartment: revisionData.changeDepartment,
          isApprovedForProduction: revisionData.isApprovedForProduction ?? true,
          svgType: d.versions[0]?.svgType || 'flange',
          diffHighlights: revisionData.diffHighlights || [],
        });
        d.currentVersion = newVer;
        d.latestChangelog = revisionData.changeDescription;
        d.lastUpdated = new Date().toLocaleString('th-TH');
        saveLocalDrawings(localDrawings);
      }

      return { success: true, offlineQueued: true };
    }

    const res = await fetch(`/api/drawings/${drawingId}/revisions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(revisionData),
    });
    return res.json();
  }

  // Update inspection dimension
  async updateInspection(
    drawingId: string,
    dimensionId: string,
    measuredValue: string,
    status: 'PASS' | 'FAIL' | 'PENDING'
  ): Promise<{ success: boolean; offlineQueued?: boolean }> {
    const isOnline = this.isEffectivelyOnline();

    // Optimistic local update
    const localDrawings = getLocalDrawings();
    const d = localDrawings.find((x) => x.id === drawingId);
    if (d) {
      const dim = d.criticalDimensions.find((c) => c.id === dimensionId);
      if (dim) {
        dim.measuredValue = measuredValue;
        dim.status = status;
        saveLocalDrawings(localDrawings);
      }
    }

    if (!isOnline) {
      addToOfflineQueue({
        action: 'UPDATE_INSPECTION',
        drawingId,
        payload: { dimensionId, measuredValue, status },
      });
      return { success: true, offlineQueued: true };
    }

    try {
      const res = await fetch(`/api/drawings/${drawingId}/inspections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dimensionId, measuredValue, status }),
      });
      return res.json();
    } catch {
      addToOfflineQueue({
        action: 'UPDATE_INSPECTION',
        drawingId,
        payload: { dimensionId, measuredValue, status },
      });
      return { success: true, offlineQueued: true };
    }
  }

  // Update drawing metadata (ชื่องาน, part number, วัสดุ, etc.)
  async updateDrawing(
    drawingId: string,
    updates: Partial<Drawing> & { modelName?: string }
  ): Promise<{ success: boolean; drawing?: Drawing; offlineQueued?: boolean }> {
    const isOnline = this.isEffectivelyOnline();

    // Optimistically update local cache
    const localDrawings = getLocalDrawings();
    const d = localDrawings.find((x) => x.id === drawingId);
    if (d) {
      Object.assign(d, updates);
      d.lastUpdated = new Date().toLocaleString('th-TH');
      saveLocalDrawings(localDrawings);
    }

    if (updates.modelName && d?.modelId) {
      const depts = getLocalDepartments();
      for (const dept of depts) {
        const m = dept.models.find((mod) => mod.id === d.modelId);
        if (m) {
          m.name = updates.modelName;
          saveLocalDepartments(depts);
        }
      }
    }

    if (!isOnline) {
      addToOfflineQueue({
        action: 'UPDATE_DRAWING',
        drawingId,
        payload: updates,
      });
      soundEffects.playClick();
      return { success: true, drawing: d, offlineQueued: true };
    }

    try {
      const res = await fetch(`/api/drawings/${drawingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      soundEffects.playClick();
      return data;
    } catch {
      addToOfflineQueue({
        action: 'UPDATE_DRAWING',
        drawingId,
        payload: updates,
      });
      return { success: true, drawing: d, offlineQueued: true };
    }
  }

  // Upload binary CAD/PDF/Image file to server storage
  async uploadFile(file: File): Promise<{
    success: boolean;
    fileName: string;
    savedFilename: string;
    fileUrl: string;
    fileSize: string;
    fileType: 'PDF' | 'DXF' | 'DWG' | 'STEP' | 'SVG' | 'IMAGE';
  }> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(err.error || `Upload failed with status ${res.status}`);
    }

    return res.json();
  }

  // Admin attaches a drawing file (PDF, DXF, DWG, STEP, SVG, PNG)
  async addDrawingFile(
    drawingId: string,
    fileData: {
      fileName: string;
      fileType: 'PDF' | 'DXF' | 'DWG' | 'STEP' | 'SVG' | 'IMAGE';
      fileSize: string;
      source?: 'DIRECT_UPLOAD' | 'PARAMETRIC_CAD' | 'PDM_SYNC';
      dataUrl?: string;
      fileUrl?: string;
      notes?: string;
      uploadedBy?: string;
    }
  ): Promise<{ success: boolean; file?: AttachedDrawingFile; drawing?: Drawing; offlineQueued?: boolean }> {
    const isOnline = this.isEffectivelyOnline();

    const localFile: AttachedDrawingFile = {
      id: `file-${Date.now()}`,
      fileName: fileData.fileName,
      fileType: fileData.fileType,
      fileSize: fileData.fileSize,
      uploadedAt: new Date().toLocaleString('th-TH', { hour12: false }),
      uploadedBy: fileData.uploadedBy || 'ผู้ดูแลระบบ (Admin)',
      source: fileData.source || 'DIRECT_UPLOAD',
      dataUrl: fileData.dataUrl,
      fileUrl: fileData.fileUrl,
      notes: fileData.notes,
    };

    // Optimistic local cache update
    const localDrawings = getLocalDrawings();
    const d = localDrawings.find((x) => x.id === drawingId);
    if (d) {
      if (!d.attachedFiles) d.attachedFiles = [];
      d.attachedFiles.unshift(localFile);
      d.lastUpdated = localFile.uploadedAt;
      saveLocalDrawings(localDrawings);
      // Sync to Firebase Firestore (miyamoto-dwg-app-db)
      saveDrawingToFirestore(d).catch(console.warn);
    }

    if (!isOnline) {
      addToOfflineQueue({
        action: 'ADD_ATTACHED_FILE',
        drawingId,
        payload: localFile,
      });
      soundEffects.playSuccessChime();
      return { success: true, file: localFile, drawing: d, offlineQueued: true };
    }

    try {
      const res = await fetch(`/api/drawings/${drawingId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fileData),
      });
      const data = await res.json();
      if (data.drawing) {
        saveDrawingToFirestore(data.drawing).catch(console.warn);
      }
      soundEffects.playSuccessChime();
      return data;
    } catch {
      addToOfflineQueue({
        action: 'ADD_ATTACHED_FILE',
        drawingId,
        payload: localFile,
      });
      return { success: true, file: localFile, drawing: d, offlineQueued: true };
    }
  }

  // Synchronize offline queue to cloud server
  async syncOfflineQueue(): Promise<{ success: boolean; syncedCount: number; drawings?: Drawing[] }> {
    const queue = getOfflineQueue();
    if (queue.length === 0) {
      return { success: true, syncedCount: 0 };
    }

    if (!this.isEffectivelyOnline()) {
      throw new Error('ไม่สามารถซิงค์ได้: อุปกรณ์ยังไม่ได้เชื่อมต่ออินเทอร์เน็ต');
    }

    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queue }),
      });

      if (!res.ok) throw new Error('Sync endpoint failed');

      const data = await res.json();
      clearOfflineQueue();
      if (data.drawings) {
        saveLocalDrawings(data.drawings);
      }
      if (data.departments) {
        saveLocalDepartments(data.departments);
      }
      soundEffects.playSuccessChime();
      return { success: true, syncedCount: queue.length, drawings: data.drawings };
    } catch (err: any) {
      throw new Error(err.message || 'เกิดข้อผิดพลาดระหว่างซิงค์ข้อมูลกับคลาวด์');
    }
  }
}

export const api = new ApiService();
