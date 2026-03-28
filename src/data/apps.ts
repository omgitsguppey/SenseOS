import {
  ShoppingBag,
  Wand2,
  Music,
  Store,
  Lightbulb,
  Key,
  Link,
  Subtitles,
  Sparkles,
  TrendingUp,
  Zap,
  Terminal,
  Palette,
  Flame,
  ListMusic,
  RefreshCw,
  Settings,
  Image
} from 'lucide-react';

export const apps = [
  { id: 'just-sell-it', name: 'Just Sell It', icon: ShoppingBag, color: 'from-emerald-400 to-emerald-600' },
  { id: 'markup-ai', name: 'MarkupAI', icon: Wand2, color: 'from-blue-400 to-blue-600' },
  { id: 'lyrics-albums-ai', name: 'Lyrics & Albums AI', icon: Music, color: 'from-purple-400 to-purple-600' },
  { id: 'app-store', name: 'App Store', icon: Store, color: 'from-blue-500 to-indigo-600', badge: 2 },
  { id: 'tips', name: 'Tips', icon: Lightbulb, color: 'from-yellow-400 to-orange-500' },
  { id: 'passwords', name: 'Passwords', icon: Key, color: 'from-slate-400 to-slate-600' },
  { id: 'link-flipper', name: 'Link Flipper', icon: Link, color: 'from-cyan-400 to-blue-500' },
  { id: 'captions-ai', name: 'CaptionsAI', icon: Subtitles, color: 'from-pink-400 to-rose-600' },
  { id: 'content-ai', name: 'ContentAI', icon: Sparkles, color: 'from-violet-400 to-fuchsia-600' },
  { id: 'get-famous', name: 'Get Famous', icon: TrendingUp, color: 'from-amber-400 to-orange-600' },
  { id: 'priority-ai', name: 'PriorityAI', icon: Zap, color: 'from-red-400 to-red-600' },
  { id: 'operator', name: 'Operator', icon: Terminal, color: 'from-zinc-700 to-zinc-900', badge: 15 },
  { id: 'brandkit-ai', name: 'BrandKitAI', icon: Palette, color: 'from-fuchsia-500 to-pink-600' },
  { id: 'nsfw-ai', name: 'NSFWAI', icon: Flame, color: 'from-rose-500 to-red-700' },
  { id: 'playlist-ai', name: 'PlaylistAI', icon: ListMusic, color: 'from-indigo-400 to-cyan-500' },
  { id: 'convert-ai', name: 'ConvertAI', icon: RefreshCw, color: 'from-teal-400 to-emerald-500' },
  { id: 'photos', name: 'Photos', icon: Image, color: 'from-red-400 to-orange-500' },
  { id: 'settings', name: 'Settings', icon: Settings, color: 'from-gray-500 to-gray-700', badge: 1 },
];

export const dockApps = ['app-store', 'operator', 'passwords', 'settings'];
