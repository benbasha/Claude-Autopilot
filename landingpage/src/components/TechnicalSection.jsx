import React from 'react';
import useIntersectionObserver from '../hooks/useIntersectionObserver';
import './TechnicalSection.css';

const TechnicalSection = () => {
  const { targetRef, hasIntersected } = useIntersectionObserver();

  return (
    <section className="technical" ref={targetRef}>
      <div className="container">
        <h2 className="section-title">Under the Hood</h2>
        <div className={`technical-content ${hasIntersected ? 'fade-in-up' : ''}`}>
          <div className="architecture">
            <h3>Technical Architecture</h3>
            <ul>
              <li><strong>Local-First Design</strong> - All processing happens on your machine</li>
              <li><strong>Claude Code Integration</strong> - Secure CLI integration with Anthropic</li>
              <li><strong>IDE Native</strong> - Deep integration with VS Code and Cursor APIs</li>
              <li><strong>Cross-Platform</strong> - Works on Windows, macOS, and Linux</li>
            </ul>
          </div>
          <div className="compatibility">
            <h3>Requirements & Compatibility</h3>
            <ul>
              <li><strong>IDE Support:</strong> VS Code 1.74.0+ or Cursor IDE</li>
              <li><strong>Claude Code:</strong> CLI authentication with Anthropic required</li>
              <li><strong>Languages:</strong> TypeScript, JavaScript, Python, Go, Rust, and more</li>
              <li><strong>Frameworks:</strong> React, Next.js, Express, Django, and most popular frameworks</li>
            </ul>
          </div>
        </div>
        <div className={`code-preview ${hasIntersected ? 'fade-in-up' : ''}`}>
          <div className="code-block">
            <div className="code-header">
              <span className="language">Natural Language</span>
              <span className="filename">tasks.txt</span>
            </div>
            <pre><code>{`// Just describe what you want in plain English:

1. "Build a React component for user profile editing with validation"
2. "Add JWT authentication to the Express API"  
3. "Create database migrations for the new user roles table"
4. "Write comprehensive tests for the payment processing module"
5. "Update the API documentation with the new endpoints"

// Claude Autopilot handles the rest!`}</code></pre>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TechnicalSection;