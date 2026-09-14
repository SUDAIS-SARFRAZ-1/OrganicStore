import { useEffect, useRef } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
  PackageCheck,
  Ban,
} from 'lucide-react';

/**
 * Reusable Modern Confirmation / Alert Dialog
 * Replaces native window.confirm() and alert() with an organic-store styled modal.
 */
export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Please Confirm',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary', // 'primary' | 'success' | 'danger' | 'warning' | 'info'
  isLoading = false,
  isAlertOnly = false,
  icon: CustomIcon,
}) {
  const confirmBtnRef = useRef(null);
  const previousFocusRef = useRef(null);

  // Focus management and Escape key
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
      document.body.style.overflow = 'hidden';

      // Set focus to primary action button
      const timer = setTimeout(() => {
        if (confirmBtnRef.current) {
          confirmBtnRef.current.focus();
        }
      }, 50);

      const handleKeyDown = (e) => {
        if (e.key === 'Escape' && !isLoading) {
          onClose();
        }
      };

      document.addEventListener('keydown', handleKeyDown);

      return () => {
        clearTimeout(timer);
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'unset';
        if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
          previousFocusRef.current.focus();
        }
      };
    }
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          iconBg: 'bg-green-100 text-[#6a9739]',
          defaultIcon: PackageCheck,
          btnBg: 'bg-[#6a9739] hover:bg-[#58802d] text-white',
        };
      case 'danger':
        return {
          iconBg: 'bg-red-100 text-red-600',
          defaultIcon: Ban,
          btnBg: 'bg-red-600 hover:bg-red-700 text-white',
        };
      case 'warning':
        return {
          iconBg: 'bg-amber-100 text-amber-600',
          defaultIcon: AlertTriangle,
          btnBg: 'bg-amber-600 hover:bg-amber-700 text-white',
        };
      case 'info':
        return {
          iconBg: 'bg-blue-100 text-blue-600',
          defaultIcon: Info,
          btnBg: 'bg-blue-600 hover:bg-blue-700 text-white',
        };
      default:
        return {
          iconBg: 'bg-green-100 text-[#6a9739]',
          defaultIcon: CheckCircle2,
          btnBg: 'bg-[#6a9739] hover:bg-[#58802d] text-white',
        };
    }
  };

  const vStyles = getVariantStyles();
  const IconComponent = CustomIcon || vStyles.defaultIcon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Dimmed Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={() => !isLoading && onClose()}
        aria-hidden="true"
      />

      {/* Dialog Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby={message ? 'confirm-modal-description' : undefined}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 z-10 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Close Button */}
        {!isLoading && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="absolute top-4 right-4 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-start gap-4">
          {/* Icon Badge */}
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${vStyles.iconBg}`} aria-hidden="true">
            <IconComponent className="w-6 h-6" />
          </div>

          {/* Text Content */}
          <div className="flex-1 pr-4">
            <h3 id="confirm-modal-title" className="text-base font-bold text-gray-900 leading-snug">{title}</h3>
            {message && <p id="confirm-modal-description" className="mt-1.5 text-xs text-gray-600 leading-relaxed">{message}</p>}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100">
          {!isAlertOnly && (
            <button
              type="button"
              disabled={isLoading}
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              {cancelText}
            </button>
          )}

          <button
            ref={confirmBtnRef}
            type="button"
            disabled={isLoading}
            onClick={() => {
              if (onConfirm) onConfirm();
              else onClose();
            }}
            className={`px-5 py-2 text-xs font-bold rounded-xl transition-all shadow-xs hover:shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2 ${vStyles.btnBg}`}
          >
            {isLoading && (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
