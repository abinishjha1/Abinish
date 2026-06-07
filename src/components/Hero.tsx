/* eslint-disable */
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function Hero() {
  const roles = [
    'Full Stack Web & AI Developer',
    'EdTech Platform Builder',
    'React & Next.js Expert'
  ];
  const [currentRole, setCurrentRole] = useState('');
  const [roleIndex, setRoleIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const fullRole = roles[roleIndex];

    const typeText = () => {
      if (!isDeleting && currentRole === fullRole) {
        timeout = setTimeout(() => setIsDeleting(true), 1500);
      } else if (isDeleting && currentRole === '') {
        setIsDeleting(false);
        setRoleIndex((prev) => (prev + 1) % roles.length);
      } else {
        const nextStr = isDeleting
          ? fullRole.substring(0, currentRole.length - 1)
          : fullRole.substring(0, currentRole.length + 1);
        setCurrentRole(nextStr);
        timeout = setTimeout(typeText, isDeleting ? 50 : 80);
      }
    };

    timeout = setTimeout(typeText, 100);
    return () => clearTimeout(timeout);
  }, [currentRole, isDeleting, roleIndex, roles]);

  return (
    <section className="hero" id="hero">
      <div className="hero-bg"></div>
      <div className="hero-container">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot"></span>
            Actively Seeking Full-Time Opportunities
          </div>
          <h1 className="hero-title">
            <span className="greeting">Hi, I'm</span>
            <span className="name">Abinish Jha</span>
          </h1>
          <h2 className="hero-subtitle">
            <span className="typing-text">{currentRole}<span className="cursor-blink">|</span></span>
          </h2>
          <p className="hero-description">
            I build modern, scalable web applications with expertise in AI integration,
            real-time systems, and beautiful user experiences. Let's bring your ideas to life.
          </p>
          <div className="hero-cta">
            <Link href="#projects" className="btn btn-primary btn-lg">
              <i className="fas fa-rocket"></i> View My Work
            </Link>
            <Link href="#contact" className="btn btn-glass btn-lg">
              <i className="fas fa-envelope"></i> Get In Touch
            </Link>
          </div>
          <div className="hero-socials">
            <a href="https://github.com/abinishjha1" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="GitHub">
              <i className="fab fa-github"></i>
            </a>
            <a href="https://www.linkedin.com/in/abinish-jha-2a0894192/" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="LinkedIn">
              <i className="fab fa-linkedin-in"></i>
            </a>
            <a href="mailto:abinishjha@gmail.com" className="social-link" aria-label="Email">
              <i className="fas fa-envelope"></i>
            </a>
          </div>
        </div>
        <div className="hero-image">
          <div className="image-wrapper">
            <div className="image-glow"></div>
            <Image 
              src="/profile-optimized.jpg" 
              alt="Abinish Jha" 
              width={400} 
              height={400} 
              className="profile-img"
              priority
            />
            <div className="floating-badge badge-1"><i className="fas fa-code"></i></div>
            <div className="floating-badge badge-2"><i className="fas fa-brain"></i></div>
            <div className="floating-badge badge-3"><i className="fas fa-rocket"></i></div>
          </div>
        </div>
      </div>
      <div className="scroll-indicator">
        <div className="mouse">
          <div className="wheel"></div>
        </div>
        <span>Scroll Down</span>
      </div>
    </section>
  );
}
