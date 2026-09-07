import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { getFirebaseDb } from './firebase';
import { AuthorizedUser, AccessRequest, SecurityConfig, UserProfile, DepartmentId } from '../types';

export const SUPER_ADMIN_EMAIL = 'moobinnpm5786@gmail.com';
const LOCAL_WHITELIST_KEY = 'miyamoto_security_whitelist';
const LOCAL_CONFIG_KEY = 'miyamoto_security_config';
const LOCAL_REQUESTS_KEY = 'miyamoto_security_requests';
const CURRENT_USER_KEY = 'miyamoto_authorized_session';
const SCREEN_LOCKED_KEY = 'miyamoto_screen_locked';

// Initial default whitelist
export const DEFAULT_WHITELIST: AuthorizedUser[] = [
  {
    id: 'user-superadmin-01',
    username: 'admin',
    password: 'password', // Default admin password
    displayName: 'Super Admin (ผู้ดูแลระบบหลัก)',
    role: 'ADMIN',
    department: 'ALL',
    status: 'ACTIVE',
    addedAt: '2026-01-01T00:00:00.000Z',
    addedBy: 'SYSTEM',
    isOwner: true,
  },
];

export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  mode: 'ALLOW_KIOSK_PIN',
  kioskPin: '8899',
  autoLockMinutes: 30,
  allowedDomain: '',
  updatedAt: new Date().toISOString(),
  updatedBy: 'SYSTEM',
};

// --- Local Storage Helpers ---
function getLocalWhitelist(): AuthorizedUser[] {
  try {
    const raw = localStorage.getItem(LOCAL_WHITELIST_KEY);
    if (!raw) return DEFAULT_WHITELIST;
    const parsed: AuthorizedUser[] = JSON.parse(raw);
    // Ensure admin user is always present
    if (!parsed.some((u) => u.username?.toLowerCase() === 'admin')) {
      parsed.unshift(DEFAULT_WHITELIST[0]);
    }
    return parsed;
  } catch {
    return DEFAULT_WHITELIST;
  }
}

