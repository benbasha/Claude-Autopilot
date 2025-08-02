import React from 'react';
import useIntersectionObserver from '../hooks/useIntersectionObserver';
import './InstallationSection.css';

const InstallationSection = () => {
  const { targetRef, hasIntersected } = useIntersectionObserver();

  const steps = [
    {
      number: 1,
      title: "Install Claude Autopilot",
      description: "Get it from VS Code Marketplace or Cursor Extensions (it's free, obviously)"
    },
    {
      number: 2,
      title: "Start Automating",
      description: "Open command palette and launch Claude Autopilot",
      code: 'Ctrl/Cmd + Shift + P → "Claude: Start Claude Autopilot"'
    }
  ];

  return (
    <section className="installation" id="install" ref={targetRef}>
      <div className="container">
        <h2 className="section-title">Get This Power (It Takes 30 Seconds)</h2>
        <div className={`installation-steps ${hasIntersected ? 'fade-in-up' : ''}`}>
          {steps.map((step, index) => (
            <div 
              key={step.number} 
              className="step"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className="step-number">{step.number}</div>
              <div className="step-content">
                <h3>{step.title}</h3>
                <p>{step.description}</p>
                {step.code && <code>{step.code}</code>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default InstallationSection;