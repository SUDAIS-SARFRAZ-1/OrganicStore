import { create } from 'zustand';

/**
 * Zustand Cart Drawer Store (Rule 10: Client/UI state only)
 * Controls slide-out mini-cart drawer open/close visibility.
 */
export const useCartDrawerStore = create((set) => ({
  isOpen: false,
  openDrawer: () => set({ isOpen: true }),
  closeDrawer: () => set({ isOpen: false }),
  toggleDrawer: () => set((state) => ({ isOpen: !state.isOpen })),
}));
