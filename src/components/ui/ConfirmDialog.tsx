import React from 'react';
import { createPortal } from 'react-dom';
import Button from './Button';
import { AlertCircle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onCancel?: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText = 'OK',
  cancelText = 'キャンセル',
}) => {
  // 確認ボタンのハンドラ
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  // キャンセルボタンのハンドラ
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-gray-800 bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full animate-fade-in mx-auto">
        <div className="text-center">
          <AlertCircle size={32} className="mx-auto mb-4 text-amber-500" />
          {title && <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>}
          <p className="text-gray-700 mb-6">{message}</p>
          <div className="flex justify-center space-x-4">
            {onCancel && (
              <Button
                variant="outline"
                onClick={handleCancel}
                className="min-w-32"
              >
                {cancelText}
              </Button>
            )}
            <Button
              variant="primary"
              onClick={handleConfirm}
              className="min-w-32"
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmDialog; 