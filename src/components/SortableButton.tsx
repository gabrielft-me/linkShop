import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { Edit, Trash, GripVertical } from 'lucide-react';
import type { CustomButton } from '../types';
import { BUTTON_ICONS, BUTTON_COLORS } from './SocialButtons';

interface SortableButtonProps {
  button: CustomButton;
  onEdit: (button: CustomButton) => void;
  onDelete: (id: string) => void;
}

export default function SortableButton({ button, onEdit, onDelete }: SortableButtonProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: button.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = BUTTON_ICONS[button.type as keyof typeof BUTTON_ICONS] || BUTTON_ICONS.custom;
  const color = BUTTON_COLORS[button.type as keyof typeof BUTTON_COLORS] || BUTTON_COLORS.custom;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between ${
        isDragging ? 'shadow-xl' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical size={20} className="text-gray-400" />
        </div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color} text-white`}>
          <Icon size={20} />
        </div>
        <div>
          <h3 className="font-medium">{button.label}</h3>
          <p className="text-sm text-gray-500">{button.type}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onEdit(button)}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
        >
          <Edit size={18} />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onDelete(button.id)}
          className="p-2 text-red-600 hover:bg-red-50 rounded"
        >
          <Trash size={18} />
        </motion.button>
      </div>
    </div>
  );
}