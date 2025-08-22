(function() {
  const AGE_KEY = 'ageVerified';

  function byId(id) { return document.getElementById(id); }

  function setYear() {
    var span = byId('year');
    if (span) span.textContent = String(new Date().getFullYear());
  }

  function showAgeGate() {
    const modal = byId('ageGate');
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'false');
    // focus first button for accessibility
    const btn = byId('btnConfirmAge');
    if (btn) btn.focus();
  }

  function hideAgeGate() {
    const modal = byId('ageGate');
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'true');
  }

  function initAgeGate() {
    const confirmed = localStorage.getItem(AGE_KEY) === 'true';
    if (!confirmed) {
      showAgeGate();
    }

    const confirmBtn = byId('btnConfirmAge');
    const leaveBtn = byId('btnLeave');

    if (confirmBtn) {
      confirmBtn.addEventListener('click', function() {
        localStorage.setItem(AGE_KEY, 'true');
        hideAgeGate();
      });
    }

    if (leaveBtn) {
      leaveBtn.addEventListener('click', function() {
        window.location.href = 'https://www.google.com';
      });
    }
  }

  document.addEventListener('DOMContentLoaded', function() {
    setYear();
    initAgeGate();
  });
})();