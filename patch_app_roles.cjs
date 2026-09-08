const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const adminTarget1 = `  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    const session = getCurrentSession();
    if (!session) return false;
    return session.role === 'ADMIN' || session.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
  });`;
  
const adminReplace1 = `  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    const session = getCurrentSession();
    if (!session) return false;
    return (session.email && session.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) || session.username === 'admin';
  });`;

const adminTarget2 = `    if (user.role === 'ADMIN' || user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }`;

const adminReplace2 = `    if ((user.email && user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) || user.username === 'admin') {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }`;

code = code.replace(adminTarget1, adminReplace1);
code = code.replace(adminTarget2, adminReplace2);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched App.tsx roles");
