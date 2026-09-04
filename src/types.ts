export type DrawingStatus = 'APPROVED' | 'PENDING_REVIEW' | 'OBSOLETE';

export interface DiffHighlight {
  type: 'modified' | 'added' | 'removed';
  label: string;
  description: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface DrawingVersion {
  version: string;
  releaseDate: string;
  releasedBy: string;
  ecoNumber: string; // Engineering Change Order (e.g. ECO-2024-089)
  changeDescription: string;
  changeDepartment: 'R&D' | 'Tooling' | 'Production' | 'Quality';
  isApprovedForProduction: boolean;
  svgType: 'flange' | 'shaft' | 'manifold' | 'bracket';
  diffHighlights?: DiffHighlight[];
}

export interface OperatorAcknowledgment {
  id: string;
  version: string;
  operatorName: string;
  operatorId: string;
  lineId: string;
  timestamp: string;
  machineId?: string;
  comment?: string;
}

export interface CriticalDimension {
  id: string;
  itemNo: string;
  label: string;
  nominal: string;
  tolerance: string;
  tool: string;
  measuredValue?: string;
  status: 'PASS' | 'FAIL' | 'PENDING';
}

export interface AnnotationItem {
  id: string;
  x: number;
  y: number;
  text: string;
  author: string;
  createdAt: string;
  color: string;
}

export type DepartmentId = 'SAS' | 'PTS' | 'OTS';

export interface ModelLengthVariant {
  id: string;
  modelId: string;
  departmentId: DepartmentId;
  lengthMm: number;
  lengthLabel: string; // e.g. "L = 300 mm"
  drawingId: string;
  partNumber: string;
  drawingCode: string;
  nominalStroke?: string;
  machineNo: string;
  createdAt: string;
}

export interface ProductModel {
  id: string;
  departmentId: DepartmentId;
  code: string; // e.g. "SAS-C50", "PTS-S60", "OTS-M40"
  name: string; // e.g. "กระบอกสูบไฮดรอลิก Actuator C50"
  nameEn: string;
  category: string;
  description?: string;
  svgType: 'flange' | 'shaft' | 'manifold' | 'bracket';
  lengths: ModelLengthVariant[];
  createdAt: string;
}

export interface DepartmentInfo {
  id: DepartmentId;
  code: DepartmentId;
  name: string;
  nameEn: string;
  description: string;
  models: ProductModel[];
}

export interface AttachedDrawingFile {
  id: string;
  fileName: string;
  fileType: 'PDF' | 'DXF' | 'DWG' | 'STEP' | 'SVG' | 'IMAGE';
  fileSize: string;
  uploadedAt: string;
  uploadedBy: string;
  source: 'DIRECT_UPLOAD' | 'PARAMETRIC_CAD' | 'PDM_SYNC';
  fileUrl?: string;
  dataUrl?: string;
  notes?: string;
}

export interface Drawing {
  id: string;
  code: string;
  title: string;
  titleEn: string;
  partNumber: string;
  productionLine: string;
  machineNo: string;
  currentVersion: string;
  status: DrawingStatus;
  approvedBy: string;
  approvedAt: string;
  lastUpdated: string;
  latestChangelog: string;
  material: string;
  treatment: string;
  scale: string;
  unit: string;
  toleranceStandard: string;
  department?: DepartmentId;
  modelId?: string;
  modelCode?: string;
  modelName?: string;
  lengthMm?: number;
  lengthLabel?: string;
  attachedFiles?: AttachedDrawingFile[];
  versions: DrawingVersion[];
  acknowledgments: OperatorAcknowledgment[];
  criticalDimensions: CriticalDimension[];
  annotations: AnnotationItem[];
  notes: string[];
}

export interface NotificationAlert {
  id: string;
  drawingId: string;
  drawingCode: string;
  title: string;
  message: string;
  version: string;
  severity: 'URGENT_CHANGE' | 'APPROVED' | 'INFO';
  timestamp: string;
  read: boolean;
}

export interface OfflineQueueItem {
  id: string;
  action:
    | 'CREATE_REVISION'
    | 'ACKNOWLEDGE'
    | 'UPDATE_INSPECTION'
    | 'ADD_ANNOTATION'
    | 'ADD_MODEL'
    | 'DELETE_MODEL'
    | 'ADD_LENGTH'
    | 'DELETE_LENGTH'
    | 'UPDATE_DRAWING'
    | 'ADD_ATTACHED_FILE';
  drawingId?: string;
  payload: any;
  timestamp: number;
}

export interface SyncStatus {
  isOnline: boolean;
  isSimulatedOffline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncedAt: string | null;
}
