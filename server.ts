import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { INITIAL_DRAWINGS } from './src/data/sampleDrawings.ts';
import { INITIAL_DEPARTMENTS, createDrawingForLength } from './src/data/departmentsData.ts';
import {
  Drawing,
  DrawingVersion,
  NotificationAlert,
  OperatorAcknowledgment,
  DepartmentId,
  DepartmentInfo,
  ProductSeries,
  ProductModel,
  ModelLengthVariant,
  AttachedDrawingFile,
} from './src/types.ts';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Dedicated Uploads Storage Directory for CAD / PDF / DXF / STEP files
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_\-\u0E00-\u0E7F]/g, '_');
    cb(null, `${uniqueSuffix}-${baseName}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB maximum per file
});

// In-memory server-authoritative store
let departments: DepartmentInfo[] = JSON.parse(JSON.stringify(INITIAL_DEPARTMENTS));
let drawings: Drawing[] = JSON.parse(JSON.stringify(INITIAL_DRAWINGS));

let notifications: NotificationAlert[] = [
  {
    id: 'notif-init-1',
    drawingId: 'dwg-flange-01',
    drawingCode: 'DWG-FLG-2024-001',
    title: 'อัปเดตแบบดรออิ้งเป็น Rev C ด่วน',
    message: 'ขยายรูสลักยึด 6xØ12.0 และปรับพิกัดความเผื่อรูเพลาเป็น H7 กรุณากดยืนยันรับทราบก่อนเริ่มผลิตล็อตใหม่',
    version: 'Rev C',
    severity: 'URGENT_CHANGE',
    timestamp: '2025-02-28 09:30',
    read: false,
  },
  {
    id: 'notif-init-2',
    drawingId: 'dwg-shaft-02',
    drawingCode: 'DWG-SFT-2024-042',
    title: 'อนุมัติแบบ Rev B เข้าสู่สายการผลิต',
    message: 'ปรับพิกัดบ่าเจียรลูกปืน Ø35k5 ได้รับการตรวจสอบและลงนามอนุมัติแล้ว',
    version: 'Rev B',
    severity: 'APPROVED',
    timestamp: '2025-02-25 14:00',
    read: false,
  },
];

// Active SSE Connections
interface SSEClient {
  id: string;
  res: Response;
}
let sseClients: SSEClient[] = [];

// Broadcast event to all connected tablet clients
function broadcast(eventType: string, data: any) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((client) => {
    try {
      client.res.write(payload);
    } catch (e) {
      console.error('Failed to send SSE to client', client.id, e);
    }
  });
}

// 1. Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString(), connectedClients: sseClients.length });
});

// Dedicated File Upload Endpoint (for PDF, CAD, DXF, DWG, STEP, SVG, Images)
app.post('/api/upload', upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'ไม่พบไฟล์ที่ต้องการอัปโหลด' });
  }

  const fileUrl = `/api/files/${encodeURIComponent(req.file.filename)}`;
  const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');
  let detectedType: 'PDF' | 'DXF' | 'DWG' | 'STEP' | 'SVG' | 'IMAGE' = 'PDF';
  if (ext === 'pdf') detectedType = 'PDF';
  else if (ext === 'dxf') detectedType = 'DXF';
  else if (ext === 'dwg') detectedType = 'DWG';
  else if (['stp', 'step', 'iges', 'igs'].includes(ext)) detectedType = 'STEP';
  else if (ext === 'svg') detectedType = 'SVG';
  else if (['png', 'jpg', 'jpeg', 'webp', 'bmp', 'tiff'].includes(ext)) detectedType = 'IMAGE';

  const size = req.file.size < 1024 * 1024
    ? `${(req.file.size / 1024).toFixed(1)} KB`
    : `${(req.file.size / (1024 * 1024)).toFixed(2)} MB`;

  res.json({
    success: true,
    fileName: req.file.originalname,
    savedFilename: req.file.filename,
    fileUrl,
    fileSize: size,
    fileType: detectedType,
    mimetype: req.file.mimetype,
  });
});

// Serve Uploaded Files with proper headers
app.get('/api/files/:filename', (req: Request, res: Response) => {
  const filename = decodeURIComponent(req.params.filename);
  const filePath = path.join(UPLOADS_DIR, filename);

  // Guard against path traversal
  if (!filePath.startsWith(UPLOADS_DIR)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  const ext = path.extname(filename).toLowerCase();
  if (ext === '.pdf') {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(filename)}"`);
  } else if (ext === '.svg') {
    res.setHeader('Content-Type', 'image/svg+xml');
  } else if (ext === '.png') {
    res.setHeader('Content-Type', 'image/png');
  } else if (ext === '.jpg' || ext === '.jpeg') {
    res.setHeader('Content-Type', 'image/jpeg');
  } else if (ext === '.dxf') {
    res.setHeader('Content-Type', 'application/dxf');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(filename)}"`);
  } else if (ext === '.dwg') {
    res.setHeader('Content-Type', 'application/acad');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
  } else if (ext === '.step' || ext === '.stp') {
    res.setHeader('Content-Type', 'application/step');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
  }

  res.sendFile(filePath);
});

