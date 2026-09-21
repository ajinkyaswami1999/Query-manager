export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check minimum length
  if (password.length < 10) {
    errors.push('Password must be at least 10 characters long');
  }

  // Check first letter is capital
  if (password.length > 0 && !/^[A-Z]/.test(password)) {
    errors.push('First letter must be uppercase');
  }

  // Check for at least 2 special characters
  const specialCharCount = (password.match(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/g) || []).length;
  if (specialCharCount < 2) {
    errors.push('Must contain at least 2 special characters');
  }

  // Check for at least 4 numbers
  const numberCount = (password.match(/\d/g) || []).length;
  if (numberCount < 4) {
    errors.push('Must contain at least 4 numbers');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};