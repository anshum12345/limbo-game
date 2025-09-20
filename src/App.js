import React from 'react';
import LimboGame from './components/LimboGame';
import './index.css';

function App() {
  return (
    <div className="app-root">
      <header className="header">
        <h1>Limbo — Candidate Assessment</h1>
        <p className="sub">Frontend-only simulation with smooth counter animation</p>
      </header>
      <main>
        <LimboGame />
      </main>
      <footer className="footer">Built By Anshum Dwivedi</footer>
    </div>
  );
}

export default App;
