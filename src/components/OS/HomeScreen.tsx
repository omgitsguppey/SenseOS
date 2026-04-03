import React, { useState, useRef } from 'react';
import { Search } from 'lucide-react';
import { AppIcon } from './AppIcon';
import { Dock } from './Dock';
import { apps, dockApps } from '../../data/apps';
import { motion, AnimatePresence, PanInfo } from 'motion/react';

interface HomeScreenProps {
  key?: React.Key;
  onLaunchApp: (id: string) => void;
}

export function HomeScreen({ onLaunchApp }: HomeScreenProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const swipeTimeout = useRef<NodeJS.Timeout | null>(null);

  // ⚡ Bolt: Memoize grid layout computation to prevent O(N) recalculations
  // and array allocations on every swipe animation frame
  const { pages, totalPages } = React.useMemo(() => {
    const gridApps = apps.filter(app => !dockApps.includes(app.id));
    const ITEMS_PER_PAGE = 24;
    const computedPages = [];

    for (let i = 0; i < gridApps.length; i += ITEMS_PER_PAGE) {
      computedPages.push(gridApps.slice(i, i + ITEMS_PER_PAGE));
    }

    return {
      pages: computedPages,
      totalPages: Math.max(computedPages.length, 2) // Force at least 2 pages for UI
    };
  }, []);

  const handleDragStart = () => {
    setIsSwiping(true);
    if (swipeTimeout.current) clearTimeout(swipeTimeout.current);
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    
    if (offset < -50 || velocity < -500) {
      if (currentPage < totalPages - 1) setCurrentPage(p => p + 1);
    } else if (offset > 50 || velocity > 500) {
      if (currentPage > 0) setCurrentPage(p => p - 1);
    }
    
    swipeTimeout.current = setTimeout(() => {
      setIsSwiping(false);
    }, 1200);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute inset-0 z-10 flex flex-col overflow-hidden"
    >
      {/* App Grid - Swipeable */}
      <div className="absolute top-14 bottom-[160px] left-0 right-0">
        <motion.div 
          className="flex w-full h-full"
          drag="x"
          dragDirectionLock
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          animate={{ x: `-${currentPage * 100}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {Array.from({ length: totalPages }).map((_, pageIndex) => (
            <div key={pageIndex} className="w-full h-full flex-shrink-0 px-5">
              <div className="grid grid-cols-4 gap-x-2 gap-y-6 justify-items-center max-w-[390px] mx-auto content-start h-full">
                {pages[pageIndex]?.map(app => (
                  <AppIcon
                    key={app.id}
                    name={app.name}
                    icon={app.icon}
                    color={app.color}
                    badge={app.badge}
                    onClick={() => onLaunchApp(app.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Search Pill / Pagination Dots */}
      <div className="absolute bottom-[125px] left-1/2 -translate-x-1/2 z-30 h-8 flex items-center justify-center">
        <motion.button 
          layout
          className="flex items-center justify-center bg-white/[0.15] backdrop-blur-xl border border-white/[0.08] shadow-sm rounded-full h-8 px-4"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          <AnimatePresence mode="wait">
            {isSwiping ? (
              <motion.div 
                key="dots"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                className="flex space-x-2 items-center h-full"
              >
                {Array.from({ length: totalPages }).map((_, i) => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${i === currentPage ? 'bg-white' : 'bg-white/40'}`} />
                ))}
              </motion.div>
            ) : (
              <motion.div 
                key="search"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                className="flex items-center space-x-1.5 h-full whitespace-nowrap"
              >
                <Search className="w-3.5 h-3.5 opacity-80 text-white" strokeWidth={2.5} />
                <span className="text-[13px] font-medium tracking-tight text-white/90">Search</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      <Dock onLaunchApp={onLaunchApp} />
    </motion.div>
  );
}
