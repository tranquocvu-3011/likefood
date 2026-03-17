"use client";

/**
 * LIKEFOOD - Contact Launcher
 * Beautiful floating contact buttons with app-like icons and fan-out animation.
 * Positioned on the LEFT side, same horizontal line as ChatbotAI on the RIGHT.
 */

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/* ── SVG Icons (app-authentic style) ─────────────────── */

function ZaloIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-6 w-6" fill="none">
      <rect width="48" height="48" rx="12" fill="#0068FF" />
      <path d="M13 16h11.5l-9 12H28" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M31 16v12" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M35 28a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" stroke="#fff" strokeWidth="2.2" fill="none" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-6 w-6" fill="none">
      <circle cx="24" cy="24" r="22" fill="#25D366" />
      <path d="M34.6 13.4a14.8 14.8 0 0 0-23.5 17.7L10 36l5.1-1.3a14.8 14.8 0 0 0 19.5-19.3Z" fill="#25D366" />
      <path d="M34.6 13.4a14.8 14.8 0 0 0-23.5 17.7L10 36l5.1-1.3a14.8 14.8 0 0 0 19.5-19.3Z" fill="none" stroke="#fff" strokeWidth="1.5" />
      <path d="M20 17.6c-.3-.7-.7-.7-.9-.7h-.8a1.5 1.5 0 0 0-1.1.5c-.4.4-1.4 1.4-1.4 3.4s1.4 3.9 1.6 4.2c.2.2 2.8 4.4 6.8 6 3.4 1.3 4 1 4.7.9s2.3-.9 2.6-1.8.3-1.7.2-1.8c-.1-.2-.4-.3-.8-.5s-2.3-1.1-2.7-1.3-.6-.2-.9.2-.9 1.2-1.2 1.5-.4.3-.8.1a10.4 10.4 0 0 1-4.8-4.2c-.4-.6 0-.7.3-1.3.1-.2.3-.5.4-.7a.8.8 0 0 0 .1-.6c-.1-.2-.9-2.2-1.1-2.9Z" fill="#fff" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-6 w-6" fill="none">
      <circle cx="24" cy="24" r="22" fill="#FF3B30" />
      <path d="M19.5 14.3c-.4-1-1.2-1-1.6-1h-1.2C15.7 13.3 14 15 14 17.8c0 2.6 2 5.3 2.3 5.6.3.4 3.8 6 9.3 8.2 4.5 1.8 5.4 1.4 6.4 1.3s3.2-1.3 3.7-2.6c.4-1.2.4-2.3.3-2.5-.2-.2-.6-.4-1.2-.7s-3.2-1.6-3.7-1.8c-.5-.2-.8-.2-1.2.3-.4.4-1.4 1.7-1.7 2.1-.3.3-.6.4-1.2.1a15.6 15.6 0 0 1-6.5-5.6c-.5-.8.5-.8 1.4-2.5.2-.3.1-.6 0-.8-.1-.2-1.2-2.8-1.6-3.9Z" fill="#fff" />
    </svg>
  );
}

function GmailIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-6 w-6" fill="none">
      <circle cx="24" cy="24" r="22" fill="#EA4335" />
      <rect x="11" y="15" width="26" height="18" rx="2" fill="#fff" />
      <path d="M11 17l13 9 13-9" stroke="#EA4335" strokeWidth="2" strokeLinejoin="round" fill="none" />
      <path d="M11 33l8-6M37 33l-8-6" stroke="#EA4335" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-6 w-6" fill="none">
      <circle cx="24" cy="24" r="22" fill="#2AABEE" />
      <path d="M12.5 23.7l20-8.4c.9-.3 1.7.2 1.4 1.3l-3.4 16c-.2 1-.9 1.2-1.8.8l-5-3.7-2.4 2.3c-.3.3-.5.5-1 .5l.4-5.2 9.2-8.3c.4-.4-.1-.5-.6-.2L18 26l-4.8-1.5c-1-.3-1-.9.3-1.4l-.1.6Z" fill="#fff" />
    </svg>
  );
}

/* ── Contact data ─────────────────────────────────────── */

