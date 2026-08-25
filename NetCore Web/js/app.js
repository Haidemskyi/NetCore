/**
 * NetCore LLC - Interactive Application Logic
 * Subcontractor & Prime Infrastructure Platform
 */

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initAnimatedCounters();
  initCoverageMap();
  initFaqAccordion();
  initCareersModal();
  initMobileNav();
  initContactForm();
});

/* 1. Dark/Light Theme Toggle */
function initThemeToggle() {
  const toggleBtn = document.getElementById('themeToggle');
  const savedTheme = localStorage.getItem('netcore_theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  const currentTheme = savedTheme || (prefersDark ? 'dark' : 'light');
  if (currentTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    updateThemeIcon(true);
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const newTheme = isDark ? 'light' : 'dark';
      
      if (newTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
      
      localStorage.setItem('netcore_theme', newTheme);
      updateThemeIcon(!isDark);
    });
  }

  function updateThemeIcon(isDark) {
    if (!toggleBtn) return;
    if (isDark) {
      toggleBtn.innerHTML = `<svg class="theme-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
      toggleBtn.setAttribute('title', 'Switch to Light Mode');
    } else {
      toggleBtn.innerHTML = `<svg class="theme-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
      toggleBtn.setAttribute('title', 'Switch to Dark Mode');
    }
  }
}

/* 2. Animated Counter Scroll Effect */
function initAnimatedCounters() {
  const counterElements = document.querySelectorAll('[data-counter]');
  if (!counterElements.length) return;

  let animated = false;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !animated) {
        animated = true;
        counterElements.forEach(el => animateSingleCounter(el));
      }
    });
  }, { threshold: 0.3 });

  const metricsSection = document.querySelector('.metrics-section');
  if (metricsSection) observer.observe(metricsSection);

  function animateSingleCounter(el) {
    const target = parseFloat(el.getAttribute('data-counter'));
    const suffix = el.getAttribute('data-suffix') || '';
    const decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    const duration = 1800; // ms
    const startTime = performance.now();

    function updateCounter(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentVal = easeProgress * target;

      if (decimals > 0) {
        el.textContent = currentVal.toFixed(decimals) + suffix;
      } else {
        el.textContent = Math.floor(currentVal).toLocaleString('en-US') + suffix;
      }

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        if (decimals > 0) {
          el.textContent = target.toFixed(decimals) + suffix;
        } else {
          el.textContent = target.toLocaleString('en-US') + suffix;
        }
      }
    }

    requestAnimationFrame(updateCounter);
  }
}

/* 3. Interactive Coverage Map */
function initCoverageMap() {
  const filterBtns = document.querySelectorAll('.map-filter-btn');
  const pins = document.querySelectorAll('.map-pin-group');
  const infoTitle = document.getElementById('mapInfoTitle');
  const infoDesc = document.getElementById('mapInfoDesc');
  const infoSpecs = document.getElementById('mapInfoSpecs');

  if (!pins.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');
      pins.forEach(pin => {
        const pinType = pin.getAttribute('data-type');
        if (filter === 'all' || pinType === filter) {
          pin.style.display = '';
          pin.style.opacity = '1';
        } else {
          pin.style.display = 'none';
          pin.style.opacity = '0';
        }
      });
    });
  });

  pins.forEach(pin => {
    function activatePin() {
      const title = pin.getAttribute('data-title');
      const region = pin.getAttribute('data-region');
      const desc = pin.getAttribute('data-desc');
      const specs = pin.getAttribute('data-specs');

      if (infoTitle) infoTitle.textContent = `${title} (${region})`;
      if (infoDesc) infoDesc.textContent = desc;
      if (infoSpecs) infoSpecs.textContent = specs;
    }

    pin.addEventListener('mouseenter', activatePin);
    pin.addEventListener('click', activatePin);
  });

  const stateNames = {
    HI: 'Hawaii', AK: 'Alaska', FL: 'Florida', NH: 'New Hampshire', MI: 'Michigan',
    VT: 'Vermont', ME: 'Maine', RI: 'Rhode Island', NY: 'New York', PA: 'Pennsylvania',
    NJ: 'New Jersey', DE: 'Delaware', MD: 'Maryland', VA: 'Virginia', WV: 'West Virginia',
    OH: 'Ohio', IN: 'Indiana', IL: 'Illinois', CT: 'Connecticut', WI: 'Wisconsin',
    NC: 'North Carolina', MA: 'Massachusetts', TN: 'Tennessee', AR: 'Arkansas',
    MO: 'Missouri', GA: 'Georgia', SC: 'South Carolina', KY: 'Kentucky', AL: 'Alabama',
    LA: 'Louisiana', MS: 'Mississippi', IA: 'Iowa', MN: 'Minnesota', OK: 'Oklahoma',
    TX: 'Texas', NM: 'New Mexico', KS: 'Kansas', NE: 'Nebraska', SD: 'South Dakota',
    ND: 'North Dakota', WY: 'Wyoming', MT: 'Montana', CO: 'Colorado', ID: 'Idaho',
    UT: 'Utah', AZ: 'Arizona', NV: 'Nevada', OR: 'Oregon', WA: 'Washington', CA: 'California'
  };

  const statePositions = {
    MI: 'Cable Technician',
    OH: 'Cable Technician',
    NC: 'Cable Technician',
    TN: 'Cable Technician',
    PA: 'Cable Technician',
    MT: 'Bury Technician'
  };

  const statePaths = document.querySelectorAll('.state-path');
  statePaths.forEach(path => {
    function activateState() {
      const stateCode = path.getAttribute('data-state');
      const fullStateName = stateNames[stateCode] || stateCode;
      const openJob = statePositions[stateCode];

      if (infoTitle) infoTitle.textContent = `${fullStateName} (${stateCode})`;
      if (infoDesc) infoDesc.textContent = `Ready to accept prime contractor & ISP subcontracting work packages in ${fullStateName}.`;
      if (infoSpecs) infoSpecs.textContent = openJob 
        ? `Ready for Contracts | Open Position: ${openJob}` 
        : `Ready for Subcontracting Contracts`;
    }

    path.addEventListener('mouseenter', activateState);
    path.addEventListener('click', activateState);
  });
}

