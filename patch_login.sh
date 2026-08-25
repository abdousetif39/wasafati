#!/bin/bash
awk '
/export default function Login\(\) \{/ {
    print "import { useAuthStore } from '"'../../store/useAuthStore'"';"
    print "export default function Login() {"
    print "  const { user, isInitialized, loading: authLoading } = useAuthStore();"
    print "  React.useEffect(() => {"
    print "    if (isInitialized && !authLoading && user) {"
    print "      navigate(\"/\");"
    print "    }"
    print "  }, [user, isInitialized, authLoading, navigate]);"
    print ""
    print "  if (!isInitialized || authLoading) {"
    print "    return ("
    print "      <div className=\"min-h-screen flex items-center justify-center bg-slate-50\">"
    print "        <div className=\"animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600\"></div>"
    print "      </div>"
    print "    );"
    print "  }"
    next
}
{print}
' src/pages/auth/Login.tsx > temp_login.tsx && mv temp_login.tsx src/pages/auth/Login.tsx
