const fs = require('fs');
let code = fs.readFileSync('src/components/SecurityGateway.tsx', 'utf8');

// Replace the dangling )}
code = code.replace("              </form>\n            )}", "              </form>");

fs.writeFileSync('src/components/SecurityGateway.tsx', code);
console.log("Fixed syntax error");
