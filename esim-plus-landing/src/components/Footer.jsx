import React from 'react';
import './Footer.css'; // Assuming you have a separate CSS file for footer styles

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-content">
                <div className="footer-links">
                    <a href="#about">About Us</a>
                    <a href="#services">Services</a>
                    <a href="#contact">Contact</a>
                </div>
                <div className="social-media">
                    <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">Facebook</a>
                    <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">Twitter</a>
                    <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a>
                </div>
            </div>
            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} eSIM Plus. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;