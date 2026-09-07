const fs = require('fs');
let code = fs.readFileSync('src/components/DrawingCatalog.tsx', 'utf8');

const oldDestructuring = `export function DrawingCatalog({
  departments,
  drawings,
  selectedDrawingId,
  onSelectDrawing,
  selectedDepartmentId,
  onSelectDepartment,
  isAdmin
}: DrawingCatalogProps) {`;

const newDestructuring = `export function DrawingCatalog({
  departments,
  drawings,
  selectedDrawingId,
  onSelectDrawing,
  selectedDepartmentId,
  onSelectDepartment,
  isAdmin,
  onOpenAddModel,
  onOpenAddLength,
  onDeleteModel,
  onDeleteLength,
  onOpenEditJob,
  onOpenEditModel,
  onOpenAddFile,
  onOpenAddFileGuide,
  onOpenManageSeries,
  onOpenAddSeries,
  onOpenEditSeries,
  onDeleteSeries,
  operatorName,
  stationLine,
  machineId
}: DrawingCatalogProps) {`;

code = code.replace(oldDestructuring, newDestructuring);
fs.writeFileSync('src/components/DrawingCatalog.tsx', code);