// 2. Real-time SSE endpoint
app.get('/api/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientId = `client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  sseClients.push({ id: clientId, res });

  // Initial welcome event with current time
  res.write(`event: connected\ndata: ${JSON.stringify({ clientId, timestamp: new Date().toISOString() })}\n\n`);

  // Heartbeat to keep connection alive
  const intervalId = setInterval(() => {
    res.write(`: heartbeat\n\n`);
  }, 25000);

  req.on('close', () => {
    clearInterval(intervalId);
    sseClients = sseClients.filter((c) => c.id !== clientId);
  });
});

// 3. Departments, Series, Models, and Length Variants Endpoints
app.get('/api/departments', (req: Request, res: Response) => {
  res.json(departments);
});

// Admin creates a new Series (ซีรี่ส์) in a department
app.post('/api/series', (req: Request, res: Response) => {
  const { departmentId, code, name, description } = req.body;
  if (!departmentId || !name) {
    return res.status(400).json({ error: 'departmentId and name are required' });
  }

  const dept = departments.find((d) => d.id === departmentId);
  if (!dept) {
    return res.status(404).json({ error: `Department ${departmentId} not found` });
  }

  if (!dept.series) dept.series = [];

  const seriesId = `series-${departmentId.toLowerCase()}-${Date.now().toString(36)}`;
  const seriesCode = code && code.trim()
    ? code.trim().toUpperCase()
    : `${departmentId}-${Date.now().toString(36).substring(0, 4).toUpperCase()}`;

  const newSeries: ProductSeries = {
    id: seriesId,
    departmentId,
    code: seriesCode,
    name: name.trim(),
    description: description ? description.trim() : '',
    createdAt: new Date().toISOString().substring(0, 10),
  };

  dept.series.push(newSeries);

  broadcast('series_added', { departmentId, series: newSeries });
  broadcast('departments_updated', departments);

  res.status(201).json({ success: true, series: newSeries, departments });
});

// Admin edits/renames a Series (แก้ไขชื่อซีรี่ส์)
app.patch('/api/series/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, code, description } = req.body;

  let foundSeries: ProductSeries | null = null;
  let foundDept: DepartmentInfo | null = null;

  for (const dept of departments) {
    const s = dept.series?.find((item) => item.id === id);
    if (s) {
      foundSeries = s;
      foundDept = dept;
      break;
    }
  }

  if (!foundSeries || !foundDept) {
    return res.status(404).json({ error: 'Series not found' });
  }

  if (name !== undefined && name.trim()) foundSeries.name = name.trim();
  if (code !== undefined && code.trim()) foundSeries.code = code.trim().toUpperCase();
  if (description !== undefined) foundSeries.description = description.trim();

  // Update seriesName on any models belonging to this series
  foundDept.models.forEach((m) => {
    if (m.seriesId === id) {
      m.seriesName = foundSeries!.name;
    }
  });

  broadcast('series_updated', { series: foundSeries, departmentId: foundDept.id });
  broadcast('departments_updated', departments);

  res.json({ success: true, series: foundSeries, departments });
});

// Admin deletes a Series with safeguard cascade
app.delete('/api/series/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  let targetDept: DepartmentInfo | null = null;
  let deletedSeries: ProductSeries | null = null;

  for (const dept of departments) {
    const idx = dept.series?.findIndex((s) => s.id === id) ?? -1;
    if (idx !== -1 && dept.series) {
      targetDept = dept;
      deletedSeries = dept.series[idx];
      dept.series.splice(idx, 1);

      // Also remove associated models & drawings
      const modelsToDelete = dept.models.filter((m) => m.seriesId === id);
      dept.models = dept.models.filter((m) => m.seriesId !== id);
      modelsToDelete.forEach((m) => {
        m.lengths.forEach((l) => {
          drawings = drawings.filter((d) => d.id !== l.drawingId);
        });
      });
      break;
    }
  }

  if (!deletedSeries || !targetDept) {
    return res.status(404).json({ error: 'Series not found' });
  }

  broadcast('series_deleted', { seriesId: id, departmentId: targetDept.id });
  broadcast('departments_updated', departments);
  broadcast('drawings_updated', drawings);

  res.json({ success: true, seriesId: id, departments, drawings });
});