function saveLocalWhitelist(users: AuthorizedUser[]) {
  try {
    localStorage.setItem(LOCAL_WHITELIST_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to save local whitelist:', err);
  }
}

function getLocalConfig(): SecurityConfig {
  try {
    const raw = localStorage.getItem(LOCAL_CONFIG_KEY);
    if (!raw) return DEFAULT_SECURITY_CONFIG;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_SECURITY_CONFIG;
  }
}

function saveLocalConfig(config: SecurityConfig) {
  try {
    localStorage.setItem(LOCAL_CONFIG_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save local config:', err);
  }
}

function getLocalRequests(): AccessRequest[] {
  try {
    const raw = localStorage.getItem(LOCAL_REQUESTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalRequests(reqs: AccessRequest[]) {
  try {
    localStorage.setItem(LOCAL_REQUESTS_KEY, JSON.stringify(reqs));
  } catch (err) {
    console.error('Failed to save local requests:', err);
  }
}

// --- Firestore Syncing with Fallback ---
export async function fetchAuthorizedUsers(): Promise<AuthorizedUser[]> {
  try {
    const db = getFirebaseDb();
    const snap = await getDocs(collection(db, 'authorized_users'));
    if (!snap.empty) {
      const remoteUsers = snap.docs.map((d) => d.data() as AuthorizedUser);
      // Ensure super admin is included
      if (!remoteUsers.some((u) => u.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase())) {
        remoteUsers.unshift(DEFAULT_WHITELIST[0]);
      }
      saveLocalWhitelist(remoteUsers);
      return remoteUsers;
    }
  } catch (err) {
    console.warn('Could not fetch authorized users from Firestore, using local cache:', err);
  }
  return getLocalWhitelist();
}

export async function fetchSecurityConfig(): Promise<SecurityConfig> {
  try {
    const db = getFirebaseDb();
    const snap = await getDoc(doc(db, 'security_settings', 'config'));
    if (snap.exists()) {
      const cfg = snap.data() as SecurityConfig;
      saveLocalConfig(cfg);
      return cfg;
    }
  } catch (err) {
    console.warn('Could not fetch security config from Firestore, using local config:', err);
  }
  return getLocalConfig();
}

export async function saveSecurityConfig(config: SecurityConfig): Promise<void> {
  saveLocalConfig(config);
  try {
    const db = getFirebaseDb();
    await setDoc(doc(db, 'security_settings', 'config'), config);
  } catch (err) {
    console.warn('Failed to sync security config to Firestore:', err);
  }
}

export async function addAuthorizedUser(
  user: Omit<AuthorizedUser, 'id' | 'addedAt'>
): Promise<AuthorizedUser> {
  const newUser: AuthorizedUser = {
    ...user,
    id: `auth-user-${Date.now().toString(36)}`,
    email: user.email.trim().toLowerCase(),
    addedAt: new Date().toISOString(),
  };

  // Local update
  const list = getLocalWhitelist();
  const existingIndex = list.findIndex((u) => u.email.toLowerCase() === newUser.email.toLowerCase());
  if (existingIndex >= 0) {
    list[existingIndex] = { ...list[existingIndex], ...newUser, id: list[existingIndex].id };
  } else {
    list.push(newUser);
  }
  saveLocalWhitelist(list);

  // Firestore update
  try {
    const db = getFirebaseDb();
    await setDoc(doc(db, 'authorized_users', newUser.id), newUser);
  } catch (err) {
    console.warn('Failed to persist authorized user to Firestore:', err);
  }

  return newUser;
}

export async function updateAuthorizedUser(
  userId: string,
  updates: Partial<AuthorizedUser>
): Promise<void> {
  const list = getLocalWhitelist();
  const index = list.findIndex((u) => u.id === userId);
  if (index >= 0) {
    if (list[index].isOwner && updates.status === 'REVOKED') {
      throw new Error('ไม่สามารถระงับสิทธิ์ Super Admin ได้');
    }
    list[index] = { ...list[index], ...updates };
    saveLocalWhitelist(list);

    try {
      const db = getFirebaseDb();
      await setDoc(doc(db, 'authorized_users', userId), list[index], { merge: true });
    } catch (err) {
      console.warn('Failed to update authorized user in Firestore:', err);
    }
  }
}

export async function deleteAuthorizedUser(userId: string): Promise<void> {
  const list = getLocalWhitelist();
  const target = list.find((u) => u.id === userId);
  if (target?.isOwner) {
    throw new Error('ไม่สามารถลบ Super Admin ผู้เป็นเจ้าของระบบได้');
  }

  const updated = list.filter((u) => u.id !== userId);
  saveLocalWhitelist(updated);

  try {
    const db = getFirebaseDb();
    await deleteDoc(doc(db, 'authorized_users', userId));
  } catch (err) {
    console.warn('Failed to delete authorized user from Firestore:', err);
  }
}

// --- Access Verification Engine ---
export async function verifyUserCredentials(
  username: string,
  password?: string
): Promise<{
  authorized: boolean;
  user?: AuthorizedUser;
  reason?: string;
  config: SecurityConfig;
}> {
  const cleanUsername = username.trim().toLowerCase();
  const config = await fetchSecurityConfig();

  // Whitelist Verification
  const whitelist = await fetchAuthorizedUsers();
  const match = whitelist.find(
    (u) => u.username?.toLowerCase() === cleanUsername && u.status === 'ACTIVE'
  );

  if (match) {
    if (match.password !== password) {
      return {
        authorized: false,
        reason: 'รหัสผ่านไม่ถูกต้อง',
        config,
      };
    }
    // Record last accessed time
    updateAuthorizedUser(match.id, { lastAccessedAt: new Date().toISOString() }).catch(() => {});
    return {
      authorized: true,
      user: match,
      config,
    };
  }

  return {
    authorized: false,
    reason: `ไม่พบบัญชีผู้ใช้ (${cleanUsername}) หรือบัญชีถูกระงับ`,
    config,
  };
}

// --- Factory Kiosk PIN Verification ---
export async function verifyFactoryKioskPin(
  pin: string,
  stationDept: DepartmentId = 'SAS',
  operatorName = 'Operator (Station Tablet)'
): Promise<{
  authorized: boolean;
  user?: UserProfile;
  reason?: string;
}> {
  const config = await fetchSecurityConfig();

  if (config.mode === 'LOCKDOWN') {
    return {
      authorized: false,
      reason: 'ระบบอยู่ในสถานะ "ฉุกเฉิน (Lockdown)" ไม่อนุญาตให้ใช้รหัสประจำเครื่อง',
    };
  }

  if (config.mode === 'STRICT_WHITELIST') {
    return {
      authorized: false,
      reason: 'ระบบตั้งค่าความปลอดภัยเป็น "เข้มงวดสูงสุด (Strict Whitelist)" ต้องเข้าสู่ระบบด้วยบัญชี Gmail ที่ได้รับอนุญาตเท่านั้น',
    };
  }

  const expectedPin = config.kioskPin || '8899';
  if (pin.trim() === expectedPin.trim()) {
    const profile: UserProfile = {
      uid: `kiosk-${Date.now().toString(36)}`,
      email: `kiosk.${stationDept.toLowerCase()}@factory.internal`,
      displayName: `${operatorName} [${stationDept}]`,
      role: 'OPERATOR',
      department: stationDept,
      loggedInAt: new Date().toISOString(),
    };
    return { authorized: true, user: profile };
  }

  return { authorized: false, reason: 'รหัสความปลอดภัยประจำเครื่องไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง' };
}

// --- Access Requests Handling ---
export async function submitAccessRequest(
  req: Omit<AccessRequest, 'id' | 'requestedAt' | 'status'>
): Promise<AccessRequest> {
  const newReq: AccessRequest = {
    ...req,
    id: `req-${Date.now().toString(36)}`,
    email: req.email.trim().toLowerCase(),
    requestedAt: new Date().toISOString(),
    status: 'PENDING',
  };

  const requests = getLocalRequests();
  requests.unshift(newReq);
  saveLocalRequests(requests);

  try {
    const db = getFirebaseDb();
    await setDoc(doc(db, 'access_requests', newReq.id), newReq);
  } catch (err) {
    console.warn('Failed to sync access request to Firestore:', err);
  }

  return newReq;
}

export async function fetchAccessRequests(): Promise<AccessRequest[]> {
  try {
    const db = getFirebaseDb();
    const snap = await getDocs(collection(db, 'access_requests'));
    if (!snap.empty) {
      const list = snap.docs.map((d) => d.data() as AccessRequest);
      saveLocalRequests(list);
      return list;
    }
  } catch (err) {
    console.warn('Could not fetch access requests from Firestore:', err);
  }
  return getLocalRequests();
}

export async function resolveAccessRequest(
  requestId: string,
  approve: boolean,
  assignedRole: 'ADMIN' | 'ENGINEER' | 'OPERATOR' = 'OPERATOR'
): Promise<void> {
  const requests = getLocalRequests();
  const req = requests.find((r) => r.id === requestId);
  if (!req) return;

  req.status = approve ? 'APPROVED' : 'REJECTED';
  saveLocalRequests(requests);

  // If approved, add to whitelist!
  if (approve) {
    await addAuthorizedUser({
      email: req.email,
      displayName: req.displayName || req.email.split('@')[0],
      role: assignedRole,
      department: req.department || 'ALL',
      status: 'ACTIVE',
      addedBy: SUPER_ADMIN_EMAIL,
    });
  }

  try {
    const db = getFirebaseDb();
    await setDoc(doc(db, 'access_requests', requestId), req, { merge: true });
  } catch (err) {
    console.warn('Failed to resolve access request in Firestore:', err);
  }
}

// --- Session & Screen Lock State Management ---
export function getCurrentSession(): UserProfile | null {
  try {
    const saved = localStorage.getItem(CURRENT_USER_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export function setCurrentSession(user: UserProfile | null) {
  try {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      localStorage.removeItem(SCREEN_LOCKED_KEY);
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
      localStorage.removeItem(SCREEN_LOCKED_KEY);
    }
  } catch (err) {
    console.error('Session persistence error:', err);
  }
}

export function isScreenLocked(): boolean {
  try {
    return localStorage.getItem(SCREEN_LOCKED_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setScreenLocked(locked: boolean) {
  try {
    if (locked) {
      localStorage.setItem(SCREEN_LOCKED_KEY, 'true');
    } else {
      localStorage.removeItem(SCREEN_LOCKED_KEY);
    }
  } catch (err) {
    console.error('Lock state error:', err);
  }
}
