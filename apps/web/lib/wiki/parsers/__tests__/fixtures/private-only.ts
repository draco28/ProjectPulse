/**
 * Internal helper function (not exported)
 *
 * @param data - Some data
 * @returns Processed data
 */
function internalHelper(data: string): string {
  return data.trim();
}

/**
 * Another private function
 */
function anotherPrivate(): void {
  console.log('Private');
}

// No exports in this file - all functions are private
