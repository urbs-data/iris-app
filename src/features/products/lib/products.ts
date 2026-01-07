export const generatePhotoUrl = (name: string): string => {
  const photoId =
    Math.abs(
      name.split('').reduce((hash, char) => {
        return (hash << 5) - hash + char.charCodeAt(0);
      }, 0)
    ) % 20;
  return `https://api.slingacademy.com/public/sample-products/${photoId}.png`;
};
