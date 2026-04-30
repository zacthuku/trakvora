import { create } from "zustand";
import { notificationsApi } from "@/api/notificationsApi";

export const useNotificationStore = create((set) => ({
  notifications: [],
  enabled: true,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const data = await notificationsApi.list();
      set({
        notifications: data.map(n => ({
          id:             n.id,
          type:           n.notification_type,
          title:          n.title,
          body:           n.body,
          read:           n.is_read,
          time:           n.created_at,
          reference_id:   n.reference_id,
          reference_type: n.reference_type,
        })),
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  markRead: async (id) => {
    set(s => ({
      notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n),
    }));
    try { await notificationsApi.markRead(id); } catch { /* optimistic */ }
  },

  markAllRead: async () => {
    set(s => ({
      notifications: s.notifications.map(n => ({ ...n, read: true })),
    }));
    try { await notificationsApi.markAllRead(); } catch { /* optimistic */ }
  },

  dismiss: (id) => set(s => ({
    notifications: s.notifications.filter(n => n.id !== id),
  })),

  clearAll: () => set({ notifications: [] }),

  addNotification: (notif) => set(s => ({
    notifications: [
      { id: `n-${Date.now()}`, read: false, time: new Date().toISOString(), ...notif },
      ...s.notifications,
    ].slice(0, 50),
  })),

  setEnabled: (val) => set({ enabled: val }),
}));
