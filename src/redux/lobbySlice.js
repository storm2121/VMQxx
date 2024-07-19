// src/redux/lobbySlice.js
import { createSlice } from '@reduxjs/toolkit';

const lobbySlice = createSlice({
  name: 'lobby',
  initialState: {
    lobbies: [],
    currentLobby: null,
  },
  reducers: {
    setLobbies: (state, action) => {
      state.lobbies = action.payload;
    },
    setCurrentLobby: (state, action) => {
      state.currentLobby = action.payload;
    },
  },
});

export const { setLobbies, setCurrentLobby } = lobbySlice.actions;
export default lobbySlice.reducer;
