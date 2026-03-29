const fs = require('fs');
const lines = fs.readFileSync('src/components/apps/Photos/PhotosApp.tsx', 'utf-8').split('\n');

const collectionsStart = lines.findIndex(l => l.includes('{/* Apple "Collections" (Bottom Canvas) */}'));
let collectionsEnd = collectionsStart;
let depth = 0;
for (let i = collectionsStart; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('<div')) depth++;
    if (line.includes('</div')) depth--;
    if (depth === 0 && line.includes('</div>')) {
        collectionsEnd = i;
        break;
    }
}
console.log('Collections ends at:', collectionsEnd + 1);
