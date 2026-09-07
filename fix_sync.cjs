const fs = require('fs');

let code = fs.readFileSync('src/services/firebase.ts', 'utf8');

// Find the sync function
const syncReplacement = `export async function syncInitialDataToFirebase() {
  try {
    const db = getFirebaseDb();
    
    // Check & Sync Departments
    for (const dept of INITIAL_DEPARTMENTS) {
      await setDoc(doc(db, 'departments', dept.id), dept, { merge: true });
    }
`;

code = code.replace(/export async function syncInitialDataToFirebase\(\) \{\n  try \{\n    const db = getFirebaseDb\(\);\n    \n    \/\/ 1\. Sync Departments/g, syncReplacement);

// Actually, let's just make the easiest change in `src/services/firebase.ts`.
