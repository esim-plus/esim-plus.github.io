import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const HeroSection = () => {
    const heroRef = useRef(null);

    useEffect(() => {
        gsap.from(heroRef.current, {
            duration: 1.5,
            opacity: 0,
            y: -50,
            ease: 'power3.out',
        });
    }, []);

    return (
        <section className="hero-section" ref={heroRef}>
            <div className="hero-content">
                <h1>Welcome to eSIM Plus</h1>
                <p>Your gateway to seamless connectivity.</p>
                <a href="#pricing" className="cta-button">Get Started</a>
            </div>
            <div className="hero-background">
                {/* 3D background or visual effect can be implemented here */}
            </div>
        </section>
    );
};

export default HeroSection;