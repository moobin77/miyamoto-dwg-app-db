import React, { useState } from 'react';
import { X, Download, FileText, Image, Code, Printer, Check, Box, Eye, ShieldAlert } from 'lucide-react';
import { Drawing, DrawingVersion } from '../types';

interface ExportModalProps {
  drawing: Drawing;
  activeVersion: DrawingVersion;
  onClose: () => void;
  isAdmin?: boolean;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  drawing,
  activeVersion,
  onClose,
  isAdmin = false,
}) => {
  const [copied, setCopied] = useState(false);

  // If user is not admin, prevent downloading and show security notice
  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="bg-slate-900 border border-amber-500/50 rounded-2xl max-w-md w-full p-6 text-center shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto mb-3">
            <Eye className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-2 flex items-center justify-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>โหมดดูได้อย่างเดียว (ห้ามดาวน์โหลด)</span>
          </h3>
          <p className="text-xs text-slate-300 mb-5 leading-relaxed">
            ระบบความปลอดภัยของโรงงานกำหนดให้ผู้ใช้งานทั่วไปสามารถตรวจสอบแบบดรออิ้งบนหน้าจอได้เท่านั้น
            การส่งออกไฟล์ CAD, PDF, DXF, PNG และข้อมูลสเปกจำกัดสิทธิ์เฉพาะผู้ดูแลระบบ (Admin)
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition"
          >
            เข้าใจแล้ว / ปิดหน้าต่าง
          </button>
        </div>
      </div>
    );
  }

  // 1. Export CAD DXF (AutoCAD Drawing Exchange Format)
  const handleExportDXF = () => {
    const len = drawing.lengthMm || 450;
    const dxfLines = [
      '0', 'SECTION',
      '2', 'HEADER',
      '9', '$ACADVER',
      '1', 'AC1009',
      '0', 'ENDSEC',
      '0', 'SECTION',
      '2', 'TABLES',
      '0', 'ENDSEC',
      '0', 'SECTION',
      '2', 'BLOCKS',
      '0', 'ENDSEC',
      '0', 'SECTION',
      '2', 'ENTITIES',
      '0', 'LINE',
      '8', 'OUTLINE',
      '10', '0.0',
      '20', '0.0',
      '11', `${len}.0`,
      '21', '0.0',
      '0', 'LINE',
      '8', 'CENTERLINE',
      '10', '-20.0',
      '20', '0.0',
      '11', `${len + 20}.0`,
      '21', '0.0',
      '0', 'TEXT',
      '8', 'ANNOTATION',
      '10', '10.0',
      '20', '15.0',
      '40', '6.0',
      '1', `DWG: ${drawing.code} REV: ${activeVersion.version} L=${len}mm [DEPT: ${drawing.department || 'PROD'}]`,
      '0', 'ENDSEC',
      '0', 'EOF'
    ].join('\n');

    const blob = new Blob([dxfLines], { type: 'application/dxf;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${drawing.code}_${activeVersion.version}.dxf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 2. Export SVG Vector File
  const handleExportSVG = () => {
    const svgEl = document.getElementById('technical-drawing-canvas-svg');
    if (!svgEl) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgEl);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${drawing.code}_${activeVersion.version}_vector.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 2. Export High-Res PNG
  const handleExportPNG = () => {
    const svgEl = document.getElementById('technical-drawing-canvas-svg') as unknown as SVGSVGElement | null;
    if (!svgEl) return;
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgEl);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const blobURL = URL.createObjectURL(svgBlob);

    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 2000;
      canvas.height = 1400;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Watermark production approval stamp
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText(`OFFICIAL DRAWING EXPORT • ${drawing.code} • ${activeVersion.version}`, 50, canvas.height - 40);

        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${drawing.code}_${activeVersion.version}_hires.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }
        }, 'image/png');
      }
      URL.revokeObjectURL(blobURL);
    };
    img.src = blobURL;
  };

  // 3. Print / PDF layout
  const handlePrintPDF = () => {
    window.print();
  };

  // 4. Export JSON Metadata Package
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(drawing, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `${drawing.code}_metadata_package.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-tech">
                ส่งออกดรออิ้งตามมาตรฐานวิศวกรรม (Standard File Export)
              </h3>
              <p className="text-xs text-slate-400">
                {drawing.code} ({activeVersion.version}) • {drawing.title}
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

        {/* Form Body */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            เลือกรวมไฟล์หรือรูปแบบส่งออกที่ต้องการสำหรับนำไปเปิดบนโปรแกรม CAD/CAM, เครื่องวัด CMM,
            พิมพ์ลงกระดาษ A3 หน้าเครื่องจักร หรือแชร์ต่อไปยังฝ่ายจัดซื้อและลูกค้า:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* AutoCAD DXF Export */}
            <div
              onClick={handleExportDXF}
              className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-emerald-500/60 hover:bg-slate-800 cursor-pointer transition flex items-start gap-3 group"
            >
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20">
                <Box className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">AutoCAD DXF Format</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  ไฟล์มาตรฐาน ASCII DXF สำหรับเปิดใน AutoCAD, SolidWorks, CAM
                </p>
                <span className="inline-block mt-2 text-[10px] font-bold text-emerald-400">
                  ดาวน์โหลด .DXF →
                </span>
              </div>
            </div>

            {/* SVG Vector */}
            <div
              onClick={handleExportSVG}
              className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-emerald-500/60 hover:bg-slate-800 cursor-pointer transition flex items-start gap-3 group"
            >
              <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20">
                <Code className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">SVG Vector Schematic</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  เวกเตอร์คมชัดไม่แตก สำหรับ CAD, Laser Cutting, CNC CAM
                </p>
                <span className="inline-block mt-2 text-[10px] font-bold text-emerald-400">
                  ดาวน์โหลด .SVG →
                </span>
              </div>
            </div>

            {/* High-Res PNG */}
            <div
              onClick={handleExportPNG}
              className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-emerald-500/60 hover:bg-slate-800 cursor-pointer transition flex items-start gap-3 group"
            >
              <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20">
                <Image className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">High-Res PNG (2000px)</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  รูปภาพความละเอียดสูง พร้อมตราประทับอนุมัติและลายน้ำ
                </p>
                <span className="inline-block mt-2 text-[10px] font-bold text-emerald-400">
                  ดาวน์โหลด .PNG →
                </span>
              </div>
            </div>

            {/* Print / PDF */}
            <div
              onClick={handlePrintPDF}
              className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-emerald-500/60 hover:bg-slate-800 cursor-pointer transition flex items-start gap-3 group"
            >
              <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">พิมพ์เอกสาร / PDF Report</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  จัดหน้ากระดาษแบบมาตรฐาน ISO สำหรับเครื่องพิมพ์ A3/A4
                </p>
                <span className="inline-block mt-2 text-[10px] font-bold text-emerald-400">
                  พิมพ์ / บันทึก PDF →
                </span>
              </div>
            </div>

            {/* JSON Metadata */}
            <div
              onClick={handleExportJSON}
              className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-emerald-500/60 hover:bg-slate-800 cursor-pointer transition flex items-start gap-3 group"
            >
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">JSON Engineering Data</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  แพ็กเกจข้อมูลพิกัดความเผื่อ, ประวัติ ECO และการตรวจสอบ
                </p>
                <span className="inline-block mt-2 text-[10px] font-bold text-emerald-400">
                  ดาวน์โหลด .JSON →
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-850 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
