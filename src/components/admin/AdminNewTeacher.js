import { useState } from "react";
import { useDispatch } from "react-redux";
import Swal from "sweetalert2";
import { authFetch } from "../../helpers/fetch";
import { startLoadTeachers } from "../../redux/actions/admin";

export const AdminNewTeacher = () => {
    const dispatch = useDispatch();

    const [form, setForm] = useState({
        name: "",
        lastName: "",
        email: "",
        password: "",
        specialty: "",
        phone: ""
    });

    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { name, lastName, email, password, specialty } = form;
        if (!name || !lastName || !email || !password || !specialty) {
            Swal.fire("Campos requeridos", "Nombre, apellido, correo, contraseña y especialidad son obligatorios.", "warning");
            return;
        }
        setLoading(true);
        try {
            const resp = await authFetch("admin/teacher/new", { ...form, role: 2, status: 1 }, "POST");
            const body = await resp.json();
            if (body.status === 200) {
                Swal.fire("¡Éxito!", "Profesor creado correctamente.", "success");
                dispatch(startLoadTeachers());
                setForm({ name: "", lastName: "", email: "", password: "", specialty: "", phone: "" });
            } else {
                Swal.fire("Error", body.error || "No se pudo crear el profesor.", "error");
            }
        } catch {
            Swal.fire("Error", "Error de conexión.", "error");
        }
        setLoading(false);
    };

    return (
        <div className="admin-view">
            <h1 style={{ textAlign: "center", margin: "20px 0", fontSize: "2rem" }}>
                REGISTRAR NUEVO PROFESOR
            </h1>
            <form
                className="profile-container"
                onSubmit={handleSubmit}
                style={{ maxWidth: 600, margin: "0 auto" }}
            >
                <div className="user-form">
                    {[
                        { label: "Nombre(s)", name: "name", type: "text" },
                        { label: "Apellido(s)", name: "lastName", type: "text" },
                        { label: "Correo electrónico", name: "email", type: "email" },
                        { label: "Contraseña temporal", name: "password", type: "password" },
                        { label: "Especialidad", name: "specialty", type: "text", placeholder: "Ej: Desarrollo Web, Diseño UX..." },
                        { label: "Teléfono (opcional)", name: "phone", type: "tel" }
                    ].map(({ label, name, type, placeholder }) => (
                        <div key={name}>
                            <h3 className="user-form-title">{label}:</h3>
                            <div className="user-form-group">
                                <input
                                    className="user-form-input"
                                    type={type}
                                    name={name}
                                    value={form[name]}
                                    onChange={handleChange}
                                    placeholder={placeholder || ""}
                                    style={{ width: "100%", padding: "0.5rem" }}
                                />
                            </div>
                        </div>
                    ))}
                    <button
                        className="btn btn-primary"
                        type="submit"
                        disabled={loading}
                        style={{ marginTop: "1.5rem", width: "100%" }}
                    >
                        {loading ? "Guardando..." : "Crear Profesor"}
                    </button>
                </div>
            </form>
        </div>
    );
};
