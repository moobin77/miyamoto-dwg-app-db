const fs = require('fs');
let code = fs.readFileSync('src/components/DrawingViewer.tsx', 'utf8');

const target = `<TechnicalBlueprint
              drawing={drawing}
              activeVersion={activeVersion}
              showDiff={false}
              theme={theme}
              selectedDimId={null}
            />
            {(!drawing.attachedFiles || drawing.attachedFiles.length === 0) && isAdmin && (`;

const replacement = `<>
            <TechnicalBlueprint
              drawing={drawing}
              activeVersion={activeVersion}
              showDiff={false}
              theme={theme}
              selectedDimId={null}
            />
            {(!drawing.attachedFiles || drawing.attachedFiles.length === 0) && isAdmin && (`;

code = code.replace(target, replacement);

const targetEnd = `                  )}
                </div>
              </div>
            )}`;

const replacementEnd = `                  )}
                </div>
              </div>
            )}
            </>`;

code = code.replace(targetEnd, replacementEnd);

fs.writeFileSync('src/components/DrawingViewer.tsx', code);
console.log("Fixed JSX syntax in DrawingViewer");
