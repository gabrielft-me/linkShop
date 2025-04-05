import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { CURRENCY_OPTIONS } from '../types';

interface CurrencySelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function CurrencySelector({ value, onChange }: CurrencySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedCurrency = CURRENCY_OPTIONS.find(c => c.symbol === value) || CURRENCY_OPTIONS[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 hover:bg-gray-50"
      >
        <span>{selectedCurrency.label}</span>
        <ChevronDown
          size={20}
          className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg"
          >
            <div className="py-1">
              {CURRENCY_OPTIONS.map((currency) => (
                <button
                  key={currency.symbol}
                  type="button"
                  onClick={() => {
                    onChange(currency.symbol);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-50 ${
                    currency.symbol === value ? 'bg-blue-50 text-blue-700' : ''
                  }`}
                >
                  {currency.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}