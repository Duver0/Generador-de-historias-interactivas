import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import "./App.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:4000"
).replace(/\/$/, "");
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_BASE_URL;

const connectionLabels = {
  idle: "Esperando",
  connecting: "Conectando",
  connected: "En línea",
  disconnected: "Desconectado",
};

const getInitialTheme = () => {
  if (typeof window === "undefined") {
    return "light";
  }
  const stored = window.localStorage?.getItem("story-theme");
  if (stored === "dark" || stored === "light") {
    return stored;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const fetchJson = async (path, options = {}) => {
  const config = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  };
  const response = await fetch(`${API_BASE_URL}${path}`, config);
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Error al comunicar con el servidor");
  }
  return response.json();
};

const safeId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;

function Segment({ segment }) {
  const time = segment.createdAt
    ? new Date(segment.createdAt).toLocaleTimeString()
    : "";
  return (
    <article className="segment">
      <header>
        <span className="segment-author">{segment.author}</span>
        <time>{time}</time>
      </header>
      <p>{segment.text}</p>
    </article>
  );
}

function Participant({ participant }) {
  const time = participant.joinedAt
    ? new Date(participant.joinedAt).toLocaleTimeString()
    : null;
  return (
    <li className="participant">
      <span className="status-dot" />
      <div>
        <strong>{participant.name}</strong>
        {time && <small>desde {time}</small>}
      </div>
    </li>
  );
}

