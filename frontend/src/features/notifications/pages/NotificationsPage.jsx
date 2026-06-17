import { useNavigate } from "react-router-dom";
import {
  useMarkAllRead,
  useMarkRead,
  useNotifications,
} from "../hooks/useNotifications";
import { timeAgo } from "../lib/timeAgo";

const TYPE_ACCENT = {
  order_ready: "bg-teal-500",
  payment_failed: "bg-red-500",
  registration_approved: "bg-green-500",
};

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useNotifications();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const notifications = data?.notifications || [];
  const unread = data?.unread || 0;

  const handleOpen = (notification) => {
    if (!notification.read_at) markRead.mutate(notification.id);
    if (notification.link) navigate(notification.link);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-teal-600">Notifications</h1>
        {unread > 0 ? (
          <button
            type="button"
            onClick={() => markAllRead.mutate()}
            className="text-sm font-semibold text-teal-600 hover:underline"
          >
            Mark all read
          </button>
        ) : null}
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {isLoading ? (
          <p className="px-4 py-8 text-gray-500">Loading...</p>
        ) : notifications.length === 0 ? (
          <p className="px-4 py-10 text-center text-gray-500">
            You have no notifications yet.
          </p>
        ) : (
          notifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => handleOpen(notification)}
              className={`flex w-full gap-3 border-b border-gray-100 px-4 py-4 text-left hover:bg-gray-50 ${
                notification.read_at ? "" : "bg-teal-50/40"
              }`}
            >
              <span
                className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                  notification.read_at
                    ? "bg-transparent"
                    : TYPE_ACCENT[notification.type] || "bg-teal-500"
                }`}
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-gray-800">
                    {notification.title}
                  </span>
                  <span className="shrink-0 text-xs text-gray-400">
                    {timeAgo(notification.created_at)}
                  </span>
                </span>
                {notification.body ? (
                  <span className="mt-1 block text-sm text-gray-500">
                    {notification.body}
                  </span>
                ) : null}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
