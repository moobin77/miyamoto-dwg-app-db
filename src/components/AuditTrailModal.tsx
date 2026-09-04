import React from 'react';
import { X, History, FileCheck, ShieldCheck, CheckCircle2, User, Building, Calendar, ArrowUpRight } from 'lucide-react';
import { Drawing, DrawingVersion } from '../types';

interface AuditTrailModalProps {
  drawing: Drawing;
  onClose: () => void;
  onSelectVersion: (v: DrawingVersion) => void;
}

export const AuditTrailModal: React.FC<AuditTrailModalProps> = ({
  drawing,
  onClose,
  onSelectVersion,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-tech">
                ประวัติการแก้ไขและตรวจสอบย้อนกลับ (Engineering Change Order & Audit Trail)
              </h3>
              <p className="text-xs text-slate-400">
                {drawing.code} • {drawing.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Engineering Change History Timeline */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              ลำดับประวัติเวอร์ชันและคำสั่งเปลี่ยนแปลง (Revision Timeline)
            </h4>

            <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-700">
              {drawing.versions.map((ver, idx) => {
                const isLatest = idx === 0;
                return (
                  <div key={ver.version} className="relative">
                    {/* Timeline Node Dot */}
                    <div
                      className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isLatest
                          ? 'bg-blue-600 border-blue-400 text-white'
                          : 'bg-slate-800 border-slate-600 text-slate-400'
                      }`}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    </div>

                    <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 space-y-2 hover:border-slate-600 transition">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white font-mono-num px-2.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            {ver.version}
                          </span>
                          <span className="text-xs font-mono-num font-semibold text-purple-400">
                            {ver.ecoNumber}
                          </span>
                          {ver.isApprovedForProduction ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" /> อนุมัติการผลิต
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              ฉบับทดสอบ
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            onSelectVersion(ver);
                            onClose();
                          }}
                          className="flex items-center gap-1 text-xs font-medium text-sky-400 hover:text-sky-300 hover:underline"
                        >
                          <span>เปิดดูเวอร์ชันนี้</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Details */}
                      <p className="text-xs text-slate-200 whitespace-pre-line leading-relaxed bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                        {ver.changeDescription}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          {ver.releaseDate}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          {ver.releasedBy}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building className="w-3.5 h-3.5 text-slate-500" />
                          แผนก: {ver.changeDepartment}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Operator Acknowledgment Log (Traceability on the shopfloor) */}
          <div className="pt-4 border-t border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              บันทึกการลงชื่อรับทราบของฝ่ายผลิต (Shopfloor Sign-off Log)
            </h4>

            {drawing.acknowledgments && drawing.acknowledgments.length > 0 ? (
              <div className="space-y-2">
                {drawing.acknowledgments.map((ack) => (
                  <div
                    key={ack.id}
                    className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{ack.operatorName}</span>
                        <span className="text-[11px] font-mono-num text-slate-400">
                          ({ack.operatorId})
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono-num">
                          {ack.version}
                        </span>
                      </div>
                      <p className="text-slate-300 text-[11px] mt-1 italic">
                        "{ack.comment || 'รับทราบและตรวจสอบแบบแล้ว'}"
                      </p>
                    </div>

                    <div className="text-right text-[11px] text-slate-400">
                      <div className="font-mono-num text-slate-300">{ack.timestamp}</div>
                      <div>
                        {ack.lineId} • {ack.machineId}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 text-center text-xs text-slate-400">
                ยังไม่มีการลงชื่อรับทราบสำหรับแบบดรออิ้งนี้
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-850 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
