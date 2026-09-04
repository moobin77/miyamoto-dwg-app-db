import React, { useState } from 'react';
import { Mail, LogIn, X, ShieldCheck, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';
import { signInWithGoogle, signInWithDirectGmail } from '../services/firebase';

interface GmailAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
}

export const GmailAuthModal: React.FC<GmailAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [gmailInput, setGmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'ENGINEER' | 'OPERATOR'>('ADMIN');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleGooglePopup = async () => {
    try {
      setIsLoading(true);
      setErrorMsg('');
      const res = await signInWithGoogle();
      if (res.success && res.user) {
        onSuccess(res.user);
        onClose();
      } else {
        setErrorMsg(res.error || 'ไม่สามารถเข้าสู่ระบบด้วย Google ได้ กรุณาใช้วิธีระบุอีเมลด้านล่าง');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDirectGmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = gmailInput.trim();
    if (!email) return;

    if (!email.includes('@')) {
      setErrorMsg('กรุณากรอกรูปแบบอีเมลให้ถูกต้อง (เช่น user@gmail.com)');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg('');
      const user = await signInWithDirectGmail(email, nameInput.trim() || undefined, selectedRole);
      onSuccess(user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="gmail-auth-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="gmail-auth-modal"
        className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-red-950/40 via-slate-900 to-sky-950/40 p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>เข้าสู่ระบบด้วย G-mail</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Firebase Auth
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                ยืนยันตัวตนเจ้าหน้าที่เพื่อจัดการซีรี่ส์ รุ่น และไฟล์ดรออิ้ง
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

        {/* Modal Body */}
        <div className="p-5 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-xl text-xs text-red-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Primary Action: Google Sign In Button */}
          <div>
            <button
              type="button"
              onClick={handleGooglePopup}
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm flex items-center justify-center gap-3 transition shadow-lg shadow-white/5 active:scale-[0.99] cursor-pointer"
            >
              {/* Google G Logo SVG */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
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
              <span>{isLoading ? 'กำลังเชื่อมต่อ Google...' : 'เข้าสู่ระบบด้วย Google / Gmail'}</span>
            </button>
            <p className="text-[11px] text-slate-500 text-center mt-2">
              คลิกเพื่อเปิดหน้าต่างรับรองความปลอดภัยของ Google
            </p>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-3 text-xs text-slate-500 uppercase tracking-wider font-mono">
              หรือระบุ Gmail โดยตรง
            </span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          {/* Direct Gmail Input Form */}
          <form onSubmit={handleDirectGmailSubmit} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>ที่อยู่อีเมล Gmail</span>
                <span className="text-[10px] text-slate-500">(@gmail.com หรือเมลบริษัท)</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={gmailInput}
                  onChange={(e) => setGmailInput(e.target.value)}
                  placeholder="operator.miyamoto@gmail.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-500 transition font-mono"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                ชื่อผู้ใช้งาน / รหัสพนักงาน
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="เช่น สมศักดิ์ (หัวหน้าแผนก SAS)"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-500 transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                สิทธิ์การใช้งาน (Role)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'ADMIN', label: 'ผู้ดูแลระบบ', sub: 'แก้ไข/ลบได้เต็มสิทธิ์' },
                  { key: 'ENGINEER', label: 'วิศวกร', sub: 'แนบไฟล์/เพิ่มรุ่น' },
                  { key: 'OPERATOR', label: 'ฝ่ายผลิต', sub: 'ดูแบบ/ลงบันทึก' },
                ].map((r) => (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => setSelectedRole(r.key as any)}
                    className={`p-2 rounded-xl text-left border transition ${
                      selectedRole === r.key
                        ? 'bg-red-950/40 border-red-500 text-white shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-bold">{r.label}</div>
                    <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{r.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !gmailInput.trim()}
              className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-red-600/20 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>เข้าสู่ระบบด้วย Gmail นี้</span>
            </button>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>ระบบบันทึกประวัติและสิทธิ์ผ่าน Firebase Auth</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg text-slate-400 hover:text-white text-xs"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
