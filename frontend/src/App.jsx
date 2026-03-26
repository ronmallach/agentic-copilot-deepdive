
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import Header from './components/Header';
import Welcome from './components/Welcome';
import BookList from './components/BookList';
import SearchBooks from './components/SearchBooks';
import Favorites from './components/Favorites';
import BookStats from './components/BookStats';
import Login from './components/Login';
import Register from './components/Register';
import './styles/App.module.css';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <Header />
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/books" element={<BookList />} />
          <Route path="/search" element={<SearchBooks />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/stats" element={<BookStats />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </Provider>
  );
}

export default App
