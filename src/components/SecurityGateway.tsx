import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  Mail,
  KeyRound,
  AlertTriangle,
  Send,
  Building2,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  SUPER_ADMIN_EMAIL,
  verifyUserAuthorization,
  verifyFactoryKioskPin,
  submitAccessRequest,
  fetchSecurityConfig,
} from '../services/securityService';
import { signInWithGoogle, signInWithDirectGmail } from '../services/firebase';
import { UserProfile, DepartmentId, SecurityConfig } from '../types';

interface SecurityGatewayProps {
  onUnlock: (user: UserProfile) => void;
  initialError?: string;
}

export const SecurityGateway: React.FC<SecurityGatewayProps> = ({
  onUnlock,
  initialError,
}) => {
  const [activeTab, setActiveTab] = useState<'GMAIL' | 'KIOSK_PIN'>('GMAIL');
  const [config, setConfig] = useState<SecurityConfig | null>(null);

  // Gmail tab state
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState(initialError || '');
  const [unauthorizedEmail, setUnauthorizedEmail] = useState<string | null>(null);

  // Kiosk PIN tab state
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [kioskDept, setKioskDept] = useState<DepartmentId>('SAS');

  // Request Access state
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [reqName, setReqName] = useState('');
  const [reqDept, setReqDept] = useState<DepartmentId>('SAS');
  const [reqReason, setReqReason] = useState('');
  const [reqSubmitted, setReqSubmitted] = useState(false);

  useEffect(() => {
    fetchSecurityConfig().then(setConfig).catch(() => {});
  }, []);

  // 1. Google Popup Sign-in
  const handleGoogleSignIn = async () => {
    try {
      setIsVerifying(true);
      setErrorMessage('');
      setUnauthorizedEmail(null);

      const res = await signInWithGoogle();
      if (!res.success || !res.user) {
        setErrorMessage(
          res.error ||
            'ไม่สามารถเชื่อมต่อ Google Popup ได้ กรุณาใช้วิธีระบุอีเมลด้านล่าง'
        );
        return;
      }

      // Check Whitelist Authorization
      const authCheck = await verifyUserAuthorization(res.user.email);
      if (authCheck.authorized && authCheck.user) {
        const approvedProfile: UserProfile = {
          ...res.user,
          role: authCheck.user.role,
          department:
            authCheck.user.department === 'ALL'
              ? 'SAS'
              : authCheck.user.department || 'SAS',
        };
        onUnlock(approvedProfile);
      } else {
        setUnauthorizedEmail(res.user.email);
        setErrorMessage(
          authCheck.reason ||
            `อีเมล ${res.user.email} ไม่ได้รับสิทธิ์เข้าถึงระบบข้อมูลลับเฉพาะนี้`
        );
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์');
    } finally {
      setIsVerifying(false);
    }
  };

  // 2. Direct Authorized Gmail Submit
  const handleDirectGmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim().toLowerCase();
    if (!cleanEmail) return;

    if (!cleanEmail.includes('@')) {
      setErrorMessage('กรุณาระบุที่อยู่อีเมลให้ถูกต้อง (เช่น username@gmail.com)');
      return;
    }

    try {
      setIsVerifying(true);
      setErrorMessage('');
      setUnauthorizedEmail(null);

      const authCheck = await verifyUserAuthorization(cleanEmail);
      if (authCheck.authorized && authCheck.user) {
        const profile = await signInWithDirectGmail(
          cleanEmail,
          nameInput.trim() || authCheck.user.displayName,
          authCheck.user.role
        );
        onUnlock(profile);
      } else {
        setUnauthorizedEmail(cleanEmail);
        setErrorMessage(
          authCheck.reason ||
            `อีเมล ${cleanEmail} ไม่ได้รับสิทธิ์เข้าถึงระบบ กรุณาติดต่อผู้ดูแลระบบเพื่อขออนุมัติ`
        );
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setIsVerifying(false);
    }
  };

  // 3. Factory Kiosk PIN Submit
  const handleKioskPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) return;

    try {
      setIsVerifying(true);
      setErrorMessage('');

      const res = await verifyFactoryKioskPin(
        pinInput,
        kioskDept,
        nameInput.trim() || `Operator Line ${kioskDept}`
      );

      if (res.authorized && res.user) {
        onUnlock(res.user);
      } else {
        setErrorMessage(res.reason || 'รหัสผ่านประจำเครื่องไม่ถูกต้อง');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'เกิดข้อผิดพลาดในการตรวจสอบรหัสผ่าน');
    } finally {
      setIsVerifying(false);
    }
  };

  // 4. Submit Access Request
  const handleSendAccessRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unauthorizedEmail) return;

    try {
      setIsVerifying(true);
      await submitAccessRequest({
        email: unauthorizedEmail,
        displayName: reqName.trim() || unauthorizedEmail.split('@')[0],
        requestedRole: 'OPERATOR',
        department: reqDept,
        reason: reqReason.trim(),
      });
      setReqSubmitted(true);
    } catch (err: any) {
      setErrorMessage('ไม่สามารถส่งคำขอได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div
      id="security-gateway-cloak"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 sm:p-6 bg-slate-950 text-slate-100 select-none overflow-y-auto"
    >
      {/* Background Decorative Shield Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-red-900/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-900/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-lg my-auto">
        {/* Top Industrial Banner */}
        <div className="flex items-center justify-between px-2 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span className="text-[11px] font-mono tracking-wider uppercase text-red-400 font-bold">
              Access Restricted • Classified
            </span>
          </div>
          <div className="text-[10px] font-mono text-slate-500">
            MIYAMOTO SEC-NET v4.2
          </div>
        </div>

        {/* Security Vault Card */}
        <div className="bg-slate-900/95 border-2 border-red-500/30 rounded-2xl shadow-2xl shadow-red-950/20 backdrop-blur-xl overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-red-950/60 via-slate-900 to-slate-900 p-6 border-b border-slate-800">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-red-600 to-amber-600 flex items-center justify-center shadow-lg shadow-red-600/30 text-white shrink-0">
                <Lock className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                  <span>Miyamoto Engineering DWG Vault</span>
                  <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 text-[9px] border border-red-500/30 font-mono">
                    STRICT-AUTH
                  </span>
                </div>
                <h1 className="text-xl font-black text-white tracking-tight mt-0.5">
                  ระบบป้องกันความปลอดภัยข้อมูลการผลิต
                </h1>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  แบบดรออิ้งวิศวกรรม สเปกชิ้นงาน และไฟล์ CAD ถูกล็อคเพื่อป้องกันความลับทางการค้า
                  สงวนสิทธิ์เฉพาะเจ้าหน้าที่ที่ได้รับอนุญาตเท่านั้น
                </p>
              </div>
            </div>

            {/* Security Mode Indicator */}
            {config && (
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  นโยบายความปลอดภัย:
                </span>
                <span className="font-semibold text-slate-200">
                  {config.mode === 'STRICT_WHITELIST' && 'เฉพาะอีเมลที่อนุมัติ (Strict Whitelist)'}
                  {config.mode === 'ALLOW_KIOSK_PIN' && 'อีเมลอนุมัติ + รหัสเครื่อง (Kiosk PIN)'}
                  {config.mode === 'LOCKDOWN' && '⚠️ ล็อคระบบฉุกเฉิน (Lockdown)'}
                </span>
              </div>
            )}
          </div>

          {/* Verification Tabs */}
          <div className="grid grid-cols-2 bg-slate-950/60 p-1.5 border-b border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('GMAIL');
                setErrorMessage('');
              }}
              className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition ${
                activeTab === 'GMAIL'
                  ? 'bg-slate-800 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Mail className="w-4 h-4 text-blue-400" />
              <span>เข้าสู่ระบบด้วย Gmail</span>
            </button>
            <button
              type="button"
              disabled={config?.mode === 'STRICT_WHITELIST'}
              onClick={() => {
                setActiveTab('KIOSK_PIN');
                setErrorMessage('');
              }}
              className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition ${
                activeTab === 'KIOSK_PIN'
                  ? 'bg-slate-800 text-white shadow'
                  : config?.mode === 'STRICT_WHITELIST'
                  ? 'opacity-40 cursor-not-allowed text-slate-500'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title={
                config?.mode === 'STRICT_WHITELIST'
                  ? 'โหมดเข้มงวด: ปิดการใช้งานรหัสประจำเครื่อง'
                  : 'รหัสประจำเครื่องในไลน์ผลิต'
              }
            >
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>รหัสเครื่อง (Factory PIN)</span>
            </button>
          </div>

          {/* Form Body */}
          <div className="p-6">
            {/* Error Message Display */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs flex items-start gap-2.5 animate-shake">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-red-300">ไม่อนุญาตให้เข้าถึง (Access Denied)</div>
                  <div className="mt-0.5 leading-relaxed text-red-200/90">{errorMessage}</div>

                  {/* Show Request Access Button if unauthorized email was rejected */}
                  {unauthorizedEmail && !reqSubmitted && (
                    <button
                      type="button"
                      onClick={() => setShowRequestForm(true)}
                      className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/30 hover:bg-red-600/50 border border-red-500/40 text-red-200 font-medium text-[11px] transition"
                    >
                      <Send className="w-3 h-3" />
                      <span>ส่งคำขอเปิดสิทธิ์เข้าใช้งานระบบ (Request Authorization)</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Request Access Form (Expanded when worker asks for access) */}
            {showRequestForm && !reqSubmitted && (
              <form
                onSubmit={handleSendAccessRequest}
                className="mb-6 p-4 rounded-xl bg-slate-950 border border-amber-500/40 space-y-3"
              >
                <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                  <span className="flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5" />
                    ส่งคำขออนุมัติสิทธิ์ถึงผู้ดูแลระบบ (Admin)
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowRequestForm(false)}
                    className="text-slate-400 hover:text-white text-[11px]"
                  >
                    ยกเลิก
                  </button>
                </div>

                <p className="text-[11px] text-slate-400">
                  คำขอจะถูกส่งไปยังระบบของ Super Admin ({SUPER_ADMIN_EMAIL}) เพื่อทำการอนุมัติ
                </p>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    อีเมลที่ขอสิทธิ์
                  </label>
                  <input
                    type="text"
                    disabled
                    value={unauthorizedEmail || ''}
                    className="w-full bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-xs text-slate-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      ชื่อ-สกุล / ชื่อเล่น
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น สมชาย (ช่างกลึง)"
                      value={reqName}
                      onChange={(e) => setReqName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      แผนกงาน
                    </label>
                    <select
                      value={reqDept}
                      onChange={(e) => setReqDept(e.target.value as DepartmentId)}
                      className="w-full bg-slate-900 border border-slate-700 px-2 py-1.5 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="SAS">SAS - ชิ้นส่วนกระบอกสูบ</option>
                      <option value="PTS">PTS - ท่อความเที่ยงตรงสูง</option>
                      <option value="OTS">OTS - ชิ้นส่วนสั่งทำพิเศษ</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    เหตุผลที่ต้องการเข้าถึงแบบดรออิ้ง (ไม่บังคับ)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น ตรวจสอบขนาดความยาวตามคำสั่งผลิต LOT-2026"
                    value={reqReason}
                    onChange={(e) => setReqReason(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isVerifying}
                  className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-500 font-bold text-xs text-slate-950 flex items-center justify-center gap-1.5 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>ยืนยันส่งคำขอเข้าใช้งาน</span>
                </button>
              </form>
            )}

            {/* Request Submitted Notice */}
            {reqSubmitted && (
              <div className="mb-5 p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-emerald-300">ส่งคำขอสำเร็จเรียบร้อยแล้ว</div>
                  <div className="text-emerald-200/80 mt-0.5 text-[11px]">
                    เมื่อผู้ดูแลระบบ (Admin) อนุมัติสิทธิ์ คุณจะสามารถเข้าใช้งานได้ทันที
                  </div>
                </div>
              </div>
            )}

            {/* TAB 1: GMAIL AUTHENTICATION */}
            {activeTab === 'GMAIL' && (
              <div className="space-y-4">
                {/* Method 1A: Google Sign-in Popup Button */}
                <div>
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isVerifying}
                    className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg transition active:scale-[0.99] disabled:opacity-50"
                  >
                    {isVerifying ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-700" />
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                    )}
                    <span>เข้าสู่ระบบด้วย Google Account (One-Click)</span>
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-px bg-slate-800 flex-1" />
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider font-mono">
                    หรือระบุอีเมลที่ได้รับอนุญาต
                  </span>
                  <div className="h-px bg-slate-800 flex-1" />
                </div>

                {/* Method 1B: Direct Authorized Email Input */}
                <form onSubmit={handleDirectGmailSubmit} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      อีเมล Gmail ที่ผ่านการลงทะเบียน Whitelist
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        id="security-email-input"
                        type="email"
                        required
                        placeholder="เช่น moobinnpm5786@gmail.com"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 pl-9 pr-3 py-2 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      ชื่อ-สกุล / รหัสพนักงาน (ถ้ามี)
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น นายธนากร (หัวหน้าช่าง QA)"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 px-3 py-2 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <button
                    id="security-email-submit-btn"
                    type="submit"
                    disabled={isVerifying}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-900/30 transition disabled:opacity-50"
                  >
                    {isVerifying ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Unlock className="w-4 h-4" />
                    )}
                    <span>ตรวจสอบสิทธิ์และปลดล็อคข้อมูล</span>
                  </button>
                </form>
              </div>
            )}

            {/* TAB 2: FACTORY KIOSK PIN AUTHENTICATION */}
            {activeTab === 'KIOSK_PIN' && (
              <form onSubmit={handleKioskPinSubmit} className="space-y-4">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                  <KeyRound className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    สำหรับแท็บเล็ตประจำแท่นเครื่องจักรหน้าโรงงาน กรอกรหัสความปลอดภัยประจำโรงงานเพื่อปลดล็อคเข้าสู่โหมด Operator
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      ไลน์ประจำเครื่อง
                    </label>
                    <select
                      value={kioskDept}
                      onChange={(e) => setKioskDept(e.target.value as DepartmentId)}
                      className="w-full bg-slate-950 border border-slate-700 px-3 py-2 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="SAS">SAS - สายผลิตกระบอกสูบ</option>
                      <option value="PTS">PTS - สายผลิตท่อความเที่ยงตรง</option>
                      <option value="OTS">OTS - สายผลิตพิเศษ</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      ชื่อผู้ควบคุมเครื่อง (Operator)
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น ช่างเจษฎา"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 px-3 py-2 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    รหัสความปลอดภัยโรงงาน (Factory Security PIN)
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      id="security-kiosk-pin-input"
                      type={showPin ? 'text' : 'password'}
                      required
                      placeholder="ระบุรหัส PIN 4-8 หลัก"
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 pl-9 pr-10 py-2 rounded-xl text-sm tracking-widest font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                    <span>รหัสมาตรฐานเริ่มต้น: 8899</span>
                    <span>ติดต่อวิศวกรหัวหน้าสายผลิต</span>
                  </div>
                </div>

                <button
                  id="security-pin-submit-btn"
                  type="submit"
                  disabled={isVerifying}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-900/30 transition disabled:opacity-50"
                >
                  {isVerifying ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Unlock className="w-4 h-4" />
                  )}
                  <span>ปลดล็อคเครื่องจักร (Unlock Station)</span>
                </button>
              </form>
            )}

            {/* Quick Fill Super Admin for Ease of Review / Testing */}
            <div className="mt-5 pt-4 border-t border-slate-800/80">
              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>บัญชี Super Admin ที่ได้รับอนุญาตสูงสุด:</span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('GMAIL');
                    setEmailInput(SUPER_ADMIN_EMAIL);
                    setNameInput('เจ้าของระบบ (Owner)');
                  }}
                  className="text-amber-400 hover:text-amber-300 underline font-mono text-[10px]"
                >
                  คลิกใส่ {SUPER_ADMIN_EMAIL}
                </button>
              </div>
            </div>
          </div>

          {/* Card Footer Warning Notice */}
          <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>AUDIT LOGGING: ENABLED</span>
            <span>IP RECORDED • SECURE HTTPS</span>
          </div>
        </div>
      </div>
    </div>
  );
};
