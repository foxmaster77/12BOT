import React, { useState } from 'react';

interface OrchestraInterfaceProps {
  initialPrompt?: string;
  isBuilding?: boolean;
  onGenerate?: (prompt: string, niche: string) => void;
}

const NICHES = ['App', 'Website', 'Dashboard', 'Game'];

export default function OrchestraInterface({
  initialPrompt = 'Build a high-end dark-themed portfolio site for a wildlife photographer named LUMEN.',
  isBuilding = false,
  onGenerate,
}: OrchestraInterfaceProps) {
  const [isDayMode, setIsDayMode] = useState(true);
  const [selectedNiche, setSelectedNiche] = useState('Website');
  const [prompt, setPrompt] = useState(initialPrompt);
  const [projectName, setProjectName] = useState('LUMEN Portfolio');
  const [internalProcessing, setInternalProcessing] = useState(false);

  const processing = isBuilding || internalProcessing;

  const handleGenerate = () => {
    if (onGenerate) {
      onGenerate(prompt, selectedNiche);
    } else {
      setInternalProcessing(true);
      setTimeout(() => {
        setInternalProcessing(false);
      }, 3000);
    }
  };

  return (
    <div className="orchestra-app">
      {/* HEADER */}
      <header className="app-header">
        <div className="logo-icon">
          <span>(†!†)</span>
        </div>
        <h1>Orchestra2D Generator Interface</h1>

        {/* Helper button to toggle day/night */}
        <button
          className="theme-toggle"
          onClick={() => setIsDayMode(!isDayMode)}
        >
          Toggle {isDayMode ? 'Night 🌙' : 'Day ☀️'} Mode
        </button>
      </header>

      {/* MAIN VIEWPORT (Pixel Art Background) */}
      <main className={`viewport ${isDayMode ? 'day-bg' : 'night-bg'}`}>
        {/* Day/Night background is set in CSS via /office-day.jpg & /office-night.jpg */}
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
            {NICHES.map((niche) => (
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
          {processing && <span className="processing-text">Processing</span>}
          <button
            className={`generate-btn ${processing ? 'processing' : ''}`}
            onClick={handleGenerate}
            disabled={processing}
          >
            {processing ? 'Processing' : 'Generate'}
          </button>
        </div>
      </footer>
    </div>
  );
}
