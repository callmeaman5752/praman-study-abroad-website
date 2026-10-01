'use strict';
document.addEventListener('DOMContentLoaded', () => {
  // 1. Header and mobile navigation
  const toggle = document.querySelector('.menu-toggle'),
    nav = document.querySelector('.main-nav'),
    header = document.querySelector('.site-header');
  const closeMenu = (restore = false) => {
    if (!toggle || !nav) return;
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation menu');
    if (restore) toggle.focus();
  };
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    });
    nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => closeMenu()));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('open')) closeMenu(true);
    });
    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target) && !toggle.contains(e.target)) closeMenu();
    });
    document.addEventListener('focusin', (e) => {
      if (!nav.contains(e.target) && e.target !== toggle) closeMenu();
    });
    window.addEventListener(
      'resize',
      () => {
        if (window.innerWidth > 1100) closeMenu();
      },
      { passive: true },
    );
  }
  // 2. Current-page navigation state
  const current = (location.pathname.split('/').pop() || 'index').replace(/\.html$/, '');
  document.querySelectorAll('.nav-link').forEach((a) => {
    const target = (a.getAttribute('href') || '').replace(/\.html$/, '');
    if (
      target === current ||
      (current.startsWith('country-') && target === 'study-abroad') ||
      (current.startsWith('test-') && target === 'test-preparation') ||
      ((current.startsWith('guide-') || ['budget-planner', 'compare', 'faq'].includes(current)) &&
        target === 'resources')
    ) {
      a.classList.add('active');
      if (target === current) a.setAttribute('aria-current', 'page');
    }
  });
  // 3. Test preparation dropdown and keyboard controls
  const dropdown = document.querySelector('.nav-dropdown'),
    subToggle = document.querySelector('.submenu-toggle'),
    submenu = document.querySelector('.nav-submenu');
  if (dropdown && subToggle && submenu) {
    const setSubmenu = (open) => {
      submenu.hidden = !open;
      subToggle.setAttribute('aria-expanded', String(open));
    };
    subToggle.addEventListener('click', () => setSubmenu(submenu.hidden));
    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target)) setSubmenu(false);
    });
    document.addEventListener('focusin', (e) => {
      if (!dropdown.contains(e.target)) setSubmenu(false);
    });
    dropdown.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !submenu.hidden) {
        e.stopPropagation();
        setSubmenu(false);
        subToggle.focus();
      }
    });
    submenu.querySelectorAll('a').forEach((a) => {
      if (a.getAttribute('href') === current + '.html') a.setAttribute('aria-current', 'page');
    });
    toggle?.addEventListener('click', () => {
      if (!nav.classList.contains('open')) setSubmenu(false);
    });
  }
  // 4. Footer year and header scroll treatment
  document
    .querySelectorAll('#year')
    .forEach((e) => (e.textContent = String(new Date().getFullYear())));
  const scroll = () => header?.classList.toggle('is-scrolled', window.scrollY > 8);
  scroll();
  window.addEventListener('scroll', scroll, { passive: true });
  // 5. Enquiry forms: validation, submission and error recovery
  // A lead is accepted only after the form service confirms it; never on a click.
  document.querySelectorAll('form[data-enhanced-form="true"]').forEach((form) => {
    let pending = false;
    const btn = form.querySelector('button[type="submit"]'),
      status = form.querySelector('.form-status');
    const original = btn?.textContent || 'Send enquiry';
    const show = (message, state = 'error') => {
      if (status) {
        status.hidden = false;
        status.textContent = message;
        status.dataset.state = state;
      }
    };
    const reset = () => {
      pending = false;
      form.removeAttribute('aria-busy');
      if (btn) {
        btn.disabled = false;
        btn.textContent = original;
      }
    };
    window.addEventListener('pageshow', reset);
    // Keep FormSubmit metadata correct on custom domains and GitHub Pages project URLs.
    const field = form.querySelector('[name="current_page"]');
    if (field) field.value = location.pathname;
    const sourceUrl = form.querySelector('[name="_url"]'),
      nextUrl = form.querySelector('[name="_next"]');
    if (sourceUrl) sourceUrl.value = location.href.split('#')[0];
    if (nextUrl) nextUrl.value = new URL('thank-you.html', location.href).href;
    const nameInput = form.querySelector('[name="name"]'),
      phone = form.querySelector('[name="phone"]');
    const validateName = () =>
      nameInput?.setCustomValidity(
        nameInput.value.trim().length < 2 ? 'Please enter your name (at least 2 characters).' : '',
      );
    const validatePhone = () => {
      if (!phone) return;
      phone.setCustomValidity(
        !/^[0-9]{10}$/.test(phone.value)
          ? 'Enter exactly 10 digits, without +977, spaces or symbols.'
          : '',
      );
    };
    nameInput?.addEventListener('input', validateName);
    nameInput?.addEventListener('blur', validateName);
    if (phone) {
      // Reject invalid insertions rather than silently changing a phone number.
      // In particular, a pasted +977 number must not be truncated to ten digits.
      let previousPhone = /^[0-9]{0,10}$/.test(phone.value) ? phone.value : '';
      const permitsInsertion = (text) => {
        const start = phone.selectionStart ?? phone.value.length;
        const end = phone.selectionEnd ?? start;
        const proposed = phone.value.slice(0, start) + text + phone.value.slice(end);
        return /^[0-9]{0,10}$/.test(proposed);
      };
      phone.addEventListener('beforeinput', (event) => {
        if (event.inputType?.startsWith('insert') && event.data !== null) {
          if (!permitsInsertion(event.data)) event.preventDefault();
        }
      });
      phone.addEventListener('paste', (event) => {
        const pasted = event.clipboardData?.getData('text');
        if (pasted !== undefined && !permitsInsertion(pasted)) event.preventDefault();
      });
      phone.addEventListener('input', () => {
        // Covers autofill and browsers without cancellable beforeinput support.
        if (/^[0-9]{0,10}$/.test(phone.value)) previousPhone = phone.value;
        else phone.value = previousPhone;
        validatePhone();
        if (phone.validity.valid) phone.removeAttribute('aria-invalid');
      });
      phone.addEventListener('blur', () => {
        validatePhone();
        if (phone.value && !phone.validity.valid) phone.setAttribute('aria-invalid', 'true');
        else phone.removeAttribute('aria-invalid');
      });
    }
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (pending) return;
      // A new attempt must not reuse confirmation from an earlier enquiry.
      try {
        sessionStorage.removeItem('praman-enquiry-submitted');
      } catch {}
      form
        .querySelectorAll('input[name="name"],input[name="email"],input[name="phone"]')
        .forEach((input) => {
          input.value = input.value.trim();
        });
      validateName();
      validatePhone();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      if (!navigator.onLine) {
        show(
          'You appear to be offline. Reconnect and select Send again. Your entries have been kept. You can also call +977 9715500456.',
        );
        return;
      }
      if (form.querySelector('[name="_honey"]')?.value) {
        show('We could not send this enquiry. Please call our team for help.');
        return;
      }
      pending = true;
      form.setAttribute('aria-busy', 'true');
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Sending enquiry…';
      }
      show('Sending your enquiry. Please keep this page open.', 'sending');
      try {
        // Keep the current page details fresh for both Google Sheets and email delivery.
        const pageUrl = location.href.split('#')[0];
        const currentPage = form.querySelector('[name="current_page"]');
        const sourceUrl = form.querySelector('[name="_url"]');
        const nextUrl = form.querySelector('[name="_next"]');
        if (currentPage) currentPage.value = pageUrl;
        if (sourceUrl) sourceUrl.value = pageUrl;
        if (nextUrl) nextUrl.value = new URL('thank-you.html', location.href).href;

        // Save a best-effort copy to the Praman Google Sheet. This is deliberately
        // non-blocking: email delivery must still continue if Sheets is unavailable.
        const sheetEndpoint =
          'https://script.google.com/macros/s/AKfycbxYFaLTfGfr3fFa5PGLkltkfe1ViDm8gF0CuEEJ2i51LZw6tnBhW7xpNS6BXVLvKrc0Lw/exec';
        const formData = new FormData(form);
        const sheetPayload = new URLSearchParams();
        formData.forEach((value, key) => {
          if (typeof value === 'string' && !key.startsWith('_')) sheetPayload.append(key, value);
        });
        const aliasMap = {
          name: 'fullName',
          phone: 'phoneNumber',
          country: 'interestedCountry',
          intake: 'preferredIntake',
          source_page: 'sourcePage',
          current_page: 'currentPage',
        };
        Object.entries(aliasMap).forEach(([source, alias]) => {
          const value = formData.get(source);
          if (typeof value === 'string' && value && !sheetPayload.has(alias))
            sheetPayload.append(alias, value);
        });
        sheetPayload.set('pageUrl', pageUrl);
        sheetPayload.set('submittedAt', new Date().toISOString());
        const sheetColumns = {
          'Full Name': formData.get('name') || '',
          'Phone Number': formData.get('phone') || '',
          Email: formData.get('email') || '',
          'Interested Country': formData.get('country') || '',
          Qualification: formData.get('qualification') || '',
          'Preferred Intake': formData.get('intake') || '',
          Message: formData.get('message') || '',
          'Source Page': formData.get('source_page') || '',
          'Page URL': pageUrl,
          Consent: formData.get('consent') || '',
          Status: 'New',
          Remarks: '',
        };
        Object.entries(sheetColumns).forEach(([key, value]) => sheetPayload.set(key, String(value)));

        // Dispatch both deliveries with keepalive so navigation to the local thank-you
        // page does not cancel the requests. no-cors is intentional for static hosting.
        const sheetRequest = fetch(sheetEndpoint, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
          body: sheetPayload.toString(),
          credentials: 'omit',
          cache: 'no-store',
          keepalive: true,
        });

        const emailPayload = new FormData(form);
        const emailRequest = fetch(form.action, {
          method: 'POST',
          mode: 'no-cors',
          body: emailPayload,
          credentials: 'omit',
          cache: 'no-store',
          keepalive: true,
        });

        show('Submitting your enquiry…', 'sending');

        // Give the browser a brief chance to dispatch both requests. Opaque no-cors
        // responses cannot be inspected, so the page confirms successful dispatch,
        // not a server-side Google Sheet row check.
        await Promise.race([
          Promise.allSettled([sheetRequest, emailRequest]),
          new Promise((resolve) => window.setTimeout(resolve, 1800)),
        ]);

        try {
          sessionStorage.setItem('praman-enquiry-submitted', String(Date.now()));
        } catch {}

        const thankYouUrl = new URL('thank-you.html', location.href);
        location.assign(thankYouUrl.href);
        return;
      } catch (error) {
        show(
          'We could not start the enquiry submission. Your entries have been kept. Please select Send again, or call +977 9715500456.',
        );
        reset();
      }
    });
  });
  // 6. Thank You page: a 30-minute receipt, containing no personal data.
  const thanks = document.getElementById('enquiry-message');
  if (thanks) {
    try {
      const accepted = Number(sessionStorage.getItem('praman-enquiry-submitted'));
      if (accepted && Date.now() >= accepted && Date.now() - accepted < 30 * 60 * 1000) {
        const panel = document.getElementById('enquiry-confirmation');
        panel?.setAttribute('data-confirmed', 'true');
        document.getElementById('enquiry-heading').textContent = 'Thank you.';
        document.getElementById('enquiry-title-rest').textContent = 'Your enquiry is on its way.';
        document.getElementById('enquiry-status').textContent = 'Enquiry submitted';
        document.getElementById('enquiry-status-sub').textContent = 'We have received your request';
        thanks.textContent =
          'Your enquiry has been submitted. Our team will review the details you shared and contact you to discuss your study plans and suitable next steps.';
        document.getElementById('enquiry-primary').setAttribute('href', 'study-abroad.html');
        document.getElementById('enquiry-primary-label').textContent = 'Explore destinations';
        document.getElementById('enquiry-note').textContent =
          'No need to submit the form again. If you need to update anything, call, email or WhatsApp our team.';

        const receipt = document.getElementById('enquiry-receipt');
        if (receipt) receipt.hidden = false;
        const submittedAt = new Date(accepted);
        const timeLabel = document.getElementById('enquiry-time');
        if (timeLabel && !Number.isNaN(submittedAt.getTime())) {
          timeLabel.textContent = `Received ${submittedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }

        if (panel && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          const shades = ['#2d66df', '#081a38', '#7da6ff', '#35a66f'];
          for (let i = 0; i < 14; i += 1) {
            const bit = document.createElement('span');
            bit.className = 'confirmation-confetti';
            bit.style.left = `${42 + Math.random() * 16}%`;
            bit.style.top = `${16 + Math.random() * 12}%`;
            bit.style.color = shades[i % shades.length];
            bit.style.setProperty('--confetti-x', `${(Math.random() - 0.5) * 210}px`);
            bit.style.setProperty('--confetti-y', `${55 + Math.random() * 130}px`);
            bit.style.animationDelay = `${Math.random() * 140}ms`;
            panel.appendChild(bit);
            window.setTimeout(() => bit.remove(), 1600);
          }
        }
        // Keep a short-lived, non-personal receipt so a refresh does not lose confirmation.
      }
    } catch {}
  }
  // 7. Budget planner
  const budget = document.querySelector('#budget-form');
  if (budget) {
    budget.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!budget.reportValidity()) return;
      const val = (id) => Number(document.getElementById(id).value);
      const tuition = val('tuition'),
        living = val('living') * val('months'),
        travel = val('travel'),
        other = val('other'),
        funding = val('funding'),
        buffer = val('buffer');
      if (
        ![tuition, living, travel, other, funding, buffer].every(
          (v) => Number.isFinite(v) && v >= 0,
        )
      )
        return;
      const subtotal = tuition + living + travel + other,
        contingency = (subtotal * buffer) / 100,
        gross = subtotal + contingency,
        total = Math.max(0, gross - funding),
        currency = document.getElementById('currency').value;
      const money = (v) =>
        currency + ' ' + new Intl.NumberFormat('en-NP', { maximumFractionDigits: 0 }).format(v);
      document.getElementById('budget-total').textContent = money(total);
      document.getElementById('budget-breakdown').textContent =
        'Base costs: ' +
        money(subtotal) +
        '. Contingency: ' +
        money(contingency) +
        '. Estimated costs before funding: ' +
        money(gross) +
        '.';
      document.getElementById('budget-funding').textContent =
        'Confirmed funding: ' +
        money(funding) +
        '. ' +
        (funding > gross
          ? 'Funding exceeds this estimate by ' + money(funding - gross) + '.'
          : 'Estimated amount still to fund: ' + money(total) + '.');
    });
  }
  // 8. Destination comparison
  const comparison = document.querySelector('#comparison');
  if (comparison) {
    fetch('assets/data/destinations.json')
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((countries) => {
        const selects = [...document.querySelectorAll('[id^="compare-"]')];
        const render = () => {
          const chosen = [...new Set(selects.map((s) => s.value).filter(Boolean))];
          comparison.replaceChildren();
          if (!chosen.length) {
            const p = document.createElement('p');
            p.textContent = 'Select destinations to begin comparing.';
            comparison.append(p);
            return;
          }
          chosen.forEach((slug) => {
            const item = countries.find((c) => c.slug === slug);
            if (!item) return;
            const card = document.createElement('article');
            card.className = 'card compare-item';
            const img = document.createElement('img');
            img.className = 'compare-photo';
            img.src = 'assets/images/countries/' + item.slug + '.jpg';
            img.alt = item.name + ' study destination';
            img.width = 800;
            img.height = 1200;
            card.append(img);
            const h = document.createElement('h3');
            h.textContent = item.name;
            card.append(h);
            const dl = document.createElement('dl');
            [
              ['Planning currency', item.currency],
              ['Entry requirements', 'Check the exact course and institution.'],
              ['Costs and intakes', 'Confirm current tuition, city costs and deadlines.'],
              ['Scholarships', 'Check eligibility and award conditions.'],
            ].forEach(([a, b]) => {
              const dt = document.createElement('dt'),
                dd = document.createElement('dd');
              dt.textContent = a;
              dd.textContent = b;
              dl.append(dt, dd);
            });
            card.append(dl);
            const link = document.createElement('a');
            link.className = 'btn btn-outline';
            link.href = 'country-' + item.slug + '.html';
            link.textContent = 'Explore ' + item.name;
            card.append(link);
            comparison.append(card);
          });
        };
        selects.forEach((s) => s.addEventListener('change', render));
        render();
      })
      .catch(() => {
        comparison.textContent =
          'The comparison could not load. You can still explore all destinations from the Destinations menu.';
      });
  }
});
