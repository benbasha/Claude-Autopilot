import React from 'react';
import HeroSection from './components/HeroSection';
import ProblemSection from './components/ProblemSection';
import FeaturesSection from './components/FeaturesSection';
import MobileControlSection from './components/MobileControlSection';
import DemoSection from './components/DemoSection';
import SocialProofSection from './components/SocialProofSection';
import TechnicalSection from './components/TechnicalSection';
import InstallationSection from './components/InstallationSection';
import FinalCTASection from './components/FinalCTASection';
import Footer from './components/Footer';
import './App.css';

function App() {
  return (
    <div className="App">
      <HeroSection />
      <ProblemSection />
      <FeaturesSection />
      <MobileControlSection />
      <DemoSection />
{/* <SocialProofSection /> */}
      <TechnicalSection />
      <InstallationSection />
      <FinalCTASection />
      <Footer />
    </div>
  );
}

export default App;