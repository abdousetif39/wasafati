#!/bin/bash
sed -i 's/const { isAdmin, loading, logout } = useAuthStore();/const { isAdmin, loading, logout, isInitialized } = useAuthStore();/g' src/layouts/AdminLayout.tsx
awk '
/if \(loading\) \{/ {
    print "  if (!isInitialized || loading) {"
    print "    return ("
    print "      <div className=\"min-h-screen flex items-center justify-center bg-slate-50\">"
    print "        <div className=\"animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600\"></div>"
    print "      </div>"
    print "    );"
    print "  }"
    skip = 1
}
skip && /\}/ {
    if (skip_count == 2) {
        skip = 0
        skip_count = 0
        next
    }
}
skip && /return \(/ { skip_count=1 }
skip && /<\/div>/ { skip_count++ }
skip { next }
{print}
' src/layouts/AdminLayout.tsx > temp_admin.tsx && mv temp_admin.tsx src/layouts/AdminLayout.tsx
