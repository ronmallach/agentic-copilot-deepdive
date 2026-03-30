import React, { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchFavorites, clearAllFavorites } from '../store/favoritesSlice';
import { useNavigate } from 'react-router-dom';

const Favorites = () => {
  const dispatch = useAppDispatch();
  const favorites = useAppSelector(state => state.favorites.items);
  const status = useAppSelector(state => state.favorites.status);
  const token = useAppSelector(state => state.user.token);
  const navigate = useNavigate();
  // generated-by-copilot: local state for the "All favorites cleared" toast
  const [showToast, setShowToast] = useState(false);
  const [toastError, setToastError] = useState(false);
  const toastTimerRef = useRef(null);

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    dispatch(fetchFavorites(token));
  }, [dispatch, token, navigate]);

  // generated-by-copilot: clean up the toast timer on unmount
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // generated-by-copilot: handles clearing all favorites with a confirmation dialog
  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to remove all books from your favorites?')) {
      const result = await dispatch(clearAllFavorites(token));
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (result.meta.requestStatus === 'fulfilled') {
        setToastError(false);
        setShowToast(true);
      } else {
        setToastError(true);
        setShowToast(true);
      }
      toastTimerRef.current = setTimeout(() => setShowToast(false), 3000);
    }
  };

  if (status === 'loading') return <div>Loading...</div>;
  if (status === 'failed') return <div>Failed to load favorites.</div>;

  return (
    <div>
      {/* generated-by-copilot: toast notification shown briefly after all favorites are cleared */}
      {showToast && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          background: toastError ? '#e25555' : '#20b2aa',
          color: '#fff',
          padding: '0.75rem 1.5rem',
          borderRadius: '6px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
          fontSize: '1rem',
          zIndex: 9999,
          pointerEvents: 'none',
        }}>
          {toastError ? 'Failed to clear favorites' : 'All favorites cleared'}
        </div>
      )}
      <h2>My Favorite Books</h2>
      {favorites.length === 0 ? (
        <div style={{
          background: '#fff',
          padding: '2rem',
          borderRadius: '8px',
          maxWidth: '400px',
          margin: '2rem auto',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          textAlign: 'center',
          color: '#888',
        }}>
          <p>No favorite books yet.</p>
          <p>
            Go to the <a href="/books" onClick={e => { e.preventDefault(); navigate('/books'); }}>book list</a> to add some!
          </p>
        </div>
      ) : (
        <>
          <button
            onClick={handleClearAll}
            style={{
              background: '#e25555',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              padding: '0.4rem 1.2rem',
              fontSize: '1rem',
              cursor: 'pointer',
              marginBottom: '1rem',
            }}
          >
            Clear All Favorites
          </button>
          <ul>
            {favorites.map(book => (
              <li key={book.id}>
                <strong>{book.title}</strong> by {book.author}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default Favorites;
