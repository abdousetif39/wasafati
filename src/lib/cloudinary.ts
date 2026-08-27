export function optimizeCloudinaryUrl(url: string, width?: number): string {
  if (!url || !url.includes('cloudinary.com')) return url;
  
  if (url.includes('/upload/')) {
    const parts = url.split('/upload/');
    let transformations = ['q_auto', 'f_auto'];
    if (width) {
      transformations.push(`w_${width}`);
      transformations.push('c_limit');
    }
    
    // Clean up existing transformations if any to avoid duplication
    let restOfUrl = parts[1];
    if (restOfUrl.includes('/')) {
        const firstSegment = restOfUrl.split('/')[0];
        if (firstSegment.includes('q_') || firstSegment.includes('f_') || firstSegment.includes('w_')) {
            restOfUrl = restOfUrl.substring(firstSegment.length + 1);
        }
    }
    
    return `${parts[0]}/upload/${transformations.join(',')}/${restOfUrl}`;
  }
  return url;
}

export function getResponsiveImageProps(url: string, baseWidth: number = 640) {
  if (!url || !url.includes('cloudinary.com')) {
    return { src: url };
  }

  const src = optimizeCloudinaryUrl(url, baseWidth);
  const widths = [160, 240, 320, 480, 640, 800, 1024, 1200, 1600];
  const srcSet = widths
    .map((w) => `${optimizeCloudinaryUrl(url, w)} ${w}w`)
    .join(', ');

  return {
    src,
    srcSet,
  };
}
