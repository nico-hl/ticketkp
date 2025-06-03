import CryptoJS from 'crypto-js';

const SECRET_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'default-secret-key-change-in-production';

export const encrypt = (text: string): string => {
  return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
};

export const decrypt = (ciphertext: string): string => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
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
      subject: decrypt(data.subject),
      description: decrypt(data.description),
      contact: decrypt(data.contact),
    };
  } catch (error) {
    console.error('Decryption failed:', error);
    return data; // Return original data if decryption fails
  }
}; 