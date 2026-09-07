const fs = require('fs');
let code = fs.readFileSync('src/services/securityService.ts', 'utf8');

const target = `export async function saveSecurityConfig(config: SecurityConfig): Promise<void> {
  saveLocalConfig(config);
  try {
    const db = getFirebaseDb();
    await setDoc(doc(db, 'security_settings', 'config'), config);
  } catch (err) {
    console.warn('Failed to sync security config to Firestore:', err);
  }
}`;

const replacement = `export async function saveSecurityConfig(config: SecurityConfig): Promise<void> {
  saveLocalConfig(config);
  try {
    const db = getFirebaseDb();
    const cleanConfig = Object.fromEntries(Object.entries(config).filter(([_, v]) => v !== undefined));
    await setDoc(doc(db, 'security_settings', 'config'), cleanConfig);
  } catch (err) {
    console.warn('Failed to sync security config to Firestore:', err);
    throw err;
  }
}`;

code = code.replace(target, replacement);
fs.writeFileSync('src/services/securityService.ts', code);
console.log("Patched saveSecurityConfig");
