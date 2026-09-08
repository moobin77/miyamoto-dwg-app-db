const fs = require('fs');
let code = fs.readFileSync('src/services/firebase.ts', 'utf8');

const target = `    await saveAllDepartmentsToFirestore(departments);
    await saveAllDrawingsToFirestore(drawings);
    for (const notif of notifications) {
      await saveNotificationToFirestore(notif);
    }
    await updateSystemStatus(departments.length, drawings.length);`;

const replacement = `    await saveAllDepartmentsToFirestore(departments);
    await saveAllDrawingsToFirestore(drawings);
    
    // Also create a backup folder structure in Firebase
    try {
      await backupDataToFirestore(departments, drawings);
    } catch(backupErr) {
      console.warn('Backup non-fatal error:', backupErr);
    }
    
    for (const notif of notifications) {
      await saveNotificationToFirestore(notif);
    }
    await updateSystemStatus(departments.length, drawings.length);`;

code = code.replace(target, replacement);
fs.writeFileSync('src/services/firebase.ts', code);
console.log("Patched sync function");
