import React, { useState } from 'react';
import { gsap } from 'gsap';

const FAQ = () => {
    const [activeIndex, setActiveIndex] = useState(null);

    const toggleFAQ = (index) => {
        setActiveIndex(activeIndex === index ? null : index);
        gsap.to(`.faq-answer-${index}`, {
            height: activeIndex === index ? 0 : 'auto',
            duration: 0.5,
            ease: 'power2.out',
        });
    };

    const faqs = [
        {
            question: "What is eSIM?",
            answer: "eSIM is a digital SIM that allows you to activate a cellular plan without having to use a physical SIM card."
        },
        {
            question: "How do I activate my eSIM?",
            answer: "You can activate your eSIM by scanning a QR code provided by your carrier or by entering the activation details manually."
        },
        {
            question: "Can I use eSIM on multiple devices?",
            answer: "Yes, you can use eSIM on multiple devices, but it depends on your carrier's policies."
        },
        {
            question: "Is eSIM secure?",
            answer: "Yes, eSIM technology is designed with security in mind, providing a secure way to connect to mobile networks."
        },
    ];

    return (
        <div className="faq-section">
            <h2>Frequently Asked Questions</h2>
            <div className="faq-list">
                {faqs.map((faq, index) => (
                    <div key={index} className="faq-item">
                        <div className="faq-question" onClick={() => toggleFAQ(index)}>
                            <h3>{faq.question}</h3>
                            <span>{activeIndex === index ? '-' : '+'}</span>
                        </div>
                        <div className={`faq-answer faq-answer-${index}`} style={{ height: activeIndex === index ? 'auto' : 0, overflow: 'hidden' }}>
                            <p>{faq.answer}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FAQ;