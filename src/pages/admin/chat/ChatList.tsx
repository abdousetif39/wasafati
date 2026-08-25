import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, setDoc, addDoc, limit } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuthStore } from '../../../store/useAuthStore';
import { Conversation, ChatMessage, User } from '../../../types';
import { Search, Send, Loader2, MessageSquare, User as UserIcon, ArrowLeft } from 'lucide-react';
import { useToast } from '../../../contexts/ToastContext';

export default function ChatList() {
  const { user: adminUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [conversations, setConversations] = useState<Record<string, Conversation>>({});
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [showNewMsgBtn, setShowNewMsgBtn] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const toast = useToast();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const previousMessagesCountRef = useRef<number>(0);
  const hasInitialScrollRef = useRef<boolean>(false);
  const [isMobileListOpen, setIsMobileListOpen] = useState(true);

  // Listen to all users
  useEffect(() => {
    if (!adminUser) return;
    const q = query(collection(db, 'users'));
    const unsub = onSnapshot(q, (snapshot) => {
      const allUsers = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as User));
      setUsers(allUsers.filter(u => u.id !== adminUser.id));
      setLoadingUsers(false);
    }, (error) => {
      if (error.code !== 'permission-denied') if ((error as any)?.code !== 'permission-denied') { console.error("Error fetching users:", error); }
      setLoadingUsers(false);
    });
    return () => unsub();
  }, [adminUser]);

  // Listen to all conversations
  useEffect(() => {
    const q = query(collection(db, 'conversations'));
    const unsub = onSnapshot(q, (snapshot) => {
      const convs: Record<string, Conversation> = {};
      snapshot.docs.forEach(d => {
        convs[d.data().userId] = { id: d.id, ...d.data() } as Conversation;
      });
      setConversations(convs);
    }, (err: any) => { if (err.code !== 'permission-denied') console.error('Snapshot error:', err); });
    return () => unsub();
  }, []);

  // Listen to messages for selected user
  useEffect(() => {
    if (!selectedUser) {
      setMessages([]);
      return;
    }
    setLoadingMessages(true);
    hasInitialScrollRef.current = false;
    previousMessagesCountRef.current = 0;
    
    const conversationId = `user_${selectedUser.id}`;
    
    // Clear admin unread count if it exists
    const conv = conversations[selectedUser.id];
    if (conv && conv.adminUnreadCount > 0) {
      updateDoc(doc(db, 'conversations', conversationId), { adminUnreadCount: 0 }).catch(console.error);
    }

    const q = query(collection(db, `conversations/${conversationId}/messages`), orderBy('createdAt', 'asc'), limit(200));
    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage));
      setMessages(msgs);
      setLoadingMessages(false);
      
      const container = messagesContainerRef.current;
      const isNearBottom = container 
        ? container.scrollHeight - container.scrollTop - container.clientHeight < 120 
        : false;
      
      const hasNewMessage = msgs.length > previousMessagesCountRef.current;
      const isInitialLoad = !hasInitialScrollRef.current;
      const isOwnMessage = hasNewMessage && msgs.length > 0 && msgs[msgs.length - 1].senderRole === 'admin';
      
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
    
    return () => unsub();
  }, [selectedUser?.id]);

  const handleSelectUser = (u: User) => {
    setSelectedUser(u);
    setIsMobileListOpen(false);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text || !selectedUser || !adminUser) return;
    
    setSending(true);
    const oldText = newMessage;
    setNewMessage('');
    
    const conversationId = `user_${selectedUser.id}`;
    const now = new Date().toISOString();
    
    try {
      const convRef = doc(db, 'conversations', conversationId);
      
            const docRef = await addDoc(collection(db, `conversations/${conversationId}/messages`), {
        senderId: adminUser.id,
        senderRole: 'admin',
        text,
        createdAt: now,
        read: false
      });

      if (!conversations[selectedUser.id]) {
        await setDoc(convRef, {
          userId: selectedUser.id,
          userName: selectedUser.displayName || 'المستخدم',
          userPhoto: selectedUser.photoURL || '',
          lastMessage: text,
          lastMessageAt: now,
        lastMessageId: docRef.id,
          userUnreadCount: 1,
          adminUnreadCount: 0,
          createdAt: now,
          updatedAt: now
        });
      } else {
        const currentConv = conversations[selectedUser.id];
        await updateDoc(convRef, {
          lastMessage: text,
          lastMessageAt: now,
        lastMessageId: docRef.id,
          updatedAt: now,
          userUnreadCount: (currentConv.userUnreadCount || 0) + 1
        });
      }
      

      
    } catch (error) {
      if ((error as any)?.code !== 'permission-denied') { console.error(error); }
      setNewMessage(oldText);
      toast.error('تعذر إرسال الرسالة');
    } finally {
      setSending(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()))
  ).sort((a, b) => {
    const convA = conversations[a.id];
    const convB = conversations[b.id];
    const timeA = convA ? new Date(convA.updatedAt || convA.createdAt).getTime() : 0;
    const timeB = convB ? new Date(convB.updatedAt || convB.createdAt).getTime() : 0;
    return timeB - timeA;
  });

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-140px)] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className={`w-full md:w-80 border-l border-slate-200 flex flex-col ${!isMobileListOpen ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h2 className="font-bold text-slate-800 mb-3">المستخدمون</h2>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input type="text" id="search" name="search" aria-label="بحث" placeholder="ابحث عن مستخدم..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pr-10 pl-4 py-2 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingUsers ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
            </div>
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map(u => {
              const conv = conversations[u.id];
              const unread = conv?.adminUnreadCount || 0;
              return (
                <button
                  key={u.id}
                  onClick={() => handleSelectUser(u)}
                  className={`w-full text-right p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors flex items-center gap-3 ${selectedUser?.id === u.id ? 'bg-orange-50' : ''}`}
                >
                  <div className="relative">
                    {u.photoURL ? (
                      <img src={u.photoURL} alt={u.displayName} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-500">
                        <UserIcon className="w-5 h-5" />
                      </div>
                    )}
                    {unread > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center">
                        {unread}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-medium text-slate-900 truncate">{u.displayName}</h4>
                    </div>
                    {u.wilaya && (
                      <p className="text-xs text-slate-500 truncate">{u.wilaya} {u.municipality ? `- ${u.municipality}` : ''}</p>
                    )}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-500 text-sm">لا يوجد مستخدمون</div>
          )}
        </div>
      </div>

      <div className={`flex-1 flex flex-col bg-slate-50 ${isMobileListOpen ? 'hidden md:flex' : 'flex'}`}>
        {selectedUser ? (
          <>
            <div className="h-16 px-6 border-b border-slate-200 bg-white flex items-center gap-4 shrink-0">
              <button 
                onClick={() => setIsMobileListOpen(true)}
                className="md:hidden p-2 -mr-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
              </button>
              {selectedUser.photoURL ? (
                <img src={selectedUser.photoURL} alt={selectedUser.displayName} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                  <UserIcon className="w-5 h-5" />
                </div>
              )}
              <div>
                <h3 className="font-bold text-slate-800">{selectedUser.displayName}</h3>
                <p className="text-xs text-slate-500">{selectedUser.email}</p>
              </div>
            </div>

            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4">
              {loadingMessages ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                </div>
              ) : messages.length > 0 ? (
                messages.map(msg => {
                  const isAdmin = msg.senderRole === 'admin';
                  return (
                    <div key={msg.id} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[75%] rounded-2xl p-4 ${isAdmin ? 'bg-orange-100 text-orange-900 rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'}`}>
                        <div className="whitespace-pre-wrap text-sm leading-relaxed break-words">{msg.text}</div>
                        <div className={`text-[10px] mt-2 text-left ${isAdmin ? 'text-orange-500' : 'text-slate-400'}`} dir="ltr">
                          {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500">
                  <MessageSquare className="w-12 h-12 mb-4 text-slate-300" />
                  <p>ابدأ محادثة مع {selectedUser.displayName}</p>
                </div>
              )}
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
      <form onSubmit={sendMessage} className="p-4 bg-white border-t border-slate-200 flex gap-2 shrink-0">
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
                className="bg-orange-600 hover:bg-orange-700 disabled:bg-slate-300 text-white w-[52px] h-[52px] rounded-xl flex items-center justify-center transition-colors shrink-0"
              >
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 rtl:rotate-180" />}
              </button>
            </form>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-white">
            <MessageSquare className="w-16 h-16 mb-4 text-slate-200" />
            <p className="text-lg">اختر محادثة للبدء</p>
          </div>
        )}
      </div>
    </div>
  );
}
