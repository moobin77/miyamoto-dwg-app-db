const fs = require('fs');
let code = fs.readFileSync('src/components/AddModelModal.tsx', 'utf8');

const regex1 = /\{\/\* Blueprint schematic type & Initial Length \*\/\}(.|\n)*?<\/div>\s*<\/div>\s*<\/div>/m;
code = code.replace(regex1, '');

const regex2 = /<div>\s*<label className="block text-xs font-semibold text-slate-300 mb-1\.5">\s*เครื่องจักรหลักที่ผลิต \(Primary Machine\)\s*<\/label>(.|\n)*?<\/div>/m;
code = code.replace(regex2, '');

fs.writeFileSync('src/components/AddModelModal.tsx', code);
console.log("Patched correctly");
