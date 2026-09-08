import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  browserLocalPersistence,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  Auth,
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  Firestore,
  collection,
  doc,
  getDocs,
  getDoc,
  getDocFromServer,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfigRaw from '../../firebase-applet-config.json';
import {
  DepartmentInfo,
  Drawing,
  NotificationAlert,
  OperatorAcknowledgment,
  UserProfile,
} from '../types';

// Ensure config object is valid
export const firebaseConfig = {
  projectId: firebaseConfigRaw.projectId,
  appId: firebaseConfigRaw.appId,
  apiKey: firebaseConfigRaw.apiKey,
  authDomain: firebaseConfigRaw.authDomain,
  // @ts-ignore
  firestoreDatabaseId: 'miyamoto-dwg-app-db',
  storageBucket: firebaseConfigRaw.storageBucket,
  messagingSenderId: firebaseConfigRaw.messagingSenderId,
};

export const DATABASE_NAME = firebaseConfig.firestoreDatabaseId || 'miyamoto-dwg-app-db';

let appInstance: ReturnType<typeof initializeApp> | null = null;
let dbInstance: Firestore | null = null;
let authInstance: Auth | null = null;

export function getFirebaseApp() {
  if (!appInstance) {
    appInstance = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  }
  return appInstance;
}

export function getFirebaseAuth(): Auth {
  if (!authInstance) {
    const app = getFirebaseApp();
    try {
      authInstance = initializeAuth(app, {
        persistence: browserLocalPersistence,
      });
    } catch {
      authInstance = getAuth(app);
    }
  }
  return authInstance;
}

// Local Storage Key for persistent operator session
const AUTH_USER_STORAGE_KEY = 'miyamoto_dwg_auth_user';

