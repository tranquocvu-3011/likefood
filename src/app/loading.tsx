"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white/95 backdrop-blur-md z-50 fixed inset-0">
      <div className="text-center flex flex-col items-center justify-center">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-48 h-48 md:w-64 md:h-64 object-contain"
        >
          <source src="/loadtrang.mp4" type="video/mp4" />
        </video>
        <p className="text-slate-600 font-medium tracking-widest uppercase text-sm mt-4 animate-pulse">
          Đang tải dữ liệu...
        </p>
      </div>
    </div>
  );
}
