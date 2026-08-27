import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, doc, setDoc, addDoc, updateDoc, limit } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuthStore } from '../../../store/useAuthStore';
import { Conversation, ChatMessage } from '../../../types';
import { Send, Loader2 } from 'lucide-react';
import { useToast } from '../../../contexts/ToastContext';

export default function UserChat() {
  const { user } = useAuthStore();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showNewMsgBtn, setShowNewMsgBtn] = useState(false);
  const toast = useToast();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const previousMessagesCountRef = useRef<number>(0);
  const hasInitialScrollRef = useRef<boolean>(false);
  
  const conversationId = user ? `user_${user.id}` : '';

  useEffect(() => {
    if (!user || !conversationId) return;

    // Listen to conversation
    const convRef = doc(db, 'conversations', conversationId);
    const unsubConv = onSnapshot(convRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Conversation;
        setConversation({ ...data, id: docSnap.id });
        
        // Mark as read if user unread count > 0
        if (data.userUnreadCount > 0) {
          updateDoc(convRef, { userUnreadCount: 0 }).catch(console.error);
        }
      } else {
        setConversation(null);
      }
      setLoading(false);
    }, (err: any) => { if ((err as any)?.code !== 'permission-denied') console.error(err); });

    // Listen to messages
    const q = query(collection(db, `conversations/${conversationId}/messages`), orderBy('createdAt', 'asc'), limit(200));
    const unsubMessages = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage));
      setMessages(msgs);
      
      const container = messagesContainerRef.current;
      const isNearBottom = container 
        ? container.scrollHeight - container.scrollTop - container.clientHeight < 120 
        : false;
      
      const hasNewMessage = msgs.length > previousMessagesCountRef.current;
      const isInitialLoad = !hasInitialScrollRef.current;
      const isOwnMessage = hasNewMessage && msgs.length > 0 && msgs[msgs.length - 1].senderRole === 'user';
      
      if (hasNewMessage || isInitialLoad) {
        if (isInitialLoad || isNearBottom || isOwnMessage) {
          setTimeout(() => {
             if (messagesContainerRef.current) {
                messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
             }
          }, 50);
          setShowNewMsgBtn(false);
        } else {
          setShowNewMsgBtn(true);
        }
        hasInitialScrollRef.current = true;
      }
      previousMessagesCountRef.current = msgs.length;
    }, (err: any) => { if (err.code !== 'permission-denied') console.error('Snapshot error:', err); });

    return () => {
      unsubConv();
      unsubMessages();
    };
  }, [user, conversationId]);

  const startConversation = async () => {
    if (!user || !conversationId) return;
    setLoading(true);
    try {
      const convData: Conversation = {
        userId: user.id,
        userName: user.displayName || 'المستخدم',
        userPhoto: user.photoURL || '',
        lastMessage: '',
        lastMessageAt: new Date().toISOString(),
        userUnreadCount: 0,
        adminUnreadCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'conversations', conversationId), convData);
    } catch (e) {
      if ((e as any)?.code !== 'permission-denied') { console.error(e); }
      toast.error('حدث خطأ أثناء إنشاء المحادثة');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text || !user || !conversation || !conversationId) return;
    
    // Optimistic UI clear
    setSending(true);
    const oldText = newMessage;
    setNewMessage('');
    
    try {
      const now = new Date().toISOString();
      
      // Fire and forget addDoc - Firestore handles optimistic updates via onSnapshot
      const docRef = await addDoc(collection(db, `conversations/${conversationId}/messages`), {
        senderId: user.id,
        senderRole: 'user',
        text,
        createdAt: now,
        read: false
      });
      
      await updateDoc(doc(db, 'conversations', conversationId), {
        lastMessage: text,
        lastMessageAt: now,
        lastMessageId: docRef.id,
        updatedAt: now,
        adminUnreadCount: (conversation.adminUnreadCount || 0) + 1
      });
      
    } catch (e) {
      if ((e as any)?.code !== 'permission-denied') { console.error(e); }
      setNewMessage(oldText);
      toast.error('تعذر إرسال الرسالة، حاول مرة أخرى.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl shadow-sm border border-slate-200">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4 text-orange-600">
          <Send className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">الرسائل</h3>
        <p className="text-slate-500 mb-6">لا توجد رسائل بعد</p>
        <button onClick={startConversation} className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-xl font-bold transition-colors">
          مراسلة الإدارة
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[600px] max-h-[70vh] relative">
      <div className="p-4 border-b border-slate-200 bg-slate-50 rounded-t-2xl">
        <h3 className="font-bold text-slate-800">تواصل مع الإدارة</h3>
      </div>
      
      <div ref={messagesContainerRef} className="flex-1 p-4 overflow-y-auto flex flex-col gap-4" onScroll={(e) => {
        const target = e.target as HTMLDivElement;
        const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 50;
        if (isNearBottom) setShowNewMsgBtn(false);
     }}>
        {messages.map(msg => {
          const isUser = msg.senderRole === 'user';
          
          return (
            <div key={msg.id} className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[75%] rounded-2xl p-3 ${isUser ? 'bg-slate-100 text-slate-800 rounded-tr-sm' : 'bg-orange-50 text-orange-900 border border-orange-100 rounded-tl-sm'}`}>
                <div className="flex justify-between items-baseline gap-4 mb-1">
                   <span className="font-bold text-xs">{isUser ? 'أنت' : 'الإدارة'}</span>
                </div>
                <div className="whitespace-pre-wrap text-sm leading-relaxed break-words">{msg.text}</div>
                <div className="text-[10px] text-slate-500 mt-2 text-left" dir="ltr">
                  {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      
      {showNewMsgBtn && (
        <div className="absolute bottom-20 left-0 right-0 flex justify-center z-10">
           <button 
             type="button"
             onClick={() => {
               if (messagesContainerRef.current) {
                 messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
                 setShowNewMsgBtn(false);
               }
             }}
             className="bg-orange-500 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg shadow-orange-500/30 animate-bounce"
           >
             رسالة جديدة ↓
           </button>
        </div>
      )}
      <form onSubmit={sendMessage} className="p-4 border-t border-slate-200 bg-white rounded-b-2xl flex gap-2">
        <textarea id="chatMessage" name="chatMessage" aria-label="رسالة جديدة" value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="اكتب رسالتك هنا..."
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 resize-none h-[52px] focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage(e as any);
            }
          }}
        />
        <button 
          type="submit"
          disabled={sending || !newMessage.trim()}
          className="bg-orange-600 hover:bg-orange-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white w-[52px] h-[52px] rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
        >
          {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 rtl:rotate-180" />}
        </button>
      </form>
    </div>
  );
}
