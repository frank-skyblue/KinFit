import { useEffect, useRef } from 'react';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal = ({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) => {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) onCancel();
    };
    document.addEventListener('keydown', handleKeyDown);

    // Lock background scroll
    const scrollY = window.scrollY;
    const html = document.documentElement;
    html.style.overflow = 'hidden';
    html.style.position = 'fixed';
    html.style.top = `-${scrollY}px`;
    html.style.left = '0';
    html.style.right = '0';
    html.style.width = '100%';

    const backdrop = backdropRef.current;
    const handleTouchMove = (e: TouchEvent) => {
      if (e.target === backdrop) e.preventDefault();
    };
    if (backdrop) backdrop.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (backdrop) backdrop.removeEventListener('touchmove', handleTouchMove);
      html.style.overflow = '';
      html.style.position = '';
      html.style.top = '';
      html.style.left = '';
      html.style.right = '';
      html.style.width = '';
      window.scrollTo(0, scrollY);
    };
  }, [onCancel, isLoading]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isLoading) onCancel();
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 h-dvh bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 overscroll-none"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="bg-white rounded-kin-lg shadow-kin-strong p-6 max-w-md w-full">
      <h3 className="text-xl font-bold font-montserrat text-kin-navy mb-4">{title}</h3>
      <p className="text-kin-teal font-inter mb-6">{message}</p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 bg-kin-stone-200 text-kin-navy rounded-kin-sm font-semibold font-montserrat py-2 px-4 hover:bg-kin-stone-300 transition disabled:opacity-50"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className="flex-1 bg-kin-coral text-white rounded-kin-sm font-semibold font-montserrat py-2 px-4 hover:bg-kin-coral-600 transition disabled:opacity-50"
        >
          {isLoading ? 'Please wait...' : confirmLabel}
        </button>
      </div>
    </div>
  </div>
);
};

export default ConfirmModal;
