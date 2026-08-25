#!/bin/bash
awk '
/if \(\!user\) \{/ {
    print "  if (!isInitialized || loading) {"
    print "    return ("
    print "      <div className=\"min-h-screen flex flex-col items-center justify-center bg-slate-50\">"
    print "        <div className=\"animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600 mb-4\"></div>"
    print "        <p className=\"text-slate-500 font-medium\">جارٍ التحقق من جلسة المستخدم...</p>"
    print "      </div>"
    print "    );"
    print "  }"
    print ""
    print "  if (!user) {"
    next
}
{print}
' src/pages/public/Profile.tsx > temp_profile.tsx && mv temp_profile.tsx src/pages/public/Profile.tsx
