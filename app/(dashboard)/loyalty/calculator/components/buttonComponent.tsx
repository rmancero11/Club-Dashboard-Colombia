import React from 'react';
import classNames from 'classnames';

interface ButtonProps {
  onClick: () => void;
  isSelected: boolean;
  label: string;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ onClick, isSelected, label, className }) => {
  const buttonClasses = classNames(
    'rounded-full',
    {
      'bg-primary text-white': isSelected,
      'bg-white text-primary border border-primary hover:bg-primary hover:text-white': !isSelected
    },
    'font-bold py-2 px-4 rounded mx-2 my-2',
    className
  );

  return (
    <button
      className={buttonClasses}
      onClick={onClick}
      disabled={isSelected}
    >
      {label} 
    </button>
  );
};

export default Button;
