const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Add import
code = code.replace(
  "fetchSecurityConfig,",
  "fetchSecurityConfig,\n  logUserAccess,"
);

// Patch handleUnlock
const unlockTarget = `  const handleUnlock = (user: UserProfile) => {
    setCurrentUser(user);
    setCurrentSession(user);`;

const unlockReplace = `  const handleUnlock = (user: UserProfile) => {
    logUserAccess(user, 'LOGIN');
    setCurrentUser(user);
    setCurrentSession(user);`;

code = code.replace(unlockTarget, unlockReplace);

// Patch handleLogout
const logoutTarget = `  const handleLogout = () => {
    setCurrentUser(null);`;

const logoutReplace = `  const handleLogout = () => {
    if (currentUser) {
      logUserAccess(currentUser, 'LOGOUT');
    }
    setCurrentUser(null);`;

code = code.replace(logoutTarget, logoutReplace);

// Patch kickOut
const kickOutTarget = `      const kickOut = () => {
        setCurrentUser(null);`;

const kickOutReplace = `      const kickOut = () => {
        if (currentUser) {
          logUserAccess(currentUser, 'LOGOUT');
        }
        setCurrentUser(null);`;

code = code.replace(kickOutTarget, kickOutReplace);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched App.tsx for logging");
