export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1]; // Lấy phần base64 sau dấu phẩy
      resolve(base64Data);
    };
    reader.onerror = (error) => reject(error);
  });
}