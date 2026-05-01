import React, { useState, useEffect } from 'react';
import { Terminal, Copy, CheckCircle2, Zap, AlertCircle, Table2, Code2, ArrowLeft } from 'lucide-react';
import './index.css';

// ==========================================
// VIEWER COMPONENT (The "Wow" Feature)
// ==========================================
function Viewer({ id }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('table'); // 'table' or 'raw'

  useEffect(() => {
    // Fetch the mocked data when component mounts
    fetch(`https://mock-it-zcl0.onrender.com/api/mock/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Endpoint not found or expired.');
        return res.json();
      })
      .then(json => setData(json))
      .catch(err => setError(err.message));
  }, [id]);

  if (error) {
    return (
      <div className="viewer-container" style={{ textAlign: 'center', color: '#ef4444' }}>
        <AlertCircle size={48} style={{ margin: '0 auto 1rem' }} />
        <h2>Error Loading Endpoint</h2>
        <p>{error}</p>
        <a href="#/" className="view-dashboard-btn" style={{ marginTop: '2rem' }}>
          <ArrowLeft size={16} /> Go Back
        </a>
      </div>
    );
  }

  if (!data) return <div style={{ color: 'var(--text-muted)' }}>Loading payload...</div>;

  // Render Table Logic
  const renderTable = () => {
    // If it's an array of objects
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
      const keys = Object.keys(data[0]);
      return (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                {keys.map(key => <th key={key}>{key}</th>)}
              </tr>
            </thead>
            <tbody>
              {data.map((item, idx) => (
                <tr key={idx}>
                  {keys.map(key => (
                    <td key={key}>{typeof item[key] === 'object' ? JSON.stringify(item[key]) : String(item[key])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    
    // If it's a single object
    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      return (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Key</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(data).map(([key, value]) => (
                <tr key={key}>
                  <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{key}</td>
                  <td>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // Fallback if it's just a primitive or empty array
    return <div className="raw-json-view">{JSON.stringify(data, null, 2)}</div>;
  };

  return (
    <div className="container">
      <header>
        <h1>Endpoint Dashboard</h1>
        <p>Viewing API payload for /api/mock/{id}</p>
      </header>

      <div className="viewer-container">
        <div className="viewer-header">
          <a href="#/" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowLeft size={18} /> Back
          </a>
          
          <div className="toggle-group">
            <button 
              className={`toggle-btn ${mode === 'table' ? 'active' : ''}`}
              onClick={() => setMode('table')}
            >
              <Table2 size={16} /> Pretty Table
            </button>
            <button 
              className={`toggle-btn ${mode === 'raw' ? 'active' : ''}`}
              onClick={() => setMode('raw')}
            >
              <Code2 size={16} /> Raw JSON
            </button>
          </div>
        </div>

        <div className="viewer-content">
          {mode === 'table' ? renderTable() : (
            <div className="raw-json-view">
              {JSON.stringify(data, null, 2)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// GENERATOR COMPONENT (The Main App)
// ==========================================
function Generator() {
  const [jsonInput, setJsonInput] = useState('[\n  { "id": 1, "name": "Item 1", "status": "active" },\n  { "id": 2, "name": "Item 2", "status": "inactive" }\n]');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setError('');
    setResult(null);
    setLoading(true);

    try {
      // PROOFING: JSON validation errors handled gracefully here
      JSON.parse(jsonInput);
      
      const response = await fetch('https://mock-it-zcl0.onrender.com/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' }, // Avoids strict backend json parsing issues
        body: jsonInput,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate API endpoint');
      }

      setResult(data);
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Invalid JSON format. Please check your syntax.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (result && result.mockUrl) {
      navigator.clipboard.writeText(result.mockUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newText = jsonInput.substring(0, start) + '  ' + jsonInput.substring(end);
      setJsonInput(newText);
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2;
      }, 0);
    }
  };

  return (
    <div className="container">
      <header>
        <h1>Mock-It</h1>
        <p>Instant API generation. Decouple your frontend today.</p>
      </header>

      <div className="editor-panel">
        <div className="editor-header">
          <div className="editor-title">
            <Terminal size={16} />
            payload.json
          </div>
        </div>
        
        <div className="editor-body">
          {/* PROOFING: Simple textarea code editor. No complex library setups. */}
          <textarea
            className="code-editor"
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Paste your JSON payload here..."
            spellCheck="false"
          />
        </div>

        <div className="actions">
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <div style={{ flex: 1 }}>
                {error && <div className="error-message" style={{ textAlign: 'left', marginTop: 0 }}><AlertCircle size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> {error}</div>}
             </div>
             <button 
                className="btn" 
                onClick={handleGenerate}
                disabled={loading || !jsonInput.trim()}
              >
                {loading ? 'Generating...' : <><Zap size={18} /> Generate Endpoint</>}
              </button>
          </div>
        </div>
      </div>

      {result && (
        <div className="result-panel">
          <div className="result-header">
            <CheckCircle2 size={20} />
            <span>Success! Your API is live.</span>
          </div>
          <p style={{ color: '#059669', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
            API URL (Use this in your code):
          </p>
          <div className="url-box">
            <span className="url-text">{result.mockUrl}</span>
            <button className="copy-btn" onClick={copyToClipboard} title="Copy to clipboard">
              {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
            </button>
          </div>
          
          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <p style={{ color: '#059669', fontSize: '0.9rem', marginBottom: '0.5rem' }}>View your endpoint dashboard:</p>
            <a href={`#/view/${result.id}`} className="view-dashboard-btn">
              <Table2 size={16} /> View Data Dashboard
            </a>
          </div>
        </div>
      )}

      <div className="footer">
        Built with React & Express
      </div>
    </div>
  );
}

// ==========================================
// MAIN APP COMPONENT (Simple Routing)
// ==========================================
function App() {
  const [currentHash, setCurrentHash] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => setCurrentHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  
  if (currentHash.startsWith('#/view/')) {
    const id = currentHash.split('/')[2];
    return <Viewer id={id} />
  }

  return <Generator />;
}

export default App;
