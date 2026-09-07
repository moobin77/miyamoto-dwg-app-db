const fs = require('fs');
let code = fs.readFileSync('src/components/DrawingViewer.tsx', 'utf8');
code = code.replace(
  /<TechnicalBlueprint[\s\S]*?\/>/,
  `<TechnicalBlueprint
                    drawing={drawing}
                    activeVersion={activeVersion}
                    showDiff={false}
                    theme={theme}
                    selectedDimId={null}
                  />`
);
fs.writeFileSync('src/components/DrawingViewer.tsx', code);
