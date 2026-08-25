import { useToast } from '../../../contexts/ToastContext';
import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { Mail, Trash2, CheckCircle, Search, Calendar, User, AlignLeft } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';

interface Message {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  status?: string;
}

export default function MessageList() {
  const toast = useToast();
    const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'contactMessages'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(data);
      setLoading(false);
    }, (err: any) => { if (err.code !== 'permission-denied') console.error('Snapshot error:', err); });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'contactMessages', id));
      toast.success('تم بنجاح');
      setDeleteConfirm(null);
    } catch (error) {
      toast.error('حدث خطأ');
    }
  };

  const markAsRead = async (message: Message) => {
    if (message.status !== 'read') {
      try {
        await updateDoc(doc(db, 'contactMessages', message.id), { status: 'read' });
      } catch (error) {
        if ((error as any)?.code !== 'permission-denied') { console.error('Error marking as read:', error); }
      }
    }
    setSelectedMessage(message);
  };

  const filteredMessages = messages.filter(msg => 
    (msg.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (msg.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (msg.subject || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-120px)]">
      {/* Messages List */}
      <div className="w-full md:w-1/3 bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <input type="text" id="messageSearch" name="messageSearch" aria-label="بحث" placeholder="ابحث في الرسائل..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all text-sm"
            />
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-2.5 rtl:right-3 rtl:left-auto" />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div></div>
          ) : filteredMessages.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {filteredMessages.map(message => (
                <div 
                  key={message.id} 
                  onClick={() => markAsRead(message)}
                  className={`p-4 cursor-pointer transition-colors ${selectedMessage?.id === message.id ? 'bg-orange-50' : 'hover:bg-slate-50'} ${message.status !== 'read' ? 'bg-slate-50 border-r-4 border-orange-500' : ''}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className={`font-medium ${message.status !== 'read' ? 'text-slate-900 font-bold' : 'text-slate-700'}`}>{message.name}</h4>
                    <span className="text-xs text-slate-500">{new Date(message.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className={`text-sm mb-2 ${message.status !== 'read' ? 'text-slate-800 font-medium' : 'text-slate-600'}`}>{message.subject}</p>
                  <p className="text-xs text-slate-500 line-clamp-1">{message.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500">لا توجد رسائل</div>
          )}
        </div>
      </div>

      {/* Message Details */}
      <div className="w-full md:w-2/3 bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        {selectedMessage ? (
          <>
            <div className="p-6 border-b border-slate-200 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-4">{selectedMessage.subject}</h2>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <div className="flex items-center gap-1.5"><User className="w-4 h-4" /> {selectedMessage.name}</div>
                  <div className="flex items-center gap-1.5" dir="ltr"><Mail className="w-4 h-4" /> {selectedMessage.email}</div>
                  <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {new Date(selectedMessage.createdAt).toLocaleString()}</div>
                </div>
              </div>
              <button 
                onClick={() => handleDelete(selectedMessage.id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                title="حذف الرسالة"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 flex-1 overflow-y-auto">
              <div className="bg-slate-50 rounded-2xl p-6 text-slate-700 whitespace-pre-wrap leading-relaxed border border-slate-100">
                {selectedMessage.message}
              </div>
              <div className="mt-8 flex gap-3">
                <a href={`mailto:${selectedMessage.email}`} className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Reply via email
                </a>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <AlignLeft className="w-10 h-10 text-slate-300" />
            </div>
            <p className="text-lg">Select a message to view its content</p>
          </div>
        )}
      </div>
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="تأكيد الحذف">
        <div className="space-y-4">
          <p className="text-slate-600">تأكيد الحذف</p>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>إلغاء</Button>
            <Button variant="danger" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>نعم، احذف</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
