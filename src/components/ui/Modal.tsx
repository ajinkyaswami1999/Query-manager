import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md'
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg sm:max-w-xl',
    lg: 'max-w-xl sm:max-w-2xl lg:max-w-4xl',
    xl: 'max-w-2xl sm:max-w-4xl lg:max-w-6xl'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bounce-in">
      <div className="flex items-end justify-center min-h-screen pt-4 px-2 sm:px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-lg transition-all duration-500" 
          onClick={onClose}
        ></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        {/* Modal */}
        <div className={`inline-block align-bottom bg-white/95 backdrop-blur-xl rounded-xl sm:rounded-2xl px-4 sm:px-6 pt-4 sm:pt-6 pb-4 sm:pb-6 text-left overflow-hidden shadow-2xl transform transition-all duration-500 sm:my-8 sm:align-middle sm:w-full ${sizeClasses[size]} lg:p-8 border border-gray-200/50 gradient-border`}>
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-lg sm:rounded-xl bg-gray-100 p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gradient-to-r hover:from-gray-200 hover:to-red-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 hover:scale-110"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
          <div className="max-h-[60vh] sm:max-h-[70vh] overflow-y-auto slide-in-left">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};