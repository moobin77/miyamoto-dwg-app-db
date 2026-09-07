const fs = require('fs');
let code = fs.readFileSync('src/services/securityService.ts', 'utf8');

const target = `  // Firestore update
  try {
    const db = getFirebaseDb();
    await setDoc(doc(db, 'authorized_users', newUser.id), newUser);`;

const replacement = `  // Firestore update
  try {
    const db = getFirebaseDb();
    // Remove undefined fields
    const cleanUser = Object.fromEntries(Object.entries(newUser).filter(([_, v]) => v !== undefined));
    await setDoc(doc(db, 'authorized_users', newUser.id), cleanUser);`;

code = code.replace(target, replacement);

const target2 = `    try {
      const db = getFirebaseDb();
      await setDoc(doc(db, 'authorized_users', userId), list[index], { merge: true });`;

const replacement2 = `    try {
      const db = getFirebaseDb();
      const cleanUpdates = Object.fromEntries(Object.entries(list[index]).filter(([_, v]) => v !== undefined));
      await setDoc(doc(db, 'authorized_users', userId), cleanUpdates, { merge: true });`;

code = code.replace(target2, replacement2);

fs.writeFileSync('src/services/securityService.ts', code);
console.log("Patched undefined fields in Firestore");
