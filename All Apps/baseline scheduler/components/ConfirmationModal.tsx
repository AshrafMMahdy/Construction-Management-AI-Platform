
import React from 'react';

interface ConfirmationModalProps {
  message: string;
  onConfirm: () => void;
  onDecline: () => void;
  onClose: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ message, onConfirm, onDecline, onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-brand-secondary rounded-xl shadow-2xl p-8 max-w-md w-full"
        onClick={e => e.stopPropagation()} // Prevent click from closing modal
      >
        <h3 className="text-xl font-bold text-brand-light mb-4">Confirm Action</h3>
        <p className="text-brand-muted mb-8">{message}</p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onDecline}
            className="py-2 px-6 bg-brand-muted/40 text-brand-light font-semibold rounded-lg transition-colors hover:bg-brand-muted/60"
          >
            No
          </button>
          <button
            onClick={onConfirm}
            className="py-2 px-6 bg-brand-accent text-brand-primary font-bold rounded-lg transition-colors hover:bg-yellow-400"
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
