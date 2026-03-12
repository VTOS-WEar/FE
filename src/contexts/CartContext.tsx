import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

/* ── Types ── */
export type CartItem = {
  id: string; // unique key = `${campaignOutfitId}-${productVariantId}-${childProfileId}`
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
  clearCart: () => void;
  getItemCount: () => number;
};

const STORAGE_KEY = "vtos_cart";

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore corrupt data */ }
  return [];
}

function saveCart(items: CartItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function makeId(item: { campaignOutfitId: string; productVariantId: string; childProfileId: string }) {
  return `${item.campaignOutfitId}-${item.productVariantId}-${item.childProfileId}`;
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
  const [items, setItems] = useState<CartItem[]>(loadCart);

  // Persist to localStorage whenever items change
  useEffect(() => { saveCart(items); }, [items]);

  const addItem = useCallback((newItem: Omit<CartItem, "id">) => {
    const id = makeId(newItem);
    setItems(prev => {
      const existing = prev.find(i => i.id === id);
      if (existing) {
        // Same outfit + size + child → add quantity
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

  const clearCart = useCallback(() => { setItems([]); }, []);

  const getItemCount = useCallback(() => {
    return items.reduce((sum, i) => sum + i.quantity, 0);
  }, [items]);

  const groups = groupItems(items);

  return (
    <CartContext.Provider value={{ items, groups, addItem, removeItem, updateQuantity, clearCart, getItemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
