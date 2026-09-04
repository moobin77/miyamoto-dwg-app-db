import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
  Cloud,
  CheckCircle2,
  HardHat,
  Cpu,
  RefreshCw,
  Bell,
  Smartphone,
  ShieldCheck,
  Shield,
  User,
  SlidersHorizontal,
} from 'lucide-react';
import {
  Drawing,
  DrawingVersion,
  NotificationAlert,
  SyncStatus,
  DepartmentId,
  DepartmentInfo,
  ProductModel,
} from './types';
import { api } from './services/api';
import {
  getLocalDrawings,
  getLocalDepartments,
  saveLocalDepartments,
  getOfflineQueue,
  getStationSettings,
  saveStationSettings,
  StationSettings,
} from './services/storage';
import { DrawingCatalog } from './components/DrawingCatalog';
import { DrawingViewer } from './components/DrawingViewer';
import { RevisionAlertBanner } from './components/RevisionAlertBanner';
import { VersionDiffViewer } from './components/VersionDiffViewer';
import { AuditTrailModal } from './components/AuditTrailModal';
import { NewRevisionModal } from './components/NewRevisionModal';
import { ExportModal } from './components/ExportModal';
import { OfflineSyncBadge } from './components/OfflineSyncBadge';
import { NotificationCenter } from './components/NotificationCenter';
import { AddModelModal } from './components/AddModelModal';
import { AddLengthModal } from './components/AddLengthModal';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { EditJobModal } from './components/EditJobModal';
import { EditModelModal } from './components/EditModelModal';
import { AddDrawingFileModal } from './components/AddDrawingFileModal';
import { FirebaseSyncBadge } from './components/FirebaseSyncBadge';
import {
  DATABASE_NAME,
  subscribeToFirebaseDrawings,
  subscribeToFirebaseDepartments,
} from './services/firebase';
import { soundEffects } from './services/sound';

