import React from 'react';
import { openGitHubForStarring } from '../utils/tracking';

const GitHubStarsBadge = ({ starCount, loading }) => {
  const handleStarClick = (e) => {
    e.preventDefault();
    openGitHubForStarring();
  };

  return (
    <a 
      href="https://github.com/benbasha/Claude-Autopilot" 
      className="badge github-stars" 
      title="⭐ Star this project on GitHub"
      onClick={handleStarClick}
    >
      ⭐ <span id="star-count">
        {loading ? 'Loading...' : starCount.toLocaleString()}
      </span> stars
    </a>
  );
};

export default GitHubStarsBadge;