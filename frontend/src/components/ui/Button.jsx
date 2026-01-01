import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const Button = ({
    children,
    className,
    variant = 'primary',
    size = 'md',
    icon: Icon,
    endIcon: EndIcon,
    onClick,
    ...props
}) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-lg transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none';

    const variants = {
        primary: 'bg-brand-primary text-white hover:bg-brand-accent hover:shadow-lg focus:ring-brand-primary',
        secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-300',
        ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 hover:text-gray-900 focus:ring-gray-200',
        outline: 'border border-gray-200 bg-transparent hover:bg-gray-50 text-gray-700 focus:ring-gray-200',
        dark: 'bg-brand-dark text-white hover:bg-brand-darker hover:shadow-lg focus:ring-brand-dark',
        white: 'bg-white text-brand-dark border border-gray-100 hover:bg-gray-50 hover:shadow-md focus:ring-gray-200',
    };

    const sizes = {
        sm: 'text-xs px-2.5 py-1.5 gap-1.5',
        md: 'text-sm px-4 py-2 gap-2',
        lg: 'text-base px-6 py-3 gap-2.5',
        icon: 'p-2 aspect-square',
        'icon-sm': 'p-1.5 aspect-square',
    };

    return (
        <button
            className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
            onClick={onClick}
            {...props}
        >
            {Icon && <Icon size={size === 'sm' || size === 'icon-sm' ? 14 : 18} />}
            {children}
            {EndIcon && <EndIcon size={size === 'sm' || size === 'icon-sm' ? 14 : 18} />}
        </button>
    );
};

export default Button;