'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const picker = document.querySelector('#destination-focus');
  const cards = [...document.querySelectorAll('[data-destination-focus]')];
  const status = document.querySelector('#destination-status');
  if (!picker || !cards.length) return;

  const update = () => {
    const selected = picker.value;
    let visible = 0;
    cards.forEach((card) => {
      const matches =
        selected === 'all' || card.dataset.destinationFocus.split(',').includes(selected);
      card.hidden = !matches;
      if (matches) visible += 1;
      card.classList.toggle('is-match', matches && selected !== 'all');
    });
    if (status) {
      status.textContent =
        selected === 'all'
          ? 'Showing all destination guides.'
          : `Showing ${visible} guide${visible === 1 ? '' : 's'} for your priority.`;
    }
  };

  picker.addEventListener('change', update);
  update();
});
