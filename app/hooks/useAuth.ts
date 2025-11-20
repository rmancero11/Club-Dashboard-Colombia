import { useState, useEffect } from 'react';

export interface AuthUser {
  id: string;
  name: string | null;
  email: string;
  role: "ADMIN" | "SELLER" | "USER";
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        // Llamamos al endpoint de sesión.
        const response = await fetch('/api/auth/me');

        if (!response.ok) {
          const data = await response.json();

          const userData = data.user;

          setUser({
            id: userData.id,
            name: userData.name,
            email: userData.email,
            role: userData.role,
          });
        } else {
          // 401, 403, etc. => Sesión inválida/expirada
          setUser(null);
        }
      } catch (error) {
        console.error('Error fetching session:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSession();
  }, []);

  // Función de ayuda para desloguear (limpia cookies en el servidor)
  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };
  return { user, isLoading, logout };
};