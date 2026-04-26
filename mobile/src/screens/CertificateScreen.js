import React, { useRef } from "react";
import {
    View, Text, StyleSheet, TouchableOpacity,
    Alert, Share, ScrollView
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export const CertificateScreen = ({ route }) => {
    const { courseTitle } = route.params;
    const { user } = useAuth();
    const { colors } = useTheme();

    const today = new Date().toLocaleDateString("es-MX", {
        year: "numeric", month: "long", day: "numeric"
    });

    const handleShare = async () => {
        try {
            await Share.share({
                message: `🎓 ¡Completé el curso "${courseTitle}" en Caleiro!\nFecha: ${today}`,
                title: "Certificado Caleiro",
            });
        } catch (err) {
            Alert.alert("Error", "No se pudo compartir el certificado.");
        }
    };

    const s = styles(colors);

    return (
        <ScrollView contentContainerStyle={s.container}>
            {/* Certificado visual */}
            <View style={s.cert}>
                <View style={s.certBorder}>
                    <Text style={s.certLabel}>CALEIRO</Text>
                    <Text style={s.certSub}>Plataforma de Aprendizaje en Línea</Text>
                    <View style={s.divider} />
                    <Text style={s.certPresents}>Certifica que</Text>
                    <Text style={s.certName}>{user?.name} {user?.lastName}</Text>
                    <Text style={s.certCompleted}>ha completado satisfactoriamente el curso</Text>
                    <Text style={s.certCourse}>"{courseTitle}"</Text>
                    <View style={s.divider} />
                    <Text style={s.certDate}>{today}</Text>
                    <View style={s.seal}>
                        <Text style={s.sealText}>🎓</Text>
                    </View>
                </View>
            </View>

            <TouchableOpacity style={[s.btn, { backgroundColor: colors.primary }]} onPress={handleShare}>
                <Text style={s.btnText}>📤 Compartir certificado</Text>
            </TouchableOpacity>

            <Text style={{ color: colors.textSecondary, textAlign: "center", marginTop: 12, fontSize: 12 }}>
                También puedes ver y descargar tu certificado en PDF desde la versión web de Caleiro.
            </Text>
        </ScrollView>
    );
};

const styles = (c) => StyleSheet.create({
    container: { padding: 20, backgroundColor: c.bg, flexGrow: 1, alignItems: "center" },
    cert: {
        width: "100%", backgroundColor: "#fff",
        borderRadius: 16, padding: 4,
        shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 16, elevation: 8,
        marginBottom: 24
    },
    certBorder: {
        borderWidth: 3, borderColor: "#9E8AFC", borderRadius: 12,
        padding: 24, alignItems: "center"
    },
    certLabel: { fontSize: 28, fontWeight: "900", color: "#9E8AFC", letterSpacing: 4 },
    certSub: { color: "#6C63FF", fontSize: 11, marginBottom: 16, textAlign: "center" },
    divider: { width: "60%", height: 1, backgroundColor: "#e5e7eb", marginVertical: 14 },
    certPresents: { color: "#656478", fontSize: 13, marginBottom: 6 },
    certName: { fontSize: 24, fontWeight: "800", color: "#2F2E41", marginBottom: 8, textAlign: "center" },
    certCompleted: { color: "#656478", fontSize: 13, marginBottom: 6, textAlign: "center" },
    certCourse: { fontSize: 17, fontWeight: "700", color: "#6C63FF", textAlign: "center", marginBottom: 4 },
    certDate: { color: "#656478", fontSize: 12, marginTop: 4 },
    seal: {
        width: 60, height: 60, borderRadius: 30,
        backgroundColor: "#9E8AFC", alignItems: "center", justifyContent: "center",
        marginTop: 16, shadowColor: "#9E8AFC", shadowOpacity: 0.5, shadowRadius: 8, elevation: 4
    },
    sealText: { fontSize: 28 },
    btn: { borderRadius: 12, padding: 14, alignItems: "center", width: "100%" },
    btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
