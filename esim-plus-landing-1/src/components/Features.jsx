import React from 'react';
import { gsap } from 'gsap';

const featuresData = [
    {
        title: 'Global Connectivity',
        description: 'Stay connected with eSIM Plus, providing seamless global coverage without the hassle of physical SIM cards.',
        icon: '🌍'
    },
    {
        title: 'Instant Activation',
        description: 'Activate your eSIM instantly with just a few taps on your device, no waiting for physical SIM delivery.',
        icon: '⚡'
    },
    {
        title: 'Flexible Plans',
        description: 'Choose from a variety of flexible plans that suit your travel needs, whether for short trips or long stays.',
        icon: '📅'
    },
    {
        title: 'Secure and Private',
        description: 'Enjoy secure and private connections with advanced encryption and data protection features.',
        icon: '🔒'
    }
];

const Features = () => {
    React.useEffect(() => {
        gsap.from('.feature', {
            duration: 1,
            opacity: 0,
            y: 50,
            stagger: 0.2,
            ease: 'power3.out'
        });
    }, []);

    return (
        <section className="features">
            <h2 className="features-title">Key Features of eSIM Plus</h2>
            <div className="features-container">
                {featuresData.map((feature, index) => (
                    <div className="feature" key={index}>
                        <div className="feature-icon">{feature.icon}</div>
                        <h3 className="feature-title">{feature.title}</h3>
                        <p className="feature-description">{feature.description}</p>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default Features;