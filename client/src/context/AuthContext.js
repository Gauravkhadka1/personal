"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import jwt from "jsonwebtoken";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
    const pathname = usePathname();

      // Add this useEffect to handle route protection
  useEffect(() => {
    if (!loading) {
      const publicRoutes = ["/", "/loginworkspace"];
      const isPublicRoute = publicRoutes.includes(pathname);
      
      // If user is logged in and tries to access login page, redirect to dashboard
      if (user && isPublicRoute) {
        router.push("/dashboard");
      }
      
      // If user is not logged in and tries to access protected route, redirect to login
      if (!user && !isPublicRoute && pathname !== "/") {
        router.push("/");
      }
    }
  }, [user, loading, pathname, router]);

  const getUserId = () => {
    if (!user) return null;
    // Return user ID in the format your backend expects
    return user.userId?.toString(); // or Number(user.userId) if backend expects number
  };

  const fetchUserData = async () => {
    const token = localStorage.getItem("token");
    
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}users/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        logout();
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const decodedToken = jwt.decode(token);
        if (decodedToken && decodedToken.exp * 1000 > Date.now()) {
          fetchUserData();
        } else {
          logout();
        }
      } catch (error) {
        console.error("Error decoding token:", error);
        logout();
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (token) => {
    localStorage.setItem("token", token);
    await fetchUserData();
    router.push("/dashboard");
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    router.push("/");
  };

  // Check token expiration periodically
  useEffect(() => {
    const checkTokenExpiration = () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const decodedToken = jwt.decode(token);
          if (decodedToken && decodedToken.exp * 1000 < Date.now()) {
            logout();
          }
        } catch (error) {
          console.error("Error decoding token:", error);
          logout();
        }
      }
    };

    const interval = setInterval(checkTokenExpiration, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, getUserId  }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);