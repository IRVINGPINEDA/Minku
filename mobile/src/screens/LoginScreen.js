import React, { useState } from "react";
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export const LoginScreen = ({ navigation }) => {
    const { login } = useAuth();
    const { colors } = useTheme();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) return Alert.alert("Campos requeridos", "Ingresa correo y contraseña.");
        setLoading(true);
        try {
            await login(email.trim().toLowerCase(), password);
        } catch (err) {
            Alert.alert("Error", err.message);
        } finally {
            setLoading(false);
        }
    };

    const s = styles(colors);
    return (
        <KeyboardAvoidingView style={s.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <View style={s.card}>
                <Text style={s.logo}>caleiro</Text>
                <Text style={s.subtitle}>Inicia sesión para continuar</Text>

                <TextInput
                    style={s.input}
                    placeholder="Correo electrónico"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                />
                <View style={s.passRow}>
                    <TextInput
                        style={[s.input, { flex: 1, marginBottom: 0 }]}
                        placeholder="Contraseña"
                        placeholderTextColor={colors.textSecondary}
                        secureTextEntry={!showPass}
                        value={password}
                        onChangeText={setPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPass(p => !p)} style={s.eyeBtn}>
                        <Text style={{ color: colors.primary }}>{showPass ? "Ocultar" : "Ver"}</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Entrar</Text>}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate("Register")} style={{ marginTop: 16 }}>
                    <Text style={{ color: colors.primary, textAlign: "center" }}>
                        ¿No tienes cuenta? <Text style={{ fontWeight: "700" }}>Regístrate</Text>
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = (c) => StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg, justifyContent: "center", padding: 24 },
    card: { backgroundColor: c.card, borderRadius: 20, padding: 28, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 },
    logo: { fontSize: 36, fontWeight: "800", color: c.primary, textAlign: "center", marginBottom: 4 },
    subtitle: { color: c.textSecondary, textAlign: "center", marginBottom: 24 },
    input: { backgroundColor: c.inputBg, borderWidth: 1, borderColor: c.border, borderRadius: 10, padding: 12, marginBottom: 14, color: c.text, fontSize: 15 },
    passRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
    eyeBtn: { paddingHorizontal: 8, paddingVertical: 12 },
    btn: { backgroundColor: c.primary, borderRadius: 12, padding: 14, alignItems: "center", marginTop: 8 },
    btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
