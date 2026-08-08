/* ============================================================
   Lucas Signorini — Portfolio interactions
   ============================================================ */
(function () {
  'use strict';

  /* --- page transition style ---
     Change TRANSITION to one of: 'fade' | 'rise' | 'slide' | 'instant'
     (the default cross-fade lives in site.css :root / body).           */
  var TRANSITION = 'fade';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* placeholder links (resume, etc.) do nothing until a real file/href is set */
  document.querySelectorAll('a[href="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); });
  });

  /* ---------- mobile menu ---------- */
  var menuBtn = document.querySelector('.menu-btn');
  var navLinks = document.querySelector('.nav-links');
  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', function () { navLinks.classList.toggle('open'); });
    navLinks.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { navLinks.classList.remove('open'); });
    });
  }

  /* ---------- media lightbox + play-once inline video ----------
     Images: click to zoom. Inline video: plays once on load; after that a
     click replays it inline; a click while it is playing opens the zoom.     */
  var zoomImgs = document.querySelectorAll('.pimg img');
  var inlineVids = document.querySelectorAll('.pimg video, .video-feature video, .slide video');
  if (zoomImgs.length || inlineVids.length) {
    var lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML = '<img alt=""><video playsinline controls></video>';
    document.body.appendChild(lb);
    var lbImg = lb.querySelector('img');
    var lbVid = lb.querySelector('video');
    lbImg.style.display = 'none';
    lbVid.style.display = 'none';
    var closeLb = function () { lb.classList.remove('open'); lbVid.pause(); };
    lbVid.addEventListener('click', function (e) { e.stopPropagation(); });
    lb.addEventListener('click', closeLb);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLb(); });

    var openImg = function (im) {
      lbVid.pause();
      lbVid.style.display = 'none';
      lbImg.style.display = 'block';
      lbImg.src = im.currentSrc || im.src;
      lbImg.alt = im.alt || '';
      lb.classList.add('open');
    };
    var openVid = function (v) {
      lbImg.style.display = 'none';
      lbVid.style.display = 'block';
      lbVid.src = v.currentSrc || v.src;
      lbVid.muted = false;
      lbVid.currentTime = 0;
      var pr = lbVid.play();
      if (pr && pr.catch) pr.catch(function () {});
      lb.classList.add('open');
    };

    zoomImgs.forEach(function (im) {
      im.addEventListener('click', function () { openImg(im); });
    });

    var PLAY_SVG = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
    inlineVids.forEach(function (v) {
      var wrap = v.parentElement;
      var badge = document.createElement('span');
      badge.className = 'play-badge';
      badge.innerHTML = PLAY_SVG;
      wrap.appendChild(badge);
      var setPlaying = function () { wrap.classList.toggle('is-playing', !v.paused && !v.ended); };
      v.addEventListener('play', setPlaying);
      v.addEventListener('pause', setPlaying);
      v.addEventListener('ended', function () {
        wrap.classList.remove('is-playing');
        v.removeAttribute('autoplay'); // prevent load() from auto-replaying (the loop bug)
        v.load();                      // restore the poster frame; stays paused
      });
      setPlaying();
      v.addEventListener('click', function () {
        if (v.paused || v.ended) {
          if (v.ended) { v.currentTime = 0; }
          var pr = v.play();
          if (pr && pr.catch) pr.catch(function () {});
        } else {
          v.pause();
          openVid(v);
        }
      });
    });
  }

  /* ---------- monogram -> full name on scroll (homepage) ---------- */
  var brand = document.getElementById('brand');
  if (brand && document.body.classList.contains('home')) {
    var upd = function () { brand.classList.toggle('expanded', window.scrollY > 210); };
    upd();
    window.addEventListener('scroll', upd, { passive: true });
  }

  /* ---------- active nav link (highlight only, not a reveal) ---------- */
  var sections = document.querySelectorAll('section[id]');
  var linkFor = {};
  document.querySelectorAll('.nav-links a[href^="#"]').forEach(function (a) {
    linkFor[a.getAttribute('href').slice(1)] = a;
  });
  if (sections.length && 'IntersectionObserver' in window) {
    var navObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var map = { experience: 'experience', research: 'experience', contact: 'contact' };
        var id = map[e.target.id] || e.target.id;
        Object.keys(linkFor).forEach(function (k) { linkFor[k].classList.remove('active'); });
        if (linkFor[id]) linkFor[id].classList.add('active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { navObs.observe(s); });
  }

  /* ---------- project filter bar ---------- */
  var chips = document.querySelectorAll('.chip');
  var rows = document.querySelectorAll('.proj-row');
  var emptyMsg = document.querySelector('.filter-empty');
  if (chips.length && rows.length) {
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        chips.forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');
        var f = chip.getAttribute('data-filter');
        var shown = 0;
        rows.forEach(function (row) {
          var tags = (row.getAttribute('data-tags') || '').split(/\s+/);
          var ok = (f === 'all') || tags.indexOf(f) !== -1;
          row.classList.toggle('hide', !ok);
          if (ok) shown++;
        });
        if (emptyMsg) emptyMsg.style.display = shown ? 'none' : 'block';
      });
    });
  }

  /* ---------- project rows navigate via a real stretched <a class="proj-link">
     (native link, keyboard-accessible; the fade handler below catches it).
     No JS click handler needed here anymore. ---------- */

  /* ---------- hover video previews ---------- */
  if (!reduce) {
    document.querySelectorAll('.thumb[data-video]').forEach(function (thumb) {
      var src = thumb.getAttribute('data-video');
      if (!src) return;
      var vid = null;
      thumb.addEventListener('mouseenter', function () {
        if (!vid) {
          vid = document.createElement('video');
          vid.src = src; vid.muted = true; vid.loop = true;
          vid.playsInline = true; vid.preload = 'none';
          thumb.appendChild(vid);
          vid.addEventListener('loadeddata', function () { vid.classList.add('ready'); });
        }
        vid.play().catch(function () {});
      });
      thumb.addEventListener('mouseleave', function () {
        if (vid) { vid.pause(); vid.currentTime = 0; }
      });
    });
  }

  /* ---------- click-to-decrypt email reveal (anti-scraper) ---------- */
  function copyText(text, label) {
    var flash = function (ok) {
      label.textContent = ok ? '✓ copied to clipboard' : text;
      setTimeout(function () { label.textContent = text; }, 1300);
    };
    var legacy = function () {
      try {
        var ta = document.createElement('textarea');
        ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.focus(); ta.select();
        var ok = document.execCommand('copy'); document.body.removeChild(ta); flash(ok);
      } catch (err) { flash(false); }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { flash(true); }, legacy);
    } else { legacy(); }
  }
  document.querySelectorAll('.email-reveal').forEach(function (btn) {
    var label = btn.querySelector('.et') || btn;
    var pool = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@._-';
    var email = (btn.getAttribute('data-e') || '').split(',').map(function (n) { return String.fromCharCode(+n); }).join('');
    var state = 'idle';
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      if (!email || state === 'animating') return;
      if (state === 'revealed') { copyText(email, label); return; }
      state = 'animating';
      btn.setAttribute('title', 'Click to copy');
      if (reduce) { label.textContent = email; state = 'revealed'; return; }
      var frame = 0, total = email.length * 3;
      var iv = setInterval(function () {
        var locked = Math.floor(frame / 3);
        label.textContent = email.split('').map(function (ch, i) {
          if (ch === ' ') return ' ';
          return i < locked ? email[i] : pool[Math.floor(Math.random() * pool.length)];
        }).join('');
        frame++;
        if (frame > total) { clearInterval(iv); label.textContent = email; state = 'revealed'; }
      }, 35);
    });
  });

  /* ---------- case-study image carousel ---------- */
  document.querySelectorAll('[data-carousel]').forEach(function (car) {
    var track = car.querySelector('.carousel-track');
    var slides = car.querySelectorAll('.slide');
    var dotsWrap = car.querySelector('.carousel-dots');
    if (!track || !slides.length) return;
    var i = 0, dots = [];
    slides.forEach(function (_, idx) {
      var d = document.createElement('button');
      d.className = 'cdot' + (idx === 0 ? ' active' : '');
      d.setAttribute('aria-label', 'Go to image ' + (idx + 1));
      d.addEventListener('click', function () { go(idx); });
      if (dotsWrap) dotsWrap.appendChild(d);
      dots.push(d);
    });
    var playTimer = null;
    function activateMedia() {
      // pause any video on a slide we're leaving
      slides.forEach(function (s) {
        var v = s.querySelector('video');
        if (v && !v.paused) v.pause();
      });
      // once we've fully moved to a slide, play its video once (from the start)
      var active = slides[i];
      var vid = active && active.querySelector('video');
      if (playTimer) { clearTimeout(playTimer); playTimer = null; }
      if (vid) {
        playTimer = setTimeout(function () {
          if (slides[i] === active) {          // still here after the slide settled
            vid.currentTime = 0;
            var pr = vid.play();
            if (pr && pr.catch) pr.catch(function () {});
          }
        }, 400);                                // > the 360ms track transition
      }
    }
    function go(n) {
      i = (n + slides.length) % slides.length;
      track.style.transform = 'translateX(-' + (i * 100) + '%)';
      dots.forEach(function (d, k) { d.classList.toggle('active', k === i); });
      activateMedia();
    }
    var nx = car.querySelector('.next'), pv = car.querySelector('.prev');
    if (nx) nx.addEventListener('click', function () { go(i + 1); });
    if (pv) pv.addEventListener('click', function () { go(i - 1); });
  });

  /* ---------- interactive phase timeline (click a phase -> its photos) ---------- */
  document.querySelectorAll('[data-timeline]').forEach(function (tl) {
    var nodes = tl.querySelectorAll('.ph-node');
    var panels = tl.querySelectorAll('.ph-panel');
    nodes.forEach(function (node) {
      node.addEventListener('click', function () {
        var p = node.getAttribute('data-phase');
        nodes.forEach(function (n) { n.classList.toggle('active', n === node); });
        panels.forEach(function (pan) { pan.hidden = pan.getAttribute('data-panel') !== p; });
      });
    });
  });

  /* ---------- post-download "say hi" popup (non-blocking) ----------
     The resume link downloads the PDF natively (download attr); we don't
     block it — we just invite the visitor to say who they are afterward.  */
  var resumeLinks = document.querySelectorAll('.js-resume');
  if (resumeLinks.length) {
    var rm = document.createElement('div');
    rm.className = 'rmodal';
    rm.innerHTML =
      '<div class="rmodal-card" role="dialog" aria-modal="true" aria-label="Say hi">' +
        '<h3>Thanks for grabbing my resume.</h3>' +
        '<p>Your download is already done, so you\'re all set. If you feel like it, tell me who you are so I know you stopped by. <strong>Every field below is optional.</strong></p>' +
        '<label for="rm-name">Name</label>' +
        '<input id="rm-name" type="text" placeholder="Your name" autocomplete="name">' +
        '<label for="rm-email">Email</label>' +
        '<input id="rm-email" type="email" placeholder="So I can reply, if you\'d like" autocomplete="email">' +
        '<label for="rm-note">Note</label>' +
        '<textarea id="rm-note" rows="3" placeholder="e.g. your company or role, a job you\'re hiring for, or just a hello"></textarea>' +
        '<div class="rmodal-actions">' +
          '<button class="rmodal-send" type="button">Send</button>' +
          '<button class="rmodal-skip" type="button">No thanks</button>' +
        '</div>' +
        '<div class="rmodal-foot">or just <a class="rmodal-li" href="https://www.linkedin.com/in/lucas-d-signorini/" target="_blank" rel="noopener">connect on LinkedIn</a></div>' +
      '</div>';
    document.body.appendChild(rm);
    var closeRm = function () { rm.classList.remove('open'); };
    rm.addEventListener('click', function (e) { if (e.target === rm) closeRm(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeRm(); });
    rm.querySelector('.rmodal-skip').addEventListener('click', closeRm);
    rm.querySelector('.rmodal-li').addEventListener('click', function (e) {
      e.preventDefault();
      var url = e.currentTarget.href;
      var w = window.open(url, '_blank', 'noopener');
      if (!w) window.location.href = url;   // fallback if the new tab is blocked
      closeRm();
    });
    rm.querySelector('.rmodal-send').addEventListener('click', function () {
      var name = (rm.querySelector('#rm-name').value || '').trim();
      var email = (rm.querySelector('#rm-email').value || '').trim();
      var note = (rm.querySelector('#rm-note').value || '').trim();
      var body = 'Name: ' + name + '\nEmail: ' + email + '\n\n' + note;
      window.location.href = 'mailto:lsignori@andrew.cmu.edu' +
        '?subject=' + encodeURIComponent('Hi Lucas, saw your portfolio') +
        '&body=' + encodeURIComponent(body);
      closeRm();
    });
    resumeLinks.forEach(function (a) {
      a.addEventListener('click', function () {
        // don't preventDefault — let the PDF download — just invite a hello after
        setTimeout(function () {
          rm.classList.add('open');
          var n = rm.querySelector('#rm-name');
          if (n) n.focus();
        }, 600);
      });
    });
  }

  /* ---------- cross-fade page transitions on internal nav ---------- */
  function go(href) {
    if (reduce || TRANSITION === 'instant') { window.location.href = href; return; }
    document.body.classList.add('is-leaving');
    setTimeout(function () { window.location.href = href; }, 170);
  }
  document.querySelectorAll('a[href$=".html"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (a.target === '_blank' || e.metaKey || e.ctrlKey) return;
      e.preventDefault();
      go(a.getAttribute('href'));
    });
  });
})();
