/* ============================================================
   STAYRATE — script.js
   Vanilla JS. No frameworks, no dependencies.
   Handles:
     1. Sticky header shadow on scroll
     2. Mobile hamburger menu toggle
     3. Close mobile menu on nav link click
     4. FAQ accordion
     5. Scroll-triggered fade-in animations
     6. Auto-update footer copyright year
     7. Smooth scroll offset for sticky header
     8. Case Study bar chart + count-up animations
============================================================ */


/* ============================================================
   1. STICKY HEADER — add shadow class on scroll
============================================================ */
(function initStickyHeader() {
  const header = document.getElementById('site-header');
  if (!header) return;

  function onScroll() {
    if (window.scrollY > 10) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();


/* ============================================================
   1b. ABOUT US DROPDOWN — desktop nav
============================================================ */
(function initDropdowns() {
  document.querySelectorAll('.nav-item-dropdown').forEach(function(item) {
    var toggle = item.querySelector('.nav-dropdown-toggle');
    if (!toggle) return;

    function openDropdown() {
      item.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
    }

    function closeDropdown() {
      item.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }

    // Toggle on click
    toggle.addEventListener('click', function(e) {
      e.stopPropagation();
      item.classList.contains('is-open') ? closeDropdown() : openDropdown();
    });

    // Close on Escape
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeDropdown();
    });

    // Close when clicking anywhere outside
    document.addEventListener('click', function(e) {
      if (!item.contains(e.target)) closeDropdown();
    });

    // Close when a dropdown link is clicked (navigation)
    item.querySelectorAll('.nav-dropdown-item').forEach(function(link) {
      link.addEventListener('click', closeDropdown);
    });
  });
})();


/* ============================================================
   2. HAMBURGER MENU TOGGLE (mobile)
============================================================ */
(function initMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  if (!hamburger || !mobileMenu) return;

  function openMenu() {
    hamburger.classList.add('is-open');
    hamburger.setAttribute('aria-expanded', 'true');
    mobileMenu.classList.add('is-open');
    mobileMenu.removeAttribute('aria-hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    hamburger.classList.remove('is-open');
    hamburger.setAttribute('aria-expanded', 'false');
    mobileMenu.classList.remove('is-open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', function() {
    hamburger.classList.contains('is-open') ? closeMenu() : openMenu();
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && hamburger.classList.contains('is-open')) {
      closeMenu();
      hamburger.focus();
    }
  });

  window._closeMenu = closeMenu;
})();


/* ============================================================
   3. CLOSE MOBILE MENU on nav link click
============================================================ */
(function initMobileNavLinks() {
  document.querySelectorAll('.mobile-nav-link, .mobile-cta').forEach(function(link) {
    link.addEventListener('click', function() {
      if (typeof window._closeMenu === 'function') window._closeMenu();
    });
  });
})();


/* ============================================================
   4. FAQ ACCORDION
============================================================ */
(function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(function(item) {
    const question = item.querySelector('.faq-question');
    const answerId = question.getAttribute('aria-controls');
    const answer   = document.getElementById(answerId);
    if (!question || !answer) return;

    question.addEventListener('click', function() {
      const isOpen = question.getAttribute('aria-expanded') === 'true';

      // Close all
      faqItems.forEach(function(otherItem) {
        const otherQ = otherItem.querySelector('.faq-question');
        const otherA = document.getElementById(otherQ.getAttribute('aria-controls'));
        otherQ.setAttribute('aria-expanded', 'false');
        if (otherA) otherA.hidden = true;
      });

      // Open this one if it was closed
      if (!isOpen) {
        question.setAttribute('aria-expanded', 'true');
        answer.hidden = false;
      }
    });
  });
})();


/* ============================================================
   5. SCROLL-TRIGGERED FADE-IN ANIMATIONS
============================================================ */
(function initScrollAnimations() {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.animate-on-scroll').forEach(function(el) {
      el.classList.add('is-visible');
    });
    return;
  }

  const observer = new IntersectionObserver(
    function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
  );

  document.querySelectorAll('.animate-on-scroll').forEach(function(el) {
    observer.observe(el);
  });
})();


/* ============================================================
   6. AUTO-UPDATE FOOTER COPYRIGHT YEAR
============================================================ */
(function updateCopyrightYear() {
  const yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();


/* ============================================================
   7. SMOOTH SCROLL — offset for sticky header
============================================================ */
(function initSmoothScrollOffset() {
  const HEADER_HEIGHT = 80;

  document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();
      const targetTop = target.getBoundingClientRect().top + window.scrollY - HEADER_HEIGHT;
      window.scrollTo({ top: targetTop, behavior: 'smooth' });
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  });
})();


