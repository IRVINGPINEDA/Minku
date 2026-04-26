import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { startSaveLesson, registerLessonView } from "../../redux/actions/student";
import { VideoPlayer } from "./VideoPlayer";

export const Lesson = ({ lesson, active, role, isLocked }) => {

    const { index, title, description, linkDoc, linkVideo, id } = lesson;
    const [completed, setCompleted] = useState(false);
    const [open, setOpen] = useState(false);
    const [videoWatched, setVideoWatched] = useState(false);

    const dispatch = useDispatch();

    useEffect(() => {
        if (role) return;
        if (active.lessons) {
            const match = active.lessons.find(l => l.lesson.id === id);
            if (match) {
                setCompleted(match.status);
                if (match.status) setVideoWatched(true);
            }
        }
    }, [active, id, role]);

    const handleToggle = () => {
        if (isLocked && !completed) return;
        setOpen(prev => !prev);
    };

    const handleVideoComplete = () => {
        setVideoWatched(true);
        if (!role) {
            dispatch(registerLessonView(id));
        }
    };

    const handleMarkComplete = () => {
        if (!videoWatched) return;
        if (!role && !completed) {
            dispatch(startSaveLesson(id, true));
            setCompleted(true);
        }
    };

    const locked = isLocked && !completed;

    return (
        <div className={`div-lesson ${locked ? "lesson-locked" : ""} ${completed ? "lesson-completed" : ""}`}>
            {/* Header clicable */}
            <div
                className="lesson-header"
                onClick={handleToggle}
                style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    cursor: locked ? "not-allowed" : "pointer",
                    padding: "0.75rem 0",
                    opacity: locked ? 0.55 : 1
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{
                        width: 28, height: 28, borderRadius: "50%",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: completed ? "#2AB930" : locked ? "#9ca3af" : "#9E8AFC",
                        color: "#fff", fontWeight: 700, fontSize: "0.85rem", flexShrink: 0
                    }}>
                        {completed
                            ? <i className="fa-solid fa-check" />
                            : locked
                                ? <i className="fa-solid fa-lock" />
                                : index}
                    </span>
                    <div>
                        <h2 className="lesson-title" style={{ margin: 0 }}>
                            <span className="text-primary">{title}</span>
                        </h2>
                        {locked && (
                            <small style={{ color: "#9ca3af" }}>
                                Completa la lección anterior para desbloquear
                            </small>
                        )}
                    </div>
                </div>
                {!locked && (
                    <i className={`fa-solid ${open ? "fa-chevron-up" : "fa-chevron-down"}`}
                        style={{ color: "#9E8AFC" }} />
                )}
            </div>

            {/* Contenido expandible */}
            {open && !locked && (
                <div className="lesson-body" style={{ paddingBottom: "1rem" }}>
                    <p className="lesson-description" style={{ marginBottom: "1rem" }}>{description}</p>

                    {/* Reproductor */}
                    {linkVideo && (
                        <VideoPlayer
                            url={linkVideo}
                            completed={videoWatched}
                            onComplete={handleVideoComplete}
                        />
                    )}

                    {/* Apuntes y botón completar */}
                    <div className="lesson-links" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                        {linkDoc && (
                            <a
                                className="btn btn-link"
                                href={linkDoc}
                                target="_blank"
                                rel="noreferrer"
                            >
                                <i className="fa-solid fa-book"></i> Apuntes
                            </a>
                        )}

                        {!role && (
                            <button
                                className={`btn ${completed ? "btn-success" : videoWatched ? "btn-primary" : "btn-secondary"}`}
                                disabled={!videoWatched || completed}
                                onClick={handleMarkComplete}
                                style={{ marginLeft: "auto" }}
                                title={!videoWatched ? "Debes ver el video antes de marcar como completado" : ""}
                            >
                                {completed
                                    ? <><i className="fa-solid fa-check"></i> Completada</>
                                    : videoWatched
                                        ? <><i className="fa-solid fa-check-circle"></i> Marcar completada</>
                                        : <><i className="fa-solid fa-eye"></i> Ve el video primero</>
                                }
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
