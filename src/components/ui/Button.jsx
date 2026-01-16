import { cn } from '../../lib/utils';

const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 rounded-xl py-2 px-4',
    danger: 'w-full py-4 px-6 bg-status-error text-white font-semibold rounded-2xl hover:bg-red-600 active:scale-[0.98] transition-all',
};

const sizes = {
    sm: 'py-2 px-4 text-sm',
    md: 'py-3 px-5',
    lg: 'py-4 px-6 text-lg',
};

export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    className,
    disabled,
    leftIcon,
    rightIcon,
    ...props
}) {
    return (
        <button
            className={cn(
                'inline-flex items-center justify-center gap-2 font-medium transition-all',
                variants[variant],
                sizes[size],
                disabled && 'opacity-50 cursor-not-allowed',
                className
            )}
            disabled={disabled}
            {...props}
        >
            {leftIcon && <span className="w-5 h-5">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="w-5 h-5">{rightIcon}</span>}
        </button>
    );
}
