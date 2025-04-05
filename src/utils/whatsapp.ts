interface WhatsAppValidationResult {
  isValid: boolean;
  formattedNumber?: string;
  error?: string;
  countryFlag?: string;
}

export function validateWhatsAppNumber(input: string): WhatsAppValidationResult {
  // Remove all non-digit characters
  const cleanNumber = input.replace(/\D/g, '');

  // Check if empty
  if (!cleanNumber) {
    return {
      isValid: false,
      error: 'Número não pode estar vazio'
    };
  }

  // Add default country code if not present
  let numberWithCountry = cleanNumber;
  if (!cleanNumber.startsWith('55')) {
    numberWithCountry = `55${cleanNumber}`;
  }

  // Validate complete number format
  if (numberWithCountry.length !== 13) {
    return {
      isValid: false,
      error: 'Número deve ter 11 dígitos (DDD + número)'
    };
  }

  // Extract and validate DDD
  const ddd = numberWithCountry.substring(2, 4);
  const dddNum = parseInt(ddd);
  if (dddNum < 11 || dddNum > 99) {
    return {
      isValid: false,
      error: 'DDD inválido'
    };
  }

  // Validate if mobile number (must start with 9)
  const number = numberWithCountry.substring(4);
  if (!number.startsWith('9')) {
    return {
      isValid: false,
      error: 'Número de celular deve começar com 9'
    };
  }

  // Format the number for display
  const formatted = `+${numberWithCountry.substring(0, 2)} (${numberWithCountry.substring(2, 4)}) ${numberWithCountry.substring(4, 9)}-${numberWithCountry.substring(9)}`;

  return {
    isValid: true,
    formattedNumber: formatted,
    countryFlag: '🇧🇷' // Brazil flag for Brazilian numbers
  };
}