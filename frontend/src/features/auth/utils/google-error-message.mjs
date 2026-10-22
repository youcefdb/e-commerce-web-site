export const getGoogleErrorMessage = (code) => {
  if (code === 'linkRequired') {
    return 'This Google email already belongs to an account. Sign in with that account’s password first, then link Google from your profile. No session was created.';
  }
  if (code === 'legacyRecovery') {
    return 'This is an older Google account that has no saved Google identity mapping. For security, it needs account recovery before sign-in can continue.';
  }
  return 'Google sign-in could not be completed. Please try again.';
};
