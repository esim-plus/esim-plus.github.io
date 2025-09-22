import React from 'react';
import { useEffect } from 'react';
import { gsap } from 'gsap';

const testimonialsData = [
    {
        name: "John Doe",
        feedback: "eSIM Plus has transformed my travel experience! Highly recommend.",
        position: "Frequent Traveler"
    },
    {
        name: "Jane Smith",
        feedback: "The service is seamless and the support is fantastic!",
        position: "Digital Nomad"
    },
    {
        name: "Alice Johnson",
        feedback: "I love the flexibility of eSIM Plus. It's a game changer!",
        position: "Tech Enthusiast"
    }
];

const Testimonials = () => {
    useEffect(() => {
        gsap.from('.testimonial', {
            duration: 1,
            opacity: 0,
            y: 20,
            stagger: 0.2,
            ease: 'power2.out'
        });
    }, []);

    return (
        <section className="testimonials">
            <h2>What Our Customers Say</h2>
            <div className="testimonial-container">
                {testimonialsData.map((testimonial, index) => (
                    <div className="testimonial" key={index}>
                        <p>"{testimonial.feedback}"</p>
                        <h4>{testimonial.name}</h4>
                        <span>{testimonial.position}</span>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default Testimonials;