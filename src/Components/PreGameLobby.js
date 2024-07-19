import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, getDocs, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { firestore } from '../firebase';
import { useSelector } from 'react-redux';

const PreGameLobby = () => {
  const [numRounds, setNumRounds] = useState(5);
  const [timePerSong, setTimePerSong] = useState(30);
  const [members, setMembers] = useState([]);
  const [songs, setSongs] = useState([]);
  const navigate = useNavigate();
  const { lobbyId } = useParams();
  const currentLobby = useSelector(state => state.lobby.currentLobby);

  useEffect(() => {
    if (lobbyId) {
      const unsubscribe = onSnapshot(doc(firestore, 'lobbies', lobbyId), snapshot => {
        const data = snapshot.data();
        if (data) {
          setMembers(data.members || []);
        }
      });

      return () => unsubscribe();
    }
  }, [lobbyId]);

  useEffect(() => {
    const fetchSongs = async () => {
      const songsCollection = collection(firestore, 'songs');
      const songsSnapshot = await getDocs(songsCollection);
      const songsList = songsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSongs(songsList);
      if (songsList.length < numRounds) {
        setNumRounds(songsList.length);
      }
    };

    fetchSongs();
  }, [numRounds]);

  const handleStartGame = async () => {
    try {
      if (currentLobby && songs.length > 0) {
        await setDoc(doc(firestore, 'games', currentLobby.id), {
          numRounds: Math.min(numRounds, songs.length),
          timePerSong,
          currentRound: 1,
          timeLeft: timePerSong,
          scores: [],
          gameOver: false,
          gameStarted: true,
          songs, // Set the songs in the game document
          currentSongIndex: 0, // Start with the first song
        }, { merge: true });

        navigate(`/game/${currentLobby.id}`);
      } else {
        console.error('No songs found or lobby not found');
      }
    } catch (error) {
      console.error('Error starting game:', error);
    }
  };

  return (
    <div>
      <h2>Pre-Game Lobby</h2>
      <div>
        <label>Number of Rounds:</label>
        <input
          type="number"
          value={numRounds}
          onChange={(e) => setNumRounds(e.target.value)}
          max={songs.length}
        />
      </div>
      <div>
        <label>Time per Song (seconds):</label>
        <input
          type="number"
          value={timePerSong}
          onChange={(e) => setTimePerSong(e.target.value)}
        />
      </div>
      <button onClick={handleStartGame}>Start Game</button>

      <h2>Members</h2>
      <ul>
        {members.map(member => (
          <li key={member.uid}>{member.username}</li>
        ))}
      </ul>
    </div>
  );
};

export default PreGameLobby;
