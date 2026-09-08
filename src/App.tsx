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
  Mail,
  LogOut,
  Lock,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';
import {
  Drawing,
  DrawingVersion,
  NotificationAlert,
  SyncStatus,
  DepartmentId,
  DepartmentInfo,
  ProductModel,
  ProductSeries,
  UserProfile,
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
import { SafeguardDeleteModal, SafeguardDeleteTarget } from './components/SafeguardDeleteModal';
import { ManageSeriesModal } from './components/ManageSeriesModal';
import { SecurityGateway } from './components/SecurityGateway';
import { UserManagementModal } from './components/UserManagementModal';
import { FirebaseSyncBadge } from './components/FirebaseSyncBadge';
import {
  DATABASE_NAME,
  subscribeToFirebaseDrawings,
  subscribeToFirebaseDepartments,
  saveDepartmentToFirestore,
  testFirebaseConnection,
} from './services/firebase';
import {
  SUPER_ADMIN_EMAIL,
  getCurrentSession,
  setCurrentSession,
  isScreenLocked,
  setScreenLocked,
  fetchSecurityConfig,
  logUserAccess,
} from './services/securityService';
import { soundEffects } from './services/sound';
import { INITIAL_DEPARTMENTS } from './data/departmentsData';

export default function App() {
  const [departments, setDepartments] = useState<DepartmentInfo[]>(getLocalDepartments());
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<DepartmentId>('SAS');
  const [drawings, setDrawings] = useState<Drawing[]>(getLocalDrawings());
  const [selectedDrawingId, setSelectedDrawingId] = useState<string>('');
  const [activeVersion, setActiveVersion] = useState<DrawingVersion | null>(null);
  const [settings, setSettings] = useState<StationSettings>(getStationSettings());
  const [theme, setTheme] = useState<'blueprint' | 'dark' | 'light'>(settings.theme || 'blueprint');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    return getCurrentSession();
  });
  
  // Admin access state
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    const session = getCurrentSession();
    if (!session) return false;
    return (session.email && session.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) || session.username === 'admin';
  });

  // Admin Modals
  const [isAddModelOpen, setIsAddModelOpen] = useState<boolean>(false);
  const [addModelDeptId, setAddModelDeptId] = useState<DepartmentId>('SAS');
  const [addModelSeriesId, setAddModelSeriesId] = useState<string | undefined>(undefined);
  const [isAddLengthOpen, setIsAddLengthOpen] = useState<boolean>(false);
  const [selectedModelForLength, setSelectedModelForLength] = useState<ProductModel | null>(null);

  // Series Management
  const [isManageSeriesOpen, setIsManageSeriesOpen] = useState<boolean>(false);

  // Security & Authentication States (Protects drawing data from unauthorized access)
  const [isGmailAuthOpen, setIsGmailAuthOpen] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [isAccessControlOpen, setIsAccessControlOpen] = useState<boolean>(false);

  // Safeguard Delete Modal (Requires typing 'ลบ' or 'DELETE' to confirm)
  const [isSafeguardOpen, setIsSafeguardOpen] = useState<boolean>(false);
  const [safeguardTarget, setSafeguardTarget] = useState<SafeguardDeleteTarget | null>(null);
  const [safeguardAction, setSafeguardAction] = useState<(() => Promise<void>) | null>(null);

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

  const [operatorTimeRemaining, setOperatorTimeRemaining] = useState<number | null>(null);

  // 1-Hour hard limit for Operators
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (currentUser && currentUser.role === 'OPERATOR') {
      const loginTime = currentUser.loggedInAt ? new Date(currentUser.loggedInAt).getTime() : Date.now();
      const ONE_HOUR = 60 * 60 * 1000; // 1 hour
      
      const kickOut = () => {
        if (currentUser) {
          logUserAccess(currentUser, 'LOGOUT');
        }
        setCurrentUser(null);
        setCurrentSession(null);
        setIsLocked(true);
        setScreenLocked(true);
        setIsAdmin(false);
        localStorage.removeItem('miyamoto_current_user');
        alert('เซสชันของ Operator (หน้าเครื่อง) หมดอายุแล้ว (จำกัดเวลา 1 ชั่วโมง) ระบบได้ทำการออกจากระบบอัตโนมัติ');
        window.location.reload();
      };
      
      const updateTimer = () => {
        const remaining = (loginTime + ONE_HOUR) - Date.now();
        if (remaining <= 0) {
           kickOut();
           setOperatorTimeRemaining(0);
        } else {
           setOperatorTimeRemaining(remaining);
        }
      };

      updateTimer();
      interval = setInterval(updateTimer, 1000);
    } else {
       setOperatorTimeRemaining(null);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentUser]);

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

  // Auto-lock inactivity listener to prevent unauthorized peeking when away
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    const resetInactivity = () => {
      if (timer) clearTimeout(timer);
      if (currentUser && !isLocked) {
        fetchSecurityConfig()
          .then((cfg) => {
            if (cfg.autoLockMinutes && cfg.autoLockMinutes > 0) {
              timer = setTimeout(() => {
                setIsLocked(true);
                setScreenLocked(true);
              }, cfg.autoLockMinutes * 60 * 1000);
            }
          })
          .catch(() => {});
      }
    };

    resetInactivity();

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    const handleActivity = () => resetInactivity();

    activityEvents.forEach((evt) => window.addEventListener(evt, handleActivity, { passive: true }));

    return () => {
      if (timer) clearTimeout(timer);
      activityEvents.forEach((evt) => window.removeEventListener(evt, handleActivity));
    };
  }, [currentUser, isLocked]);

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

    // Test Firebase connection
    testFirebaseConnection();

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
          if (!fbDepts.find((d) => d.id === 'BOM')) {
             const bom = INITIAL_DEPARTMENTS.find((d) => d.id === 'BOM');
             if (bom) {
                fbDepts.push(bom);
                saveDepartmentToFirestore(bom).catch(console.error);
             }
          }
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
  const activeDrawing = drawings.find((d) => d.id === selectedDrawingId) || drawings[0] || null;

  const effectiveActiveVersion =
    activeVersion ||
    activeDrawing?.versions?.[0] || {
      version: activeDrawing?.currentVersion || 'Rev A',
      releaseDate: new Date().toISOString().split('T')[0],
      releasedBy: 'ฝ่ายวิศวกรรมการผลิต',
      ecoNumber: 'INITIAL-RELEASE',
      changeDescription: 'ออกเอกสารแบบสำหรับสายการผลิต',
      changeDepartment: 'R&D / Production',
      isApprovedForProduction: true,
      svgType: (activeDrawing as any)?.svgType || 'shaft',
      criticalDimensions: [],
    };

  useEffect(() => {
    if (activeDrawing && activeDrawing.versions && activeDrawing.versions.length > 0) {
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
  const handleOpenAddModel = (deptId: DepartmentId, seriesId?: string) => {
    setAddModelDeptId(deptId);
    setAddModelSeriesId(seriesId);
    setIsAddModelOpen(true);
    soundEffects.playClick();
  };

  // Admin: Submit Add Model
  const handleSubmitAddModel = async (deptId: DepartmentId, modelData: any) => {
    const res = await api.addModel(deptId, modelData);
    if (res.model) {
      setDepartments((prev) =>
        prev.map((d) =>
          d.id === deptId ? { ...d, models: [res.model!, ...d.models] } : d
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
    soundEffects.playSuccessChime();
  };

  // Admin: Open Add Length Modal
  const handleOpenAddLength = (model: ProductModel) => {
    setSelectedModelForLength(model);
    setIsAddLengthOpen(true);
    soundEffects.playClick();
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
    soundEffects.playSuccessChime();
  };

  // Admin: Series Management Handlers
  const handleOpenManageSeries = (deptId: DepartmentId) => {
    setSelectedDepartmentId(deptId);
    setIsManageSeriesOpen(true);
    soundEffects.playClick();
  };

  const handleAddSeries = async (seriesData: { name: string; code?: string; description?: string }) => {
    const res = await api.addSeries(selectedDepartmentId, seriesData);
    if (res.success && res.series) {
      const created = res.series;
      setDepartments((prev) =>
        prev.map((dept) => {
          if (dept.id === selectedDepartmentId) {
            return {
              ...dept,
              series: [...(dept.series || []), created],
            };
          }
          return dept;
        })
      );
      soundEffects.playSuccessChime();
    }
  };

  const handleUpdateSeries = async (
    seriesId: string,
    updates: { name?: string; code?: string; description?: string }
  ) => {
    const res = await api.updateSeries(seriesId, updates);
    if (res.success && res.series) {
      const updated = res.series;
      setDepartments((prev) =>
        prev.map((dept) => {
          if (dept.id === selectedDepartmentId) {
            return {
              ...dept,
              series: (dept.series || []).map((s) => (s.id === seriesId ? updated : s)),
              models: dept.models.map((m) =>
                m.seriesId === seriesId ? { ...m, seriesName: updated.name } : m
              ),
            };
          }
          return dept;
        })
      );
      soundEffects.playClick();
    }
  };

  // Safeguard Delete System (Prevents accidental deletion with verification word)
  const triggerSafeguard = (target: SafeguardDeleteTarget, deleteAction: () => Promise<void>) => {
    setSafeguardTarget(target);
    setSafeguardAction(() => deleteAction);
    setIsSafeguardOpen(true);
    soundEffects.playClick();
  };

  const handleConfirmSafeguard = async () => {
    if (safeguardAction) {
      await safeguardAction();
    }
    setIsSafeguardOpen(false);
    setSafeguardTarget(null);
    setSafeguardAction(null);
  };

  const handleDeleteSeries = (series: ProductSeries) => {
    const currentDept = departments.find((d) => d.id === selectedDepartmentId);
    const modelsInSeries = currentDept?.models.filter((m) => m.seriesId === series.id) || [];

    triggerSafeguard(
      {
        type: 'SERIES',
        id: series.id,
        name: series.name,
        code: series.code,
        details: `แผนก: ${selectedDepartmentId} • ${series.description || ''}`,
        impactCount: modelsInSeries.length,
        impactDescription: `การลบซีรี่ส์นี้จะทำให้รุ่นทั้ง ${modelsInSeries.length} รุ่น และแบบดรออิ้งที่เกี่ยวข้องถูกนำออกจากระบบ`,
      },
      async () => {
        await api.deleteSeries(series.id);
        setDepartments((prev) =>
          prev.map((dept) => {
            if (dept.id === selectedDepartmentId) {
              return {
                ...dept,
                series: dept.series?.filter((s) => s.id !== series.id) || [],
                models: dept.models.filter((m) => m.seriesId !== series.id),
              };
            }
            return dept;
          })
        );
        setSyncStatus((s) => ({
          ...s,
          pendingCount: getOfflineQueue().length,
        }));
        soundEffects.playClick();
      }
    );
  };

  // Admin: Request Delete Model with Safeguard
  const handleRequestDeleteModel = (modelId: string, modelCode: string) => {
    const currentDept = departments.find((d) => d.id === selectedDepartmentId);
    const model = currentDept?.models.find((m) => m.id === modelId);
    const impactCount = model?.lengths.length || 0;

    triggerSafeguard(
      {
        type: 'MODEL',
        id: modelId,
        name: model?.name || modelCode,
        code: modelCode,
        details: `แผนก: ${selectedDepartmentId} • ${model?.category || ''}`,
        impactCount,
        impactDescription: `การลบรุ่นนี้จะนำแบบดรออิ้งและขนาดความยาวทั้ง ${impactCount} รายการ ออกจากระบบ`,
      },
      async () => {
        await api.deleteModel(modelId);
        setDepartments((prev) =>
          prev.map((dept) => ({
            ...dept,
            models: dept.models.filter((m) => m.id !== modelId),
          }))
        );
        setDrawings((prev) => prev.filter((d) => d.modelId !== modelId));
        setSyncStatus((s) => ({
          ...s,
          pendingCount: getOfflineQueue().length,
        }));
        soundEffects.playClick();
      }
    );
  };

  // Security Gateway Unlocking & Session Management
  const handleUnlock = (user: UserProfile) => {
    logUserAccess(user, 'LOGIN');
    setCurrentUser(user);
    setCurrentSession(user);
    setIsLocked(false);
    setScreenLocked(false);
    if ((user.email && user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) || user.username === 'admin') {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
    soundEffects.playSuccessChime();
  };

  const handleLockScreen = () => {
    setIsLocked(true);
    setScreenLocked(true);
    soundEffects.playClick();
  };

  const handleLogout = () => {
    if (currentUser) {
      logUserAccess(currentUser, 'LOGOUT');
    }
    setCurrentUser(null);
    setCurrentSession(null);
    setIsLocked(true);
    setScreenLocked(true);
    setIsAdmin(false);
    localStorage.removeItem('miyamoto_current_user');
    soundEffects.playClick();
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
        let drawingIdToRemove = '';
        setDepartments((prev) =>
          prev.map((dept) => ({
            ...dept,
            models: dept.models.map((m) => {
              if (m.id === deleteConfirm.modelId) {
                const targetLen = m.lengths.find((l) => l.id === deleteConfirm.lengthId);
                if (targetLen?.drawingId) drawingIdToRemove = targetLen.drawingId;
                return {
                  ...m,
                  lengths: m.lengths.filter((l) => l.id !== deleteConfirm.lengthId),
                };
              }
              return m;
            }),
          }))
        );
        setDrawings((prev) =>
          prev.filter(
            (d) =>
              d.lengthVariantId !== deleteConfirm.lengthId &&
              d.id !== `dwg-${deleteConfirm.lengthId}` &&
              (!drawingIdToRemove || d.id !== drawingIdToRemove)
          )
        );
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
    const updatedDepts = getLocalDepartments();
    setDepartments(updatedDepts);
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

  // Admin Delete Old Attached File
  const handleDeleteAttachedFile = async (drawingId: string, fileId: string) => {
    try {
      const res = await api.deleteAttachedFile(drawingId, fileId);
      if (res && res.drawing) {
        setDrawings((prev) => prev.map((d) => (d.id === drawingId ? res.drawing! : d)));
      } else {
        setDrawings((prev) =>
          prev.map((d) => {
            if (d.id === drawingId) {
              return {
                ...d,
                attachedFiles: (d.attachedFiles || []).filter((f) => f.id !== fileId),
              };
            }
            return d;
          })
        );
      }
      if (targetDrawingForFile && targetDrawingForFile.id === drawingId) {
        setTargetDrawingForFile((prev) =>
          prev
            ? {
                ...prev,
                attachedFiles: (prev.attachedFiles || []).filter((f) => f.id !== fileId),
              }
            : null
        );
      }
      setNotifications((prev) => [
        {
          id: `notif-${Date.now()}`,
          title: 'ลบไฟล์เก่าสำเร็จ',
          message: 'ไฟล์ถูกลบออกจากระบบและพื้นที่จัดเก็บเรียบร้อยแล้ว',
          type: 'REV_CHANGE',
          timestamp: new Date().toLocaleTimeString(),
          read: false,
        },
        ...prev,
      ]);
    } catch (err) {
      console.error('Failed to delete attached file', err);
      alert('เกิดข้อผิดพลาดในการลบไฟล์: ' + (err as Error).message);
    }
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

  const currentDepartment =
    departments.find((d) => d.id === selectedDepartmentId) || departments[0];

  // CLOAK BARRIER: If not authenticated or locked, render ONLY the Security Gateway!
  // Unauthorized users will see ABSOLUTELY NOTHING of the drawings, models, specs, or CAD files!
  if (isLocked || !currentUser) {
    return <SecurityGateway onUnlock={handleUnlock} />;
  }

  
  return (
    <div className="grid grid-rows-[56px_1fr_28px] h-screen w-screen overflow-hidden bg-[#0f1115] text-[#e2e8f0] font-sans">
      <header className="bg-[#1a1d23] border-b-2 border-[#e2e8f0] px-6 flex items-center justify-between z-50">
        <div className="flex items-center gap-4">
          <button 
            className="btn btn-outline" 
            style={{ padding: '4px 8px' }}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>
          <h1 className="font-['Syne'] text-xl tracking-tighter uppercase font-bold">Cloud Drawing Hub</h1>
          <div className="flex gap-1 hidden sm:flex">
            <span className="meta-label">{departments.length} Depts</span>
            <span className="meta-label">Tablet Optimized</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <p className="text-[0.7rem] font-bold">{currentUser.displayName}</p>
            <button onClick={handleLogout} className="text-[0.6rem] text-[#3b82f6] hover:underline">
              {currentUser.role} • Sign Out
            </button>
          </div>
          
          {operatorTimeRemaining !== null && (
            <div className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-colors ${operatorTimeRemaining < 300000 ? 'bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse' : 'bg-slate-800 text-slate-300 border border-slate-700'}`}>
              <span className="text-[10px] uppercase tracking-wider opacity-70">หมดเวลาใน</span>
              <span>
                {Math.floor(operatorTimeRemaining / 1000 / 60).toString().padStart(2, '0')}:
                {(Math.floor(operatorTimeRemaining / 1000) % 60).toString().padStart(2, '0')}
              </span>
            </div>
          )}
          
          <button 
            className="btn btn-primary bg-red-500 hover:bg-red-600" 
            onClick={handleLockScreen}
          >
            Lock Screen
          </button>
          
          {isAdmin && (
            <button 
              className="btn btn-outline hidden sm:flex"
              onClick={() => setIsAccessControlOpen(true)}
            >
              Whitelist
            </button>
          )}

          {isAdmin && (
            <FirebaseSyncBadge
              isSyncing={isSyncingFirebase}
              lastSyncedAt={lastFirebaseSync}
              onSync={handleSyncAllToFirebase}
              totalDepartments={departments.length}
              totalDrawings={drawings.length}
            />
          )}

          <div className="meta-label bg-black border border-[#3b82f6] hidden lg:flex items-center gap-2">
            Firebase: {DATABASE_NAME} <span className="status-dot"></span>
          </div>
        </div>
      </header>

      <main className={`grid ${sidebarOpen ? 'grid-cols-[320px_1fr]' : 'grid-cols-[0px_1fr]'} overflow-hidden relative transition-all duration-300`}>
        {/* Drawing Catalog Sidebar */}
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
            onOpenManageSeries={handleOpenManageSeries}
            onOpenAddSeries={handleOpenManageSeries}
            onOpenEditSeries={() => setIsManageSeriesOpen(true)}
            onDeleteSeries={handleDeleteSeries}
            operatorName={settings.operatorName}
            stationLine={settings.stationLine}
            machineId={settings.machineId}
          />
        )}

        {/* Drawing Viewport Stage */}
        {activeDrawing ? (
          <DrawingViewer
            drawing={activeDrawing}
            activeVersion={effectiveActiveVersion}
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
            onDeleteAttachedFile={handleDeleteAttachedFile}
          />
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-dim)' }}>
            <RefreshCw className="w-5 h-5 animate-spin mr-2" />
            กำลังโหลดข้อมูลดรออิ้งจากคลาวด์...
          </div>
        )}
      </main>
      <div className="h-8 bg-slate-900 border-t border-slate-800 flex items-center justify-between px-4 text-[10px] text-slate-500 font-mono shrink-0">
        <span>STORAGE: {drawings.length} DOCUMENT UNITS</span>
        <span>MODIFIED: {new Date().toLocaleString()}</span>
        <span>STATION ID: {settings.machineId}</span>
        <span>ENCRYPTION: AES-256 ACTIVE</span>
      </div>

      {/* MODALS */}
      {/* 1. Add Model Modal (Admin) */}
      <AddModelModal
        isOpen={isAddModelOpen}
        onClose={() => {
          setIsAddModelOpen(false);
          setAddModelSeriesId(undefined);
        }}
        defaultDepartmentId={addModelDeptId}
        defaultSeriesId={addModelSeriesId}
        seriesList={currentDepartment?.series || []}
        onSubmit={handleSubmitAddModel}
      />

      {/* 1.1 Manage Series Modal (Admin) */}
      {isManageSeriesOpen && currentDepartment && (
        <ManageSeriesModal
          isOpen={isManageSeriesOpen}
          department={currentDepartment}
          onClose={() => setIsManageSeriesOpen(false)}
          onAddSeries={handleAddSeries}
          onUpdateSeries={handleUpdateSeries}
          onTriggerDeleteSafeguard={triggerSafeguard}
          onOpenAddModelForSeries={(seriesId) => {
            setIsManageSeriesOpen(false);
            handleOpenAddModel(selectedDepartmentId, seriesId);
          }}
        />
      )}

      {/* 1.2 Safeguard Delete Confirmation Modal (Requires typing 'ลบ' or 'DELETE' to confirm) */}
      <SafeguardDeleteModal
        isOpen={isSafeguardOpen}
        target={safeguardTarget}
        onConfirm={handleConfirmSafeguard}
        onClose={() => {
          setIsSafeguardOpen(false);
          setSafeguardTarget(null);
          setSafeguardAction(null);
        }}
      />

      {/* 1.4 Access Control & Whitelist Modal (Admin) */}
      <UserManagementModal
        isOpen={isAccessControlOpen}
        onClose={() => setIsAccessControlOpen(false)}
        currentUser={currentUser || undefined}
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
          onSubmitFile={handleSubmitAddDrawingFile}
          onDeleteFile={handleDeleteAttachedFile}
          isAdmin={isAdmin}
          onOpenParametricCreator={() => {
            const target = targetDrawingForFile || activeDrawing;
            if (target) {
              setEditingDrawing(target);
              setIsEditJobModalOpen(true);
            }
          }}
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
