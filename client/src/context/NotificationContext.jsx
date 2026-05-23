import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import debtService from "../services/debtService";

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [readIds, setReadIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("readNotifications") || "[]");
    } catch {
      return [];
    }
  });

  const buildNotifications = useCallback((debts) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const items = [];

    debts.forEach((debt) => {
      if (debt.status === "settled") return;

      const due = debt.dueDate ? new Date(debt.dueDate) : null;
      if (due) due.setHours(0, 0, 0, 0);
      const diffDays = due
        ? Math.floor((due - today) / (1000 * 60 * 60 * 24))
        : null;
      const isPay = debt.debtType === "to_pay";
      const fmt = (v) =>
        `LKR ${Number(v).toLocaleString("en-LK", { minimumFractionDigits: 2 })}`;

      if (diffDays !== null && diffDays < 0) {
        items.push({
          id: `overdue-${debt._id}`,
          type: "overdue",
          priority: "high",
          title: isPay ? "Overdue Payment" : "Overdue Receivable",
          message: isPay
            ? `You owe ${debt.personName} ${fmt(debt.amount)} - ${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? "s" : ""} overdue`
            : `${debt.personName} owes you ${fmt(debt.amount)} - ${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? "s" : ""} overdue`,
          debtId: debt._id,
          createdAt: new Date(),
        });
      } else if (diffDays === 0) {
        items.push({
          id: `today-${debt._id}`,
          type: "due_today",
          priority: "high",
          title: "Due Today",
          message: isPay
            ? `Payment of ${fmt(debt.amount)} to ${debt.personName} is due today`
            : `${debt.personName} should pay you ${fmt(debt.amount)} today`,
          debtId: debt._id,
          createdAt: new Date(),
        });
      } else if (diffDays !== null && diffDays <= 3) {
        items.push({
          id: `soon-${debt._id}`,
          type: "due_soon",
          priority: "medium",
          title: "Due Soon",
          message: isPay
            ? `Payment of ${fmt(debt.amount)} to ${debt.personName} in ${diffDays} day${diffDays > 1 ? "s" : ""}`
            : `${debt.personName} owes you ${fmt(debt.amount)} - due in ${diffDays} day${diffDays > 1 ? "s" : ""}`,
          debtId: debt._id,
          createdAt: new Date(),
        });
      } else if (diffDays !== null && diffDays <= 7) {
        items.push({
          id: `week-${debt._id}`,
          type: "due_week",
          priority: "low",
          title: "Upcoming Due Date",
          message: isPay
            ? `Payment of ${fmt(debt.amount)} to ${debt.personName} due in ${diffDays} days`
            : `${debt.personName} owes you ${fmt(debt.amount)} - due in ${diffDays} days`,
          debtId: debt._id,
          createdAt: new Date(),
        });
      }
    });

    return items;
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await debtService.getAll();
      const built = buildNotifications(data.debts);
      setNotifications(built);
      const stored = JSON.parse(
        localStorage.getItem("readNotifications") || "[]",
      );
      setUnreadCount(built.filter((n) => !stored.includes(n.id)).length);
    } catch {}
  }, [buildNotifications]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAllRead = () => {
    const allIds = notifications.map((n) => n.id);
    setReadIds(allIds);
    localStorage.setItem("readNotifications", JSON.stringify(allIds));
    setUnreadCount(0);
  };

  const markRead = (id) => {
    const updated = [...new Set([...readIds, id])];
    setReadIds(updated);
    localStorage.setItem("readNotifications", JSON.stringify(updated));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAllRead,
        markRead,
        isRead: (id) => readIds.includes(id),
        refresh: fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error(
      "useNotifications must be used within NotificationProvider",
    );
  return ctx;
};

export default NotificationContext;
