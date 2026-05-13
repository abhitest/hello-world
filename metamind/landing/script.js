/* ═══════════════════════════════════════════════════════════
   MetaMind AI — Landing Page Interactions
   ═══════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  // ─── Navigation Scroll Effect ────────────────────────────
  const nav = document.getElementById("nav");

  function handleNavScroll() {
    if (window.scrollY > 40) {
      nav.classList.add("nav--scrolled");
    } else {
      nav.classList.remove("nav--scrolled");
    }
  }

  window.addEventListener("scroll", handleNavScroll, { passive: true });
  handleNavScroll(); // Run on load in case page is already scrolled

  // ─── Mobile Navigation Toggle ────────────────────────────
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");

  navToggle.addEventListener("click", function () {
    navLinks.classList.toggle("nav__links--open");
    // Animate hamburger to X
    navToggle.classList.toggle("nav__toggle--active");
  });

  // Close mobile nav when a link is clicked
  navLinks.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      navLinks.classList.remove("nav__links--open");
      navToggle.classList.remove("nav__toggle--active");
    });
  });

  // ─── FAQ Accordion ───────────────────────────────────────
  const faqItems = document.querySelectorAll(".faq__item");

  faqItems.forEach(function (item) {
    const question = item.querySelector(".faq__question");

    question.addEventListener("click", function () {
      const isActive = item.classList.contains("faq__item--active");

      // Close all other items
      faqItems.forEach(function (other) {
        other.classList.remove("faq__item--active");
      });

      // Toggle clicked item
      if (!isActive) {
        item.classList.add("faq__item--active");
      }
    });
  });

  // ─── Smooth Scroll for Anchor Links ──────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener("click", function (e) {
      const targetId = this.getAttribute("href");
      if (targetId === "#") return;

      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();

      const navHeight = nav.offsetHeight;
      const targetPosition =
        target.getBoundingClientRect().top + window.scrollY - navHeight - 20;

      window.scrollTo({
        top: targetPosition,
        behavior: "smooth",
      });
    });
  });

  // ─── Scroll-based Fade-in Animation ─────────────────────
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -60px 0px",
  };

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("fade-in--visible");
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe elements for fade-in
  const fadeElements = document.querySelectorAll(
    ".problem__card, .feature-card, .step, .pricing-card, .testimonial, .faq__item"
  );

  fadeElements.forEach(function (el) {
    el.classList.add("fade-in");
    observer.observe(el);
  });

  // ─── Add fade-in CSS dynamically ────────────────────────
  const style = document.createElement("style");
  style.textContent = `
    .fade-in {
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 0.5s ease, transform 0.5s ease;
    }
    .fade-in--visible {
      opacity: 1;
      transform: translateY(0);
    }
    .nav__toggle--active span:nth-child(1) {
      transform: rotate(45deg) translate(5px, 5px);
    }
    .nav__toggle--active span:nth-child(2) {
      opacity: 0;
    }
    .nav__toggle--active span:nth-child(3) {
      transform: rotate(-45deg) translate(5px, -5px);
    }
  `;
  document.head.appendChild(style);
})();
