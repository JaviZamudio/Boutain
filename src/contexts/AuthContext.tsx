"use client"

import { Admin } from '@prisma/client';
import { usePathname, useRouter } from 'next/navigation';
import React, { createContext, useEffect, useState } from 'react';

interface AuthContextProps {
    currentAdmin?: Admin;
    login: (email: string, password: string) => void;
    logout: () => void;
}

export const AuthContext = createContext<AuthContextProps>({
    currentAdmin: undefined,
    login: () => { },
    logout: () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode; }) {
    const [currentAdmin, setCurrentUser] = useState<Admin>();
    const [token, setToken] = useState<string>();
    const pathname = usePathname();
    const router = useRouter();

    const login = async (username: string, password: string) => {
        const resBody = await fetch('/api/admins/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        }).then((res) => res.json());

        console.log(resBody);

        if (resBody.code !== "OK") {
            return alert("Login failed");
        }

        const token = resBody.data;
        localStorage.setItem('token', token);
        document.cookie = `token=${token}; path=/`;

        validateToken();
    };

    const logout = () => {
        localStorage.removeItem('token');
        document.cookie = 'token=; path=/';
        setCurrentUser(undefined);
    };

    const validateToken = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            return;
        }

        const resBody = await fetch(`/api/admins/login?token=${token}`).then((res) => res.json());

        if (resBody.code !== "OK") {
            return logout();
        }

        const user = resBody.data;
        setCurrentUser(user);
    };

    const protectRoutes = () => {
        const localToken = localStorage.getItem('token');

        if (!localToken) {
            if (pathname !== '/login') {
                router.push('/login');
            }
        } else if (currentAdmin) {
            if (!token) setToken(localToken)

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
    }, [pathname, currentAdmin]);

    return (
        <AuthContext.Provider value={{ currentAdmin: currentAdmin, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}