import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchBooks = createAsyncThunk('books/fetchBooks', async () => {
  const res = await fetch('http://localhost:4000/api/books');
  return res.json();
});

// generated-by-copilot: Search books with query, page, and limit parameters
export const searchBooks = createAsyncThunk('books/searchBooks', async ({ query, page = 1, limit = 10 }) => {
  const params = new URLSearchParams({ q: query, page: page.toString(), limit: limit.toString() });
  const res = await fetch(`http://localhost:4000/api/books/search?${params}`);
  if (!res.ok) {
    throw new Error('Failed to search books');
  }
  return res.json();
});

const booksSlice = createSlice({
  name: 'books',
  initialState: { 
    items: [], 
    status: 'idle',
    // generated-by-copilot: Search state management
    search: {
      query: '',
      results: [],
      status: 'idle',
      pagination: null,
      error: null
    }
  },
  reducers: {
    // generated-by-copilot: Clear search results and reset search state
    clearSearch: (state) => {
      state.search.query = '';
      state.search.results = [];
      state.search.status = 'idle';
      state.search.pagination = null;
      state.search.error = null;
    }
  },
  extraReducers: builder => {
    builder
      .addCase(fetchBooks.pending, state => { state.status = 'loading'; })
      .addCase(fetchBooks.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchBooks.rejected, state => { state.status = 'failed'; })
      // generated-by-copilot: Search extraReducers
      .addCase(searchBooks.pending, state => { 
        state.search.status = 'loading'; 
        state.search.error = null;
      })
      .addCase(searchBooks.fulfilled, (state, action) => {
        state.search.status = 'succeeded';
        state.search.results = action.payload.data;
        state.search.pagination = action.payload.pagination;
        state.search.query = action.payload.query;
        state.search.error = null;
      })
      .addCase(searchBooks.rejected, (state, action) => { 
        state.search.status = 'failed'; 
        state.search.error = action.error.message || 'Failed to search books';
      });
  },
});

export const { clearSearch } = booksSlice.actions;
export default booksSlice.reducer;
