import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [url, setUrl] = useState('')
  const [alias, setAlias] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [shortenedUrl, setShortenedUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [recentLinks, setRecentLinks] = useState([])

  useEffect(() => {
    const savedLinks = localStorage.getItem('recentLinks')
    if (savedLinks) {
      setRecentLinks(JSON.parse(savedLinks))
    }
  }, [])

  const validateUrl = (value) => {
    setUrl(value)
    if (!value) {
      setError('')
      return
    }
    try {
      new URL(value)
      setError('')
    } catch (_) {
      setError('Please enter a valid URL (e.g., https://example.com)')
    }
  }

  const handleShorten = (e) => {
    e.preventDefault()
    if (!url) {
      setError('URL is required')
      return
    }
    if (error) return

    setLoading(true)
    setShortenedUrl('')
    setCopied(false)

    // Simulate API call
    setTimeout(() => {
      // In a real app, this would be an API response
      const domain = window.location.origin.includes('localhost') || window.location.origin.includes('file:') 
        ? "https://shrt.lnk" 
        : window.location.origin;
        
      const finalAlias = alias || Math.random().toString(36).substring(2, 8)
      const newShortUrl = `${domain}/${finalAlias}`
      
      setShortenedUrl(newShortUrl)
      setLoading(false)

      const newLink = { original: url, short: newShortUrl, date: new Date().toISOString() }
      const updatedLinks = [newLink, ...recentLinks.filter(l => l.short !== newShortUrl)].slice(0, 5)
      setRecentLinks(updatedLinks)
      localStorage.setItem('recentLinks', JSON.stringify(updatedLinks))
      
      setUrl('')
      setAlias('')
    }, 1200)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shortenedUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Simplify Your Links</h1>
        <p>Create short, memorable links in seconds.</p>
      </header>

      <main>
        <form className="shorten-form" onSubmit={handleShorten}>
          <div className="input-group">
            <label htmlFor="url-input">Original URL</label>
            <input
              id="url-input"
              type="text"
              placeholder="https://your-long-url.com/example"
              value={url}
              onChange={(e) => validateUrl(e.target.value)}
              className={error ? 'error-input' : ''}
              disabled={loading}
            />
            {error && <span className="error-message">{error}</span>}
          </div>

          <div className="input-group">
            <label htmlFor="alias-input">Custom Alias (Optional)</label>
            <div className="alias-wrapper">
              <span className="domain-prefix">shrt.lnk/</span>
              <input
                id="alias-input"
                type="text"
                placeholder="my-link"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                disabled={loading}
                className="alias-input-field"
              />
            </div>
          </div>

          <button 
            type="submit" 
            className={`shorten-btn ${loading ? 'loading' : ''}`}
            disabled={loading || !!error}
          >
            {loading ? <span className="spinner"></span> : 'Shorten URL'}
          </button>
        </form>

        {shortenedUrl && (
          <div className="result-card fade-in">
            <div className="result-content">
              <span className="success-badge">Success!</span>
              <div className="short-url">{shortenedUrl}</div>
            </div>
            <button 
              className={`copy-btn ${copied ? 'copied' : ''}`} 
              onClick={copyToClipboard}
              aria-label="Copy to clipboard"
            >
              {copied ? (
                <svg className="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              ) : (
                <svg className="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              )}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        )}

        {recentLinks.length > 0 && (
          <div className="recent-links fade-in">
            <h2>Recent Links</h2>
            <div className="links-list">
              {recentLinks.map((link, index) => (
                <div key={index} className="link-item">
                  <div className="link-details">
                    <span className="recent-short">{link.short}</span>
                    <span className="recent-original">{link.original}</span>
                  </div>
                  <button 
                    className="icon-copy-btn" 
                    onClick={() => navigator.clipboard.writeText(link.short)}
                    title="Copy to clipboard"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
