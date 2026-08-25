#!/bin/bash
awk '
/const \{ user, isInitialized, loading: authLoading \} = useAuthStore\(\);/ {
    print "  const { user, isInitialized, loading: authLoading } = useAuthStore();"
    print "  const navigate = useNavigate();"
    print "  const location = useLocation();"
    next
}
/const navigate = useNavigate\(\);/ { next }
/const location = useLocation\(\);/ { next }
{print}
' src/pages/auth/Login.tsx > temp_login.tsx && mv temp_login.tsx src/pages/auth/Login.tsx