/* ============================================================
   8b. BIG STAT COUNT-UP ANIMATIONS
   ─────────────────────────────────────────────────────────────
   Targets elements with [data-countup] attribute.
   Data attributes:
     data-target   — numeric end value (e.g. "18")
     data-prefix   — text before the number (e.g. "+$")
     data-suffix   — text after the number (e.g. "K")
     data-decimals — decimal places (e.g. "0")
   Fires when the .cs-big-stats container enters the viewport.
============================================================ */
(function initBigStatCountUp() {

  var DURATION = 1400; // ms

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function animateStat(el) {
    var target   = parseFloat(el.dataset.target)  || 0;
    var prefix   = el.dataset.prefix  || '';
    var suffix   = el.dataset.suffix  || '';
    var decimals = parseInt(el.dataset.decimals, 10);
    if (isNaN(decimals)) decimals = 0;

    // Add the pop animation class once
    el.classList.add('countup-animating');

    var start = null;

    function step(timestamp) {
      if (!start) start = timestamp;
      var progress = Math.min((timestamp - start) / DURATION, 1);
      var eased    = easeOutCubic(progress);
      var current  = target * eased;
      el.textContent = prefix + current.toFixed(decimals) + suffix;
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = prefix + target.toFixed(decimals) + suffix;
      }
    }

    requestAnimationFrame(step);
  }

  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('[data-countup]').forEach(animateStat);
    return;
  }

  var statObserver = new IntersectionObserver(
    function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          // Animate each stat number in the container with a stagger
          var nums = entry.target.querySelectorAll('[data-countup]');
          nums.forEach(function(el, i) {
            setTimeout(function() { animateStat(el); }, i * 120);
          });
          statObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.3, rootMargin: '0px 0px -40px 0px' }
  );

  document.querySelectorAll('.cs-big-stats').forEach(function(block) {
    statObserver.observe(block);
  });

})();


/* ============================================================
   8c. PHOTO SLIDESHOW — bottom-right property images
   ─────────────────────────────────────────────────────────────
   Each [data-slideshow] container holds .cs-slide images.
   Auto-advances every 3.5 seconds. Pauses on hover.
   Falls back gracefully if only 1 image loads.
============================================================ */
(function initSlideshows() {

  var INTERVAL   = 3000; // ms between slides
  var FADE_CLASS = 'cs-slide--active';

  document.querySelectorAll('[data-slideshow]').forEach(function(wrap) {
    var slides = Array.from(wrap.querySelectorAll('.cs-slide'));
    var dots   = Array.from(wrap.querySelectorAll('.cs-dot'));
    if (slides.length < 2) return; // nothing to rotate

    var current = 0;
    var timer   = null;

    function goTo(index) {
      slides[current].classList.remove(FADE_CLASS);
      if (dots[current]) dots[current].classList.remove('cs-dot--active');

      current = (index + slides.length) % slides.length;

      slides[current].classList.add(FADE_CLASS);
      if (dots[current]) dots[current].classList.add('cs-dot--active');
    }

    function next() { goTo(current + 1); }

    function startTimer() {
      if (timer) return; // prevent double-start
      timer = setInterval(next, INTERVAL);
    }

    function stopTimer() {
      clearInterval(timer);
      timer = null;
    }

    // Pause on hover so users can look at the current image
    wrap.addEventListener('mouseenter', stopTimer);
    wrap.addEventListener('mouseleave', startTimer);

    // Also allow clicking to advance manually
    wrap.addEventListener('click', function() {
      stopTimer();
      next();
      startTimer();
    });

    // Start auto-play when the slideshow enters the viewport
    if ('IntersectionObserver' in window) {
      var ssObserver = new IntersectionObserver(
        function(entries) {
          entries.forEach(function(entry) {
            if (entry.isIntersecting) {
              startTimer();
            } else {
              stopTimer();
            }
          });
        },
        { threshold: 0.1 }
      );
      ssObserver.observe(wrap);
    } else {
      startTimer();
    }
  });

})();


