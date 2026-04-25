// hooks/useRouteGuard.js
"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export const useRouteGuard = (options = {}) => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  const {
    publicRoutes = ["/", "/loginworkspace"],
    protectedRoutes = ["/dashboard", "/profile"],
    redirectPath = "/dashboard",
    loginPath = "/"
  } = options;

  useEffect(() => {
    if (!loading) {
      const isPublicRoute = publicRoutes.includes(pathname);
      const isProtectedRoute = protectedRoutes.includes(pathname);
      
      // Redirect logged-in users away from public routes
      if (user && isPublicRoute) {
        router.push(redirectPath);
      }
      
      // Redirect non-logged-in users away from protected routes
      if (!user && isProtectedRoute) {
        router.push(loginPath);
      }
    }
  }, [user, loading, pathname, router, publicRoutes, protectedRoutes, redirectPath, loginPath]);
};