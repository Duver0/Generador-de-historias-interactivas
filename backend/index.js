import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// In-memory storage for stories (in production, use a database)
const stories = new Map();
const rooms = new Map();

// Story data structure
class Story {
  constructor(id, title, createdBy) {
    this.id = id;
    this.title = title;
    this.createdBy = createdBy;
    this.contributions = [];
    this.participants = [];
    this.currentTurn = null;
    this.isActive = true;
    this.createdAt = new Date();
  }

  addContribution(userId, userName, text) {
    const contribution = {
      id: this.contributions.length,
      userId,
      userName,
      text,
      timestamp: new Date()
    };
    this.contributions.push(contribution);
    return contribution;
  }

  addParticipant(userId, userName) {
    if (!this.participants.find(p => p.userId === userId)) {
      this.participants.push({ userId, userName });
    }
  }

  getVisibleText(userId) {
    // Exquisite corpse style: only show last contribution
    if (this.contributions.length === 0) return '';
    const lastContribution = this.contributions[this.contributions.length - 1];
    return lastContribution.text;
  }

  getFullStory() {
    return this.contributions.map(c => c.text).join(' ');
  }
}

// REST API endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', stories: stories.size });
});

app.get('/api/stories', (req, res) => {
  const storyList = Array.from(stories.values()).map(story => ({
    id: story.id,
    title: story.title,
    createdBy: story.createdBy,
    participants: story.participants.length,
    contributions: story.contributions.length,
    isActive: story.isActive,
    createdAt: story.createdAt
  }));
  res.json(storyList);
});

app.post('/api/stories', (req, res) => {
  const { title, userName } = req.body;
  if (!title || !userName) {
    return res.status(400).json({ error: 'Title and userName are required' });
  }

  const storyId = Date.now().toString();
  const story = new Story(storyId, title, userName);
  stories.set(storyId, story);

  res.json({
    id: story.id,
    title: story.title,
    createdBy: story.createdBy
  });
});

app.get('/api/stories/:id', (req, res) => {
  const story = stories.get(req.params.id);
  if (!story) {
    return res.status(404).json({ error: 'Story not found' });
  }

  res.json({
    id: story.id,
    title: story.title,
    createdBy: story.createdBy,
    participants: story.participants,
    contributions: story.contributions.length,
    isActive: story.isActive,
    createdAt: story.createdAt
  });
});

// WebSocket handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-story', ({ storyId, userName }) => {
    const story = stories.get(storyId);
    if (!story) {
      socket.emit('error', { message: 'Story not found' });
      return;
    }

    socket.join(storyId);
    story.addParticipant(socket.id, userName);

    // Track room participants
    if (!rooms.has(storyId)) {
      rooms.set(storyId, new Set());
    }
    rooms.get(storyId).add(socket.id);

    // Send current story state to the new participant
    socket.emit('story-state', {
      id: story.id,
      title: story.title,
      visibleText: story.getVisibleText(socket.id),
      participants: story.participants,
      contributionCount: story.contributions.length
    });

    // Notify others
    socket.to(storyId).emit('participant-joined', {
      userName,
      participants: story.participants
    });

    console.log(`${userName} joined story: ${story.title}`);
  });

  socket.on('add-contribution', ({ storyId, userName, text }) => {
    const story = stories.get(storyId);
    if (!story) {
      socket.emit('error', { message: 'Story not found' });
      return;
    }

    if (!text || text.trim().length === 0) {
      socket.emit('error', { message: 'Contribution cannot be empty' });
      return;
    }

    const contribution = story.addContribution(socket.id, userName, text.trim());

    // Broadcast the new contribution to all participants in the room
    io.to(storyId).emit('new-contribution', {
      contribution: {
        userName: contribution.userName,
        text: contribution.text,
        timestamp: contribution.timestamp
      },
      visibleText: story.getVisibleText(socket.id),
      contributionCount: story.contributions.length
    });

    console.log(`${userName} added contribution to ${story.title}`);
  });

  socket.on('get-full-story', ({ storyId }) => {
    const story = stories.get(storyId);
    if (!story) {
      socket.emit('error', { message: 'Story not found' });
      return;
    }

    socket.emit('full-story', {
      id: story.id,
      title: story.title,
      fullText: story.getFullStory(),
      contributions: story.contributions.map(c => ({
        userName: c.userName,
        text: c.text,
        timestamp: c.timestamp
      }))
    });
  });

  socket.on('end-story', ({ storyId }) => {
    const story = stories.get(storyId);
    if (!story) {
      socket.emit('error', { message: 'Story not found' });
      return;
    }

    story.isActive = false;

    // Notify all participants that the story has ended
    io.to(storyId).emit('story-ended', {
      id: story.id,
      title: story.title,
      fullText: story.getFullStory()
    });

    console.log(`Story ended: ${story.title}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    // Remove user from all rooms
    rooms.forEach((participants, storyId) => {
      if (participants.has(socket.id)) {
        participants.delete(socket.id);

        const story = stories.get(storyId);
        if (story) {
          const participant = story.participants.find(p => p.userId === socket.id);
          if (participant) {
            socket.to(storyId).emit('participant-left', {
              userName: participant.userName,
              participants: story.participants.filter(p => p.userId !== socket.id)
            });
          }
        }
      }
    });
  });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready for connections`);
});
