import { Loader2 } from 'lucide-react';
import type { CSSProperties } from 'react';

interface LoaderProps {
  size?: number;
  color?: string;
  stroke?: number;
  text?: string;
  fullscreen?: boolean;
  style?: CSSProperties;
}

export default function Loader({
  size = 32,
  color = 'currentColor',
  stroke = 2,
  text,
  fullscreen = false,
  style = {},
}: LoaderProps) {
  const content = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        ...style,
      }}
    >
      <Loader2
        size={size}
        color={color}
        strokeWidth={stroke}
        style={{ animation: 'loader-spin 1s linear infinite' }}
      />
      {text && <span style={{ fontSize: 14, color, opacity: 0.8 }}>{text}</span>}
    </div>
  );

  if (fullscreen) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255,255,255,0.6)',
          zIndex: 9999,
        }}
      >
        {content}
      </div>
    );
  }

  return content;
}