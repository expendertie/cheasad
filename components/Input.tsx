
import React, { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({ icon, ...props }) => {
  return (
    <div className="relative w-full group">
      {icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl pointer-events-none flex items-center justify-center transition-colors duration-300 group-focus-within:text-[var(--accent-pink)]">
          {icon}
        </div>
      )}
      <input
        {...props}
        className={`w-full bg-black/30 border border-transparent rounded-md py-3 text-white placeholder-gray-500 transition-all duration-300 
        focus:outline-none focus:placeholder-transparent focus:border-[var(--accent-pink)] focus:shadow-[0_0_15px_rgba(240,44,132,0.3)] 
        ${icon ? 'pl-12' : 'px-4'}`}
      />
    </div>
  );
};

export default Input;
