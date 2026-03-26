import { create } from 'zustand';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/auth';
import { getStoreByOwner, Store } from '../firebase/firestore';

interface AuthState {
  user: User | null;
  store: Store | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  initializeAuth: () => () => void;
  refreshStore: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  store: null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),
  initializeAuth: () => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("[useAuthStore] Auth state changed. User:", user ? user.uid : "null");
      set({ loading: true }); // Ensure loading is true while we fetch
      
      if (user) {
        try {
          // Timeout to prevent infinite hang if Firestore hangs
          const fetchPromise = getStoreByOwner(user.uid);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Timeout fetching store data")), 10000)
          );
          
          const store = await Promise.race([fetchPromise, timeoutPromise]) as Store | null;
          console.log("[useAuthStore] Store fetched successfully");
          set({ user, store, loading: false });
        } catch (error) {
          console.error("[useAuthStore] Error fetching store in initializeAuth:", error);
          // Omit store but keep user authenticated to avoid permanent loop
          set({ user, store: null, loading: false });
        }
      } else {
        set({ user: null, store: null, loading: false });
      }
    });
    return unsubscribe;
  },
  refreshStore: async () => {
    const { user } = get();
    if (user) {
      try {
        const store = await getStoreByOwner(user.uid);
        set({ store });
      } catch (error) {
        console.error("Error fetching store in refreshStore:", error);
      }
    }
  }
}));