// Admin adds a new model to SAS / PTS / OTS (can belong to a Series)
app.post('/api/models', (req: Request, res: Response) => {
  const {
    departmentId,
    seriesId,
    code,
    name,
    nameEn = '',
    category = 'อุปกรณ์ผลิตทั่วไป',
    description = '',
    svgType = 'shaft',
    initialLengthMm = 300,
    machineNo = 'CNC-01',
  } = req.body;

  if (!departmentId || !code || !name) {
    return res.status(400).json({ error: 'departmentId, code, and name are required' });
  }

  const dept = departments.find((d) => d.id === departmentId);
  if (!dept) {
    return res.status(404).json({ error: `Department ${departmentId} not found` });
  }

  // Resolve series info
  const chosenSeries = dept.series?.find((s) => s.id === seriesId) || dept.series?.[0] || null;

  const modelId = `mod-${departmentId.toLowerCase()}-${Date.now().toString(36)}`;
  const lengthId = `len-${modelId}-${initialLengthMm}`;
  const drawingId = `dwg-${code.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${initialLengthMm}`;
  const partNumber = `PN-${code}-L${initialLengthMm}`;
  const drawingCode = `DWG-${code}-${String(initialLengthMm).padStart(4, '0')}`;

  const initialLength: ModelLengthVariant = {
    id: lengthId,
    modelId,
    departmentId,
    lengthMm: Number(initialLengthMm),
    lengthLabel: `L = ${initialLengthMm} mm`,
    drawingId,
    partNumber,
    drawingCode,
    nominalStroke: `${Math.round(initialLengthMm * 0.6)} mm`,
    machineNo,
    createdAt: new Date().toISOString().substring(0, 10),
  };

  const newModel: ProductModel = {
    id: modelId,
    departmentId,
    seriesId: chosenSeries ? chosenSeries.id : undefined,
    seriesName: chosenSeries ? chosenSeries.name : undefined,
    code,
    name,
    nameEn: nameEn || name,
    category,
    description,
    svgType,
    lengths: [initialLength],
    createdAt: new Date().toISOString().substring(0, 10),
  };

  dept.models.unshift(newModel);

  // Auto-generate associated Drawing
  const newDrawing = createDrawingForLength(departmentId, newModel, initialLength);

  // If user attached an initial file when creating the model
  if (req.body.initialFile && req.body.initialFile.fileName) {
    const initFile: AttachedDrawingFile = {
      id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      fileName: req.body.initialFile.fileName,
      fileType: req.body.initialFile.fileType || 'PDF',
      fileSize: req.body.initialFile.fileSize || '1.0 MB',
      uploadedAt: new Date().toLocaleString('th-TH', { hour12: false }),
      uploadedBy: req.body.initialFile.uploadedBy || 'ผู้ดูแลระบบ (Admin)',
      source: req.body.initialFile.source || 'DIRECT_UPLOAD',
      dataUrl: req.body.initialFile.dataUrl,
      fileUrl: req.body.initialFile.fileUrl,
      notes: req.body.initialFile.notes || 'ไฟล์ดรออิ้งเริ่มต้นที่แนบมาพร้อมรุ่น',
    };
    newDrawing.attachedFiles = [initFile];
  }

  drawings.unshift(newDrawing);

  const notif: NotificationAlert = {
    id: `notif-mod-${Date.now()}`,
    drawingId: newDrawing.id,
    drawingCode: newDrawing.code,
    title: `เพิ่มรุ่นใหม่: [${departmentId}] ${code}`,
    message: `${name} ได้รับการบรรจุเข้าสู่ระบบคลาวด์ พร้อมดรออิ้งขนาด ${initialLength.lengthLabel}`,
    version: 'Rev A',
    severity: 'INFO',
    timestamp: new Date().toLocaleString('th-TH'),
    read: false,
  };
  notifications.unshift(notif);

  broadcast('model_added', { departmentId, model: newModel, drawing: newDrawing });
  broadcast('drawing_created', newDrawing);
  broadcast('notification', notif);

  res.status(201).json({ success: true, model: newModel, drawing: newDrawing, departments });
});

