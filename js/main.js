(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Nav scroll state ---------- */
  var nav = document.getElementById('nav');
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');

  function onScroll() {
    if (window.scrollY > 20) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (navToggle) {
    navToggle.addEventListener('click', function () {
      navLinks.classList.toggle('open');
    });
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('open');
      });
    });
  }

  /* ---------- Number formatting ---------- */
  function formatLakh(value) {
    return (value / 100000).toFixed(2) + 'L';
  }

  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-count-to'));
    var prefix = el.getAttribute('data-prefix') || '';
    var format = el.getAttribute('data-format');
    var duration = 1200;
    var start = null;

    if (reduceMotion) {
      el.textContent = prefix + (format === 'lakh' ? formatLakh(target) : Math.round(target));
      return;
    }

    function step(timestamp) {
      if (!start) start = timestamp;
      var progress = Math.min((timestamp - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = target * eased;
      el.textContent = prefix + (format === 'lakh' ? formatLakh(current) : Math.round(current));
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }
    requestAnimationFrame(step);
  }

  /* ---------- Chart draw-in ---------- */
  function drawChart(card) {
    var path = card.querySelector('.chart-path');
    var fill = card.querySelector('.chart-fill');
    if (!path) return;

    if (reduceMotion) {
      fill && fill.classList.add('is-visible');
      return;
    }

    var length = path.getTotalLength();
    path.style.strokeDasharray = length;
    path.style.strokeDashoffset = length;
    path.style.transition = 'none';

    requestAnimationFrame(function () {
      path.style.transition = 'stroke-dashoffset 900ms cubic-bezier(0.4, 0, 0.2, 1)';
      path.style.strokeDashoffset = 0;
      if (fill) fill.classList.add('is-visible');
    });
  }

  /* ---------- Intersection Observer: reveals ---------- */
  var revealTargets = document.querySelectorAll('.reveal, .reveal-stagger');
  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  revealTargets.forEach(function (el) {
    revealObserver.observe(el);
  });

  /* ---------- Contact form ---------- */
  var contactForm = document.getElementById('contactForm');
  if (contactForm) {
    var formStatus = document.getElementById('formStatus');

    // Preselect the tier when arriving from a "Discuss this tier" button
    var tierSelect = document.getElementById('tier');
    var tierParam = new URLSearchParams(window.location.search).get('tier');
    if (tierSelect && tierParam) {
      var hasOption = Array.prototype.some.call(tierSelect.options, function (o) {
        return o.value === tierParam;
      });
      if (hasOption) tierSelect.value = tierParam;
    }

    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var submitBtn = contactForm.querySelector('.form-submit');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';
      formStatus.className = 'form-status';

      fetch(contactForm.action, {
        method: 'POST',
        body: new FormData(contactForm),
        headers: { Accept: 'application/json' }
      }).then(function (response) {
        if (response.ok) {
          formStatus.textContent = "Thanks, we've got it. We'll be in touch shortly.";
          formStatus.className = 'form-status success';
          contactForm.reset();
        } else {
          formStatus.textContent = 'Something went wrong. Please try WhatsApp or email instead.';
          formStatus.className = 'form-status error';
        }
      }).catch(function () {
        formStatus.textContent = 'Something went wrong. Please try WhatsApp or email instead.';
        formStatus.className = 'form-status error';
      }).finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send';
      });
    });
  }

  /* ---------- Intersection Observer: report card metrics + chart ---------- */
  var reportCard = document.querySelector('.report-card');
  if (reportCard) {
    var cardObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.querySelectorAll('[data-count-to]').forEach(animateCount);
          drawChart(entry.target);
          cardObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    cardObserver.observe(reportCard);
  }
})();
