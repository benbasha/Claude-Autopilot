import React from 'react';
import useIntersectionObserver from '../hooks/useIntersectionObserver';
import useCounter from '../hooks/useCounter';
import { formatNumber } from '../utils/formatters';
import './SocialProofSection.css';

const SocialProofSection = () => {
  const { targetRef, hasIntersected } = useIntersectionObserver();
  
  const developersCount = useCounter(47832, hasIntersected);
  const tasksCount = useCounter(1200000, hasIntersected);
  const successRate = useCounter(98, hasIntersected);

  const testimonials = [
    {
      text: "Before Claude Autopilot, I was working weekends and still behind on features. Now I queue tasks Friday night and come back Monday to a finished sprint.",
      author: {
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face",
        name: "@burnoutcoder",
        title: "Reformed Weekend Warrior"
      }
    },
    {
      text: "I was skeptical about AI coding tools. Then I tried Claude Autopilot and it handled my API development efficiently. Genuinely impressed.",
      author: {
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face",
        name: "@skepticaldev",
        title: "Former AI Doubter"
      }
    },
    {
      text: "My manager asked how I shipped 3 features in one week. I told him I hired Claude. He thinks I'm joking.",
      author: {
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50&h=50&fit=crop&crop=face",
        name: "@productivedev",
        title: "Suspiciously Fast Coder"
      }
    }
  ];

  const stats = [
    {
      number: developersCount,
      target: 47832,
      label: "developers liberated"
    },
    {
      number: tasksCount,
      target: 1200000,
      label: "tasks coded automatically"
    },
    {
      number: successRate,
      target: 98,
      label: "% success rate"
    }
  ];

  return (
    <section className="social-proof" ref={targetRef}>
      <div className="container">
        <h2 className="section-title">Join the Liberation</h2>
        <div className={`testimonials ${hasIntersected ? 'fade-in-up' : ''}`}>
          {testimonials.map((testimonial, index) => (
            <div 
              key={index} 
              className="testimonial"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <p>"{testimonial.text}"</p>
              <div className="author">
                <img 
                  src={testimonial.author.image} 
                  alt="Developer" 
                  className="avatar"
                />
                <div className="author-info">
                  <span className="name">{testimonial.author.name}</span>
                  <span className="title">{testimonial.author.title}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className={`stats ${hasIntersected ? 'fade-in-up' : ''}`}>
          {stats.map((stat, index) => (
            <div 
              key={index} 
              className="stat"
              style={{ animationDelay: `${(index + 1) * 0.3}s` }}
            >
              <div className="stat-number">
                {stat.target === 98 ? stat.number : formatNumber(stat.number)}
              </div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProofSection;