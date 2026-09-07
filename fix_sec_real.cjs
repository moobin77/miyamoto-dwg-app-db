const fs = require('fs');
let code = fs.readFileSync('src/components/SecurityGateway.tsx', 'utf8');

const target = `  const handleKioskPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) return;
    try {
      setIsVerifying(true);`;

const replacement = `  const handleKioskPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) return;
    if (!nameInput.trim()) {
      setErrorMessage('กรุณาระบุชื่อช่าง (Operator Name)');
      return;
    }
    try {
      setIsVerifying(true);`;

code = code.replace(target, replacement);

fs.writeFileSync('src/components/SecurityGateway.tsx', code);
console.log("Fixed SecurityGateway real");
