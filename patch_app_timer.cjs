const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetEffect = `  // 1-Hour hard limit for Operators
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
  }, [currentUser]);`;

const replacementEffect = `  const [operatorTimeRemaining, setOperatorTimeRemaining] = useState<number | null>(null);

  // 1-Hour hard limit for Operators
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (currentUser && currentUser.role === 'OPERATOR') {
      const loginTime = currentUser.loggedInAt ? new Date(currentUser.loggedInAt).getTime() : Date.now();
      const ONE_HOUR = 60 * 60 * 1000; // 1 hour
      
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
      
      const updateTimer = () => {
        const remaining = (loginTime + ONE_HOUR) - Date.now();
        if (remaining <= 0) {
           kickOut();
           setOperatorTimeRemaining(0);
        } else {
           setOperatorTimeRemaining(remaining);
        }
      };

      updateTimer();
      interval = setInterval(updateTimer, 1000);
    } else {
       setOperatorTimeRemaining(null);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentUser]);`;

code = code.replace(targetEffect, replacementEffect);

const headerTarget = `          <div className="text-right hidden md:block">
            <p className="text-[0.7rem] font-bold">{currentUser.displayName}</p>
            <button onClick={handleLogout} className="text-[0.6rem] text-[#3b82f6] hover:underline">
              {currentUser.role} • Sign Out
            </button>
          </div>`;

const headerReplacement = `          <div className="text-right hidden md:block">
            <p className="text-[0.7rem] font-bold">{currentUser.displayName}</p>
            <button onClick={handleLogout} className="text-[0.6rem] text-[#3b82f6] hover:underline">
              {currentUser.role} • Sign Out
            </button>
          </div>
          
          {operatorTimeRemaining !== null && (
            <div className={\`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-colors \${operatorTimeRemaining < 300000 ? 'bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse' : 'bg-slate-800 text-slate-300 border border-slate-700'}\`}>
              <span className="text-[10px] uppercase tracking-wider opacity-70">หมดเวลาใน</span>
              <span>
                {Math.floor(operatorTimeRemaining / 1000 / 60).toString().padStart(2, '0')}:
                {(Math.floor(operatorTimeRemaining / 1000) % 60).toString().padStart(2, '0')}
              </span>
            </div>
          )}`;

code = code.replace(headerTarget, headerReplacement);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched App.tsx with Operator Timer");
