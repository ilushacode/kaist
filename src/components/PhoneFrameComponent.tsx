import type { ReactNode } from 'react';
import '../styles/PhoneFrame.css';

interface PhoneFrameProps {
  children: ReactNode;
}

export const PhoneFrame = ({ children }: PhoneFrameProps) => {
  return (
    <div className="phone-frame">
      <div className="phone-frame__blobs" aria-hidden="true">
        <span className="phone-frame__blob phone-frame__blob--1" />
        <span className="phone-frame__blob phone-frame__blob--2" />
        <span className="phone-frame__blob phone-frame__blob--3" />
        <span className="phone-frame__blob phone-frame__blob--4" />
      </div>
      <div className="phone-frame__device">{children}</div>
    </div>
  );
};