"use client";

import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface NotificationItem {
  id: string;
  read: boolean;
  created_at: string;
  scholarships: {
    id: string;
    title: string;
    country: string;
    field: string;
    degree_level: string;
    deadline: string;
    link: string;
  };
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setNotifications(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function markRead(ids: string[]) {
    setNotifications((prev) =>
      prev.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n))
    );
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
  }

  function handleOpen() {
    setOpen((o) => !o);
    if (!open && unread > 0) {
      const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
      markRead(unreadIds);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-input bg-background shadow-lg"
          >
            <div className="flex items-center justify-between border-b border-input px-4 py-3">
              <span className="text-sm font-medium">Notifications</span>
              {notifications.some((n) => !n.read) && (
                <button
                  onClick={() => markRead(notifications.map((n) => n.id))}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-8 text-center text-xs text-muted-foreground">
                  No notifications yet.
                </p>
              ) : (
                notifications.map((n) => (
                  <a
                    key={n.id}
                    href={n.scholarships.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => !n.read && markRead([n.id])}
                    className={cn(
                      "flex flex-col gap-1 border-b border-input px-4 py-3 text-xs transition-colors hover:bg-accent last:border-0",
                      !n.read && "bg-primary/5"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium leading-snug">{n.scholarships.title}</span>
                      {!n.read && (
                        <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
                    <span className="text-muted-foreground">
                      {n.scholarships.country} · {n.scholarships.field} · {n.scholarships.degree_level}
                    </span>
                    <span className="text-muted-foreground">
                      Deadline: {new Date(n.scholarships.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                    <span className="text-muted-foreground/60">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </span>
                  </a>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
