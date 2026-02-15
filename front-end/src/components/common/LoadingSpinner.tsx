interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeStyles = {
  sm: 'h-6 w-6 border-2',
  md: 'h-12 w-12 border-4',
  lg: 'h-16 w-16 border-4',
} as const;

const LoadingSpinner = ({ size = 'md', className = '' }: LoadingSpinnerProps) => (
  <div
    className={`inline-block animate-spin rounded-full border-solid border-kin-coral border-r-transparent ${sizeStyles[size]} ${className}`}
    role="status"
    aria-label="Loading"
  />
);

export default LoadingSpinner;
