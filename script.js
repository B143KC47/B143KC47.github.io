document.addEventListener('DOMContentLoaded', (event) => {
    const currentYear = new Date().getFullYear();
    document.getElementById('year').textContent = `©2023-${currentYear} Powered by KO Ho Tin`;

    // 平滑滚动
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // 渐入动画
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '50px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-up');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('section').forEach(section => {
        observer.observe(section);
    });

    // 动态年份
    document.getElementById('year').textContent = `© ${new Date().getFullYear()} KO Ho Tin`;

    // 优化滚动动画性能
    const optimizedScroll = () => {
        const scrolled = window.pageYOffset;
        requestAnimationFrame(() => {
            document.querySelector('.hero').style.transform = 
                `translateY(${scrolled * 0.3}px)`;
        });
    };
    
    window.addEventListener('scroll', optimizedScroll, { passive: true });
    
    // 添加平滑滚动到指定位置功能
    const scrollToSection = (e, section) => {
        e.preventDefault();
        const target = document.querySelector(section);
        const navHeight = document.querySelector('.navbar').offsetHeight;
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight;
        
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    };

    // 优化卡片动画效果
    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('mouseenter', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    });
});

// 在移动端可选添加下拉连接的显隐控制
function toggleMobileNav() {
    const nav = document.querySelector('.navbar');
    if (nav.style.display === 'none') {
        nav.style.display = 'flex';
    } else {
        nav.style.display = 'none';
    }
}

// 添加滚动渐入效果
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('section > *').forEach(element => {
    element.classList.add('fade-out');
    observer.observe(element);
});

// 平滑滚动
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// 添加视差滚动效果
document.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    document.querySelector('.hero').style.transform = `translateY(${scrolled * 0.5}px)`;
});

// 统一滚动动画
const scrollObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  },
  {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  }
);

document.querySelectorAll('.fade-up').forEach(element => {
  scrollObserver.observe(element);
});

// 统一鼠标跟踪效果
const updateMousePosition = (e, element) => {
  const rect = element.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  element.style.setProperty('--mouse-x', `${x}px`);
  element.style.setProperty('--mouse-y', `${y}px`);
};

document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('mousemove', e => updateMousePosition(e, card));
});

document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.certificate-card');
    
    cards.forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    });
    
    // 添加图片加载动画
    const images = document.querySelectorAll('.certificate-image');
    images.forEach(img => {
        img.addEventListener('load', () => {
            img.classList.add('loaded');
        });
    });
});
