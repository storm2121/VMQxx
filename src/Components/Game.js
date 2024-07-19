import React, { useEffect, useState } from 'react';
import { doc, onSnapshot, updateDoc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { firestore } from '../firebase';
import { useDispatch, useSelector } from 'react-redux';
import { setGameData, setScores } from '../redux/gameSlice';
import { useParams, useNavigate } from 'react-router-dom';
import ReactAudioPlayer from 'react-audio-player';
import Autosuggest from 'react-autosuggest';

const Game = () => {
  const { lobbyId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const gameData = useSelector(state => state.game.gameData) || {};
  const scores = useSelector(state => state.game.scores) || [];
  const user = useSelector(state => state.auth.user);
  const [currentRound, setCurrentRound] = useState(gameData.currentRound || 1);
  const [timeLeft, setTimeLeft] = useState(gameData.timeLeft || gameData.timePerSong || 30);
  const [guess, setGuess] = useState('');
  const [members, setMembers] = useState([]);
  const [songLink, setSongLink] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [allSongs, setAllSongs] = useState([]);

  useEffect(() => {
    if (lobbyId) {
      const unsubscribe = onSnapshot(doc(firestore, 'games', lobbyId), snapshot => {
        const data = snapshot.data();
        if (data) {
          dispatch(setGameData(data));
          setCurrentRound(data.currentRound || 1);
          setTimeLeft(data.timeLeft || data.timePerSong || 30);
          setSongLink(data.songs && data.songs[data.currentSongIndex] ? data.songs[data.currentSongIndex].link : '');
          dispatch(setScores(data.scores || []));
        }
      });

      return () => unsubscribe();
    }
  }, [lobbyId, dispatch]);

  useEffect(() => {
    if (lobbyId) {
      const unsubscribe = onSnapshot(doc(firestore, 'lobbies', lobbyId), snapshot => {
        const data = snapshot.data();
        if (data) {
          console.log("Fetched members from lobby:", data.members);
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
      const songsList = songsSnapshot.docs.map(doc => doc.data().gameName);
      setAllSongs(songsList);
    };

    fetchSongs();
  }, []);

  useEffect(() => {
    let timer;
    if (timeLeft > 0) {
      timer = setTimeout(() => {
        setTimeLeft(prevTimeLeft => {
          const newTimeLeft = prevTimeLeft - 1;
          updateDoc(doc(firestore, 'games', lobbyId), { timeLeft: newTimeLeft });
          return newTimeLeft;
        });
      }, 1000);
    } else {
      handleRoundEnd();
    }
    return () => clearTimeout(timer);
  }, [timeLeft]);

  const handleGuessChange = (event, { newValue }) => {
    setGuess(newValue);
  };

  const handleSuggestionsFetchRequested = ({ value }) => {
    const inputValue = value.trim().toLowerCase();
    const inputLength = inputValue.length;
    const filteredSuggestions = inputLength === 0 ? [] : allSongs.filter(song =>
      song.toLowerCase().includes(inputValue)
    );
    setSuggestions(filteredSuggestions);
  };

  const handleSuggestionsClearRequested = () => {
    setSuggestions([]);
  };

  const handleRoundEnd = async () => {
    try {
      console.log("Fetching the correct answer...");

      const songDoc = await getDoc(doc(firestore, 'songs', gameData.songs[gameData.currentSongIndex].id));
      const correctAnswer = songDoc.data().gameName;

      console.log("Correct answer fetched:", correctAnswer);
      console.log("User's guess:", guess);

      let updatedScores = [...scores];
      let userScoreUpdated = false;

      // Check if the user's guess is correct and update the user's score
      if (guess.toLowerCase() === correctAnswer.toLowerCase()) {
        updatedScores = updatedScores.map(score => {
          if (score.playerId === user.uid) {
            userScoreUpdated = true;
            return { ...score, points: (score.points || 0) + 1 };
          }
          return score;
        });

        // If the user does not have a score entry, add one
        if (!userScoreUpdated) {
          updatedScores.push({ playerId: user.uid, username: user.displayName, points: 1 });
        }
      }

      console.log("Updated scores:", updatedScores);

      await setDoc(doc(firestore, 'games', lobbyId), { scores: updatedScores }, { merge: true });
      dispatch(setScores(updatedScores));

      // Update members with new scores
      const updatedMembers = members.map(member => {
        const score = updatedScores.find(s => s.playerId === member.uid);
        if (score) {
          return { ...member, points: score.points };
        }
        return member;
      });

      console.log("Updated members with new scores:", updatedMembers);

      await updateDoc(doc(firestore, 'lobbies', lobbyId), { members: updatedMembers });
      setMembers(updatedMembers);

      if (currentRound < gameData.numRounds && gameData.currentSongIndex + 1 < gameData.songs.length) {
        const newRound = currentRound + 1;
        const newSongIndex = gameData.currentSongIndex + 1;

        // 5-second break
        await new Promise(resolve => setTimeout(resolve, 5000));

        await updateDoc(doc(firestore, 'games', lobbyId), {
          currentRound: newRound,
          timeLeft: gameData.timePerSong,
          currentSongIndex: newSongIndex,
        });
        setCurrentRound(newRound);
        setTimeLeft(gameData.timePerSong);
      } else {
        // Handle game end logic
        await updateDoc(doc(firestore, 'games', lobbyId), { gameOver: true });
        await updateDoc(doc(firestore, 'lobbies', lobbyId), { gameStarted: false });
        navigate(`/pregame/${lobbyId}`);
      }
    } catch (error) {
      console.error("Error ending round or updating scores:", error);
    }
  };

  const addCurrentUserToMembers = async () => {
    const userRef = doc(firestore, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();

    const lobbyRef = doc(firestore, 'lobbies', lobbyId);
    const lobbySnap = await getDoc(lobbyRef);
    const lobbyData = lobbySnap.data();
    const existingMember = lobbyData.members.find(member => member.uid === user.uid);

    if (!existingMember) {
      const newMember = {
        uid: user.uid,
        username: userData.username,
        points: 0,
      };

      await updateDoc(lobbyRef, {
        members: [...lobbyData.members, newMember]
      });

      await updateDoc(doc(firestore, 'games', lobbyId), {
        members: [...lobbyData.members, newMember],
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

  return (
    <div>
      <h2>Game in Lobby: {lobbyId}</h2>
      <p>Round: {currentRound}/{gameData.numRounds}</p>
      <p>Time Left: {timeLeft}</p>
      <ReactAudioPlayer
        src={songLink}
        autoPlay
        controls
      />
      <Autosuggest
        suggestions={suggestions}
        onSuggestionsFetchRequested={handleSuggestionsFetchRequested}
        onSuggestionsClearRequested={handleSuggestionsClearRequested}
        getSuggestionValue={suggestion => suggestion}
        renderSuggestion={suggestion => <div>{suggestion}</div>}
        inputProps={{
          placeholder: "Type your guess",
          value: guess,
          onChange: handleGuessChange,
        }}
      />

      <h2>Members</h2>
      <ul>
        {members.map(member => (
          <li key={member.uid}>{member.username}: {member.points || 0}</li>
        ))}
      </ul>
    </div>
  );
};

export default Game;
