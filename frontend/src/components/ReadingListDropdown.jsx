import React, { useState } from 'react';

import styles from '../styles/BookList.module.css';

const READING_LISTS = ['Want to Read', 'Currently Reading', 'Finished'];

function ReadingListDropdown({ bookId, onAdd }) {
  const [selectedList, setSelectedList] = useState(READING_LISTS[0]);

  const handleSubmit = () => {
    onAdd(bookId, selectedList);
  };

  return (
    <div className={styles.readingListDropdown}>
      <select
        className={styles.readingListSelect}
        value={selectedList}
        onChange={e => setSelectedList(e.target.value)}
      >
        {READING_LISTS.map(list => (
          <option key={list} value={list}>{list}</option>
        ))}
      </select>
      <button className={styles.simpleBtn} onClick={handleSubmit}>
        Add to List
      </button>
    </div>
  );
}

export default ReadingListDropdown;
