import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#061A3A] relative overflow-hidden overflow-x-hidden font-sans">
      
      {/* Subtle Technical Grid Overlay */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none bg-[linear-gradient(to_right,#04152F_1px,transparent_1px),linear-gradient(to_bottom,#04152F_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40" 
        aria-hidden="true" 
      />

      {/* Primary Blue Brand Glow (Upper-Left) */}
      <div 
        className="absolute -top-[25%] -left-[10%] w-[55%] h-[55%] rounded-full bg-[#075BFF] opacity-[0.12] blur-[150px] pointer-events-none" 
        aria-hidden="true" 
      />

      {/* Teal / Cyan Brand Glow (Lower-Right) */}
      <div 
        className="absolute -bottom-[25%] -right-[10%] w-[50%] h-[50%] rounded-full bg-[#19D3C5] opacity-[0.08] blur-[150px] pointer-events-none" 
        aria-hidden="true" 
      />

      {/* Authentication Content Layer */}
      <div className="relative z-10 w-full flex items-center justify-center">
        {children}
      </div>

    </div>
  );
}