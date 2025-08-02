import { useState, useEffect } from 'react';

const useCounter = (target, isActive = false, duration = 2000) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isActive || target === 0) return;

    const increment = target / (duration / 10);
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, 10);

    return () => clearInterval(timer);
  }, [target, isActive, duration]);

  return count;
};

export default useCounter;