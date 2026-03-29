const fs = require('fs');
let code = fs.readFileSync('src/components/apps/Photos/PhotosApp.tsx', 'utf-8');

// I missed adding the file read correctly, let me do the regex correctly

const optionsModalRegex = /\{\/\* iOS Contextual Options Modal \*\/\}\n\s*<AnimatePresence>[\s\S]*?<\/AnimatePresence>/;
code = code.replace(optionsModalRegex, `{/* iOS Contextual Options Modal */}
      <OptionsModal
        showOptionsModal={showOptionsModal}
        setShowOptionsModal={setShowOptionsModal}
        gridColumns={gridColumns}
        setGridColumns={setGridColumns}
        viewFilter={viewFilter}
        setViewFilter={setViewFilter}
        currentBytesUsed={currentBytesUsed}
        storageQuota={storageQuota}
      />`);

const uploadStatusRegex = /<AnimatePresence>[\s\S]*?\{\/\* The Unified Grid \(Top Canvas\) \*\/\}/;
code = code.replace(uploadStatusRegex, `<UploadStatus
            uploading={uploading}
            uploadProgress={uploadProgress}
            errors={errors}
            setErrors={setErrors}
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-white/40 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-sm font-medium">Loading library...</p>
          </div>
        ) : media.length === 0 && !uploading && !justUploaded && Object.keys(uploadProgress).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-6 border border-dashed border-white/10 rounded-3xl bg-zinc-900/30 mx-4 mt-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-white/5">
              <Image className="w-8 h-8 text-white/40" />
            </div>
            <h3 className="text-xl font-bold tracking-tight text-white mb-2">{user ? 'No Photos or Videos' : 'Sign in Required'}</h3>
            <p className="text-sm text-gray-400 mb-6 max-w-[240px]">
              {user ? 'Upload moments to start capturing your historical feed and intelligent collections.' : 'Please sign in to access your secure Cloud library.'}
            </p>
          </div>
        ) : (
          <>
            {/* The Unified Grid (Top Canvas) */}`);

const collectionsRegex = /\{\/\* Apple "Collections" \(Bottom Canvas\) \*\/\}\n\s*<div className="mt-8 px-5 space-y-12 pb-32 border-t border-zinc-900\/50 pt-10">[\s\S]*?<\/div>\n\s*<\/div>\n\s*<\/div>\n\s*<\/>/;
code = code.replace(collectionsRegex, `{/* Apple "Collections" (Bottom Canvas) */}
            <Collections media={media} />
          </>`);

fs.writeFileSync('src/components/apps/Photos/PhotosApp.tsx', code);
