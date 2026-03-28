import React, { useState, useEffect } from 'react';
import { Battery, Signal, Navigation } from 'lucide-react';

export function StatusBar() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute top-0 left-0 right-0 h-12 z-50 flex items-center justify-between px-6 text-white pointer-events-none">
      {/* Left: Time */}
      <div className="flex-1 flex justify-start items-center space-x-1.5">
        <span className="text-[15px] font-bold tracking-tight">
          {time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).replace(/\s?[AP]M/i, '')}
        </span>
        <Navigation className="w-3 h-3 fill-white opacity-90 -rotate-45" strokeWidth={0} />
      </div>

      {/* Right: Status Icons */}
      <div className="flex-1 flex justify-end items-center space-x-1.5">
        <Signal className="w-[17px] h-[17px]" strokeWidth={2.5} />
        <span className="text-[12px] font-bold tracking-tighter">5G+</span>
        <div className="relative flex items-center">
          <Battery className="w-[24px] h-[24px] opacity-90" strokeWidth={1.5} />
          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black mt-[1px] mr-[2px]">13</span>
        </div>
      </div>
    </div>
  );
}
