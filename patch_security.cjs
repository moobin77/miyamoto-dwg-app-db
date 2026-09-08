const fs = require('fs');
let code = fs.readFileSync('src/components/SecurityGateway.tsx', 'utf8');

// Remove the tabs div
const tabNavRegex = /<div className="flex border-b border-slate-800">[\s\S]*?<\/div>/;
code = code.replace(tabNavRegex, '');

// Remove {activeTab === 'LOGIN' && (
code = code.replace("{activeTab === 'LOGIN' && (", "");

// Remove the closing )} of LOGIN form and the whole KIOSK_PIN form
const kioskSectionRegex = /}\)\s*\{activeTab === 'KIOSK_PIN' && \([\s\S]*?<\/form>\s*}\)/;
code = code.replace(kioskSectionRegex, "");

// Clean up placeholders in the login form
code = code.replace('placeholder="เช่น admin"', 'placeholder="Username"');

fs.writeFileSync('src/components/SecurityGateway.tsx', code);
console.log("Patched SecurityGateway.tsx");
