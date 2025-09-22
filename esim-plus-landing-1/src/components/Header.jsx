import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css'; // Assuming you have a separate CSS file for header styles

const Header = () => {
    return (
        <header className="header">
            <div className="logo">
                <Link to="/">eSIM Plus</Link>
            </div>
            <nav className="navigation">
                <ul>
                    <li><Link to="/features">Features</Link></li>
                    <li><Link to="/pricing">Pricing</Link></li>
                    <li><Link to="/testimonials">Testimonials</Link></li>
                    <li><Link to="/faq">FAQ</Link></li>
                </ul>
            </nav>
        </header>
    );
};

export default Header;