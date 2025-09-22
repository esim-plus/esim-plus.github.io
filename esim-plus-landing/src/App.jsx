import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import Features from './components/Features';
import Pricing from './components/Pricing';
import Testimonials from './components/Testimonials';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import './assets/styles/main.css';

const App = () => {
  return (
    <Router>
      <div>
        <Header />
        <Switch>
          <Route path="/" exact component={HeroSection} />
          <Route path="/features" component={Features} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/testimonials" component={Testimonials} />
          <Route path="/faq" component={FAQ} />
        </Switch>
        <Footer />
      </div>
    </Router>
  );
};

export default App;