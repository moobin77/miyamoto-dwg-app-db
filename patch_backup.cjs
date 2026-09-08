const fs = require('fs');
let code = fs.readFileSync('src/services/firebase.ts', 'utf8');

const newCode = `
export async function backupDataToFirestore(
  departments: DepartmentInfo[],
  drawings: Drawing[]
): Promise<void> {
  try {
    const db = getFirebaseDb();
    const backupId = \`backup_\${Date.now()}\`;
    const backupDocRef = doc(db, 'backups', backupId);
    
    // Save metadata
    await setDoc(backupDocRef, {
      timestamp: new Date().toISOString(),
      departmentCount: departments.length,
      drawingCount: drawings.length,
      status: 'COMPLETED'
    });
    
    // Save collections inside backup document
    const deptPromises = departments.map(dept => 
      setDoc(doc(db, \`backups/\${backupId}/departments\`, dept.id), dept)
    );
    const dwgPromises = drawings.map(dwg => 
      setDoc(doc(db, \`backups/\${backupId}/drawings\`, dwg.id), dwg)
    );
    
    await Promise.all([...deptPromises, ...dwgPromises]);
    console.log('Backup created successfully:', backupId);
  } catch (err) {
    console.error('Failed to create backup in Firebase:', err);
    throw err;
  }
}
`;

code = code.replace("export async function syncAllToFirebaseDatabase(", newCode + "\nexport async function syncAllToFirebaseDatabase(");
fs.writeFileSync('src/services/firebase.ts', code);
console.log("Patched firebase.ts with backupDataToFirestore");
