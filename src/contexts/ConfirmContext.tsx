import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Modal } from '../components/ui/Modal';
import { AlertTriangle } from 'lucide-react';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const ConfirmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolvePromise, setResolvePromise] = useState<(val: boolean) => void>();

  const confirm = (opts: ConfirmOptions) => {
    setOptions(opts);
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      setResolvePromise(() => resolve);
    });
  };

  const handleConfirm = () => {
    setIsOpen(false);
    if (resolvePromise) resolvePromise(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (resolvePromise) resolvePromise(false);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <Modal isOpen={isOpen} onClose={handleCancel} title={options?.title || 'تأكيد'}>
        <div className="flex flex-col items-center p-6 text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
            options?.type === 'danger' ? 'bg-red-100 text-red-600' :
            options?.type === 'warning' ? 'bg-orange-100 text-orange-600' :
            'bg-blue-100 text-blue-600'
          }`}>
            <AlertTriangle className="w-8 h-8 shrink-0" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">{options?.title}</h3>
          <p className="text-slate-600 mb-6">{options?.message}</p>
          <div className="flex gap-3 w-full">
            <button 
              onClick={handleCancel}
              className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
            >
              {options?.cancelText || 'إلغاء'}
            </button>
            <button 
              onClick={handleConfirm}
              className={`flex-1 px-4 py-2 text-white rounded-lg font-medium transition-colors ${
                options?.type === 'danger' ? 'bg-red-600 hover:bg-red-700' :
                options?.type === 'warning' ? 'bg-orange-600 hover:bg-orange-700' :
                'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {options?.confirmText || 'تأكيد'}
            </button>
          </div>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error('useConfirm must be used within ConfirmProvider');
  return context.confirm;
};
