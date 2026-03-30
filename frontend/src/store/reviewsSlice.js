// generated-by-copilot: Redux slice for book reviews — fetch, submit, and delete reviews.
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { logout } from './userSlice';

export const fetchReviews = createAsyncThunk(
  'reviews/fetchReviews',
  async (bookId, { rejectWithValue }) => {
    const res = await fetch(`http://localhost:4000/api/reviews/${bookId}`);
    if (!res.ok) {
      return rejectWithValue(await res.json());
    }
    const data = await res.json();
    return { bookId, reviews: data };
  }
);

export const submitReview = createAsyncThunk(
  'reviews/submitReview',
  async ({ token, bookId, rating, comment }, { rejectWithValue, dispatch }) => {
    const res = await fetch('http://localhost:4000/api/reviews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ bookId, rating, comment }),
    });
    if (!res.ok) {
      if (res.status === 403) {
        dispatch(logout());
      }
      return rejectWithValue(await res.json());
    }
    return res.json();
  }
);

export const deleteReview = createAsyncThunk(
  'reviews/deleteReview',
  async ({ token, reviewId, bookId }, { rejectWithValue, dispatch }) => {
    const res = await fetch(`http://localhost:4000/api/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      if (res.status === 403) {
        dispatch(logout());
      }
      return rejectWithValue(await res.json());
    }
    return { reviewId, bookId };
  }
);

const reviewsSlice = createSlice({
  name: 'reviews',
  initialState: {
    // generated-by-copilot: keyed by bookId so each book's reviews are stored independently
    byBook: {},
    status: {},
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReviews.pending, (state, action) => {
        state.status[action.meta.arg] = 'loading';
      })
      .addCase(fetchReviews.fulfilled, (state, action) => {
        const { bookId, reviews } = action.payload;
        state.byBook[bookId] = reviews;
        state.status[bookId] = 'succeeded';
      })
      .addCase(fetchReviews.rejected, (state, action) => {
        state.status[action.meta.arg] = 'failed';
      })
      .addCase(submitReview.fulfilled, (state, action) => {
        const review = action.payload;
        if (!state.byBook[review.bookId]) {
          state.byBook[review.bookId] = [];
        }
        state.byBook[review.bookId].push(review);
      })
      .addCase(deleteReview.fulfilled, (state, action) => {
        const { reviewId, bookId } = action.payload;
        if (state.byBook[bookId]) {
          state.byBook[bookId] = state.byBook[bookId].filter(
            (r) => r.id !== reviewId
          );
        }
      });
  },
});

export default reviewsSlice.reducer;
