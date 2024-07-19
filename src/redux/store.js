// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import lobbyReducer from './lobbySlice';
import gameReducer from './gameSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    lobby: lobbyReducer,
    game: gameReducer,
  },
});

export default store;
