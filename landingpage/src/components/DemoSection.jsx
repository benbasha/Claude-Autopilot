import React, { useState, useEffect } from 'react';
import useIntersectionObserver from '../hooks/useIntersectionObserver';
import { trackEvent } from '../utils/tracking';
import './DemoSection.css';

const DemoSection = () => {
  const { targetRef, hasIntersected } = useIntersectionObserver();
  const [videoPlayed, setVideoPlayed] = useState(false);
  const [terminalLines, setTerminalLines] = useState([]);
  const [phoneProgress, setPhoneProgress] = useState(52);

  const terminalOutput = [
    "📱 Web interface: http://localhost:3000",
    "⏳ Queue: 23 tasks remaining",
    "✅ Completed: 25/48 tasks",
    '🚀 Processing: "Build React components"'
  ];

  useEffect(() => {
    if (hasIntersected) {
      // Start terminal animation
      setTimeout(() => {
        animateTerminal();
      }, 500);

      // Start phone progress animation
      setTimeout(() => {
        setPhoneProgress(52);
      }, 1000);
    }
  }, [hasIntersected]);

  const animateTerminal = () => {
    setTerminalLines([]);
    
    terminalOutput.forEach((line, index) => {
      setTimeout(() => {
        setTerminalLines(prev => [...prev, line]);
      }, index * 800);
    });
  };

  const handleVideoClick = () => {
    setVideoPlayed(true);
    trackEvent('demo_video_click');
  };

  const handlePhoneClick = () => {
    setPhoneProgress(prev => prev === 52 ? 75 : 52);
    trackEvent('mobile_demo_click');
  };

  const steps = [
    { number: 1, text: 'Install Claude Autopilot' },
    { number: 2, text: 'Queue your tasks' },
    { number: 3, text: 'Go live your life' },
    { number: 4, text: 'Wake up to shipped code' }
  ];

  return (
    <section className="demo" ref={targetRef}>
      <div className="container">
        <h2 className="section-title">See Claude Autopilot in Action</h2>
        <div className={`demo-content ${hasIntersected ? 'fade-in-up' : ''}`}>
          <div className="demo-video">
            {!videoPlayed ? (
              <div 
                className="video-placeholder"
                onClick={handleVideoClick}
              >
                <div className="play-button">▶</div>
                <p>Watch: Claude Autopilot in action</p>
              </div>
            ) : (
              <video 
                className="demo-video-player"
                controls 
                autoPlay
                width="100%"
                style={{ borderRadius: 'var(--border-radius)' }}
              >
                <source src="/assets/demo.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            )}
          </div>
          <div className="demo-steps">
            {steps.map((step, index) => (
              <div 
                key={step.number} 
                className="step"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <span className="step-number">{step.number}</span>
                <p>{step.text}</p>
              </div>
            ))}
          </div>
        </div>
        
        <div className={`interactive-demo ${hasIntersected ? 'fade-in-up' : ''}`}>
          <div className="fake-terminal">
            <div className="terminal-header">
              <span className="terminal-title">Claude Autopilot - Coding While You Sleep</span>
            </div>
            <div className="terminal-content">
              <div className="terminal-line">
                <span className="prompt">$</span> claude-autopilot start
              </div>
              <div className="terminal-line">
                🚀 Starting your coding liberation...
              </div>
              {terminalLines.map((line, index) => (
                <div key={index} className="terminal-line typing-line">
                  {line}
                </div>
              ))}
              {terminalLines.length === terminalOutput.length && (
                <div className="terminal-line">
                  🌙 Go to sleep - I got this covered!
                </div>
              )}
              <div className="terminal-line typing">
                <span className="cursor">_</span>
              </div>
            </div>
          </div>
          <div className="phone-mockup-interactive" onClick={handlePhoneClick}>
            <div className="phone-screen">
              <div className="mobile-interface">
                <h4>Claude Autopilot Mobile</h4>
                <div className="progress-bar">
                  <div 
                    className="progress" 
                    style={{ 
                      width: `${phoneProgress}%`,
                      transition: 'width 0.5s ease'
                    }}
                  ></div>
                </div>
                <p>25/48 tasks completed</p>
                <div className="queue-item active">Building user authentication...</div>
                <div className="queue-item">Creating API endpoints</div>
                <div className="queue-item">Writing comprehensive tests</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DemoSection;