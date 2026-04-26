import React, { useEffect, useState, useCallback } from "react";
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet,
    Image, ActivityIndicator, RefreshControl
} from "react-native";
import { apiGet } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export const MyCoursesScreen = ({ navigation }) => {
    const { user } = useAuth();
    const { colors } = useTheme();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async (silent = false) => {
        if (!user) return;
        if (!silent) setLoading(true);
        try {
            const res = await apiGet(`user/${user.id}/courses`);
            const data = await res.json();
            setCourses(data);
        } catch {}
        setLoading(false);
        setRefreshing(false);
    }, [user]);

    useEffect(() => { load(); }, [load]);

    const s = styles(colors);

    if (!user) return (
        <View style={[s.center, { backgroundColor: colors.bg }]}>
            <Text style={{ color: colors.text, marginBottom: 16 }}>Inicia sesión para ver tus cursos</Text>
        </View>
    );

    if (loading) return (
        <View style={[s.center, { backgroundColor: colors.bg }]}>
            <ActivityIndicator size="large" color={colors.primary} />
        </View>
    );

    return (
        <View style={s.container}>
            <FlatList
                data={courses}
                keyExtractor={(_, i) => String(i)}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} />}
                contentContainerStyle={{ paddingBottom: 20 }}
                ListEmptyComponent={
                    <View style={s.center}>
                        <Text style={{ color: colors.textSecondary, textAlign: "center", marginTop: 40 }}>
                            Aún no tienes cursos inscritos.{"\n"}¡Explora el catálogo!
                        </Text>
                    </View>
                }
                renderItem={({ item }) => {
                    const c = item.course || item;
                    const progress = item.progress || 0;
                    return (
                        <TouchableOpacity
                            style={s.card}
                            onPress={() => navigation.navigate("LessonView", {
                                courseId: c.id,
                                courseTitle: c.title,
                            })}
                            activeOpacity={0.85}
                        >
                            <Image source={{ uri: c.image }} style={s.image} resizeMode="cover" />
                            <View style={s.info}>
                                <Text style={s.title} numberOfLines={2}>{c.title}</Text>
                                <Text style={s.teacher} numberOfLines={1}>{c.teacher}</Text>
                                <View style={s.progressRow}>
                                    <View style={s.progressBg}>
                                        <View style={[s.progressBar, {
                                            width: `${progress}%`,
                                            backgroundColor: progress >= 100 ? colors.success : colors.primary
                                        }]} />
                                    </View>
                                    <Text style={{ color: colors.textSecondary, fontSize: 12, marginLeft: 8 }}>
                                        {Math.round(progress)}%
                                    </Text>
                                </View>
                                {progress >= 100 && (
                                    <TouchableOpacity
                                        style={[s.certBtn, { borderColor: colors.success }]}
                                        onPress={() => navigation.navigate("Certificate", {
                                            courseId: c.id, courseTitle: c.title
                                        })}
                                    >
                                        <Text style={{ color: colors.success, fontWeight: "700", fontSize: 12 }}>
                                            🎓 Ver certificado
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </TouchableOpacity>
                    );
                }}
            />
        </View>
    );
};

const styles = (c) => StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg, padding: 12 },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    card: { backgroundColor: c.card, borderRadius: 14, marginBottom: 14, overflow: "hidden", elevation: 2, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 6 },
    image: { width: "100%", height: 140 },
    info: { padding: 12 },
    title: { fontSize: 16, fontWeight: "700", color: c.text, marginBottom: 2 },
    teacher: { color: c.textSecondary, fontSize: 13, marginBottom: 8 },
    progressRow: { flexDirection: "row", alignItems: "center" },
    progressBg: { flex: 1, backgroundColor: c.border, borderRadius: 999, height: 6, overflow: "hidden" },
    progressBar: { height: "100%", borderRadius: 999 },
    certBtn: { marginTop: 10, borderWidth: 1.5, borderRadius: 8, padding: 6, alignItems: "center" },
});
