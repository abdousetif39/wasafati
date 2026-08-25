import React from 'react';
import { Modal } from '../ui/Modal';
import { MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NewMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  senderName: string;
  isAdmin: boolean;
  userId?: string;
}

export const NewMessageModal: React.FC<NewMessageModalProps> = ({ isOpen, onClose, title, message, senderName, isAdmin, userId }) => {
  const navigate = useNavigate();

  const handleOpen = () => {
    onClose();
    if (isAdmin) {
      navigate(userId ? `/admin/chat?userId=${userId}` : '/admin/chat');
    } else {
      navigate('/profile?tab=messages');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col items-center p-6 text-center">
        <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-4">
          <MessageCircle className="w-8 h-8 shrink-0" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-slate-600 mb-6">{message}</p>
        <div className="flex gap-3 w-full">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
          >
            لاحقاً
          </button>
          <button 
            onClick={handleOpen}
            className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
          >
            عرض المحادثة
          </button>
        </div>
      </div>
    </Modal>
  );
};
