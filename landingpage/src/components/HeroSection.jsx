import React, { useEffect, useState } from 'react';
import useGitHubStars from '../hooks/useGitHubStars';
import useCounter from '../hooks/useCounter';
import { smoothScrollTo, addRippleEffect } from '../utils/formatters';
import { trackEvent } from '../utils/tracking';
import FloatingCodeLines from './FloatingCodeLines';
import Button from './Button';
import GitHubStarsBadge from './GitHubStarsBadge';
import './HeroSection.css';

const HeroSection = () => {
  const { stars, loading } = useGitHubStars();
  const starCount = useCounter(stars, !loading);

  const handleCTAClick = (e) => {
    trackEvent('cta_click', { button: 'primary', location: 'hero' });
    smoothScrollTo('install');
    addRippleEffect(e, e.currentTarget);
  };

  return (
    <section className="hero">
      <div className="hero-background">
        <div className="matrix-rain"></div>
        <FloatingCodeLines />
      </div>
      <div className="container">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              <span className="primary-hook">Stop Fighting</span>
              <span className="primary-hook">With Your IDE</span>
            </h1>
            <h2 className="hero-subtitle">
              Code While You Sleep. Ship While You Dream.
            </h2>
            <p className="hero-description">
              I built Claude Autopilot because I was tired of babysitting my development workflow. Queue up your coding tasks, let Claude AI handle the boring stuff, and wake up to completed features. It's like having a senior developer who never sleeps, never complains, and never asks for a raise.
            </p>
            <p className="humor-disclaimer">
              <em>⚠️ Copy written with humor and taken to the extreme. This tool assists with coding tasks but always requires your review and oversight.</em>
            </p>
            <div className="hero-cta">
              <Button 
                variant="primary" 
                onClick={handleCTAClick}
                className="cta-button primary"
              >
                <span className="button-text">Stop The Suffering</span>
                <span className="button-glow"></span>
              </Button>
              <div className="hero-badges">
                <span className="badge">Sanity Saver</span>
                <GitHubStarsBadge starCount={starCount} loading={loading} />
                <span className="badge">Zero Drama Coding</span>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="split-comparison">
              <div className="before-scenario">
                <p className="scenario-label">Before: Manual terminal commands</p>
                <div className="demo-terminal">
                  <div className="terminal-header">
                    <div className="terminal-controls">
                      <span className="control red"></span>
                      <span className="control yellow"></span>
                      <span className="control green"></span>
                    </div>
                    <span className="terminal-title">Terminal</span>
                  </div>
                  <div className="terminal-body">
                    <div className="terminal-line">$ claude "Create user auth system"</div>
                    <div className="terminal-line typing">$ claude "Add API endpoints"<span className="cursor">|</span></div>
                    <div className="terminal-line">$ claude "Write tests"</div>
                    <div className="manual-indicator">😓 Typing each task manually...</div>
                  </div>
                </div>
              </div>
              <div className="after-scenario">
                <p className="scenario-label">After: Automated queue processing</p>
                <div className="demo-queue">
                  <div className="queue-header">
                    <div className="extension-icon">🤖</div>
                    <span className="queue-title">Claude Autopilot</span>
                    <div className="status-indicator active"></div>
                  </div>
                  <div className="queue-body">
                    <div className="queue-item processing">
                      <span className="item-icon">⚡</span>
                      Processing: Create user auth system
                    </div>
                    <div className="queue-item pending">
                      <span className="item-icon">⏳</span>
                      Queued: Add API endpoints
                    </div>
                    <div className="queue-item pending">
                      <span className="item-icon">⏳</span>
                      Queued: Write comprehensive tests
                    </div>
                    <div className="auto-indicator">🚀 Working automatically...</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;