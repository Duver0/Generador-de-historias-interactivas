import { useState } from 'react';
import './CreateStory.css';

function CreateStory({ onCreateStory, onCancel }) {
  const [title, setTitle] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (title.trim()) {
      onCreateStory(title);
    }
  };

  return (
    <div className="create-story">
      <h2>✨ Crear Nueva Historia</h2>
      <form onSubmit={handleSubmit} className="create-story-form">
        <div className="form-group">
          <label htmlFor="title">Título de la Historia</label>
          <input
            id="title"
            type="text"
            placeholder="Ej: La aventura del bosque encantado"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="story-title-input"
            autoFocus
          />
        </div>
        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn btn-secondary">
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary">
            Crear Historia
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateStory;
