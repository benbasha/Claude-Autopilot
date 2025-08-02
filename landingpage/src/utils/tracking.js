// Analytics tracking utilities
export const trackEvent = (eventName, properties = {}) => {
  // Replace with your analytics implementation
  console.log('Event tracked:', eventName, properties);
  
  // Example: Google Analytics 4
  if (typeof window !== 'undefined' && typeof window.gtag !== 'undefined') {
    window.gtag('event', eventName, properties);
  }
};

export const shareOnTwitter = (text, url) => {
  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  window.open(xUrl, '_blank', 'width=600,height=400');
};

// Alias for X (formerly Twitter)
export const shareOnX = shareOnTwitter;

export const shareOnReddit = (title, url) => {
  const redditUrl = `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
  window.open(redditUrl, '_blank');
};

export const openGitHubForStarring = () => {
  const gitHubUrl = 'https://github.com/benbasha/Claude-Autopilot';
  window.open(gitHubUrl, '_blank');
  trackEvent('github_star_attempt');
};