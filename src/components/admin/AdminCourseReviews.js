import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { authFetch, noAuthFetch } from "../../helpers/fetch";

const StarDisplay = ({ score }) => {
    const stars = Math.round(score || 0);
    return (
        <span style={{ color: "#f59e0b" }}>
            {"★".repeat(stars)}{"☆".repeat(5 - stars)}
            <span style={{ color: "#6b7280", fontSize: "0.85rem", marginLeft: 6 }}>
                ({(score || 0).toFixed(1)})
            </span>
        </span>
    );
};

export const AdminCourseReviews = () => {
    const { id } = useParams();
    const [reviews, setReviews] = useState([]);
    const [courseInfo, setCourseInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            authFetch(`admin/course/${id}/reviews`, {}).then(r => r.json()),
            noAuthFetch(`course/${id}`, {}).then(r => r.json())
        ]).then(([rev, info]) => {
            setReviews(rev);
            setCourseInfo(info);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [id]);

    const totalViews = courseInfo?.units
        ?.flatMap(u => u.lessons || [])
        ?.reduce((acc, l) => acc + (l.views || 0), 0) || 0;

    const avgScore = reviews.length > 0
        ? (reviews.reduce((s, r) => s + (r.score || 0), 0) / reviews.length)
        : 0;

    if (loading) return <div className="admin-view"><h2>Cargando...</h2></div>;

    return (
        <div className="admin-view">
            <button className="btn btn-back" style={{ marginBottom: 16 }} onClick={() => window.history.back()}>
                <i className="fa-solid fa-rotate-left"></i> Regresar
            </button>
            <h1 style={{ textAlign: "center", margin: "0 0 20px 0", fontSize: "1.8rem" }}>
                {courseInfo?.title || `Curso #${id}`}
            </h1>

            {/* Resumen */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
                {[
                    { label: "Calificación promedio", value: <StarDisplay score={avgScore} />, bg: "#eff6ff" },
                    { label: "Total calificaciones", value: reviews.length, bg: "#f0fdf4" },
                    { label: "Visualizaciones totales", value: totalViews, bg: "#fef9c3" },
                ].map(({ label, value, bg }) => (
                    <div key={label} style={{
                        flex: "1 1 160px", background: bg,
                        border: "1px solid #e5e7eb", borderRadius: 10,
                        padding: "1rem", textAlign: "center"
                    }}>
                        <p style={{ margin: 0, color: "#6b7280", fontSize: "0.85rem" }}>{label}</p>
                        <div style={{ fontWeight: 700, fontSize: "1.3rem", marginTop: 4 }}>{value}</div>
                    </div>
                ))}
            </div>

            {/* Visualizaciones por lección */}
            {courseInfo?.units && courseInfo.units.length > 0 && (
                <div style={{ marginBottom: 28 }}>
                    <h2 style={{ fontSize: "1.2rem", marginBottom: 12 }}>Visualizaciones por lección</h2>
                    {courseInfo.units.map((unit, ui) => (
                        <div key={ui} style={{ marginBottom: 12 }}>
                            <h4 style={{ color: "#3b82f6", marginBottom: 6 }}>
                                Unidad {ui + 1}: {unit.title}
                            </h4>
                            {(unit.lessons || []).map((lesson, li) => (
                                <div key={li} style={{
                                    display: "flex", justifyContent: "space-between",
                                    padding: "6px 12px", background: "#f9fafb",
                                    borderRadius: 6, marginBottom: 4,
                                    border: "1px solid #e5e7eb"
                                }}>
                                    <span>{li + 1}. {lesson.title}</span>
                                    <span style={{ fontWeight: 600 }}>
                                        <i className="fa-solid fa-eye" style={{ marginRight: 4, color: "#3b82f6" }}></i>
                                        {lesson.views || 0}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}

            {/* Comentarios y calificaciones */}
            <h2 style={{ fontSize: "1.2rem", marginBottom: 12 }}>Calificaciones y comentarios</h2>
            {reviews.length === 0 ? (
                <p style={{ color: "#6b7280", fontStyle: "italic" }}>Este curso aún no tiene calificaciones.</p>
            ) : (
                reviews.map((r, i) => (
                    <div key={i} style={{
                        background: "var(--card-bg, #fff)",
                        border: "1px solid #e5e7eb",
                        borderRadius: 8,
                        padding: "1rem",
                        marginBottom: 12,
                        borderLeft: "4px solid #3b82f6"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", marginBottom: 6 }}>
                            <strong>{r.userName} {r.userLastName}</strong>
                            <StarDisplay score={r.score} />
                        </div>
                        {r.comment ? (
                            <p style={{ margin: 0, color: "#374151" }}>{r.comment}</p>
                        ) : (
                            <p style={{ margin: 0, color: "#9ca3af", fontStyle: "italic" }}>Sin comentario.</p>
                        )}
                    </div>
                ))
            )}
        </div>
    );
};
