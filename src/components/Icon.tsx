import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

// Bộ icon SVG (port từ prototype). Lucide-style stroke. Thêm case mới khi cần.
export function Icon({ name, size = 20, color = '#2E2A3F', stroke = 2.4, fill }) {
  const box = { width: size, height: size, viewBox: '0 0 24 24' };
  const p = { fill: 'none', stroke: color, strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'droplet': return <Svg {...box}><Path {...p} d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5S12.5 5.5 12 3c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" /></Svg>;
    case 'dumbbell': return <Svg {...box}><Path {...p} d="M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11" /></Svg>;
    case 'book': return <Svg {...box}><Path {...p} d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5z" /><Path {...p} d="M4 19.5A2.5 2.5 0 0 1 6.5 22H20" /></Svg>;
    case 'flame': return <Svg {...box}><Path {...p} d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></Svg>;
    case 'flamefill': return <Svg {...box}><Path fill={color} d="M12 2c1 3.5 3.2 5 4.5 7 1 1.6 1.5 3.2 1.5 5a6 6 0 1 1-12 0c0-1.2.4-2.4 1-3.3.3 1.2 1 1.8 2 2a3 3 0 0 0 1-4C9 9 10.5 5 12 2z" /></Svg>;
    case 'heart': return <Svg {...box}><Path {...p} d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7z" /></Svg>;
    case 'heartfill': return <Svg {...box}><Path fill={color} d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7z" /></Svg>;
    case 'check': return <Svg {...box}><Path {...p} d="M20 6 9 17l-5-5" /></Svg>;
    case 'refresh': return <Svg {...box}><Path {...p} d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" /></Svg>;
    case 'clock': return <Svg {...box}><Circle {...p} cx="12" cy="12" r="9" /><Path {...p} d="M12 7v5l3 2" /></Svg>;
    case 'eye': return <Svg {...box}><Path {...p} d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><Circle {...p} cx="12" cy="12" r="3" /></Svg>;
    case 'gift': return <Svg {...box}><Rect {...p} x="3" y="8" width="18" height="4" rx="1" /><Path {...p} d="M12 8v13M19 12v9H5v-9" /><Path {...p} d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8" /><Path {...p} d="M16.5 8a2.5 2.5 0 0 0 0-5C13 3 12 8 12 8" /></Svg>;
    case 'sparkles': return <Svg {...box}><Path {...p} d="M9.5 3l1.6 4L15 8.5l-3.9 1.6L9.5 14l-1.6-3.9L4 8.5l3.9-1.5zM18 13l.9 2.3 2.1.8-2.1.8L18 19l-.9-2.1-2.1-.8 2.1-.8z" /></Svg>;
    case 'star': return <Svg {...box}><Path fill={color} d="M12 2.5l2.6 5.5 6 .7-4.5 4.2 1.2 6-5.3-3-5.3 3 1.2-6L3.4 8.7l6-.7z" /></Svg>;
    case 'home': return <Svg {...box}><Path {...p} d="M3 11.5 12 4l9 7.5" /><Path {...p} d="M5 10v10h14V10" /></Svg>;
    case 'calendar': return <Svg {...box}><Rect {...p} x="3.5" y="5" width="17" height="16" rx="3" /><Path {...p} d="M3.5 9.5h17M8 3v4M16 3v4" /></Svg>;
    case 'bag': return <Svg {...box}><Path {...p} d="M6 8h12l-1 12H7z" /><Path {...p} d="M9 8a3 3 0 0 1 6 0" /></Svg>;
    case 'user': return <Svg {...box}><Circle {...p} cx="12" cy="8" r="4" /><Path {...p} d="M4 21c0-4 3.5-6 8-6s8 2 8 6" /></Svg>;
    case 'plus': return <Svg {...box}><Path {...p} d="M12 5v14M5 12h14" /></Svg>;
    case 'back': return <Svg {...box}><Path {...p} d="M15 6l-6 6 6 6" /></Svg>;
    default: return null;
  }
}
