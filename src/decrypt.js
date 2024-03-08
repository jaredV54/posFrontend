import CryptoJS from 'crypto-js';

const decryptData = (encryptedData, key) => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, key);
  return bytes.toString(CryptoJS.enc.Utf8);
};

export const encryptData = (data, key) => {
  return CryptoJS.AES.encrypt(data, key).toString();
};

export default decryptData;