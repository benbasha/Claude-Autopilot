import React, { useState, useEffect } from 'react';
import useIntersectionObserver from '../hooks/useIntersectionObserver';
import ProgressCircle from './ProgressCircle';
import './MobileControlSection.css';

const MobileControlSection = () => {
  const { targetRef, hasIntersected } = useIntersectionObserver();
  const [currentProgress, setCurrentProgress] = useState(67);

  useEffect(() => {
    if (hasIntersected) {
      // Animate progress when section comes into view
      setTimeout(() => {
        setCurrentProgress(67);
      }, 500);
    }
  }, [hasIntersected]);

  const benefits = [
    {
      icon: '🛏️',
      text: 'Monitor tasks while away from desk'
    },
    {
      icon: '📱',
      text: 'Monitor from any device'
    },
    {
      icon: '🏖️',
      text: 'Add tasks from the beach'
    },
    {
      icon: '💻',
      text: 'No more laptop babysitting'
    }
  ];

  const scenarios = [
    {
      icon: '🛏️',
      title: 'The Bedtime Coder',
      description: '"Queue up your tasks before bedtime, let your development environment run, and monitor progress from your phone. Check on completed work in the morning."'
    },
    {
      icon: '☕',
      title: 'The Coffee Shop Worker',
      description: '"Left your laptop at home? No problem. Add new tasks to your queue from the coffee shop and watch your home setup handle everything."'
    },
    {
      icon: '✈️',
      title: 'The Digital Nomad',
      description: '"Traveling but need to ship? Start your tasks before the flight, monitor from 30,000 feet, land with completed code."'
    },
    {
      icon: '🏢',
      title: 'The Meeting Survivor',
      description: '"Stuck in another useless meeting? Secretly check your coding progress and add new tasks. At least something productive is happening."'
    }
  ];

  const techSteps = [
    {
      icon: '🚀',
      title: 'Auto-Start Server',
      description: 'Claude Autopilot automatically spins up a local web server when you start a queue'
    },
    {
      icon: '📱',
      title: 'Access From Any Device',
      description: 'Open the local URL on your phone, tablet, or any browser on your network'
    },
    {
      icon: '🎮',
      title: 'Full Remote Control',
      description: 'Monitor progress, pause/resume, add tasks, and get real-time updates'
    }
  ];

  return (
    <section className="mobile-control-special" ref={targetRef}>
      <div className="container">
        <div className={`mobile-hero ${hasIntersected ? 'fade-in-up' : ''}`}>
          <div className="mobile-text">
            <h2 className="section-title">Control Your Code Empire From Anywhere</h2>
            <h3 className="mobile-subtitle">The Feature That Changes Everything</h3>
            <p className="mobile-description">
              No more staying glued to your development machine. 
              Claude Autopilot spins up a local web server so you can monitor and control your coding tasks from your phone. 
              Step away from your desk while tasks continue processing - check progress remotely and stay productive.
            </p>
            <div className="mobile-benefits">
              {benefits.map((benefit, index) => (
                <div key={index} className="benefit">
                  <span className="benefit-icon">{benefit.icon}</span>
                  <p>{benefit.text}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mobile-visual">
            <div className="phone-demo-large">
              <div className="phone-frame">
                <div className="phone-screen-large">
                  <div className="mobile-app">
                    <div className="app-header">
                      <h4>Claude Autopilot Mobile</h4>
                      <div className="status-indicator-control">🟢 Active</div>
                    </div>
                    <div className="progress-section">
                      <ProgressCircle 
                        progress={currentProgress} 
                        animated={hasIntersected}
                      />
                      <p className="progress-label">32/48 tasks completed</p>
                    </div>
                    <div className="current-task">
                      <div className="task-status">🔄 Currently Processing</div>
                      <p className="task-name">"Build user authentication with JWT"</p>
                      <div className="task-progress-bar">
                        <div 
                          className="task-progress" 
                          style={{ 
                            width: hasIntersected ? '43%' : '0%',
                            transition: 'width 1s ease-in-out 0.5s'
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="queue-preview">
                      <h5>Next Up:</h5>
                      <div className="queue-item-mini">Create API endpoints</div>
                      <div className="queue-item-mini">Write comprehensive tests</div>
                      <div className="queue-item-mini">Update documentation</div>
                    </div>
                    <div className="mobile-controls">
                      <button className="control-btn pause">⏸️ Pause</button>
                      <button className="control-btn add">➕ Add Task</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`mobile-scenarios ${hasIntersected ? 'fade-in-up' : ''}`}>
          <h3>Real Developer Scenarios</h3>
          <div className="scenarios-grid">
            {scenarios.map((scenario, index) => (
              <div key={index} className="scenario-card">
                <div className="scenario-icon">{scenario.icon}</div>
                <h4>{scenario.title}</h4>
                <p>{scenario.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={`mobile-tech ${hasIntersected ? 'fade-in-up' : ''}`}>
          <h3>How It Works</h3>
          <div className="tech-flow">
            {techSteps.map((step, index) => (
              <React.Fragment key={index}>
                <div className="tech-step">
                  <div className="step-icon">{step.icon}</div>
                  <h4>{step.title}</h4>
                  <p>{step.description}</p>
                </div>
                {index < techSteps.length - 1 && <div className="flow-arrow">→</div>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MobileControlSection;