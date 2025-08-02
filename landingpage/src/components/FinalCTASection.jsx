import React from 'react';
import useIntersectionObserver from '../hooks/useIntersectionObserver';
import { trackEvent, shareOnTwitter, shareOnReddit } from '../utils/tracking';
import Button from './Button';
import './FinalCTASection.css';

const FinalCTASection = () => {
  const { targetRef, hasIntersected } = useIntersectionObserver();

  const handleCTAClick = (type) => {
    trackEvent('cta_click', { button: type, location: 'final-cta' });
  };

  return (
    <section className="final-cta" ref={targetRef}>
      <div className="container">
        <div className={hasIntersected ? 'fade-in-up' : ''}>
          <h2 className="section-title">Stop Suffering. Start Shipping.</h2>
          <p className="cta-description">
            Join thousands of developers who've escaped the grind. 
            Install Claude Autopilot and start coding while you sleep.
          </p>
          
          <div className="shareable-quote">
            "Finally, an extension that gets your relationship status: 'It's complicated (because of code)'"
          </div>
          
          <div className="share-buttons">
            <a 
              href="#" 
              className="share-btn x-twitter"
              onClick={(e) => {
                e.preventDefault();
                shareOnTwitter(
                  "Finally, an extension that gets your relationship status: 'It's complicated (because of code)' #ClaudeAutopilot #VsCode", 
                  window.location.href
                );
              }}
            >
              Share on X
            </a>
            <a 
              href="#" 
              className="share-btn reddit"
              onClick={(e) => {
                e.preventDefault();
                shareOnReddit(
                  "Stop Fighting With Your IDE - Claude Autopilot VS Code Extension", 
                  window.location.href
                );
              }}
            >
              Share on Reddit
            </a>
          </div>
          <div className="cta-buttons">
            <Button 
              variant="primary" 
              size="large"
              href="https://marketplace.visualstudio.com/items?itemName=benbasha.claude-autopilot"
              onClick={() => handleCTAClick('marketplace')}
            >
              <span className="button-text">End The Suffering</span>
              <span className="button-glow"></span>
            </Button>
            <div className="secondary-ctas">
              <Button 
                variant="secondary"
                href="https://github.com/benbasha/Claude-Autopilot"
                onClick={() => handleCTAClick('github')}
              >
                ⭐ Star on GitHub
              </Button>
              <Button 
                variant="secondary"
                href="https://github.com/benbasha/Claude-Autopilot/discussions"
                onClick={() => handleCTAClick('community')}
              >
                💬 Join Community
              </Button>
              <Button 
                variant="secondary"
                href="https://github.com/benbasha/Claude-Autopilot#readme"
                onClick={() => handleCTAClick('docs')}
              >
                📚 Read Docs
              </Button>
            </div>
          </div>
          <div className="guarantee">
            <div className="guarantee-grid">
              <div className="guarantee-item">
                <div className="guarantee-icon">🍺</div>
                <div className="guarantee-text">
                  <strong>100% Free</strong>
                  <span>No hidden costs, ever</span>
                </div>
              </div>
              <div className="guarantee-item">
                <div className="guarantee-icon">🔓</div>
                <div className="guarantee-text">
                  <strong>Open Source</strong>
                  <span>MIT licensed freedom</span>
                </div>
              </div>
              <div className="guarantee-item">
                <div className="guarantee-icon">🚫</div>
                <div className="guarantee-text">
                  <strong>No Lock-in</strong>
                  <span>Your code, your rules</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTASection;