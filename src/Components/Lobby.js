import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, arrayUnion, doc, getDoc } from 'firebase/firestore';
import { auth, firestore } from '../firebase';
import { useDispatch, useSelector } from 'react-redux';
import { setLobbies, setCurrentLobby } from '../redux/lobbySlice';
import { useNavigate } from 'react-router-dom';

const Lobby = () => {
  const [lobbyName, setLobbyName] = useState('');
  const dispatch = useDispatch();
  const lobbies = useSelector(state => state.lobby.lobbies);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(firestore, 'lobbies'), snapshot => {
      const lobbiesData = [];
      snapshot.forEach(doc => lobbiesData.push({ ...doc.data(), id: doc.id }));
      dispatch(setLobbies(lobbiesData));
    });

    return () => unsubscribe();
  }, [dispatch]);

  const handleCreateLobby = async () => {
    try {
      if (auth.currentUser) {
        const userDocRef = doc(firestore, 'users', auth.currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.data();
        const lobbyRef = await addDoc(collection(firestore, 'lobbies'), {
          name: lobbyName,
          createdBy: auth.currentUser.uid,
          gameStarted: false,
          members: arrayUnion({
            uid: auth.currentUser.uid,
            username: userData.username,
          }),
        });
        dispatch(setCurrentLobby({ id: lobbyRef.id, name: lobbyName }));
        navigate(`/pregame/${lobbyRef.id}`);
      } else {
        console.error('User is not authenticated');
      }
    } catch (error) {
      console.error('Error creating lobby:', error);
    }
  };

  const handleJoinLobby = async (lobby) => {
    try {
      if (auth.currentUser) {
        const userDocRef = doc(firestore, 'users', auth.currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.data();
        await updateDoc(doc(firestore, 'lobbies', lobby.id), {
          members: arrayUnion({
            uid: auth.currentUser.uid,
            username: userData.username,
          }),
        });
        dispatch(setCurrentLobby(lobby));
        navigate(`/pregame/${lobby.id}`);
      } else {
        console.error('User is not authenticated');
      }
    } catch (error) {
      console.error('Error joining lobby:', error);
    }
  };

  return (
    <div>
      <h2>Create a Lobby</h2>
      <input
        type="text"
        value={lobbyName}
        onChange={(e) => setLobbyName(e.target.value)}
        placeholder="Lobby Name"
      />
      <button onClick={handleCreateLobby}>Create</button>

      <h2>Join a Lobby</h2>
      <ul>
        {lobbies.map(lobby => (
          <li key={lobby.id}>
            {lobby.name}
            <button onClick={() => handleJoinLobby(lobby)}>Join</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Lobby;
