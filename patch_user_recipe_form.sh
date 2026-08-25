#!/bin/bash
awk '
/const \{ user \} = useAuthStore\(\);/ {
    print "  const { user, isInitialized, loading: authLoading } = useAuthStore();"
    print ""
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
    print ""
    next
}
{print}
' src/pages/public/recipes/UserRecipeForm.tsx > temp_recipe_form.tsx && mv temp_recipe_form.tsx src/pages/public/recipes/UserRecipeForm.tsx
