import React from 'react';
import { AppIcon } from './AppIcon';
import { apps, dockApps } from '../../data/apps';

interface DockProps {
  onLaunchApp: (id: string) => void;
}

export function Dock({ onLaunchApp }: DockProps) {
  const dockItems = dockApps.map(id => apps.find(a => a.id === id)!).filter(Boolean);

  return (
    <div className="absolute bottom-5 left-4 right-4 z-40 max-w-[420px] mx-auto">
      <div className="flex items-center justify-between px-5 py-4 rounded-[36px] bg-white/[0.12] backdrop-blur-[40px] border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
        {dockItems.map(app => (
          <AppIcon
            key={app.id}
            name={app.name}
            icon={app.icon}
            color={app.color}
            badge={app.badge}
            onClick={() => onLaunchApp(app.id)}
            showLabel={false}
          />
        ))}
      </div>
    </div>
  );
}
