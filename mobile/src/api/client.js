import AsyncStorage from "@react-native-async-storage/async-storage";

// Cambia esta URL a tu dominio en producción
export const BASE_URL = "https://caleiro.online/api";

export const apiFetch = async (endpoint, options = {}) => {
    const token = await AsyncStorage.getItem("token");
    const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: token } : {}),
        ...(options.headers || {}),
    };
    const res = await fetch(`${BASE_URL}/${endpoint}`, { ...options, headers });
    return res;
};

export const apiGet = (endpoint) => apiFetch(endpoint, { method: "GET" });

export const apiPost = (endpoint, body) =>
    apiFetch(endpoint, { method: "POST", body: JSON.stringify(body) });

export const apiPut = (endpoint, body) =>
    apiFetch(endpoint, { method: "PUT", body: JSON.stringify(body) });

export const apiDelete = (endpoint) => apiFetch(endpoint, { method: "DELETE" });
