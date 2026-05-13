export default function Skills() {
  const skillCategories = [
    {
      title: "Frontend Development",
      icon: "fas fa-laptop-code",
      tags: ["HTML5", "CSS3", "JavaScript", "TypeScript", "React", "Next.js", "Tailwind CSS"]
    },
    {
      title: "Backend Development",
      icon: "fas fa-server",
      tags: ["Node.js", "Python", "REST APIs", "MongoDB", "Supabase", "PostgreSQL"]
    },
    {
      title: "AI & Machine Learning",
      icon: "fas fa-brain",
      tags: ["LangChain", "RAG Systems", "LLM Integration", "Vector Databases", "Embeddings", "Gradio"]
    },
    {
      title: "DevOps & Cloud",
      icon: "fas fa-cloud",
      tags: ["Docker", "Jenkins", "Git", "SonarQube", "Azure", "Vercel"]
    },
    {
      title: "AI-Powered Tools",
      icon: "fas fa-wand-magic-sparkles",
      tags: ["Cursor", "Loveable AI", "GitHub Copilot", "Replit", "Antigravity"]
    },
    {
      title: "Systems Programming",
      icon: "fas fa-microchip",
      tags: ["C++", "Embedded Systems", "Firmware", "Debugging", "Multithreading"]
    }
  ];

  return (
    <section className="skills" id="skills">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Skills & Expertise</span>
          <h2 className="section-title">Technologies I Work With</h2>
        </div>
        <div className="skills-grid">
          {skillCategories.map((category, index) => (
            <div className="skill-category" key={index}>
              <div className="category-header">
                <div className="category-icon">
                  <i className={category.icon}></i>
                </div>
                <h3>{category.title}</h3>
              </div>
              <div className="skill-tags">
                {category.tags.map((tag, tagIndex) => (
                  <span className="skill-tag" key={tagIndex}>{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
