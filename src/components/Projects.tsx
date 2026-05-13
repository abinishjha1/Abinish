'use client';

import { useState, useEffect } from 'react';

export default function Projects() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const projects = [
    {
      title: "Spy Chat Terminal",
      desc: "Secure real-time chat application.",
      tags: ["Real-time", "Security"],
      tech: ["React", "WebSockets", "Web Crypto API"],
      link: "https://dhurandhars.vercel.app/",
      github: "https://github.com/abinishjha1/love-flux",
      icon: "fas fa-comments",
      gradient: "gradient-pink"
    },
    {
      title: "PDF Scanner",
      desc: "QR-based mobile document scanner with real-time sync to desktop.",
      tags: ["Utility", "Mobile-First"],
      tech: ["Next.js", "Supabase Realtime", "QR Code"],
      link: "https://pdf-scanner-xi.vercel.app",
      github: "https://github.com/abinishjha1/PDF-Scanner",
      icon: "fas fa-file-pdf",
      gradient: "gradient-green"
    },
    {
      title: "RAG Q&A System",
      desc: "AI-powered Q&A application with PDF document upload.",
      tags: ["AI/ML", "GenAI"],
      tech: ["Python", "LangChain", "ChromaDB", "Gradio"],
      link: "https://huggingface.co/spaces/abinish/RAG",
      github: null,
      icon: "fas fa-robot",
      gradient: "gradient-orange"
    },
    {
      title: "ERP System",
      desc: "Complete Employee & Finance Management system with role-based access.",
      tags: ["Enterprise", "SaaS"],
      tech: ["Next.js", "MongoDB", "Auth.js"],
      link: "https://erp-beige-gamma.vercel.app",
      github: "https://github.com/abinishjha1/Erp",
      icon: "fas fa-building",
      gradient: "gradient-cyan"
    },
    {
      title: "ShopPremium",
      desc: "Premium E-commerce platform for electronics and modern lifestyle products.",
      tags: ["E-commerce", "Full Stack"],
      tech: ["Next.js", "MongoDB", "Tailwind CSS", "Redux"],
      link: "https://e-commerce-8icl.vercel.app",
      github: "https://github.com/abinishjha1/premium-ecommerce",
      icon: "fas fa-shopping-bag",
      gradient: "gradient-cyan"
    },
    {
      title: "Loan Eligibility Portal",
      desc: "Production-ready loan pre-screening portal with real-time database connectivity and dynamic dashboard metrics.",
      tags: ["Finance", "Dashboard"],
      tech: ["Next.js", "Supabase", "Tailwind CSS"],
      link: "https://loan-eligibility-seven.vercel.app/leads",
      github: null,
      icon: "fas fa-money-check-alt",
      gradient: "gradient-green"
    }
  ];

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>, card: HTMLElement) => {
    if (isMobile) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 20;
    const rotateY = (centerX - x) / 20;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
  };

  const handleMouseLeave = (card: HTMLElement) => {
    if (isMobile) return;
    card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
  };

  return (
    <section className="projects" id="projects">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Featured Work</span>
          <h2 className="section-title">Projects I've Built</h2>
        </div>
        <div className="projects-grid">
          {projects.map((project, index) => (
            <article 
              className="project-card" 
              key={index}
              onMouseMove={(e) => handleMouseMove(e, e.currentTarget)}
              onMouseLeave={(e) => handleMouseLeave(e.currentTarget)}
            >
              <div className="project-image">
                <div className="project-overlay">
                  <a href={project.link} target="_blank" rel="noopener noreferrer" className="project-link">
                    <i className="fas fa-external-link-alt"></i>
                  </a>
                  {project.github && (
                    <a href={project.github} target="_blank" rel="noopener noreferrer" className="project-link">
                      <i className="fab fa-github"></i>
                    </a>
                  )}
                </div>
                <div className={`project-placeholder ${project.gradient}`}>
                  <i className={project.icon}></i>
                </div>
              </div>
              <div className="project-content">
                <div className="project-tags">
                  {project.tags.map((tag, i) => (
                    <span className="tag" key={i}>{tag}</span>
                  ))}
                </div>
                <h3 className="project-title">{project.title}</h3>
                <p className="project-description">{project.desc}</p>
                <div className="project-tech">
                  {project.tech.map((tech, i) => (
                    <span key={i}>{tech}</span>
                  ))}
                </div>
                <a href={project.link} target="_blank" rel="noopener noreferrer" className="project-cta">
                  Try It Out <i className="fas fa-arrow-right"></i>
                </a>
              </div>
            </article>
          ))}
        </div>
        <div className="projects-footer">
          <a href="https://github.com/abinishjha1?tab=repositories" target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-lg">
            <i className="fab fa-github"></i> View All Repositories
          </a>
        </div>
      </div>
    </section>
  );
}
