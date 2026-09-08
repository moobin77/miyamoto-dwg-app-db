const fs = require('fs');
let code = fs.readFileSync('src/components/SecurityGateway.tsx', 'utf8');

// The activeTab state is no longer needed but we can just leave it as 'LOGIN' always or remove the kiosk pin render block.
// Let's remove the kiosk form
const kioskFormStart = code.indexOf(`{activeTab === 'KIOSK_PIN' && (`);
if (kioskFormStart > -1) {
    const kioskFormEnd = code.indexOf(`</form>\n            )}`, kioskFormStart) + `</form>\n            )}`.length;
    code = code.substring(0, kioskFormStart) + code.substring(kioskFormEnd);
}

fs.writeFileSync('src/components/SecurityGateway.tsx', code);
console.log("Kiosk form removed");
