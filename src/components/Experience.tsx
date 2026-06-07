export default function Experience() {
  return (
    <section className="experience" id="experience">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Career Journey</span>
          <h2 className="section-title">Experience & Education</h2>
        </div>
        <div className="timeline">
          <div className="timeline-item">
            <div className="timeline-marker current">
              <i className="fas fa-brain"></i>
            </div>
            <div className="timeline-content">
              <div className="timeline-badge">Current</div>
              <h3>Senior Analyst (AI Developer)</h3>
              <span className="timeline-company">HCL Tech</span>
              <span className="timeline-date">April 2026 - Present</span>
              <p>
                Developing and deploying enterprise-grade AI solutions, focusing on Autonomous AI Agents and robust RAG (Retrieval-Augmented Generation) architectures to automate business workflows.
              </p>
              <div className="timeline-highlights">
                <span><i className="fas fa-check"></i> Autonomous AI Agents</span>
                <span><i className="fas fa-check"></i> Enterprise RAG Systems</span>
                <span><i className="fas fa-check"></i> LLM Orchestration</span>
              </div>
            </div>
          </div>
          <div className="timeline-item">
            <div className="timeline-marker">
              <i className="fas fa-laptop-code"></i>
            </div>
            <div className="timeline-content">
              <h3>Independent Web & AI Developer</h3>
              <span className="timeline-date">September 2024 - Present</span>
              <p>
                Building custom web applications, AI-powered solutions, and EdTech platforms for clients worldwide.
                Specializing in modern tech stacks and delivering end-to-end solutions.
              </p>
              <div className="timeline-highlights">
                <span><i className="fas fa-check"></i> RAG-based Q&A Systems</span>
                <span><i className="fas fa-check"></i> Full Stack Applications</span>
                <span><i className="fas fa-check"></i> EdTech Platforms</span>
              </div>
            </div>
          </div>
          <div className="timeline-item">
            <div className="timeline-marker">
              <i className="fas fa-microchip"></i>
            </div>
            <div className="timeline-content">
              <h3>Embedded Systems Engineer</h3>
              <span className="timeline-company">Wipro</span>
              <span className="timeline-date">February 2022 - September 2024 (2.7 Years)</span>
              <p>
                Developed and optimized embedded firmware in C++ for enterprise printer systems.
                Applied multithreading and performance optimization for production deployments.
              </p>
              <div className="timeline-highlights">
                <span><i className="fas fa-check"></i> C++ Firmware Development</span>
                <span><i className="fas fa-check"></i> Performance Optimization</span>
                <span><i className="fas fa-check"></i> Production Deployments</span>
              </div>
            </div>
          </div>
          <div className="timeline-item">
            <div className="timeline-marker">
              <i className="fas fa-graduation-cap"></i>
            </div>
            <div className="timeline-content">
              <h3>B.Tech in Computer Science</h3>
              <span className="timeline-company">Vel Tech University</span>
              <span className="timeline-date">2017 - 2021 • CGPA: 7.86</span>
              <p>
                Specialized in Computer Science and Engineering with focus on algorithms,
                data structures, and software development.
              </p>
            </div>
          </div>
        </div>

        <div className="certifications">
          <h3 className="certs-title">Certifications</h3>
          <div className="certs-grid">
            <div className="cert-card">
              <div className="cert-icon">
                <i className="fab fa-microsoft"></i>
              </div>
              <div className="cert-info">
                <h4>Azure Fundamentals</h4>
                <span>AZ-900</span>
              </div>
            </div>
            <div className="cert-card">
              <div className="cert-icon">
                <i className="fas fa-code"></i>
              </div>
              <div className="cert-info">
                <h4>C++ Certification</h4>
                <span>Level 1</span>
              </div>
            </div>
            <div className="cert-card">
              <div className="cert-icon">
                <i className="fas fa-infinity"></i>
              </div>
              <div className="cert-info">
                <h4>DevOps</h4>
                <span>Certification</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
