import CryptoJS from 'crypto-js';

const SECRET_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'default-secret-key-change-in-production';

export const encrypt = (text: string): string => {
  return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
};

export const decrypt = (ciphertext: string): string => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

// Check if text is encrypted (starts with "U2FsdGVkX1" which is base64 for "Salted__")
const isEncrypted = (text: string): boolean => {
  return text.startsWith('U2FsdGVkX1');
};

// Encrypt sensitive ticket fields
export const encryptTicketData = (data: { subject: string; description: string; contact: string; [key: string]: unknown }) => {
  return {
    ...data,
    subject: encrypt(data.subject),
    description: encrypt(data.description),
    contact: encrypt(data.contact),
  };
};

// Decrypt sensitive ticket fields
export const decryptTicketData = (data: { subject: string; description: string; contact: string; [key: string]: unknown }) => {
  try {
    return {
      ...data,
      subject: isEncrypted(data.subject) ? decrypt(data.subject) : data.subject,
      description: isEncrypted(data.description) ? decrypt(data.description) : data.description,
      contact: isEncrypted(data.contact) ? decrypt(data.contact) : data.contact,
    };
  } catch (error) {
    console.error('Decryption failed:', error);
    return {
      ...data,
      subject: isEncrypted(data.subject) ? '[Decryption Error]' : data.subject,
      description: isEncrypted(data.description) ? '[Decryption Error]' : data.description,
      contact: isEncrypted(data.contact) ? '[Decryption Error]' : data.contact,
    };
  }
}; 