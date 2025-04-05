import React from 'react';
import { motion } from 'framer-motion';
import { Facebook, Instagram, Youtube, Twitter, Linkedin, Globe, Mail, Phone, MapPin } from 'lucide-react';
import type { CustomButton } from '../types';

export const BUTTON_ICONS = {
  whatsapp: Phone,
  instagram: Instagram,
  facebook: Facebook,
  youtube: Youtube,
  twitter: Twitter,
  linkedin: Linkedin,
  website: Globe,
  email: Mail,
  location: MapPin,
  custom: Globe
};

export const BUTTON_COLORS = {
  whatsapp: 'bg-green-500',
  instagram: 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500',
  facebook: 'bg-blue-600',
  youtube: 'bg-red-600',
  twitter: 'bg-blue-400',
  linkedin: 'bg-blue-700',
  website: 'bg-purple-500',
  email: 'bg-gray-600',
  location: 'bg-orange-500',
  custom: 'bg-gray-500'
};

interface SocialButtonsProps {
  buttons: CustomButton[];
}

export default function SocialButtons({ buttons }: SocialButtonsProps) {
  const handleClick = (button: CustomButton) => {
    let url = '';
    switch (button.type) {
      case 'whatsapp':
        url = `https://wa.me/${button.message}`;
        break;
      case 'instagram':
        url = `https://instagram.com/${button.message}`;
        break;
      case 'facebook':
        url = button.message;
        break;
      case 'youtube':
        url = button.message;
        break;
      case 'twitter':
        url = `https://twitter.com/${button.message}`;
        break;
      case 'linkedin':
        url = button.message;
        break;
      case 'website':
        url = button.message;
        break;
      case 'email':
        url = `mailto:${button.message}`;
        break;
      case 'location':
        url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(button.message)}`;
        break;
      case 'custom':
        url = button.message;
        break;
    }
    window.open(url, '_blank');
  };

  // Sort buttons by position
  const sortedButtons = [...buttons].sort((a, b) => (a.position || 0) - (b.position || 0));

  return (
    <div className="flex flex-col gap-2 max-w-sm mx-auto w-full px-4">
      {sortedButtons.map((button) => {
        const Icon = BUTTON_ICONS[button.type as keyof typeof BUTTON_ICONS] || Globe;
        const color = BUTTON_COLORS[button.type as keyof typeof BUTTON_COLORS] || 'bg-gray-500';

        return (
          <motion.button
            key={button.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleClick(button)}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 md:py-3 rounded-lg text-white ${color} hover:opacity-90 transition-opacity text-sm md:text-base`}
          >
            <Icon size={18} className="md:w-5 md:h-5" />
            <span>{button.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}