// generated-by-copilot: BookReviews component — shows a collapsible Reviews section
// within a book card. Displays average rating, a scrollable list of existing reviews,
// and a form for submitting a new 1-5 star review with optional text.
import React, { useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchReviews, submitReview, deleteReview } from '../store/reviewsSlice';

import styles from '../styles/BookReviews.module.css';

function renderStars(rating) {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

function BookReviews({ bookId }) {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.user.token);
  const username = useAppSelector((state) => state.user.username);
  const reviews = useAppSelector((state) => state.reviews.byBook[bookId] ?? []);
  const fetchStatus = useAppSelector((state) => state.reviews.status[bookId] ?? 'idle');

  const [expanded, setExpanded] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [comment, setComment] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (expanded && fetchStatus === 'idle') {
      dispatch(fetchReviews(bookId));
    }
  }, [expanded, fetchStatus, bookId, dispatch]);

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (selectedRating === 0) {
      setFormError('Please select a star rating.');
      return;
    }
    setFormError('');
    setSubmitting(true);
    await dispatch(submitReview({ token, bookId, rating: selectedRating, comment }));
    setSelectedRating(0);
    setComment('');
    setSubmitting(false);
  };

  const handleDelete = (reviewId) => {
    dispatch(deleteReview({ token, reviewId, bookId }));
  };

  return (
    <div className={styles['reviews-section']} data-testid="book-reviews-section">
      <div className={styles['reviews-header']}>
        <span
          className={styles['reviews-title']}
          onClick={() => setExpanded((prev) => !prev)}
          data-testid="reviews-toggle"
        >
          {expanded ? '▾' : '▸'} Reviews
        </span>
        {averageRating !== null && (
          <span className={styles['avg-rating']} data-testid="avg-rating">
            <span className={styles['star-display']}>★</span> {averageRating} ({reviews.length})
          </span>
        )}
      </div>

      {expanded && (
        <>
          {fetchStatus === 'loading' && (
            <div className={styles['no-reviews']}>Loading reviews…</div>
          )}

          {fetchStatus !== 'loading' && reviews.length === 0 && (
            <div className={styles['no-reviews']} data-testid="no-reviews-message">
              No reviews yet. Be the first!
            </div>
          )}

          {reviews.length > 0 && (
            <div className={styles['reviews-list']} data-testid="reviews-list">
              {reviews.map((review) => (
                <div key={review.id} className={styles['review-item']} data-testid="review-item">
                  <div className={styles['review-meta']}>
                    <span className={styles['star-display']}>{renderStars(review.rating)}</span>
                    <span className={styles['review-author']}>{review.username}</span>
                    <span className={styles['review-date']}>
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {review.comment && (
                    <div className={styles['review-comment']}>{review.comment}</div>
                  )}
                  {token && review.username === username && (
                    <button
                      className={styles['delete-btn']}
                      onClick={() => handleDelete(review.id)}
                      title="Delete review"
                      data-testid="delete-review-button"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {token && (
            <form className={styles['review-form']} onSubmit={handleSubmit} data-testid="review-form">
              <div className={styles['star-picker']} data-testid="star-picker">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={
                      styles['star-btn'] +
                      (selectedRating >= star ? ' ' + styles['selected'] : '')
                    }
                    onClick={() => setSelectedRating(star)}
                    aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                    data-testid={`star-button-${star}`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <textarea
                className={styles['comment-input']}
                placeholder="Write a review (optional)…"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                data-testid="review-comment-input"
              />
              {formError && (
                <div className={styles['form-error']} data-testid="review-form-error">
                  {formError}
                </div>
              )}
              <button
                type="submit"
                className={styles['submit-btn']}
                disabled={submitting}
                data-testid="submit-review-button"
              >
                {submitting ? 'Submitting…' : 'Submit Review'}
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}

export default BookReviews;
