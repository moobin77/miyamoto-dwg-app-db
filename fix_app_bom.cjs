const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Need to import INITIAL_DEPARTMENTS and saveDepartmentToFirestore
if (!code.includes('INITIAL_DEPARTMENTS')) {
  code = code.replace(
    "import { fetchAuthorizedUsers } from './services/securityService';",
    "import { fetchAuthorizedUsers } from './services/securityService';\nimport { INITIAL_DEPARTMENTS } from './data/departmentsData';"
  );
}

if (!code.includes('saveDepartmentToFirestore')) {
  code = code.replace(
    "subscribeToFirebaseDepartments,",
    "subscribeToFirebaseDepartments,\n  saveDepartmentToFirestore,"
  );
}

const target = `      unsubFbDepts = subscribeToFirebaseDepartments((fbDepts) => {
        if (fbDepts && fbDepts.length > 0) {
          setDepartments(fbDepts);
        }
      });`;

const replacement = `      unsubFbDepts = subscribeToFirebaseDepartments((fbDepts) => {
        if (fbDepts && fbDepts.length > 0) {
          if (!fbDepts.find((d) => d.id === 'BOM')) {
             const bom = INITIAL_DEPARTMENTS.find((d) => d.id === 'BOM');
             if (bom) {
                fbDepts.push(bom);
                saveDepartmentToFirestore(bom).catch(console.error);
             }
          }
          setDepartments(fbDepts);
        }
      });`;

code = code.replace(target, replacement);

fs.writeFileSync('src/App.tsx', code);
console.log("Fixed App.tsx!");
