import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { authFetch } from "../../helpers/fetch";
import image from "../../image/icon.png";

const StarDisplay = ({ score }) => {
    const stars = Math.round(score || 0);
    return (
        <span style={{ color: "#f59e0b", fontSize: "1.1rem" }}>
            {"★".repeat(stars)}{"☆".repeat(5 - stars)}
            <span style={{ color: "#6b7280", fontSize: "0.85rem", marginLeft: 6 }}>
                ({(score || 0).toFixed(1)})
            </span>
        </span>
    );
};

export const AdminCourseReport = () => {
    const [report, setReport] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(null);

    useEffect(() => {
        authFetch("admin/courses/report", {})
            .then(r => r.json())
            .then(data => {
                setReport(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const errorImage = (e) => { e.target.src = image; };

    if (loading) return <div className="admin-view"><h2>Cargando reporte...</h2></div>;

    return (
        <div className="admin-view">
            <h1 style={{ textAlign: "center", margin: "20px 0", fontSize: "2rem" }}>
                REPORTE — CURSOS MÁS ACEPTADOS
            </h1>
            {report.length === 0 && (
                <p style={{ textAlign: "center", color: "#6b7280" }}>
                    Aún no hay cursos con calificaciones.
                </p>
            )}
            {report.map((course, idx) => (
                <div
                    key={course.id}
                    style={{
                        background: "var(--card-bg, #fff)",
                        border: "1px solid #e5e7eb",
                        borderRadius: 10,
                        marginBottom: 18,
                        padding: "1rem 1.5rem",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.07)"
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                        <span style={{
                            background: "#3b82f6", color: "#fff",
                            borderRadius: "50%", width: 36, height: 36,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontWeight: 700, fontSize: "1.1rem", flexShrink: 0
                        }}>
                            {idx + 1}
                        </span>
                        <img
                            src={course.image}
                            alt={course.title}
                            onError={errorImage}
                            style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8, flexShrink: 0 }}
                        />
                        <div style={{ flex: 1 }}>
                            <h3 style={{ margin: 0 }}>{course.title}</h3>
                            <p style={{ margin: "2px 0", color: "#6b7280", fontSize: "0.9rem" }}>
                                Profesor: {course.teacher}
                            </p>
                            <StarDisplay score={course.score} />
                            <span style={{ marginLeft: 12, color: "#6b7280", fontSize: "0.85rem" }}>
                                {course.totalRatings} calificación{course.totalRatings !== 1 ? "es" : ""}
                            </span>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                            <button
                                className="btn btn-info"
                                style={{ fontSize: "0.85rem" }}
                                onClick={() => setExpanded(expanded === course.id ? null : course.id)}
                            >
                                {expanded === course.id ? "Ocultar comentarios" : `Ver ${course.comments.length} comentario${course.comments.length !== 1 ? "s" : ""}`}
                            </button>
                            <Link
                                className="btn btn-secondary"
                                to={`/admin/courses/${course.id}`}
                                style={{ fontSize: "0.85rem" }}
                            >
                                Detalle
                            </Link>
                        </div>
                    </div>
                    {expanded === course.id && (
                        <div style={{ marginTop: 16 }}>
                            {course.comments.length === 0 ? (
                                <p style={{ color: "#6b7280", fontStyle: "italic" }}>Sin comentarios aún.</p>
                            ) : (
                                course.comments.map((c, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            background: "var(--comment-bg, #f9fafb)",
                                            borderLeft: "3px solid #3b82f6",
                                            padding: "0.75rem 1rem",
                                            borderRadius: 6,
                                            marginBottom: 10
                                        }}
                                    >
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                                            <strong>{c.user}</strong>
                                            <StarDisplay score={c.score} />
                                        </div>
                                        <p style={{ margin: 0, color: "#374151" }}>{c.comment}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};
