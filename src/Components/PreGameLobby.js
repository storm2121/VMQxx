import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, getDocs, doc, setDoc, onSnapshot, updateDoc, getDoc, arrayUnion } from 'firebase/firestore';
import { firestore } from '../firebase';
import { useSelector } from 'react-redux';

const PreGameLobby = () => {
  const [numRounds, setNumRounds] = useState(5);
  const [timePerSong, setTimePerSong] = useState(30);
  const [members, setMembers] = useState([]);
  const [songs, setSongs] = useState([]);
  const [lobbyData, setLobbyData] = useState(null);
  const navigate = useNavigate();
  const { lobbyId } = useParams();
  const currentLobby = useSelector(state => state.lobby.currentLobby);
  const user = useSelector(state => state.auth.user);

  useEffect(() => {
    if (lobbyId) {
      console.log("Entering pregame with lobby ID:", lobbyId);
      const unsubscribe = onSnapshot(doc(firestore, 'lobbies', lobbyId), snapshot => {
        const data = snapshot.data();
        if (data) {
          console.log('Fetched lobby data:', data);
          setLobbyData(data);
          setMembers(data.members || []);
          
          // Navigate all members to the game when gameStarted is true
          if (data.gameStarted) {
            navigate(`/game/${lobbyId}`);
          }
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

  const addCurrentUserToMembers = async () => {
    const userRef = doc(firestore, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();

    // Check if the user already exists in the members array
    const lobbyRef = doc(firestore, 'lobbies', lobbyId);
    const lobbySnap = await getDoc(lobbyRef);
    const lobbyData = lobbySnap.data();
    const existingMember = lobbyData.members.find(member => member.uid === user.uid);

    if (!existingMember) {
      const newMember = {
        uid: user.uid,
        username: userData.username,
        points: 0, // Initialize points to 0
      };

      await updateDoc(lobbyRef, {
        members: arrayUnion(newMember)
      });

      setMembers([...lobbyData.members, newMember]);
    } else {
      setMembers(lobbyData.members);
    }
  };

  useEffect(() => {
    if (user) {
      addCurrentUserToMembers();
    }
  }, [user]);

  const handleStartGame = async () => {
    try {
      console.log("Attempting to start game...");
      if (currentLobby && songs.length > 0) {
        console.log('Current Lobby:', currentLobby);
        console.log('User ID:', user?.uid);
        console.log('Lobby created by:', currentLobby.createdBy);

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

        await updateDoc(doc(firestore, 'lobbies', currentLobby.id), {
          gameStarted: true
        });

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
      {lobbyData && user && lobbyData.createdBy === user.uid ? (
        <button onClick={handleStartGame}>Start Game</button>
      ) : (
        <p>Only the lobby creator can start the game.</p>
      )}
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
