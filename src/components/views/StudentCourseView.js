import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { startLoadCourse } from "../../redux/actions/courses";
import { startLoadUserCourse } from "../../redux/actions/student";
import { showModal } from "../../redux/actions/ui";
import { Lesson } from "../ui/Lesson";
import { Loading } from "../ui/Loading";
import { Modal } from "../ui/Modal";
import { RatingCourse } from "../ui/RatingCourse";

export const StudentCourseView = ({ role }) => {

    const dispatch = useDispatch();
    const { id } = useParams();
    const { active } = useSelector(state => state.courses);
    const { user } = useSelector(state => state.auth);

    const [select, setSelect] = useState(0);

    useEffect(() => {
        if (user)
            if (role) dispatch(startLoadCourse(id));
            else dispatch(startLoadUserCourse(id, user.id));
    }, [dispatch, id, user, role]);

    if (!active) {
        return <Loading />;
    }

    const back = () => window.history.back();
    const openModal = () => { setSelect(0); dispatch(showModal()); };
    const showScore = () => { setSelect(1); dispatch(showModal()); };

    // ── Calcula lista plana de lecciones con índice global ──────────────────
    const allLessons = active.units
        ? active.units.flatMap(u => u.lessons || [])
        : [];

    const isLessonCompleted = (lessonId) => {
        if (!active.lessons) return false;
        const match = active.lessons.find(l => l.lesson.id === lessonId);
        return match ? match.status : false;
    };

    // La lección N está bloqueada si la lección N-1 no está completada
    const isLocked = (globalIndex) => {
        if (role) return false; // admin/teacher ve todo desbloqueado
        if (globalIndex === 0) return false; // primera siempre libre
        const prevLesson = allLessons[globalIndex - 1];
        return !isLessonCompleted(prevLesson.id);
    };

    let globalIdx = 0;

    return (
        <div className="course-view animate__animated animate__fadeIn">
            <div className={"course-image a" + id}>
                <div className="student-course-info">
                    <div className="student-course-names">
                        <h2 className="student-course-title">{active.title}</h2>
                        <h4 className="student-course-teacher">{active.teacher}</h4>
                        <div className="flex space-between align-items-center">
                            <h6 className="student-course-category">{active.category}</h6>
                            {!role && (
                                <button className="btn btn-success no-margin" onClick={showScore}>
                                    Calificar
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="student-course-buttons">
                        <button className="btn btn-large btn-primary mb" onClick={openModal}>
                            <i className="fa-solid fa-address-book"></i> Contacto
                        </button>
                        <button className="btn btn-large btn-light" onClick={back}>
                            <i className="fa-solid fa-rotate-left"></i> Regresar
                        </button>
                    </div>
                </div>
            </div>

            {/* Barra de progreso general */}
            {!role && active.progress != null && (
                <div style={{ padding: "1rem 5%", borderBottom: "1px solid #e5e7eb" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontWeight: 600 }}>Progreso del curso</span>
                        <span style={{ fontWeight: 700, color: "#9E8AFC" }}>
                            {Math.round(active.progress)}%
                        </span>
                    </div>
                    <div style={{ background: "#e5e7eb", borderRadius: 999, height: 8, overflow: "hidden" }}>
                        <div style={{
                            width: `${active.progress}%`,
                            background: active.progress >= 100 ? "#2AB930" : "#9E8AFC",
                            height: "100%", transition: "width 0.4s"
                        }} />
                    </div>
                </div>
            )}

            <div className="course-container">
                {active.units && active.units.map((unit, unitIndex) => (
                    <div className="student-course-units" key={unitIndex}>
                        <h2 className="student-course-unit">
                            Unidad {unitIndex + 1}: {unit.title}
                        </h2>
                        <div className="student-course-lessons">
                            {unit.lessons && unit.lessons.map((lesson, lessonIndex) => {
                                const gi = globalIdx++;
                                return (
                                    <Lesson
                                        key={lessonIndex}
                                        lesson={{ ...lesson, index: gi + 1 }}
                                        active={active}
                                        role={role}
                                        isLocked={isLocked(gi)}
                                    />
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <Modal title={select === 0 ? "INFORMACIÓN DE CONTACTO" : "CALIFICAR CURSO"}>
                {select === 0 ? (
                    <>
                        <h3 className="text-contact">
                            <span className="text-contact-title">Correo:</span>
                            <br /> {active.teacherEmail}
                        </h3>
                        <h3 className="text-contact">
                            <span className="text-contact-title">Teléfono:</span>
                            <br /> {active.teacherPhone}
                        </h3>
                    </>
                ) : (
                    <RatingCourse />
                )}
            </Modal>
        </div>
    );
};
