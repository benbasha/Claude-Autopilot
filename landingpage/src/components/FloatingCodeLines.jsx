import React, { useEffect, useState } from 'react';
import './FloatingCodeLines.css';

const FloatingCodeLines = () => {
  const [codeLines, setCodeLines] = useState([]);

  const codeSnippets = [
    'const productivity = automated ? 100 : struggle();',
    'if (laptop.glowing && bedtime) { usePhone(); }',
    'async function processQueue() { return tasks.complete(); }',
    'claude.autopilot.start({ mobile: true });',
    'queue.process(tasks).then(sleep);',
    '// Automated development workflow',
    'export const efficiency = mobile + claude;',
    'interface TaskQueue { pending: Task[]; }',
    'npm install claude-code --save-dev',
    'git commit -m "Add automated task processing"',
    'docker run -d claude-autopilot --queue-mode',
    'func automate() -> Success { return true }',
    'SELECT * FROM tasks WHERE status = "completed";',
    'curl -X POST /api/queue/process',
    '<TaskItem status="processing" />',
    'python manage.py run_automation',
    'let smartCoding = claude && !manual;',
    'class AutomatedWorkflow extends BaseProcessor {}',
    'const queueManager = new ClaudeQueue();',
    'rm -rf manual-processes',
    'await claude.process(userStories);',
    'const features = tasks.map(autoImplement);',
    'function sleep() { claude.worksForYou(); }',
    'import { AutoPilot } from "claude-code";',
    'type CodeGeneration = Automated | Manual;',
    'mkdir automated-features && cd $_',
    'echo "Building while you rest..."',
    'jest --testPathPattern=automated',
    'webpack --mode=autopilot --optimize',
    'rails generate claude:automation',
    'go func() { claude.Process(tasks) }()',
    'CREATE TABLE completed_tasks (...);',
    'terraform apply --auto-approve',
    '<Queue items={pendingTasks} />',
    'def process_automatically(): return True'
  ];

  useEffect(() => {
    const createCodeLine = () => {
      const id = Math.random().toString(36).substring(2, 9);
      const content = codeSnippets[Math.floor(Math.random() * codeSnippets.length)];
      const topPosition = Math.random() * 100;
      const leftPosition = Math.random() * 80; // Random x-axis start position (0-80% to avoid overflow)
      const duration = 8 + Math.random() * 7;
      const delay = Math.random() * 3;

      const newLine = {
        id,
        content,
        topPosition,
        leftPosition,
        duration,
        delay
      };

      setCodeLines(prev => [...prev, newLine]);

      // Remove line after animation completes
      setTimeout(() => {
        setCodeLines(prev => prev.filter(line => line.id !== id));
      }, (duration + delay + 3) * 1000);
    };

    // Create initial lines
    for (let i = 0; i < 8; i++) {
      setTimeout(() => createCodeLine(), i * 600);
    }

    // Continuously create new lines
    const interval = setInterval(() => {
      if (Math.random() > 0.2) { // 80% chance to create a new line
        createCodeLine();
      }
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="floating-code-lines">
      {codeLines.map((line, index) => (
        <div
          key={line.id}
          className={`code-line code-line-${index % 4}`}
          style={{
            top: `${line.topPosition}%`,
            left: `${line.leftPosition}%`,
            animationDuration: `${line.duration}s`,
            animationDelay: `${line.delay}s`
          }}
        >
          {line.content}
        </div>
      ))}
    </div>
  );
};

export default FloatingCodeLines;