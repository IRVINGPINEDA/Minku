import React, { useState } from "react";
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, Alert, Switch, ActivityIndicator
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { apiPut } from "../api/client";

export const ProfileScreen = () => {
    const { user, logout, updateUser } = useAuth();
    const { colors, isDark, toggleTheme } = useTheme();

    const [name, setName] = useState(user?.name || "");
    const [lastName, setLastName] = useState(user?.lastName || "");
    const [saving, setSaving] = useState(false);

    const [oldPass, setOldPass] = useState("");
    const [newPass, setNewPass] = useState("");
    const [savingPass, setSavingPass] = useState(false);

    const handleSave = async () => {
        if (!name || !lastName) return Alert.alert("Requerido", "Nombre y apellido son obligatorios.");
        setSaving(true);
        try {
            const res = await apiPut("user/update", { ...user, name, lastName });
            const body = await res.json();
            if (body.id) {
                updateUser(body);
                Alert.alert("✓ Actualizado", "Perfil guardado correctamente.");
            }
        } catch {
            Alert.alert("Error", "No se pudo actualizar el perfil.");
        }
        setSaving(false);
    };

    const handleChangePassword = async () => {
        if (!oldPass || !newPass) return Alert.alert("Requerido", "Completa ambos campos.");
        if (newPass.length < 6) return Alert.alert("Contraseña débil", "La nueva contraseña debe tener al menos 6 caracteres.");
        setSavingPass(true);
        try {
            const res = await apiPut(`user/update-password/${user.id}`, { password: newPass });
            const body = await res.json();
            if (body.status === 200) {
                Alert.alert("✓ Actualizado", "Contraseña cambiada correctamente.");
                setOldPass("");
                setNewPass("");
            } else {
                Alert.alert("Error", body.error || "No se pudo cambiar la contraseña.");
            }
        } catch {
            Alert.alert("Error", "Error de conexión.");
        }
        setSavingPass(false);
    };

    const handleLogout = () => {
        Alert.alert("Cerrar sesión", "¿Confirmas que deseas salir?", [
            { text: "Cancelar", style: "cancel" },
            { text: "Salir", style: "destructive", onPress: logout },
        ]);
    };

    const s = styles(colors);

    if (!user) return (
        <View style={[s.center, { backgroundColor: colors.bg }]}>
            <Text style={{ color: colors.text }}>Inicia sesión primero</Text>
        </View>
    );

    return (
        <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={s.header}>
                <View style={s.avatar}>
                    <Text style={s.avatarText}>
                        {(user.name?.[0] || "").toUpperCase()}{(user.lastName?.[0] || "").toUpperCase()}
                    </Text>
                </View>
                <Text style={s.username}>{user.name} {user.lastName}</Text>
                <Text style={s.email}>{user.email}</Text>
            </View>

            <View style={s.card}>
                <Text style={s.sectionTitle}>Datos personales</Text>
                {[
                    { label: "Nombre(s)", val: name, set: setName },
                    { label: "Apellido(s)", val: lastName, set: setLastName },
                ].map(({ label, val, set }) => (
                    <View key={label}>
                        <Text style={s.label}>{label}</Text>
                        <TextInput style={s.input} value={val} onChangeText={set} placeholderTextColor={colors.textSecondary} />
                    </View>
                ))}
                <TouchableOpacity style={s.btn} onPress={handleSave} disabled={saving}>
                    {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Guardar cambios</Text>}
                </TouchableOpacity>
            </View>

            <View style={s.card}>
                <Text style={s.sectionTitle}>Cambiar contraseña</Text>
                <Text style={s.label}>Contraseña actual</Text>
                <TextInput style={s.input} secureTextEntry value={oldPass} onChangeText={setOldPass} placeholderTextColor={colors.textSecondary} placeholder="••••••" />
                <Text style={s.label}>Nueva contraseña</Text>
                <TextInput style={s.input} secureTextEntry value={newPass} onChangeText={setNewPass} placeholderTextColor={colors.textSecondary} placeholder="Mínimo 6 caracteres" />
                <TouchableOpacity style={[s.btn, { backgroundColor: colors.primaryDark }]} onPress={handleChangePassword} disabled={savingPass}>
                    {savingPass ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Cambiar contraseña</Text>}
                </TouchableOpacity>
            </View>

            <View style={s.card}>
                <Text style={s.sectionTitle}>Apariencia</Text>
                <View style={s.row}>
                    <Text style={s.label}>Tema oscuro</Text>
                    <Switch
                        value={isDark}
                        onValueChange={toggleTheme}
                        trackColor={{ false: colors.border, true: colors.primary }}
                        thumbColor={isDark ? "#fff" : "#f4f3f4"}
                    />
                </View>
            </View>

            <TouchableOpacity style={[s.btn, { backgroundColor: colors.danger, marginHorizontal: 16 }]} onPress={handleLogout}>
                <Text style={s.btnText}>Cerrar sesión</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = (c) => StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    header: { alignItems: "center", paddingVertical: 28, backgroundColor: c.card, marginBottom: 12 },
    avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: c.primary, alignItems: "center", justifyContent: "center", marginBottom: 10 },
    avatarText: { color: "#fff", fontSize: 26, fontWeight: "800" },
    username: { fontSize: 20, fontWeight: "700", color: c.text },
    email: { color: c.textSecondary, marginTop: 2 },
    card: { backgroundColor: c.card, margin: 12, marginBottom: 0, borderRadius: 14, padding: 16 },
    sectionTitle: { fontSize: 16, fontWeight: "700", color: c.text, marginBottom: 12 },
    label: { fontSize: 13, color: c.textSecondary, marginBottom: 4, marginTop: 8 },
    input: { backgroundColor: c.inputBg, borderWidth: 1, borderColor: c.border, borderRadius: 10, padding: 10, color: c.text },
    btn: { backgroundColor: c.primary, borderRadius: 10, padding: 12, alignItems: "center", marginTop: 14 },
    btnText: { color: "#fff", fontWeight: "700" },
    row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});
