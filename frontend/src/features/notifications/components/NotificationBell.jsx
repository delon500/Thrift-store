import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import {
  useMarkAllRead,
  useMarkRead,
  useNotifications,
  useUnreadCount,
} from "../hooks/useNotifications";
import { timeAgo } from "../lib/timeAgo";

const TYPE_ACCENT = {
  order_ready: "bg-primary",
  payment_failed: "bg-error",
  registration_approved: "bg-green-500",
};

const NotificationBell = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const { data: unread = 0 } = useUnreadCount();
  const { data, isLoading } = useNotifications({ limit: 8 });
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const notifications = data?.notifications || [];

  // Close the dropdown when clicking outside it.
  useEffect(() => {
    if (!open) return undefined;
    const onClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const handleOpen = (notification) => {
    if (!notification.read_at) markRead.mutate(notification.id);
    setOpen(false);
    if (notification.link) navigate(notification.link);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative cursor-pointer rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface"
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
      >
        <Bell size={20} aria-hidden="true" />
        {unread > 0 ? (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-on-error">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-outline-variant bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-outline-variant px-4 py-3">
            <p className="font-bold text-on-surface">Notifications</p>
            {unread > 0 ? (
              <button
                type="button"
                onClick={() => markAllRead.mutate()}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Mark all read
              </button>
            ) : null}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <p className="px-4 py-6 text-sm text-on-surface-variant">Loading...</p>
            ) : notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-on-surface-variant">
                You're all caught up.
              </p>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleOpen(notification)}
                  className={`flex w-full gap-3 border-b border-outline-variant px-4 py-3 text-left hover:bg-surface-container-low ${
                    notification.read_at ? "" : "bg-surface-container-low"
                  }`}
                >
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      notification.read_at
                        ? "bg-transparent"
                        : TYPE_ACCENT[notification.type] || "bg-primary"
                    }`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-on-surface">
                      {notification.title}
                    </span>
                    {notification.body ? (
                      <span className="mt-0.5 block text-xs text-on-surface-variant line-clamp-2">
                        {notification.body}
                      </span>
                    ) : null}
                    <span className="mt-1 block text-[11px] text-outline">
                      {timeAgo(notification.created_at)}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate("/notifications");
            }}
            className="block w-full border-t border-outline-variant px-4 py-3 text-center text-sm font-semibold text-primary hover:bg-surface-container-low"
          >
            View all
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default NotificationBell;
