/*
 * Rêve & Réalités : comportements partagés par les 4 pages.
 *  1. Menu mobile (hamburger)
 *  2. Liens pilotés par assets/site-config.js (Facebook, téléphone, e-mail)
 */
(function () {
  'use strict';

  var cfg = window.RR_CONFIG || {};

  // ---------------------------------------------------------------
  // 1. MENU MOBILE
  // ---------------------------------------------------------------
  var toggle = document.getElementById('mobile-menu-toggle');
  var menu = document.getElementById('mobile-menu');

  if (toggle && menu) {
    var icon = toggle.querySelector('.material-symbols-outlined');
    var desktopQuery = window.matchMedia('(min-width: 1024px)');

    var isOpen = function () {
      return !menu.classList.contains('hidden');
    };

    var setOpen = function (open) {
      menu.classList.toggle('hidden', !open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
      if (icon) icon.textContent = open ? 'close' : 'menu';
    };

    toggle.addEventListener('click', function () {
      setOpen(!isOpen());
    });

    // Fermeture après clic sur un lien (utile pour les ancres de la même page).
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });

    // Échap : ferme et rend le focus au bouton.
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) {
        setOpen(false);
        toggle.focus();
      }
    });

    // Clic en dehors du header : ferme.
    document.addEventListener('click', function (e) {
      if (isOpen() && !e.target.closest('header')) setOpen(false);
    });

    // Passage en desktop : ferme (le panneau est de toute façon masqué à ≥ 1024 px).
    var onQueryChange = function (e) {
      if (e.matches) setOpen(false);
    };
    if (desktopQuery.addEventListener) desktopQuery.addEventListener('change', onQueryChange);
    else if (desktopQuery.addListener) desktopQuery.addListener(onQueryChange);
  }

  // ---------------------------------------------------------------
  // 1b. HEADER : état « page défilée » (style dans assets/site.css)
  // ---------------------------------------------------------------
  var header = document.querySelector('header');
  if (header) {
    var syncHeader = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    window.addEventListener('scroll', syncHeader, { passive: true });
    syncHeader();
  }

  // ---------------------------------------------------------------
  // 1c. APPARITION DOUCE DES SECTIONS (amélioration progressive)
  //     Sans IntersectionObserver ou avec « réduire les animations » : rien n'est masqué.
  // ---------------------------------------------------------------
  (function () {
    if (!('IntersectionObserver' in window)) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // La première section (bandeau d'en-tête / hero) reste visible d'emblée.
    var sections = Array.prototype.slice.call(document.querySelectorAll('main section')).slice(1);
    var prepared = [];
    sections.forEach(function (sec) {
      var kids = Array.prototype.filter.call(sec.children, function (c) {
        return !/(^|\s)absolute(\s|$)/.test(c.className || '');   // on ne touche pas aux décors
      });
      if (!kids.length) return;
      kids.forEach(function (k) { k.setAttribute('data-reveal', ''); });
      prepared.push(sec);
    });
    if (!prepared.length) return;

    document.documentElement.classList.add('rr-reveal');

    // Contrôle simple au défilement (sans IntersectionObserver, plus prévisible) :
    // une section se révèle dès que son haut entre dans les 94 % supérieurs de l'écran.
    var pending = prepared.slice();
    var check = function () {
      var vh = window.innerHeight || document.documentElement.clientHeight;
      pending = pending.filter(function (sec) {
        var r = sec.getBoundingClientRect();
        if (r.top < vh * 0.94 && r.bottom > 0) {
          sec.classList.add('is-visible');
          return false;
        }
        return true;
      });
      if (!pending.length) {
        window.removeEventListener('scroll', check);
        window.removeEventListener('resize', check);
      }
    };
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    window.addEventListener('hashchange', check);
    window.addEventListener('load', check);
    check();
    // La mise en page peut encore bouger juste après le chargement (CSS, images) : on recontrôle.
    setTimeout(check, 400);
    setTimeout(check, 1500);
  })();

  // ---------------------------------------------------------------
  // 1d. BOUTON « RETOUR EN HAUT »
  // ---------------------------------------------------------------
  (function () {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'rr-top';
    btn.setAttribute('aria-label', 'Retour en haut de la page');
    btn.innerHTML = '<span aria-hidden="true" class="material-symbols-outlined">arrow_upward</span>';
    document.body.appendChild(btn);

    var sync = function () { btn.classList.toggle('is-on', window.scrollY > 700); };
    window.addEventListener('scroll', sync, { passive: true });
    sync();
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  })();

  // ---------------------------------------------------------------
  // 1e. LIEN D'ÉVITEMENT (« Aller au contenu ») pour la navigation au clavier
  // ---------------------------------------------------------------
  (function () {
    var main = document.querySelector('main');
    if (!main) return;
    if (!main.id) main.id = 'contenu';
    main.setAttribute('tabindex', '-1');
    var skip = document.createElement('a');
    skip.className = 'rr-skip';
    skip.href = '#' + main.id;
    skip.textContent = 'Aller au contenu';
    document.body.insertBefore(skip, document.body.firstChild);
  })();

  // ---------------------------------------------------------------
  // 1f. GALERIE : agrandissement des photos (lightbox)
  //     Clavier (Entrée, flèches, Échap), tactile (balayage), filtres pris en compte.
  // ---------------------------------------------------------------
  (function () {
    var grid = document.getElementById('gallery-grid');
    if (!grid) return;
    var items = Array.prototype.slice.call(grid.querySelectorAll('.gallery-item'));
    if (!items.length) return;

    items.forEach(function (it) {
      var title = ((it.querySelector('h3') || {}).textContent || '').trim();
      it.setAttribute('role', 'button');
      it.setAttribute('tabindex', '0');
      it.setAttribute('aria-haspopup', 'dialog');
      it.setAttribute('aria-label', 'Agrandir la photo : ' + title);
    });

    var lb = null, img, label, title, count, btnClose, btnPrev, btnNext;
    var list = [], index = 0, opener = null, startX = null;

    function isOpen() { return !!lb && !lb.hidden; }

    function build() {
      lb = document.createElement('div');
      lb.className = 'rr-lb';
      lb.setAttribute('role', 'dialog');
      lb.setAttribute('aria-modal', 'true');
      lb.setAttribute('aria-label', 'Galerie de réalisations');
      lb.hidden = true;
      lb.innerHTML =
        '<button type="button" class="rr-lb-btn rr-lb-close" aria-label="Fermer la galerie"><span aria-hidden="true" class="material-symbols-outlined">close</span></button>' +
        '<button type="button" class="rr-lb-btn rr-lb-prev" aria-label="Photo précédente"><span aria-hidden="true" class="material-symbols-outlined">chevron_left</span></button>' +
        '<button type="button" class="rr-lb-btn rr-lb-next" aria-label="Photo suivante"><span aria-hidden="true" class="material-symbols-outlined">chevron_right</span></button>' +
        '<figure class="rr-lb-fig"><img class="rr-lb-img" alt="">' +
        '<figcaption class="rr-lb-cap"><span class="rr-lb-label"></span><strong class="rr-lb-title"></strong><span class="rr-lb-count" aria-live="polite"></span></figcaption></figure>';
      document.body.appendChild(lb);

      img = lb.querySelector('.rr-lb-img');
      label = lb.querySelector('.rr-lb-label');
      title = lb.querySelector('.rr-lb-title');
      count = lb.querySelector('.rr-lb-count');
      btnClose = lb.querySelector('.rr-lb-close');
      btnPrev = lb.querySelector('.rr-lb-prev');
      btnNext = lb.querySelector('.rr-lb-next');

      btnClose.addEventListener('click', close);
      btnPrev.addEventListener('click', function () { show(index - 1); });
      btnNext.addEventListener('click', function () { show(index + 1); });
      // Clic sur le fond (pas sur la photo ni les boutons) : ferme
      lb.addEventListener('click', function (e) {
        if (e.target === lb || e.target.classList.contains('rr-lb-fig')) close();
      });
      // Balayage horizontal sur mobile
      lb.addEventListener('touchstart', function (e) { startX = e.changedTouches[0].clientX; }, { passive: true });
      lb.addEventListener('touchend', function (e) {
        if (startX === null) return;
        var dx = e.changedTouches[0].clientX - startX;
        startX = null;
        if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
      }, { passive: true });
    }

    function show(i) {
      if (!list.length) return;
      index = (i + list.length) % list.length;
      var it = list[index];
      var src = it.querySelector('img');
      img.src = src.getAttribute('src');
      img.alt = src.alt || '';
      label.textContent = ((it.querySelector('span') || {}).textContent || '').trim();
      title.textContent = ((it.querySelector('h3') || {}).textContent || '').trim();
      count.textContent = (index + 1) + ' / ' + list.length;
      // Précharge les voisines pour un défilement instantané
      [index - 1, index + 1].forEach(function (n) {
        var nb = list[(n + list.length) % list.length].querySelector('img');
        if (nb) new Image().src = nb.getAttribute('src');
      });
    }

    function open(item) {
      list = items.filter(function (i) { return window.getComputedStyle(i).display !== 'none'; });
      if (!list.length) return;
      if (!lb) build();
      opener = item;
      lb.hidden = false;
      document.documentElement.classList.add('rr-lb-open');
      show(Math.max(0, list.indexOf(item)));
      btnClose.focus();
    }

    function close() {
      if (!isOpen()) return;
      lb.hidden = true;
      document.documentElement.classList.remove('rr-lb-open');
      if (opener && document.body.contains(opener) && window.getComputedStyle(opener).display !== 'none') opener.focus();
      opener = null;
    }

    grid.addEventListener('click', function (e) {
      var it = e.target.closest('.gallery-item');
      if (it && grid.contains(it)) open(it);
    });
    grid.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var it = e.target.closest('.gallery-item');
      if (!it || e.target !== it) return;
      e.preventDefault();
      open(it);
    });

    document.addEventListener('keydown', function (e) {
      if (!isOpen()) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1); }
      else if (e.key === 'Tab') {
        // Le focus reste dans la fenêtre (3 boutons)
        var f = [btnClose, btnPrev, btnNext];
        var i = f.indexOf(document.activeElement);
        e.preventDefault();
        f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
      }
    });
  })();

  // ---------------------------------------------------------------
  // 1g. MOBILE : barre d'actions rapides (Appeler / Demander un devis)
  //     Créée seulement si un téléphone valide est configuré ; visible après un peu de défilement.
  // ---------------------------------------------------------------
  (function () {
    var phone = String((window.RR_CONFIG || {}).phone || '').replace(/[^\d+]/g, '');
    if (!/^\+?\d{8,15}$/.test(phone)) return;
    var onContact = /(^|\/)contact\.html$/.test(location.pathname);

    var bar = document.createElement('nav');
    bar.className = 'rr-bar';
    bar.setAttribute('aria-label', 'Actions rapides');
    bar.innerHTML =
      '<a class="rr-bar-call" href="tel:' + phone + '"><span aria-hidden="true" class="material-symbols-outlined">call</span><span>Appeler</span></a>' +
      (onContact ? '' : '<a class="rr-bar-quote" href="contact.html#formulaire-devis"><span aria-hidden="true" class="material-symbols-outlined">edit_note</span><span>Demander un devis</span></a>');
    document.body.appendChild(bar);
    document.documentElement.classList.add('rr-has-bar');

    var sync = function () { bar.classList.toggle('is-on', window.scrollY > 320); };
    window.addEventListener('scroll', sync, { passive: true });
    sync();
  })();

  // ---------------------------------------------------------------
  // 1h. UNIVERS « DÉCORATION D'ÉVÉNEMENTS » (purement décoratif, masqué aux lecteurs d'écran)
  //     Guirlande lumineuse en haut de page ; sur l'accueil : ballons qui s'élèvent + arcade festonnée.
  // ---------------------------------------------------------------
  (function () {
    var first = document.querySelector('main section');
    if (!first) return;
    first.classList.add('rr-garland');

    var hero = document.querySelector('section.focus-on-dark');
    if (!hero || hero !== first) return;

    var content = hero.querySelector(':scope > div.relative');
    var balloons = document.createElement('div');
    balloons.className = 'rr-balloons';
    balloons.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < 6; i++) balloons.appendChild(document.createElement('span')).className = 'rr-balloon';
    hero.insertBefore(balloons, content);

    var scallop = document.createElement('div');
    scallop.className = 'rr-scallop';
    scallop.setAttribute('aria-hidden', 'true');
    hero.appendChild(scallop);
  })();

  // ---------------------------------------------------------------
  // 2. LIENS PILOTÉS PAR LA CONFIG (jamais de valeur inventée)
  // ---------------------------------------------------------------
  function isHttpUrl(value) {
    try {
      var u = new URL(value);
      return u.protocol === 'https:' || u.protocol === 'http:';
    } catch (err) {
      return false;
    }
  }

  function reveal(el) {
    el.classList.remove('hidden');
  }

  // Facebook : n'apparaît que si une URL valide est fournie.
  var facebookUrl = (cfg.facebookUrl || '').trim();
  if (facebookUrl) {
    if (isHttpUrl(facebookUrl)) {
      document.querySelectorAll('[data-social-link="facebook"]').forEach(function (a) {
        a.setAttribute('href', facebookUrl);
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer');
        reveal(a);
      });
    } else {
      console.warn('[Rêve & Réalités] facebookUrl invalide dans assets/site-config.js :', facebookUrl);
    }
  }

  // Téléphone : tel: + texte affiché.
  var phone = (cfg.phone || '').trim();
  if (phone) {
    var phoneHref = phone.replace(/[^\d+]/g, '');
    if (/^\+?\d{8,15}$/.test(phoneHref)) {
      document.querySelectorAll('[data-contact-link="phone"]').forEach(function (a) {
        a.setAttribute('href', 'tel:' + phoneHref);
        var label = a.querySelector('[data-contact-text]');
        if (label) label.textContent = phone;
        reveal(a);
      });
    } else {
      console.warn('[Rêve & Réalités] phone invalide dans assets/site-config.js :', phone);
    }
  }

  // E-mail : mailto: + texte affiché.
  var email = (cfg.email || '').trim();
  if (email) {
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      document.querySelectorAll('[data-contact-link="email"]').forEach(function (a) {
        a.setAttribute('href', 'mailto:' + email);
        var label = a.querySelector('[data-contact-text]');
        if (label) label.textContent = email;
        reveal(a);
      });
    } else {
      console.warn('[Rêve & Réalités] email invalide dans assets/site-config.js :', email);
    }
  }
})();
