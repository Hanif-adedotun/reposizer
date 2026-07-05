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

const jiggleCards = document.querySelectorAll("[data-jiggle]");

for (const card of jiggleCards) {
  card.setAttribute("data-jiggle-idle", "");

  const maxTilt = card.classList.contains("terminal") ? 4 : 7;
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let rafId = 0;

  const applyTransform = () => {
    currentX += (targetX - currentX) * 0.14;
    currentY += (targetY - currentY) * 0.14;

    card.style.transform = `perspective(900px) rotateX(${currentY}deg) rotateY(${currentX}deg)`;

    if (
      Math.abs(targetX - currentX) > 0.02 ||
      Math.abs(targetY - currentY) > 0.02 ||
      card.classList.contains("is-hovering")
    ) {
      rafId = requestAnimationFrame(applyTransform);
    } else {
      rafId = 0;
    }
  };

  const startLoop = () => {
    if (!rafId) {
      rafId = requestAnimationFrame(applyTransform);
    }
  };

  card.addEventListener("pointerenter", () => {
    card.classList.add("is-hovering");
    card.removeAttribute("data-jiggle-idle");
    startLoop();
  });

  card.addEventListener("pointermove", (event) => {
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    targetX = x * maxTilt;
    targetY = -y * maxTilt;
    startLoop();
  });

  card.addEventListener("pointerleave", () => {
    card.classList.remove("is-hovering");
    targetX = 0;
    targetY = 0;
    startLoop();
    window.setTimeout(() => {
      if (!card.classList.contains("is-hovering")) {
        card.setAttribute("data-jiggle-idle", "");
      }
    }, 420);
  });
}
