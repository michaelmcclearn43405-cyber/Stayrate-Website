/* ============================================================
   WORKSHOP — workshop.js
   Handles registration form submission and thank-you state.
============================================================ */

(function initWorkshopForm() {
  var form      = document.getElementById('ws-registration-form');
  var thankYou  = document.getElementById('ws-thank-you');
  if (!form || !thankYou) return;

  form.addEventListener('submit', function(e) {
    e.preventDefault();

    // Basic client-side validation
    var fields = form.querySelectorAll('[required]');
    var valid  = true;

    fields.forEach(function(field) {
      if (!field.value.trim()) {
        valid = false;
        field.style.borderColor = '#e53e3e';
      } else {
        field.style.borderColor = 'transparent';
      }
    });

    if (!valid) return;

    // Hide form, show thank-you
    form.hidden    = true;
    thankYou.hidden = false;

    // Smooth scroll to thank-you
    thankYou.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
})();
