import toast from 'react-hot-toast';

export interface ApiError {
  code?: string;
  message: string;
  details?: string;
  hint?: string;
}

export const handleSupabaseError = (error: any, operation: string = 'operation'): void => {
  console.error(`${operation} error:`, error);

  // Network errors
  if (!navigator.onLine) {
    toast.error('No internet connection. Please check your network and try again.');
    return;
  }

  // Supabase specific errors
  if (error?.code) {
    switch (error.code) {
      // Authentication errors
      case 'PGRST301':
        toast.error('Access denied: You don\'t have permission to perform this action');
        break;
      case 'PGRST116':
        toast.error('Resource not found or has been deleted');
        break;
      case 'PGRST204':
        toast.error('No data found matching your request');
        break;

      // Database constraint errors
      case '23505':
        if (error.message.includes('email')) {
          toast.error('This email address is already registered');
        } else if (error.message.includes('name')) {
          toast.error('This name already exists. Please choose a different name');
        } else {
          toast.error('This item already exists. Please use unique values');
        }
        break;
      case '23503':
        toast.error('Invalid reference: Please check your selections and try again');
        break;
      case '23514':
        toast.error('Data validation failed: Please check your input values');
        break;

      // Permission errors
      case '42501':
        toast.error('Database permission error. Please contact your administrator');
        break;
      case '42P01':
        toast.error('Database table not found. Please contact your administrator');
        break;

      // Connection errors
      case 'ECONNREFUSED':
      case 'ENOTFOUND':
      case 'ETIMEDOUT':
        toast.error('Unable to connect to the database. Please try again later');
        break;

      // Rate limiting
      case '429':
        toast.error('Too many requests. Please wait a moment and try again');
        break;

      // Authentication specific
      case 'invalid_credentials':
        toast.error('Invalid email or password');
        break;
      case 'email_not_confirmed':
        toast.error('Please confirm your email address before signing in');
        break;
      case 'too_many_requests':
        toast.error('Too many login attempts. Please try again later');
        break;
      case 'weak_password':
        toast.error('Password is too weak. Please choose a stronger password');
        break;
      case 'signup_disabled':
        toast.error('New user registration is currently disabled');
        break;

      default:
        // Generic error with code
        toast.error(`${operation} failed: ${error.message || 'Unknown error occurred'}`);
    }
  } else if (error?.message) {
    // Handle specific error messages
    const message = error.message.toLowerCase();
    
    if (message.includes('relation') && message.includes('does not exist')) {
      toast.error('Database schema incomplete. Please run migrations or contact administrator');
    } else if (message.includes('foreign key')) {
      toast.error('Data relationship error. Please check your selections');
    } else if (message.includes('network')) {
      toast.error('Network error: Please check your connection and try again');
    } else if (message.includes('timeout')) {
      toast.error('Request timed out. Please try again');
    } else if (message.includes('invalid login credentials')) {
      toast.error('Invalid email or password');
    } else {
      toast.error(`${operation} failed: ${error.message}`);
    }
  } else {
    // Fallback for unknown errors
    toast.error(`${operation} failed: An unexpected error occurred`);
  }
};

export const handleNetworkError = (operation: string = 'operation'): void => {
  toast.error(`Network error: Failed to ${operation}. Please check your connection`);
};

export const showSuccessMessage = (message: string): void => {
  toast.success(message);
};

export const showInfoMessage = (message: string): void => {
  toast(message, {
    icon: 'ℹ️',
    style: {
      background: '#3B82F6',
      color: '#fff',
    },
  });
};

export const showWarningMessage = (message: string): void => {
  toast(message, {
    icon: '⚠️',
    style: {
      background: '#F59E0B',
      color: '#fff',
    },
  });
};