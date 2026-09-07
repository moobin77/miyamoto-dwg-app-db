const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "import { soundEffects } from './services/sound';",
  "import { soundEffects } from './services/sound';\nimport { INITIAL_DEPARTMENTS } from './data/departmentsData';"
);

fs.writeFileSync('src/App.tsx', code);
