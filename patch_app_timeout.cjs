const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const injection = `
  // 1-Hour hard limit for Operators
  useEffect(() => {
    let operatorTimeout: NodeJS.Timeout | null = null;
    
    if (currentUser && currentUser.role === 'OPERATOR') {
      const loginTime = currentUser.loggedInAt ? new Date(currentUser.loggedInAt).getTime() : Date.now();
      const ONE_HOUR = 60 * 60 * 1000; // 1 hour
      const timeRemaining = (loginTime + ONE_HOUR) - Date.now();
      
      const kickOut = () => {
        setCurrentUser(null);
        setCurrentSession(null);
        setIsLocked(true);
        setScreenLocked(true);
        setIsAdmin(false);
        localStorage.removeItem('miyamoto_current_user');
        alert('เซสชันของ Operator (หน้าเครื่อง) หมดอายุแล้ว (จำกัดเวลา 1 ชั่วโมง) ระบบได้ทำการออกจากระบบอัตโนมัติ');
        window.location.reload();
      };
      
      if (timeRemaining <= 0) {
        kickOut();
      } else {
        operatorTimeout = setTimeout(() => {
          kickOut();
        }, timeRemaining);
      }
    }
    
    return () => {
      if (operatorTimeout) clearTimeout(operatorTimeout);
    };
  }, [currentUser]);

  const loadData = useCallback(async () => {`;

code = code.replace("  const loadData = useCallback(async () => {", injection);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched Operator Timeout");
