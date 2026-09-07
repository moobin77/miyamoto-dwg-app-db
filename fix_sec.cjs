const fs = require('fs');
let code = fs.readFileSync('src/components/SecurityGateway.tsx', 'utf8');

code = code.replace(
  "    if (!pinInput.trim()) return;\n    try {\n      setIsVerifying(true);",
  "    if (!pinInput.trim()) return;\n    if (!nameInput.trim()) {\n      setErrorMessage('กรุณาระบุชื่อช่าง');\n      return;\n    }\n    try {\n      setIsVerifying(true);"
);
fs.writeFileSync('src/components/SecurityGateway.tsx', code);
console.log("Fixed SecurityGateway");
