// 触摸手势处理模块 - 使用全局对象而非ES模块
class TouchHandler {
    constructor() {
        this.startX = 0;
        this.startY = 0;
        this.startTime = 0;
        this.minSwipeDistance = 50;
        this.maxSwipeTime = 300;
        
        this.init();
    }
    
    init() {
        document.addEventListener('touchstart', this.handleTouchStart.bind(this));
        document.addEventListener('touchend', this.handleTouchEnd.bind(this));
    }
    
    handleTouchStart(e) {
        this.startX = e.touches[0].clientX;
        this.startY = e.touches[0].clientY;
        this.startTime = Date.now();
    }
    
    handleTouchEnd(e) {
        if (!this.startTime) return;
        
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const deltaX = endX - this.startX;
        const deltaY = endY - this.startY;
        const deltaTime = Date.now() - this.startTime;
        
        if (deltaTime > this.maxSwipeTime) return;
        
        if (Math.abs(deltaX) > this.minSwipeDistance) {
            const direction = deltaX > 0 ? 'right' : 'left';
            this.handleSwipe(direction);
        } else if (Math.abs(deltaY) > this.minSwipeDistance) {
            const direction = deltaY > 0 ? 'down' : 'up';
            this.handleSwipe(direction);
        }
    }
    
    handleSwipe(direction) {
        const navbar = document.querySelector('.navbar');
        if (direction === 'down') {
            navbar.classList.add('scroll-up');
            navbar.classList.remove('scroll-down');
        } else if (direction === 'up') {
            navbar.classList.add('scroll-down');
            navbar.classList.remove('scroll-up');
        }
        
        const certificateCards = document.querySelectorAll('.certificate-item');
        if (direction === 'left' || direction === 'right') {
            certificateCards.forEach(card => {
                card.style.transform = `translateX(${direction === 'right' ? '10px' : '-10px'})`;
                setTimeout(() => {
                    card.style.transform = '';
                }, 300);
            });
        }
    }
}

// 触摸模块 - 全局对象
const TouchModule = {
    init() {
        this.handler = new TouchHandler();
    }
};