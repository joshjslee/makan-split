import { cn } from '../../lib/utils';

export default function Card({ children, className, ...props }) {
    return (
        <div className={cn('card', className)} {...props}>
            {children}
        </div>
    );
}

export function CardHeader({ children, className }) {
    return (
        <div className={cn('mb-3', className)}>
            {children}
        </div>
    );
}

export function CardTitle({ children, className }) {
    return (
        <h3 className={cn('text-lg font-semibold text-gray-900', className)}>
            {children}
        </h3>
    );
}

export function CardDescription({ children, className }) {
    return (
        <p className={cn('text-sm text-surface-muted', className)}>
            {children}
        </p>
    );
}

export function CardContent({ children, className }) {
    return (
        <div className={cn('', className)}>
            {children}
        </div>
    );
}

export function CardFooter({ children, className }) {
    return (
        <div className={cn('mt-4 pt-4 border-t border-gray-100', className)}>
            {children}
        </div>
    );
}
