import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice';
import booksReducer from './booksSlice';
import favoritesReducer from './favoritesSlice';
import statsReducer from './statsSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    books: booksReducer,
    favorites: favoritesReducer,
    stats: statsReducer,
  },
});
