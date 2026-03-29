import React from 'react';
import { Heart, Folder, Calendar, MapPin } from 'lucide-react';
import { MediaMetadata } from '../../../lib/firebase/media';

export interface CollectionsProps {
  media: MediaMetadata[];
}

export const Collections: React.FC<CollectionsProps> = ({ media }) => {
  return (
    <div className="mt-8 px-5 space-y-12 pb-32 border-t border-zinc-900/50 pt-10">

      {/* Memory Carousel / Recent Days */}
      <div className="space-y-5">
        <div className="flex justify-between items-end">
          <div>
            <h3 className="text-2xl font-bold tracking-tight">Recent Days</h3>
            <p className="text-gray-400 text-sm mt-0.5">April & March 2026</p>
          </div>
          <button className="text-blue-500 text-sm font-medium">See All</button>
        </div>

        <div className="flex overflow-x-auto no-scrollbar space-x-3 pb-4 snap-x">
          {media.slice(0, 6).map((item, idx) => (
            <div key={item.id} className="relative w-48 h-64 shrink-0 snap-center rounded-2xl overflow-hidden group border border-white/5">
              <img src={item.originalUrl} alt="recent" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-4">
                <span className="text-sm font-semibold tracking-wide drop-shadow-md">Photo {idx + 1}</span>
              </div>
            </div>
          ))}
          {media.length < 3 && (
            <div className="w-48 h-64 shrink-0 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-center">
               <p className="text-xs text-zinc-500 font-medium tracking-wide uppercase">More Needed</p>
            </div>
          )}
        </div>
      </div>

      {/* Pinned Collections */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold tracking-tight mb-2">Pinned Collections</h3>
        <div className="grid grid-cols-2 gap-3">
          <button className="bg-zinc-900/80 rounded-[22px] p-5 flex flex-col items-start space-y-3 hover:bg-zinc-800 transition-colors">
            <Heart className="w-6 h-6 text-red-500" fill="currentColor" />
            <span className="font-semibold racking-tight">Favorites</span>
          </button>
          <button className="bg-zinc-900/80 rounded-[22px] p-5 flex flex-col items-start space-y-3 hover:bg-zinc-800 transition-colors">
            <Folder className="w-6 h-6 text-blue-500" fill="currentColor"/>
            <span className="font-semibold tracking-tight">Saved</span>
          </button>
          <button className="bg-zinc-900/80 rounded-[22px] p-5 flex flex-col items-start space-y-3 hover:bg-zinc-800 transition-colors">
            <MapPin className="w-6 h-6 text-green-500" />
            <span className="font-semibold tracking-tight">Places</span>
          </button>
          <button className="bg-zinc-900/80 rounded-[22px] p-5 flex flex-col items-start space-y-3 hover:bg-zinc-800 transition-colors">
            <Calendar className="w-6 h-6 text-orange-500" />
            <span className="font-semibold tracking-tight">Events</span>
          </button>
        </div>
      </div>

    </div>
  );
};
