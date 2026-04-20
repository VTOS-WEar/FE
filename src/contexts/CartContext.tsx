import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";

/* ── Types ── */
export type CartItem = {
  id: string; // unique key = `${campaignOutfitId}-${productVariantId}-${childProfileId}-${providerId ?? "default"}`
  campaignOutfitId: string;
  outfitId: string;
  outfitName: string;
  productVariantId: string;
  size: string;
  quantity: number;
  price: number; // campaign price per unit
  imageURL: string | null;
  studentName: string;
  studentClass: string;
  childProfileId: string;
  campaignId: string;
  schoolId: string;
  schoolName: string;
  campaignLabel: string;
  providerId?: string;
  providerName?: string;
  semesterPublicationId?: string;
  orderMode?: "campaign" | "marketplace";
};

export type CartSchoolGroup = {
  schoolId: string;
  schoolName: string;
  campaignId: string;
  campaignLabel: string;
  items: CartItem[];
};

type CartContextType = {
  items: CartItem[];
  groups: CartSchoolGroup[];
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateProvider: (id: string, providerId: string, providerName: string, price: number) => void;
  clearCart: () => void;
  getItemCount: () => number;
};

/** Get the current userId from storage (or null for guest) */
function getCurrentUserId(): string | null {
  try {
    const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.userId) return user.userId;
    }
  } catch { /* ignore */ }
  return null;
}

/** Build a user-scoped localStorage key */
function storageKeyFor(userId: string | null): string {
  return userId ? `vtos_cart_${userId}` : "vtos_cart_guest";
}

function loadCartFor(userId: string | null): CartItem[] {
  try {
    const raw = localStorage.getItem(storageKeyFor(userId));
    if (raw) return JSON.parse(raw);
  } catch { /* ignore corrupt data */ }
  return [];
}

function saveCartFor(userId: string | null, items: CartItem[]) {
  const key = storageKeyFor(userId);
  if (items.length === 0) {
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, JSON.stringify(items));
  }
}

function makeId(item: { campaignOutfitId: string; productVariantId: string; childProfileId: string; providerId?: string }) {
  return `${item.campaignOutfitId}-${item.productVariantId}-${item.childProfileId}-${item.providerId ?? "default"}`;
}

function groupItems(items: CartItem[]): CartSchoolGroup[] {
  const map = new Map<string, CartSchoolGroup>();
  for (const item of items) {
    const key = `${item.schoolId}__${item.campaignId}`;
    if (!map.has(key)) {
      map.set(key, {
        schoolId: item.schoolId,
        schoolName: item.schoolName,
        campaignId: item.campaignId,
        campaignLabel: item.campaignLabel,
        items: [],
      });
    }
    map.get(key)!.items.push(item);
  }
  return Array.from(map.values());
}

/* ── Context ── */
const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(getCurrentUserId);
  const [items, setItems] = useState<CartItem[]>(() => loadCartFor(getCurrentUserId()));
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  // Listen for auth changes: poll every 500ms + listen for storage events
  // This catches logout/login from same tab AND across tabs
  useEffect(() => {
    const checkUser = () => {
      const newUserId = getCurrentUserId();
      if (newUserId !== userIdRef.current) {
        setUserId(newUserId);
        setItems(loadCartFor(newUserId));
      }
    };

    // Poll for same-tab changes (localStorage.removeItem doesn't fire "storage" in same tab)
    const interval = setInterval(checkUser, 500);

    // Cross-tab storage events
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "user" || e.key === "access_token") {
        checkUser();
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  // Persist to localStorage whenever items change
  useEffect(() => {
    saveCartFor(userIdRef.current, items);
  }, [items]);

  const addItem = useCallback((newItem: Omit<CartItem, "id">) => {
    const id = makeId(newItem);
    setItems(prev => {
      const existing = prev.find(i => i.id === id);
      if (existing) {
        return prev.map(i =>
          i.id === id ? { ...i, quantity: i.quantity + newItem.quantity } : i
        );
      }
      return [...prev, { ...newItem, id }];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity < 1) return;
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity } : i));
  }, []);

  const updateProvider = useCallback((id: string, providerId: string, providerName: string, price: number) => {
    setItems(prev => {
      const item = prev.find(i => i.id === id);
      if (!item) return prev;

      const newItemData = { ...item, providerId, providerName, price };
      const newId = makeId(newItemData);

      const existing = prev.find(i => i.id === newId && i.id !== id);
      if (existing) {
        return prev
          .filter(i => i.id !== id)
          .map(i => i.id === newId ? { ...i, quantity: i.quantity + item.quantity } : i);
      }

      return prev.map(i => i.id === id ? { ...newItemData, id: newId } : i);
    });
  }, []);

  const clearCart = useCallback(() => { setItems([]); }, []);

  const getItemCount = useCallback(() => {
    return items.reduce((sum, i) => sum + i.quantity, 0);
  }, [items]);

  const groups = groupItems(items);

  return (
    <CartContext.Provider value={{ items, groups, addItem, removeItem, updateQuantity, updateProvider, clearCart, getItemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
