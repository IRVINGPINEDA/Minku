import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Rating } from 'react-simple-star-rating';
import Swal from "sweetalert2";
import { saveUserCourse, startLoadUserCourse } from "../../redux/actions/student";

export const RatingCourse = () => {
    const { active: course } = useSelector(state => state.courses);
    const { id: userId } = useSelector(state => state.auth.user);

    const [rating, setRating] = useState(course.score || 0);
    const [comment, setComment] = useState(course.comment || "");

    const dispatch = useDispatch();

    const handleSubmit = () => {
        if (!rating || rating === 0) {
            Swal.fire("Calificación requerida", "Por favor selecciona una puntuación de 1 a 5 estrellas.", "warning");
            return;
        }
        if (!comment || comment.trim().length < 10) {
            Swal.fire("Comentario requerido", "Por favor escribe un comentario de al menos 10 caracteres.", "warning");
            return;
        }
        dispatch(saveUserCourse({
            userId,
            courseId: course.id,
            score: rating,
            progress: course.progress,
            comment: comment.trim()
        }));
        dispatch(startLoadUserCourse(course.id, userId));
    };

    useEffect(() => {
        setRating(course.score || 0);
        setComment(course.comment || "");
    }, [course.score, course.comment]);

    useEffect(() => {
        dispatch(startLoadUserCourse(course.id, userId));
    }, [dispatch, course.id, userId]);

    return (
        <div className="user-course-score">
            <h2 className="text-info">Califica el curso:</h2>
            <br />
            <Rating
                onClick={(rate) => setRating(rate)}
                ratingValue={rating}
            />
            <br />
            <div style={{ marginTop: "1rem" }}>
                <h4>Comentario <span style={{ color: "#dc3545" }}>*</span></h4>
                <textarea
                    className="form-control"
                    rows={4}
                    placeholder="Comparte tu experiencia con este curso (mínimo 10 caracteres)..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    style={{ resize: "vertical", marginTop: "0.5rem" }}
                />
                <small style={{ color: "#6c757d" }}>{comment.length} caracteres</small>
            </div>
            <button
                className="btn btn-primary"
                style={{ marginTop: "1rem", width: "100%" }}
                onClick={handleSubmit}
            >
                Enviar calificación
            </button>
        </div>
    );
};
