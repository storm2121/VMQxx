// src/redux/gameSlice.js
import { createSlice } from '@reduxjs/toolkit';

const gameSlice = createSlice({
  name: 'game',
  initialState: {
    gameData: null,
    scores: [],
  },
  reducers: {
    setGameData: (state, action) => {
      state.gameData = action.payload;
    },
    setScores: (state, action) => {
      state.scores = action.payload;
    },
  },
});

export const { setGameData, setScores } = gameSlice.actions;
export default gameSlice.reducer;
