import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  apiRequest,
  getAccessToken,
  restoreSession,
  setAccessToken,
} from "@/lib/api";
import type { User } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login(
    email: string,
    password: string,
  ): Promise<User>;
  signup(
    name: string,
    email: string,
    password: string,
  ): Promise<User>;
  logout(): Promise<void>;
  refreshUser(): Promise<User | null>;
}

const AuthContext =
  createContext<AuthContextType | null>(null);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] =
    useState<User | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const refreshUser = useCallback(
    async (): Promise<User | null> => {
      setIsLoading(true);

      try {
        /*
         * On a fresh browser load the access token is not
         * persisted. Restore the session directly through
         * the HttpOnly refresh-token cookie.
         *
         * The refresh endpoint already returns the user,
         * so there is no need to call /auth/me here.
         */
        const restored = await restoreSession();

        if (restored) {
          setAccessToken(restored.accessToken);
          setUser(restored.user);
          return restored.user;
        }

        /*
         * If an access token was already established by
         * login/signup, use it to obtain the latest profile.
         */
        if (getAccessToken()) {
          const profile =
            await apiRequest<User>(
              "/auth/me",
              {},
              false,
            );

          setUser(profile);
          return profile;
        }

        setAccessToken(null);
        setUser(null);
        return null;
      } catch {
        setAccessToken(null);
        setUser(null);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const login = async (
    email: string,
    password: string,
  ): Promise<User> => {
    const response =
      await apiRequest<{
        user: User;
        accessToken: string;
      }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
        }),
      });

    setAccessToken(response.accessToken);
    setUser(response.user);

    return response.user;
  };

  const signup = async (
    name: string,
    email: string,
    password: string,
  ): Promise<User> => {
    const response =
      await apiRequest<{
        user: User;
        accessToken: string;
      }>("/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

    setAccessToken(response.accessToken);
    setUser(response.user);

    return response.user;
  };

  const logout = async () => {
    try {
      await apiRequest(
        "/auth/logout",
        {
          method: "POST",
        },
        false,
      );
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        login,
        signup,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within AuthProvider",
    );
  }

  return context;
}
