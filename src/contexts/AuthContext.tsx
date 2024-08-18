"use client"

import { usePathname, useRouter } from 'next/navigation';
import React, { createContext, useEffect, useState } from 'react';

interface User {
    id: string;
    name: string;
}

interface AuthContextProps {
    currentUser?: User;
    login: (email: string, password: string) => void;
    logout: () => void;
}

export const AuthContext = createContext<AuthContextProps>({
    currentUser: undefined,
    login: () => { },
    logout: () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode; }) {
    const [currentUser, setCurrentUser] = useState<User>();
    const pathname = usePathname();
    const router = useRouter();

    const login = async (username: string, password: string) => {
        const resBody = await fetch('/api/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        }).then((res) => res.json());

        console.log(resBody);

        if (resBody.code !== "OK") {
            return alert("Login failed");
        }

        const token = resBody.data;
        localStorage.setItem('token', token);

        validateToken();
    };

    const logout = () => {
        localStorage.removeItem('token');
        setCurrentUser(undefined);
    };

    const validateToken = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            return;
        }

        const resBody = await fetch(`/api/login?token=${token}`).then((res) => res.json());

        if (resBody.code !== "OK") {
            return logout();
        }

        const user = resBody.data;
        setCurrentUser(user);
    };

    const protectRoutes = () => {
        const token = localStorage.getItem('token');

        if (!token) {
            if (pathname !== '/login') {
                router.push('/login');
            }
        } else if (currentUser) {
            if (pathname === '/login') {
                router.push('/');
            }
        }
    }

    useEffect(() => {
        validateToken();
    }, []);

    useEffect(() => {
        protectRoutes();
    }, [pathname, currentUser]);

    return (
        <AuthContext.Provider value={{ currentUser, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}