export default function App() {
  const [departments, setDepartments] = useState<DepartmentInfo[]>(getLocalDepartments());
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<DepartmentId>('SAS');
  const [drawings, setDrawings] = useState<Drawing[]>(getLocalDrawings());
  const [selectedDrawingId, setSelectedDrawingId] = useState<string>('');
  const [activeVersion, setActiveVersion] = useState<DrawingVersion | null>(null);
  const [settings, setSettings] = useState<StationSettings>(getStationSettings());
  const [theme, setTheme] = useState<'blueprint' | 'dark' | 'light'>(settings.theme || 'blueprint');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  // Admin access mode toggle (Defaults to true to allow immediate admin demonstration)
  const [isAdmin, setIsAdmin] = useState<boolean>(true);

  // Admin Modals
  const [isAddModelOpen, setIsAddModelOpen] = useState<boolean>(false);
  const [addModelDeptId, setAddModelDeptId] = useState<DepartmentId>('SAS');
  const [isAddLengthOpen, setIsAddLengthOpen] = useState<boolean>(false);
  const [selectedModelForLength, setSelectedModelForLength] = useState<ProductModel | null>(null);

  // Confirm Delete Modal
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: 'MODEL' | 'LENGTH';
    modelId: string;
    modelCode?: string;
    lengthId?: string;
    lengthLabel?: string;
    title: string;
    message: string;
    itemDetail?: string;
    isDeleting?: boolean;
  }>({
    isOpen: false,
    type: 'MODEL',
    modelId: '',
    title: '',
    message: '',
  });

  // Standard Modals
  const [isDiffModalOpen, setIsDiffModalOpen] = useState<boolean>(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [isNewRevModalOpen, setIsNewRevModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  // Edit Job, Edit Model & Add File Modals (Admin)
  const [isEditJobModalOpen, setIsEditJobModalOpen] = useState<boolean>(false);
  const [editingDrawing, setEditingDrawing] = useState<Drawing | null>(null);
  const [isEditModelModalOpen, setIsEditModelModalOpen] = useState<boolean>(false);
  const [editingModel, setEditingModel] = useState<ProductModel | null>(null);
  const [isAddFileModalOpen, setIsAddFileModalOpen] = useState<boolean>(false);
  const [targetDrawingForFile, setTargetDrawingForFile] = useState<Drawing | null>(null);

  // Notifications
  const [notifications, setNotifications] = useState<NotificationAlert[]>([]);

  // Sync state
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSimulatedOffline: false,
    isSyncing: false,
    pendingCount: getOfflineQueue().length,
    lastSyncedAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
  });

  // Firebase Firestore Database (miyamoto-dwg-app-db) Sync State
  const [isSyncingFirebase, setIsSyncingFirebase] = useState<boolean>(false);
  const [lastFirebaseSync, setLastFirebaseSync] = useState<string | null>(null);
  const [firebaseToast, setFirebaseToast] = useState<string | null>(null);

  // Manual trigger to sync all departments and drawings to Firebase Firestore (miyamoto-dwg-app-db)
  const handleSyncAllToFirebase = async () => {
    setIsSyncingFirebase(true);
    try {
      const res = await api.syncAllToFirebase();
      if (res.success) {
        const timeStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastFirebaseSync(timeStr);
        setFirebaseToast(res.message);
        soundEffects.playSuccessChime();
        setTimeout(() => setFirebaseToast(null), 6000);
      } else {
        setFirebaseToast(res.message);
        setTimeout(() => setFirebaseToast(null), 6000);
      }
    } catch (err: any) {
      console.error('Manual Firebase sync error:', err);
      setFirebaseToast(`การเชื่อมต่อ Firebase ขัดข้อง: ${err.message || 'โปรดลองใหม่อีกครั้ง'}`);
      setTimeout(() => setFirebaseToast(null), 6000);
    } finally {
      setIsSyncingFirebase(false);
    }
  };

  // Load initial data from server
  const loadData = useCallback(async () => {
    try {
      // 1. Fetch departments
      const depts = await api.getDepartments();
      setDepartments(depts);

      // 2. Fetch drawings
      const list = await api.getDrawings();
      setDrawings(list);

      // Select initial drawing
      if (list.length > 0) {
        setSelectedDrawingId((prev) => {
          if (prev && list.some((d) => d.id === prev)) return prev;
          // Prefer drawing matching selected department
          const matchDept = list.find((d) => d.department === selectedDepartmentId);
          return matchDept ? matchDept.id : list[0].id;
        });
      }

      // 3. Fetch notifications
      const notifs = await api.getNotifications();
      setNotifications(notifs);

      setSyncStatus((s) => ({
        ...s,
        pendingCount: getOfflineQueue().length,
        lastSyncedAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      }));
    } catch (e) {
      console.error('Failed to load data from server:', e);
      const fallbackDepts = getLocalDepartments();
      setDepartments(fallbackDepts);
      const fallbackDwgs = getLocalDrawings();
      setDrawings(fallbackDwgs);
      if (fallbackDwgs.length > 0 && !selectedDrawingId) {
        setSelectedDrawingId(fallbackDwgs[0].id);
      }
    }
  }, [selectedDepartmentId, selectedDrawingId]);

  // Real-time SSE Connection & Listeners
  useEffect(() => {
    loadData();

    // SSE Callback for cloud broadcast events
    const handleSSE = (type: string, data: any) => {
      if (type === 'drawing_updated') {
        const updatedDwg: Drawing = data;
        setDrawings((prev) =>
          prev.map((d) => (d.id === updatedDwg.id ? updatedDwg : d))
        );
        setSelectedDrawingId((curId) => {
          if (curId === updatedDwg.id) {
            setActiveVersion(updatedDwg.versions[0]);
          }
          return curId;
        });
      } else if (type === 'drawing_created') {
        setDrawings((prev) => [data, ...prev]);
      } else if (type === 'drawing_acknowledged') {
        const { drawingId, drawing } = data;
        setDrawings((prev) =>
          prev.map((d) => (d.id === drawingId ? drawing : d))
        );
      } else if (type === 'inspection_updated') {
        const { drawingId, drawing } = data;
        setDrawings((prev) =>
          prev.map((d) => (d.id === drawingId ? drawing : d))
        );
      } else if (type === 'model_added') {
        const { departmentId, model, newDrawing } = data;
        setDepartments((prev) =>
          prev.map((dept) =>
            dept.id === departmentId
              ? { ...dept, models: [...dept.models, model] }
              : dept
          )
        );
        if (newDrawing) {
          setDrawings((prev) => [newDrawing, ...prev]);
          setSelectedDrawingId(newDrawing.id);
        }
      } else if (type === 'model_deleted') {
        const { modelId } = data;
        setDepartments((prev) =>
          prev.map((dept) => ({
            ...dept,
            models: dept.models.filter((m) => m.id !== modelId),
          }))
        );
        setDrawings((prev) => prev.filter((d) => d.modelId !== modelId));
      } else if (type === 'length_added') {
        const { modelId, lengthVariant, newDrawing } = data;
        setDepartments((prev) =>
          prev.map((dept) => ({
            ...dept,
            models: dept.models.map((m) =>
              m.id === modelId
                ? { ...m, lengths: [...m.lengths, lengthVariant] }
                : m
            ),
          }))
        );
        if (newDrawing) {
          setDrawings((prev) => [newDrawing, ...prev]);
          setSelectedDrawingId(newDrawing.id);
        }
      } else if (type === 'length_deleted') {
        const { modelId, lengthId } = data;
        setDepartments((prev) =>
          prev.map((dept) => ({
            ...dept,
            models: dept.models.map((m) =>
              m.id === modelId
                ? { ...m, lengths: m.lengths.filter((l) => l.id !== lengthId) }
                : m
            ),
          }))
        );
        setDrawings((prev) => prev.filter((d) => d.id !== `dwg-${lengthId}`));
      } else if (type === 'notification') {
        setNotifications((prev) => [data, ...prev]);
      } else if (type === 'batch_synced') {
        if (data.drawings) {
          setDrawings(data.drawings);
        }
        if (data.departments) {
          setDepartments(data.departments);
        }
      }
    };

    api.connectSSE(handleSSE);

    // Online/Offline network listeners
    const handleOnline = () => {
      setSyncStatus((s) => ({ ...s, isOnline: true }));
      triggerSync();
    };
    const handleOffline = () => {
      setSyncStatus((s) => ({ ...s, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Firebase real-time snapshot listeners
    let unsubFbDrawings: (() => void) | null = null;
    let unsubFbDepts: (() => void) | null = null;
    try {
      unsubFbDrawings = subscribeToFirebaseDrawings((fbDwgs) => {
        if (fbDwgs && fbDwgs.length > 0) {
          setDrawings(fbDwgs);
        }
      });
      unsubFbDepts = subscribeToFirebaseDepartments((fbDepts) => {
        if (fbDepts && fbDepts.length > 0) {
          setDepartments(fbDepts);
        }
      });
    } catch (fbErr) {
      console.warn('Firebase realtime subscription setup error:', fbErr);
    }

    return () => {
      api.unsubscribeSSE(handleSSE);
      if (unsubFbDrawings) unsubFbDrawings();
      if (unsubFbDepts) unsubFbDepts();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update active version when selected drawing changes
  const activeDrawing = drawings.find((d) => d.id === selectedDrawingId) || drawings[0];

  useEffect(() => {
    if (activeDrawing) {
      setActiveVersion(activeDrawing.versions[0]);
    }
  }, [selectedDrawingId, activeDrawing?.currentVersion]);

  // When selected department changes, auto select a drawing from that department if current is not in it
  const handleDepartmentChange = (deptId: DepartmentId) => {
    setSelectedDepartmentId(deptId);
    if (activeDrawing && activeDrawing.department !== deptId) {
      const match = drawings.find((d) => d.department === deptId);
      if (match) {
        setSelectedDrawingId(match.id);
      }
    }
  };

  // Sync trigger
  const triggerSync = async () => {
    setSyncStatus((s) => ({ ...s, isSyncing: true }));
    try {
      const res = await api.syncOfflineQueue();
      if (res.drawings) {
        setDrawings(res.drawings);
      }
      const depts = await api.getDepartments();
      setDepartments(depts);
      setSyncStatus((s) => ({
        ...s,
        isSyncing: false,
        pendingCount: 0,
        lastSyncedAt: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      }));
    } catch (err) {
      console.warn('Sync failed:', err);
      setSyncStatus((s) => ({ ...s, isSyncing: false }));
    }
  };

  // Toggle simulated offline mode
  const handleToggleSimulatedOffline = () => {
    const nextState = !syncStatus.isSimulatedOffline;
    api.setSimulatedOffline(nextState);
    setSyncStatus((s) => ({
      ...s,
      isSimulatedOffline: nextState,
    }));
    if (!nextState && syncStatus.isOnline) {
      triggerSync();
    }
  };

  // Admin: Open Add Model Modal
  const handleOpenAddModel = (deptId: DepartmentId) => {
    setAddModelDeptId(deptId);
    setIsAddModelOpen(true);
  };

  // Admin: Submit Add Model
  const handleSubmitAddModel = async (deptId: DepartmentId, modelData: any) => {
    const res = await api.addModel(deptId, modelData);
    if (res.model) {
      setDepartments((prev) =>
        prev.map((d) =>
          d.id === deptId ? { ...d, models: [...d.models, res.model!] } : d
        )
      );
    }
    if (res.drawing) {
      setDrawings((prev) => [res.drawing!, ...prev]);
      setSelectedDrawingId(res.drawing.id);
    }
    setSyncStatus((s) => ({
      ...s,
      pendingCount: getOfflineQueue().length,
    }));
  };

  // Admin: Open Add Length Modal
  const handleOpenAddLength = (model: ProductModel) => {
    setSelectedModelForLength(model);
    setIsAddLengthOpen(true);
  };

  // Admin: Submit Add Length
  const handleSubmitAddLength = async (modelId: string, lengthData: any) => {
    const res = await api.addLength(modelId, lengthData);
    if (res.length) {
      setDepartments((prev) =>
        prev.map((dept) => ({
          ...dept,
          models: dept.models.map((m) =>
            m.id === modelId
              ? { ...m, lengths: [...m.lengths, res.length!] }
              : m
          ),
        }))
      );
    }
    if (res.drawing) {
      setDrawings((prev) => [res.drawing!, ...prev]);
      setSelectedDrawingId(res.drawing.id);
    }
    setSyncStatus((s) => ({
      ...s,
      pendingCount: getOfflineQueue().length,
    }));
  };

  // Admin: Request Delete Model (Show confirmation dialog)
  const handleRequestDeleteModel = (modelId: string, modelCode: string) => {
    setDeleteConfirm({
      isOpen: true,
      type: 'MODEL',
      modelId,
      modelCode,
      title: `ยืนยันการลบรุ่น "${modelCode}"`,
      message:
        'คุณแน่ใจหรือไม่ว่าต้องการลบรุ่นที่ผลิตนี้? แบบดรออิ้งและขนาดความยาวทั้งหมดภายใต้รุ่นนี้จะถูกลบออกจากระบบการผลิตด้วย',
      itemDetail: `รหัสรุ่น: ${modelCode}`,
      isDeleting: false,
    });
  };

  // Admin: Request Delete Length (Show confirmation dialog)
  const handleRequestDeleteLength = (modelId: string, lengthId: string, lengthLabel: string) => {
    setDeleteConfirm({
      isOpen: true,
      type: 'LENGTH',
      modelId,
      lengthId,
      lengthLabel,
      title: `ยืนยันการลบความยาว "${lengthLabel}"`,
      message:
        'คุณแน่ใจหรือไม่ว่าต้องการลบความยาวที่ผลิตนี้? แบบดรออิ้งที่เชื่อมโยงกับความยาวนี้จะถูกนำออกจากสายการผลิต',
      itemDetail: `ขนาด: ${lengthLabel} (ID: ${lengthId})`,
      isDeleting: false,
    });
  };

  // Admin: Confirm Delete Action
  const handleExecuteDelete = async () => {
    setDeleteConfirm((prev) => ({ ...prev, isDeleting: true }));
    try {
      if (deleteConfirm.type === 'MODEL') {
        await api.deleteModel(deleteConfirm.modelId);
        setDepartments((prev) =>
          prev.map((dept) => ({
            ...dept,
            models: dept.models.filter((m) => m.id !== deleteConfirm.modelId),
          }))
        );
        setDrawings((prev) => prev.filter((d) => d.modelId !== deleteConfirm.modelId));
      } else if (deleteConfirm.type === 'LENGTH' && deleteConfirm.lengthId) {
        await api.deleteLength(deleteConfirm.modelId, deleteConfirm.lengthId);
        setDepartments((prev) =>
          prev.map((dept) => ({
            ...dept,
            models: dept.models.map((m) =>
              m.id === deleteConfirm.modelId
                ? { ...m, lengths: m.lengths.filter((l) => l.id !== deleteConfirm.lengthId) }
                : m
            ),
          }))
        );
        setDrawings((prev) => prev.filter((d) => d.id !== `dwg-${deleteConfirm.lengthId}`));
      }

      setSyncStatus((s) => ({
        ...s,
        pendingCount: getOfflineQueue().length,
      }));
      setDeleteConfirm((prev) => ({ ...prev, isOpen: false, isDeleting: false }));
      soundEffects.playClick();
    } catch (err: any) {
      alert(`ลบข้อมูลไม่สำเร็จ: ${err.message}`);
      setDeleteConfirm((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  // Open Edit Job Modal
  const handleOpenEditJob = (d?: Drawing) => {
    const target = d || activeDrawing;
    if (target) {
      setEditingDrawing(target);
      setIsEditJobModalOpen(true);
      soundEffects.playClick();
    }
  };

  // Submit Edit Job Title & Info
  const handleSubmitEditJob = async (
    drawingId: string,
    updates: Partial<Drawing> & { modelName?: string }
  ) => {
    const res = await api.updateDrawing(drawingId, updates);
    if (res.drawing) {
      setDrawings((prev) => prev.map((d) => (d.id === drawingId ? { ...d, ...res.drawing } : d)));
    }
    if ((res as any).departments) {
      setDepartments((res as any).departments);
    }
    setSyncStatus((s) => ({
      ...s,
      pendingCount: getOfflineQueue().length,
    }));
  };

  // Open Edit Model Modal (Admin)
  const handleOpenEditModel = (model: ProductModel) => {
    setEditingModel(model);
    setIsEditModelModalOpen(true);
    soundEffects.playClick();
  };

  // Submit Edit Model Header Info
  const handleSubmitEditModel = async (
    modelId: string,
    updates: {
      code: string;
      name: string;
      nameEn?: string;
      category: string;
      description?: string;
      svgType: 'flange' | 'shaft' | 'manifold' | 'bracket';
    }
  ) => {
    const res = await api.updateModel(modelId, updates);
    if (res.model) {
      setDepartments((prev) =>
        prev.map((dept) => ({
          ...dept,
          models: dept.models.map((m) => (m.id === modelId ? { ...m, ...res.model } : m)),
        }))
      );
      setDrawings((prev) =>
        prev.map((d) => {
          if (d.modelId === modelId) {
            return {
              ...d,
              modelCode: updates.code,
              modelName: updates.name,
              title: `${updates.name} (${d.lengthLabel || ''})`,
              titleEn: updates.nameEn ? `${updates.nameEn} (${d.lengthLabel || ''})` : d.titleEn,
              code: `${updates.code}-L${d.lengthMm || 300}`,
              partNumber: `DWG-${updates.code}-${d.lengthMm || 300}`,
              versions: d.versions.map((v) => ({ ...v, svgType: updates.svgType })),
            };
          }
          return d;
        })
      );
    }
    setSyncStatus((s) => ({
      ...s,
      pendingCount: getOfflineQueue().length,
    }));
  };

  // Open Add Drawing File Modal
  const handleOpenAddFile = (d?: Drawing) => {
    const target = d || activeDrawing || drawings[0] || null;
    if (target) {
      setTargetDrawingForFile(target);
      setIsAddFileModalOpen(true);
      soundEffects.playClick();
    }
  };

  // Submit Add Drawing File
  const handleSubmitAddDrawingFile = async (
    drawingId: string,
    fileData: {
      fileName: string;
      fileType: 'PDF' | 'DXF' | 'DWG' | 'STEP' | 'SVG' | 'IMAGE';
      fileSize: string;
      source: 'DIRECT_UPLOAD' | 'PARAMETRIC_CAD' | 'PDM_SYNC';
      dataUrl?: string;
      fileUrl?: string;
      notes?: string;
    }
  ) => {
    const res = await api.addDrawingFile(drawingId, {
      ...fileData,
      uploadedBy: isAdmin ? 'ผู้ดูแลระบบ (Admin)' : settings.operatorName,
    });
    if (res.drawing) {
      setDrawings((prev) => prev.map((d) => (d.id === drawingId ? { ...d, ...res.drawing } : d)));
    } else if (res.file) {
      setDrawings((prev) =>
        prev.map((d) => {
          if (d.id === drawingId) {
            const files = d.attachedFiles ? [...d.attachedFiles] : [];
            files.unshift(res.file!);
            return { ...d, attachedFiles: files };
          }
          return d;
        })
      );
    }
    setSyncStatus((s) => ({
      ...s,
      pendingCount: getOfflineQueue().length,
    }));
  };

  // Acknowledge Revision
  const handleAcknowledge = async (comment: string) => {
    if (!activeDrawing || !activeVersion) return;

    await api.acknowledgeRevision(activeDrawing.id, {
      version: activeVersion.version,
      operatorName: settings.operatorName,
      operatorId: settings.operatorId,
      lineId: settings.stationLine,
      machineId: settings.machineId,
      comment,
    });

    setSyncStatus((s) => ({
      ...s,
      pendingCount: getOfflineQueue().length,
    }));

    // Update local state
    setDrawings((prev) =>
      prev.map((d) => {
        if (d.id === activeDrawing.id) {
          return {
            ...d,
            acknowledgments: [
              {
                id: `ack-${Date.now()}`,
                version: activeVersion.version,
                operatorName: settings.operatorName,
                operatorId: settings.operatorId,
                lineId: settings.stationLine,
                machineId: settings.machineId,
                timestamp: new Date().toLocaleString('th-TH', { hour12: false }),
                comment,
              },
              ...d.acknowledgments,
            ],
          };
        }
        return d;
      })
    );
  };

  // Update inspection dimension
  const handleUpdateInspection = async (
    dimId: string,
    val: string,
    status: 'PASS' | 'FAIL' | 'PENDING'
  ) => {
    if (!activeDrawing) return;
    await api.updateInspection(activeDrawing.id, dimId, val, status);
    setSyncStatus((s) => ({
      ...s,
      pendingCount: getOfflineQueue().length,
    }));
  };

  // Create new revision
  const handleCreateRevision = async (revData: any) => {
    if (!activeDrawing) return;
    await api.createRevision(activeDrawing.id, revData);
    setSyncStatus((s) => ({
      ...s,
      pendingCount: getOfflineQueue().length,
    }));
    await loadData();
  };

  // Switch to latest version from alert banner
  const handleSwitchToLatest = () => {
    if (activeDrawing) {
      setActiveVersion(activeDrawing.versions[0]);
    }
  };

  // Check if current operator acknowledged active version
  const isAcknowledgedByCurrentOp = Boolean(
    activeDrawing?.acknowledgments.some(
      (a) => a.version === activeVersion?.version && a.operatorId === settings.operatorId
    )
  );

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      {/* GLOBAL APPLICATION HEADER */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between z-30 select-none shadow-lg shrink-0">
        {/* Left: Branding & Sidebar Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition"
            title={sidebarOpen ? 'ซ่อนโครงสร้างแผนก (Hide Hierarchy)' : 'แสดงโครงสร้างแผนก (Show Hierarchy)'}
          >
            {sidebarOpen ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeftOpen className="w-4 h-4 text-blue-400" />
            )}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white tracking-wide font-tech">
                  CLOUD DRAWING HUB
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  3 DEPARTMENTS • TABLET
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden md:block">
                ระบบจัดเก็บดรออิ้งแยกแผนก SAS / PTS / OTS • บริหารรุ่น &amp; ความยาว
              </p>
            </div>
          </div>
        </div>

        {/* Right: Admin Mode Toggle, Offline Sync Badge & Notifications */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Admin Mode Toggle Pill for Easy Testing */}
          <button
            id="toggle-admin-mode-btn"
            type="button"
            onClick={() => {
              setIsAdmin(!isAdmin);
              soundEffects.playClick();
            }}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 shadow-sm ${
              isAdmin
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title="สลับโหมดแอดมิน (Admin) เพื่อเพิ่ม/ลบรุ่นและความยาว"
          >
            {isAdmin ? (
              <>
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-bold">โหมดแอดมิน (Admin)</span>
              </>
            ) : (
              <>
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>ฝ่ายผลิต (Operator)</span>
              </>
            )}
          </button>

          {/* Firebase Database Status & Manual Sync Badge */}
          <FirebaseSyncBadge
            databaseName={DATABASE_NAME}
            isSyncing={isSyncingFirebase}
            lastSyncedAt={lastFirebaseSync}
            totalDrawings={drawings.length}
            totalDepartments={departments.length}
            onSync={handleSyncAllToFirebase}
          />

          {/* Offline Sync Badge */}
          <OfflineSyncBadge
            syncStatus={syncStatus}
            onToggleSimulatedOffline={handleToggleSimulatedOffline}
            onTriggerSync={triggerSync}
          />

          {/* Real-time Notification Center */}
          <NotificationCenter
            notifications={notifications}
            onSelectDrawing={(id) => setSelectedDrawingId(id)}
            onMarkAsRead={(id) => {
              setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, read: true } : n))
              );
            }}
          />
        </div>
      </header>

      {/* REVISION ALERT BANNER (Urgent Warning if operator views outdated version) */}
      {activeDrawing && activeVersion && (
        <RevisionAlertBanner
          drawing={activeDrawing}
          activeVersion={activeVersion}
          onSwitchToLatest={handleSwitchToLatest}
        />
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Drawing Catalog Sidebar (Hierarchical Department -> Model -> Length) */}
        {sidebarOpen && (
          <DrawingCatalog
            departments={departments}
            drawings={drawings}
            selectedDrawingId={selectedDrawingId}
            onSelectDrawing={(d) => {
              setSelectedDrawingId(d.id);
            }}
            selectedDepartmentId={selectedDepartmentId}
            onSelectDepartment={handleDepartmentChange}
            isAdmin={isAdmin}
            onOpenAddModel={handleOpenAddModel}
            onOpenAddLength={handleOpenAddLength}
            onDeleteModel={handleRequestDeleteModel}
            onDeleteLength={handleRequestDeleteLength}
            onOpenEditJob={handleOpenEditJob}
            onOpenEditModel={handleOpenEditModel}
            onOpenAddFile={handleOpenAddFile}
            onOpenAddFileGuide={() => handleOpenAddFile()}
            operatorName={settings.operatorName}
            stationLine={settings.stationLine}
            machineId={settings.machineId}
          />
        )}

        {/* Drawing Viewport Stage */}
        {activeDrawing && activeVersion ? (
          <DrawingViewer
            drawing={activeDrawing}
            activeVersion={activeVersion}
            onVersionChange={(ver) => setActiveVersion(ver)}
            onOpenAuditTrail={() => setIsAuditModalOpen(true)}
            onOpenDiffModal={() => setIsDiffModalOpen(true)}
            onOpenNewRevision={() => setIsNewRevModalOpen(true)}
            onOpenExport={() => setIsExportModalOpen(true)}
            onAcknowledge={handleAcknowledge}
            onUpdateInspection={handleUpdateInspection}
            isAcknowledgedByCurrentOp={isAcknowledgedByCurrentOp}
            theme={theme}
            onToggleTheme={(t) => {
              setTheme(t);
              const updated = { ...settings, theme: t };
              setSettings(updated);
              saveStationSettings(updated);
            }}
            isAdmin={isAdmin}
            onOpenEditJob={() => handleOpenEditJob(activeDrawing)}
            onOpenAddFile={() => handleOpenAddFile(activeDrawing)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" />
            กำลังโหลดข้อมูลดรออิ้งจากคลาวด์...
          </div>
        )}
      </div>

      {/* MODALS */}
      {/* 1. Add Model Modal (Admin) */}
      <AddModelModal
        isOpen={isAddModelOpen}
        onClose={() => setIsAddModelOpen(false)}
        defaultDepartmentId={addModelDeptId}
        onSubmit={handleSubmitAddModel}
      />

      {/* 2. Add Length Modal (Admin) */}
      <AddLengthModal
        isOpen={isAddLengthOpen}
        onClose={() => {
          setIsAddLengthOpen(false);
          setSelectedModelForLength(null);
        }}
        model={selectedModelForLength}
        onSubmit={handleSubmitAddLength}
      />

      {/* 3. Edit Job / Drawing Metadata Modal (Admin) */}
      {isEditJobModalOpen && (
        <EditJobModal
          isOpen={isEditJobModalOpen}
          onClose={() => {
            setIsEditJobModalOpen(false);
            setEditingDrawing(null);
          }}
          drawing={editingDrawing}
          onSubmit={handleSubmitEditJob}
        />
      )}

      {/* 3.1 Edit Model Header Info Modal (Admin) */}
      {isEditModelModalOpen && (
        <EditModelModal
          isOpen={isEditModelModalOpen}
          onClose={() => {
            setIsEditModelModalOpen(false);
            setEditingModel(null);
          }}
          model={editingModel}
          onSubmit={handleSubmitEditModel}
        />
      )}

      {/* 4. Add / Attach Drawing File & Workflow Guide Modal (Admin) */}
      {isAddFileModalOpen && (
        <AddDrawingFileModal
          isOpen={isAddFileModalOpen}
          onClose={() => {
            setIsAddFileModalOpen(false);
            setTargetDrawingForFile(null);
          }}
          drawing={targetDrawingForFile || activeDrawing}
          onSubmit={handleSubmitAddDrawingFile}
        />
      )}

      {/* 5. Confirm Delete Dialog (Admin) */}
      <ConfirmDeleteModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleExecuteDelete}
        title={deleteConfirm.title}
        message={deleteConfirm.message}
        itemDetail={deleteConfirm.itemDetail}
        isDeleting={deleteConfirm.isDeleting}
      />

      {/* 6. Version Difference Viewer */}
      {isDiffModalOpen && activeDrawing && activeVersion && (
        <VersionDiffViewer
          drawing={activeDrawing}
          activeVersion={activeVersion}
          onClose={() => setIsDiffModalOpen(false)}
          theme={theme}
        />
      )}

      {/* 7. Audit Trail & ECO History */}
      {isAuditModalOpen && activeDrawing && (
        <AuditTrailModal
          drawing={activeDrawing}
          onClose={() => setIsAuditModalOpen(false)}
          onSelectVersion={(v) => setActiveVersion(v)}
        />
      )}

      {/* 8. New Engineering Revision */}
      {isNewRevModalOpen && activeDrawing && (
        <NewRevisionModal
          drawing={activeDrawing}
          onClose={() => setIsNewRevModalOpen(false)}
          onSubmit={handleCreateRevision}
        />
      )}

      {/* 9. Export Modal */}
      {isExportModalOpen && activeDrawing && activeVersion && (
        <ExportModal
          drawing={activeDrawing}
          activeVersion={activeVersion}
          onClose={() => setIsExportModalOpen(false)}
        />
      )}

      {/* Floating Firebase Sync Notification Toast */}
      {firebaseToast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md bg-slate-900/95 border border-amber-500/40 text-slate-100 p-4 rounded-2xl shadow-2xl backdrop-blur-md flex items-start gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
            🔥
          </div>
          <div className="flex-1 text-xs">
            <div className="font-bold text-amber-300 text-sm mb-0.5">Firebase Database</div>
            <p className="text-slate-300 leading-relaxed">{firebaseToast}</p>
          </div>
          <button
            type="button"
            onClick={() => setFirebaseToast(null)}
            className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
