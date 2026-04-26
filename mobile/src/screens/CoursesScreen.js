import React, { useEffect, useState, useCallback } from "react";
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet,
    TextInput, Image, ActivityIndicator, RefreshControl
} from "react-native";
import { apiGet } from "../api/client";
import { useTheme } from "../context/ThemeContext";

const PLACEHOLDER = "https://via.placeholder.com/400x200?text=Curso";

const Stars = ({ score, colors }) => {
    const full = Math.round(score || 0);
    return (
        <Text style={{ color: "#f59e0b", fontSize: 13 }}>
            {"★".repeat(full)}{"☆".repeat(5 - full)}
            <Text style={{ color: colors.textSecondary }}> {(score || 0).toFixed(1)}</Text>
        </Text>
    );
};

export const CoursesScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const [courses, setCourses] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await apiGet("courses");
            const data = await res.json();
            setCourses(data);
            setFiltered(data);
        } catch {}
        setLoading(false);
        setRefreshing(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        const q = search.toLowerCase();
        setFiltered(courses.filter(c =>
            c.title.toLowerCase().includes(q) ||
            (c.teacher?.name + " " + c.teacher?.lastName).toLowerCase().includes(q)
        ));
    }, [search, courses]);

    const s = styles(colors);

    if (loading) return (
        <View style={[s.center, { backgroundColor: colors.bg }]}>
            <ActivityIndicator size="large" color={colors.primary} />
        </View>
    );

    return (
        <View style={s.container}>
            <TextInput
                style={s.search}
                placeholder="Buscar cursos..."
                placeholderTextColor={colors.textSecondary}
                value={search}
                onChangeText={setSearch}
            />
            <FlatList
                data={filtered}
                keyExtractor={(item) => String(item.id)}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} />}
                contentContainerStyle={{ paddingBottom: 20 }}
                ListEmptyComponent={<Text style={{ color: colors.textSecondary, textAlign: "center", marginTop: 40 }}>No se encontraron cursos.</Text>}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={s.card}
                        onPress={() => navigation.navigate("CourseDetail", { courseId: item.id })}
                        activeOpacity={0.85}
                    >
                        <Image
                            source={{ uri: item.image || PLACEHOLDER }}
                            style={s.image}
                            resizeMode="cover"
                        />
                        <View style={s.info}>
                            <Text style={s.category}>{item.category?.name || item.category}</Text>
                            <Text style={s.title} numberOfLines={2}>{item.title}</Text>
                            <Text style={s.teacher} numberOfLines={1}>
                                {item.teacher?.name || ""} {item.teacher?.lastName || ""}
                            </Text>
                            <View style={s.row}>
                                <Stars score={item.score} colors={colors} />
                                <Text style={s.price}>${item.price}</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
};

const styles = (c) => StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg, padding: 12 },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    search: { backgroundColor: c.card, borderRadius: 10, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: c.border, color: c.text },
    card: { backgroundColor: c.card, borderRadius: 14, marginBottom: 14, overflow: "hidden", elevation: 2, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 6 },
    image: { width: "100%", height: 160 },
    info: { padding: 12 },
    category: { fontSize: 11, color: c.primary, fontWeight: "700", textTransform: "uppercase", marginBottom: 4 },
    title: { fontSize: 16, fontWeight: "700", color: c.text, marginBottom: 4 },
    teacher: { fontSize: 13, color: c.textSecondary, marginBottom: 6 },
    row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    price: { fontSize: 15, fontWeight: "800", color: c.primaryDark },
});
