export interface StoreSlug {
  id: string;
  store_id: string;
  slug: string;
  created_at?: string;
}

export interface Store {
  id: string;
  user_id: string;
  name: string;
  whatsapp: string;
  welcome_message: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
  coupon_code?: string;
  coupon_discount?: number;
  description?: string;
  attention_headline?: string;
  currency_symbol?: string;
}

export interface Category {
  id: string;
  store_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  store_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  original_price?: number;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  item_number: string;
  is_visible: boolean;
  tags: string[];
  discount_percentage?: number;
}

export interface CustomButton {
  id: string;
  store_id: string;
  label: string;
  message: string;
  type: string;
  icon?: string;
  color?: string;
  created_at?: string;
  updated_at?: string;
  position?: number;
}

export type ProductTag = 'launch' | 'most-loved' | 'last-units' | 'sale';

export const PRODUCT_TAGS: { value: ProductTag; label: string }[] = [
  { value: 'launch', label: 'Lançamento' },
  { value: 'most-loved', label: 'Mais Vendido' },
  { value: 'last-units', label: 'Últimas Unidades' },
  { value: 'sale', label: 'Promoção' }
];

export const CURRENCY_OPTIONS = [
  { symbol: 'R$', label: 'Real Brasileiro (R$)', default: true },
  { symbol: 'US$', label: 'Dólar Americano (US$)' },
  { symbol: '€', label: 'Euro (€)' },
  { symbol: '£', label: 'Libra Esterlina (£)' },
  { symbol: '¥', label: 'Iene Japonês (¥)' }
] as const;