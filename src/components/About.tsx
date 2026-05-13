'use client';

import { useEffect, useRef, useState } from 'react';

export default function About() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section className="about" id="about" ref={sectionRef}>
      <div className="container">
        <div className="section-header">
          <span className="section-tag">About Me</span>
          <h2 className="section-title">Turning Ideas Into Reality</h2>
        </div>
        <div className="about-content">
          <div className="about-text">
            <p className="lead">
              I'm a passionate Full Stack Web Developer with <strong>3+ years</strong> of industry experience,
              specializing in building modern web applications that solve real-world problems.
            </p>
            <p>
              With a background in Embedded Systems at <strong>Wipro</strong> and hands-on experience in
              AI/ML integration, I bring a unique perspective to web development. I love creating
              applications that are not just functional, but also delightful to use. Also known by clients and colleagues as <strong>Abi</strong> or <strong>Abhi</strong>.
            </p>
            <p>
              Currently, I'm focused on building EdTech platforms, AI-powered applications, and
              helping businesses establish their digital presence through custom web solutions.
            </p>
          </div>
          <div className="about-stats">
            <StatCard icon="fas fa-briefcase" count={3} suffix="+" label="Years Experience" isVisible={isVisible} />
            <StatCard icon="fas fa-project-diagram" count={10} suffix="+" label="Projects Completed" isVisible={isVisible} />
            <StatCard icon="fas fa-certificate" count={3} suffix="" label="Certifications" isVisible={isVisible} />
            <StatCard icon="fas fa-users" count={5000} suffix="+" label="Happy Users" isVisible={isVisible} />
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({ icon, count, suffix, label, isVisible }: { icon: string, count: number, suffix: string, label: string, isVisible: boolean }) {
  const [currentCount, setCurrentCount] = useState(0);

  useEffect(() => {
    if (!isVisible) return;
    let start = 0;
    const duration = 2000;
    const increment = count / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= count) {
        setCurrentCount(count);
        clearInterval(timer);
      } else {
        setCurrentCount(Math.floor(start));
      }
    }, 16);
    
    return () => clearInterval(timer);
  }, [count, isVisible]);

  return (
    <div className="stat-card">
      <div className="stat-icon">
        <i className={icon}></i>
      </div>
      <div className="stat-info">
        <span className="stat-number">{currentCount.toLocaleString()}</span>
        <span className="stat-suffix">{suffix}</span>
        <span className="stat-label">{label}</span>
      </div>
    </div>
  );
}
