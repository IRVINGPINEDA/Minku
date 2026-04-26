import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/context/AuthContext";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import { AppNavigator } from "./src/navigation/AppNavigator";

const ThemedStatusBar = () => {
    const { isDark } = useTheme();
    return <StatusBar style={isDark ? "light" : "dark"} />;
};

export default function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <SafeAreaProvider>
                    <ThemedStatusBar />
                    <AppNavigator />
                </SafeAreaProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}