// Admin updates a model header (code, name, nameEn, category, description, svgType)
app.patch('/api/models/:modelId', (req: Request, res: Response) => {
  const { modelId } = req.params;
  const { code, name, nameEn, category, description, svgType, seriesId } = req.body;

  let foundModel: ProductModel | null = null;
  let foundDept: DepartmentInfo | null = null;

  for (const dept of departments) {
    const m = dept.models.find((mod) => mod.id === modelId);
    if (m) {
      foundModel = m;
      foundDept = dept;
      break;
    }
  }

  if (!foundModel || !foundDept) {
    return res.status(404).json({ error: 'Model not found' });
  }

  const oldCode = foundModel.code;
  if (code !== undefined && code.trim()) foundModel.code = code.trim().toUpperCase();
  if (name !== undefined && name.trim()) foundModel.name = name.trim();
  if (nameEn !== undefined) foundModel.nameEn = nameEn.trim();
  if (category !== undefined && category.trim()) foundModel.category = category.trim();
  if (description !== undefined) foundModel.description = description.trim();
  if (svgType !== undefined) foundModel.svgType = svgType;
  if (seriesId !== undefined) {
    foundModel.seriesId = seriesId;
    const s = foundDept.series?.find((x) => x.id === seriesId);
    foundModel.seriesName = s ? s.name : undefined;
  }

  // Sync to all drawings belonging to this model
  for (const len of foundModel.lengths) {
    const dwg = drawings.find((d) => d.id === len.drawingId);
    if (dwg) {
      dwg.modelName = foundModel.name;
      if (foundModel.name) {
        dwg.title = `${foundModel.name} ${len.lengthLabel}`;
      }
      if (foundModel.nameEn) {
        dwg.titleEn = `${foundModel.nameEn} ${len.lengthLabel}`;
      }
      if (code && code.trim().toUpperCase() !== oldCode) {
        dwg.code = `DWG-${foundModel.code}-${String(len.lengthMm).padStart(4, '0')}`;
        len.drawingCode = dwg.code;
        len.partNumber = `PN-${foundModel.code}-L${len.lengthMm}`;
        dwg.partNumber = len.partNumber;
      }
      if (svgType && dwg.versions && dwg.versions.length > 0) {
        dwg.versions.forEach((v) => {
          v.svgType = svgType;
        });
      }
      dwg.lastUpdated = new Date().toLocaleString('th-TH', { hour12: false });
    }
  }

  const notif: NotificationAlert = {
    id: `notif-mod-edit-${Date.now()}`,
    drawingId: foundModel.lengths[0]?.drawingId || '',
    drawingCode: foundModel.code,
    title: `แก้ไขหัวข้อรุ่น: [${foundDept.id}] ${foundModel.code}`,
    message: `อัปเดตข้อมูลรุ่นเป็น "${foundModel.name}" เรียบร้อยแล้ว`,
    version: 'Update',
    severity: 'INFO',
    timestamp: new Date().toLocaleString('th-TH'),
    read: false,
  };
  notifications.unshift(notif);

  broadcast('model_updated', { model: foundModel, departmentId: foundDept.id });
  broadcast('departments_updated', departments);
  broadcast('drawings_updated', drawings);
  broadcast('notification', notif);

  res.json({ success: true, model: foundModel, departments, drawings });
});

// Admin deletes a model
app.delete('/api/models/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  let deletedModel: ProductModel | null = null;
  let targetDeptId: DepartmentId | null = null;

  for (const dept of departments) {
    const idx = dept.models.findIndex((m) => m.id === id);
    if (idx !== -1) {
      deletedModel = dept.models[idx];
      targetDeptId = dept.id;
      dept.models.splice(idx, 1);
      break;
    }
  }

  if (!deletedModel) {
    return res.status(404).json({ error: 'Model not found' });
  }

  // Delete all drawings belonging to this model
  const drawingIdsToRemove = new Set(deletedModel.lengths.map((l) => l.drawingId));
  drawings = drawings.filter((d) => !drawingIdsToRemove.has(d.id));

  broadcast('model_deleted', {
    modelId: id,
    departmentId: targetDeptId,
    deletedDrawingIds: Array.from(drawingIdsToRemove),
  });

  res.json({ success: true, deletedModelId: id, departments, drawings });
});

// Admin adds a length variant to a model
app.post('/api/models/:modelId/lengths', (req: Request, res: Response) => {
  const { modelId } = req.params;
  const {
    lengthMm,
    lengthLabel,
    partNumber,
    machineNo = 'CNC-01',
    nominalStroke,
  } = req.body;

  if (!lengthMm) {
    return res.status(400).json({ error: 'lengthMm is required' });
  }

  let foundModel: ProductModel | null = null;
  let foundDept: DepartmentInfo | null = null;

  for (const dept of departments) {
    const m = dept.models.find((mod) => mod.id === modelId);
    if (m) {
      foundModel = m;
      foundDept = dept;
      break;
    }
  }

  if (!foundModel || !foundDept) {
    return res.status(404).json({ error: 'Model not found' });
  }

  const numLength = Number(lengthMm);
  const lengthId = `len-${modelId}-${numLength}-${Date.now().toString(36)}`;
  const drawingId = `dwg-${foundModel.code.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${numLength}`;
  const generatedLabel = lengthLabel || `L = ${numLength} mm`;
  const generatedPartNumber = partNumber || `PN-${foundModel.code}-L${numLength}`;
  const generatedDrawingCode = `DWG-${foundModel.code}-${String(numLength).padStart(4, '0')}`;

  const newLength: ModelLengthVariant = {
    id: lengthId,
    modelId,
    departmentId: foundDept.id,
    lengthMm: numLength,
    lengthLabel: generatedLabel,
    drawingId,
    partNumber: generatedPartNumber,
    drawingCode: generatedDrawingCode,
    nominalStroke: nominalStroke || `${Math.round(numLength * 0.6)} mm`,
    machineNo,
    createdAt: new Date().toISOString().substring(0, 10),
  };

  foundModel.lengths.push(newLength);

  // Auto-generate associated Drawing
  const newDrawing = createDrawingForLength(foundDept.id, foundModel, newLength);
  drawings.unshift(newDrawing);

  broadcast('length_added', { modelId, length: newLength, drawing: newDrawing });
  broadcast('drawing_created', newDrawing);

  res.status(201).json({ success: true, length: newLength, drawing: newDrawing, departments });
});

