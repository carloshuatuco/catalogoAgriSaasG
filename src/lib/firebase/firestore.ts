import { initializeFirestore, collection, doc, getDocs, setDoc, query, where, limit, setLogLevel } from "firebase/firestore";
import { app } from "./config";

// Force Long Polling to bypass antivirus/firewall WebSocket blocking
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
});

// -----------------
// STORES (TENANTS)
// -----------------
export interface Store {
  id: string; 
  slug: string;
  name: string;
  ownerId: string;
}

export const getStoreByOwner = async (ownerId: string): Promise<Store | null> => {
  const q = query(collection(db, "stores"), where("ownerId", "==", ownerId), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Store;
};

export const getStoreBySlug = async (slug: string): Promise<Store | null> => {
  const q = query(collection(db, "stores"), where("slug", "==", slug), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Store;
};

export const createStore = async (ownerId: string, slug: string, name: string) => {
  const exists = await getStoreBySlug(slug);
  if (exists) throw new Error("El nombre de la URL ya está en uso. Por favor, elige otro.");
  
  const newStoreRef = doc(collection(db, "stores"));
  await setDoc(newStoreRef, { slug, name, ownerId, createdAt: new Date() });
  return newStoreRef.id;
};

// -----------------
// PRODUCTS REF
// -----------------
export const getProductsRef = (storeId: string) => collection(db, "stores", storeId, "products");
