import { useToast } from '../../../contexts/ToastContext';
import React, { useState, useEffect } from 'react';
import { collection, getDocs, orderBy, query, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { User } from '../../../types';
import { Shield, User as UserIcon, Mail, Calendar, Search } from 'lucide-react';

export default function UserList() {
  const toast = useToast();
    const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as User[];
      setUsers(data);
    } catch (error) {
      if ((error as any)?.code !== 'permission-denied') { console.error('Error fetching users:', error); }
      toast.error('حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = async (userId: string, currentRole: string) => {
    try {
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      await updateDoc(doc(db, 'users', userId), {
        role: newRole
      });
      toast.success('تم تحديث الدور');
      fetchUsers();
    } catch (error) {
      if ((error as any)?.code !== 'permission-denied') { console.error('Error updating role:', error); }
      toast.error('حدث خطأ في الصلاحيات');
    }
  };

  const filteredUsers = users.filter(user => 
    (user.email || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
    (user.displayName && user.displayName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">المستخدمين</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="p-4 border-b border-slate-200">
          <div className="relative max-w-md">
            <input type="text" id="search" name="search" aria-label="بحث" placeholder="ابحث عن مستخدم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all text-sm"
            />
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-2.5 rtl:right-3 rtl:left-auto" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right text-sm">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">المستخدم</th>
                <th className="px-6 py-4">الدور</th>
                <th className="px-6 py-4">تاريخ الانضمام</th>
                <th className="px-6 py-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    <div className="flex justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div></div>
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                          {user.displayName?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className="font-medium text-slate-800">{user.displayName || 'المستخدم'}</div>
                          <div className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {user.role === 'admin' ? <Shield className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                        {user.role === 'admin' ? 'مسؤول' : 'مستخدم'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-500 text-xs flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <button
                          onClick={() => toggleRole(user.id, user.role)}
                          className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                            user.role === 'admin' 
                              ? 'border-slate-200 text-slate-600 hover:bg-slate-50' 
                              : 'border-indigo-200 text-indigo-600 hover:bg-indigo-50'
                          }`}
                        >
                          {user.role === 'admin' ? 'إزالة المسؤول' : 'ترقية لمسؤول'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">لا يوجد مستخدمين</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
