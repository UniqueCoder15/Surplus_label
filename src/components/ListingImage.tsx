import React, { useState, useEffect } from 'react';
import { Package } from 'lucide-react';
import { resolveListingImageUrl, getCategoryFallbackImage } from '../utils/imageUtils';

export interface ListingImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
  category?: string;
  fallbackSrc?: string;
  alt: string;
}

export const ListingImage: React.FC<ListingImageProps> = ({
  src,
  category,
  fallbackSrc,
  alt,
  className = '',
  style,
  ...props
}) => {
  const fallback = fallbackSrc || getCategoryFallbackImage(category);
  const initialResolved = resolveListingImageUrl(src, category);

  const [currentSrc, setCurrentSrc] = useState<string>(initialResolved);
  const [hasError, setHasError] = useState<boolean>(false);
  const [useSvgPlaceholder, setUseSvgPlaceholder] = useState<boolean>(false);

  useEffect(() => {
    const resolved = resolveListingImageUrl(src, category);
    setCurrentSrc(resolved);
    setHasError(false);
    setUseSvgPlaceholder(false);
  }, [src, category]);

  const handleError = () => {
    if (!hasError && currentSrc !== fallback) {
      setHasError(true);
      setCurrentSrc(fallback);
    } else {
      setUseSvgPlaceholder(true);
    }
  };

  if (useSvgPlaceholder) {
    return (
      <div
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F1F5F9',
          color: '#94A3B8',
          width: '100%',
          height: '100%',
          minHeight: '100px',
          ...style,
        }}
        aria-label={alt}
      >
        <Package size={28} />
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      style={{ objectFit: 'cover', ...style }}
      onError={handleError}
      loading="lazy"
      {...props}
    />
  );
};
