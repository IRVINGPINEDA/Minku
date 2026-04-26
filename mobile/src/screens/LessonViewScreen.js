import React, { useEffect, useState, useRef } from "react";
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet,
    ActivityIndicator, Alert, Linking, Modal, TextInput
} from "react-native";
import { WebView } from "react-native-webview";
import { Video, ResizeMode } from "expo-av";
import { apiGet, apiPost } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import StarRating from "react-native-star-rating-widget";

const isYouTube = (url) => /youtube\.com|youtu\.be/.test(url);
const isVimeo = (url) => /vimeo\.com/.test(url);

const getYTEmbed = (url) => {
    const m = url.match(/(?:watch\?v=|embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return m ? `https://www.youtube.com/embed/${m[1]}?enablejsapi=1&rel=0` : url;
};

export const LessonViewScreen = ({ route, navigation }) => {
    const { courseId, courseTitle } = route.params;
    const { user } = useAuth();
    const { colors } = useTheme();

    const [course, setCourse] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [activeLesson, setActiveLesson] = useState(null);
    const [videoWatched, setVideoWatched] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showRating, setShowRating] = useState(false);
    const [progress, setProgress] = useState(0);

    const videoRef = useRef(null);

    useEffect(() => {
        navigation.setOptions({ title: courseTitle || "Lecciones" });
        loadCourse();
    }, [courseId]);

    const loadCourse = async () => {
        setLoading(true);
        try {
            const [courseRes, lessonsRes, progressRes] = await Promise.all([
                apiGet(`course/${courseId}`),
                apiGet(`user/course/${courseId}/lessons/${user.id}`),
                apiGet(`user/course/${courseId}/info/${user.id}`),
            ]);
            const courseData = await courseRes.json();
            const lessonsData = await lessonsRes.json();
            const progressData = await progressRes.json();

            setCourse(courseData);
            setLessons(lessonsData);
            setProgress(progressData.progress || 0);

            // Abrir primera lección no completada
            const allLessons = (courseData.units || []).flatMap(u => u.lessons || []);
            const first = allLessons.find(l => {
                const match = lessonsData.find(ul => ul.lesson.id === l.id);
                return !match?.status;
            }) || allLessons[0];
            if (first) openLesson(first, lessonsData);
        } catch (e) {
            Alert.alert("Error", "No se pudo cargar el curso.");
        }
        setLoading(false);
    };

    const isCompleted = (lessonId) => {
        const match = lessons.find(l => l.lesson.id === lessonId);
        return match?.status || false;
    };

    const openLesson = (lesson, lessonList = lessons) => {
        setActiveLesson(lesson);
        const alreadyDone = lessonList.find(l => l.lesson.id === lesson.id)?.status;
        setVideoWatched(alreadyDone || false);
    };

    const allLessons = (course?.units || []).flatMap(u => u.lessons || []);

    const isLocked = (lessonId) => {
        const idx = allLessons.findIndex(l => l.id === lessonId);
        if (idx <= 0) return false;
        return !isCompleted(allLessons[idx - 1].id);
    };

    const handleMarkComplete = async () => {
        if (!videoWatched || !activeLesson) return;
        try {
            await apiPost("user/lesson/save", {
                idUser: user.id,
                idCourse: courseId,
                idLesson: activeLesson.id,
                status: true,
            });
            await apiPost(`user/lesson/${activeLesson.id}/view`, {});

            const newLessons = lessons.map(l =>
                l.lesson.id === activeLesson.id ? { ...l, status: true } : l
            );
            setLessons(newLessons);

            const total = allLessons.length;
            const done = newLessons.filter(l => l.status).length;
            const newProgress = (done / total) * 100;
            setProgress(newProgress);

            if (newProgress >= 100) {
                setShowRating(true);
            } else {
                // Avanzar a la siguiente lección
                const idx = allLessons.findIndex(l => l.id === activeLesson.id);
                if (idx < allLessons.length - 1) {
                    openLesson(allLessons[idx + 1], newLessons);
                }
            }
        } catch {
            Alert.alert("Error", "No se pudo guardar el progreso.");
        }
    };

    const s = styles(colors);

    if (loading) return (
        <View style={[s.center, { backgroundColor: colors.bg }]}>
            <ActivityIndicator size="large" color={colors.primary} />
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
            {/* Reproductor activo */}
            {activeLesson && (
                <View style={s.playerContainer}>
                    {isYouTube(activeLesson.linkVideo) || isVimeo(activeLesson.linkVideo) ? (
                        <WebView
                            style={s.webview}
                            source={{ uri: isYouTube(activeLesson.linkVideo) ? getYTEmbed(activeLesson.linkVideo) : activeLesson.linkVideo }}
                            allowsFullscreenVideo
                            onMessage={(e) => {
                                try {
                                    const data = JSON.parse(e.nativeEvent.data);
                                    if (data.event === "onStateChange" && data.info === 0) setVideoWatched(true);
                                    if (data.event === "infoDelivery" && data.info?.currentTime / data.info?.duration >= 0.9) setVideoWatched(true);
                                } catch {}
                            }}
                            injectedJavaScript={`
                                window.onYouTubeIframeAPIReady=function(){};
                                (function(){
                                    var old=window.postMessage.bind(window);
                                    window.addEventListener('message',function(e){
                                        try{var d=JSON.parse(e.data);window.ReactNativeWebView.postMessage(e.data);}catch(err){}
                                    });
                                })();
                            `}
                        />
                    ) : (
                        <Video
                            ref={videoRef}
                            source={{ uri: activeLesson.linkVideo }}
                            style={s.nativeVideo}
                            useNativeControls
                            resizeMode={ResizeMode.CONTAIN}
                            onPlaybackStatusUpdate={(status) => {
                                if (!status.isLoaded) return;
                                if (status.didJustFinish || (status.durationMillis > 0 && status.positionMillis / status.durationMillis >= 0.9)) {
                                    setVideoWatched(true);
                                }
                            }}
                        />
                    )}
                    <View style={s.lessonMeta}>
                        <Text style={s.lessonTitle}>{activeLesson.title}</Text>
                        <Text style={s.lessonDesc}>{activeLesson.description}</Text>
                        <View style={s.btnRow}>
                            {activeLesson.linkDoc ? (
                                <TouchableOpacity
                                    style={[s.actionBtn, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.primary }]}
                                    onPress={() => Linking.openURL(activeLesson.linkDoc)}
                                >
                                    <Text style={{ color: colors.primary, fontWeight: "600" }}>📄 Apuntes</Text>
                                </TouchableOpacity>
                            ) : null}
                            <TouchableOpacity
                                style={[s.actionBtn, {
                                    backgroundColor: isCompleted(activeLesson.id) ? colors.success : videoWatched ? colors.primary : colors.border,
                                    flex: 1
                                }]}
                                onPress={handleMarkComplete}
                                disabled={!videoWatched || isCompleted(activeLesson.id)}
                            >
                                <Text style={{ color: "#fff", fontWeight: "700" }}>
                                    {isCompleted(activeLesson.id) ? "✓ Completada" : videoWatched ? "Marcar completada" : "Ve el video primero"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}

            {/* Lista de lecciones */}
            <View style={s.progressHeader}>
                <Text style={{ color: colors.text, fontWeight: "700" }}>Progreso: {Math.round(progress)}%</Text>
                <View style={s.progressBg}>
                    <View style={[s.progressBar, { width: `${progress}%`, backgroundColor: progress >= 100 ? colors.success : colors.primary }]} />
                </View>
            </View>

            <ScrollView style={{ flex: 1 }}>
                {course?.units?.map((unit, ui) => (
                    <View key={ui}>
                        <Text style={s.unitTitle}>Unidad {ui + 1}: {unit.title}</Text>
                        {unit.lessons?.map((lesson, li) => {
                            const done = isCompleted(lesson.id);
                            const locked = isLocked(lesson.id);
                            const active = activeLesson?.id === lesson.id;
                            return (
                                <TouchableOpacity
                                    key={li}
                                    style={[s.lessonRow, active && s.lessonActive, done && s.lessonDone, locked && s.lessonLocked]}
                                    onPress={() => !locked && openLesson(lesson)}
                                    disabled={locked}
                                >
                                    <View style={[s.lessonBadge, {
                                        backgroundColor: done ? colors.success : locked ? "#9ca3af" : colors.primary
                                    }]}>
                                        <Text style={s.badgeText}>{done ? "✓" : locked ? "🔒" : li + 1}</Text>
                                    </View>
                                    <Text style={[s.lessonRowTitle, { color: locked ? colors.textSecondary : colors.text }]} numberOfLines={2}>
                                        {lesson.title}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                ))}
                <View style={{ height: 30 }} />
            </ScrollView>

            {/* Modal de calificación */}
            <RatingModal
                visible={showRating}
                colors={colors}
                onSubmit={async (score, comment) => {
                    try {
                        await apiPost("user/course/save", {
                            userId: user.id,
                            courseId,
                            score,
                            progress: 100,
                            comment,
                        });
                        setShowRating(false);
                        navigation.navigate("Certificate", { courseId, courseTitle });
                    } catch {
                        Alert.alert("Error", "No se pudo enviar la calificación.");
                    }
                }}
            />
        </View>
    );
};

const RatingModal = ({ visible, colors, onSubmit }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [loading, setLoading] = useState(false);

    const submit = async () => {
        if (!rating) return Alert.alert("Requerido", "Por favor selecciona una calificación.");
        if (!comment || comment.trim().length < 10) return Alert.alert("Requerido", "El comentario debe tener al menos 10 caracteres.");
        setLoading(true);
        await onSubmit(rating, comment.trim());
        setLoading(false);
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={{ flex: 1, backgroundColor: colors.bg, padding: 24, justifyContent: "center" }}>
                <Text style={{ fontSize: 24, fontWeight: "800", color: colors.text, textAlign: "center", marginBottom: 8 }}>
                    🎉 ¡Curso completado!
                </Text>
                <Text style={{ color: colors.textSecondary, textAlign: "center", marginBottom: 24 }}>
                    Califica tu experiencia para continuar
                </Text>
                <StarRating
                    rating={rating}
                    onChange={setRating}
                    starSize={40}
                    color="#f59e0b"
                    style={{ alignSelf: "center", marginBottom: 20 }}
                />
                <TextInput
                    style={{
                        backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border,
                        borderRadius: 10, padding: 12, color: colors.text, minHeight: 100,
                        textAlignVertical: "top", marginBottom: 8
                    }}
                    placeholder="Comparte tu experiencia (mín. 10 caracteres)..."
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    value={comment}
                    onChangeText={setComment}
                />
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 20 }}>
                    {comment.length} caracteres
                </Text>
                <TouchableOpacity
                    style={{ backgroundColor: colors.primary, borderRadius: 12, padding: 14, alignItems: "center" }}
                    onPress={submit}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Enviar y ver certificado</Text>}
                </TouchableOpacity>
            </View>
        </Modal>
    );
};

const styles = (c) => StyleSheet.create({
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    playerContainer: { backgroundColor: "#000" },
    webview: { height: 220 },
    nativeVideo: { width: "100%", height: 220 },
    lessonMeta: { backgroundColor: c.card, padding: 14 },
    lessonTitle: { fontSize: 16, fontWeight: "700", color: c.text, marginBottom: 4 },
    lessonDesc: { fontSize: 13, color: c.textSecondary, marginBottom: 10 },
    btnRow: { flexDirection: "row", gap: 8 },
    actionBtn: { borderRadius: 10, padding: 10, alignItems: "center", justifyContent: "center", minWidth: 100 },
    progressHeader: { backgroundColor: c.card, padding: 12, borderBottomWidth: 1, borderColor: c.border },
    progressBg: { marginTop: 6, backgroundColor: c.border, borderRadius: 999, height: 6, overflow: "hidden" },
    progressBar: { height: "100%", borderRadius: 999 },
    unitTitle: { fontSize: 14, fontWeight: "700", color: c.primary, padding: 12, paddingBottom: 4, backgroundColor: c.bg },
    lessonRow: { flexDirection: "row", alignItems: "center", padding: 12, paddingLeft: 16, borderBottomWidth: 1, borderColor: c.border, backgroundColor: c.card, gap: 12 },
    lessonActive: { borderLeftWidth: 3, borderLeftColor: c.primary },
    lessonDone: { backgroundColor: c.card },
    lessonLocked: { opacity: 0.5 },
    lessonBadge: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", flexShrink: 0 },
    badgeText: { color: "#fff", fontWeight: "700", fontSize: 11 },
    lessonRowTitle: { flex: 1, fontSize: 14 },
});
