import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { searchBooks, clearSearch } from '../store/booksSlice';
import {
  addFavorite,
  removeFavorite,
  fetchFavorites,
} from '../store/favoritesSlice';
import { useNavigate } from 'react-router-dom';

import ReadingListDropdown from './ReadingListDropdown';
import BookReviews from './BookReviews';

import styles from '../styles/SearchBooks.module.css';

// generated-by-copilot: SearchBooks component for searching books by title and author
const SearchBooks = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [validationError, setValidationError] = useState('');

  const token = useAppSelector((state) => state.user.token);
  const searchState = useAppSelector((state) => state.books.search);
  const favorites = useAppSelector((state) => state.favorites.items);

  React.useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    dispatch(fetchFavorites(token));
  }, [dispatch, token, navigate]);

  const handleSearch = async () => {
    if (!query.trim()) {
      setValidationError('Please enter a search term');
      return;
    }
    setValidationError('');
    setCurrentPage(1);
    await dispatch(searchBooks({ query: query.trim(), page: 1, limit: 10 }));
  };

  const handleClear = () => {
    setQuery('');
    setValidationError('');
    setCurrentPage(1);
    dispatch(clearSearch());
  };

  const handleToggleFavorite = async (bookId, isFavorite) => {
    if (!token) {
      navigate('/');
      return;
    }
    if (isFavorite) {
      await dispatch(removeFavorite({ token, bookId }));
    } else {
      await dispatch(addFavorite({ token, bookId }));
    }
    dispatch(fetchFavorites(token));
  };

  const handleAddToReadingList = (bookId, listName) => {
    if (!token) {
      navigate('/');
      return;
    }
    // generated-by-copilot: placeholder until reading-list API route is added
    console.log(`Add book ${bookId} to "${listName}"`);
  };

  const handlePageChange = async (newPage) => {
    setCurrentPage(newPage);
    await dispatch(
      searchBooks({ query: searchState.query, page: newPage, limit: 10 })
    );
  };

  return (
    <div className={styles.searchPage}>
      <h2 data-testid="search-page-title">Search Books</h2>

      <div className={styles.searchForm}>
        <div className={styles.searchInputGroup}>
          <input
            data-testid="search-input"
            className={styles.searchInput}
            type="text"
            placeholder="Search by title or author..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <div className={styles.buttonGroup}>
            <button
              data-testid="search-button"
              className={styles.searchButton}
              onClick={handleSearch}
            >
              Search
            </button>
            <button
              data-testid="clear-search-button"
              className={styles.clearButton}
              onClick={handleClear}
            >
              Clear
            </button>
          </div>
        </div>

        {validationError && (
          <div data-testid="search-input-error" className={styles.errorMessage}>
            {validationError}
          </div>
        )}
      </div>

      {searchState.status === 'loading' && (
        <div data-testid="search-loading" className={styles.loading}>
          Searching...
        </div>
      )}

      {searchState.status === 'failed' && (
        <div data-testid="search-error" className={styles.errorMessage}>
          Failed to search books. Please try again.
        </div>
      )}

      {searchState.status === 'succeeded' &&
        searchState.results.length === 0 && (
          <div data-testid="search-no-results" className={styles.noResults}>
            No books found for "{searchState.query}". Try a different search
            term.
          </div>
        )}

      {searchState.status === 'succeeded' && searchState.results.length > 0 && (
        <div data-testid="search-results">
          {searchState.pagination && (
            <div
              data-testid="pagination-info"
              className={styles.paginationInfo}
            >
              Page {searchState.pagination.page} of{' '}
              {searchState.pagination.pages}({searchState.pagination.total}{' '}
              results for "{searchState.query}")
            </div>
          )}

          <div className={styles.resultGrid}>
            {searchState.results.map((book) => {
              const isFavorite = favorites.some((fav) => fav.id === book.id);
              return (
                <div
                  data-testid="search-result-item"
                  className={styles.bookCard + ' ' + styles.bookCardWithHeart}
                  key={book.id}
                >
                  {isFavorite && (
                    <span className={styles.favoriteHeart} title="In Favorites">
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="#e25555"
                        stroke="#e25555"
                        strokeWidth="1.5"
                      >
                        <path d="M12 21s-6.2-5.2-8.4-7.4C1.2 11.2 1.2 8.1 3.1 6.2c1.9-1.9 5-1.9 6.9 0l2 2 2-2c1.9-1.9 5-1.9 6.9 0 1.9 1.9 1.9 5 0 6.9C18.2 15.8 12 21 12 21z" />
                      </svg>
                    </span>
                  )}
                  <div className={styles.bookTitle}>{book.title}</div>
                  <div className={styles.bookAuthor}>by {book.author}</div>
                  <button
                    data-testid={
                      isFavorite
                        ? 'remove-favorite-button'
                        : 'add-favorite-button'
                    }
                    className={styles.favoriteButton}
                    onClick={() => handleToggleFavorite(book.id, isFavorite)}
                  >
                    {isFavorite ? 'Remove Favorite' : 'Add to Favorites'}
                  </button>
                  <ReadingListDropdown
                    bookId={book.id}
                    onAdd={handleAddToReadingList}
                  />
                  <BookReviews bookId={book.id} />
                </div>
              );
            })}
          </div>

          {searchState.pagination && searchState.pagination.pages > 1 && (
            <div className={styles.pagination}>
              {searchState.pagination.page > 1 && (
                <button
                  className={styles.pageButton}
                  onClick={() =>
                    handlePageChange(searchState.pagination.page - 1)
                  }
                >
                  Previous
                </button>
              )}
              {searchState.pagination.page < searchState.pagination.pages && (
                <button
                  className={styles.pageButton}
                  onClick={() =>
                    handlePageChange(searchState.pagination.page + 1)
                  }
                >
                  Next
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBooks;
