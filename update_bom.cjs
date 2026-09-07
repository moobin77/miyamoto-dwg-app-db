const fs = require('fs');

let code = fs.readFileSync('src/data/departmentsData.ts', 'utf8');

const bomDept = `  {
    id: 'BOM',
    code: 'BOM',
    name: 'แผนก BOM',
    nameEn: 'Bill of Materials',
    description: 'รายการส่วนประกอบและโครงสร้างชิ้นงาน',
    series: [],
    models: []
  }
];`;

code = code.replace(/];$/, bomDept);
fs.writeFileSync('src/data/departmentsData.ts', code);
