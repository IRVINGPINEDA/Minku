import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiGet, apiPost, BASE_URL } from "../api/client";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            if (!token) return setLoading(false);

            const res = await fetch(`${BASE_URL}/token/refresh`, {
                headers: { Authorization: token },
            });
            const body = await res.json();
            if (body.access_token) {
                await AsyncStorage.setItem("token", body.access_token);
                await loadUser(body.email || parseEmail(body.access_token));
            } else {
                await logout();
            }
        } catch {
            await logout();
        } finally {
            setLoading(false);
        }
    };

    const parseEmail = (token) => {
        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            return payload.sub;
        } catch {
            return null;
        }
    };

    const loadUser = async (email) => {
        try {
            const res = await apiGet(`user/${email}`);
            const body = await res.json();
            if (body.user) setUser(body.user);
        } catch {}
    };

    const login = async (email, password) => {
        const res = await fetch(
            `${BASE_URL}/login?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`,
            { method: "POST" }
        );
        if (res.status === 403) throw new Error("Correo o contraseña incorrectos");
        const body = await res.json();
        if (body.error) throw new Error(body.error);
        await AsyncStorage.setItem("token", body.access_token);
        await AsyncStorage.setItem("token-refresh", body.refresh_token);
        await loadUser(email);
    };

    const register = async (userData) => {
        const res = await apiPost("register", userData);
        const body = await res.json();
        if (body.error) throw new Error(body.error);
        await login(userData.email, userData.password);
    };

    const logout = async () => {
        await AsyncStorage.multiRemove(["token", "token-refresh"]);
        setUser(null);
    };

    const updateUser = (updated) => setUser(updated);

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, loadUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
