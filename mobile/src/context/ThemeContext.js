import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ThemeContext = createContext(null);

export const COLORS = {
    light: {
        bg: "#EDEAFE",
        card: "#FFFFFF",
        text: "#2F2E41",
        textSecondary: "#656478",
        primary: "#9E8AFC",
        primaryDark: "#6C63FF",
        success: "#2AB930",
        danger: "#FF7E7E",
        warning: "#FFB252",
        border: "#e5e7eb",
        inputBg: "#FFFFFF",
        navBg: "#2F2E41",
    },
    dark: {
        bg: "#1a1a2e",
        card: "#1e293b",
        text: "#e2e8f0",
        textSecondary: "#a0aec0",
        primary: "#9E8AFC",
        primaryDark: "#6C63FF",
        success: "#2AB930",
        danger: "#FF7E7E",
        warning: "#FFB252",
        border: "#334155",
        inputBg: "#243447",
        navBg: "#0f172a",
    },
};

export const ThemeProvider = ({ children }) => {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        AsyncStorage.getItem("theme").then((v) => {
            if (v === "dark") setIsDark(true);
        });
    }, []);

    const toggleTheme = () => {
        setIsDark((prev) => {
            AsyncStorage.setItem("theme", !prev ? "dark" : "light");
            return !prev;
        });
    };

    const colors = isDark ? COLORS.dark : COLORS.light;

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme, colors }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
