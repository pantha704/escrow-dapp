/**
 * Utility functions for formatting token amounts
 */

/**
 * Format token amount from smallest units to human readable format
 * @param amount Amount in smallest units (like lamports)
 * @param decimals Number of decimals for the token (default: 9 for SOL)
 * @returns Formatted string with appropriate decimal places
 */
export function formatTokenAmount(amount: string | number, decimals: number = 9): string {
  const amountBN = typeof amount === 'string' ? parseFloat(amount) : amount;
  const divisor = Math.pow(10, decimals);
  const formatted = amountBN / divisor;
  
  // Format with appropriate decimal places
  if (formatted >= 1) {
    return formatted.toLocaleString(undefined, { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 6 
    });
  } else {
    return formatted.toFixed(Math.min(decimals, 9));
  }
}

/**
 * Format token amount with symbol
 * @param amount Amount in smallest units
 * @param symbol Token symbol (optional)
 * @param decimals Number of decimals for the token
 * @returns Formatted string with symbol
 */
export function formatTokenAmountWithSymbol(
  amount: string | number, 
  symbol?: string, 
  decimals: number = 9
): string {
  const formatted = formatTokenAmount(amount, decimals);
  return symbol ? `${formatted} ${symbol}` : formatted;
}

/**
 * Truncate long addresses for display
 * @param address Full address string
 * @param startChars Number of characters to show at start (default: 4)
 * @param endChars Number of characters to show at end (default: 4)
 * @returns Truncated address string
 */
export function truncateAddress(address: string, startChars: number = 4, endChars: number = 4): string {
  if (address.length <= startChars + endChars) {
    return address;
  }
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}