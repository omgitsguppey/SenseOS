export function Wallpaper() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-[#1a1a1c]">
      {/* Muted, atmospheric wallpaper inspired by the reference */}
      <div className="absolute top-[10%] left-[-10%] w-[90%] h-[90%] rounded-full bg-purple-900/15 blur-[120px] mix-blend-screen" />
      <div className="absolute bottom-[20%] right-[-20%] w-[100%] h-[100%] rounded-full bg-indigo-900/10 blur-[150px] mix-blend-screen" />
      <div className="absolute top-[40%] right-[10%] w-[70%] h-[70%] rounded-full bg-slate-800/20 blur-[100px] mix-blend-screen" />
      
      {/* Grain/Texture overlay for that premium feel */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      
      <div className="absolute inset-0 bg-black/10 backdrop-blur-[80px]" />
    </div>
  );
}
