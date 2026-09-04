import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Users,
  UserPlus,
  KeyRound,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  X,
  Lock,
  Unlock,
  Save,
  Clock,
  Building2,
  Mail,
  Crown,
  Search,
  Check,
} from 'lucide-react';
import {
  SUPER_ADMIN_EMAIL,
  fetchAuthorizedUsers,
  fetchSecurityConfig,
  saveSecurityConfig,
  addAuthorizedUser,
  updateAuthorizedUser,
  deleteAuthorizedUser,
  fetchAccessRequests,
  resolveAccessRequest,
} from '../services/securityService';
import { AuthorizedUser, SecurityConfig, AccessRequest, DepartmentId } from '../types';

interface AccessControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail?: string;
}

export const AccessControlModal: React.FC<AccessControlModalProps> = ({
  isOpen,
  onClose,
  currentUserEmail,
}) => {
  const [activeTab, setActiveTab] = useState<'USERS' | 'POLICY' | 'REQUESTS'>('USERS');
  const [users, setUsers] = useState<AuthorizedUser[]>([]);
  const [config, setConfig] = useState<SecurityConfig | null>(null);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [noticeMessage, setNoticeMessage] = useState('');

  // Add User Form State
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'ADMIN' | 'ENGINEER' | 'OPERATOR'>('OPERATOR');
  const [newDept, setNewDept] = useState<DepartmentId | 'ALL'>('ALL');

  // Policy Form State
  const [policyMode, setPolicyMode] = useState<'ALLOW_KIOSK_PIN' | 'STRICT_WHITELIST' | 'LOCKDOWN'>(
    'ALLOW_KIOSK_PIN'
  );
  const [policyPin, setPolicyPin] = useState('8899');
  const [policyAutoLock, setPolicyAutoLock] = useState(30);
  const [policyDomain, setPolicyDomain] = useState('');
  const [isSavingPolicy, setIsSavingPolicy] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    loadAllData();
  }, [isOpen]);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [uList, cfg, reqs] = await Promise.all([
        fetchAuthorizedUsers(),
        fetchSecurityConfig(),
        fetchAccessRequests(),
      ]);
      setUsers(uList);
      setConfig(cfg);
      setRequests(reqs);

      setPolicyMode(cfg.mode);
      setPolicyPin(cfg.kioskPin);
      setPolicyAutoLock(cfg.autoLockMinutes);
      setPolicyDomain(cfg.allowedDomain || '');
    } catch (err) {
      console.error('Failed to load security data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const showNotification = (msg: string) => {
    setNoticeMessage(msg);
    setTimeout(() => setNoticeMessage(''), 4000);
  };

  // Add New User to Whitelist
  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    try {
      const created = await addAuthorizedUser({
        email: newEmail.trim().toLowerCase(),
        displayName: newName.trim() || newEmail.split('@')[0],
        role: newRole,
        department: newDept,
        status: 'ACTIVE',
        addedBy: currentUserEmail || SUPER_ADMIN_EMAIL,
      });

      setUsers((prev) => {
        const filtered = prev.filter((u) => u.id !== created.id);
        return [created, ...filtered];
      });

      setNewEmail('');
      setNewName('');
      setIsAddingUser(false);
      showNotification(`เพิ่ม ${created.email} เข้าสู่ Whitelist เรียบร้อยแล้ว`);
    } catch (err: any) {
      alert(err?.message || 'เกิดข้อผิดพลาดในการเพิ่มผู้ใช้');
    }
  };

  // Toggle user status (Active vs Revoked)
  const handleToggleStatus = async (user: AuthorizedUser) => {
    if (user.isOwner) {
      alert('ไม่สามารถระงับสิทธิ์ Super Admin (เจ้าของระบบ) ได้');
      return;
    }
    const newStatus = user.status === 'ACTIVE' ? 'REVOKED' : 'ACTIVE';
    try {
      await updateAuthorizedUser(user.id, { status: newStatus });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
      );
      showNotification(
        newStatus === 'ACTIVE'
          ? `เปิดใช้งานสิทธิ์ของ ${user.email} แล้ว`
          : `ระงับสิทธิ์ของ ${user.email} แล้ว`
      );
    } catch (err: any) {
      alert(err?.message || 'เกิดข้อผิดพลาด');
    }
  };

  // Delete User from Whitelist
  const handleDeleteUser = async (user: AuthorizedUser) => {
    if (user.isOwner) {
      alert('ไม่สามารถลบ Super Admin ผู้เป็นเจ้าของระบบได้');
      return;
    }
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบ ${user.email} ออกจากสิทธิ์เข้าถึง?`)) {
      return;
    }

    try {
      await deleteAuthorizedUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      showNotification(`ลบ ${user.email} ออกจากระบบแล้ว`);
    } catch (err: any) {
      alert(err?.message || 'เกิดข้อผิดพลาด');
    }
  };

  // Save Security Policies
  const handleSavePolicy = async () => {
    setIsSavingPolicy(true);
    try {
      const updated: SecurityConfig = {
        mode: policyMode,
        kioskPin: policyPin.trim() || '8899',
        autoLockMinutes: policyAutoLock,
        allowedDomain: policyDomain.trim(),
        updatedAt: new Date().toISOString(),
        updatedBy: currentUserEmail || SUPER_ADMIN_EMAIL,
      };
      await saveSecurityConfig(updated);
      setConfig(updated);
      showNotification('บันทึกนโยบายความปลอดภัยสำเร็จ');
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการบันทึกนโยบาย');
    } finally {
      setIsSavingPolicy(false);
    }
  };

  // Resolve Access Request
  const handleResolveRequest = async (reqId: string, approve: boolean) => {
    try {
      await resolveAccessRequest(reqId, approve, 'OPERATOR');
      await loadAllData();
      showNotification(
        approve ? 'อนุมัติคำขอเข้าใช้งานและเพิ่มลง Whitelist แล้ว' : 'ปฏิเสธคำขอเรียบร้อยแล้ว'
      );
    } catch (err) {
      alert('เกิดข้อผิดพลาด');
    }
  };

  // Filtered users list
  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingRequestsCount = requests.filter((r) => r.status === 'PENDING').length;

  return (
    <div
      id="access-control-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="access-control-modal"
        className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-red-950/40 via-slate-900 to-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">ระบบจัดการสิทธิ์ผู้ใช้งานและ Whitelist</h2>
                <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 text-[10px] font-mono border border-red-500/30">
                  Access Control
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                กำหนดรายชื่อผู้มีสิทธิ์เข้าถึงแบบดรออิ้งและสเปกการผลิตลับเฉพาะ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Notice message */}
        {noticeMessage && (
          <div className="bg-emerald-950/80 border-b border-emerald-500/40 px-6 py-2 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{noticeMessage}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-slate-950/40 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('USERS')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'USERS'
                ? 'border-red-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4 text-blue-400" />
            <span>ผู้มีสิทธิ์เข้าถึง (Whitelist)</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-slate-300">
              {users.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('POLICY')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'POLICY'
                ? 'border-red-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4 text-amber-400" />
            <span>นโยบายความปลอดภัย & รหัส PIN</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('REQUESTS')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'REQUESTS'
                ? 'border-red-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mail className="w-4 h-4 text-emerald-400" />
            <span>คำขอเข้าใช้งานรออนุมัติ</span>
            {pendingRequestsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold">
                {pendingRequestsCount}
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="py-16 text-center text-xs text-slate-400">
              กำลังโหลดข้อมูลระบบความปลอดภัย...
            </div>
          ) : activeTab === 'USERS' ? (
            <div className="space-y-4">
              {/* Header Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อ, อีเมล หรือบทบาท..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 pl-9 pr-3 py-1.5 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddingUser(!isAddingUser)}
                  className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 transition shrink-0"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ เพิ่มอีเมลผู้มีสิทธิ์</span>
                </button>
              </div>

              {/* Add User Dropdown Panel */}
              {isAddingUser && (
                <form
                  onSubmit={handleAddUserSubmit}
                  className="p-4 rounded-xl bg-slate-950 border border-red-500/40 space-y-3 animate-fadeIn"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-red-400">
                    <span>ระบุข้อมูลผู้มีสิทธิ์เข้าใช้งานระบบใหม่</span>
                    <button
                      type="button"
                      onClick={() => setIsAddingUser(false)}
                      className="text-slate-400 hover:text-white text-[11px]"
                    >
                      ปิด
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        อีเมล Gmail / บัญชี Google <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="เช่น operator.name@gmail.com"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        ชื่อ-สกุล / ชื่อเรียก
                      </label>
                      <input
                        type="text"
                        placeholder="เช่น ช่างวิเชียร"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        ระดับสิทธิ์ (Role)
                      </label>
                      <select
                        value={newRole}
                        onChange={(e) =>
                          setNewRole(e.target.value as 'ADMIN' | 'ENGINEER' | 'OPERATOR')
                        }
                        className="w-full bg-slate-900 border border-slate-700 px-2 py-1.5 rounded-lg text-xs text-white focus:outline-none focus:border-red-500"
                      >
                        <option value="OPERATOR">OPERATOR - ดูแบบ, ลงบันทึกตรวจขนาด, ตรวจรับงาน</option>
                        <option value="ENGINEER">ENGINEER - เพิ่มรุ่น, อัปโหลดไฟล์ CAD/PDF, แก้ไขแบบ</option>
                        <option value="ADMIN">ADMIN - สิทธิ์เต็ม: จัดการซีรี่ส์, อนุมัติแบบ, ลบข้อมูล</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        แผนกที่อนุญาต
                      </label>
                      <select
                        value={newDept}
                        onChange={(e) => setNewDept(e.target.value as DepartmentId | 'ALL')}
                        className="w-full bg-slate-900 border border-slate-700 px-2 py-1.5 rounded-lg text-xs text-white focus:outline-none focus:border-red-500"
                      >
                        <option value="ALL">ทุกแผนก (SAS + PTS + OTS)</option>
                        <option value="SAS">SAS - สายผลิตกระบอกสูบเท่านั้น</option>
                        <option value="PTS">PTS - สายผลิตท่อเท่านั้น</option>
                        <option value="OTS">OTS - สายผลิตพิเศษเท่านั้น</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingUser(false)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-bold text-white flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>บันทึกลง Whitelist</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Users Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">ผู้ใช้งาน / อีเมล</th>
                      <th className="py-2.5 px-3">บทบาท (Role)</th>
                      <th className="py-2.5 px-3">แผนก</th>
                      <th className="py-2.5 px-3">สถานะ</th>
                      <th className="py-2.5 px-3 text-right">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredUsers.map((u) => {
                      const isOwner =
                        u.isOwner || u.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

                      return (
                        <tr key={u.id} className="hover:bg-slate-800/30 transition">
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                  isOwner
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                    : 'bg-slate-800 text-slate-300'
                                }`}
                              >
                                {isOwner ? <Crown className="w-3.5 h-3.5 text-amber-400" /> : u.displayName.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-white truncate flex items-center gap-1.5">
                                  <span>{u.displayName}</span>
                                  {isOwner && (
                                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[9px] font-mono border border-amber-500/30">
                                      Owner
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono truncate">
                                  {u.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                u.role === 'ADMIN'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : u.role === 'ENGINEER'
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-300">
                            {u.department === 'ALL' ? 'ทุกแผนก' : u.department || 'SAS'}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                u.status === 'ACTIVE'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  u.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-rose-400'
                                }`}
                              />
                              {u.status === 'ACTIVE' ? 'อนุญาต' : 'ระงับสิทธิ์'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {isOwner ? (
                              <span className="text-[10px] text-slate-500 font-mono">
                                ปกป้องถาวร
                              </span>
                            ) : (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleToggleStatus(u)}
                                  className={`p-1.5 rounded-lg text-xs transition ${
                                    u.status === 'ACTIVE'
                                      ? 'text-amber-400 hover:bg-amber-500/10'
                                      : 'text-emerald-400 hover:bg-emerald-500/10'
                                  }`}
                                  title={u.status === 'ACTIVE' ? 'ระงับสิทธิ์ชั่วคราว' : 'เปิดใช้งานสิทธิ์'}
                                >
                                  {u.status === 'ACTIVE' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(u)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                                  title="ลบออกจากระบบ"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === 'POLICY' ? (
            <div className="space-y-6">
              {/* Security Mode Options */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-white block">
                  ระดับความเข้มงวดการรักษาความปลอดภัย (Security Level)
                </label>

                <div className="grid grid-cols-1 gap-3">
                  {/* Option 1: ALLOW_KIOSK_PIN */}
                  <div
                    onClick={() => setPolicyMode('ALLOW_KIOSK_PIN')}
                    className={`p-4 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                      policyMode === 'ALLOW_KIOSK_PIN'
                        ? 'bg-slate-800/80 border-amber-500 ring-1 ring-amber-500'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full border border-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                      {policyMode === 'ALLOW_KIOSK_PIN' && (
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>อนุญาตทั้ง Gmail ที่ผ่าน Whitelist และ Factory PIN ประจำเครื่อง (แนะนำ)</span>
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px]">
                          Factory Standard
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        เจ้าหน้าที่สามารถล็อกอินด้วย Gmail ที่ผ่านอนุมัติ หรือแท็บเล็ตหน้าเครื่องจักรสามารถใส่ Factory PIN เพื่อเปิดดูแบบในฐานะ Operator ได้
                      </p>
                    </div>
                  </div>

                  {/* Option 2: STRICT_WHITELIST */}
                  <div
                    onClick={() => setPolicyMode('STRICT_WHITELIST')}
                    className={`p-4 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                      policyMode === 'STRICT_WHITELIST'
                        ? 'bg-slate-800/80 border-blue-500 ring-1 ring-blue-500'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full border border-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                      {policyMode === 'STRICT_WHITELIST' && (
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>เข้มงวดสูงสุด: เฉพาะ Gmail ที่อยู่ใน Whitelist เท่านั้น (Strict Whitelist)</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        ปิดกั้นการใช้รหัส PIN ประจำเครื่อง ทุกคนต้องยืนยันตัวตนด้วยบัญชี Google/Gmail ส่วนตัวที่ผ่านการตรวจสอบเท่านั้น
                      </p>
                    </div>
                  </div>

                  {/* Option 3: LOCKDOWN */}
                  <div
                    onClick={() => setPolicyMode('LOCKDOWN')}
                    className={`p-4 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                      policyMode === 'LOCKDOWN'
                        ? 'bg-red-950/40 border-red-500 ring-1 ring-red-500'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full border border-red-500 flex items-center justify-center shrink-0 mt-0.5">
                      {policyMode === 'LOCKDOWN' && (
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-red-300 flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                        <span>ล็อคระบบฉุกเฉิน (Emergency Lockdown)</span>
                      </div>
                      <p className="text-[11px] text-red-200/80 mt-1 leading-relaxed">
                        ปิดกั้นผู้ใช้งานทุกคนทันที ยกเว้น Super Admin ({SUPER_ADMIN_EMAIL}) เท่านั้น เหมาะสำหรับกรณีตรวจพบการรั่วไหลของข้อมูล
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* PIN and Timeout Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-800">
                <div>
                  <label className="text-xs font-bold text-white block mb-1">
                    รหัสผ่านประจำเครื่อง (Factory Kiosk PIN)
                  </label>
                  <p className="text-[10px] text-slate-400 mb-2">
                    สำหรับแท็บเล็ตหน้าเครื่องจักรเพื่อปลดล็อคเข้าใช้งาน Operator
                  </p>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={policyPin}
                      onChange={(e) => setPolicyPin(e.target.value)}
                      placeholder="เช่น 8899"
                      className="w-full bg-slate-950 border border-slate-700 pl-9 pr-3 py-2 rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-white block mb-1">
                    ระบบล็อคหน้าจออัตโนมัติ (Auto-Lock Timer)
                  </label>
                  <p className="text-[10px] text-slate-400 mb-2">
                    เมื่อไม่มีการใช้งานตามเวลาที่กำหนด จะล็อคเข้าสู่ Security Gateway ทันที
                  </p>
                  <select
                    value={policyAutoLock}
                    onChange={(e) => setPolicyAutoLock(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 px-3 py-2 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value={5}>5 นาที (ความปลอดภัยสูงสุด)</option>
                    <option value={15}>15 นาที</option>
                    <option value={30}>30 นาที (ค่ามาตรฐาน)</option>
                    <option value={60}>1 ชั่วโมง</option>
                    <option value={0}>ไม่ล็อคอัตโนมัติ (ปิดใช้งาน)</option>
                  </select>
                </div>
              </div>

              {/* Allowed Company Domain */}
              <div className="pt-3 border-t border-slate-800">
                <label className="text-xs font-bold text-white block mb-1">
                  โดเมนอีเมลองค์กรที่อนุญาตอัตโนมัติ (Company Email Domain - ไม่บังคับ)
                </label>
                <p className="text-[10px] text-slate-400 mb-2">
                  หากระบุ อีเมลที่ลงท้ายด้วยโดเมนนี้จะสามารถเข้าใช้งานได้ทันที เช่น miyamoto.co.th
                </p>
                <input
                  type="text"
                  value={policyDomain}
                  onChange={(e) => setPolicyDomain(e.target.value)}
                  placeholder="เช่น miyamoto.co.th (เว้นว่างไว้หากต้องการระบุเป็นรายบุคคล)"
                  className="w-full bg-slate-950 border border-slate-700 px-3 py-2 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  disabled={isSavingPolicy}
                  onClick={handleSavePolicy}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-red-900/30 transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>บันทึกนโยบายความปลอดภัย</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-xs text-slate-400">
                รายการพนักงานหรือช่างที่ส่งคำขอเข้าใช้งานผ่านหน้า Security Gateway
              </div>

              {requests.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  ไม่มีคำขอเข้าใช้งานที่รอดำเนินการ
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.map((req) => (
                    <div
                      key={req.id}
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">{req.displayName}</span>
                          <span className="text-[11px] text-slate-400 font-mono">({req.email})</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                              req.status === 'PENDING'
                                ? 'bg-amber-500/20 text-amber-300'
                                : req.status === 'APPROVED'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {req.status === 'PENDING'
                              ? 'รออนุมัติ'
                              : req.status === 'APPROVED'
                              ? 'อนุมัติแล้ว'
                              : 'ปฏิเสธ'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          แผนก: {req.department || 'SAS'} • เหตุผล: {req.reason || 'ไม่ได้ระบุ'}
                        </div>
                      </div>

                      {req.status === 'PENDING' && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleResolveRequest(req.id, false)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
                          >
                            ปฏิเสธ
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResolveRequest(req.id, true)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>อนุมัติสิทธิ์เข้าใช้งาน</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
