
export const getAuthErrorMessage = (error: any) => {
  const errorCode = error?.code || '';
  switch (errorCode) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return {
        title: 'تعذر تسجيل الدخول',
        message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى التأكد من البيانات والمحاولة مرة أخرى.'
      };
    case 'auth/invalid-email':
      return {
        title: 'البريد الإلكتروني غير صالح',
        message: 'عنوان البريد الإلكتروني الذي أدخلته غير صالح.'
      };
    case 'auth/user-disabled':
      return {
        title: 'هذا الحساب معطل',
        message: 'تم تعطيل هذا الحساب. يرجى التواصل مع الإدارة.'
      };
    case 'auth/too-many-requests':
      return {
        title: 'طلبات كثيرة جداً',
        message: 'يرجى المحاولة مرة أخرى لاحقاً.'
      };
    case 'auth/network-request-failed':
      return {
        title: 'خطأ في الشبكة',
        message: 'تحقق من اتصالك بالإنترنت.'
      };
    case 'auth/email-already-in-use':
      return {
        title: 'البريد الإلكتروني مستخدم',
        message: 'يوجد حساب بهذا البريد الإلكتروني بالفعل.'
      };
    default:
      return {
        title: 'حدث خطأ غير متوقع',
        message: 'حدث خطأ ما. يرجى المحاولة مرة أخرى.'
      };
  }
};
