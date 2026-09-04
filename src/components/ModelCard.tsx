import React from 'react';
import {
  Box,
  ChevronDown,
  ChevronRight,
  Plus,
  Edit3,
  Trash2,
  Paperclip,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { Drawing, ProductModel } from '../types';

interface ModelCardProps {
  model: ProductModel;
  isExpanded: boolean;
  onToggleExpand: (modelId: string) => void;
  selectedDrawingId: string;
  isAdmin: boolean;
  onOpenEditModel?: (model: ProductModel) => void;
  onDeleteModel: (modelId: string, modelCode: string) => void;
  onOpenAddLength: (model: ProductModel) => void;
  drawings: Drawing[];
  onSelectDrawing: (drawing: Drawing) => void;
  onOpenEditJob?: (drawing: Drawing) => void;
  onOpenAddFile?: (drawing: Drawing) => void;
  onDeleteLength?: (modelId: string, lengthId: string, lengthLabel: string) => void;
}

export const ModelCard: React.FC<ModelCardProps> = ({
  model,
  isExpanded,
  onToggleExpand,
  selectedDrawingId,
  isAdmin,
  onOpenEditModel,
  onDeleteModel,
  onOpenAddLength,
  drawings,
  onSelectDrawing,
  onOpenEditJob,
  onOpenAddFile,
  onDeleteLength,
}) => {
  const hasActiveDrawing = model.lengths.some((l) => l.drawingId === selectedDrawingId);

  return (
    <div
      id={`model-card-${model.id}`}
      className={`rounded-2xl border transition-all overflow-hidden ${
        hasActiveDrawing
          ? 'bg-slate-850 border-blue-500/60 shadow-lg shadow-blue-500/5 ring-1 ring-blue-500/20'
          : 'bg-slate-800/40 border-slate-700/70 hover:border-slate-600'
      }`}
    >
      {/* Model Header */}
      <div className="p-3 bg-slate-800/80 border-b border-slate-700/60">
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            onClick={() => onToggleExpand(model.id)}
            className="flex-1 text-left flex items-start gap-2 min-w-0"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
              <Box className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-black text-white font-mono tracking-wide">
                  {model.code}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-700 text-slate-300 font-medium">
                  {model.category}
                </span>
              </div>
              <h4 className="text-xs font-semibold text-slate-200 mt-0.5 line-clamp-1">
                {model.name}
              </h4>
            </div>
            <div className="shrink-0 p-1 text-slate-400 hover:text-white">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </div>
          </button>

          {/* Admin Action Buttons on Model Header: Rename and Delete Only */}
          {isAdmin && (
            <div className="flex items-center gap-1 shrink-0">
              {/* 1. Rename Model */}
              {onOpenEditModel && (
                <button
                  id={`btn-edit-model-${model.id}`}
                  title="แก้ไขชื่อรุ่นสินค้า (Rename Model)"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenEditModel(model);
                  }}
                  className="px-2 py-1 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-amber-500/15 border border-amber-500/30 transition flex items-center gap-1 text-[11px] font-semibold"
                >
                  <Edit3 className="w-3 h-3" />
                  <span className="hidden sm:inline">แก้ไขชื่อ</span>
                </button>
              )}

              {/* 2. Delete Model with Safeguard */}
              <button
                title="ลบรุ่นนี้ (Admin Only)"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteModel(model.id, model.code);
                }}
                className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Subtitle / Model Stats */}
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
          <span className="text-[10px] text-slate-400">
            มี <strong className="text-slate-200">{model.lengths.length}</strong> ความยาวที่ผลิต
          </span>
          {isAdmin && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenAddLength(model);
              }}
              className="text-[10px] font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/30 flex items-center gap-1 transition"
            >
              <Plus className="w-3 h-3" /> + เพิ่มความยาว
            </button>
          )}
        </div>
      </div>

      {/* Lengths List inside Model */}
      {isExpanded && (
        <div className="p-2 space-y-1.5 bg-slate-900/60">
          {model.lengths.length === 0 ? (
            <div className="text-center py-3 text-slate-500 text-xs">
              ยังไม่มีความยาวที่กำหนด
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => onOpenAddLength(model)}
                  className="block mx-auto mt-1 text-blue-400 font-semibold text-xs"
                >
                  + เพิ่มความยาวแรก
                </button>
              )}
            </div>
          ) : (
            model.lengths.map((len) => {
              const matchedDrawing = drawings.find((d) => d.id === len.drawingId);
              const isSelected = selectedDrawingId === len.drawingId;
              const hasAttachedFiles = Boolean(
                matchedDrawing?.attachedFiles && matchedDrawing.attachedFiles.length > 0
              );
              const isApproved = matchedDrawing?.status === 'APPROVED';

              return (
                <div
                  key={len.id}
                  id={`length-item-${len.id}`}
                  onClick={() => {
                    if (matchedDrawing) {
                      onSelectDrawing(matchedDrawing);
                    }
                  }}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-blue-600/20 border-blue-500 shadow-md ring-1 ring-blue-500/30 text-white'
                      : 'bg-slate-800/60 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600 text-slate-300'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono-num font-bold text-xs text-white">
                        {len.lengthLabel}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ({len.lengthMm} mm)
                      </span>
                      {hasAttachedFiles && (
                        <span
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                          title="มีไฟล์แนบ (CAD/PDF)"
                        >
                          <Paperclip className="w-2.5 h-2.5" />
                          <span>{matchedDrawing?.attachedFiles?.length}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                      <span className="truncate">{len.partNumber}</span>
                      <span>•</span>
                      <span className="font-mono text-[9px] truncate">{len.drawingCode}</span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-1">
                      <span
                        className={`inline-flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded-full ${
                          isApproved
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {isApproved ? (
                          <CheckCircle2 className="w-2.5 h-2.5" />
                        ) : (
                          <Clock className="w-2.5 h-2.5" />
                        )}
                        {matchedDrawing?.status || 'APPROVED'}
                      </span>

                      {matchedDrawing && (
                        <span className="text-[9px] font-mono-num text-slate-500">
                          {matchedDrawing.versions[0]?.version || 'REV.C'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions for this length */}
                  <div className="flex items-center gap-1 shrink-0">
                    {isAdmin && matchedDrawing && onOpenEditJob && (
                      <button
                        title="แก้ไขชื่องานและข้อมูลดรออิ้ง (Edit Job)"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenEditJob(matchedDrawing);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-blue-300 hover:bg-blue-500/10 transition"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                    )}

                    {isAdmin && matchedDrawing && onOpenAddFile && (
                      <button
                        title="แนบไฟล์ (PDF, DXF, ภาพ) ให้กับดรออิ้งนี้"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenAddFile(matchedDrawing);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition"
                      >
                        <Paperclip className="w-3 h-3" />
                      </button>
                    )}

                    {isAdmin && onDeleteLength && (
                      <button
                        title="ลบขนาดความยาวนี้"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteLength(model.id, len.id, len.lengthLabel);
                        }}
                        className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}

                    <ChevronRight
                      className={`w-3.5 h-3.5 transition-transform ${
                        isSelected ? 'text-blue-400 translate-x-0.5' : 'text-slate-600'
                      }`}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
