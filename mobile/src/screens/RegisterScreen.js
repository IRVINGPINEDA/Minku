import React, { useState } from "react";
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export const RegisterScreen = ({ navigation }) => {
    const { register } = useAuth();
    const { colors } = useTheme();
    const [form, setForm] = useState({ name: "", lastName: "", email: "", password: "" });
    const [loading, setLoading] = useState(false);

    const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }));

    const handleRegister = async () => {
        const { name, lastName, email, password } = form;
        if (!name || !lastName || !email || !password) {
            return Alert.alert("Campos requeridos", "Completa todos los campos.");
        }
        if (password.length < 6) {
            return Alert.alert("Contraseña débil", "La contraseña debe tener al menos 6 caracteres.");
        }
        setLoading(true);
        try {
            await register({ name, lastName, email: email.trim().toLowerCase(), password, role: 1 });
        } catch (err) {
            Alert.alert("Error", err.message);
        } finally {
            setLoading(false);
        }
    };

    const s = styles(colors);
    return (
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
                <View style={s.card}>
                    <Text style={s.title}>Crear cuenta</Text>
                    <Text style={s.sub}>Únete a la plataforma de aprendizaje</Text>

                    {[
                        { key: "name", placeholder: "Nombre(s)" },
                        { key: "lastName", placeholder: "Apellido(s)" },
                        { key: "email", placeholder: "Correo electrónico", keyboard: "email-address" },
                        { key: "password", placeholder: "Contraseña (mín. 6 caracteres)", secure: true },
                    ].map(({ key, placeholder, keyboard, secure }) => (
                        <TextInput
                            key={key}
                            style={s.input}
                            placeholder={placeholder}
                            placeholderTextColor={colors.textSecondary}
                            keyboardType={keyboard || "default"}
                            autoCapitalize={key === "email" ? "none" : "words"}
                            secureTextEntry={secure}
                            value={form[key]}
                            onChangeText={set(key)}
                        />
                    ))}

                    <TouchableOpacity style={s.btn} onPress={handleRegister} disabled={loading}>
                        {loading
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={s.btnText}>Registrarme</Text>}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
                        <Text style={{ color: colors.primary, textAlign: "center" }}>
                            ¿Ya tienes cuenta? <Text style={{ fontWeight: "700" }}>Inicia sesión</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = (c) => StyleSheet.create({
    container: { flexGrow: 1, justifyContent: "center", padding: 24 },
    card: { backgroundColor: c.card, borderRadius: 20, padding: 28, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 },
    title: { fontSize: 28, fontWeight: "800", color: c.text, marginBottom: 4 },
    sub: { color: c.textSecondary, marginBottom: 24 },
    input: { backgroundColor: c.inputBg, borderWidth: 1, borderColor: c.border, borderRadius: 10, padding: 12, marginBottom: 14, color: c.text, fontSize: 15 },
    btn: { backgroundColor: c.primary, borderRadius: 12, padding: 14, alignItems: "center", marginTop: 8 },
    btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
