import React, { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart, Settings, ChevronDown, Phone } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import SocialButtons from './SocialButtons';
import { formatCurrency } from '../utils/currency';
import type { Store, Category, Product, ProductTag, CustomButton } from '../types';
import { PRODUCT_TAGS } from '../types';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons'

interface CartItem {
  product: Product;
  quantity: number;
}

interface StoreFrontProps {
    storeId?: string;
  }

export default function StoreFront({ storeId: initialStoreId }: StoreFrontProps) {
  const { slug } = useParams<{ slug: string}>();
  const navigate = useNavigate();
  
  const [store, setStore] = useState<Store | null>(null);
  const [storeId, setStoreId] = useState<string>(initialStoreId || '');
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customButtons, setCustomButtons] = useState<CustomButton[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<ProductTag | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'price-asc' | 'price-desc'>('recent');
  const [showSortOptions, setShowSortOptions] = useState(false);


  // Refs for dropdown click outside handling
  const categoriesRef = useRef<HTMLDivElement>(null);
  const tagsRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    async function storeId() {
      if (!initialStoreId && slug) {
        const { data: slugData, error } = await supabase
          .from('store_slugs')
          .select('store_id')
          .eq('slug', slug)
          .maybeSingle();
        if (error) {
          console.error('Erro ao resolver slug:', error);
        } else if (slugData && slugData.store_id) {
          setStoreId(slugData.store_id);
        }
      } else if (initialStoreId) {
        setStoreId(initialStoreId);
      }
    }
    storeId();
  }, [initialStoreId, slug]);
  
  useEffect(() => {
    // Handle click outside for dropdowns
    const handleClickOutside = (event: MouseEvent) => {
      if (categoriesRef.current && !categoriesRef.current.contains(event.target as Node)) {
        setShowCategories(false);
      }
      if (tagsRef.current && !tagsRef.current.contains(event.target as Node)) {
        setShowTags(false);
      }
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setShowSortOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  
  useEffect(() => {
    loadStoreData();
    checkSession();
  
    return () => subscription.unsubscribe();
  }, [storeId]);

   const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAdmin(!!session);
    };
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdmin(!!session);
    });

  async function loadStoreData() {
    if(!storeId) return;
    
    const { data: storeData } = await supabase
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .single();

    const { data: categoriesData } = await supabase
      .from('categories')
      .select('*')
      .eq('store_id', storeId);

    const { data: productsData } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', storeId);

    const { data: buttonsData } = await supabase
      .from('custom_buttons')
      .select('*')
      .eq('store_id', storeId);

    if (storeData) setStore(storeData);
    if (categoriesData) setCategories(categoriesData);
    if (productsData) setProducts(productsData);
    if (buttonsData) setCustomButtons(buttonsData);
  }

  const getTagLabel = (tag: ProductTag) => {
    return PRODUCT_TAGS.find(t => t.value === tag)?.label || '';
  };

  const getTagColor = (tag: ProductTag) => {
    switch (tag) {
      case 'launch':
        return 'bg-green-500';
      case 'most-loved':
        return 'bg-pink-500';
      case 'last-units':
        return 'bg-orange-500';
      case 'sale':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = (
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.item_number?.includes(searchTerm)
    );
    const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
    const matchesTag = !selectedTag || (product.tags && product.tags.includes(selectedTag));
    return matchesSearch && matchesCategory && matchesTag && product.is_visible;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const addToCart = (product: Product) => {
    setCart(currentCart => {
      const existingItem = currentCart.find(item => item.product.id === product.id);
      if (existingItem) {
        return currentCart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...currentCart, { product, quantity: 1 }];
    });
    setShowCart(true);
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      setCart(cart.filter(item => item.product.id !== productId));
    } else {
      setCart(cart.map(item =>
        item.product.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const cartTotal = cart.reduce((total, item) => 
    total + (item.product.price * item.quantity), 0
  );

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  const formatWhatsAppMessage = (items: CartItem[] = []) => {
    if (!store || items.length === 0) return '';

    const productList = items.map(item => 
      `📌 Produto: ${item.product.name}\n` +
      `🔢 Código: ${item.product.item_number}\n` +
      `📦 Quantidade: ${item.quantity}\n` +
      `💰 Valor Total: ${formatCurrency(item.product.price * item.quantity, store)}`
    ).join('\n\n');

    const total = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

    return `Oi! Tudo bem?\n\nVocê pode me ajudar neste pedido?\n\n${productList}\n\nTotal do Pedido: ${formatCurrency(total, store)}\n\nAguardo seu retorno! 😃`;
  };

  const sendWhatsAppMessage = (singleProduct?: Product) => {
    if (!store) return;

    let message;
    if (singleProduct) {
      message = formatWhatsAppMessage([{ product: singleProduct, quantity: 1 }]);
    } else {
      message = formatWhatsAppMessage(cart);
    }

    const whatsappUrl = `https://wa.me/${store.whatsapp}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (!store) return <div>Carregando...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
          <div className="flex flex-col items-center justify-center text-center relative">
            <div className="absolute top-0 right-4 flex gap-2">
            {isAdmin ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/')}
                className="absolute top-0 right-4 bg-gray-800 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-sm flex items-center gap-2 shadow-lg hover:bg-gray-700"
              >
                <Settings size={16} />
                <span className="hidden md:inline">Painel Admin</span>
              </motion.button>
              ) : (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/cadastro')}
                  className="bg-white text-gray-700 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-sm border border-gray-300 hover:bg-gray-100 transition-colors"
                >
                  Login
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/cadastro')}
                  className="bg-green-500 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-sm hover:bg-green-600 transition-colors"
                >
                  Criar Conta
                </motion.button>
              </>
            )}
          </div>
            <div className="mb-4 md:mb-6">
              {store.image_url ? (
                <img
                  src={store.image_url}
                  alt={store.name}
                  className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-3xl md:text-4xl font-bold text-gray-400">
                    {store.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{store.name}</h1>
            {store.description && (
              <p className="text-gray-600 mb-2 max-w-md text-sm md:text-base">{store.description}</p>
            )}
            {store.attention_headline && (
              <div className="bg-yellow-50 border border-yellow-100 rounded-lg px-3 py-1.5 md:px-4 md:py-2 mb-4 md:mb-6">
                <p className="text-yellow-800 text-xs md:text-sm font-medium">
                  {store.attention_headline}
                </p>
              </div>
            )}
            <div className="w-full max-w-sm mx-auto">
              <SocialButtons buttons={customButtons} />
            </div>
          </div>
        </div>
      </div>

      {store.coupon_code && (
        <div className="bg-yellow-50 border-y border-yellow-100">
          <div className="max-w-7xl mx-auto px-4 py-2">
            <p className="text-center text-xs md:text-sm text-yellow-800">
              Use o cupom <span className="font-bold">{store.coupon_code}</span> para ter {store.coupon_discount}% de desconto
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        {/* Search and Filters */}
        <div className="flex flex-col gap-4 mb-6">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Busque por nome ou descrição"
              className="w-full pl-10 pr-4 py-2.5 border-b border-gray-200 focus:border-gray-400 focus:outline-none transition-colors bg-transparent text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex items-center gap-6 overflow-y-visible py-1 no-scrollbar">
            {/* Categories */}
            <div ref={categoriesRef} className="relative">
              <button
                onClick={() => {
                  setShowCategories(!showCategories);
                  setShowTags(false);
                  setShowSortOptions(false);
                }}
                className="flex items-center gap-1.5 text-sm text-gray-700 hover:text-gray-900"
              >
                <span>{selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : 'Categorias'}</span>
                <ChevronDown size={16} className={`transition-transform ${showCategories ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {showCategories && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50"
                  >
                    <button
                      onClick={() => {
                        setSelectedCategory(null);
                        setShowCategories(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm ${!selectedCategory ? 'text-green-600' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      Todas as Categorias
                    </button>
                    {categories.map(category => (
                      <button
                        key={category.id}
                        onClick={() => {
                          setSelectedCategory(category.id);
                          setShowCategories(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm ${selectedCategory === category.id ? 'text-green-600' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Tags */}
            <div ref={tagsRef} className="relative">
              <button
                onClick={() => {
                  setShowTags(!showTags);
                  setShowCategories(false);
                  setShowSortOptions(false);
                }}
                className="flex items-center gap-1.5 text-sm text-gray-700 hover:text-gray-900"
              >
                <span>{selectedTag ? PRODUCT_TAGS.find(t => t.value === selectedTag)?.label : 'Tags'}</span>
                <ChevronDown size={16} className={`transition-transform ${showTags ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {showTags && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50"
                  >
                    <button
                      onClick={() => {
                        setSelectedTag(null);
                        setShowTags(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm ${!selectedTag ? 'text-green-600' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      Todas as Tags
                    </button>
                    {PRODUCT_TAGS.map(tag => (
                      <button
                        key={tag.value}
                        onClick={() => {
                          setSelectedTag(tag.value);
                          setShowTags(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm ${selectedTag === tag.value ? 'text-green-600' : 'text-gray-700 hover:bg-gray-50'}`}
                      >
                        {tag.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sort */}
            <div ref={sortRef} className="relative">
              <button
                onClick={() => {
                  setShowSortOptions(!showSortOptions);
                  setShowCategories(false);
                  setShowTags(false);
                }}
                className="flex items-center gap-1.5 text-sm text-gray-700 hover:text-gray-900"
              >
                <span>
                  {sortBy === 'recent' ? 'Mais recentes' :
                   sortBy === 'price-asc' ? 'Menor preço' :
                   'Maior preço'}
                </span>
                <ChevronDown size={16} className={`transition-transform ${showSortOptions ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {showSortOptions && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50"
                  >
                    <button
                      onClick={() => {
                        setSortBy('recent');
                        setShowSortOptions(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm ${sortBy === 'recent' ? 'text-green-600' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      Mais recentes
                    </button>
                    <button
                      onClick={() => {
                        setSortBy('price-asc');
                        setShowSortOptions(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm ${sortBy === 'price-asc' ? 'text-green-600' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      Menor preço
                    </button>
                    <button
                      onClick={() => {
                        setSortBy('price-desc');
                        setShowSortOptions(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm ${sortBy === 'price-desc' ? 'text-green-600' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      Maior preço
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Cart (Desktop) */}
            <div className="hidden md:block ml-auto">
              <button
                onClick={() => setShowCart(true)}
                className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
              >
                <ShoppingCart size={18} />
                <span>Carrinho ({cartItemCount})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
          {filteredProducts.map(product => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col"
            >
              <div className="relative w-full pt-[100%]">
                <img
                  src={product.image_url || 'https://via.placeholder.com/300'}
                  alt={product.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {product.tags?.map(tag => (
                  <div
                    key={tag}
                    className={`absolute top-2 right-2 ${getTagColor(tag as ProductTag)} text-white px-2 py-1 rounded text-xs font-medium`}
                  >
                    {getTagLabel(tag as ProductTag)}
                  </div>
                ))}
              </div>
              <div className="p-3 md:p-4 flex flex-col flex-1">
                <h3 className="text-xs md:text-sm font-medium text-gray-900 mb-1">
                  {product.item_number}. {product.name}
                </h3>
                {product.description && (
                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                    {product.description}
                  </p>
                )}
                <div className="mt-auto">
                  <div className="mb-2">
                    {product.original_price && (
                      <span className="text-xs text-gray-500 line-through block">
                        {formatCurrency(product.original_price, store)}
                      </span>
                    )}
                    <div className="text-base md:text-lg font-bold text-gray-900">
                      {formatCurrency(product.price, store)}
                    </div>
                  </div>
                  <div className="flex flex-row gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => sendWhatsAppMessage(product)}
                      className="w-full bg-green-500 text-white px-2 py-1.5 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-1.5 text-xs"
                    >
                  
                    <FontAwesomeIcon icon={faWhatsapp} className="text-2xl" />
                      <span>Comprar Agora</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => addToCart(product)}
                      className="relative w-min bg-gray-100 text-gray-700 px-2 py-1.5 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-1.5 text-xs"
                    >
                      <span className="absolute top-0 right-0 bg-blue-500 text-white rounded-full p-0.5 text-[12px] leading-none shadow">
                        +
                      </span>
                      <ShoppingCart size={18} />
                      
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Fixed Cart Button on Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowCart(true)}
          className="w-full flex items-center justify-center gap-2 bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 transition-colors"
        >
          <ShoppingCart size={20} />
          <span className="font-medium">Ver Carrinho ({cartItemCount})</span>
          {cartTotal > 0 && (
            <span className="font-medium">• {formatCurrency(cartTotal, store)}</span>
          )}
        </motion.button>
      </div>

      {/* Cart Modal */}
      <AnimatePresence>
        {showCart && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden"
            >
              <div className="p-4 md:p-6">
                <div className="flex justify-between items-center mb-4 md:mb-6">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900">Carrinho</h2>
                  <button
                    onClick={() => setShowCart(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">Seu carrinho está vazio</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 max-h-[50vh] overflow-y-auto">
                      {cart.map(item => (
                        <div key={item.product.id} className="flex items-center gap-3 md:gap-4">
                          <img
                            src={item.product.image_url || ''}
                            alt={item.product.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm md:text-base truncate">
                              {item.product.item_number}. {item.product.name}
                            </h3>
                            <p className="text-gray-600 text-sm">
                              {formatCurrency(item.product.price, store)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100"
                            >
                              -
                            </motion.button>
                            <span className="w-6 md:w-8 text-center text-sm md:text-base">{item.quantity}</span>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100"
                            >
                              +
                            </motion.button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-6 pt-6 border-t">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-base md:text-lg font-semibold">Total:</span>
                        <span className="text-xl md:text-2xl font-bold text-green-600">
                          {formatCurrency(cartTotal, store)}
                        </span>
                      </div>
                      
                      <div className="flex flex-col gap-3">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => sendWhatsAppMessage()}
                          className="w-full bg-green-500 text-white py-3 md:py-4 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2 font-medium text-sm md:text-base"
                        >
                          <Phone size={20} />
                          Finalizar no WhatsApp
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setShowCart(false)}
                          className="w-full bg-gray-100 text-gray-700 py-3 md:py-4 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 font-medium text-sm md:text-base"
                        >
                          Continuar Comprando
                        </motion.button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}