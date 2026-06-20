import { useState, useEffect, useCallback } from "react";
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationAsRead,
} from "../api/notificationApi.js";

export function useNavbarNotifications(active) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!active) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const refreshCount = () => {
      fetchUnreadNotificationCount().then((res) => {
        if (res.success) setUnreadCount(res.count ?? 0);
      });
    };

    refreshCount();
    const interval = setInterval(refreshCount, 60000);
    return () => clearInterval(interval);
  }, [active]);

  const loadNotifications = useCallback(() => {
    if (!active) return;
    fetchNotifications().then((res) => {
      if (res.success) {
        setNotifications(res.notifications);
        setUnreadCount(res.notifications.filter((n) => !n.isRead).length);
      }
    });
  }, [active]);

  const handleMarkAllRead = useCallback(() => {
    markAllNotificationsRead().then((res) => {
      if (res.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    });
  }, []);

  const handleMarkOneRead = useCallback((id) => {
    markNotificationAsRead(id).then((res) => {
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((count) => Math.max(0, count - 1));
      }
    });
  }, []);

  return {
    notifications,
    unreadCount,
    loadNotifications,
    handleMarkAllRead,
    handleMarkOneRead,
  };
}
