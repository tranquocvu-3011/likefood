/**
 * LIKEFOOD - Premium Admin Components
 * Dark Gray Enterprise Dashboard Style - 2026 Edition
 */

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AdminPageContainerProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  eyebrow?: string;
}

export function AdminPageContainer({
  title,
  subtitle,
  action,
  children,
  eyebrow = "Admin",
}: AdminPageContainerProps) {
  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-lg border border-zinc-700/50 bg-[#111113]">
        <div className="px-4 py-3">
          <div className="flex flex-col gap-1 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">{eyebrow}</p>
              <div className="flex items-baseline gap-2">
                <h1 className="text-lg font-semibold tracking-tight text-zinc-100">{title}</h1>
                {subtitle ? (
                  <span className="text-sm text-zinc-500">{subtitle}</span>
                ) : null}
              </div>
            </div>
            {action ? <div className="flex flex-wrap items-center gap-2">{action}</div> : null}
          </div>
        </div>
      </section>

      {children}
    </div>
  );
}

export function AdminCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-zinc-700/50 bg-[#111113] p-4",
        className
      )}
    >
      {children}
    </div>
  );
}

export function AdminTableContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-zinc-700/50 bg-[#111113]",
        className
      )}
    >
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

/**
 * Premium Admin Button Variants
 */
interface AdminButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export function AdminButton({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className,
  disabled,
  onClick,
  type = 'button'
}: AdminButtonProps) {
  const variants = {
    primary: 'bg-teal-500 text-white hover:bg-teal-400 border-teal-500 shadow-lg shadow-teal-500/20',
    secondary: 'bg-zinc-700 text-zinc-200 border-zinc-600 hover:bg-zinc-600',
    ghost: 'bg-transparent text-zinc-300 hover:text-white hover:bg-zinc-800/70',
    danger: 'bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25',
  };
  
  const sizes = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-3.5 py-2 text-sm',
    lg: 'px-5 py-2.5 text-sm',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors border',
        variants[variant],
        sizes[size],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {children}
    </button>
  );
}

/**
 * Premium Status Badge
 */
interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

export function StatusBadge({ status, variant = 'default' }: StatusBadgeProps) {
  const variants = {
    default: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    error: 'bg-red-500/10 text-red-400 border-red-500/20',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };

  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide border',
      variants[variant]
    )}>
      {status}
    </span>
  );
}

/**
 * Premium Input
 */
interface AdminInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function AdminInput({ label, error, className, ...props }: AdminInputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-xs font-medium text-zinc-400">{label}</label>
      )}
      <input
        className={cn(
          'w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}

/**
 * Premium Select
 */
interface AdminSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Array<{ value: string; label: string }>;
}

export function AdminSelect({ label, options, className, ...props }: AdminSelectProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-xs font-medium text-zinc-400">{label}</label>
      )}
      <select
        className={cn(
          'w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Premium Empty State
 */
interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && (
        <div className="mb-4 text-zinc-600">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-medium text-zinc-300">{title}</h3>
      {description && (
        <p className="mt-1 text-xs text-zinc-500 max-w-sm">{description}</p>
      )}
      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  );
}

/**
 * Premium Loading Spinner
 */
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export function LoadingSpinner({ size = 'md', text }: LoadingSpinnerProps) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <div className={cn('border-2 border-teal-500/20 border-t-teal-500 rounded-full animate-spin', sizes[size])} />
      {text && (
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{text}</p>
      )}
    </div>
  );
}
