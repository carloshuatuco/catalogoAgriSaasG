import { initializeFirestore, collection, doc, getDocs, setDoc, query, where, limit, setLogLevel } from "firebase/firestore";
import { app } from "./config";

// Force Long Polling to bypass antivirus/firewall WebSocket blocking
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
});

// -----------------
// STORES (TENANTS)
// -----------------
export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  active: boolean;
  usesLimit?: number;      // Límite de usos totales (opcional)
  currentUses?: number;    // Conteo actual de cuántas veces se ha usado
  expiresAt?: string;      // Fecha de expiración en formato ISO string
}

export interface Store {
  id: string; 
  slug: string;
  name: string;
  ownerId: string;
  themeColor?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
  };
  whatsappNumber?: string;
  whatsappMessage?: string;
  categories?: string[];
  businessHours?: {
    isOpen: boolean;
    schedule?: string;
    closedMessage?: string;
  };
  deliveryMethods?: {
    pickup: boolean;
    shipping: boolean;
    shippingCost?: number;
    shippingZones?: string;
  };
  logo?: string;
  carouselImages?: string[];
  banners?: string[]; // Usado para popups promocionales
  locationMapUrl?: string;
  coupons?: Coupon[];
  customDomain?: string;
  domainStatus?: 'none' | 'pending' | 'active' | 'failed';
}

export interface ProductVariant {
  name: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  description?: string;
  substance?: string; // Mantenido como opcional para no romper BD existente
  image: string;
  images?: string[]; // Support for multiple images
  stock: boolean;
  featured: boolean;
  onSale?: boolean;
  basePrice?: number;
  variants?: ProductVariant[];
}

export const getStoreByOwner = async (ownerId: string): Promise<Store | null> => {
  const q = query(collection(db, "stores"), where("ownerId", "==", ownerId), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Store;
};

export const getStoreBySlug = async (slug: string): Promise<Store | null> => {
  const q = query(collection(db, "stores"), where("slug", "==", slug));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const docSnap = querySnapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() } as Store;
  }
  return null;
};

export const getStoreByDomain = async (domain: string): Promise<Store | null> => {
  const q = query(collection(db, "stores"), where("customDomain", "==", domain));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const docSnap = querySnapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() } as Store;
  }
  return null;
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
