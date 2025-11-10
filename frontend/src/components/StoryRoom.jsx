import { useState, useEffect, useRef } from 'react';
import './StoryRoom.css';

function StoryRoom({ socket, storyId, userName, onLeave }) {
  const [storyState, setStoryState] = useState(null);
  const [contribution, setContribution] = useState('');
  const [fullStory, setFullStory] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const contributionInputRef = useRef(null);

  useEffect(() => {
    // Join the story room
    socket.emit('join-story', { storyId, userName });

    // Listen for story state
    socket.on('story-state', (state) => {
      setStoryState(state);
    });

    // Listen for new contributions
    socket.on('new-contribution', (data) => {
      setStoryState(prev => ({
        ...prev,
        visibleText: data.visibleText,
        contributionCount: data.contributionCount
      }));
      addNotification(`${data.contribution.userName} agregó: "${data.contribution.text}"`);
    });

    // Listen for participants joining
    socket.on('participant-joined', (data) => {
      setStoryState(prev => ({
        ...prev,
        participants: data.participants
      }));
      addNotification(`${data.userName} se unió a la historia`);
    });

    // Listen for participants leaving
    socket.on('participant-left', (data) => {
      setStoryState(prev => ({
        ...prev,
        participants: data.participants
      }));
      addNotification(`${data.userName} dejó la historia`);
    });

    // Listen for story ended
    socket.on('story-ended', (data) => {
      setFullStory(data);
      addNotification('¡La historia ha finalizado!');
    });

    // Listen for full story
    socket.on('full-story', (data) => {
      setFullStory(data);
    });

    return () => {
      socket.off('story-state');
      socket.off('new-contribution');
      socket.off('participant-joined');
      socket.off('participant-left');
      socket.off('story-ended');
      socket.off('full-story');
    };
  }, [socket, storyId, userName]);

  const addNotification = (message) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const handleSubmitContribution = (e) => {
    e.preventDefault();
    if (contribution.trim()) {
      socket.emit('add-contribution', {
        storyId,
        userName,
        text: contribution.trim()
      });
      setContribution('');
    }
  };

  const handleViewFullStory = () => {
    socket.emit('get-full-story', { storyId });
  };

  const handleEndStory = () => {
    if (confirm('¿Estás seguro de que quieres finalizar esta historia?')) {
      socket.emit('end-story', { storyId });
    }
  };

  if (!storyState) {
    return (
      <div className="story-room">
        <div className="loading">
          <p>Cargando historia...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="story-room">
      <div className="notifications">
        {notifications.map(n => (
          <div key={n.id} className="notification">
            {n.message}
          </div>
        ))}
      </div>

      <div className="room-header">
        <div className="room-title">
          <h2>{storyState.title}</h2>
          <span className="contribution-count">
            📝 {storyState.contributionCount} contribuciones
          </span>
        </div>
        <div className="room-actions">
          <button onClick={handleViewFullStory} className="btn btn-secondary">
            📖 Ver Historia Completa
          </button>
          <button onClick={handleEndStory} className="btn btn-danger">
            🏁 Finalizar Historia
          </button>
          <button onClick={onLeave} className="btn btn-secondary">
            ← Salir
          </button>
        </div>
      </div>

      <div className="room-content">
        <div className="participants-panel">
          <h3>👥 Participantes ({storyState.participants.length})</h3>
          <ul className="participants-list">
            {storyState.participants.map((p, index) => (
              <li key={index} className="participant">
                {p.userName}
              </li>
            ))}
          </ul>
        </div>

        <div className="story-panel">
          <div className="story-info-box">
            <p className="info-text">
              ℹ️ <strong>Estilo "Cadáver Exquisito":</strong> Solo puedes ver la última contribución.
              La historia completa se revelará al finalizarla.
            </p>
          </div>

          <div className="visible-story">
            <h3>Última Contribución:</h3>
            {storyState.visibleText ? (
              <div className="story-text">
                <p>{storyState.visibleText}</p>
              </div>
            ) : (
              <div className="empty-story">
                <p>Sé el primero en comenzar esta historia...</p>
              </div>
            )}
          </div>

          {!fullStory && (
            <form onSubmit={handleSubmitContribution} className="contribution-form">
              <h3>✍️ Tu Contribución:</h3>
              <textarea
                ref={contributionInputRef}
                value={contribution}
                onChange={(e) => setContribution(e.target.value)}
                placeholder="Agrega tu parte a la historia (una oración o párrafo corto)..."
                className="contribution-input"
                rows="4"
              />
              <div className="contribution-actions">
                <span className="char-count">
                  {contribution.length} caracteres
                </span>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!contribution.trim()}
                >
                  Agregar a la Historia
                </button>
              </div>
            </form>
          )}

          {fullStory && (
            <div className="full-story-view">
              <h3>📖 Historia Completa:</h3>
              <div className="full-story-text">
                <p>{fullStory.fullText}</p>
              </div>
              <div className="contributions-detail">
                <h4>Contribuciones por autor:</h4>
                {fullStory.contributions.map((contrib, index) => (
                  <div key={index} className="contribution-item">
                    <div className="contribution-author">
                      {contrib.userName}
                    </div>
                    <div className="contribution-text">
                      {contrib.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StoryRoom;
