import { cn } from '../../lib/utils';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Layout({ children, className }) {
    return (
        <div className={cn('min-h-screen bg-surface flex flex-col', className)}>
            {children}
        </div>
    );
}

export function Header({ title, showBack = false, rightAction, leftAction }) {
    const navigate = useNavigate();

    return (
        <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3">
            <div className="flex items-center justify-between max-w-lg mx-auto">
                <div className="flex items-center gap-2">
                    {/* Render leftAction if provided, effectively overriding the default back button behavior/icon if logic dictates, 
                        BUT typically leftAction is for a specific custom button. 
                        If leftAction is null, check showBack. */}
                    {leftAction}

                    {!leftAction && showBack && (
                        <button
                            onClick={() => navigate(-1)}
                            className="p-1 -ml-1 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <ChevronLeft className="w-6 h-6 text-gray-700" />
                        </button>
                    )}

                    <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
                </div>
                {rightAction && <div>{rightAction}</div>}
            </div>
        </header>
    );
}

export function Main({ children, className }) {
    return (
        <main className={cn('flex-1 px-4 py-6 max-w-lg mx-auto w-full', className)}>
            {children}
        </main>
    );
}

export function BottomBar({ children, className }) {
    return (
        <div className={cn(
            'sticky bottom-0 bg-white border-t border-gray-100 px-4 py-4 safe-bottom',
            className
        )}>
            <div className="max-w-lg mx-auto">
                {children}
            </div>
        </div>
    );
}
