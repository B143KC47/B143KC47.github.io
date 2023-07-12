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