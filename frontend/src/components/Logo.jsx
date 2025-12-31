import React from 'react';

const Logo = ({ variant = 'default', className = '', height = 40 }) => {
  if (variant === 'icon') {
    return (
      <img
        src="/images/3dddplus_RGB_PNGSmall.png"
        alt="3D Plus"
        className={`object-contain ${className}`}
        style={{ height: `${height}px` }}
      />
    );
  }

  return (
    <div className={`flex items-center ${className}`}>
      <img
        src="/images/3dddplus_RGB_PNGSmall.png"
        alt="3D Plus - AI Image Editor"
        className="object-contain"
        style={{ height: `${height}px` }}
      />
    </div>
  );
};

export default Logo;
