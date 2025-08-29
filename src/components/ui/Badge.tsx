import { HTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'inline-flex items-center rounded-full font-medium',
          {
            'px-2 py-1 text-xs': size === 'sm',
            'px-2.5 py-0.5 text-sm': size === 'md',
          },
          {
            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300': variant === 'default',
            'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400': variant === 'success',
            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400': variant === 'warning',
            'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400': variant === 'danger',
            'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400': variant === 'info',
          },
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
