"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MobileMenuProps {
  isLoggedIn: boolean;
}

export default function MobileMenu({ isLoggedIn }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative md:hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        aria-label="Toggle menu"
      >
        {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-input bg-background shadow-lg"
          >
            {isLoggedIn ? (
              <>
                <Link
                  href="/preferences"
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  Preferences
                </Link>
                <div className="h-px bg-border" />
                <form action="/api/auth/signout" method="POST">
                  <button
                    type="submit"
                    className="flex w-full items-center px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex w-full items-center px-4 py-3 text-sm font-medium transition-colors hover:bg-accent"
              >
                Sign in
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
