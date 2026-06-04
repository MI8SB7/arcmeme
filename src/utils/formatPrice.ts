const SUBSCRIPTS: Record<string, string> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
  '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉'
};

/**
 * Formats a token price with subscript notation for leading zeros or returns a standard formatted string.
 * Returns "--" if the price is undefined, null, NaN, or zero.
 */
export function formatPrice(price?: number | null | string): string {
  if (price === undefined || price === null || price === '' || isNaN(Number(price))) {
    return '--';
  }
  
  const num = Number(price);
  if (num === 0) {
    return '--';
  }
  
  const str = num.toFixed(18); 
  const match = str.match(/^0\.(0+)([1-9][0-9]*)$/);
  
  if (match) {
    const totalZeros = match[1].length;
    if (totalZeros >= 2) {
      const subscriptValue = totalZeros;
      const subscriptStr = String(subscriptValue)
        .split('')
        .map(char => SUBSCRIPTS[char] || char)
        .join('');
      
      const digits = match[2].slice(0, 4);
      return `0.0${subscriptStr}${digits}`;
    }
  }
  
  if (num >= 0.1) {
    return num.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
  }
  return num.toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
}

/**
 * Formats a token price with full normal decimal notation.
 * Returns "--" if the price is undefined, null, NaN, or zero.
 */
export function formatPriceFull(price?: number | null | string): string {
  if (price === undefined || price === null || price === '' || isNaN(Number(price))) {
    return '--';
  }
  
  const num = Number(price);
  if (num === 0) {
    return '--';
  }
  
  if (num >= 0.1) {
    return num.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
  }
  
  const str = num.toFixed(18); 
  const match = str.match(/^0\.(0+)([1-9][0-9]*)$/);
  
  if (match) {
    const zeroCount = match[1].length;
    // Show 4 significant digits
    const decimalsToShow = zeroCount + 4;
    return num.toFixed(decimalsToShow).replace(/0+$/, '').replace(/\.$/, '');
  }
  
  return num.toFixed(8).replace(/0+$/, '').replace(/\.$/, '');
}
