import React from 'react';
import useIntersectionObserver from '../hooks/useIntersectionObserver';
import './ProblemSection.css';

const ProblemSection = () => {
  const { targetRef, hasIntersected } = useIntersectionObserver();

  return (
    <section className="problem" ref={targetRef}>
      <div className="container">
        <h2 className="section-title">The Developer Productivity Challenge</h2>
        <div className={`problem-scenarios ${hasIntersected ? 'fade-in-up' : ''}`}>
          <div className="scenario">
            <div className="scenario-icon">💻</div>
            <p>"Your todo list keeps growing faster than you can complete tasks. Managing repetitive coding work takes time away from creative problem-solving."</p>
          </div>
          <div className="scenario">
            <div className="scenario-icon">😴</div>
            <p>"You want work-life balance, but you also want to ship quality features. Why do we have to choose between rest and productivity?"</p>
          </div>
          <div className="scenario">
            <div className="scenario-icon">🤔</div>
            <p>"What if your computer could just... handle the boring stuff while you actually live your life?"</p>
          </div>
        </div>
        {/* <div className={`problem-visual ${hasIntersected ? 'fade-in-up' : ''}`}>
          <div className="before-after">
            <div className="before">
              <h3>The Old Way</h3>
              <div className="laptop-disruption">
                <div className="glowing-screen"></div>
                <p>Manual repetitive tasks</p>
                <p>Constant context switching</p>
                <p>Limited time for innovation</p>
              </div>
            </div>
            <div className="arrow">→</div>
            <div className="after">
              <h3>The Claude Way</h3>
              <div className="phone-solution">
                <div className="phone-mockup"></div>
                <p>Queue tasks efficiently</p>
                <p>Automated task processing</p>
                <p>Focus on high-value work</p>
              </div>
            </div>
          </div>
        </div> */}
      </div>
    </section>
  );
};

export default ProblemSection;