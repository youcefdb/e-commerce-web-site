export const MAX_POSTAL_CODE_LENGTH = 32;

export function normalizePostalCode(value) {
  if (typeof value !== 'string') return null;

  const postalCode = value.trim();
  return postalCode.length > 0 && postalCode.length <= MAX_POSTAL_CODE_LENGTH
    ? postalCode
    : null;
}
