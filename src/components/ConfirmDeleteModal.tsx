import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message: string;
  itemDetail?: string;
  isDeleting?: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemDetail,
  isDeleting = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="confirm-delete-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    >
      <div
        id="confirm-delete-modal-container"
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-white">{title}</h3>
              <p className="text-sm text-slate-300 mt-1.5 leading-relaxed">{message}</p>
              {itemDetail && (
                <div className="mt-3 p-2.5 bg-slate-800/80 border border-slate-700 rounded-xl font-mono text-xs text-amber-300 font-semibold truncate">
                  {itemDetail}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              disabled={isDeleting}
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 text-sm font-medium transition"
            >
              ยกเลิก
            </button>
            <button
              id="confirm-delete-action-btn"
              type="button"
              disabled={isDeleting}
              onClick={onConfirm}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-sm font-semibold transition flex items-center gap-2 shadow-lg shadow-red-600/25 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              {isDeleting ? 'กำลังลบข้อมูล...' : 'ยืนยันการลบ'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
