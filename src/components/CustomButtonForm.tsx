import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import CustomButtonsMenu from './CustomButtonsMenu';
import WhatsAppInput from './WhatsAppInput';
import type { CustomButton } from '../types';

interface CustomButtonFormProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
  onButtonSaved: () => void;
  button?: CustomButton;
}

const PLACEHOLDER_EXAMPLES = {
  whatsapp: '5511999999999',
  email: 'contato@minhaloja.com.br',
  website: 'https://www.minhaloja.com.br',
  instagram: '@minhaloja',
  facebook: 'https://facebook.com/minhaloja',
  youtube: 'https://youtube.com/@minhaloja',
  twitter: '@minhaloja',
  linkedin: 'https://linkedin.com/company/minhaloja',
  location: 'Rua Augusta, 1500, Jardins, São Paulo - SP',
  custom: 'https://minhaloja.com.br/promocoes'
};

const LABEL_EXAMPLES = {
  whatsapp: 'Fale no WhatsApp',
  email: 'Envie um Email',
  website: 'Visite nosso Site',
  instagram: 'Siga no Instagram',
  facebook: 'Curta no Facebook',
  youtube: 'Inscreva-se no Canal',
  twitter: 'Siga no Twitter',
  linkedin: 'Conecte no LinkedIn',
  location: 'Como Chegar',
  custom: 'Veja Mais'
};

export default function CustomButtonForm({ isOpen, onClose, storeId, onButtonSaved, button }: CustomButtonFormProps) {
  const [label, setLabel] = useState(button?.label || '');
  const [message, setMessage] = useState(button?.message || '');
  const [type, setType] = useState(button?.type || '');
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Set default label when type changes
  useEffect(() => {
    if (type && !label) {
      setLabel(LABEL_EXAMPLES[type as keyof typeof LABEL_EXAMPLES] || '');
    }
  }, [type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate required fields
    if (!type) {
      setError('Selecione um tipo de botão');
      return;
    }

    if (!label.trim()) {
      setError('O texto do botão é obrigatório');
      return;
    }

    if (!message.trim()) {
      setError('O link ou identificador é obrigatório');
      return;
    }

    setIsLoading(true);

    try {
      const buttonData = {
        store_id: storeId,
        label: label.trim(),
        message: message.trim(),
        type,
        position: button?.position || 0
      };

      if (button) {
        const { error: updateError } = await supabase
          .from('custom_buttons')
          .update(buttonData)
          .eq('id', button.id);

        if (updateError) throw updateError;
      } else {
        // Get the current highest position
        const { data: existingButtons } = await supabase
          .from('custom_buttons')
          .select('position')
          .eq('store_id', storeId)
          .order('position', { ascending: false })
          .limit(1);

        const nextPosition = existingButtons && existingButtons.length > 0 
          ? (existingButtons[0].position || 0) + 1 
          : 0;

        const { error: insertError } = await supabase
          .from('custom_buttons')
          .insert([{ ...buttonData, position: nextPosition }]);

        if (insertError) throw insertError;
      }

      onButtonSaved();
      onClose();
    } catch (error) {
      console.error('Error saving button:', error);
      setError('Erro ao salvar o botão. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTypeSelect = (selectedType: string) => {
    setType(selectedType);
    setShowTypeMenu(false);
    // Set default label when type changes
    setLabel(LABEL_EXAMPLES[selectedType as keyof typeof LABEL_EXAMPLES] || '');
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-xl shadow-xl max-w-md w-full"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              {button ? 'Editar Botão' : 'Novo Botão'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo do Botão *
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowTypeMenu(!showTypeMenu)}
                  className="w-full px-4 py-2 text-left border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 hover:bg-gray-50"
                >
                  {type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Selecione um tipo'}
                </button>
                <CustomButtonsMenu
                  isOpen={showTypeMenu}
                  onClose={() => setShowTypeMenu(false)}
                  onSelect={handleTypeSelect}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Texto do Botão *
              </label>
              <input
                type="text"
                required
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder={type ? LABEL_EXAMPLES[type as keyof typeof LABEL_EXAMPLES] : ''}
              />
            </div>

            {type === 'whatsapp' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número do WhatsApp *
                </label>
                <WhatsAppInput
                  value={message}
                  onChange={setMessage}
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {type === 'email' ? 'Endereço de Email *' :
                   type === 'website' ? 'URL do Site *' :
                   type === 'instagram' ? 'Nome de Usuário *' :
                   type === 'location' ? 'Endereço *' :
                   type === 'custom' ? 'URL de Destino *' :
                   'Link ou Identificador *'}
                </label>
                <input
                  type={type === 'email' ? 'email' : 'text'}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder={type ? PLACEHOLDER_EXAMPLES[type as keyof typeof PLACEHOLDER_EXAMPLES] : ''}
                />
                {type === 'location' && (
                  <p className="mt-1 text-sm text-gray-500">
                    Digite o endereço completo para o Google Maps
                  </p>
                )}
                {type === 'custom' && (
                  <p className="mt-1 text-sm text-gray-500">
                    Digite a URL completa começando com http:// ou https://
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading || !type || !label.trim() || !message.trim()}
                className={`px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2
                  ${(isLoading || !type || !label.trim() || !message.trim()) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Salvar
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}