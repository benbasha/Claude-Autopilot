import React from 'react';
import './Footer.css';

const Footer = () => {
  const footerSections = [
    {
      title: "Claude Autopilot",
      description: "The VS Code and Cursor extension that automates your development workflow with Claude AI.",
      links: []
    },
    {
      title: "Product",
      links: [
        { text: "VS Code Marketplace", href: "https://marketplace.visualstudio.com/items?itemName=benbasha.claude-autopilot" },
        { text: "GitHub Repository", href: "https://github.com/benbasha/Claude-Autopilot" },
        { text: "Documentation", href: "https://github.com/benbasha/Claude-Autopilot#readme" },
        { text: "Changelog", href: "https://github.com/benbasha/Claude-Autopilot/releases" }
      ]
    },
    {
      title: "Community",
      links: [
        { text: "GitHub Discussions", href: "https://github.com/benbasha/Claude-Autopilot/discussions" }
      ]
    },
    {
      title: "Support",
      links: [
        { text: "Report Issues", href: "https://github.com/benbasha/Claude-Autopilot/issues" },
        { text: "Troubleshooting", href: "https://github.com/benbasha/Claude-Autopilot#readme/troubleshooting" }
      ]
    }
  ];

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          {footerSections.map((section, index) => (
            <div key={index} className="footer-section">
              <h4>{section.title}</h4>
              {section.description && (
                <p>{section.description}</p>
              )}
              {section.links.length > 0 && (
                <ul>
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <a href={link.href} target="_blank" rel="noopener noreferrer">
                        {link.text}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 Claude Autopilot. Built with ❤️ for developers who are tired of the grind and ready to live again.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;