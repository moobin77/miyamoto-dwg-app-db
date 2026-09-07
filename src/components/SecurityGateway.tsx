import React, { useState } from 'react';
import { Lock, Unlock, KeyRound, User, AlertTriangle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { verifyUserCredentials, verifyFactoryKioskPin } from '../services/securityService';
import { UserProfile, DepartmentId } from '../types';

interface SecurityGatewayProps {
  onUnlock: (user: UserProfile) => void;
  initialError?: string;
}

export const SecurityGateway: React.FC<SecurityGatewayProps> = ({
  onUnlock,
  initialError,
}) => {
  const [activeTab, setActiveTab] = useState<'LOGIN' | 'KIOSK_PIN'>('LOGIN');

  // Login tab state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState(initialError || '');

  // Kiosk PIN tab state
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [kioskDept, setKioskDept] = useState<DepartmentId>('SAS');
  const [nameInput, setNameInput] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage('กรุณาระบุไอดีและรหัสผ่าน');
      return;
    }

    try {
      setIsVerifying(true);
      setErrorMessage('');
      const authCheck = await verifyUserCredentials(username, password);

      if (authCheck.authorized && authCheck.user) {
        const approvedProfile: UserProfile = {
          uid: authCheck.user.id,
          email: authCheck.user.email || '',
          displayName: authCheck.user.displayName || username,
          role: authCheck.user.role,
          department:
            authCheck.user.department === 'ALL'
              ? 'SAS'
              : authCheck.user.department || 'SAS',
          loggedInAt: new Date().toISOString(),
          username: authCheck.user.username,
        };
        onUnlock(approvedProfile);
      } else {
        setErrorMessage(authCheck.reason || 'รหัสผ่านหรือไอดีไม่ถูกต้อง');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage('เกิดข้อผิดพลาดในการเชื่อมต่อระบบ');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleKioskPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) return;
    if (!nameInput.trim()) { setErrorMessage("กรุณาระบุชื่อช่าง (Operator Name)"); return; }

    try {
      setIsVerifying(true);
      setErrorMessage('');
      const res = await verifyFactoryKioskPin(pinInput, kioskDept, nameInput || undefined);
      if (res.authorized && res.user) {
        onUnlock(res.user);
      } else {
        setErrorMessage(res.reason || 'รหัสลับไม่ถูกต้อง');
      }
    } catch (err) {
      setErrorMessage('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-tech select-none">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 mb-2 shadow-lg shadow-blue-900/20">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            MIYAMOTO <span className="text-blue-500">DWG</span>
          </h1>
          <p className="text-slate-400 text-sm font-medium">เข้าสู่ระบบจัดการดรออิ้ง</p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
          <div className="flex border-b border-slate-800">
            <button
              className={`flex-1 py-4 text-sm font-bold transition ${
                activeTab === 'LOGIN' ? 'text-blue-400 border-b-2 border-blue-500 bg-blue-500/5' : 'text-slate-500 hover:text-slate-300'
              }`}
              onClick={() => setActiveTab('LOGIN')}
            >
              ล็อคอินบัญชี (Login)
            </button>
            <button
              className={`flex-1 py-4 text-sm font-bold transition ${
                activeTab === 'KIOSK_PIN' ? 'text-amber-400 border-b-2 border-amber-500 bg-amber-500/5' : 'text-slate-500 hover:text-slate-300'
              }`}
              onClick={() => setActiveTab('KIOSK_PIN')}
            >
              โหมดหน้าเครื่อง (Operator)
            </button>
          </div>

          <div className="p-6 md:p-8">
            {errorMessage && (
              <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="text-xs text-red-300 font-medium">{errorMessage}</div>
              </div>
            )}

            {activeTab === 'LOGIN' && (
              <form onSubmit={handleLoginSubmit} className="space-y-5">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-2">
                    ไอดีผู้ใช้งาน (ID)
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="เช่น admin"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 pl-9 pr-3 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-2">
                    รหัสผ่าน (Password)
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 pl-9 pr-10 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-white transition p-0.5"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isVerifying}
                  className="w-full py-3 mt-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 transition disabled:opacity-50"
                >
                  {isVerifying ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Unlock className="w-4 h-4" />
                  )}
                  <span>เข้าสู่ระบบ</span>
                </button>
              </form>
            )}

            {activeTab === 'KIOSK_PIN' && (
              <form onSubmit={handleKioskPinSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-2">ไลน์เครื่อง</label>
                    <select
                      value={kioskDept}
                      onChange={(e) => setKioskDept(e.target.value as DepartmentId)}
                      className="w-full bg-slate-950 border border-slate-700 px-3 py-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="SAS">SAS - กระบอกสูบ</option>
                      <option value="PTS">PTS - งานกลึง</option>
                      <option value="OTS">OTS - ออปติก</option>
                      <option value="BOM">BOM - รายการชิ้นส่วน</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-2">ชื่อช่าง</label>
                    <input
                      type="text"
                      placeholder="เช่น ช่างเจษฎา"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-700 px-3 py-2.5 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-2">
                    PIN ปลดล็อคเครื่องจักร
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type={showPin ? 'text' : 'password'}
                      required
                      placeholder="8899"
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 pl-9 pr-10 py-2.5 rounded-xl text-lg tracking-[0.5em] font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition text-center"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-white transition p-0.5"
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isVerifying}
                  className="w-full py-3 mt-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-900/30 transition disabled:opacity-50"
                >
                  {isVerifying ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Unlock className="w-4 h-4" />
                  )}
                  <span>ปลดล็อคเครื่องจักร</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
