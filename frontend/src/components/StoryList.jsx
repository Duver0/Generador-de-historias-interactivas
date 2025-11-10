import './StoryList.css';

function StoryList({ stories, onJoinStory }) {
  const activeStories = stories.filter(s => s.isActive);
  const endedStories = stories.filter(s => !s.isActive);

  return (
    <div className="story-list">
      {activeStories.length === 0 && endedStories.length === 0 && (
        <div className="empty-state">
          <p>📖 No hay historias todavía</p>
          <p className="empty-subtitle">Sé el primero en crear una historia colaborativa</p>
        </div>
      )}

      {activeStories.length > 0 && (
        <>
          <h2>🎯 Historias Activas</h2>
          <div className="stories-grid">
            {activeStories.map(story => (
              <div key={story.id} className="story-card active">
                <div className="story-header">
                  <h3>{story.title}</h3>
                  <span className="story-status active">● En vivo</span>
                </div>
                <div className="story-info">
                  <div className="story-meta">
                    <span>👤 {story.participants} participantes</span>
                    <span>📝 {story.contributions} contribuciones</span>
                  </div>
                  <p className="story-creator">Creada por: {story.createdBy}</p>
                </div>
                <button
                  onClick={() => onJoinStory(story.id)}
                  className="btn btn-primary btn-block"
                >
                  Unirse a la Historia
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {endedStories.length > 0 && (
        <>
          <h2 style={{ marginTop: '2rem' }}>📚 Historias Completadas</h2>
          <div className="stories-grid">
            {endedStories.map(story => (
              <div key={story.id} className="story-card ended">
                <div className="story-header">
                  <h3>{story.title}</h3>
                  <span className="story-status ended">● Finalizada</span>
                </div>
                <div className="story-info">
                  <div className="story-meta">
                    <span>👤 {story.participants} participantes</span>
                    <span>📝 {story.contributions} contribuciones</span>
                  </div>
                  <p className="story-creator">Creada por: {story.createdBy}</p>
                </div>
                <button
                  onClick={() => onJoinStory(story.id)}
                  className="btn btn-secondary btn-block"
                >
                  Ver Historia
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default StoryList;
