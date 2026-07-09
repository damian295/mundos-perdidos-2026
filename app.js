const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('[data-menu]');

if (menuButton && menu) {
  menuButton.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
    menuButton.textContent = isOpen ? '×' : '☰';
  });

  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      menu.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.textContent = '☰';
    });
  });
}

const cards = document.querySelectorAll('.axis-card, .activity-card, .day-card, .river-card, .map-card');
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

cards.forEach((card) => {
  card.classList.add('reveal');
  observer.observe(card);
});

const style = document.createElement('style');
style.textContent = `
  .reveal{opacity:0;transform:translateY(18px);transition:opacity .55s ease, transform .55s ease}
  .reveal.visible{opacity:1;transform:translateY(0)}
`;
document.head.appendChild(style);
