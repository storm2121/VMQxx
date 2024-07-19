// src/components/Home.js
import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div>
      <h1>Welcome to VMQ (Virtual Music Quiz)</h1>
      <p>Your ultimate multiplayer online music quiz game!</p>
      <nav>
        <ul>
          <li><Link to="/login">Login</Link></li>
          <li><Link to="/register">Register</Link></li>
          <li><Link to="/lobby">Lobbies</Link></li>
        </ul>
      </nav>
    </div>
  );
};

export default Home;