// Admin deletes a length variant from a model
app.delete('/api/models/:modelId/lengths/:lengthId', (req: Request, res: Response) => {
  const { modelId, lengthId } = req.params;

  let foundModel: ProductModel | null = null;
  for (const dept of departments) {
    const m = dept.models.find((mod) => mod.id === modelId);
    if (m) {
      foundModel = m;
      break;
    }
  }

  if (!foundModel) {
    return res.status(404).json({ error: 'Model not found' });
  }

  const lenIdx = foundModel.lengths.findIndex((l) => l.id === lengthId);
  if (lenIdx === -1) {
    return res.status(404).json({ error: 'Length variant not found' });
  }

  const deletedLength = foundModel.lengths[lenIdx];
  foundModel.lengths.splice(lenIdx, 1);

  // Remove corresponding drawing
  drawings = drawings.filter((d) => d.id !== deletedLength.drawingId);

  broadcast('length_deleted', {
    modelId,
    lengthId,
    deletedDrawingId: deletedLength.drawingId,
  });

  res.json({ success: true, deletedLengthId: lengthId, departments, drawings });
});

// 4. Get all drawings
app.get('/api/drawings', (req: Request, res: Response) => {
  res.json(drawings);
});

// 4. Get single drawing
app.get('/api/drawings/:id', (req: Request, res: Response) => {
  const drawing = drawings.find((d) => d.id === req.params.id);
  if (!drawing) {
    return res.status(404).json({ error: 'Drawing not found' });
  }
  res.json(drawing);
});

// 5. Create new drawing
app.post('/api/drawings', (req: Request, res: Response) => {
  const newDrawing: Drawing = req.body;
  if (!newDrawing.id || !newDrawing.code || !newDrawing.title) {
    return res.status(400).json({ error: 'Missing required drawing fields' });
  }
  drawings.unshift(newDrawing);

  const notif: NotificationAlert = {
    id: `notif-${Date.now()}`,
    drawingId: newDrawing.id,
    drawingCode: newDrawing.code,
    title: `เพิ่มแบบดรออิ้งใหม่: ${newDrawing.code}`,
    message: `${newDrawing.title} (${newDrawing.currentVersion}) เข้าสู่ระบบคลาวด์`,
    version: newDrawing.currentVersion,
    severity: 'INFO',
    timestamp: new Date().toLocaleString('th-TH'),
    read: false,
  };
  notifications.unshift(notif);

  broadcast('drawing_created', newDrawing);
  broadcast('notification', notif);

  res.status(201).json(newDrawing);
});

