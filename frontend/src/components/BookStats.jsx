import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchStats } from '../store/statsSlice';
import styles from '../styles/BookStats.module.css';

// generated-by-copilot: displays aggregate book statistics from GET /api/books/stats
function BookStats() {
  const dispatch = useAppDispatch();
  const stats = useAppSelector(state => state.stats.data);
  const status = useAppSelector(state => state.stats.status);

  useEffect(() => {
    dispatch(fetchStats());
  }, [dispatch]);

  return (
    <div className={styles['stats-page']}>
      <h2 className={styles['stats-heading']}>Book Stats</h2>
      {status === 'loading' && (
        <p className={styles['loading-message']}>Loading stats...</p>
      )}
      {status === 'failed' && (
        <p className={styles['error-message']}>Failed to load stats.</p>
      )}
      {status === 'succeeded' && stats && (
        <div className={styles['stats-grid']}>
          <div className={styles['stat-card']} data-cy="stat-total-books">
            <span className={styles['stat-value']}>{stats.totalBooks}</span>
            <span className={styles['stat-label']}>Total Books</span>
          </div>
          <div className={styles['stat-card']} data-cy="stat-favorited-books">
            <span className={styles['stat-value']}>{stats.favoritedBooks}</span>
            <span className={styles['stat-label']}>Favorited Books</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default BookStats;
