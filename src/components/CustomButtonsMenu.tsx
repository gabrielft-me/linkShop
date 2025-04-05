import React from 'react';
import { motion } from 'framer-motion';
import { Facebook, Instagram, Youtube, Twitter, Linkedin, Globe, Mail, Phone, MapPin } from 'lucide-react';

const BUTTON_TYPES = [
  { id: 'whatsapp', label: 'WhatsApp', icon: Phone, color: 'bg-green-500' },
  { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'bg-pink-500' },
  { id: 'facebook', label: 'Facebook', icon: Facebook, color: 'bg-blue-600' },
  { id: 'youtube', label: 'YouTube', icon: Youtube, color: 'bg-red-600' },
  { id: 'twitter', label: 'Twitter', icon: Twitter, color: 'bg-blue-400' },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'bg-blue-700' },
  { id: 'website', label: 'Website', icon: Globe, color: 'bg-purple-500' },
  { id: 'email', label: 'Email', icon: Mail, color: 'bg-gray-600' },
  { id: 'location', label: 'Localização', icon: MapPin, color: 'bg-orange-500' },
  { id: 'custom', label: 'Link Personalizado', icon: Globe, color: 'bg-gray-500' }
];

interface CustomButtonsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: string) => void;
}

export default function CustomButtonsMenu({ isOpen, onClose, onSelect }: CustomButtonsMenuProps) {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute right-0 mt-2 w-64 max-h-[calc(60vh-100px)] overflow-y-auto bg-white rounded-lg shadow-lg z-50 border border-gray-200"
    >
      <div className="p-2">
        {BUTTON_TYPES.map((type) => (
          <motion.button
            key={type.id}
            whileHover={{ scale: 1.02 }}
            onClick={() => {
              onSelect(type.id);
              onClose();
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white mb-2 ${type.color} hover:opacity-90`}
          >
            <type.icon size={20} />
            <span>{type.label}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}