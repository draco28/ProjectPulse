/**
 * Calculates the total price including tax
 *
 * @param price - The base price before tax
 * @param taxRate - The tax rate as a decimal (e.g., 0.1 for 10%)
 * @returns The total price with tax applied
 *
 * @example
 * ```typescript
 * const total = calculateTotal(100, 0.1);
 * console.log(total); // 110
 * ```
 */
export function calculateTotal(price: number, taxRate: number): number {
  return price * (1 + taxRate);
}
