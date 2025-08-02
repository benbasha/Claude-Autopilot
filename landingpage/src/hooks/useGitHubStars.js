import { useState, useEffect } from 'react';

const useGitHubStars = (repo = 'benbasha/Claude-Autopilot') => {
  const [stars, setStars] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStars = async () => {
      try {
        const response = await fetch(`https://api.github.com/repos/${repo}`);
        const data = await response.json();
        
        if (data.stargazers_count !== undefined) {
          setStars(data.stargazers_count);
        } else {
          // Fallback to static count
          setStars(12);
        }
      } catch (err) {
        console.warn('Could not fetch GitHub stars:', err);
        setError(err);
        // Fallback to static count
        setStars(12);
      } finally {
        setLoading(false);
      }
    };

    // Add delay to simulate loading
    setTimeout(fetchStars, 1000);
  }, [repo]);

  return { stars, loading, error };
};

export default useGitHubStars;