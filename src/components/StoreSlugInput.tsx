import React, { useState } from 'react';
import { Check, X, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { supabase } from '../lib/supabase';

interface StoreSlugInputProps {
  currentSlug: string;
  storeId: string;
  onSlugChange: (newSlug: string) => void;
}

const StoreSlugInput: React.FC<StoreSlugInputProps> = ({ 
  currentSlug, 
  storeId,
  onSlugChange 
}) => {
  const [slug, setSlug] = useState(currentSlug);
  const [isEditing, setIsEditing] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setSlug(currentSlug);
    setError(null);
    setIsEditing(false);
  };

  const validateSlug = (value: string): boolean => {
    // Allow only lowercase letters, numbers, and hyphens
    const slugRegex = /^[a-z0-9-]+$/;
    return slugRegex.test(value);
  };

  const checkSlugAvailability = async (value: string): Promise<boolean> => {
    if (!value) return false;
    
    setIsChecking(true);
    
    try {
      const { data, error } = await supabase
        .from('store_slugs')
        .select('id')
        .eq('slug', value)
        .neq('store_id', storeId)
        .maybeSingle();
        
      if (error) throw error;
      
      // If data exists, slug is taken
      return !data;
    } catch (err) {
      console.error('Error checking slug availability:', err);
      return false;
    } finally {
      setIsChecking(false);
    }
  };

  const handleSaveClick = async () => {
    if (!slug) {
      setError('O slug não pode estar vazio');
      return;
    }

    if (!validateSlug(slug)) {
      setError('O slug deve conter apenas letras minúsculas, números e hífens');
      return;
    }

    const isAvailable = await checkSlugAvailability(slug);
    if (!isAvailable) {
      setError('Este slug já está em uso');
      return;
    }

    try {
      let result;
      
      // Check if the store already has a slug
      const { data: existingSlug } = await supabase
        .from('store_slugs')
        .select('*')
        .eq('store_id', storeId)
        .maybeSingle();
        
      if (existingSlug) {
        // Update existing slug
        const { data, error } = await supabase
          .from('store_slugs')
          .update({ slug })
          .eq('store_id', storeId)
          .select()
          .single();
          
        if (error) throw error;
        result = data;
      } else {
        // Insert new slug
        const { data, error } = await supabase
          .from('store_slugs')
          .insert([{ store_id: storeId, slug }])
          .select()
          .single();
          
        if (error) throw error;
        result = data;
      }
      
      onSlugChange(slug);
      setIsEditing(false);
      setError(null);
      toast.success('Slug atualizado com sucesso!');
    } catch (err: any) {
      console.error('Error saving slug:', err);
      setError('Erro ao salvar o slug');
      toast.error('Erro ao salvar o slug: ' + err.message);
    }
  };

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        URL do Catálogo
      </label>
      
      <div className="flex items-center">
        <div className="bg-gray-100 px-3 py-2 rounded-l-lg text-gray-700 border border-r-0 border-gray-300">
          biofy.shop/
        </div>
        
        {isEditing ? (
          <div className="flex-1 min-w-0">
            <div className="flex">
              <input
                type="text"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value.toLowerCase());
                  setError(null);
                }}
                className={`flex-1 w-full min-w-0 px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="minha-loja"
                disabled={isChecking}
                autoFocus
              />
              <div className="flex border border-l-0 border-gray-300 rounded-r-lg">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleSaveClick}
                  disabled={isChecking}
                  className="px-3 text-green-600 hover:bg-green-50 disabled:opacity-50"
                >
                  <Check size={20} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleCancelClick}
                  className="px-3 text-gray-600 hover:bg-gray-100"
                >
                  <X size={20} />
                </motion.button>
              </div>
            </div>
            {error && (
              <div className="mt-1 flex items-center gap-1 text-sm text-red-600">
                <AlertTriangle size={16} />
                {error}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-1">
            <div className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-r-lg text-gray-800">
              {currentSlug || <span className="text-gray-400">não definido</span>}
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleEditClick}
              className="ml-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
            >
              Editar
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreSlugInput;