"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

export default function Loading() {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white fixed inset-0 z-50">
      <div className="flex flex-col items-center justify-center gap-6">
        {/* Logo with subtle pulse */}
        <div className="relative">
          {/* Glow ring behind logo */}
          <div className="absolute inset-0 rounded-full bg-emerald-100/60 blur-2xl scale-125 animate-pulse" />
          <Image
            src="/icon-512.png"
            alt="LIKEFOOD"
            width={120}
            height={120}
            className="relative z-10 drop-shadow-lg"
            priority
          />
        </div>

        {/* Animated dots */}
        <div className="flex items-center justify-center h-6">
          <span className="text-emerald-700 text-2xl font-bold tracking-[0.3em] min-w-[3ch] text-left">
            {dots}
          </span>
        </div>
      </div>
    </div>
  );
}
