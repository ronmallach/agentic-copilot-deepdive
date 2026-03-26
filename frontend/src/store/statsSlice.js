// generated-by-copilot: Redux slice for book stats - fetches aggregate counts from /api/books/stats
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchStats = createAsyncThunk('stats/fetchStats', async () => {
  const res = await fetch('http://localhost:4000/api/books/stats');
  return res.json();
});

const statsSlice = createSlice({
  name: 'stats',
  initialState: { data: null, status: 'idle' },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchStats.pending, state => { state.status = 'loading'; })
      .addCase(fetchStats.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload;
      })
      .addCase(fetchStats.rejected, state => { state.status = 'failed'; });
  },
});

export default statsSlice.reducer;
