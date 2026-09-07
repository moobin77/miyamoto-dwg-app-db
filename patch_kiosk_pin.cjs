const fs = require('fs');
let code = fs.readFileSync('src/components/UserManagementModal.tsx', 'utf8');

const target = `  // Edit Password State
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingPassword, setEditingPassword] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);`;

const replacement = `  // Edit Password State
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingPassword, setEditingPassword] = useState('');

  // Kiosk Pin
  const [kioskPin, setKioskPin] = useState('8899');
  const [isEditingKiosk, setIsEditingKiosk] = useState(false);
  const [newKioskPin, setNewKioskPin] = useState('');
  const [securityConfig, setSecurityConfig] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      loadSecurityConfig();
    }
  }, [isOpen]);

  const loadSecurityConfig = async () => {
    const config = await fetchSecurityConfig();
    setSecurityConfig(config);
    setKioskPin(config.kioskPin || '8899');
    setNewKioskPin(config.kioskPin || '8899');
  };

  const handleUpdateKioskPin = async () => {
    if (!newKioskPin.trim()) return;
    try {
      if (securityConfig) {
         const updated = { ...securityConfig, kioskPin: newKioskPin.trim() };
         await saveSecurityConfig(updated);
         setKioskPin(updated.kioskPin);
         setIsEditingKiosk(false);
      }
    } catch (err: any) {
      alert('เปลี่ยนรหัสผ่าน Operator ล้มเหลว: ' + err.message);
    }
  };`;

code = code.replace(target, replacement);

fs.writeFileSync('src/components/UserManagementModal.tsx', code);
console.log("Patched kiosk pin logic");
