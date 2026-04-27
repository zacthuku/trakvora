import { create } from "zustand";

export const useUIStore = create((set) => ({
  sidebarOpen: true,
  modalStack: [],

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebar: (open) => set({ sidebarOpen: open }),

  openModal: (id) => set((s) => ({ modalStack: [...s.modalStack, id] })),
  closeModal: () => set((s) => ({ modalStack: s.modalStack.slice(0, -1) })),
  isModalOpen: (id) => (state) => state.modalStack.includes(id),
}));
