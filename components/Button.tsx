
import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({ children, isLoading = false, ...props }) => {
  return (
    <button
      {...props}
      disabled={isLoading || props.disabled}
      className={`relative w-full flex justify-center items-center bg-transparent border border-[var(--accent-pink)] text-[var(--accent-pink)] font-semibold py-3 px-4 rounded-md transition-all duration-300 ease-in-out
      hover:bg-[var(--accent-pink)] hover:text-white hover:shadow-[0_0_20px_var(--accent-pink)] hover:scale-105
      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-[var(--accent-pink)]
      disabled:border-gray-600 disabled:text-gray-600 disabled:bg-transparent disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none`}
    >
      {isLoading ? (
        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
