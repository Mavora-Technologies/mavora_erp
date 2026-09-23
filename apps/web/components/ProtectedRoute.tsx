'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);

  useEffect(() => {
    // 1. Verify Authentication
    const storedUser = localStorage.getItem('mavora_user');
    
    if (!storedUser) {
      // If not logged in and trying to access a protected route, send to login
      if (pathname !== '/login') {
        router.push('/login');
      }
      return;
    }

    try {
      const parsed = JSON.parse(storedUser);
      const rawRole = parsed.role ?? parsed.roleName ?? parsed.user_role ?? parsed.department ?? 'employee';
      const roleLower = String(rawRole).toLowerCase();
      
      // 2. Admins & Executives bypass all route restrictions
      if (
        roleLower === 'administrator' || 
        roleLower === 'admin' || 
        roleLower === 'super_admin' || 
        roleLower === 'executive'
      ) {
        setIsAuthorized(true);
        return;
      }

      // 3. Map specific routes to their Module Groups
      // Note: /settings is intentionally excluded from restricted groups 
      // because all authenticated users can view "My Profile & Security".
      const routeGroups: Record<string, string> = {
        '/crm': 'BUSINESS',
        '/sales': 'BUSINESS',
        '/projects': 'BUSINESS',
        '/procurement': 'OPERATIONS',
        '/inventory': 'OPERATIONS',
        '/helpdesk': 'OPERATIONS',
        '/finance': 'CORPORATE',
        '/hrm': 'CORPORATE'
      };

      // Identify which group the current page belongs to
      const currentGroup = Object.entries(routeGroups).find(([route]) => pathname.startsWith(route))?.[1];

      // If the route doesn't belong to a restricted group (e.g., '/', '/profile', '/settings'), allow access
      if (!currentGroup) {
        setIsAuthorized(true);
        return;
      }

      // 4. Build allowed modules based on the user's role (Mirroring Sidebar Logic)
      const allowedGroups = ['OVERVIEW']; 

      if (roleLower.includes('sales')) {
        allowedGroups.push('BUSINESS');
      }
      
      if (roleLower.includes('administration') || roleLower.includes('operations')) {
        allowedGroups.push('OPERATIONS');
      }
      
      if (roleLower.includes('engineering') || roleLower.includes('engineer')) {
        allowedGroups.push('BUSINESS', 'OPERATIONS');
      }

      // 5. Evaluate Access
      if (allowedGroups.includes(currentGroup)) {
        setIsAuthorized(true);
      } else {
        // Access Denied - Redirect back to dashboard
        router.push('/'); 
      }
    } catch (error) {
      // If token parsing fails, clear and redirect to login
      localStorage.removeItem('mavora_token');
      localStorage.removeItem('mavora_user');
      router.push('/login');
    }
  }, [pathname, router]);

  // Show loading spinner while authorization is being verified
  if (!isAuthorized && pathname !== '/login') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#04152F]">
        <div className="w-8 h-8 border-4 border-[#075BFF] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return <>{children}</>;
}