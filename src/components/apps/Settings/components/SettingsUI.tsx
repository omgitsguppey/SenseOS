import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { TrackingEngine } from '../../../../lib/os/Biome';

interface SettingsListProps {
  title?: string;
  footer?: string;
  children: React.ReactNode;
}

export function SettingsList({ title, footer, children }: SettingsListProps) {
  return (
    <div className="mb-6 w-full">
      {title && (
        <h3 className="px-4 mb-1.5 text-[13px] font-medium text-white/50 uppercase tracking-wide">
          {title}
        </h3>
      )}
      <div className="bg-[#1C1C1E] rounded-[10px] overflow-hidden">
        {React.Children.map(children, (child, index) => {
          if (!child) return null;
          return (
            <React.Fragment key={index}>
              {child}
              {index < React.Children.count(children) - 1 && (
                <div className="h-[0.5px] bg-white/[0.15] ml-[60px]" />
              )}
            </React.Fragment>
          );
        })}
      </div>
      {footer && (
        <p className="px-4 mt-2 text-[13px] text-white/40 leading-snug">
          {footer}
        </p>
      )}
    </div>
  );
}

interface SettingsRowProps {
  icon?: React.ReactNode;
  iconBg?: string;
  label: string;
  value?: string | React.ReactNode;
  onClick?: () => void;
  showChevron?: boolean;
  destructive?: boolean;
}

export function SettingsRow({ icon, iconBg = 'bg-blue-500', label, value, onClick, showChevron = false, destructive = false }: SettingsRowProps) {
  const isClickable = !!onClick;

  const handleClick = () => {
    if (onClick) {
      TrackingEngine.track('settings_row_click', 'settings', 'unknown', { label });
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <motion.div
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      whileTap={isClickable ? { backgroundColor: 'rgba(255,255,255,0.1)' } : {}}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`flex items-center min-h-[44px] px-4 py-2.5 ${isClickable ? 'cursor-pointer focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 focus-visible:outline-none' : ''}`}
    >
      {icon && (
        <div aria-hidden="true" className={`w-[28px] h-[28px] rounded-[6px] ${iconBg} flex items-center justify-center mr-4 flex-shrink-0`}>
          {icon}
        </div>
      )}
      <div className={`flex-1 text-[17px] tracking-tight ${destructive ? 'text-[#FF3B30]' : 'text-white'}`}>
        {label}
      </div>
      <div className="flex items-center space-x-2 ml-2">
        {value && (
          <span className="text-[17px] tracking-tight text-white/50">{value}</span>
        )}
        {showChevron && (
          <ChevronRight className="w-5 h-5 text-white/30" strokeWidth={2} />
        )}
      </div>
    </motion.div>
  );
}

interface SettingsToggleProps {
  icon?: React.ReactNode;
  iconBg?: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function SettingsToggle({ icon, iconBg, label, checked, onChange }: SettingsToggleProps) {
  const handleToggle = () => {
    TrackingEngine.track('settings_row_click', 'settings', 'unknown', { label, action: 'toggle', newValue: !checked });
    onChange(!checked);
  };

  return (
    <div className="flex items-center min-h-[44px] px-4 py-2.5">
      {icon && (
        <div aria-hidden="true" className={`w-[28px] h-[28px] rounded-[6px] ${iconBg} flex items-center justify-center mr-4 flex-shrink-0`}>
          {icon}
        </div>
      )}
      <div className="flex-1 text-[17px] tracking-tight text-white">
        {label}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={handleToggle}
        className={`w-[51px] h-[31px] rounded-full p-[2px] transition-colors duration-300 ease-in-out ml-2 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${
          checked ? 'bg-[#34C759]' : 'bg-[#39393D]'
        }`}
      >
        <motion.div
          animate={{ x: checked ? 20 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="w-[27px] h-[27px] bg-white rounded-full shadow-sm"
        />
      </button>
    </div>
  );
}
