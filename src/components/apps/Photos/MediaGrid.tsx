import React from 'react';
import { MediaMetadata } from '../../../lib/firebase/media';

// ⚡ Bolt Performance Optimization:
export const MediaGrid = React.memo(({ media, filter, gridColumns, onPhotoClick }: { media: MediaMetadata[], filter: string, gridColumns: number, onPhotoClick: (idx: number) => void }) => {
  // Simulate temporal zoom clustering based on the active pill filter
  const cols = filter === 'years' ? 'grid-cols-1 gap-2' : filter === 'months' ? 'grid-cols-4 gap-0.5' :
               gridColumns === 1 ? 'grid-cols-1 gap-1' :
               gridColumns === 2 ? 'grid-cols-2 gap-1' :
               gridColumns === 3 ? 'grid-cols-3 gap-1' :
               gridColumns === 4 ? 'grid-cols-4 gap-1' : 'grid-cols-5 gap-0.5';

  return (
    <div className={`grid ${cols}`}>
      {media.map((item, idx) => (
        <div
          key={item.id}
          onClick={() => onPhotoClick(idx)}
          className={`bg-zinc-800 overflow-hidden relative group cursor-pointer ${filter === 'years' ? 'aspect-video rounded-3xl' : 'aspect-square rounded-sm'}`}
        >
          <img
            src={item.originalUrl}
            alt="Media"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />

          {/* Faux label for 'years' view */}
          {filter === 'years' && idx % 3 === 0 && (
            <div className="absolute bottom-4 left-4 p-4 pointer-events-none">
              <span className="text-3xl font-bold drop-shadow-lg">{2026 - (idx % 4)}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
});
MediaGrid.displayName = 'MediaGrid';
