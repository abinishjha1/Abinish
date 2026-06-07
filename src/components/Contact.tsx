/* eslint-disable */
'use client';

export default function Contact() {
  return (
    <section className="contact" id="contact">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Get In Touch</span>
          <h2 className="section-title">Let's Work Together</h2>
        </div>
        <div className="contact-content">
          <div className="contact-info">
            <p className="contact-intro">
              Have a project in mind? I'd love to hear about it. Whether you need a custom web application,
              AI integration, or a complete digital solution, I'm here to help bring your vision to life.
            </p>
            <div className="contact-methods">
              <a href="mailto:abinishjha@gmail.com" className="contact-method">
                <div className="method-icon">
                  <i className="fas fa-envelope"></i>
                </div>
                <div className="method-info">
                  <span className="method-label">Email Me</span>
                  <span className="method-value">abinishjha@gmail.com</span>
                </div>
              </a>
              {/* Phone number removed for privacy and spam protection */}
              <a href="https://www.linkedin.com/in/abinish-jha-2a0894192/" target="_blank" rel="noopener noreferrer" className="contact-method">
                <div className="method-icon">
                  <i className="fab fa-linkedin"></i>
                </div>
                <div className="method-info">
                  <span className="method-label">Connect on LinkedIn</span>
                  <span className="method-value">Abinish Jha</span>
                </div>
              </a>
            </div>
            <div className="contact-socials">
              <a href="https://github.com/abinishjha1" target="_blank" rel="noopener noreferrer" className="social-btn">
                <i className="fab fa-github"></i>
                <span>GitHub</span>
              </a>
              <a href="https://www.linkedin.com/in/abinish-jha-2a0894192/" target="_blank" rel="noopener noreferrer" className="social-btn">
                <i className="fab fa-linkedin-in"></i>
                <span>LinkedIn</span>
              </a>
              <a href="/Abinish_Jha.pdf" download className="social-btn">
                <i className="fas fa-file-alt"></i>
                <span>Resume</span>
              </a>
            </div>
          </div>
          <div className="contact-cta">
            <div className="cta-card">
              <div className="cta-icon">
                <i className="fas fa-handshake"></i>
              </div>
              <h3>Ready to Start?</h3>
              <p>Let's discuss your project and see how I can help you achieve your goals.</p>
              <a href="mailto:abinishjha@gmail.com?subject=Project%20Inquiry&body=Hi%20Abinish,%0A%0AI'd%20like%20to%20discuss%20a%20project%20with%20you.%0A%0AProject%20Details:%0A" className="btn btn-primary btn-lg">
                <i className="fas fa-paper-plane"></i> Send Message
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
