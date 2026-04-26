import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { v4 as uuidv4 } from 'uuid';
import { closeModal } from "../../redux/actions/ui";
import { uploadVideoToFirebase } from "../../helpers/uploadVideo";
import { useForm } from "../../hooks/useForm";

export const InputLesson = ({ course, setValues }) => {

    const { unitActive: unit, lessonActive } = useSelector(state => state.courses);
    const { id: teacherId } = useSelector(state => state.auth.user);
    const dispatch = useDispatch();

    const [videoMode, setVideoMode] = useState(
        lessonActive?.linkVideo ? "url" : "url"
    );
    const [videoFile, setVideoFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploading, setUploading] = useState(false);

    const [lesson, setLesson, reset, setLessonValues] = useForm({
        title: lessonActive ? lessonActive.title : '',
        description: lessonActive ? lessonActive.description : '',
        linkDoc: lessonActive ? lessonActive.linkDoc : '',
        linkVideo: lessonActive ? lessonActive.linkVideo : '',
        unit: unit.id ? unit.id : null,
        uuid: lessonActive ? lessonActive.uuid : null,
        id: lessonActive && lessonActive.id
    });

    const handleVideoFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const maxSize = 500 * 1024 * 1024; // 500 MB
        if (file.size > maxSize) {
            alert("El video no puede superar los 500 MB.");
            return;
        }
        setVideoFile(file);
    };

    const uploadVideo = async () => {
        if (!videoFile) return lesson.linkVideo;
        setUploading(true);
        try {
            const url = await uploadVideoToFirebase(videoFile, teacherId, setUploadProgress);
            setLessonValues({ ...lesson, linkVideo: url });
            setUploading(false);
            return url;
        } catch (err) {
            setUploading(false);
            alert("Error al subir el video: " + err.message);
            return null;
        }
    };

    const addLesson = async (e) => {
        e.preventDefault();

        let finalLesson = { ...lesson };

        if (videoMode === "upload" && videoFile) {
            const url = await uploadVideo();
            if (!url) return;
            finalLesson = { ...lesson, linkVideo: url };
        }

        if (!finalLesson.linkVideo) {
            alert("Por favor agrega un video (URL o sube un archivo).");
            return;
        }

        if (!unit.uuid && unit.id !== null) {
            if (!finalLesson.uuid && finalLesson.id !== null) {
                setValues({
                    ...course,
                    units: course.units.map(u => u.id === unit.id ? {
                        ...u,
                        lessons: u.lessons.map(l => l.id === finalLesson.id ? finalLesson : l)
                    } : u)
                });
                dispatch(closeModal());
            } else if (finalLesson.uuid === null && finalLesson.id === null) {
                const newUuid = uuidv4();
                setValues({
                    ...course,
                    units: course.units.map(u => u.id === unit.id ? {
                        ...u,
                        lessons: [...u.lessons, { ...finalLesson, uuid: newUuid }]
                    } : u)
                });
                reset();
            } else if (finalLesson.uuid !== null && finalLesson.id === null) {
                setValues({
                    ...course,
                    units: course.units.map(u => u.id === unit.id ? {
                        ...u,
                        lessons: u.lessons.map(l => l.uuid === finalLesson.uuid ? finalLesson : l)
                    } : u)
                });
                dispatch(closeModal());
            }
        } else if (unit.uuid !== null && unit.id === null) {
            if (finalLesson.uuid === null && finalLesson.id === null) {
                const newUuid = uuidv4();
                setValues({
                    ...course,
                    units: course.units.map(u => u.uuid === unit.uuid ? {
                        ...u,
                        lessons: [...u.lessons, { ...finalLesson, uuid: newUuid }]
                    } : u)
                });
                reset();
            } else if (finalLesson.uuid !== null && finalLesson.id === null) {
                setValues({
                    ...course,
                    units: course.units.map(u => u.uuid === unit.uuid ? {
                        ...u,
                        lessons: u.lessons.map(l => finalLesson.uuid === l.uuid ? finalLesson : l)
                    } : u)
                });
                dispatch(closeModal());
            }
        }
    };

    return (
        <form className="course-lesson" onSubmit={addLesson}>
            <div className="course-form-group dark">
                <label>Lección</label>
                <input
                    type="text" className="form-control"
                    placeholder="Título de la lección"
                    name="title" value={lesson.title} onChange={setLesson} required
                />
            </div>
            <div className="course-form-group dark">
                <label>Descripción</label>
                <textarea
                    className="form-control" rows="3"
                    placeholder="Descripción"
                    name="description" value={lesson.description} onChange={setLesson} required
                />
            </div>
            <div className="course-form-group dark">
                <label>Link de apuntes / documento</label>
                <input
                    type="text" className="form-control"
                    placeholder="URL del documento (Google Drive, PDF...)"
                    name="linkDoc" value={lesson.linkDoc} onChange={setLesson} required
                />
            </div>

            {/* Selector modo video */}
            <div className="course-form-group dark">
                <label>Video de la lección</label>
                <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem" }}>
                    <button
                        type="button"
                        className={videoMode === "url" ? "btn btn-primary" : "btn btn-outline"}
                        style={{ flex: 1, padding: "0.4rem 0", fontSize: "0.85rem" }}
                        onClick={() => setVideoMode("url")}
                    >
                        <i className="fa-solid fa-link"></i> URL (YouTube / Vimeo)
                    </button>
                    <button
                        type="button"
                        className={videoMode === "upload" ? "btn btn-primary" : "btn btn-outline"}
                        style={{ flex: 1, padding: "0.4rem 0", fontSize: "0.85rem" }}
                        onClick={() => setVideoMode("upload")}
                    >
                        <i className="fa-solid fa-upload"></i> Subir archivo
                    </button>
                </div>

                {videoMode === "url" ? (
                    <input
                        type="text" className="form-control"
                        placeholder="https://www.youtube.com/watch?v=..."
                        name="linkVideo" value={lesson.linkVideo} onChange={setLesson}
                    />
                ) : (
                    <div>
                        <input
                            type="file"
                            className="form-control"
                            accept="video/mp4,video/webm,video/ogg,video/quicktime"
                            onChange={handleVideoFile}
                            style={{ marginBottom: "0.5rem" }}
                        />
                        {videoFile && (
                            <p style={{ fontSize: "0.85rem", color: "#9E8AFC" }}>
                                <i className="fa-solid fa-film"></i> {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(1)} MB)
                            </p>
                        )}
                        {uploading && (
                            <div style={{ marginTop: "0.5rem" }}>
                                <div style={{
                                    background: "#e5e7eb", borderRadius: 999,
                                    height: 8, overflow: "hidden"
                                }}>
                                    <div style={{
                                        width: `${uploadProgress}%`,
                                        background: "#9E8AFC",
                                        height: "100%",
                                        transition: "width 0.3s"
                                    }} />
                                </div>
                                <p style={{ fontSize: "0.8rem", textAlign: "center", marginTop: 4 }}>
                                    Subiendo... {uploadProgress}%
                                </p>
                            </div>
                        )}
                        {lesson.linkVideo && !uploading && (
                            <p style={{ fontSize: "0.8rem", color: "#2AB930", marginTop: 4 }}>
                                <i className="fa-solid fa-check-circle"></i> Video subido correctamente
                            </p>
                        )}
                    </div>
                )}
            </div>

            <button
                className="btn btn-primary"
                type="submit"
                disabled={uploading}
                style={{ marginTop: "0.5rem" }}
            >
                {uploading
                    ? `Subiendo video ${uploadProgress}%...`
                    : lesson.id ? "Guardar" : lesson.uuid ? "Guardar" : "Agregar lección"
                }
            </button>
        </form>
    );
};
