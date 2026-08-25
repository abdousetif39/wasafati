import React, { useEffect, useState, useRef } from 'react';
import { collection, query, onSnapshot, where, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuthStore } from '../../store/useAuthStore';
import { NewMessageModal } from './NewMessageModal';
import { useLocation } from 'react-router-dom';

export const MessageNotificationListener: React.FC = () => {
  const { user } = useAuthStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState({ title: '', message: '', senderName: '', userId: '' });
  const lastNotifiedMessageIdRef = useRef<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    if (!user) return;
    const isAdmin = user.role === 'admin';
    
    // If admin is on chat page, don't show modal
    if (isAdmin && location.pathname === '/admin/chat') {
      return;
    }
    
    // If user is on profile messages page, don't show modal
    const searchParams = new URLSearchParams(location.search);
    if (!isAdmin && location.pathname.includes('/profile') && (location.state?.activeTab === 'messages' || searchParams.get('tab') === 'messages')) {
      return;
    }

    if (isAdmin) {
      const q = query(collection(db, 'conversations'), where('adminUnreadCount', '>', 0));
      const unsub = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added' || change.type === 'modified') {
            const data = change.doc.data();
            const msgId = data.lastMessageId || data.updatedAt || data.lastMessageAt;
            if (lastNotifiedMessageIdRef.current !== msgId && data.lastMessage) {
              lastNotifiedMessageIdRef.current = msgId;
              setModalData({
                title: 'رسالة جديدة من ' + (data.userName || 'مستخدم'),
                message: data.lastMessage,
                senderName: data.userName || 'مستخدم',
                userId: data.userId
              });
              setModalOpen(true);
            }
          }
        });
      }, (err: any) => { if (err.code !== 'permission-denied') console.error('Snapshot error:', err); });
      return () => unsub();
    } else {
      const convId = `user_${user.id}`;
      const unsub = onSnapshot(doc(db, 'conversations', convId), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.userUnreadCount > 0) {
            const msgId = data.lastMessageId || data.updatedAt || data.lastMessageAt;
            if (lastNotifiedMessageIdRef.current !== msgId && data.lastMessage) {
              lastNotifiedMessageIdRef.current = msgId;
              setModalData({
                title: 'رسالة جديدة من الإدارة',
                message: data.lastMessage,
                senderName: 'الإدارة',
                userId: ''
              });
              setModalOpen(true);
            }
          }
        }
      }, (err: any) => { if (err.code !== 'permission-denied') console.error('Snapshot error:', err); });
      return () => unsub();
    }
  }, [user, location.pathname, location.state]);

  if (!user) return null;

  return (
    <NewMessageModal
      isOpen={modalOpen}
      onClose={() => setModalOpen(false)}
      title={modalData.title}
      message={modalData.message}
      senderName={modalData.senderName}
      isAdmin={user.role === 'admin'}
      userId={modalData.userId}
    />
  );
};