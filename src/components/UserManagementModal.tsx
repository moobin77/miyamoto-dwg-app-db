import React, { useState, useEffect } from 'react';
import { Users, UserPlus, KeyRound, Trash2, CheckCircle2, AlertTriangle, X, ShieldCheck } from 'lucide-react';
import { fetchAuthorizedUsers, addAuthorizedUser, deleteAuthorizedUser, updateAuthorizedUser, SUPER_ADMIN_EMAIL, fetchSecurityConfig, saveSecurityConfig } from '../services/securityService';
import { AuthorizedUser, DepartmentId } from '../types';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: AuthorizedUser;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [users, setUsers] = useState<AuthorizedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Add User State
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'ADMIN' | 'ENGINEER' | 'OPERATOR'>('OPERATOR');
  const [newDept, setNewDept] = useState<DepartmentId | 'ALL'>('ALL');

  // Edit Password State
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingPassword, setEditingPassword] = useState('');

  // Kiosk Pin
  const [kioskPin, setKioskPin] = useState('8899');
  const [isEditingKiosk, setIsEditingKiosk] = useState(false);
  const [newKioskPin, setNewKioskPin] = useState('');
  const [securityConfig, setSecurityConfig] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      loadSecurityConfig();
    }
  }, [isOpen]);

  const loadSecurityConfig = async () => {
    const config = await fetchSecurityConfig();
    setSecurityConfig(config);
    setKioskPin(config.kioskPin || '8899');
    setNewKioskPin(config.kioskPin || '8899');
  };

  const handleUpdateKioskPin = async () => {
    if (!newKioskPin.trim()) return;
    try {
      if (securityConfig) {
         const updated = { ...securityConfig, kioskPin: newKioskPin.trim() };
         await saveSecurityConfig(updated);
         setKioskPin(updated.kioskPin);
         setIsEditingKiosk(false);
      }
    } catch (err: any) {
      alert('เปลี่ยนรหัสผ่าน Operator ล้มเหลว: ' + err.message);
    }
  };

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const list = await fetchAuthorizedUsers();
      setUsers(list);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword) return;
    try {
      await addAuthorizedUser({
        username: newUsername.trim().toLowerCase(),
        password: newPassword,
        displayName: newName.trim() || newUsername,
        role: newRole,
        department: newDept,
        status: 'ACTIVE',
        addedBy: currentUser?.username || 'admin',
      });
      setIsAddingUser(false);
      setNewUsername('');
      setNewPassword('');
      setNewName('');
      loadUsers();
    } catch (err: any) {
      console.error(err);
      alert('เพิ่มผู้ใช้ล้มเหลว: ' + err.message);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('ยืนยันการลบบัญชีผู้ใช้นี้?')) return;
    try {
      await deleteAuthorizedUser(userId);
      loadUsers();
    } catch (err: any) {
      alert(err.message || 'ไม่สามารถลบผู้ใช้นี้ได้');
    }
  };

  const handleUpdatePassword = async (userId: string) => {
    if (!editingPassword.trim()) return;
    try {
      await updateAuthorizedUser(userId, { password: editingPassword.trim() });
      setEditingUserId(null);
      setEditingPassword('');
      loadUsers();
    } catch (err: any) {
      console.error(err);
      alert('เปลี่ยนรหัสผ่านล้มเหลว: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm font-tech">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">จัดการผู้ใช้งานระบบ</h2>
              <p className="text-xs text-slate-400">ควบคุมสิทธิ์และบัญชีผู้เข้าใช้</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {/* Kiosk Pin Section */}
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">รหัส PIN เข้าใช้งานหน้าเครื่อง (Operator KIOSK)</h3>
                <p className="text-xs text-slate-400">ใช้สำหรับล็อคอินเข้าสู่หน้าจอทำงานของพนักงาน</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isEditingKiosk ? (
                <>
                  <input
                    type="text"
                    value={newKioskPin}
                    onChange={(e) => setNewKioskPin(e.target.value)}
                    className="w-24 bg-slate-950 border border-amber-500/50 rounded-lg px-3 py-1.5 text-sm font-mono tracking-widest text-amber-400 focus:outline-none text-center"
                    maxLength={6}
                  />
                  <button onClick={handleUpdateKioskPin} className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30">
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setIsEditingKiosk(false)} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200">
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <div className="px-4 py-1.5 bg-slate-950 rounded-lg border border-slate-800 text-sm font-mono tracking-widest text-slate-300">
                    {kioskPin}
                  </div>
                  {(currentUser?.email === SUPER_ADMIN_EMAIL || currentUser?.username === 'admin') && (
                    <button onClick={() => setIsEditingKiosk(true)} className="p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-md transition" title="เปลี่ยน PIN">
                      <KeyRound className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {isAddingUser ? (
            <div className="bg-slate-950 border border-blue-500/30 rounded-xl p-5 mb-6">
              <h3 className="text-sm font-bold text-blue-400 flex items-center gap-2 mb-4">
                <UserPlus className="w-4 h-4" /> สร้างบัญชีใหม่
              </h3>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">ไอดี (Username)</label>
                    <input
                      type="text"
                      required
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">รหัสผ่าน (Password)</label>
                    <input
                      type="text"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">ชื่อที่แสดง</label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">บทบาท (Role)</label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                    >
                      <option value="OPERATOR">Operator (ดูข้อมูลและบันทึกหน้าเครื่อง)</option>
                      <option value="ENGINEER">Engineer (จัดการแบบและพิจารณา ECO)</option>
                      <option value="ADMIN">Admin (จัดการระบบเต็มรูปแบบ)</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button type="button" onClick={() => setIsAddingUser(false)} className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm">
                    ยกเลิก
                  </button>
                  <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 text-sm font-bold">
                    บันทึกบัญชีใหม่
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setIsAddingUser(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" /> เพิ่มบัญชีผู้ใช้
              </button>
            </div>
          )}

          <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-xs">
                <tr>
                  <th className="px-4 py-3">ไอดี (Username)</th>
                  <th className="px-4 py-3">ชื่อ-สกุล</th>
                  <th className="px-4 py-3">บทบาท</th>
                  <th className="px-4 py-3 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-900/50 transition">
                    <td className="px-4 py-3 font-mono text-blue-300 font-bold">{u.username}</td>
                    <td className="px-4 py-3">{u.displayName} {u.isOwner && <span className="ml-2 text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/30">System Owner</span>}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold border ${u.role === 'ADMIN' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : u.role === 'ENGINEER' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right flex justify-end gap-2">
                      {editingUserId === u.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            placeholder="รหัสผ่านใหม่"
                            value={editingPassword}
                            onChange={(e) => setEditingPassword(e.target.value)}
                            className="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                          />
                          <button onClick={() => handleUpdatePassword(u.id)} className="p-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30">
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditingUserId(null)} className="p-1 rounded bg-slate-800 text-slate-400 hover:text-slate-200">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        ((currentUser?.email === SUPER_ADMIN_EMAIL || currentUser?.username === 'admin') || u.role !== 'ADMIN' || u.id === currentUser?.uid) && (
                          <button onClick={() => setEditingUserId(u.id)} className="p-1.5 bg-slate-800 text-slate-400 hover:text-slate-200 rounded-md transition" title="เปลี่ยนรหัสผ่าน">
                            <KeyRound className="w-4 h-4" />
                          </button>
                        )
                      )}
                      {!u.isOwner && ((currentUser?.email === SUPER_ADMIN_EMAIL || currentUser?.username === 'admin') || u.role !== 'ADMIN') && (
                        <button onClick={() => handleDelete(u.id)} className="p-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-md transition" title="ลบบัญชี">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
