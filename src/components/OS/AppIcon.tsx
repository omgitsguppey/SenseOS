import React from 'react';
import { motion } from 'motion/react';

interface AppIconProps {
  key?: React.Key;
  name: string;
  icon: React.ElementType;
  color: string;
  onClick: () => void;
  showLabel?: boolean;
  badge?: number;
}

export function AppIcon({ name, icon: Icon, color, onClick, showLabel = true, badge }: AppIconProps) {
  return (
    <div className="flex flex-col items-center justify-start w-[76px] gap-1.5 relative">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.92 }}
        transition={{ type: 'spring', damping: 25, stiffness: 400 }}
        onClick={onClick}
        className={`w-[62px] h-[62px] rounded-[16px] bg-gradient-to-b ${color} shadow-[0_2px_8px_rgba(0,0,0,0.3)] flex items-center justify-center relative overflow-hidden group`}
      >
        {/* Subtle inner gloss/border */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/25 to-transparent opacity-30" />
        <div className="absolute inset-0 border border-white/10 rounded-[16px]" />
        
        <Icon className="w-8 h-8 text-white drop-shadow-sm" strokeWidth={1.5} />
      </motion.button>

      {/* Badge */}
      {badge !== undefined && badge > 0 && (
        <div className="absolute top-[-4px] right-[2px] bg-[#FF3B30] text-white text-[13px] font-semibold px-1.5 min-w-[22px] h-[22px] rounded-full flex items-center justify-center border-2 border-[#1C1C1E] shadow-sm z-10 pointer-events-none">
          {badge}
        </div>
      )}

      {showLabel && (
        <span className="text-[11px] font-medium text-white/95 tracking-tight text-center leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] line-clamp-1 w-full px-0.5">
          {name}
        </span>
      )}
    </div>
  );
}
