document.addEventListener('DOMContentLoaded', () => {

  // =====================
  // 1. MOBILE NAV TOGGLE
  // =====================
  const navToggle = document.querySelector('.navbar__toggle');
  const navMenu = document.querySelector('#nav-menu, .nav-menu, .navbar__menu');

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!isExpanded));
      navMenu.classList.toggle('is-open');
      navToggle.classList.toggle('is-active');
      document.body.classList.toggle('nav-open');
    });

    // Close nav when a menu link is clicked
    const navLinks = navMenu.querySelectorAll('a');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navToggle.setAttribute('aria-expanded', 'false');
        navMenu.classList.remove('is-open');
        navToggle.classList.remove('is-active');
        document.body.classList.remove('nav-open');
      });
    });

    // Close nav on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navMenu.classList.contains('is-open')) {
        navToggle.setAttribute('aria-expanded', 'false');
        navMenu.classList.remove('is-open');
        navToggle.classList.remove('is-active');
        document.body.classList.remove('nav-open');
        navToggle.focus();
      }
    });

    // Close nav on outside click
    document.addEventListener('click', (e) => {
      if (
        navMenu.classList.contains('is-open') &&
        !navMenu.contains(e.target) &&
        !navToggle.contains(e.target)
      ) {
        navToggle.setAttribute('aria-expanded', 'false');
        navMenu.classList.remove('is-open');
        navToggle.classList.remove('is-active');
        document.body.classList.remove('nav-open');
      }
    });
  }

  // =====================
  // 2. FILTER BUTTONS / TABS
  // =====================
  const filterButtons = document.querySelectorAll('.filter-btn, [data-filter]');
  const filterableItems = document.querySelectorAll('.coffee-card, .product-card, .roast-card');

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const filterValue = btn.getAttribute('data-filter') || btn.getAttribute('data-category') || btn.textContent.trim().toLowerCase();

      // Update active state on buttons
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Filter items
      filterableItems.forEach(item => {
        const itemCategories = item.getAttribute('data-category') || item.getAttribute('data-roast') || '';
        const itemTags = item.getAttribute('data-tags') || '';
        const allCategories = [itemCategories, itemTags].join(',').toLowerCase();

        if (filterValue === 'all' || filterValue === '') {
          item.style.display = '';
          item.style.opacity = '1';
          item.style.transform = 'scale(1)';
        } else if (allCategories.includes(filterValue.toLowerCase())) {
          item.style.display = '';
          item.style.opacity = '1';
          item.style.transform = 'scale(1)';
        } else {
          item.style.opacity = '0';
          item.style.transform = 'scale(0.95)';
          setTimeout(() => {
            item.style.display = 'none';
          }, 200);
        }
      });
    });
  });

  // =====================
  // 3. CONTACT / INQUIRY FORM VALIDATION
  // =====================
  const contactForm = document.querySelector('#contact-form, .contact-form, #inquiry-form, .inquiry-form');

  if (contactForm) {
    const formFields = contactForm.querySelectorAll('input, textarea, select');

    // Real-time validation on blur and input
    formFields.forEach(field => {
      const fieldName = field.name || field.id || field.getAttribute('aria-label') || '';

      field.addEventListener('blur', () => validateField(field, fieldName));
      field.addEventListener('input', () => {
        if (field.classList.contains('is-invalid')) {
          validateField(field, fieldName);
        }
      });

      // Pre-validate fields with existing content (e.g., autofilled)
      if (field.value.trim() !== '') {
        validateField(field, fieldName);
      }
    });

    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      let isFormValid = true;

      formFields.forEach(field => {
        const fieldName = field.name || field.id || field.getAttribute('aria-label') || '';
        const isValid = validateField(field, fieldName);
        if (!isValid) isFormValid = false;
      });

      const formStatus = contactForm.querySelector('.form-status, #form-status, .form-message');

      if (isFormValid) {
        // Simulate submission
        const submitBtn = contactForm.querySelector('[type="submit"]');
        const originalBtnText = submitBtn ? submitBtn.textContent : '';
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Sending...';
          submitBtn.setAttribute('aria-busy', 'true');
        }

        setTimeout(() => {
          if (formStatus) {
            formStatus.className = 'form-status form-status--success';
            formStatus.textContent = 'Thank you! Your message has been sent. We\'ll be in touch within 24 hours.';
            formStatus.setAttribute('role', 'alert');
            formStatus.style.display = 'block';
          }

          contactForm.reset();
          formFields.forEach(f => {
            f.classList.remove('is-valid', 'is-invalid');
            const errorMsg = f.parentElement.querySelector('.field-error, .error-message');
            if (errorMsg) errorMsg.remove();
          });

          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
            submitBtn.removeAttribute('aria-busy');
          }
        }, 1500);
      } else {
        if (formStatus) {
          formStatus.className = 'form-status form-status--error';
          formStatus.textContent = 'Please correct the errors below and try again.';
          formStatus.setAttribute('role', 'alert');
          formStatus.style.display = 'block';
        }

        // Focus the first invalid field
        const firstInvalid = contactForm.querySelector('.is-invalid');
        if (firstInvalid) firstInvalid.focus();
      }
    });
  }

  function validateField(field, fieldName) {
    if (!field || field.disabled) return true;

    const parent = field.parentElement;
    let existingError = parent.querySelector('.field-error, .error-message');
    if (existingError) existingError.remove();

    let isValid = true;
    let errorMessage = '';

    // Required check
    if (field.required || field.hasAttribute('required')) {
      if (field.value.trim() === '') {
        isValid = false;
        errorMessage = getRequiredMessage(fieldName);
      }
    }

    // Only run further validation if the field has a value
    if (isValid && field.value.trim() !== '') {
      // Email validation
      if (field.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(field.value.trim())) {
          isValid = false;
          errorMessage = 'Please enter a valid email address.';
        }
      }

      // Phone validation
      if (field.type === 'tel' || fieldName.toLowerCase().includes('phone')) {
        const phoneClean = field.value.replace(/[\s\-\(\)\+\.]/g, '');
        if (phoneClean.length < 7) {
          isValid = false;
          errorMessage = 'Please enter a valid phone number.';
        }
      }

      // Minimum