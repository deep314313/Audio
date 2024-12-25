import React from 'react';
import './App.css';
import VoiceChat from './components/VoiceChat';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Group Voice Chat</h1>
      </header>
      <main>
        <VoiceChat />
      </main>
    </div>
  );
}

export default App;
