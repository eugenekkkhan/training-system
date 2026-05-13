import { HTMLAttributes, ReactNode } from 'react';

type CardVariant = 'default' | 'elevated' | 'flat' | 'outlined' | 'tinted';
type CardPad = 'none' | 'sm' | 'md' | 'lg';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  pad?: CardPad;
  children: ReactNode;
}

export function Card({ variant = 'default', pad = 'md', className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`card2 card2--${variant} card2--pad-${pad}${className ? ` ${className}` : ''}`}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardSectionProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

Card.Header = function CardHeader({ className = '', children, ...props }: CardSectionProps) {
  return (
    <div className={`card2-header${className ? ` ${className}` : ''}`} {...props}>
      {children}
    </div>
  );
};

Card.Body = function CardBody({ className = '', children, ...props }: CardSectionProps) {
  return (
    <div className={`card2-body${className ? ` ${className}` : ''}`} {...props}>
      {children}
    </div>
  );
};

Card.Footer = function CardFooter({ className = '', children, ...props }: CardSectionProps) {
  return (
    <div className={`card2-footer${className ? ` ${className}` : ''}`} {...props}>
      {children}
    </div>
  );
};

/* Inset block — uses inner_r derived from the card's outer radius */
Card.Inset = function CardInset({ className = '', children, ...props }: CardSectionProps) {
  return (
    <div className={`card2-inset${className ? ` ${className}` : ''}`} {...props}>
      {children}
    </div>
  );
};