/* ============================================================
   8. CASE STUDY BAR CHARTS + COUNT-UP ANIMATIONS
   ─────────────────────────────────────────────────────────────
   HOW IT WORKS:
   Each .cs-metrics-block has data attributes:
     data-rev-before, data-rev-after   — annual revenue ($)
     data-occ-before, data-occ-after   — occupancy (%)
     data-adr-before, data-adr-after   — avg daily rate ($)

   For each metric, we:
     1. Calculate bar widths as a % of the LARGER of the two
        values, so the bigger bar always fills ~90% of the track,
        and the smaller bar is proportionally shorter.
     2. When the card enters the viewport, we:
        a. Animate the bar fills from 0% → computed width%
        b. Count up the number labels from 0 → actual value
   ─────────────────────────────────────────────────────────────
============================================================ */
(function initCaseStudyCharts() {

  /* --- Helpers --- */

  /**
   * Format a raw number for display.
   * type: 'currency' → "$82,000"  |  'percent' → "58%"
   */
  function formatValue(value, type) {
    if (type === 'currency') {
      return '$' + Math.round(value).toLocaleString('en-US');
    }
    if (type === 'percent') {
      return Math.round(value) + '%';
    }
    return String(Math.round(value));
  }

  /**
   * Animate a number counting up from 0 → targetValue over ~1 second.
   * Updates the textContent of the given DOM element.
   */
  function countUp(el, targetValue, type, duration) {
    duration = duration || 1100;
    var start     = null;
    var startVal  = 0;

    function step(timestamp) {
      if (!start) start = timestamp;
      var progress = Math.min((timestamp - start) / duration, 1);
      // Ease-out cubic for a natural deceleration
      var eased    = 1 - Math.pow(1 - progress, 3);
      var current  = startVal + (targetValue - startVal) * eased;
      el.textContent = formatValue(current, type);
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = formatValue(targetValue, type);
      }
    }

    requestAnimationFrame(step);
  }

  /**
   * Animate a bar fill from 0% → targetPercent%.
   * We set the width via inline style — the CSS transition does the rest.
   */
  function animateBar(fillEl, targetPercent) {
    // Small delay to ensure the element is rendered before transition starts
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        fillEl.style.width = targetPercent + '%';
      });
    });
  }

  /**
   * Given a .cs-metrics-block element, read its data attributes,
   * compute bar widths, and wire up value labels.
   * Returns an object with animate() that fires when triggered.
   */
  function prepareBlock(block) {
    // Read raw values from data attributes
    var data = {
      rev:  { before: parseFloat(block.dataset.revBefore),  after: parseFloat(block.dataset.revAfter)  },
      occ:  { before: parseFloat(block.dataset.occBefore),  after: parseFloat(block.dataset.occAfter)  },
      adr:  { before: parseFloat(block.dataset.adrBefore),  after: parseFloat(block.dataset.adrAfter)  }
    };

    // Max fill % for the larger bar in each metric (leave headroom)
    var MAX_FILL = 88;

    /**
     * Compute bar widths.
     * The larger value always fills MAX_FILL%. The smaller is proportional.
     */
    function barWidths(beforeVal, afterVal) {
      var maxVal = Math.max(beforeVal, afterVal);
      return {
        before: (beforeVal / maxVal) * MAX_FILL,
        after:  (afterVal  / maxVal) * MAX_FILL
      };
    }

    // Pre-compute widths for each metric
    var widths = {
      rev: barWidths(data.rev.before, data.rev.after),
      occ: barWidths(data.occ.before, data.occ.after),
      adr: barWidths(data.adr.before, data.adr.after)
    };

    // Map metric keys to bar fill elements and value label elements
    // Structure inside each .cs-chart-row:
    //   .cs-chart-bars
    //     .cs-bar-group (before)
    //       .cs-bar--before > .cs-bar-fill
    //       .cs-bar-value--before [data-field="rev-before"]
    //     .cs-bar-group (after)
    //       .cs-bar--after > .cs-bar-fill
    //       .cs-bar-value--after [data-field="rev-after"]

    var rows = block.querySelectorAll('.cs-chart-row');
    // rows[0] = Revenue, rows[1] = Occupancy, rows[2] = ADR
    var metrics = [
      { key: 'rev', row: rows[0], type: 'currency' },
      { key: 'occ', row: rows[1], type: 'percent'  },
      { key: 'adr', row: rows[2], type: 'currency' }
    ];

    // Bind DOM references
    metrics.forEach(function(m) {
      if (!m.row) return;
      m.beforeFill  = m.row.querySelector('.cs-bar--before .cs-bar-fill');
      m.afterFill   = m.row.querySelector('.cs-bar--after  .cs-bar-fill');
      m.beforeLabel = m.row.querySelector('[data-field$="-before"]');
      m.afterLabel  = m.row.querySelector('[data-field$="-after"]');
    });

    var animated = false;

    return {
      animate: function() {
        if (animated) return;
        animated = true;

        metrics.forEach(function(m) {
          if (!m.row) return;
          var w   = widths[m.key];
          var d   = data[m.key];

          // Stagger: ADR starts slightly later for cascade effect
          var delay = m.key === 'adr' ? 200 : m.key === 'occ' ? 100 : 0;

          setTimeout(function() {
            if (m.beforeFill)  animateBar(m.beforeFill,  w.before);
            if (m.afterFill)   animateBar(m.afterFill,   w.after);
            if (m.beforeLabel) countUp(m.beforeLabel, d.before, m.type);
            if (m.afterLabel)  countUp(m.afterLabel,  d.after,  m.type);
          }, delay);
        });
      }
    };
  }

  /* --- Set up IntersectionObserver to trigger animations --- */

  if (!('IntersectionObserver' in window)) {
    // Fallback: just show final values immediately
    document.querySelectorAll('.cs-metrics-block').forEach(function(block) {
      prepareBlock(block).animate();
    });
    return;
  }

  var chartObserver = new IntersectionObserver(
    function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          // Get the pre-prepared controller and fire the animation
          var ctrl = entry.target._chartCtrl;
          if (ctrl) ctrl.animate();
          chartObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.25,              // Fire when 25% of the metrics block is visible
      rootMargin: '0px 0px -60px 0px'
    }
  );

  // Prepare every metrics block and start observing
  document.querySelectorAll('.cs-metrics-block').forEach(function(block) {
    block._chartCtrl = prepareBlock(block);
    chartObserver.observe(block);
  });

})();
