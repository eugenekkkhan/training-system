import { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';

type BtnVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'subtle';
type BtnSize = 'sm' | 'md' | 'lg';
type BtnShape = 'default' | 'pill' | 'square';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: BtnSize;
  shape?: BtnShape;
  loading?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
  full?: boolean;
  children?: ReactNode;
}

interface LinkButtonProps extends LinkProps {
  variant?: BtnVariant;
  size?: BtnSize;
  shape?: BtnShape;
  icon?: ReactNode;
}

export function LinkButton({
  variant = 'secondary',
  size = 'md',
  shape = 'default',
  icon,
  className = '',
  children,
  ...props
}: LinkButtonProps) {
  const classes = [
    'btn2',
    `btn2--${variant}`,
    `btn2--${size}`,
    shape !== 'default' && `btn2--${shape}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Link className={classes} {...props}>
      {icon && <span className="btn2-icon" aria-hidden="true">{icon}</span>}
      {children && <span className="btn2-label">{children}</span>}
    </Link>
  );
}

export function Button({
  variant = 'secondary',
  size = 'md',
  shape = 'default',
  loading = false,
  icon,
  iconRight,
  full = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const classes = [
    'btn2',
    `btn2--${variant}`,
    `btn2--${size}`,
    shape !== 'default' && `btn2--${shape}`,
    full && 'btn2--full',
    loading && 'btn2--loading',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading && <span className="btn2-spinner" aria-hidden="true" />}
      {!loading && icon && <span className="btn2-icon" aria-hidden="true">{icon}</span>}
      {children && <span className="btn2-label">{children}</span>}
      {!loading && iconRight && <span className="btn2-icon btn2-icon--right" aria-hidden="true">{iconRight}</span>}
    </button>
  );
}
