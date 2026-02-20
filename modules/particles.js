class ParticleNetwork {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mouse = { x: null, y: null, radius: 150 };
        this.animationId = null;
        this.isVisible = true;
        this.isPaused = false;

        this.config = {
            particleCount: 60,
            connectionDistance: 100,
            mouseDistance: 150,
            baseColor: 'rgba(16, 163, 127, 0.5)',
            lineColor: 'rgba(16, 163, 127, 0.15)',
            particleSpeed: 0.3,
            particleSize: 2
        };

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) return;

        this.init();
    }

    init() {
        this.resize();
        this.createParticles();
        this.addEventListeners();
        this.setupVisibilityObserver();
        this.animate();
    }

    resize() {
        this.canvas.width = this.canvas.parentElement?.clientWidth || window.innerWidth;
        this.canvas.height = this.canvas.parentElement?.clientHeight || window.innerHeight;

        if (this.canvas.width < 768) {
            this.config.particleCount = 25;
            this.config.connectionDistance = 70;
        } else {
            this.config.particleCount = 60;
            this.config.connectionDistance = 100;
        }
    }

    createParticles() {
        this.particles = [];
        for (let i = 0; i < this.config.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * this.config.particleSpeed,
                vy: (Math.random() - 0.5) * this.config.particleSpeed,
                size: Math.random() * this.config.particleSize + 1
            });
        }
    }

    addEventListeners() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.resize();
                this.createParticles();
            }, 250);
        }, { passive: true });

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        }, { passive: true });

        this.canvas.addEventListener('mouseleave', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        }, { passive: true });

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else if (this.isVisible) {
                this.resume();
            }
        });
    }

    setupVisibilityObserver() {
        if (!('IntersectionObserver' in window)) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                this.isVisible = entry.isIntersecting;
                if (this.isVisible && this.isPaused) {
                    this.resume();
                } else if (!this.isVisible && !this.isPaused) {
                    this.pause();
                }
            });
        }, { threshold: 0.1 });

        observer.observe(this.canvas);
    }

    pause() {
        this.isPaused = true;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    resume() {
        if (!this.isPaused) return;
        this.isPaused = false;
        this.animate();
    }

    drawParticles() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const len = this.particles.length;
        const connDist = this.config.connectionDistance;
        const connDistSq = connDist * connDist;

        for (let i = 0; i < len; i++) {
            const p = this.particles[i];

            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;

            if (this.mouse.x != null) {
                const dx = this.mouse.x - p.x;
                const dy = this.mouse.y - p.y;
                const distSq = dx * dx + dy * dy;

                if (distSq < this.config.mouseDistance * this.config.mouseDistance) {
                    const distance = Math.sqrt(distSq);
                    const force = (this.config.mouseDistance - distance) / this.config.mouseDistance;
                    p.x -= (dx / distance) * force * 3;
                    p.y -= (dy / distance) * force * 3;
                }
            }

            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = this.config.baseColor;
            this.ctx.fill();

            for (let j = i + 1; j < len; j++) {
                const p2 = this.particles[j];
                const dx = p.x - p2.x;
                const dy = p.y - p2.y;
                const distSq = dx * dx + dy * dy;

                if (distSq < connDistSq) {
                    const distance = Math.sqrt(distSq);
                    this.ctx.beginPath();
                    this.ctx.strokeStyle = this.config.lineColor;
                    this.ctx.lineWidth = 1 - distance / connDist;
                    this.ctx.moveTo(p.x, p.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.stroke();
                }
            }
        }
    }

    animate() {
        if (this.isPaused) return;
        this.drawParticles();
        this.animationId = requestAnimationFrame(this.animate.bind(this));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ParticleNetwork('hero-canvas');
});
