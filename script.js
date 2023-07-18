window.addEventListener('scroll', fadeInElement);

function fadeInElement() {
  var element = document.querySelector('main');
  var position = element.getBoundingClientRect().top;
  var windowHeight = window.innerHeight;

  if (position < windowHeight) {
    element.classList.add('fade-in');
    element.classList.add('active');
    window.removeEventListener('scroll', fadeInElement);
  }
}

const rankingContainer = document.querySelector('.ranking-container');
const line = document.querySelector('.line');

rankingContainer.addEventListener('mouseover', () => {
  line.style.width = `${rankingContainer.offsetWidth}px`;
});

rankingContainer.addEventListener('mouseout', () => {
  line.style.width = '0';
});



