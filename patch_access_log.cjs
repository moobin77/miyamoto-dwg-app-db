const fs = require('fs');
let code = fs.readFileSync('src/services/securityService.ts', 'utf8');

const newCode = `
export async function logUserAccess(user: UserProfile, action: 'LOGIN' | 'LOGOUT' = 'LOGIN'): Promise<void> {
  try {
    const db = getFirebaseDb();
    const logId = \`log-\${Date.now().toString(36)}\`;
    await setDoc(doc(db, 'access_logs', logId), {
      userId: user.uid || 'unknown',
      username: user.username || 'unknown',
      displayName: user.displayName || 'unknown',
      role: user.role,
      action,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    });
  } catch (err) {
    console.warn('Failed to log access to Firestore:', err);
  }
}
`;

code = code.replace("export async function fetchAuthorizedUsers(): Promise<AuthorizedUser[]> {", newCode + "\nexport async function fetchAuthorizedUsers(): Promise<AuthorizedUser[]> {");
fs.writeFileSync('src/services/securityService.ts', code);
console.log("Patched securityService.ts with logUserAccess");
