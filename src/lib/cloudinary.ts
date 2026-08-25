export function optimizeCloudinaryUrl(url: string, width?: number): string {
  if (!url || !url.includes('cloudinary.com')) return url;
  
  // Check if it already has transformations
  if (url.includes('/upload/q_auto')) return url;
  
  let transformations = 'q_auto,f_auto';
  if (width) {
    transformations += `,w_${width},c_limit`;
  }
  
  return url.replace('/upload/', `/upload/${transformations}/`);
}
