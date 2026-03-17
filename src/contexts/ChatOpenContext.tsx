"use client";

/**
 * LIKEFOOD - Vietnamese Specialty Marketplace
 * Copyright (c) 2026 LIKEFOOD Team
 * Licensed under the MIT License
 * https://github.com/tranquocvu-3011/likefood
 */

import { createContext, useContext, useState, useCallback } from "react";

interface ChatOpenContextValue {
  isChatOpen: boolean;
  setChatOpen: (open: boolean) => void;
}

const ChatOpenContext = createContext<ChatOpenContextValue | null>(null);

export function ChatOpenProvider({ children }: { children: React.ReactNode }) {
  const [isChatOpen, setChatOpenState] = useState(false);
  const setChatOpen = useCallback((open: boolean) => setChatOpenState(open), []);
  return (
    <ChatOpenContext.Provider value={{ isChatOpen, setChatOpen }}>
      {children}
    </ChatOpenContext.Provider>
  );
}

export function useChatOpen() {
  const ctx = useContext(ChatOpenContext);
  return ctx ?? { isChatOpen: false, setChatOpen: () => {} };
}