export function getStoredAuthUser(): UserProfile | null {
  try {
    const saved = localStorage.getItem(AUTH_USER_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export function setStoredAuthUser(user: UserProfile | null) {
  try {
    if (user) {
      localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    }
  } catch {
    // Ignore localStorage errors
  }
}

// 0. Gmail / Google Authentication Services
export async function signInWithGoogle(): Promise<{
  success: boolean;
  user?: UserProfile;
  error?: string;
}> {
  try {
    const auth = getFirebaseAuth();
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    const result = await signInWithPopup(auth, provider);
    const fbUser = result.user;

    const profile: UserProfile = {
      uid: fbUser.uid,
      email: fbUser.email || '',
      displayName: fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'ผู้ใช้งาน'),
      photoURL: fbUser.photoURL || undefined,
      role: 'ADMIN', // Default to Admin when signing in with authorized Google account
      department: 'SAS',
      loggedInAt: new Date().toISOString(),
    };

    setStoredAuthUser(profile);
    return { success: true, user: profile };
  } catch (error: any) {
    console.warn('Google Auth Popup notice:', error);
    // If popup is blocked by browser/iframe security, report gracefully
    return {
      success: false,
      error: error?.code === 'auth/popup-blocked'
        ? 'บราวเซอร์บล็อกหน้าต่างป็อปอัป กรุณาอนุญาตป็อปอัป หรือใช้วิธีระบุอีเมล Gmail ด้านล่าง'
        : error?.message || 'ไม่สามารถเชื่อมต่อ Google Sign-in ได้',
    };
  }
}

export async function signInWithDirectGmail(
  email: string,
  displayName?: string,
  role: 'ADMIN' | 'ENGINEER' | 'OPERATOR' = 'ADMIN'
): Promise<UserProfile> {
  const cleanEmail = email.trim().toLowerCase();
  const name = displayName?.trim() || cleanEmail.split('@')[0];
  const profile: UserProfile = {
    uid: `user-${Date.now().toString(36)}`,
    email: cleanEmail,
    displayName: name,
    photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0284c7&color=fff&bold=true`,
    role,
    department: 'SAS',
    loggedInAt: new Date().toISOString(),
  };
  setStoredAuthUser(profile);
  return profile;
}

export async function signOutUser(): Promise<void> {
  try {
    const auth = getFirebaseAuth();
    await firebaseSignOut(auth);
  } catch {
    // Ignore signout network error
  }
  setStoredAuthUser(null);
}

export function subscribeToFirebaseAuthState(callback: (user: UserProfile | null) => void): Unsubscribe {
  try {
    const auth = getFirebaseAuth();
    return onAuthStateChanged(auth, (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        const profile: UserProfile = {
          uid: fbUser.uid,
          email: fbUser.email || '',
          displayName: fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'ผู้ใช้งาน'),
          photoURL: fbUser.photoURL || undefined,
          role: 'ADMIN',
          department: 'SAS',
          loggedInAt: new Date().toISOString(),
        };
        setStoredAuthUser(profile);
        callback(profile);
      } else {
        const stored = getStoredAuthUser();
        callback(stored);
      }
    });
  } catch {
    const stored = getStoredAuthUser();
    callback(stored);
    return () => {};
  }
}

export function getFirebaseDb(): Firestore {
  if (!dbInstance) {
    const app = getFirebaseApp();
    try {
      // Use experimentalForceLongPolling to bypass WebChannel stream timeout in iframes / proxies
      dbInstance = initializeFirestore(
        app,
        {
          experimentalForceLongPolling: true,
        },
        DATABASE_NAME
      );
    } catch {
      dbInstance = getFirestore(app, DATABASE_NAME);
    }
  }
  return dbInstance;
}

// Test connection to verify online reachability
export async function testFirebaseConnection(): Promise<boolean> {
  try {
    const db = getFirebaseDb();
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase connection test: Operating in offline mode with cached data.');
    }
    return false;
  }
}

// Clean object to avoid Firestore "undefined field value" error and prevent >1MB document size limit
function sanitizeData(data: any): any {
  if (data === undefined) return null;
  if (data === null) return null;
  if (Array.isArray(data)) {
    return data.map(sanitizeData);
  }
  if (typeof data === 'object') {
    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        // Strip out large dataUrl (>50KB) so Firestore 1MB document limit is never exceeded
        if (key === 'dataUrl' && typeof value === 'string' && value.length > 50000) {
          continue;
        }
        clean[key] = sanitizeData(value);
      }
    }
    return clean;
  }
  return data;
}

// 1. Departments Firestore Sync
export async function getDepartmentsFromFirestore(): Promise<DepartmentInfo[]> {
  try {
    const db = getFirebaseDb();
    const snap = await getDocs(collection(db, 'departments'));
    if (snap.empty) return [];
    return snap.docs.map((d) => d.data() as DepartmentInfo);
  } catch (error) {
    console.error('Firebase [departments] fetch error:', error);
    throw error;
  }
}

export async function saveDepartmentToFirestore(dept: DepartmentInfo): Promise<void> {
  try {
    const db = getFirebaseDb();
    const ref = doc(db, 'departments', dept.id);
    const sanitized = sanitizeData({
      ...dept,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(ref, sanitized, { merge: true });
  } catch (error) {
    console.error(`Firebase [departments/${dept.id}] save error:`, error);
    throw error;
  }
}

export async function saveAllDepartmentsToFirestore(departments: DepartmentInfo[]): Promise<void> {
  const db = getFirebaseDb();
  const batch = writeBatch(db);
  for (const dept of departments) {
    const ref = doc(db, 'departments', dept.id);
    batch.set(ref, sanitizeData({ ...dept, updatedAt: new Date().toISOString() }), { merge: true });
  }
  await batch.commit();
}

// 2. Drawings Firestore Sync
export async function getDrawingsFromFirestore(): Promise<Drawing[]> {
  try {
    const db = getFirebaseDb();
    const snap = await getDocs(collection(db, 'drawings'));
    if (snap.empty) return [];
    return snap.docs.map((d) => d.data() as Drawing);
  } catch (error) {
    console.error('Firebase [drawings] fetch error:', error);
    throw error;
  }
}

export async function saveDrawingToFirestore(drawing: Drawing): Promise<void> {
  try {
    const db = getFirebaseDb();
    const ref = doc(db, 'drawings', drawing.id);
    const sanitized = sanitizeData({
      ...drawing,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(ref, sanitized, { merge: true });
  } catch (error) {
    console.error(`Firebase [drawings/${drawing.id}] save error:`, error);
    throw error;
  }
}

export async function deleteDrawingFromFirestore(drawingId: string): Promise<void> {
  try {
    const db = getFirebaseDb();
    await deleteDoc(doc(db, 'drawings', drawingId));
  } catch (error) {
    console.error(`Firebase [drawings/${drawingId}] delete error:`, error);
    throw error;
  }
}

export async function saveAllDrawingsToFirestore(drawings: Drawing[]): Promise<void> {
  const db = getFirebaseDb();
  // Firestore batches allow up to 500 ops
  const chunks: Drawing[][] = [];
  for (let i = 0; i < drawings.length; i += 400) {
    chunks.push(drawings.slice(i, i + 400));
  }

  for (const chunk of chunks) {
    const batch = writeBatch(db);
    for (const dwg of chunk) {
      const ref = doc(db, 'drawings', dwg.id);
      batch.set(ref, sanitizeData({ ...dwg, updatedAt: new Date().toISOString() }), { merge: true });
    }
    await batch.commit();
  }
}

// 3. Notifications Firestore Sync
export async function getNotificationsFromFirestore(): Promise<NotificationAlert[]> {
  try {
    const db = getFirebaseDb();
    const snap = await getDocs(collection(db, 'notifications'));
    if (snap.empty) return [];
    return snap.docs.map((d) => d.data() as NotificationAlert);
  } catch (error) {
    console.error('Firebase [notifications] fetch error:', error);
    return [];
  }
}

export async function saveNotificationToFirestore(notification: NotificationAlert): Promise<void> {
  try {
    const db = getFirebaseDb();
    const ref = doc(db, 'notifications', notification.id);
    await setDoc(ref, sanitizeData(notification), { merge: true });
  } catch (error) {
    console.error(`Firebase [notifications/${notification.id}] save error:`, error);
  }
}

// 4. Operator Acknowledgments
export async function saveAcknowledgmentToFirestore(ack: OperatorAcknowledgment): Promise<void> {
  try {
    const db = getFirebaseDb();
    const ref = doc(db, 'acknowledgments', ack.id);
    await setDoc(ref, sanitizeData(ack), { merge: true });
  } catch (error) {
    console.error(`Firebase [acknowledgments/${ack.id}] save error:`, error);
  }
}

export async function getAcknowledgmentsFromFirestore(): Promise<OperatorAcknowledgment[]> {
  try {
    const db = getFirebaseDb();
    const snap = await getDocs(collection(db, 'acknowledgments'));
    if (snap.empty) return [];
    return snap.docs.map((d) => d.data() as OperatorAcknowledgment);
  } catch (error) {
    console.error('Firebase [acknowledgments] fetch error:', error);
    return [];
  }
}

// 5. System Status / Sync Meta
export async function updateSystemStatus(totalDepartments: number, totalDrawings: number): Promise<void> {
  try {
    const db = getFirebaseDb();
    const ref = doc(db, 'system_status', 'metadata');
    await setDoc(ref, {
      databaseName: DATABASE_NAME,
      lastSyncedAt: new Date().toISOString(),
      totalDepartments,
      totalDrawings,
    }, { merge: true });
  } catch (e) {
    console.error('Firebase system_status update error:', e);
  }
}

// 6. Complete Sync: Push all existing departments and drawings to Firestore

export async function backupDataToFirestore(
  departments: DepartmentInfo[],
  drawings: Drawing[]
): Promise<void> {
  try {
    const db = getFirebaseDb();
    const backupId = `backup_${Date.now()}`;
    const backupDocRef = doc(db, 'backups', backupId);
    
    // Save metadata
    await setDoc(backupDocRef, {
      timestamp: new Date().toISOString(),
      departmentCount: departments.length,
      drawingCount: drawings.length,
      status: 'COMPLETED'
    });
    
    // Save collections inside backup document
    const deptPromises = departments.map(dept => 
      setDoc(doc(db, `backups/${backupId}/departments`, dept.id), dept)
    );
    const dwgPromises = drawings.map(dwg => 
      setDoc(doc(db, `backups/${backupId}/drawings`, dwg.id), dwg)
    );
    
    await Promise.all([...deptPromises, ...dwgPromises]);
    console.log('Backup created successfully:', backupId);
  } catch (err) {
    console.error('Failed to create backup in Firebase:', err);
    throw err;
  }
}

export async function syncAllToFirebaseDatabase(
  departments: DepartmentInfo[],
  drawings: Drawing[],
  notifications: NotificationAlert[] = []
): Promise<{ success: boolean; syncedCount: number; message: string }> {
  try {
    await saveAllDepartmentsToFirestore(departments);
    await saveAllDrawingsToFirestore(drawings);
    
    // Also create a backup folder structure in Firebase
    try {
      await backupDataToFirestore(departments, drawings);
    } catch(backupErr) {
      console.warn('Backup non-fatal error:', backupErr);
    }
    
    for (const notif of notifications) {
      await saveNotificationToFirestore(notif);
    }
    await updateSystemStatus(departments.length, drawings.length);
    return {
      success: true,
      syncedCount: departments.length + drawings.length,
      message: `บันทึกข้อมูลทั้งหมด (${departments.length} แผนก, ${drawings.length} ดรออิ้ง) ไปยัง Firebase (${DATABASE_NAME}) เรียบร้อยแล้ว`,
    };
  } catch (error: any) {
    console.error('Full sync to Firebase failed:', error);
    return {
      success: false,
      syncedCount: 0,
      message: error?.message || 'การบันทึกข้อมูลไป Firebase ล้มเหลว',
    };
  }
}

// 7. Real-time Snapshot Subscriptions
export function subscribeToFirebaseDrawings(callback: (drawings: Drawing[]) => void): Unsubscribe {
  try {
    const db = getFirebaseDb();
    return onSnapshot(
      collection(db, 'drawings'),
      (snapshot) => {
        if (!snapshot.empty) {
          const dwgs = snapshot.docs.map((d) => d.data() as Drawing);
          callback(dwgs);
        }
      },
      (err) => {
        console.warn('Firebase drawings snapshot subscription notice:', err?.message || err);
      }
    );
  } catch (err) {
    console.warn('Failed to subscribe to drawings snapshot:', err);
    return () => {};
  }
}

export function subscribeToFirebaseDepartments(callback: (depts: DepartmentInfo[]) => void): Unsubscribe {
  try {
    const db = getFirebaseDb();
    return onSnapshot(
      collection(db, 'departments'),
      (snapshot) => {
        if (!snapshot.empty) {
          const depts = snapshot.docs.map((d) => d.data() as DepartmentInfo);
          callback(depts);
        }
      },
      (err) => {
        console.warn('Firebase departments snapshot subscription notice:', err?.message || err);
      }
    );
  } catch (err) {
    console.warn('Failed to subscribe to departments snapshot:', err);
    return () => {};
  }
}
