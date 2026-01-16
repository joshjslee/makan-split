import { cn } from '../../lib/utils';
import { forwardRef } from 'react';

const Input = forwardRef(function Input(
    { label, error, className, containerClassName, ...props },
    ref
) {
    return (
        <div className={cn('w-full', containerClassName)}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {label}
                </label>
            )}
            <input
                ref={ref}
                className={cn(
                    'w-full px-4 py-3 rounded-xl border border-gray-200 bg-white',
                    'focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent',
                    'placeholder:text-surface-muted transition-all',
                    error && 'border-status-error focus:ring-status-error',
                    className
                )}
                {...props}
            />
            {error && (
                <p className="mt-1 text-sm text-status-error">{error}</p>
            )}
        </div>
    );
});

export default Input;
