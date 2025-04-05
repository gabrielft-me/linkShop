import React, { useState, useEffect } from 'react';
import {
  Plus, Edit, Trash, Settings, ExternalLink, Save, ChevronDown, ChevronUp,
  Image as ImageIcon, ArrowLeft, Facebook, Instagram, Youtube, Twitter,
  Linkedin, Globe, Mail, Phone, Menu, X, Check, AlertTriangle, Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { supabase } from '../lib/supabase';
import ProductForm from './ProductForm';
import CustomButtonForm from './CustomButtonForm';
import WhatsAppInput from './WhatsAppInput';
import CurrencySelector from './CurrencySelector';
import type { Store, Category, Product, CustomButton,  } from '../types';
import StoreSlugInput from './StoreSlugInput';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import SortableButton from './SortableButton';

interface CategoryWithCount extends Category {
  productCount: number;
}

function AdminPanel() {
  const navigate = useNavigate();
  //
  const [store, setStore] = useState<Store | null>(null);
  const [storeSlug, setStoreSlug] = useState<string>('');
  //
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customButtons, setCustomButtons] = useState<CustomButton[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [showCustomButtons, setShowCustomButtons] = useState(false);
  const [storeImage, setStoreImage] = useState<string>('');
  const [showSuccess] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [showProductForm, setShowProductForm] = useState(false);
  const [showButtonForm, setShowButtonForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [editingButton, setEditingButton] = useState<CustomButton | undefined>(undefined);
  const [showCategoryPanel, setShowCategoryPanel] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{id: string, name: string} | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  const handleSlugChange = async (newSlug: string) => {
  setStoreSlug(newSlug);
  };

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: storeData } = await supabase
      .from('stores')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (storeData) {
      setStore(storeData);
      setStoreImage(storeData.image_url || '');
      
      const { data: slugData } = await supabase
      .from('store_slugs')
      .select('*')
      .eq('store_id', storeData.id)
      .maybeSingle();
      
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('store_id', storeData.id)
        .order('name');

      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeData.id);

      const { data: buttonsData } = await supabase
        .from('custom_buttons')
        .select('*')
        .eq('store_id', storeData.id)
        .order('position');

      if (categoriesData && productsData) {
        // Add product count to each category
        const categoriesWithCount = categoriesData.map(category => ({
          ...category,
          productCount: productsData.filter(p => p.category_id === category.id).length
        }));
        setCategories(categoriesWithCount);
        setProducts(productsData);
      }
      
      if (buttonsData) setCustomButtons(buttonsData);
      if (slugData) setStoreSlug(slugData.slug);
    }

    setLoading(false);
  }

   const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Erro ao sair: " + error.message);
    } else {
      navigate('/cadastro', { replace: true });
    }
  };

  const updateStore = async (updates: Partial<Store>) => {
    if (!store) return;
    setStore({ ...store, ...updates });
  };


  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !store) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `store-images/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, file);

    if (uploadError) {
      toast.error('Erro ao fazer upload da imagem');
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    setStoreImage(publicUrl);
    toast.success('Imagem atualizada com sucesso!');
  };

  const addCategory = async () => {
    if (!store || !newCategoryName.trim()) return;

    const { error } = await supabase
      .from('categories')
      .insert([{
        store_id: store.id,
        name: newCategoryName.trim()
      }]);

    if (error) {
      toast.error('Erro ao criar categoria');
      return;
    }

    loadData();
    setNewCategoryName('');
    toast.success('Categoria criada com sucesso!');
  };

  const updateCategory = async (id: string, name: string) => {
    const { error } = await supabase
      .from('categories')
      .update({ name })
      .eq('id', id);

    if (error) {
      toast.error('Erro ao atualizar categoria');
      return;
    }

    loadData();
    setEditingCategory(null);
    toast.success('Categoria atualizada com sucesso!');
  };

  const handleDeleteCategory = async (category: Category) => {
    setDeletingCategory(category);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteCategory = async () => {
    if (!deletingCategory) return;

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', deletingCategory.id);

    if (error) {
      toast.error('Erro ao excluir categoria');
      return;
    }

    loadData();
    setShowDeleteConfirm(false);
    setDeletingCategory(null);
    toast.success('Categoria excluída com sucesso!');
  };

  const deleteProducts = async (productIds: string[]) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .in('id', productIds);

      if (error) throw error;

      setProducts(products.filter(p => !productIds.includes(p.id)));
      setSelectedProducts(new Set());
      toast.success(
        productIds.length === 1 
          ? 'Produto excluído com sucesso!'
          : 'Produtos excluídos com sucesso!'
      );
      
      // Reload data to update category counts
      loadData();
    } catch (error) {
      console.error('Error deleting products:', error);
      toast.error('Erro ao excluir produto(s)');
    }
  };

  const deleteButton = async (buttonId: string) => {
    const { error } = await supabase
      .from('custom_buttons')
      .delete()
      .eq('id', buttonId);

    if (!error) {
      setCustomButtons(customButtons.filter(b => b.id !== buttonId));
      toast.success('Botão excluído com sucesso!');
    }
  };

  const handleProductSaved = () => {
    loadData();
    setShowProductForm(false);
    setEditingProduct(undefined);
    toast.success('Produto salvo com sucesso!');
  };

  const handleButtonSaved = () => {
    loadData();
    setShowButtonForm(false);
    setEditingButton(undefined);
    toast.success('Botão salvo com sucesso!');
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleEditButton = (button: CustomButton) => {
    setEditingButton(button);
    setShowButtonForm(true);
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if(!over) return;
    
    if (active.id !== over.id) {
      const sortedButtons = [...customButtons].sort((a, b) => (a.position || 0) - (b.position || 0));
      
      const oldIndex = sortedButtons.findIndex(b => b.id === active.id);
      const newIndex = sortedButtons.findIndex(b => b.id === over.id);
      
      const newButtons = arrayMove(sortedButtons, oldIndex, newIndex);
      const updatedButtons = newButtons.map((button, index) => ({ ...button, position: index }));

      try {
        await Promise.all(updatedButtons.map(async (button, index) => {
          if (button.position !== index) {
            const { error } = await supabase
              .from('custom_buttons')
              .update({ position: index })
              .eq('id', button.id);
            if (error) {
              throw error;
            }
          }
        }));
        
        setCustomButtons(updatedButtons);
      } catch (error: any) {
        toast.error('Erro ao reordenar botoes: ' + error.message);
      }
    }
  };

  // Filter products based on search term and selected category
  const filteredProducts = products.filter(product => {
    const matchesSearch = (
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.item_number?.includes(searchTerm)
    );
    const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );
  
  if (!store) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-red-600">Nenhuma loja encontrada</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <ToastContainer />
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex md:flex-row justify-between items-center gap-4 mb-8">
          <div className="flex items-left gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {if (storeSlug) {
                navigate(`/${storeSlug}`);
              } else {
                navigate('/');
              }}}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 bg-white px-4 py-2 rounded-lg shadow-sm"
            >
              <ArrowLeft size={20} />
              <span className="hidden sm:inline">Voltar para o Catálogo</span>
            </motion.button>
            <h1 className="text-2xl md:text-3xl font-bold">Perfil da Loja</h1>
          </div>
          <div className="flex gap-4 items-center">
            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-green-100 text-green-700 px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <span className="text-lg">✓</span>
                  Alterações salvas!
                </motion.div>
              )}
            </AnimatePresence>
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="flex items-center gap-2 text-red-600 hover:text-red-800 bg-white px-4 py-2 rounded-lg shadow-sm"
            >
              <X size={20} />
              Logout
            </motion.a>
 
          </div>
        </div>

        {/* Store Settings */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Configurações da Loja</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="relative w-28 h-28 flex-shrink-0">
                  <img
                    src={storeImage || 'https://via.placeholder.com/128'}
                    alt="Logo da loja"
                    className="w-full h-full object-cover rounded-lg shadow-sm"
                  />
                  <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white rounded-lg cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
                    <ImageIcon size={24} />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>
                
                 <div className="flex-1 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome da Loja
                    </label>
                    <input
                      type="text"
                      value={store?.name || ''}
                      onChange={(e) => updateStore({ name: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nome da sua loja"
                    />
                  </div>
                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Headline de Atenção
                  </label>
                  <input
                    type="text"
                    value={store?.attention_headline || ''}
                    onChange={(e) => updateStore({ attention_headline: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Frete Grátis acima de R$250 em compras"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Será exibido abaixo da descrição da loja
                  </p>
                  </div>
                 
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descrição da Loja
                    </label>
                    <textarea
                      value={store?.description || ''}
                      onChange={(e) => updateStore({ description: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Descreva sua loja em poucas palavras"
                      rows={3}
                    />
                  </div>
                </div>
                
              </div>
            </div>
            
            <div className="space-y-6">
            <div>
                     <StoreSlugInput 
                  currentSlug={storeSlug} 
                  storeId={store.id} 
                  onSlugChange={handleSlugChange} 
                  />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  WhatsApp Padrão do Catálogo
                </label>
                <WhatsAppInput
                  value={store?.whatsapp || ''}
                  onChange={(value) => updateStore({ whatsapp: value })}
                />
              </div>



              
              {store?.coupon_code && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cupom de Desconto
                  </label>

                  <div className="flex gap-4">
                    <input
                      type="text"
                      value={store.coupon_code}
                      onChange={(e) => updateStore({ coupon_code: e.target.value })}
                      className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Código do cupom"
                    />
                    <input
                      type="number"
                      value={store.coupon_discount || ''}
                      onChange={(e) => updateStore({ coupon_discount: parseFloat(e.target.value) })}
                      className="w-24 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="%"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Custom Buttons Section */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          onClick={() => setShowCustomButtons(!showCustomButtons)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
        >
          <Globe size={20} />
          Botões Personalizados
          {showCustomButtons ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </motion.button>

        <AnimatePresence>
          {showCustomButtons && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-lg shadow p-6 mb-8 overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Botões Personalizados</h2>
                <div className="flex gap-2">
                  {hasUnsavedButtonOrder && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                    >
                      <Save size={20} />
                      Salvar Ordem
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setEditingButton(undefined);
                      setShowButtonForm(true);
                    }}
                    className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                  >
                    <Plus size={20} />
                    Novo Botão
                  </motion.button>
                </div>
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={customButtons.map(b => b.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {customButtons.map(button => (
                      <SortableButton
                        key={button.id}
                        button={button}
                        onEdit={handleEditButton}
                        onDelete={deleteButton}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Advanced Settings Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
        >
          <Settings size={20} />
          Configurações Avançadas
          {showAdvancedSettings ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </motion.button>

        {/* Categories Management */}
        <AnimatePresence>
          {showAdvancedSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-lg shadow p-6 mb-8"
            >
              <div className="space-y-6">
                {/* Currency Symbol Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Moeda do Catálogo
                  </label>
                  <CurrencySelector
                    value={store?.currency_symbol || 'R$'}
                    onChange={(value) => updateStore({ currency_symbol: value })}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Escolha o símbolo da moeda que será exibido nos preços
                  </p>
                </div>

                {/* Categories Section */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Categorias</h2>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowCategoryPanel(true)}
                      className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                    >
                      <Menu size={20} />
                      Gerenciar
                    </motion.button>
                  </div>
                  
                  {/* Categories List Preview */}
                  <div className="flex flex-wrap gap-2">
                    {categories.map(category => (
                      <div
                        key={category.id}
                        className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                      >
                        <span>{category.name}</span>
                        <span className="bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full text-xs">
                          {category.productCount}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Categories Management Panel */}
        <AnimatePresence>
          {showCategoryPanel && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex justify-end"
            >
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'tween' }}
                className="bg-white w-full max-w-md h-full overflow-y-auto shadow-xl"
              >
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Gerenciar Categorias</h2>
                    <button
                      onClick={() => {
                        setShowCategoryPanel(false);
                        setEditingCategory(null);
                      }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  {/* Add New Category */}
                  <div className="mb-6">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Nova categoria"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={addCategory}
                        disabled={!newCategoryName.trim()}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus size={20} />
                      </motion.button>
                    </div>
                  </div>

                  {/* Categories List */}
                  <div className="space-y-2">
                    {categories.map(category => (
                      <motion.div
                        key={category.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"
                      >
                        {editingCategory?.id === category.id ? (
                          <div className="flex-1 flex items-center gap-2">
                            <input
                              type="text"
                              value={editingCategory.name}
                              onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                              autoFocus
                            />
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => updateCategory(category.id, editingCategory.name)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                            >
                              <Check size={18} />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setEditingCategory(null)}
                              className="p-1 text-gray-600 hover:bg-gray-200 rounded"
                            >
                              <X size={18} />
                            </motion.button>
                          </div>
                        ) : (
                          <>
                            <div className="flex-1 flex items-center gap-2">
                              <span>{category.name}</span>
                              <span className="bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full text-xs">
                                {category.productCount}
                              </span>
                            </div>
                            <div className="flex gap-1">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setEditingCategory({
                                  id: category.id,
                                  name: category.name
                                })}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              >
                                <Edit size={18} />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleDeleteCategory(category)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash size={18} />
                              </motion.button>
                            </div>
                          </>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteConfirm && deletingCategory && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
              >
                <div className="flex items-center gap-4 mb-4 text-red-600">
                  <AlertTriangle size={24} />
                  <h3 className="text-lg font-semibold">Confirmar Exclusão</h3>
                </div>
                
                <p className="text-gray-600 mb-6">
                  Tem certeza que deseja excluir a categoria "{deletingCategory.name}"? 
                  Esta ação não pode ser desfeita e os produtos desta categoria ficarão sem categoria.
                </p>

                <div className="flex justify-end gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeletingCategory(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={confirmDeleteCategory}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Confirmar Exclusão
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Products Management */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Produtos</h2>
            <div className="flex gap-4">
              {selectedProducts.size > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => deleteProducts(Array.from(selectedProducts))}
                  className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                >
                  <Trash size={20} />
                  Excluir ({selectedProducts.size})
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setEditingProduct(undefined);
                  setShowProductForm(true);
                }}
                className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
              >
                <Plus size={20} />
                Novo Produto
              </motion.button>
            </div>
          </div>

          {/* Search and Filter Section */}
          <div className="mb-6 space-y-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Busque por nome, descrição ou código"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas as Categorias</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name} ({category.productCount})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map(product => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                  >
                    <div className="relative aspect-square">
                      <img
                        src={product.image_url || 'https://via.placeholder.com/300'}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2 flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleEditProduct(product)}
                          className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
                        >
                          <Edit size={16} className="text-blue-600" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => deleteProducts([product.id])}
                          className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
                        >
                          <Trash size={16} className="text-red-600" />
                        </motion.button>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-gray-900">
                        {product.item_number}. {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                      <div className="mt-2">
                        <div className="font-bold text-gray-900">
                          {store.currency_symbol} {product.price.toFixed(2)}
                        </div>
                        {product.original_price && (
                          <div className="text-sm text-gray-500 line-through">
                            {store.currency_symbol} {product.original_price.toFixed(2)}
                          </div>
                        )}
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        {categories.find(c => c.id === product.category_id)?.name || 'Sem categoria'}
                      </div>
                      {!product.is_visible && (
                        <div className="mt-2 text-sm text-red-600">
                          Item oculto do catálogo
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showProductForm && (
          <ProductForm
            isOpen={showProductForm}
            onClose={() => {
              setShowProductForm(false);
              setEditingProduct(undefined);
            }}
            storeId={store.id}
            categories={categories}
            onProductSaved={handleProductSaved}
            product={editingProduct}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showButtonForm && (
          <CustomButtonForm
            isOpen={showButtonForm}
            onClose={() => {
              setShowButtonForm(false);
              setEditingButton(undefined);
            }}
            storeId={store.id}
            onButtonSaved={handleButtonSaved}
            button={editingButton}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default AdminPanel;