// 6. Create / Release new version with auto-increment & urgent broadcast
app.post('/api/drawings/:id/revisions', (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    version,
    changeDescription,
    changeDepartment = 'R&D',
    releasedBy = 'วิศวกรผู้รับผิดชอบ',
    ecoNumber,
    isApprovedForProduction = true,
    diffHighlights = [],
  } = req.body;

  const drawingIndex = drawings.findIndex((d) => d.id === id);
  if (drawingIndex === -1) {
    return res.status(404).json({ error: 'Drawing not found' });
  }

  const drawing = drawings[drawingIndex];

  // Auto version name if not specified
  let targetVersion = version;
  if (!targetVersion) {
    const currentLetter = drawing.currentVersion.replace(/[^A-Z]/g, '') || 'A';
    const nextCharCode = currentLetter.charCodeAt(0) + 1;
    targetVersion = `Rev ${String.fromCharCode(nextCharCode)}`;
  }

  const newVersionObj: DrawingVersion = {
    version: targetVersion,
    releaseDate: new Date().toLocaleString('th-TH', { hour12: false }),
    releasedBy,
    ecoNumber: ecoNumber || `ECO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    changeDescription: changeDescription || 'อัปเดตการแก้ไขแบบวิศวกรรม',
    changeDepartment,
    isApprovedForProduction,
    svgType: drawing.versions[0]?.svgType || 'flange',
    diffHighlights,
  };

  // Add new version at the beginning
  drawing.versions.unshift(newVersionObj);
  drawing.currentVersion = targetVersion;
  drawing.lastUpdated = newVersionObj.releaseDate;
  drawing.latestChangelog = changeDescription;
  drawing.status = isApprovedForProduction ? 'APPROVED' : 'PENDING_REVIEW';

  // Urgent notification to all tablet stations on shop floor
  const alertNotif: NotificationAlert = {
    id: `notif-rev-${Date.now()}`,
    drawingId: drawing.id,
    drawingCode: drawing.code,
    title: `⚠️ แจ้งเตือนการแก้ไขด่วน: ${drawing.code} อัปเดตเป็น ${targetVersion}`,
    message: `${changeDescription.split('\n')[0] || changeDescription} - กดยืนยันรับทราบก่อนเริ่มผลิต`,
    version: targetVersion,
    severity: 'URGENT_CHANGE',
    timestamp: new Date().toLocaleString('th-TH'),
    read: false,
  };

  notifications.unshift(alertNotif);

  // Broadcast to all connected tablets instantly
  broadcast('drawing_updated', drawing);
  broadcast('notification', alertNotif);

  res.json({ success: true, drawing, notification: alertNotif });
});

// Update drawing metadata (ชื่องาน, part number, รหัสแบบ, วัสดุ, etc.)
app.patch('/api/drawings/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  const drawing = drawings.find((d) => d.id === id);
  if (!drawing) {
    return res.status(404).json({ error: 'Drawing not found' });
  }

  if (updates.title !== undefined) drawing.title = updates.title;
  if (updates.titleEn !== undefined) drawing.titleEn = updates.titleEn;
  if (updates.code !== undefined) drawing.code = updates.code;
  if (updates.partNumber !== undefined) drawing.partNumber = updates.partNumber;
  if (updates.material !== undefined) drawing.material = updates.material;
  if (updates.treatment !== undefined) drawing.treatment = updates.treatment;
  if (updates.machineNo !== undefined) drawing.machineNo = updates.machineNo;
  if (updates.productionLine !== undefined) drawing.productionLine = updates.productionLine;
  if (updates.toleranceStandard !== undefined) drawing.toleranceStandard = updates.toleranceStandard;
  if (updates.notes !== undefined && Array.isArray(updates.notes)) drawing.notes = updates.notes;
  drawing.lastUpdated = new Date().toLocaleString('th-TH', { hour12: false });

  // If model name is also updated and drawing has modelId, sync model name in departments
  if (updates.modelName && drawing.modelId) {
    for (const dept of departments) {
      const mod = dept.models.find((m) => m.id === drawing.modelId);
      if (mod) {
        mod.name = updates.modelName;
        drawing.modelName = updates.modelName;
      }
    }
  }

  const notif: NotificationAlert = {
    id: `notif-edit-${Date.now()}`,
    drawingId: drawing.id,
    drawingCode: drawing.code,
    title: `แก้ไขข้อมูลแบบ: ${drawing.code}`,
    message: `แก้ไขชื่องานเป็น "${drawing.title}" โดยแอดมิน`,
    version: drawing.currentVersion,
    severity: 'INFO',
    timestamp: new Date().toLocaleString('th-TH'),
    read: false,
  };
  notifications.unshift(notif);

  broadcast('drawing_updated', drawing);
  broadcast('notification', notif);

  res.json({ success: true, drawing, departments });
});

// Admin attaches a drawing file (PDF, DXF, DWG, STEP, SVG, PNG)
app.post('/api/drawings/:id/files', (req: Request, res: Response) => {
  const { id } = req.params;
  const { fileName, fileType, fileSize, source = 'DIRECT_UPLOAD', dataUrl, fileUrl, notes, uploadedBy = 'ผู้ดูแลระบบ (Admin)' } = req.body;

  const drawing = drawings.find((d) => d.id === id);
  if (!drawing) {
    return res.status(404).json({ error: 'Drawing not found' });
  }

  if (!fileName) {
    return res.status(400).json({ error: 'fileName is required' });
  }

  const newFile: AttachedDrawingFile = {
    id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    fileName,
    fileType: fileType || 'PDF',
    fileSize: fileSize || '1.2 MB',
    uploadedAt: new Date().toLocaleString('th-TH', { hour12: false }),
    uploadedBy,
    source,
    dataUrl,
    fileUrl,
    notes,
  };

  if (!drawing.attachedFiles) {
    drawing.attachedFiles = [];
  }
  drawing.attachedFiles.unshift(newFile);
  drawing.lastUpdated = newFile.uploadedAt;

  const notif: NotificationAlert = {
    id: `notif-file-${Date.now()}`,
    drawingId: drawing.id,
    drawingCode: drawing.code,
    title: `แนบไฟล์งานใหม่: ${fileName}`,
    message: `แอดมินแนบไฟล์ประเภท ${newFile.fileType} (${newFile.fileSize}) ในแบบ ${drawing.code}`,
    version: drawing.currentVersion,
    severity: 'INFO',
    timestamp: new Date().toLocaleString('th-TH'),
    read: false,
  };
  notifications.unshift(notif);

  broadcast('drawing_updated', drawing);
  broadcast('notification', notif);

  res.status(201).json({ success: true, file: newFile, drawing });
});

// 7. Acknowledge revision sign-off
app.post('/api/drawings/:id/acknowledge', (req: Request, res: Response) => {
  const { id } = req.params;
  const { operatorName, operatorId, lineId, machineId, comment, version } = req.body;

  const drawing = drawings.find((d) => d.id === id);
  if (!drawing) {
    return res.status(404).json({ error: 'Drawing not found' });
  }

  const ack: OperatorAcknowledgment = {
    id: `ack-${Date.now()}`,
    version: version || drawing.currentVersion,
    operatorName: operatorName || 'พนักงานฝ่ายผลิต',
    operatorId: operatorId || 'OP-001',
    lineId: lineId || drawing.productionLine,
    machineId: machineId || drawing.machineNo,
    timestamp: new Date().toLocaleString('th-TH', { hour12: false }),
    comment: comment || 'รับทราบแบบดรออิ้งฉบับล่าสุด และตรวจสอบพารามิเตอร์เครื่องจักรเรียบร้อย',
  };

  drawing.acknowledgments.unshift(ack);

  broadcast('drawing_acknowledged', { drawingId: drawing.id, acknowledgment: ack, drawing });

  res.json({ success: true, acknowledgment: ack });
});

// 8. Add floor inspection measurement
app.post('/api/drawings/:id/inspections', (req: Request, res: Response) => {
  const { id } = req.params;
  const { dimensionId, measuredValue, status } = req.body;

  const drawing = drawings.find((d) => d.id === id);
  if (!drawing) {
    return res.status(404).json({ error: 'Drawing not found' });
  }

  const dim = drawing.criticalDimensions.find((d) => d.id === dimensionId);
  if (dim) {
    dim.measuredValue = measuredValue;
    dim.status = status;
  }

  broadcast('inspection_updated', { drawingId: drawing.id, dimension: dim, drawing });
  res.json({ success: true, drawing });
});

// 9. Add drawing annotation / note
app.post('/api/drawings/:id/annotations', (req: Request, res: Response) => {
  const { id } = req.params;
  const { x, y, text, author = 'พนักงานหน้างาน' } = req.body;

  const drawing = drawings.find((d) => d.id === id);
  if (!drawing) {
    return res.status(404).json({ error: 'Drawing not found' });
  }

  const newAnn = {
    id: `ann-${Date.now()}`,
    x,
    y,
    text,
    author,
    createdAt: new Date().toLocaleString('th-TH'),
    color: '#3b82f6',
  };

  drawing.annotations.push(newAnn);

  broadcast('annotation_added', { drawingId: drawing.id, annotation: newAnn, drawing });
  res.json({ success: true, annotation: newAnn });
});

// 10. Notifications endpoints
app.get('/api/notifications', (req: Request, res: Response) => {
  res.json(notifications);
});

app.post('/api/notifications/:id/read', (req: Request, res: Response) => {
  const notif = notifications.find((n) => n.id === req.params.id);
  if (notif) {
    notif.read = true;
  }
  res.json({ success: true });
});

// 11. Batch sync endpoint for offline mutations
app.post('/api/sync', (req: Request, res: Response) => {
  const { queue } = req.body;
  const results: any[] = [];

  if (Array.isArray(queue)) {
    for (const item of queue) {
      if (item.action === 'ACKNOWLEDGE') {
        const drawing = drawings.find((d) => d.id === item.drawingId);
        if (drawing) {
          const ack: OperatorAcknowledgment = {
            id: item.payload.id || `ack-sync-${Date.now()}`,
            version: item.payload.version,
            operatorName: item.payload.operatorName,
            operatorId: item.payload.operatorId,
            lineId: item.payload.lineId,
            machineId: item.payload.machineId,
            timestamp: item.payload.timestamp || new Date().toLocaleString('th-TH'),
            comment: item.payload.comment,
          };
          drawing.acknowledgments.unshift(ack);
          results.push({ action: 'ACKNOWLEDGE', status: 'synced', id: item.id });
        }
      } else if (item.action === 'CREATE_REVISION') {
        const drawing = drawings.find((d) => d.id === item.drawingId);
        if (drawing) {
          const newVersionObj: DrawingVersion = {
            version: item.payload.version,
            releaseDate: new Date().toLocaleString('th-TH'),
            releasedBy: item.payload.releasedBy || 'วิศวกร (Offline Sync)',
            ecoNumber: item.payload.ecoNumber || `ECO-OFF-${Date.now()}`,
            changeDescription: item.payload.changeDescription,
            changeDepartment: item.payload.changeDepartment || 'R&D',
            isApprovedForProduction: item.payload.isApprovedForProduction ?? true,
            svgType: drawing.versions[0]?.svgType || 'flange',
            diffHighlights: item.payload.diffHighlights || [],
          };
          drawing.versions.unshift(newVersionObj);
          drawing.currentVersion = newVersionObj.version;
          drawing.lastUpdated = newVersionObj.releaseDate;
          drawing.latestChangelog = newVersionObj.changeDescription;
          results.push({ action: 'CREATE_REVISION', status: 'synced', id: item.id });
        }
      } else if (item.action === 'UPDATE_INSPECTION') {
        const drawing = drawings.find((d) => d.id === item.drawingId);
        if (drawing) {
          const dim = drawing.criticalDimensions.find((d) => d.id === item.payload.dimensionId);
          if (dim) {
            dim.measuredValue = item.payload.measuredValue;
            dim.status = item.payload.status;
            results.push({ action: 'UPDATE_INSPECTION', status: 'synced', id: item.id });
          }
        }
      } else if (item.action === 'ADD_MODEL') {
        const { departmentId, model, initialLength } = item.payload;
        const dept = departments.find((d) => d.id === departmentId);
        if (dept && !dept.models.some((m) => m.id === model.id)) {
          dept.models.unshift(model);
          const newDwg = createDrawingForLength(departmentId, model, initialLength);
          drawings.unshift(newDwg);
          results.push({ action: 'ADD_MODEL', status: 'synced', id: item.id });
        }
      } else if (item.action === 'DELETE_MODEL') {
        const { modelId } = item.payload;
        for (const dept of departments) {
          const mIdx = dept.models.findIndex((m) => m.id === modelId);
          if (mIdx !== -1) {
            const m = dept.models[mIdx];
            const drawingIdsToRemove = new Set(m.lengths.map((l) => l.drawingId));
            drawings = drawings.filter((d) => !drawingIdsToRemove.has(d.id));
            dept.models.splice(mIdx, 1);
            results.push({ action: 'DELETE_MODEL', status: 'synced', id: item.id });
            break;
          }
        }
      } else if (item.action === 'ADD_LENGTH') {
        const { modelId, length } = item.payload;
        for (const dept of departments) {
          const m = dept.models.find((mod) => mod.id === modelId);
          if (m && !m.lengths.some((l) => l.id === length.id)) {
            m.lengths.push(length);
            const newDwg = createDrawingForLength(dept.id, m, length);
            drawings.unshift(newDwg);
            results.push({ action: 'ADD_LENGTH', status: 'synced', id: item.id });
            break;
          }
        }
      } else if (item.action === 'DELETE_LENGTH') {
        const { modelId, lengthId } = item.payload;
        for (const dept of departments) {
          const m = dept.models.find((mod) => mod.id === modelId);
          if (m) {
            const lenIdx = m.lengths.findIndex((l) => l.id === lengthId);
            if (lenIdx !== -1) {
              const len = m.lengths[lenIdx];
              drawings = drawings.filter((d) => d.id !== len.drawingId);
              m.lengths.splice(lenIdx, 1);
              results.push({ action: 'DELETE_LENGTH', status: 'synced', id: item.id });
              break;
            }
          }
        }
      } else if (item.action === 'UPDATE_DRAWING') {
        const drawing = drawings.find((d) => d.id === item.drawingId);
        if (drawing) {
          const updates = item.payload;
          if (updates.title !== undefined) drawing.title = updates.title;
          if (updates.titleEn !== undefined) drawing.titleEn = updates.titleEn;
          if (updates.code !== undefined) drawing.code = updates.code;
          if (updates.partNumber !== undefined) drawing.partNumber = updates.partNumber;
          if (updates.material !== undefined) drawing.material = updates.material;
          if (updates.treatment !== undefined) drawing.treatment = updates.treatment;
          if (updates.machineNo !== undefined) drawing.machineNo = updates.machineNo;
          if (updates.notes !== undefined && Array.isArray(updates.notes)) drawing.notes = updates.notes;
          drawing.lastUpdated = new Date().toLocaleString('th-TH');
          results.push({ action: 'UPDATE_DRAWING', status: 'synced', id: item.id });
        }
      } else if (item.action === 'ADD_ATTACHED_FILE') {
        const drawing = drawings.find((d) => d.id === item.drawingId);
        if (drawing) {
          if (!drawing.attachedFiles) drawing.attachedFiles = [];
          drawing.attachedFiles.unshift(item.payload);
          drawing.lastUpdated = item.payload.uploadedAt || new Date().toLocaleString('th-TH');
          results.push({ action: 'ADD_ATTACHED_FILE', status: 'synced', id: item.id });
        }
      }
    }
  }

  broadcast('batch_synced', { drawings, departments, timestamp: new Date().toISOString() });
  res.json({ success: true, processedCount: results.length, drawings, departments });
});

async function startServer() {
  // Mount Vite middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cloud Drawing Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
