import React, { useEffect, useState } from "react";
import {
    View, Text, ScrollView, Image, TouchableOpacity,
    StyleSheet, ActivityIndicator, Alert
} from "react-native";
import { apiGet, apiPost } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const Stars = ({ score, colors }) => {
    const full = Math.round(score || 0);
    return <Text style={{ color: "#f59e0b", fontSize: 15 }}>{"★".repeat(full)}{"☆".repeat(5 - full)}</Text>;
};

export const CourseDetailScreen = ({ route, navigation }) => {
    const { courseId } = route.params;
    const { user } = useAuth();
    const { colors } = useTheme();
    const [course, setCourse] = useState(null);
    const [enrolled, setEnrolled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [enrolling, setEnrolling] = useState(false);

    useEffect(() => {
        load();
    }, [courseId]);

    const load = async () => {
        setLoading(true);
        try {
            const res = await apiGet(`course/${courseId}`);
            const data = await res.json();
            setCourse(data);
            if (user) {
                const res2 = await apiGet(`user/course/${courseId}/info/${user.id}`);
                if (res2.status === 200) setEnrolled(true);
            }
        } catch {}
        setLoading(false);
    };

    const handleEnroll = async () => {
        if (!user) return navigation.navigate("Login");
        Alert.alert(
            "Inscribirse",
            `¿Confirmas tu inscripción al curso "${course.title}"?`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Confirmar",
                    onPress: async () => {
                        setEnrolling(true);
                        try {
                            const res = await apiPost("user/course/save", {
                                courseId: course.id,
                                userId: user.id,
                            });
                            const body = await res.json();
                            if (body.error) throw new Error(body.error);
                            setEnrolled(true);
                            Alert.alert("¡Éxito!", "Inscripción realizada correctamente.");
                        } catch (err) {
                            Alert.alert("Error", err.message);
                        }
                        setEnrolling(false);
                    },
                },
            ]
        );
    };

    const s = styles(colors);

    if (loading) return (
        <View style={[s.center, { backgroundColor: colors.bg }]}>
            <ActivityIndicator size="large" color={colors.primary} />
        </View>
    );

    if (!course) return (
        <View style={s.center}><Text style={{ color: colors.text }}>Curso no encontrado</Text></View>
    );

    return (
        <ScrollView style={s.container}>
            <Image source={{ uri: course.image }} style={s.image} resizeMode="cover" />
            <View style={s.body}>
                <Text style={s.category}>{course.category}</Text>
                <Text style={s.title}>{course.title}</Text>
                <Text style={s.teacher}>Profesor: {course.teacher}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <Stars score={course.score} colors={colors} />
                    <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                        {(course.score || 0).toFixed(1)} / 5
                    </Text>
                </View>
                <Text style={s.price}>${course.price}</Text>
                <Text style={s.sectionTitle}>Descripción</Text>
                <Text style={s.description}>{course.description}</Text>

                {course.units && course.units.length > 0 && (
                    <>
                        <Text style={s.sectionTitle}>Contenido del curso</Text>
                        {course.units.map((unit, ui) => (
                            <View key={ui} style={s.unitBlock}>
                                <Text style={s.unitTitle}>Unidad {ui + 1}: {unit.title}</Text>
                                {unit.lessons?.map((lesson, li) => (
                                    <View key={li} style={s.lessonRow}>
                                        <Text style={{ color: colors.primary, marginRight: 6 }}>▸</Text>
                                        <Text style={{ color: colors.textSecondary, flex: 1 }} numberOfLines={1}>
                                            {li + 1}. {lesson.title}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        ))}
                    </>
                )}

                {enrolled ? (
                    <TouchableOpacity
                        style={[s.btn, { backgroundColor: colors.success }]}
                        onPress={() => navigation.navigate("LessonView", {
                            courseId: course.id, courseTitle: course.title
                        })}
                    >
                        <Text style={s.btnText}>Continuar aprendiendo</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={s.btn} onPress={handleEnroll} disabled={enrolling}>
                        {enrolling
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={s.btnText}>Inscribirse — ${course.price}</Text>}
                    </TouchableOpacity>
                )}
            </View>
        </ScrollView>
    );
};

const styles = (c) => StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: c.bg },
    image: { width: "100%", height: 220 },
    body: { padding: 20 },
    category: { color: c.primary, fontWeight: "700", fontSize: 12, textTransform: "uppercase", marginBottom: 6 },
    title: { fontSize: 22, fontWeight: "800", color: c.text, marginBottom: 6 },
    teacher: { color: c.textSecondary, marginBottom: 8 },
    price: { fontSize: 24, fontWeight: "900", color: c.primaryDark, marginBottom: 16 },
    sectionTitle: { fontSize: 17, fontWeight: "700", color: c.text, marginBottom: 8, marginTop: 12 },
    description: { color: c.textSecondary, lineHeight: 22, marginBottom: 8 },
    unitBlock: { marginBottom: 12 },
    unitTitle: { fontWeight: "700", color: c.text, marginBottom: 4 },
    lessonRow: { flexDirection: "row", alignItems: "center", paddingVertical: 4, paddingLeft: 8 },
    btn: { backgroundColor: c.primary, borderRadius: 14, padding: 16, alignItems: "center", marginTop: 20, marginBottom: 32 },
    btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
