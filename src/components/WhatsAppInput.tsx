import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

interface WhatsAppInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

// Country codes with flags and formatting rules
const COUNTRIES = [
  { code: '55', name: 'Brasil', flag: '🇧🇷', format: '(##) #####-####', placeholder: '(11) 99999-9999' },
  { code: '1', name: 'Estados Unidos', flag: '🇺🇸', format: '(###) ###-####', placeholder: '(555) 123-4567' },
  { code: '351', name: 'Portugal', flag: '🇵🇹', format: '### ### ###', placeholder: '912 345 678' },
  { code: '34', name: 'Espanha', flag: '🇪🇸', format: '### ### ###', placeholder: '612 345 678' },
  { code: '44', name: 'Reino Unido', flag: '🇬🇧', format: '#### ######', placeholder: '7911 123456' },
  { code: '49', name: 'Alemanha', flag: '🇩🇪', format: '### #######', placeholder: '151 2345678' },
  { code: '33', name: 'França', flag: '🇫🇷', format: '# ## ## ## ##', placeholder: '6 12 34 56 78' },
  { code: '39', name: 'Itália', flag: '🇮🇹', format: '### ### ####', placeholder: '312 345 6789' },
  { code: '81', name: 'Japão', flag: '🇯🇵', format: '## #### ####', placeholder: '90 1234 5678' },
  { code: '86', name: 'China', flag: '🇨🇳', format: '### #### ####', placeholder: '138 1234 5678' },
];

export default function WhatsAppInput({ value, onChange, className = '' }: WhatsAppInputProps) {
  const [showCountries, setShowCountries] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [localValue, setLocalValue] = useState('');
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    // Extract country code and number from the full value
    if (value) {
      const country = COUNTRIES.find(c => value.startsWith(c.code));
      if (country) {
        setSelectedCountry(country);
        setLocalValue(value.slice(country.code.length));
      } else {
        setLocalValue(value);
      }
    } else {
      setLocalValue('');
    }
  }, [value]);

  const formatNumber = (number: string, format: string) => {
    let result = '';
    let numberIndex = 0;

    for (let i = 0; i < format.length && numberIndex < number.length; i++) {
      if (format[i] === '#') {
        result += number[numberIndex];
        numberIndex++;
      } else {
        result += format[i];
        if (numberIndex < number.length && number[numberIndex] === format[i]) {
          numberIndex++;
        }
      }
    }

    return result;
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, '');
    setLocalValue(input);

    // Validate number length based on country
    const minLength = selectedCountry.format.replace(/[^#]/g, '').length;
    if (input.length > 0 && input.length < minLength) {
      setError(`Número incompleto para ${selectedCountry.name}`);
    } else {
      setError(undefined);
    }

    // Update parent with full number including country code
    onChange(selectedCountry.code + input);
  };

  const selectCountry = (country: typeof COUNTRIES[0]) => {
    setSelectedCountry(country);
    setShowCountries(false);
    onChange(country.code + localValue);
  };

  return (
    <div className="space-y-1">
      <div className="relative">
        <div className="flex">
          <button
            type="button"
            onClick={() => setShowCountries(!showCountries)}
            className={`flex items-center gap-2 px-3 py-2 border-y border-l border-gray-300 rounded-l-lg hover:bg-gray-50 ${
              error ? 'border-red-300' : ''
            }`}
          >
            <span className="text-xl">{selectedCountry.flag}</span>
            <span className="text-sm text-gray-600">+{selectedCountry.code}</span>
            <ChevronDown size={16} className={`text-gray-400 transition-transform ${showCountries ? 'rotate-180' : ''}`} />
          </button>
          <input
            type="tel"
            value={formatNumber(localValue, selectedCountry.format)}
            onChange={handleNumberChange}
            className={`flex-1 px-4 py-2 border-y border-r border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              error ? 'border-red-300' : ''
            } ${className}`}
            placeholder={selectedCountry.placeholder}
          />
        </div>

        <AnimatePresence>
          {showCountries && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-50 top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-64 overflow-y-auto"
            >
              {COUNTRIES.map(country => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => selectCountry(country)}
                  className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 ${
                    selectedCountry.code === country.code ? 'bg-blue-50' : ''
                  }`}
                >
                  <span className="text-xl">{country.flag}</span>
                  <div className="flex-1 text-left">
                    <div className="font-medium">{country.name}</div>
                    <div className="text-sm text-gray-500">+{country.code}</div>
                  </div>
                  {selectedCountry.code === country.code && (
                    <Check size={16} className="text-blue-500" />
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      <p className="text-sm text-gray-500">
        Selecione o país e digite o número sem o código do país
      </p>
    </div>
  );
}