import React from 'react';

export interface TokenLogoProps {
  logo?: string;
  symbol?: string;
  size?: string;
  className?: string;
}

export const TokenLogo: React.FC<TokenLogoProps> = ({ 
  logo, 
  symbol = 'UNKNOWN', 
  size = 'w-10 h-10', 
  className = '' 
}) => {
  console.log("=== TOKEN LOGO DEBUG ===");
  console.log("Token:", symbol);
  console.log("RENDERED TOKEN LOGO", logo);
  console.log("Logo Type:", typeof logo);

  const isImage =
    typeof logo === 'string' &&
    logo.length > 0 &&
    (logo.startsWith('data:image') || logo.startsWith('http') || logo.startsWith('/'));

  if (isImage) {
    return (
      <img
        src={logo}
        alt={`${symbol} Logo`}
        className={`${size} rounded-full object-cover shrink-0 ${className}`}
        onError={(e) => {
          console.error(`[TokenLogo] Image load failed for token: ${symbol}`);
          console.error(`[TokenLogo] Failed URL: ${logo}`);
          // e.nativeEvent or tracking can sometimes give status, but generally we just log the URL.
          console.error(`[TokenLogo] onError trigger reason: Network failure, 404, CORS, or broken URL.`);
          
          const target = e.currentTarget;
          target.style.display = 'none';
          const fallback = document.createElement('span');
          // Use size dimensions to determine text size, or default to text-xl
          fallback.className = 'text-xl shrink-0 flex items-center justify-center w-full h-full';
          fallback.textContent = '🚀';
          target.parentElement?.appendChild(fallback);
        }}
      />
    );
  }

  return <span className={`text-xl shrink-0 flex items-center justify-center w-full h-full ${className}`}>{logo && logo.length > 0 ? logo : '🚀'}</span>;
};
