import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { setUser, clearUser } from './redux/authSlice';
import Lobby from './Components/Lobby';
import Game from './Components/Game';
import PreGameLobby from './Components/PreGameLobby';
import Auth from './Components/Auth';

function App() {
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) {
        dispatch(setUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
        }));
      } else {
        dispatch(clearUser());
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  return (
    <Router>
      <Routes>
        {user ? (
          <>
            <Route path="/lobby" element={<Lobby />} />
            <Route path="/pregame/:lobbyId" element={<PreGameLobby />} />
            <Route path="/game/:lobbyId" element={<Game />} />
            <Route path="*" element={<Navigate to="/lobby" />} />
          </>
        ) : (
          <>
            <Route path="/" element={<Auth />} />
            <Route path="*" element={<Navigate to="/" />} />
          </>
        )}
      </Routes>
    </Router>
  );
}

export default App;
