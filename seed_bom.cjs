const fs = require('fs');

let code = fs.readFileSync('src/services/firebase.ts', 'utf8');
code = code.replace(
  /export function subscribeToFirebaseDepartments\(callback: \(depts: DepartmentInfo\[\]\) => void\): Unsubscribe \{/g,
  `export function subscribeToFirebaseDepartments(callback: (depts: DepartmentInfo[]) => void): Unsubscribe {
  // Hack to ensure BOM is always injected if Firebase misses it
  const wrapCallback = (depts: DepartmentInfo[]) => {
    if (!depts.find(d => d.id === 'BOM')) {
       // Find BOM from INITIAL
       import('../data/departmentsData').then(({ INITIAL_DEPARTMENTS }) => {
          const bom = INITIAL_DEPARTMENTS.find(d => d.id === 'BOM');
          if (bom) {
            depts.push(bom);
            callback([...depts]);
            // Also push to firebase
            const db = getFirebaseDb();
            import('firebase/firestore').then(({ setDoc, doc }) => {
               setDoc(doc(db, 'departments', 'BOM'), bom).catch(console.error);
            });
          } else {
             callback(depts);
          }
       });
    } else {
       callback(depts);
    }
  };`
);

code = code.replace(/callback\(depts\);/g, "wrapCallback(depts);");
// But this might replace too many things, let's just do an exact match or use sed.