export default function App() {
  const [username, setUsername] = useState("");
  const [roomInput, setRoomInput] = useState("");
  const [storyTitle, setStoryTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [session, setSession] = useState(null);
  const [roomState, setRoomState] = useState(null);
  const [newSegment, setNewSegment] = useState("");
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("idle");

  const socketRef = useRef(null);
  const [theme, setTheme] = useState(() => getInitialTheme());
  const [autoAlias] = useState(() => `Narrador-${Math.floor(Math.random() * 900 + 100)}`);

  const pushMessage = useCallback((content, variant = "info") => {
    setMessages((prev) => {
      const next = [...prev.slice(-6), { id: safeId(), content, variant }];
      return next;
    });
  }, []);

  const orderedSegments = useMemo(() => {
    if (!roomState?.segments) return [];
    return [...roomState.segments].sort((a, b) => {
      const left = typeof a.createdAt === "number" ? a.createdAt : Date.parse(a.createdAt || "") || 0;
      const right = typeof b.createdAt === "number" ? b.createdAt : Date.parse(b.createdAt || "") || 0;
      return left - right;
    });
  }, [roomState]);

  const participants = roomState?.participants || [];

  useEffect(() => {
    setMessages([]);
  }, [session?.roomId]);

  useEffect(() => {
    if (typeof document === "undefined" || typeof window === "undefined") {
      return;
    }
    document.body.classList.toggle("dark-theme", theme === "dark");
    window.localStorage?.setItem("story-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!session?.roomId) {
      return undefined;
    }

    let isMounted = true;
    fetchJson(`/api/stories/${session.roomId}`)
      .then((data) => {
        if (isMounted) {
          setRoomState(data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [session?.roomId]);

  useEffect(() => {
    if (!session?.roomId || !session?.username) {
      return undefined;
    }

    const socket = io(SOCKET_URL, {
      autoConnect: true,
      transports: ["websocket"],
    });
    socketRef.current = socket;
    setConnectionStatus("connecting");

    const joinPayload = {
      roomId: session.roomId,
      username: session.username,
      prompt: session.prompt || "",
    };

    const cleanupConnection = () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("room_state");
      socket.off("system_message");
      socket.off("error_message");
      socket.off("new_segment");
    };

    socket.on("connect", () => {
      setConnectionStatus("connected");
      setError("");
      socket.emit("join_room", joinPayload);
    });

    socket.on("disconnect", () => {
      setConnectionStatus("disconnected");
    });

    const handleTransportError = (err) => {
      setError(err.message || "No pudimos conectar al servidor");
      setConnectionStatus("disconnected");
    };

    socket.io.on("error", handleTransportError);

    socket.on("room_state", (payload) => {
      setRoomState(payload);
    });

    socket.on("system_message", (text) => pushMessage(text, "system"));

    socket.on("error_message", (message) => {
      setError(message);
      pushMessage(message, "error");
    });

    socket.on("new_segment", (segment) => {
      setRoomState((prev) => {
        if (!prev) {
          return prev;
        }
        const alreadyExists = prev.segments?.some((item) => item.id === segment.id);
        if (alreadyExists) {
          return prev;
        }
        return { ...prev, segments: [...prev.segments, segment] };
      });
    });

    return () => {
      cleanupConnection();
      socket.io.off("error", handleTransportError);
      socket.disconnect();
      socketRef.current = null;
      setConnectionStatus("idle");
    };
  }, [session?.roomId, session?.username, session?.prompt, pushMessage]);

  const handleJoinRoom = useCallback(
    (event) => {
      event.preventDefault();
      const roomId = roomInput.trim();
      if (!roomId) {
        setError("Necesitas ingresar el código de la sala");
        return;
      }

      const finalName = username.trim() || autoAlias;
      setSession({
        roomId,
        username: finalName,
        prompt: prompt.trim(),
      });
      setError("");
      pushMessage(`Entraste a la sala ${roomId}`, "success");
    },
    [autoAlias, prompt, pushMessage, roomInput, username]
  );

  const handleCreateRoom = useCallback(async () => {
    try {
      setIsCreating(true);
      setError("");
      const payload = {
        title: storyTitle.trim() || "Nueva historia comunitaria",
        prompt: prompt.trim(),
      };
      const room = await fetchJson("/api/stories", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setRoomInput(room.id);
      const finalName = username.trim() || autoAlias;
      setSession({
        roomId: room.id,
        username: finalName,
        prompt: payload.prompt,
      });
      setRoomState(room);
      pushMessage(`Sala ${room.id} creada 🎉`, "success");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsCreating(false);
    }
  }, [autoAlias, prompt, storyTitle, username, pushMessage]);

  const handleLeave = () => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setSession(null);
    setRoomState(null);
    setConnectionStatus("idle");
    setNewSegment("");
    pushMessage("Dejaste la sala", "system");
  };

  const handleSubmitSegment = (event) => {
    event.preventDefault();
    if (!newSegment.trim() || !socketRef.current) {
      return;
    }
    socketRef.current.emit("submit_segment", {
      roomId: session?.roomId,
      text: newSegment.trim(),
    });
    setNewSegment("");
  };

  const handleClearStory = () => {
    if (!socketRef.current || !orderedSegments.length) {
      return;
    }
    socketRef.current.emit("clear_story");
  };

  const handleThemeToggle = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Generador de historias interactivas</p>
          <h1>Construye relatos colectivos en vivo</h1>
          <p>
            Crea una sala, invita a tus amigos y dejen fluir la creatividad cadenciosa del cadáver exquisito.
          </p>
        </div>
        <div className="hero-actions">
          <button
            type="button"
            className="ghost theme-toggle"
            onClick={handleThemeToggle}
          >
            {theme === "dark" ? "Modo claro ☀️" : "Modo oscuro 🌙"}
          </button>
          <span className={`status-pill status-${connectionStatus}`}>
            {connectionLabels[connectionStatus]}
          </span>
        </div>
      </header>

      <main className="layout">
        <section className="card join-card">
          {!session ? (
            <>
              <h2>Organiza tu sala</h2>
              <form className="join-form" onSubmit={handleJoinRoom}>
                <label>
                  Nombre o alias
                  <input
                    type="text"
                    value={username}
                    placeholder={autoAlias}
                    onChange={(event) => setUsername(event.target.value)}
                  />
                </label>
                <label>
                  Código de sala
                  <input
                    type="text"
                    value={roomInput}
                    onChange={(event) => setRoomInput(event.target.value)}
                    placeholder="ej: luna-azul"
                  />
                </label>
                <label>
                  Título opcional
                  <input
                    type="text"
                    value={storyTitle}
                    onChange={(event) => setStoryTitle(event.target.value)}
                    placeholder="Historias desde la Nebulosa"
                  />
                </label>
                <label>
                  Prompt o punto de partida (opcional)
                  <textarea
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    rows={3}
                    placeholder="Una nave recibe un mensaje desconocido..."
                  />
                </label>
                <div className="form-actions">
                  <button type="button" className="secondary" onClick={handleCreateRoom} disabled={isCreating}>
                    {isCreating ? "Creando..." : "Crear sala nueva"}
                  </button>
                  <button type="submit" className="primary">
                    Unirme a sala
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="session-panel">
              <div>
                <p className="eyebrow">Sala activa</p>
                <h2>{roomState?.title || storyTitle || "Historia sin título"}</h2>
                <p className="room-code">Código: {session.roomId}</p>
              </div>
              <div className="session-actions">
                <button type="button" className="ghost" onClick={handleClearStory} disabled={!orderedSegments.length}>
                  Reiniciar historia
                </button>
                <button type="button" className="secondary" onClick={handleLeave}>
                  Cambiar de sala
                </button>
              </div>
            </div>
          )}
          {error && <p className="alert error">{error}</p>}
        </section>

        {session && (
          <div className="story-columns">
            <section className="card story-card">
              <div className="story-header">
                <div>
                  <p className="eyebrow">Relato compartido</p>
                  <h2>{roomState?.title || "Historia sin título"}</h2>
                </div>
                <span className={`status-pill status-${connectionStatus}`}>
                  {connectionLabels[connectionStatus]}
                </span>
              </div>
              {roomState?.prompt && <p className="prompt">{roomState.prompt}</p>}
              <div className="segments-list">
                {orderedSegments.length === 0 ? (
                  <p className="empty-state">
                    Todavía no hay aportes. Escribe el primer fragmento y marca el tono de la historia.
                  </p>
                ) : (
                  orderedSegments.map((segment) => <Segment key={segment.id} segment={segment} />)
                )}
              </div>
              <form className="segment-form" onSubmit={handleSubmitSegment}>
                <textarea
                  value={newSegment}
                  onChange={(event) => setNewSegment(event.target.value)}
                  rows={4}
                  placeholder="Añade tu parte del relato..."
                />
                <button type="submit" className="primary" disabled={!newSegment.trim()}>
                  Enviar fragmento
                </button>
              </form>
            </section>

            <section className="card side-card">
              <div>
                <h3>Participantes ({participants.length})</h3>
                <ul className="participants">
                  {participants.length === 0 && <li className="empty-state">Sé la primera persona en unirte.</li>}
                  {participants.map((participant) => (
                    <Participant key={participant.id} participant={participant} />
                  ))}
                </ul>
              </div>
              <div className="activity">
                <h3>Actividad</h3>
                <ul>
                  {messages.length === 0 && <li className="empty-state">Aún no hay eventos.</li>}
                  {messages.map((message) => (
                    <li key={message.id} className={`activity-item ${message.variant}`}>
                      {message.content}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