/* 4. FAQ Accordion Toggle */
function initFaqAccordion() {
  const faqQuestions = document.querySelectorAll('.faq-question');

  faqQuestions.forEach(question => {
    question.addEventListener('click', () => {
      const parentItem = question.closest('.faq-item');
      if (!parentItem) return;

      const isActive = parentItem.classList.contains('active');

      // Close all active items
      document.querySelectorAll('.faq-item.active').forEach(item => {
        if (item !== parentItem) item.classList.remove('active');
      });

      // Toggle current
      if (isActive) {
        parentItem.classList.remove('active');
      } else {
        parentItem.classList.add('active');
      }
    });
  });
}

/* 5. Careers Application Modal */
function initCareersModal() {
  const applyBtns = document.querySelectorAll('.apply-job-btn');
  const modal = document.getElementById('careerModal');
  const modalClose = document.getElementById('careerModalCloseCross');
  const jobTitleDisplay = document.getElementById('careerJobTitle');
  const form = document.getElementById('careerForm');

  applyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const job = btn.getAttribute('data-job') || 'Field Technician';
      if (jobTitleDisplay) jobTitleDisplay.textContent = job;
      if (modal) {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  function closeCareerModal() {
    if (modal) {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  if (modalClose) modalClose.addEventListener('click', closeCareerModal);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeCareerModal();
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      closeCareerModal();
      
      const nameInput = form.querySelector('[name="name"]');
      const emailInput = form.querySelector('[name="email"]');
      const phoneInput = form.querySelector('[name="phone"]');
      const notesInput = form.querySelector('[name="notes"]') || form.querySelector('[name="message"]');

      const name = nameInput ? nameInput.value.trim() : 'Applicant';
      const email = emailInput ? emailInput.value.trim() : 'applicant@netcoretelecom.com';
      const phone = phoneInput ? phoneInput.value.trim() : '';
      const notes = notesInput ? notesInput.value.trim() : '';
      const job = jobTitleDisplay ? jobTitleDisplay.textContent : 'Field Technician';

      try {
        await fetch('https://crm.netcoretelecom.com/api/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name || 'Applicant',
            email: email || 'applicant@netcoretelecom.com',
            phone: phone || null,
            subject: `Job Application: ${job}`,
            message: `Position Applied: ${job}\n\nApplicant Details:\nPhone: ${phone || 'N/A'}\nMessage/Experience:\n${notes || 'N/A'}`,
            category: 'JOB_APPLICATION',
            sourceUrl: window.location.href,
          }),
        });
      } catch (err) {
        console.error('Career form submit error:', err);
      }

      form.reset();

      // Trigger main success modal
      const successModal = document.getElementById('successModal');
      const refDisplay = document.getElementById('refDisplay');
      if (refDisplay) {
        refDisplay.textContent = `APP-${Math.floor(100000 + Math.random() * 900000)}`;
      }
      if (successModal) {
        successModal.classList.add('open');
        document.body.style.overflow = 'hidden';
      }
    });
  }
}

/* 6. Mobile Navigation Drawer */
function initMobileNav() {
  const toggle = document.getElementById('mobileToggle');
  const nav = document.getElementById('mobileNav');
  const links = document.querySelectorAll('.mobile-nav a');

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.contains('open');
      if (isOpen) {
        nav.classList.remove('open');
        toggle.classList.remove('active');
        document.body.style.overflow = '';
      } else {
        nav.classList.add('open');
        toggle.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });

    links.forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('open');
        toggle.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }
}

/* 7. Contact Form Handler */
function initContactForm() {
  const form = document.getElementById('contactForm');
  const modal = document.getElementById('successModal');
  const modalClose = document.getElementById('modalCloseBtn');
  const modalCloseCross = document.getElementById('modalCloseCross');
  const refDisplay = document.getElementById('refDisplay');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = form.querySelector('[name="name"]')?.value.trim();
      const email = form.querySelector('[name="email"]')?.value.trim();
      const phone = form.querySelector('[name="phone"]')?.value.trim();
      const service = form.querySelector('[name="service"]')?.value.trim();
      const message = form.querySelector('[name="message"]')?.value.trim();

      if (!name || !email || !message) return;

      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
      }

      try {
        await fetch('https://crm.netcoretelecom.com/api/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            email,
            phone: phone || null,
            subject: service ? `Service Needed: ${service}` : 'Website Inquiry',
            message: `Service Requested: ${service || 'General'}\n\nMessage Body:\n${message}`,
            category: 'CONTACT_FORM',
            sourceUrl: window.location.href,
          }),
        });
      } catch (err) {
        console.error('API ticket submit error:', err);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send Message';
        }
      }

      const randomRef = Math.floor(100000 + Math.random() * 900000);
      if (refDisplay) {
        refDisplay.textContent = `REF-${randomRef}`;
      }

      if (modal) {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
      }

      form.reset();
    });
  }

  function closeModal() {
    if (modal) {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modalCloseCross) modalCloseCross.addEventListener('click', closeModal);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }
}
