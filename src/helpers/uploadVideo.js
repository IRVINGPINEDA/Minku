import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { storage } from "../firebase/firebase-config";

export const uploadVideoToFirebase = (file, teacherId, onProgress) => {
    return new Promise((resolve, reject) => {
        const ext = file.name.split(".").pop();
        const path = `courseVideos/${teacherId}/${Date.now()}.${ext}`;
        const fileRef = ref(storage, path);
        const task = uploadBytesResumable(fileRef, file);

        task.on(
            "state_changed",
            (snapshot) => {
                const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                if (onProgress) onProgress(pct);
            },
            (error) => reject(error),
            () => {
                getDownloadURL(task.snapshot.ref).then(resolve).catch(reject);
            }
        );
    });
};

export const isYouTubeUrl = (url) =>
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)/.test(url);

export const isVimeoUrl = (url) =>
    /vimeo\.com\//.test(url);

export const getYouTubeEmbedUrl = (url) => {
    const match = url.match(
        /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    if (!match) return url;
    return `https://www.youtube.com/embed/${match[1]}?enablejsapi=1&rel=0&modestbranding=1`;
};

export const getVimeoEmbedUrl = (url) => {
    const match = url.match(/vimeo\.com\/(\d+)/);
    if (!match) return url;
    return `https://player.vimeo.com/video/${match[1]}?api=1`;
};
