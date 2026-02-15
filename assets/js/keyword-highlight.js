/**
 * Auto-highlight DevOps / Platform-Engineering keywords inside .bullets li.
 * Keywords light up with the section accent color when scrolled into view.
 * No manual <mark> tags needed — this script wraps them automatically.
 */
(() => {
  // ---- Keyword dictionary (case-insensitive matching) ----
  // Longest phrases first so "GitHub Actions" matches before "GitHub".
  const KEYWORDS = [
    // Compliance & Security
    "SOC 2 Type 1", "SOC 2 Type 2", "SOC 2", "ISO27001", "ISO 27001", "27701",
    "Vulnerability Assessment and Penetration Testing", "VAPT",
    "Red Teaming", "Purple Team", "SACON",
    "phishing simulation", "adversary emulation",
    "security best practices", "security testing", "security assessments",
    "WAF rules", "RBAC", "IAM",
    "principle of least privilege",

    // Cloud Providers
    "AWS Lightsail", "AWS", "Azure", "GCP", "DigitalOcean",

    // FinOps
    "FinOps and Cost Optimization", "FinOps & Cost Optimization",
    "FinOps", "Cost Optimization",
    "60% reduction", "cloud infrastructure costs",
    "autoscaling", "budget enforcement",

    // Kubernetes & Containers
    "Kubernetes clusters", "Kubernetes", "Private GKE clusters",
    "GKE", "350+ microservices", "microservices",
    "Docker", "containers", "Citrix Xenservers",
    "Helm", "kustomize",

    // IaC & CI/CD
    "Terraform Infrastructure-as-Code", "Terraform templates",
    "Terraform", "Infrastructure-as-Code", "IaC",
    "GitHub Actions", "Jenkins", "GitLab CI/CD", "CI/CD pipelines", "CI/CD",
    "zero-downtime", "zero to minimal downtime",
    "deployment speeds by 80%",

    // Observability & Monitoring
    "Grafana", "Stackdriver", "ELK stack", "APM tools",
    "Thanos", "observability", "Prometheus",
    "alerting", "monitoring", "metric collection",
    "SLA at 99.9%",

    // Scripting & Languages
    "Python", "Shell", "shell scripts",
    "automation suite", "automation suites",

    // DR & Infra
    "Disaster Recovery", "disaster recovery",
    "Mean Time to Recovery", "MTTR",
    "cross-cloud migrations",
    "production environments",
    "GPU-based cloud instances",

    // Security Tools
    "SonarQube", "Bandit", "Nessus",
    "pentesting tools",

    // DevOps Practices
    "DevSecOps", "DevOps", "SDLC",
    "Disaster Recovery (DR)",

    // Databases & Data
    "Neo4j", "database scaling",

    // AI/ML
    "LangChain", "Ollama", "LLM",
    "AI/ML workloads",

    // Networking & Web
    "Nginx", "Camunda BPM",
    "custom networking",
    "network security",

    // Backup
    "Backup Exec", "cloud backup solutions", "backup solutions",
    "Cloud Storage", "CASB",

    // General impact words
    "Opensource", "architecture", "Open Source", "AR/VR",  "Open-Source", "opensource",
  ];

  // Build a single regex — escape special chars, sort by length descending
  const escaped = KEYWORDS
    .slice()
    .sort((a, b) => b.length - a.length)
    .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  const regex = new RegExp("(" + escaped.join("|") + ")", "gi");

  function highlightNode(textNode) {
    const text = textNode.nodeValue;
    if (!regex.test(text)) return;
    regex.lastIndex = 0; // reset after test

    const frag = document.createDocumentFragment();
    let lastIndex = 0;
    let match;

    regex.lastIndex = 0;
    while ((match = regex.exec(text)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        frag.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
      }
      // Wrap keyword
      const mark = document.createElement("mark");
      mark.className = "kw";
      mark.textContent = match[0];
      frag.appendChild(mark);
      lastIndex = regex.lastIndex;
    }

    // Remaining text
    if (lastIndex < text.length) {
      frag.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    textNode.parentNode.replaceChild(frag, textNode);
  }

  function walkTextNodes(el) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    // Process in reverse so replacements don't invalidate the walker
    for (let i = nodes.length - 1; i >= 0; i--) {
      highlightNode(nodes[i]);
    }
  }

  function init() {
    const bullets = document.querySelectorAll(".bullets li");
    bullets.forEach((li) => walkTextNodes(li));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
