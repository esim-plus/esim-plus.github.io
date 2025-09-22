import React from 'react';
import './Pricing.css'; // Assuming you will create a separate CSS file for Pricing component styles

const Pricing = () => {
    return (
        <section className="pricing">
            <div className="container">
                <h2 className="pricing-title">Choose Your Plan</h2>
                <div className="pricing-options">
                    <div className="pricing-card">
                        <h3 className="plan-name">Basic Plan</h3>
                        <p className="plan-price">$9.99/month</p>
                        <ul className="plan-features">
                            <li>10 GB Data</li>
                            <li>Unlimited Calls</li>
                            <li>24/7 Support</li>
                        </ul>
                        <button className="cta-button">Get Started</button>
                    </div>
                    <div className="pricing-card">
                        <h3 className="plan-name">Standard Plan</h3>
                        <p className="plan-price">$19.99/month</p>
                        <ul className="plan-features">
                            <li>20 GB Data</li>
                            <li>Unlimited Calls</li>
                            <li>Priority Support</li>
                        </ul>
                        <button className="cta-button">Get Started</button>
                    </div>
                    <div className="pricing-card">
                        <h3 className="plan-name">Premium Plan</h3>
                        <p className="plan-price">$29.99/month</p>
                        <ul className="plan-features">
                            <li>Unlimited Data</li>
                            <li>Unlimited Calls</li>
                            <li>Personalized Support</li>
                        </ul>
                        <button className="cta-button">Get Started</button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Pricing;