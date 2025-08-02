import React from 'react';
import useIntersectionObserver from '../hooks/useIntersectionObserver';
import './FeaturesSection.css';

const FeaturesSection = () => {
  const { targetRef, hasIntersected } = useIntersectionObserver();

  const features = [
    {
      icon: '📋',
      title: 'Boss Mode Task Queue',
      description: 'Just tell Claude what you want in plain English. "Build a user auth system with JWT." Done. No more breaking down tasks into baby steps.',
      details: [
        'Talk to Claude like a human being',
        'Handles complex multi-file projects',
        'Understands your codebase context',
        'Queue unlimited tasks and walk away'
      ]
    },
    {
      icon: '🌙',
      title: 'Sleep Mode Coding',
      description: 'API limits? Network hiccups? Claude Autopilot doesn\'t care. It keeps grinding while you\'re dreaming about bug-free code.',
      details: [
        'Never loses progress to stupid errors',
        'Handles API limits like a pro',
        'Auto-resumes after network issues',
        'Your code writes itself overnight'
      ]
    },
    {
      icon: '📱',
      title: 'Remote Control Coding',
      description: 'Control your coding empire from the beach. Or the couch. Or while pretending to pay attention in meetings.',
      details: [
        'Monitor progress from your phone',
        'Add tasks while drinking coffee',
        'Pause/resume from anywhere',
        'No more laptop babysitting'
      ]
    },
    {
      icon: '🏗️',
      title: 'Mind Reading Integration',
      description: 'Claude Autopilot knows your codebase better than you do. It reads your project, understands your patterns, and codes like you (but better).',
      details: [
        'Analyzes your entire project structure',
        'Auto-commits with meaningful messages',
        'Works with your favorite extensions',
        'Learns your coding style'
      ]
    },
    {
      icon: '⚡',
      title: 'Stupidly Fast Processing',
      description: 'While other tools are still thinking, Claude Autopilot is already shipping. Parallel processing, smart caching, zero waiting around.',
      details: [
        'Runs multiple tasks simultaneously',
        'Caches responses like a boss',
        'Optimized for maximum speed',
        'Works in the background silently'
      ]
    },
    {
      icon: '🛡️',
      title: 'Paranoid-Level Security',
      description: 'Your code stays on your machine. Period. We don\'t want your secrets, we just want you to ship faster.',
      details: [
        'Everything happens locally',
        'Encrypted communication only',
        'Zero code sent to our servers',
        'Audit trails for compliance nerds'
      ]
    }
  ];

  return (
    <section className="features" ref={targetRef}>
      <div className="container">
        <h2 className="section-title">Your New Superpower: Coding Automation That Actually Works</h2>
        <div className={`features-grid ${hasIntersected ? 'fade-in-up' : ''}`}>
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="feature-card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <ul className="feature-details">
                {feature.details.map((detail, detailIndex) => (
                  <li key={detailIndex}>{detail}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;