const CONTACTS = [
  {
    label: "Zalo",
    href: "https://zalo.me/2804992156309691044",
    Icon: ZaloIcon,
    ringColor: "#0068FF",
  },
  {
    label: "WhatsApp",
    href: "https://wa.me/14023158105",
    Icon: WhatsAppIcon,
    ringColor: "#25D366",
  },
  {
    label: "Hotline",
    href: "tel:+14023158105",
    Icon: PhoneIcon,
    ringColor: "#FF3B30",
  },
  {
    label: "Gmail",
    href: "mailto:support@likefood.shop",
    Icon: GmailIcon,
    ringColor: "#EA4335",
  },
  {
    label: "Telegram",
    href: "https://t.me/likefood_support",
    Icon: TelegramIcon,
    ringColor: "#2AABEE",
  },
];

/* ── Component ────────────────────────────────────────── */

export default function ContactLauncher() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setIsVisible(y <= lastScrollY || y < 120);
      setLastScrollY(y);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-contact-launcher]")) {
        setIsOpen(false);
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          data-contact-launcher
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className="fixed z-[95] flex flex-col items-center bottom-[5.5rem] left-3 lg:bottom-6 lg:left-6"
        >
          {/* Expanded Icons — Fan-out animation */}
          <AnimatePresence>
            {isOpen && (
              <motion.div className="flex flex-col-reverse gap-3 mb-3">
                {CONTACTS.map((contact, index) => (
                  <motion.a
                    key={contact.label}
                    href={contact.href}
                    target={contact.href.startsWith("tel:") || contact.href.startsWith("mailto:") ? "_self" : "_blank"}
                    rel="noreferrer"
                    initial={{ opacity: 0, scale: 0.2, y: 30 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      y: 0,
                      transition: {
                        delay: index * 0.06,
                        type: "spring",
                        stiffness: 500,
                        damping: 22,
                      },
                    }}
                    exit={{
                      opacity: 0,
                      scale: 0.2,
                      y: 20,
                      transition: {
                        delay: (CONTACTS.length - 1 - index) * 0.04,
                        duration: 0.15,
                      },
                    }}
                    whileHover={{ scale: 1.18, rotate: 5 }}
                    whileTap={{ scale: 0.88 }}
                    className="relative group"
                    aria-label={contact.label}
                  >
                    {/* Outer ring glow */}
                    <span
                      className="absolute inset-[-3px] rounded-full opacity-40 group-hover:opacity-70 transition-opacity"
                      style={{ 
                        background: `conic-gradient(from 0deg, ${contact.ringColor}66, ${contact.ringColor}22, ${contact.ringColor}66)`,
                      }}
                    />
                    {/* White ring */}
                    <span className="absolute inset-[-2px] rounded-full bg-white shadow-md" />
                    {/* Icon circle */}
                    <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg overflow-hidden">
                      <contact.Icon />
                    </span>
                    {/* Tooltip */}
                    <span className="absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-gray-900/90 px-2.5 py-1 text-xs font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none backdrop-blur-sm">
                      {contact.label}
                    </span>
                  </motion.a>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Toggle Button */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen((prev) => !prev)}
            className="relative flex h-[52px] w-[52px] items-center justify-center rounded-full shadow-xl"
            aria-label={isOpen ? "Đóng liên hệ" : "Mở liên hệ"}
          >
            {/* Ping animation when closed */}
            {!isOpen && (
              <>
                <span className="absolute inset-0 rounded-full animate-ping bg-sky-400/25" />
                <span className="absolute inset-[-2px] rounded-full bg-gradient-to-br from-blue-400 via-cyan-400 to-blue-500 opacity-30 animate-pulse" />
              </>
            )}

            {/* Button background */}
            <span
              className={`absolute inset-0 rounded-full transition-all duration-300 ${
                isOpen
                  ? "bg-gradient-to-br from-red-500 via-orange-500 to-amber-500"
                  : "bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600"
              }`}
            />

            {/* Glossy overlay */}
            <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.35),transparent_55%)]" />

            {/* White ring */}
            <span className="absolute inset-[-2px] rounded-full border-[2.5px] border-white/80" />

            {/* Icon */}
            <motion.span
              className="relative text-white"
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              {isOpen ? (
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              )}
            </motion.span>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
