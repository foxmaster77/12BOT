import React, { useState } from 'react';

export default function OrchestraInterface() {
  const [isDayMode, setIsDayMode] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedNiche, setSelectedNiche] = useState('App');
  const [projectName, setProjectName] = useState('New Project');
  const [prompt, setPrompt] = useState('');

  const handleGenerate = () => {
    setIsProcessing(true);
    // Simulate generation time (3 seconds) then reset
    setTimeout(() => {
      setIsProcessing(false);
    }, 3000);
  };

  return (
    <div className="orchestra-app">
      {/* HEADER */}
      <header className="app-header">
        <div className="logo-icon">
          <span>(†!†)</span>
        </div>
        <h1>Orchestra2D Generator Interface</h1>

        {/* Helper button to toggle day/night for testing */}
        <button
          className="theme-toggle"
          onClick={() => setIsDayMode(!isDayMode)}
        >
          Toggle {isDayMode ? 'Night' : 'Day'} Mode
        </button>
      </header>

      {/* MAIN VIEWPORT (Pixel Art Background goes here) */}
      <main className={`viewport ${isDayMode ? 'day-bg' : 'night-bg'}`}>
        {/* The background image is handled in CSS via /office-day.jpg & /office-night.jpg */}
      </main>

      {/* BOTTOM UI PANEL */}
      <footer className="control-panel">
        {/* Section 1: Project Info */}
        <div className="panel-section info-section">
          <h2>Current Project Info</h2>
          <div className="info-box">
            <p>
              <span className="label">Niche:</span> [{selectedNiche}]
            </p>
            <p>
              <span className="label">Project:</span> [{projectName}]
            </p>
          </div>
        </div>

        {/* Section 2: Prompt Input */}
        <div className="panel-section prompt-section">
          <h2>Prompt</h2>
          <textarea
            placeholder="Enter your prompt here..."
            className="prompt-input"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        {/* Section 3: Niche Selector */}
        <div className="panel-section niche-section">
          <h2>Niche</h2>
          <div className="niche-list">
            {['App', 'Website', 'Dashboard', 'Game'].map((niche) => (
              <div
                key={niche}
                className={`niche-item ${selectedNiche === niche ? 'active' : ''}`}
                onClick={() => setSelectedNiche(niche)}
              >
                {niche}
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Generate Action */}
        <div className="panel-section action-section">
          {isProcessing && <span className="processing-text">Processing</span>}
          <button
            className={`generate-btn ${isProcessing ? 'processing' : ''}`}
            onClick={handleGenerate}
            disabled={isProcessing}
          >
            Generate
          </button>
        </div>
      </footer>
    </div>
  );
}
