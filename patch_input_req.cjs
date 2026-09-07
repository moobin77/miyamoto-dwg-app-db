const fs = require('fs');
let code = fs.readFileSync('src/components/SecurityGateway.tsx', 'utf8');

code = code.replace(
  "                      value={nameInput}\n                      onChange={(e) => setNameInput(e.target.value)}",
  "                      value={nameInput}\n                      onChange={(e) => setNameInput(e.target.value)}\n                      required"
);

fs.writeFileSync('src/components/SecurityGateway.tsx', code);
console.log("Added required to nameInput");
