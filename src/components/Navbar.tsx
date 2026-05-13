'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);

      // Highlight active section
      const sections = document.querySelectorAll('section[id]');
      const scrollY = window.pageYOffset;
      sections.forEach((section: any) => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100;
        const sectionId = section.getAttribute('id');

        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
          setActiveSection(sectionId);
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <nav className="navbar" style={{ background: isScrolled ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.9)' }}>
      <div className="nav-container">
        <Link href="#" className="nav-logo" onClick={closeMobileMenu}>
          <span className="logo-text">Abinish</span><span className="logo-accent">.dev</span>
        </Link>
        <ul className={`nav-links ${isMobileMenuOpen ? 'active' : ''}`}>
          <li><Link href="#about" className={activeSection === 'about' ? 'active' : ''} onClick={closeMobileMenu}>About</Link></li>
          <li><Link href="#skills" className={activeSection === 'skills' ? 'active' : ''} onClick={closeMobileMenu}>Skills</Link></li>
          <li><Link href="#projects" className={activeSection === 'projects' ? 'active' : ''} onClick={closeMobileMenu}>Projects</Link></li>
          <li><Link href="#experience" className={activeSection === 'experience' ? 'active' : ''} onClick={closeMobileMenu}>Experience</Link></li>
          <li><Link href="#contact" className={activeSection === 'contact' ? 'active' : ''} onClick={closeMobileMenu}>Contact</Link></li>
        </ul>
        <div className={`nav-actions ${isMobileMenuOpen ? 'active' : ''}`}>
          <a href="/Abinish_Jha.pdf" download className="btn btn-outline" onClick={closeMobileMenu}>
            <i className="fas fa-download"></i> Resume
          </a>
          <Link href="#contact" className="btn btn-primary" onClick={closeMobileMenu}>Hire Me</Link>
        </div>
        <button className={`mobile-menu-btn ${isMobileMenuOpen ? 'active' : ''}`} aria-label="Toggle menu" onClick={toggleMobileMenu}>
          <span style={isMobileMenuOpen ? { transform: 'rotate(45deg) translate(5px, 5px)' } : {}}></span>
          <span style={isMobileMenuOpen ? { opacity: '0' } : {}}></span>
          <span style={isMobileMenuOpen ? { transform: 'rotate(-45deg) translate(5px, -5px)' } : {}}></span>
        </button>
      </div>
    </nav>
  );
}
