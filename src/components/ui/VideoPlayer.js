import { useEffect, useRef, useState } from "react";
import { getYouTubeEmbedUrl, getVimeoEmbedUrl, isYouTubeUrl, isVimeoUrl } from "../../helpers/uploadVideo";

/**
 * VideoPlayer detecta el tipo de URL y renderiza el reproductor adecuado.
 * Llama a onComplete() cuando el video llega al 90% de reproducción o termina.
 */
export const VideoPlayer = ({ url, onComplete, completed }) => {
    const videoRef = useRef(null);
    const iframeRef = useRef(null);
    const [done, setDone] = useState(completed || false);

    const markDone = () => {
        if (!done) {
            setDone(true);
            if (onComplete) onComplete();
        }
    };

    // ── HTML5 native video ──────────────────────────────────────────────────
    const handleTimeUpdate = () => {
        const v = videoRef.current;
        if (!v || done) return;
        if (v.duration > 0 && v.currentTime / v.duration >= 0.9) {
            markDone();
        }
    };

    // ── YouTube via postMessage ─────────────────────────────────────────────
    useEffect(() => {
        if (!isYouTubeUrl(url)) return;

        const onMsg = (e) => {
            try {
                const data = JSON.parse(e.data);
                // YT player state 0 = ended
                if (data.event === "onStateChange" && data.info === 0) {
                    markDone();
                }
                // Also mark done at 90% via info.currentTime / info.duration
                if (data.event === "infoDelivery" && data.info?.currentTime && data.info?.duration) {
                    if (data.info.currentTime / data.info.duration >= 0.9) {
                        markDone();
                    }
                }
            } catch {
                // ignore non-JSON messages
            }
        };

        window.addEventListener("message", onMsg);
        return () => window.removeEventListener("message", onMsg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url, done]);

    // ── Vimeo via postMessage ───────────────────────────────────────────────
    useEffect(() => {
        if (!isVimeoUrl(url)) return;

        const onMsg = (e) => {
            try {
                const data = JSON.parse(e.data);
                if (data.event === "finish") markDone();
                if (data.event === "timeupdate" && data.data?.percent >= 0.9) markDone();
            } catch {}
        };

        window.addEventListener("message", onMsg);

        // Tell Vimeo player to send events
        const sendReady = () => {
            if (iframeRef.current?.contentWindow) {
                iframeRef.current.contentWindow.postMessage(
                    JSON.stringify({ method: "addEventListener", value: "finish" }),
                    "*"
                );
                iframeRef.current.contentWindow.postMessage(
                    JSON.stringify({ method: "addEventListener", value: "timeupdate" }),
                    "*"
                );
            }
        };

        const t = setTimeout(sendReady, 2000);
        return () => {
            window.removeEventListener("message", onMsg);
            clearTimeout(t);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url, done]);

    useEffect(() => {
        setDone(completed || false);
    }, [completed]);

    const containerStyle = {
        position: "relative",
        width: "100%",
        paddingTop: "56.25%", // 16:9
        background: "#000",
        borderRadius: 10,
        overflow: "hidden",
        marginBottom: "0.75rem"
    };

    const iframeStyle = {
        position: "absolute", top: 0, left: 0,
        width: "100%", height: "100%", border: "none"
    };

    if (isYouTubeUrl(url)) {
        return (
            <div style={containerStyle}>
                <iframe
                    ref={iframeRef}
                    style={iframeStyle}
                    src={getYouTubeEmbedUrl(url)}
                    title="Video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
                {done && <CompletedBadge />}
            </div>
        );
    }

    if (isVimeoUrl(url)) {
        return (
            <div style={containerStyle}>
                <iframe
                    ref={iframeRef}
                    style={iframeStyle}
                    src={getVimeoEmbedUrl(url)}
                    title="Video"
                    allowFullScreen
                />
                {done && <CompletedBadge />}
            </div>
        );
    }

    // Firebase Storage / direct mp4
    return (
        <div style={{ marginBottom: "0.75rem" }}>
            <video
                ref={videoRef}
                src={url}
                controls
                controlsList="nodownload"
                onTimeUpdate={handleTimeUpdate}
                onEnded={markDone}
                style={{ width: "100%", borderRadius: 10, background: "#000", maxHeight: 420 }}
            />
            {done && <CompletedBadge />}
        </div>
    );
};

const CompletedBadge = () => (
    <div style={{
        position: "absolute", bottom: 8, right: 8,
        background: "#2AB930", color: "#fff",
        padding: "2px 10px", borderRadius: 999,
        fontSize: "0.78rem", fontWeight: 700,
        pointerEvents: "none"
    }}>
        ✓ Completado
    </div>
);
