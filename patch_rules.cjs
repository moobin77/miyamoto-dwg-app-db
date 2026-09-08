const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

const additionalRules = `
    // Access/Login Logs
    match /access_logs/{logId} {
      allow read, write: if true;
    }

    // Data Backups
    match /backups/{backupId} {
      allow read, write: if true;
    }
    match /backups/{backupId}/{subcollection}/{docId} {
      allow read, write: if true;
    }
`;

rules = rules.replace('  }\n}', additionalRules + '  }\n}');
fs.writeFileSync('firestore.rules', rules);
console.log("Patched firestore.rules");
