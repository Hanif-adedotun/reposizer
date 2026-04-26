import "./styles.css";
import { createIcons, ShieldCheck, Workflow, Zap } from "lucide";

const year = new Date().getFullYear();
const footer = document.createElement("footer");
footer.className = "footer";
footer.innerHTML = `<p>reposizer · made with 💙 by <a href="https://github.com/hanif-adedotun">Hanif Adedotun</a> · ${year}</p>`;

const page = document.querySelector(".page");
if (page) {
  page.appendChild(footer);
}

const reveals = document.querySelectorAll(".reveal");
const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
      }
    }
  },
  {
    threshold: 0.18
  }
);

for (const node of reveals) {
  observer.observe(node);
}

const staggerNodes = document.querySelectorAll(".rise");
staggerNodes.forEach((node, index) => {
  node.style.setProperty("--delay", `${index * 90}ms`);
});

createIcons({
  icons: {
    Zap,
    Workflow,
    ShieldCheck
  },
  attrs: {
    width: "18",
    height: "18",
    strokeWidth: "2"
  }
});

const topbar = document.querySelector(".topbar");
const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector("#site-nav");

if (topbar && menuToggle && siteNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = topbar.classList.toggle("menu-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      topbar.classList.remove("menu-open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}
