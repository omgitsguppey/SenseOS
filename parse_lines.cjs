const fs = require('fs');
const lines = fs.readFileSync('src/components/apps/Photos/PhotosApp.tsx', 'utf-8').split('\n');

const mediaGridStart = lines.findIndex(l => l.includes('const MediaGrid = React.memo'));
console.log('MediaGrid starts at:', mediaGridStart + 1);
const mediaGridEnd = lines.findIndex(l => l.includes('MediaGrid.displayName = '));
console.log('MediaGrid ends at:', mediaGridEnd + 1);

const optionsModalStart = lines.findIndex(l => l.includes('{/* iOS Contextual Options Modal */}'));
console.log('OptionsModal starts at:', optionsModalStart + 1);
const optionsModalEnd = lines.findIndex((l, i) => i > optionsModalStart && l.includes('</AnimatePresence>'));
console.log('OptionsModal ends at:', optionsModalEnd + 1);

const uploadSystemStart = lines.findIndex(l => l.includes('{/* Upload System UI */}'));
console.log('UploadStatus starts at:', uploadSystemStart + 1);
const uploadSystemEnd = lines.findIndex((l, i) => i > uploadSystemStart && l.includes('</AnimatePresence>'));
console.log('UploadStatus ends at:', uploadSystemEnd + 1);

const collectionsStart = lines.findIndex(l => l.includes('{/* Apple "Collections" (Bottom Canvas) */}'));
console.log('Collections starts at:', collectionsStart + 1);
