const express = require('express');
const cors = require('cors');
const db = require('./firebase'); // Import the db instance from firebase.js

const app = express();
const port = 4000;

app.use(cors());
app.use(express.json());

app.get('/testConnection', async (req, res) => {
  try {
    const testRef = db.collection('test').doc('connection');
    await testRef.set({ connected: true });
    const testDoc = await testRef.get();
    if (testDoc.exists) {
      console.log('Connection to Firestore successful');
      res.status(200).json({ message: 'Connection to Firestore successful' });
    } else {
      console.log('Failed to verify connection to Firestore');
      res.status(500).json({ message: 'Failed to verify connection to Firestore' });
    }
  } catch (error) {
    console.error('Error testing connection:', error);
    res.status(500).json({ message: 'Error testing connection' });
  }
});

app.post('/updateScore', async (req, res) => {
    const { lobbyId, userId, increment } = req.body;
    console.log(`Received request to update score: lobbyId=${lobbyId}, userId=${userId}, increment=${increment}`);
    console.log(`Type of increment: ${typeof increment}`);
  
    try {
      const gameRef = db.collection('games').doc(lobbyId);
      console.log(`Checking game reference: games/${lobbyId}`);
      const gameDoc = await gameRef.get();
  
      if (!gameDoc.exists) {
        console.log('Game not found:', lobbyId);
        res.status(404).json({ message: `Game not found: ${lobbyId}` });
        return;
      }
  
      const gameData = gameDoc.data();
      console.log('Current game data:', gameData);
  
      await db.runTransaction(async (transaction) => {
        const gameDoc = await transaction.get(gameRef);
        if (!gameDoc.exists) {
          throw "Document does not exist!";
        }
  
        const gameData = gameDoc.data();
        let updatedScores = gameData.scores || [];
  
        let userScoreUpdated = false;
  
        updatedScores = updatedScores.map(score => {
          if (score.playerId === userId) {
            console.log(`Updating score for user ${userId}`);
            userScoreUpdated = true;
            return { ...score, points: (score.points || 0) + increment };
          }
          return score;
        });
  
        if (!userScoreUpdated) {
          console.log(`Adding new score entry for user ${userId}`);
          updatedScores.push({ playerId: userId, points: increment });
        }
  
        console.log('Updated scores:', updatedScores);
  
        transaction.update(gameRef, { scores: updatedScores });
      });
  
      console.log('Score updated successfully');
      res.status(200).json({ message: 'Score updated successfully' });
    } catch (error) {
      console.error('Error updating score:', error);
      res.status(500).json({ message: 'Error updating score' });
    }
  });

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  // Check connection to Firestore
  db.collection('test').doc('connection').get()
    .then(doc => {
      if (doc.exists) {
        console.log('Firestore connection verified');
      } else {
        console.log('Firestore connection failed');
      }
    })
    .catch(error => {
      console.error('Error verifying Firestore connection:', error);
    });
});
