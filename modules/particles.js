class ParticleNetwork {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0, active: false };
        this.animationId = null;
        this.isVisible = true;
        this.isPaused = false;
        this.time = 0;
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

        this.config = {
            particleCount: 84,
            connectionDistance: 118,
            focalLength: 620,
            depth: 760,
            baseColor: 'rgba(204, 255, 239, 0.78)',
            accentColor: 'rgba(33, 150, 243, 0.86)',
            lineColor: 'rgba(16, 163, 127, 0.18)',
            particleSpeed: 0.0028,
            particleSize: 2.2
        };

        this.init();
    }

    init() {
        this.resize();
        this.createParticles();
        this.addEventListeners();
        this.setupVisibilityObserver();
        if (this.prefersReducedMotion) {
            this.drawParticles();
        } else {
            this.animate();
        }
    }

    resize() {
        const width = this.canvas.parentElement?.clientWidth || window.innerWidth;
        const height = this.canvas.parentElement?.clientHeight || window.innerHeight;

        this.canvas.width = Math.floor(width * this.pixelRatio);
        this.canvas.height = Math.floor(height * this.pixelRatio);
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
        this.ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
        this.width = width;
        this.height = height;

        if (width < 768) {
            this.config.particleCount = 38;
            this.config.connectionDistance = 86;
            this.config.focalLength = 440;
        } else {
            this.config.particleCount = 84;
            this.config.connectionDistance = 118;
            this.config.focalLength = 620;
        }
    }

    createParticles() {
        this.particles = [];
        for (let i = 0; i < this.config.particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 0.15 + Math.random() * 0.85;
            this.particles.push({
                x: Math.cos(angle) * radius * this.width * 0.54,
                y: (Math.random() - 0.5) * this.height * 0.76,
                z: (Math.random() - 0.5) * this.config.depth,
                orbit: angle,
                speed: (Math.random() * 0.7 + 0.45) * this.config.particleSpeed,
                size: Math.random() * this.config.particleSize + 1,
                phase: Math.random() * Math.PI * 2
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

        this.canvas.addEventListener('pointermove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
            this.mouse.targetY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
            this.mouse.active = true;
        }, { passive: true });

        this.canvas.addEventListener('pointerleave', () => {
            this.mouse.targetX = 0;
            this.mouse.targetY = 0;
            this.mouse.active = false;
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
        if (!this.prefersReducedMotion) {
            this.animate();
        }
    }

    project(point) {
        const parallaxX = this.mouse.x * 42;
        const parallaxY = this.mouse.y * 26;
        const scale = this.config.focalLength / (this.config.focalLength + point.z);
        return {
            x: this.width / 2 + (point.x + parallaxX) * scale,
            y: this.height / 2 + (point.y + parallaxY) * scale,
            scale
        };
    }

    drawParticles() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.fillStyle = 'rgba(3, 7, 11, 0.24)';
        this.ctx.fillRect(0, 0, this.width, this.height);

        const len = this.particles.length;
        const connDist = this.config.connectionDistance;
        const connDistSq = connDist * connDist;
        const projected = [];

        this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.055;
        this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.055;

        for (let i = 0; i < len; i++) {
            const p = this.particles[i];

            if (!this.prefersReducedMotion) {
                p.orbit += p.speed;
                p.x += Math.sin(this.time * 0.0012 + p.phase) * 0.18;
                p.y += Math.cos(this.time * 0.001 + p.phase) * 0.14;
                p.z += Math.sin(p.orbit) * 0.45;
            }

            if (p.z > this.config.depth / 2) p.z = -this.config.depth / 2;
            if (p.z < -this.config.depth / 2) p.z = this.config.depth / 2;

            projected[i] = this.project(p);
        }

        for (let i = 0; i < len; i++) {
            const a = projected[i];

            for (let j = i + 1; j < len; j++) {
                const b = projected[j];
                const dx = a.x - b.x;
                const dy = a.y - b.y;
                const distSq = dx * dx + dy * dy;

                if (distSq < connDistSq) {
                    const distance = Math.sqrt(distSq);
                    const alpha = (1 - distance / connDist) * Math.min(a.scale, b.scale) * 0.34;
                    this.ctx.beginPath();
                    this.ctx.strokeStyle = `rgba(42, 240, 180, ${alpha})`;
                    this.ctx.lineWidth = Math.max(0.4, alpha * 2.2);
                    this.ctx.moveTo(a.x, a.y);
                    this.ctx.lineTo(b.x, b.y);
                    this.ctx.stroke();
                }
            }
        }

        for (let i = 0; i < len; i++) {
            const p = this.particles[i];
            const screen = projected[i];
            const alpha = Math.min(0.92, 0.26 + screen.scale * 0.46);
            const radius = Math.max(1.2, p.size * screen.scale);
            const color = i % 9 === 0 ? this.config.accentColor : this.config.baseColor;

            this.ctx.beginPath();
            this.ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
            this.ctx.fillStyle = color.replace(/[\d.]+\)$/g, `${alpha})`);
            this.ctx.fill();

            if (i % 11 === 0) {
                this.ctx.beginPath();
                this.ctx.arc(screen.x, screen.y, radius * 4.2, 0, Math.PI * 2);
                this.ctx.strokeStyle = `rgba(33, 150, 243, ${alpha * 0.14})`;
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
            }
        }
    }

    animate() {
        if (this.isPaused) return;
        this.time += 16;
        this.drawParticles();
        this.animationId = requestAnimationFrame(this.animate.bind(this));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ParticleNetwork('hero-canvas');
});
