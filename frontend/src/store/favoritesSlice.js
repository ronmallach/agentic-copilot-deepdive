import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchFavorites = createAsyncThunk('favorites/fetchFavorites', async (token, { rejectWithValue }) => {
  const res = await fetch('http://localhost:4000/api/favorites', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return rejectWithValue(await res.json());
  return res.json();
});

export const addFavorite = createAsyncThunk('favorites/addFavorite', async ({ token, bookId }, { rejectWithValue }) => {
  const res = await fetch('http://localhost:4000/api/favorites', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ bookId }),
  });
  if (!res.ok) return rejectWithValue(await res.json());
  return bookId;
});

// generated-by-copilot: removes a book from the user's favorites via DELETE /api/favorites/:bookId
export const removeFavorite = createAsyncThunk('favorites/removeFavorite', async ({ token, bookId }, { rejectWithValue }) => {
  const res = await fetch(`http://localhost:4000/api/favorites/${bookId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return rejectWithValue(await res.json());
  return bookId;
});

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState: { items: [], status: 'idle' },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchFavorites.pending, state => { state.status = 'loading'; })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchFavorites.rejected, state => { state.status = 'failed'; })
      .addCase(addFavorite.fulfilled, (state, action) => {
        // After adding, fetch the updated favorites list to ensure UI is in sync
      })
      .addCase(removeFavorite.fulfilled, (state, action) => {
        state.items = state.items.filter(book => book.id !== action.payload);
      });
  },
});

export default favoritesSlice.reducer;
