import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import StoryList from './components/StoryList';
import StoryRoom from './components/StoryRoom';
import CreateStory from './components/CreateStory';
import './App.css';

const SOCKET_URL = 'http://localhost:3001';

function App() {
  const [socket, setSocket] = useState(null);
  const [userName, setUserName] = useState('');
  const [isNameSet, setIsNameSet] = useState(false);
  const [currentView, setCurrentView] = useState('home'); // home, create, story
  const [currentStoryId, setCurrentStoryId] = useState(null);
  const [stories, setStories] = useState([]);

  useEffect(() => {
    // Fetch stories list
    fetchStories();
    const interval = setInterval(fetchStories, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isNameSet && !socket) {
      const newSocket = io(SOCKET_URL);
      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('Connected to server');
      });

      newSocket.on('error', (error) => {
        console.error('Socket error:', error);
        alert(error.message);
      });

      return () => {
        newSocket.close();
      };
    }
  }, [isNameSet]);

  const fetchStories = async () => {
    try {
      const response = await fetch(`${SOCKET_URL}/api/stories`);
      const data = await response.json();
      setStories(data);
    } catch (error) {
      console.error('Error fetching stories:', error);
    }
  };

  const handleSetName = (e) => {
    e.preventDefault();
    if (userName.trim()) {
      setIsNameSet(true);
    }
  };

  const handleCreateStory = async (title) => {
    try {
      const response = await fetch(`${SOCKET_URL}/api/stories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, userName }),
      });
      const data = await response.json();
      setCurrentStoryId(data.id);
      setCurrentView('story');
      fetchStories();
    } catch (error) {
      console.error('Error creating story:', error);
      alert('Error creating story');
    }
  };

  const handleJoinStory = (storyId) => {
    setCurrentStoryId(storyId);
    setCurrentView('story');
  };

  const handleLeaveStory = () => {
    setCurrentView('home');
    setCurrentStoryId(null);
    fetchStories();
  };

  if (!isNameSet) {
    return (
      <div className="app">
        <div className="welcome-screen">
          <h1>🎭 Generador de Historias Interactivas</h1>
          <p className="subtitle">Crea relatos colaborativos en tiempo real</p>
          <form onSubmit={handleSetName} className="name-form">
            <input
              type="text"
              placeholder="Ingresa tu nombre"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="name-input"
              autoFocus
            />
            <button type="submit" className="btn btn-primary">
              Comenzar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎭 Historias Interactivas</h1>
        <div className="user-info">
          <span className="user-name">👤 {userName}</span>
        </div>
      </header>

      <main className="app-main">
        {currentView === 'home' && (
          <>
            <div className="actions">
              <button
                onClick={() => setCurrentView('create')}
                className="btn btn-primary btn-large"
              >
                ✨ Crear Nueva Historia
              </button>
            </div>
            <StoryList stories={stories} onJoinStory={handleJoinStory} />
          </>
        )}

        {currentView === 'create' && (
          <CreateStory
            onCreateStory={handleCreateStory}
            onCancel={() => setCurrentView('home')}
          />
        )}

        {currentView === 'story' && socket && currentStoryId && (
          <StoryRoom
            socket={socket}
            storyId={currentStoryId}
            userName={userName}
            onLeave={handleLeaveStory}
          />
        )}
      </main>
    </div>
  );
}

export default App;
