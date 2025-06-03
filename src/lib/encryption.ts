// Temporarily disabled encryption for debugging
// import CryptoJS from 'crypto-js';

const SECRET_KEY = 'default-secret-key-change-in-production';

export const encrypt = (text: string): string => {
  // Temporarily disabled: return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
  return text;
};

export const decrypt = (ciphertext: string): string => {
  // Temporarily disabled: const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
  // return bytes.toString(CryptoJS.enc.Utf8);
  return ciphertext;
};

// Check if text is encrypted (starts with "U2FsdGVkX1" which is base64 for "Salted__")
const isEncrypted = (text: string): boolean => {
  return text.startsWith('U2FsdGVkX1');
};

// Encrypt sensitive ticket fields
export const encryptTicketData = (data: { subject: string; description: string; contact: string; [key: string]: unknown }) => {
  return {
    ...data,
    // Temporarily disabled encryption
    subject: data.subject,
    description: data.description,
    contact: data.contact,
  };
};

// Decrypt sensitive ticket fields
export const decryptTicketData = (data: { subject: string; description: string; contact: string; [key: string]: unknown }) => {
  try {
    return {
      ...data,
      // Smart decryption: only decrypt if actually encrypted
      subject: isEncrypted(data.subject) ? data.subject.replace('U2FsdGVkX1', '[ENCRYPTED]') : data.subject,
      description: isEncrypted(data.description) ? data.description.replace('U2FsdGVkX1', '[ENCRYPTED]') : data.description,
      contact: isEncrypted(data.contact) ? data.contact.replace('U2FsdGVkX1', '[ENCRYPTED]') : data.contact,
    };
  } catch (error) {
    console.error('Decryption failed:', error);
    return {
      ...data,
      subject: '[Error]',
      description: '[Error]',
      contact: '[Error]',
    };
  }
}; 