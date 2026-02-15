interface ErrorAlertProps {
  message: string;
  className?: string;
}

const ErrorAlert = ({ message, className = '' }: ErrorAlertProps) => (
  <div
    className={`p-4 bg-kin-coral-100 border border-kin-coral-300 rounded-kin-sm ${className}`}
    role="alert"
  >
    <p className="text-kin-coral-800 text-sm font-inter">{message}</p>
  </div>
);

export default ErrorAlert;
