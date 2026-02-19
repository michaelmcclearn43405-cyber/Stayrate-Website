/* ============================================================
   STAYRATE QUIZ FUNNEL — v2
   7 steps + completion screen. No dependencies.
   State stored in localStorage key 'stayrate_quiz_v2'.
============================================================ */

(function StayRateFunnel() {
  'use strict';

  /* ----------------------------------------------------------
     CONSTANTS
  ---------------------------------------------------------- */
  const STORAGE_KEY    = 'stayrate_quiz_v2';
  const TOTAL_STEPS    = 7;
  const MAX_LOCATIONS  = 5;
  const LOGO_SRC       = '../../Logo Black Transparent Background.png';
  const BOOK_URL       = '../book/index.html';

  /* ----------------------------------------------------------
     ADDRESS AUTOCOMPLETE
     Uses Nominatim (OpenStreetMap) — free, no API key required.
     Rate limit: 1 request/second (handled by debounce below).

     ── To swap in Google Places ────────────────────────────────
     1. Load the script (replace YOUR_API_KEY):
        <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places"></script>
     2. Replace fetchAddressSuggestions() with:
        const svc = new google.maps.places.AutocompleteService();
        svc.getPlacePredictions({ input: query, types: ['address'] }, (predictions, status) => {
          if (status !== google.maps.places.PlacesServiceStatus.OK) { callback([]); return; }
          callback(predictions.map(p => ({ display: p.description, value: p.description })));
        });

     ── To swap in Radar (free tier, drop-in) ───────────────────
        Radar.initialize('YOUR_PUBLISHABLE_KEY');
        const { addresses } = await Radar.autocomplete({ query, limit: 6 });
        callback(addresses.map(a => ({ display: a.formattedAddress, value: a.formattedAddress })));
  ---------------------------------------------------------- */

  // Debounce helper — waits `ms` ms after last call before invoking fn
  function debounce(fn, ms) {
    let timer;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  // Cache to avoid duplicate API hits for the same query
  const _sugCache = {};

  /**
   * Fetch address suggestions from Nominatim.
   * @param {string} query - raw user input
   * @param {function} callback - called with array of { display, value } objects
   */
  function fetchAddressSuggestions(query, callback) {
    if (!query || query.length < 3) { callback([]); return; }

    const cacheKey = query.toLowerCase();
    if (_sugCache[cacheKey]) { callback(_sugCache[cacheKey]); return; }

    const url = 'https://nominatim.openstreetmap.org/search?' + new URLSearchParams({
      q:              query,
      format:         'json',
      addressdetails: '1',
      limit:          '6',
      countrycodes:   'us',        // US addresses only — remove or add 'ca,gb,...' to expand
      'accept-language': 'en',
    });

    fetch(url, {
      headers: { 'Accept': 'application/json' },
    })
      .then(r => r.json())
      .then(results => {
        const suggestions = results.map(r => {
          // Build a clean "123 Main St, City, State ZIP" string
          const a = r.address || {};
          const parts = [];
          if (a.house_number && a.road)    parts.push(`${a.house_number} ${a.road}`);
          else if (a.road)                 parts.push(a.road);
          if (a.city || a.town || a.village) parts.push(a.city || a.town || a.village);
          if (a.state)                     parts.push(a.state);
          if (a.postcode)                  parts.push(a.postcode);
          const display = parts.length ? parts.join(', ') : r.display_name;
          return { display, value: display };
        });
        _sugCache[cacheKey] = suggestions;
        callback(suggestions);
      })
      .catch(() => callback([]));
  }

  /* ----------------------------------------------------------
     QUIZ STEPS DEFINITION
  ---------------------------------------------------------- */
  const STEPS = [
    {
      id: 1,
      type: 'location',
      heading: 'Where is your property located?',
      subheading: 'Start typing your address and select from suggestions.',
      dataKey: 'locations',
    },
    {
      id: 2,
      type: 'single',
      heading: 'What type of property do you have?',
      subheading: 'Select the option that best describes your rental.',
      dataKey: 'propertyType',
      options: [
        { emoji: '🏡', label: 'Full House',                                     value: 'house'    },
        { emoji: '🏢', label: 'Condo / Apartment / Townhome',                   value: 'condo'    },
        { emoji: '🛖', label: 'Unique stay', sub: 'yurt, treehouse, A-frame, etc.', value: 'unique' },
        { emoji: '🏠', label: 'Multiple property types',                         value: 'multiple' },
      ],
    },
    {
      id: 3,
      type: 'single',
      heading: 'What did your property earn in the last 12 months?',
      subheading: 'A rough estimate is fine — we\'ll dial it in later.',
      dataKey: 'revenue',
      options: [
        { emoji: '🔑', label: 'I haven\'t started renting yet', value: 'not_yet'      },
        { emoji: '📉', label: 'Under $25K',                      value: 'under_25k'   },
        { emoji: '💰', label: '$25K – $50K',                     value: '25k_50k'     },
        { emoji: '💰', label: '$50K – $100K',                    value: '50k_100k'    },
        { emoji: '💎', label: '$100K – $200K',                   value: '100k_200k'   },
        { emoji: '🚀', label: '$200K+',                          value: '200k_plus'   },
      ],
    },
    {
      id: 4,
      type: 'single',
      heading: 'How do you currently set your prices?',
      subheading: 'No wrong answers — we just want to understand where you\'re starting from.',
      dataKey: 'pricingMethod',
      options: [
        { emoji: '🤷', label: 'I don\'t have a strategy yet',                           value: 'no_strategy'   },
        { emoji: '✋', label: 'I set prices manually',                                   value: 'manual'        },
        { emoji: '📱', label: 'I use Airbnb Smart Pricing',                             value: 'airbnb_smart'  },
        { emoji: '🛠️', label: 'Third-party tool', sub: 'PriceLabs, Wheelhouse, etc.',   value: 'third_party'   },
        { emoji: '🏢', label: 'My property manager handles it',                          value: 'manager'       },
      ],
    },
    {
      id: 5,
      type: 'multi',
      heading: 'What\'s your biggest pricing challenge?',
      subheading: 'Select all that apply — most hosts face more than one.',
      dataKey: 'challenges',
      options: [
        { emoji: '🛏️', label: 'Too many empty nights / low occupancy',       value: 'empty_nights'    },
        { emoji: '📊', label: 'Revenue is inconsistent / hard to predict',   value: 'inconsistent'    },
        { emoji: '💸', label: 'I think I\'m leaving money on the table',     value: 'money_table'     },
        { emoji: '⏰', label: 'I don\'t have time to manage pricing',        value: 'no_time'         },
        { emoji: '❓', label: 'I don\'t know if my prices are competitive',  value: 'not_competitive' },
      ],
    },
    {
      id: 6,
      type: 'single',
      heading: 'What would success look like for your property?',
      subheading: 'Pick the outcome that resonates most with you.',
      dataKey: 'goal',
      helper: 'There\'s no wrong answer — we tailor audits to your goals.',
      options: [
        { emoji: '🏠', label: 'More predictable, steady bookings',               value: 'steady'       },
        { emoji: '💰', label: 'Increased revenue and profitability',              value: 'revenue'      },
        { emoji: '🧠', label: 'Confidence my pricing is fully optimized',        value: 'optimized'    },
        { emoji: '⚙️', label: 'Have pricing completely handled for me',           value: 'hands_off'    },
        { emoji: '🔎', label: 'Just exploring for now',                           value: 'exploring'    },
      ],
    },
    {
      id: 7,
      type: 'email',
      heading: 'Almost there — where should we send your audit report?',
      subheading: 'We\'ll send your personalized audit report — plus 3 quick SEO tips to optimize your listing.',
      dataKey: null,
    },
  ];

  /* ----------------------------------------------------------
     STATE
  ---------------------------------------------------------- */
  function defaultState() {
    return {
      step: 1,
      data: {
        locations:     [],   // array of confirmed strings
        propertyType:  null,
        revenue:       null,
        pricingMethod: null,
        challenges:    [],   // array of value strings
        goal:          null,
        firstName:     '',
        lastName:      '',
        email:         '',
        phone:         '',
      },
    };
  }

  let state = loadState();
  let isAnimating = false;
  // Tracks whether each location row has a confirmed (clicked) suggestion.
  // Pre-seed from saved state so returning users don't lose their valid locations.
  let locationValidity = (state.data.locations && state.data.locations.length > 0)
    ? state.data.locations.map(l => !!(l && l.trim()))
    : [false];

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return defaultState();
  }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
  }

  /* ----------------------------------------------------------
     ROOT ELEMENT
  ---------------------------------------------------------- */
  const root = document.getElementById('funnel-root');

  /* ----------------------------------------------------------
     TOP-LEVEL RENDER — builds chrome + injects step
  ---------------------------------------------------------- */
  function renderChrome() {
    root.innerHTML = `
      <div class="quiz-container" id="quiz-container">

        <!-- Logo -->
        <div class="quiz-logo-wrap">
          <img src="${LOGO_SRC}" alt="StayRate" class="quiz-logo-img" />
        </div>

        <!-- Progress -->
        <div class="quiz-progress" id="quiz-progress">
          <div class="quiz-progress-meta">
            <span class="quiz-step-label" id="quiz-step-label">STEP 1 OF ${TOTAL_STEPS}</span>
            <span class="quiz-pct-label"  id="quiz-pct-label">0%</span>
          </div>
          <div class="quiz-progress-track">
            <div class="quiz-progress-fill" id="quiz-progress-fill"></div>
          </div>
        </div>

        <!-- Card -->
        <div class="quiz-card" id="quiz-card">
          <div class="quiz-step-content" id="quiz-step-content">
            <!-- populated by renderStep() -->
          </div>
        </div>

      </div>
    `;
  }

  /* ----------------------------------------------------------
     STEP RENDER — dispatcher
  ---------------------------------------------------------- */
  function renderStep(step, animate) {
    updateProgress(step);

    const content = document.getElementById('quiz-step-content');
    if (!content) return;

    const stepDef = STEPS[step - 1];

    let html = '';
    if      (stepDef.type === 'location') html = renderLocation(stepDef);
    else if (stepDef.type === 'single')   html = renderSingle(stepDef);
    else if (stepDef.type === 'multi')    html = renderMulti(stepDef);
    else if (stepDef.type === 'email')    html = renderEmail(stepDef);

    if (animate) {
      content.classList.add('is-exiting');
      setTimeout(() => {
        content.innerHTML = html;
        content.classList.remove('is-exiting');
        content.classList.add('is-entering');
        setTimeout(() => {
          content.classList.remove('is-entering');
          isAnimating = false;
          bindStepListeners(step);
          focusFirstInput();
        }, 310);
      }, 300);
    } else {
      content.innerHTML = html;
      isAnimating = false;
      bindStepListeners(step);
      focusFirstInput();
    }
  }

  /* ----------------------------------------------------------
     PROGRESS BAR
  ---------------------------------------------------------- */
  function updateProgress(step) {
    const pct   = Math.round((step / TOTAL_STEPS) * 100);
    const label = document.getElementById('quiz-step-label');
    const pctEl = document.getElementById('quiz-pct-label');
    const fill  = document.getElementById('quiz-progress-fill');
    if (label) label.textContent = `STEP ${step} OF ${TOTAL_STEPS}`;
    if (pctEl) pctEl.textContent = `${pct}%`;
    if (fill)  fill.style.width  = `${pct}%`;
  }

  /* ----------------------------------------------------------
     FOOTER HTML (shared across steps)
  ---------------------------------------------------------- */
  function footerHTML(step, continueLabel = 'Continue', continueDisabled = false) {
    const backHidden = step <= 1 ? 'is-hidden' : '';
    const disabled   = continueDisabled ? 'disabled' : '';
    return `
      <div class="quiz-footer">
        <button class="quiz-back-btn ${backHidden}" id="quiz-back-btn" type="button" aria-label="Go back">
          ← Back
        </button>
        <button class="quiz-continue-btn" id="quiz-continue-btn" type="button" ${disabled}>
          ${continueLabel}
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M6 3L11 8L6 13" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    `;
  }

  /* ----------------------------------------------------------
     CHECKBOX SVG
  ---------------------------------------------------------- */
  function checkSVG() {
    return `<svg viewBox="0 0 12 10" aria-hidden="true"><polyline points="1,5 4.5,8.5 11,1"/></svg>`;
  }

  /* ----------------------------------------------------------
     RENDER — Location (Step 1)
  ---------------------------------------------------------- */
  function renderLocation(step) {
    const saved = state.data.locations || [];
    // Sync validity array length
    while (locationValidity.length < Math.max(1, saved.length)) locationValidity.push(false);

    const rowCount = Math.max(1, saved.length);
    let rows = '';
    for (let i = 0; i < rowCount; i++) {
      const val   = saved[i] || '';
      const isV   = locationValidity[i] || false;
      const removeBtn = i > 0
        ? `<button class="quiz-location-remove" data-remove="${i}" type="button" aria-label="Remove location ${i+1}">×</button>`
        : '';
      rows += `
        <div class="quiz-location-row" id="loc-row-${i}">
          <div class="quiz-location-field-wrap">
            <span class="quiz-location-icon">📍</span>
            <input
              class="quiz-location-input${isV ? ' is-valid' : ''}"
              id="loc-input-${i}"
              type="text"
              placeholder="123 Main St, City, State"
              value="${escHtml(val)}"
              autocomplete="off"
              spellcheck="false"
              data-loc-index="${i}"
              data-valid="${isV}"
            />
            <div class="quiz-autocomplete-dropdown" id="loc-dropdown-${i}"></div>
          </div>
          ${removeBtn}
        </div>
      `;
    }

    const hasValid = locationValidity.some(v => v) || saved.some(s => s);
    const showAdd  = rowCount < MAX_LOCATIONS;

    return `
      <h2 class="quiz-heading">${escHtml(step.heading)}</h2>
      <p class="quiz-subheading">${escHtml(step.subheading)}</p>
      <div class="quiz-locations" id="quiz-locations">
        ${rows}
        ${showAdd ? `<button class="quiz-add-location" id="add-loc-btn" type="button">+ Add another property</button>` : ''}
      </div>
      ${footerHTML(1, 'Continue', !hasValid)}
    `;
  }

  /* ----------------------------------------------------------
     RENDER — Single-select
  ---------------------------------------------------------- */
  function renderSingle(step) {
    const saved   = state.data[step.dataKey];
    const gridCls = step.grid ? 'quiz-options--grid' : '';

    const optionsHTML = step.options.map(opt => {
      const sel = saved === opt.value ? 'is-selected' : '';
      const sub = opt.sub ? `<span class="quiz-option-sub">${escHtml(opt.sub)}</span>` : '';
      return `
        <li class="quiz-option ${sel}"
            role="option"
            aria-selected="${sel ? 'true' : 'false'}"
            tabindex="0"
            data-value="${escHtml(opt.value)}">
          <span class="quiz-option-emoji" aria-hidden="true">${opt.emoji}</span>
          <span class="quiz-option-body">
            <span class="quiz-option-label">${escHtml(opt.label)}</span>
            ${sub}
          </span>
        </li>
      `;
    }).join('');

    const helper = step.helper
      ? `<p class="quiz-helper">${escHtml(step.helper)}</p>`
      : '';

    return `
      <h2 class="quiz-heading">${escHtml(step.heading)}</h2>
      <p class="quiz-subheading">${escHtml(step.subheading)}</p>
      <ul class="quiz-options ${gridCls}" role="listbox" aria-label="${escHtml(step.heading)}">
        ${optionsHTML}
      </ul>
      ${helper}
      ${footerHTML(step.id, 'Continue', !saved)}
    `;
  }

  /* ----------------------------------------------------------
     RENDER — Multi-select (Step 5)
  ---------------------------------------------------------- */
  function renderMulti(step) {
    const saved = state.data[step.dataKey] || [];

    const optionsHTML = step.options.map(opt => {
      const sel = saved.includes(opt.value) ? 'is-selected' : '';
      return `
        <li class="quiz-option ${sel}"
            role="checkbox"
            aria-checked="${sel ? 'true' : 'false'}"
            tabindex="0"
            data-value="${escHtml(opt.value)}">
          <span class="quiz-option-emoji" aria-hidden="true">${opt.emoji}</span>
          <span class="quiz-option-body">
            <span class="quiz-option-label">${escHtml(opt.label)}</span>
          </span>
          <span class="quiz-option-checkbox" aria-hidden="true">${checkSVG()}</span>
        </li>
      `;
    }).join('');

    return `
      <h2 class="quiz-heading">${escHtml(step.heading)}</h2>
      <p class="quiz-subheading">${escHtml(step.subheading)}</p>
      <ul class="quiz-options" role="group" aria-label="${escHtml(step.heading)}">
        ${optionsHTML}
      </ul>
      ${footerHTML(step.id, 'Continue', saved.length === 0)}
    `;
  }

  /* ----------------------------------------------------------
     RENDER — Email capture (Step 7)
  ---------------------------------------------------------- */
  function renderEmail(step) {
    const fn = escHtml(state.data.firstName || '');
    const ln = escHtml(state.data.lastName  || '');
    const em = escHtml(state.data.email     || '');
    const ph = escHtml(state.data.phone     || '');
    return `
      <h2 class="quiz-heading">${escHtml(step.heading)}</h2>
      <p class="quiz-subheading">${escHtml(step.subheading)}</p>
      <div class="quiz-fields">
        <div style="display:flex;gap:12px;">
          <div class="quiz-field" style="flex:1;">
            <label class="quiz-label" for="input-first-name">First name</label>
            <input class="quiz-input" id="input-first-name" type="text"
              placeholder="Jane" value="${fn}"
              autocomplete="given-name" autocapitalize="words" />
            <span class="quiz-input-error" id="err-first-name">Required.</span>
          </div>
          <div class="quiz-field" style="flex:1;">
            <label class="quiz-label" for="input-last-name">Last name</label>
            <input class="quiz-input" id="input-last-name" type="text"
              placeholder="Smith" value="${ln}"
              autocomplete="family-name" autocapitalize="words" />
            <span class="quiz-input-error" id="err-last-name">Required.</span>
          </div>
        </div>
        <div class="quiz-field">
          <label class="quiz-label" for="input-email">Email address</label>
          <input class="quiz-input" id="input-email" type="email"
            placeholder="jane@example.com" value="${em}"
            autocomplete="email" inputmode="email" />
          <span class="quiz-input-error" id="err-email">Please enter a valid email address.</span>
        </div>
        <div class="quiz-field">
          <label class="quiz-label" for="input-phone">
            Phone number
            <span class="quiz-label-optional">(optional)</span>
          </label>
          <input class="quiz-input" id="input-phone" type="tel"
            placeholder="(555) 000-0000" value="${ph}"
            autocomplete="tel" inputmode="tel" />
        </div>
        <p class="quiz-privacy">🔒 We'll only use this to confirm your audit and send reminders — no spam.</p>
        <div class="quiz-email-checklist">
          <div class="quiz-email-check-item">
            <span class="quiz-email-check-icon">✓</span>
            <span>Your answers have been saved</span>
          </div>
          <div class="quiz-email-check-item">
            <span class="quiz-email-check-icon">✓</span>
            <span>Your audit is ready to schedule</span>
          </div>
        </div>
      </div>
      ${footerHTML(step.id, 'See Available Audit Times →', true)}
    `;
  }

  /* ----------------------------------------------------------
     COMPLETION SCREEN
  ---------------------------------------------------------- */
  function renderComplete() {
    const firstName = state.data.firstName || 'there';
    const email     = state.data.email     || 'your inbox';
    const card      = document.getElementById('quiz-card');
    const progress  = document.getElementById('quiz-progress');
    if (progress) progress.style.display = 'none';

    card.innerHTML = `
      <div class="quiz-complete">
        <div class="quiz-complete-icon-wrap" aria-hidden="true">✨</div>
        <h2 class="quiz-complete-heading">You're all set, ${escHtml(firstName)}!</h2>
        <p class="quiz-complete-body">
          Your personalized pricing report is being built. Check
          <span class="quiz-complete-email-highlight">${escHtml(email)}</span>
          — it'll land in your inbox within a few minutes.
        </p>
        <div class="quiz-social-proof">
          <div class="quiz-social-proof-stat">23%</div>
          <p class="quiz-social-proof-text">
            Hosts who optimize pricing within their first week see an average
            <strong>23% revenue lift in 90 days.</strong>
          </p>
        </div>
      </div>
    `;

    // Clear state
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
  }

  /* ----------------------------------------------------------
     BIND STEP LISTENERS
  ---------------------------------------------------------- */
  function bindStepListeners(step) {
    const stepDef = STEPS[step - 1];
    bindFooterButtons(step, stepDef);

    if      (stepDef.type === 'location') bindLocationListeners(step);
    else if (stepDef.type === 'single')   bindSingleListeners(stepDef);
    else if (stepDef.type === 'multi')    bindMultiListeners(stepDef);
    else if (stepDef.type === 'email')    bindEmailListeners();
  }

  /* ----------------------------------------------------------
     FOOTER BUTTONS
  ---------------------------------------------------------- */
  function bindFooterButtons(step, stepDef) {
    const backBtn = document.getElementById('quiz-back-btn');
    const contBtn = document.getElementById('quiz-continue-btn');

    if (backBtn) {
      backBtn.addEventListener('click', () => {
        if (isAnimating || step <= 1) return;
        goToStep(step - 1);
      });
    }

    if (contBtn) {
      contBtn.addEventListener('click', () => {
        if (isAnimating || contBtn.disabled) return;
        handleContinue(step, stepDef);
      });
    }
  }

  /* ----------------------------------------------------------
     CONTINUE LOGIC
  ---------------------------------------------------------- */
  function handleContinue(step, stepDef) {
    if (stepDef.type === 'email') {
      submitEmail();
      return;
    }
    saveState();
    if (step < TOTAL_STEPS) {
      goToStep(step + 1);
    }
  }

  /* ----------------------------------------------------------
     NAVIGATE TO STEP
  ---------------------------------------------------------- */
  function goToStep(next) {
    if (isAnimating) return;
    isAnimating = true;
    state.step = next;
    saveState();
    renderStep(next, true);
  }

  /* ----------------------------------------------------------
     FOCUS FIRST INPUT
  ---------------------------------------------------------- */
  function focusFirstInput() {
    const first = document.querySelector('.quiz-location-input, .quiz-input, .quiz-option');
    if (first) first.focus({ preventScroll: true });
  }

  /* ----------------------------------------------------------
     BIND — Location listeners
  ---------------------------------------------------------- */
  function bindLocationListeners() {
    rebindAllLocationRows();

    const addBtn = document.getElementById('add-loc-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        if (state.data.locations.length >= MAX_LOCATIONS) return;
        state.data.locations.push('');
        locationValidity.push(false);
        saveState();
        refreshLocationStep();
      });
    }
  }

  function rebindAllLocationRows() {
    document.querySelectorAll('[data-loc-index]').forEach(input => {
      bindOneLocationInput(input);
    });

    document.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.remove, 10);
        state.data.locations.splice(idx, 1);
        locationValidity.splice(idx, 1);
        saveState();
        refreshLocationStep();
      });
    });
  }

  function refreshLocationStep() {
    const content = document.getElementById('quiz-step-content');
    if (!content) return;
    content.innerHTML = renderLocation(STEPS[0]);
    bindLocationListeners();
    updateContinueBtn();
  }

  function bindOneLocationInput(input) {
    const idx      = parseInt(input.dataset.locIndex, 10);
    const dropdown = document.getElementById(`loc-dropdown-${idx}`);
    let highlightedIdx = -1;
    let suggestions    = [];  // array of { display, value }

    // Debounced fetch — fires 350 ms after the user stops typing
    const debouncedFetch = debounce(function(query) {
      // Show a subtle loading state while waiting for results
      if (query.length >= 3) {
        dropdown.innerHTML = '<div class="quiz-autocomplete-loading">Searching…</div>';
        dropdown.classList.add('is-open');
      }
      fetchAddressSuggestions(query, function(results) {
        suggestions = results;
        renderDropdown(query);
      });
    }, 350);

    function renderDropdown(query) {
      if (!suggestions.length) { closeDrop(); return; }

      dropdown.innerHTML = suggestions.map((s, i) => {
        // Bold the portion of the display text that matches what was typed
        const text = s.display;
        const qi   = text.toLowerCase().indexOf(query.toLowerCase());
        let display;
        if (qi >= 0) {
          display = escHtml(text.slice(0, qi))
            + '<strong>' + escHtml(text.slice(qi, qi + query.length)) + '</strong>'
            + escHtml(text.slice(qi + query.length));
        } else {
          display = escHtml(text);
        }
        return `
          <div class="quiz-autocomplete-item" data-sug-idx="${i}" role="option" tabindex="-1">
            <span class="quiz-autocomplete-item-icon">📍</span>
            <span class="quiz-autocomplete-item-text">${display}</span>
          </div>
        `;
      }).join('');

      dropdown.classList.add('is-open');
      highlightedIdx = -1;

      dropdown.querySelectorAll('.quiz-autocomplete-item').forEach(item => {
        item.addEventListener('mousedown', e => {
          e.preventDefault();
          selectSuggestion(parseInt(item.dataset.sugIdx, 10));
        });
      });
    }

    function closeDrop() {
      dropdown.classList.remove('is-open');
      dropdown.innerHTML = '';
      highlightedIdx = -1;
    }

    function selectSuggestion(i) {
      const chosen = suggestions[i];
      if (!chosen) return;
      const val = chosen.value;
      input.value = val;
      // Pad array if needed and store
      while (state.data.locations.length <= idx) state.data.locations.push('');
      state.data.locations[idx] = val;
      input.dataset.valid = 'true';
      locationValidity[idx] = true;
      input.classList.add('is-valid');
      closeDrop();
      saveState();
      updateContinueBtn();
    }

    input.addEventListener('input', () => {
      const q = input.value.trim();
      // Mark invalid until a suggestion is explicitly selected
      locationValidity[idx] = false;
      input.dataset.valid = 'false';
      input.classList.remove('is-valid');
      // Store raw typed value (so re-render keeps it)
      while (state.data.locations.length <= idx) state.data.locations.push('');
      state.data.locations[idx] = q;
      updateContinueBtn();

      if (q.length < 3) {
        closeDrop();
        return;
      }
      debouncedFetch(q);
    });

    input.addEventListener('keydown', e => {
      const items = dropdown.querySelectorAll('.quiz-autocomplete-item');

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!items.length) return;
        highlightedIdx = Math.min(highlightedIdx + 1, items.length - 1);
        items.forEach((it, i) => it.classList.toggle('is-highlighted', i === highlightedIdx));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!items.length) return;
        highlightedIdx = Math.max(highlightedIdx - 1, 0);
        items.forEach((it, i) => it.classList.toggle('is-highlighted', i === highlightedIdx));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (highlightedIdx >= 0) {
          selectSuggestion(highlightedIdx);
        } else if (suggestions.length === 1) {
          selectSuggestion(0);
        } else {
          // Allow free-text entry on Enter if something is typed
          const q = input.value.trim();
          if (q) {
            while (state.data.locations.length <= idx) state.data.locations.push('');
            state.data.locations[idx] = q;
            locationValidity[idx] = true;
            input.classList.add('is-valid');
            closeDrop();
            saveState();
            updateContinueBtn();
          }
        }
      } else if (e.key === 'Escape') {
        closeDrop();
      }
    });

    input.addEventListener('blur', () => {
      // Small delay so mousedown on suggestion fires first
      setTimeout(() => {
        closeDrop();
        // Accept free-text value on blur if non-empty (user typed but didn't pick)
        const q = input.value.trim();
        if (q && !locationValidity[idx]) {
          while (state.data.locations.length <= idx) state.data.locations.push('');
          state.data.locations[idx] = q;
          locationValidity[idx] = true;
          input.classList.add('is-valid');
          saveState();
          updateContinueBtn();
        }
      }, 150);
    });
  }

  /* ----------------------------------------------------------
     BIND — Single-select listeners
  ---------------------------------------------------------- */
  function bindSingleListeners(stepDef) {
    document.querySelectorAll('.quiz-option').forEach(opt => {
      const activate = () => {
        document.querySelectorAll('.quiz-option').forEach(o => {
          o.classList.remove('is-selected');
          o.setAttribute('aria-selected', 'false');
        });
        opt.classList.add('is-selected');
        opt.setAttribute('aria-selected', 'true');
        state.data[stepDef.dataKey] = opt.dataset.value;
        saveState();

        // Enable continue
        const btn = document.getElementById('quiz-continue-btn');
        if (btn) btn.disabled = false;

        // Auto-advance
        setTimeout(() => {
          if (state.step < TOTAL_STEPS) {
            goToStep(state.step + 1);
          }
        }, 280);
      };

      opt.addEventListener('click', activate);
      opt.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
        // Arrow navigation
        const opts = Array.from(document.querySelectorAll('.quiz-option'));
        const i    = opts.indexOf(opt);
        if (e.key === 'ArrowDown' && i < opts.length - 1) opts[i + 1].focus();
        if (e.key === 'ArrowUp'   && i > 0)               opts[i - 1].focus();
      });
    });
  }

  /* ----------------------------------------------------------
     BIND — Multi-select listeners (Step 5)
  ---------------------------------------------------------- */
  function bindMultiListeners(stepDef) {
    document.querySelectorAll('.quiz-option').forEach(opt => {
      const toggle = () => {
        const val  = opt.dataset.value;
        const arr  = state.data[stepDef.dataKey] || [];
        const idx  = arr.indexOf(val);
        if (idx === -1) arr.push(val);
        else            arr.splice(idx, 1);
        state.data[stepDef.dataKey] = arr;
        opt.classList.toggle('is-selected', arr.includes(val));
        opt.setAttribute('aria-checked', arr.includes(val) ? 'true' : 'false');
        saveState();
        updateContinueBtn();
      };

      opt.addEventListener('click', toggle);
      opt.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
        const opts = Array.from(document.querySelectorAll('.quiz-option'));
        const i    = opts.indexOf(opt);
        if (e.key === 'ArrowDown' && i < opts.length - 1) opts[i + 1].focus();
        if (e.key === 'ArrowUp'   && i > 0)               opts[i - 1].focus();
      });
    });
  }

  /* ----------------------------------------------------------
     BIND — Email listeners (Step 7)
  ---------------------------------------------------------- */
  function bindEmailListeners() {
    const fnInput  = document.getElementById('input-first-name');
    const lnInput  = document.getElementById('input-last-name');
    const emInput  = document.getElementById('input-email');
    const phInput  = document.getElementById('input-phone');
    const contBtn  = document.getElementById('quiz-continue-btn');

    function check() {
      const fn = fnInput ? fnInput.value.trim() : '';
      const ln = lnInput ? lnInput.value.trim() : '';
      const em = emInput ? emInput.value.trim() : '';
      const ph = phInput ? phInput.value.trim() : '';
      // Phone is optional — only first name, last name, and email are required
      const ok = fn.length > 0 && ln.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em);
      if (contBtn) contBtn.disabled = !ok;
      // Live save
      state.data.firstName = fn;
      state.data.lastName  = ln;
      state.data.email     = em;
      state.data.phone     = ph;
      saveState();
    }

    if (fnInput) fnInput.addEventListener('input', check);
    if (lnInput) lnInput.addEventListener('input', check);
    if (phInput) phInput.addEventListener('input', check);
    if (emInput) {
      emInput.addEventListener('input', check);
      emInput.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !contBtn?.disabled) { e.preventDefault(); submitEmail(); }
      });
    }

    // Run once to reflect any pre-saved values
    check();
  }

  /* ----------------------------------------------------------
     EMAIL SUBMIT
  ---------------------------------------------------------- */
  function submitEmail() {
    const fnInput = document.getElementById('input-first-name');
    const lnInput = document.getElementById('input-last-name');
    const emInput = document.getElementById('input-email');
    const phInput = document.getElementById('input-phone');

    let valid = true;

    function showErr(inputId, errId) {
      const inp = document.getElementById(inputId);
      const err = document.getElementById(errId);
      if (inp) { inp.classList.add('has-error'); inp.focus(); }
      if (err) err.style.display = 'block';
      valid = false;
    }

    function clearErr(inputId, errId) {
      const inp = document.getElementById(inputId);
      const err = document.getElementById(errId);
      if (inp) inp.classList.remove('has-error');
      if (err) err.style.display = 'none';
    }

    clearErr('input-first-name', 'err-first-name');
    clearErr('input-last-name',  'err-last-name');
    clearErr('input-email',      'err-email');

    const fn = fnInput ? fnInput.value.trim() : '';
    const ln = lnInput ? lnInput.value.trim() : '';
    const em = emInput ? emInput.value.trim() : '';
    const ph = phInput ? phInput.value.trim() : '';

    if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) showErr('input-email',      'err-email');
    if (!ln)                                             showErr('input-last-name',  'err-last-name');
    if (!fn)                                             showErr('input-first-name', 'err-first-name');

    if (!valid) return;

    state.data.firstName = fn;
    state.data.lastName  = ln;
    state.data.email     = em;
    state.data.phone     = ph;
    saveState();

    // Build data payload
    const payload = buildPayload();
    console.log('[StayRate] Quiz submission:', payload);
    // TODO: POST payload to backend endpoint here
    // fetch('/api/quiz-submit', { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } });

    // Redirect to Calendly booking page (state persists via localStorage)
    window.location.href = BOOK_URL;
  }

  /* ----------------------------------------------------------
     BUILD DATA PAYLOAD
  ---------------------------------------------------------- */
  function buildPayload() {
    return {
      locations:     state.data.locations.filter(Boolean),
      propertyType:  state.data.propertyType,
      revenue:       state.data.revenue,
      pricingMethod: state.data.pricingMethod,
      challenges:    state.data.challenges,
      goal:          state.data.goal,
      firstName:     state.data.firstName,
      lastName:      state.data.lastName,
      email:         state.data.email,
      phone:         state.data.phone,
    };
  }

  /* ----------------------------------------------------------
     UPDATE CONTINUE BUTTON STATE
  ---------------------------------------------------------- */
  function updateContinueBtn() {
    const btn     = document.getElementById('quiz-continue-btn');
    if (!btn) return;
    const step    = state.step;
    const stepDef = STEPS[step - 1];

    let enabled = false;
    if (stepDef.type === 'location') {
      enabled = locationValidity.some(v => v) ||
                state.data.locations.some(l => l && l.trim().length > 0);
    } else if (stepDef.type === 'single') {
      enabled = !!state.data[stepDef.dataKey];
    } else if (stepDef.type === 'multi') {
      enabled = (state.data[stepDef.dataKey] || []).length > 0;
    } else if (stepDef.type === 'email') {
      const fn = state.data.firstName || '';
      const ln = state.data.lastName  || '';
      const em = state.data.email     || '';
      enabled = fn.length > 0 && ln.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em);
    }

    btn.disabled = !enabled;
  }

  /* ----------------------------------------------------------
     HTML ESCAPE
  ---------------------------------------------------------- */
  function escHtml(str) {
    return String(str || '')
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');
  }

  /* ----------------------------------------------------------
     GLOBAL KEYBOARD — Escape = close dropdowns
  ---------------------------------------------------------- */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.quiz-autocomplete-dropdown').forEach(d => {
        d.classList.remove('is-open');
        d.innerHTML = '';
      });
    }
  });

  /* ----------------------------------------------------------
     INIT
  ---------------------------------------------------------- */
  renderChrome();
  renderStep(state.step, false);

})();
