import React, { useEffect, useState } from 'react';

import styles from '../styles/StaffPicks.module.css';

const StaffPicks = () => {
  const [picks, setPicks] = useState([]);
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    setStatus('loading');
    fetch('http://localhost:4000/api/staff-picks')
      .then((res) => res.json())
      .then((data) => {
        setPicks(data);
        setStatus('success');
      })
      .catch(() => setStatus('failed'));
  }, []);

  if (status === 'loading') return <div>Loading...</div>;
  if (status === 'failed') return <div>Failed to load staff picks.</div>;

  return (
    <div className={styles['staff-picks-container']}>
      <h2 className={styles['staff-picks-heading']}>Staff Picks</h2>
      <p className={styles['staff-picks-subheading']}>
        Curated classic novels recommended by our team.
      </p>
      <div className={styles['staff-picks-grid']}>
        {picks.map((book) => (
          <div className={styles['staff-pick-card']} key={book.isbn}>
            <div className={styles['book-title']}>{book.title}</div>
            <div className={styles['book-author']}>by {book.author}</div>
            <p className={styles['book-summary']}>{book.summary}</p>
            <div className={styles['book-meta']}>
              Published: {new Date(book.publicationDate).getFullYear()}
              &nbsp;&middot;&nbsp;ISBN: {book.isbn}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StaffPicks;
