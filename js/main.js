// Shared site behaviour: mobile nav toggle + footer year.
(function () {
  'use strict';

  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  document.querySelectorAll('.js-current-year').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
