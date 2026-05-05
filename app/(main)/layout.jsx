"use client";

import React from "react";
import { Authenticated } from "convex/react";

const MainLayout = ({ children }) => {
  return (
    <Authenticated>
      <div className="relative isolate min-h-screen pt-28 pb-16">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-[-12rem] top-[-8rem] h-[26rem] w-[26rem] rounded-full bg-primary/12 blur-[140px]" />
          <div className="absolute right-[-10rem] top-[12rem] h-[22rem] w-[22rem] rounded-full bg-cyan-500/10 blur-[140px]" />
          <div className="absolute bottom-[-10rem] left-1/3 h-[24rem] w-[24rem] rounded-full bg-amber-500/8 blur-[140px]" />
        </div>
        <div className="premium-shell">
          <div className="mx-auto max-w-7xl">{children}</div>
        </div>
      </div>
    </Authenticated>
  );
};

export default MainLayout;
