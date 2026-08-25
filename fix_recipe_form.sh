#!/bin/bash
awk '
/const navigate = useNavigate\(\);/ {
    print "  const navigate = useNavigate();"
    print "  if (!isInitialized || authLoading) {"
    print "    return ("
    print "      <div className=\"min-h-screen flex flex-col items-center justify-center bg-slate-50\">"
    print "        <div className=\"animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600 mb-4\"></div>"
    print "        <p className=\"text-slate-500 font-medium\">جارٍ التحقق من جلسة المستخدم...</p>"
    print "      </div>"
    print "    );"
    print "  }"
    print ""
    print "  if (!user) {"
    print "    navigate(\"/login\");"
    print "    return null;"
    print "  }"
    next
}
/if \(\!isInitialized \|\| authLoading\) \{/ {
    skip = 1
}
skip && /\}/ {
    if (skip_count == 3) {
        skip = 0
        skip_count = 0
        next
    }
}
skip && /return \(/ { skip_count=1 }
skip && /<\/div>/ { skip_count++ }
skip { next }
/if \(\!user\) \{/ {
    skip_user = 1
}
skip_user && /return null;/ { skip_user_count=1 }
skip_user && /\}/ { 
    if (skip_user_count == 1) {
        skip_user = 0
        skip_user_count = 0
        next
    }
}
skip_user { next }
{print}
' src/pages/public/recipes/UserRecipeForm.tsx > temp.tsx && mv temp.tsx src/pages/public/recipes/UserRecipeForm.tsx
