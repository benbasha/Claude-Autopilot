import React from 'react';
import { addRippleEffect } from '../utils/formatters';
import './Button.css';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'normal', 
  onClick, 
  href, 
  className = '', 
  ...props 
}) => {
  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    }
    
    // Add ripple effect for primary buttons
    if (variant === 'primary') {
      addRippleEffect(e, e.currentTarget);
    }
  };

  const baseClasses = `cta-button ${variant} ${size} ${className}`.trim();

  // Handle hover effects
  const handleMouseEnter = (e) => {
    if (variant === 'primary') {
      e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
      e.currentTarget.style.boxShadow = '0 0 40px rgba(0, 212, 255, 0.6)';
    }
  };

  const handleMouseLeave = (e) => {
    if (variant === 'primary') {
      e.currentTarget.style.transform = 'translateY(0) scale(1)';
      e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 212, 255, 0.3)';
    }
  };

  if (href) {
    return (
      <a
        href={href}
        className={baseClasses}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      className={baseClasses}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;