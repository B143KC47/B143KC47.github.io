const PortfolioGraphModule = {
    canvas: null,
    ctx: null,
    nodes: [],
    links: [],
    animationId: null,
    width: 0,
    height: 0,
    pixelRatio: 1,
    reducedMotion: false,

    init() {
        this.canvas = document.getElementById('knowledge-graph-canvas');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.buildGraph();
        this.resize();
        this.bindEvents();

        if (this.reducedMotion) {
            this.draw(0);
        } else {
            this.animate(0);
        }
    },

    buildGraph() {
        this.nodes = [
            { id: 'KO Ho Tin', type: 'core', x: 0.5, y: 0.5, r: 24 },
            { id: 'AlphaBench', type: 'paper', x: 0.28, y: 0.26, r: 17 },
            { id: 'EvoAlpha', type: 'paper', x: 0.7, y: 0.28, r: 16 },
            { id: 'LLM Agents', type: 'topic', x: 0.22, y: 0.58, r: 15 },
            { id: 'Computer Vision', type: 'topic', x: 0.73, y: 0.62, r: 15 },
            { id: 'Quant AI', type: 'topic', x: 0.48, y: 0.78, r: 15 },
            { id: 'OpenReview', type: 'tool', x: 0.15, y: 0.4, r: 12 },
            { id: 'GitHub', type: 'tool', x: 0.84, y: 0.42, r: 12 },
            { id: 'Evaluation', type: 'topic', x: 0.5, y: 0.2, r: 13 },
            { id: 'API Systems', type: 'tool', x: 0.35, y: 0.68, r: 12 }
        ];

        this.links = [
            ['KO Ho Tin', 'AlphaBench'],
            ['KO Ho Tin', 'EvoAlpha'],
            ['KO Ho Tin', 'LLM Agents'],
            ['KO Ho Tin', 'Computer Vision'],
            ['KO Ho Tin', 'Quant AI'],
            ['AlphaBench', 'Evaluation'],
            ['AlphaBench', 'Quant AI'],
            ['EvoAlpha', 'LLM Agents'],
            ['EvoAlpha', 'Quant AI'],
            ['OpenReview', 'AlphaBench'],
            ['OpenReview', 'EvoAlpha'],
            ['GitHub', 'API Systems'],
            ['API Systems', 'LLM Agents'],
            ['Computer Vision', 'Evaluation']
        ];
    },

    bindEvents() {
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.resize();
                this.draw(performance.now());
            }, 150);
        }, { passive: true });

        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.animationId) {
                cancelAnimationFrame(this.animationId);
                this.animationId = null;
            } else if (!document.hidden && !this.reducedMotion && !this.animationId) {
                this.animate(performance.now());
            }
        });
    },

    resize() {
        const rect = this.canvas.getBoundingClientRect();
        this.width = Math.max(320, rect.width);
        this.height = Math.max(360, rect.height);
        this.canvas.width = Math.floor(this.width * this.pixelRatio);
        this.canvas.height = Math.floor(this.height * this.pixelRatio);
        this.ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
    },

    getNode(id) {
        return this.nodes.find(node => node.id === id);
    },

    nodePosition(node, time) {
        const amp = this.reducedMotion ? 0 : 10;
        const phase = this.nodes.indexOf(node) * 0.7;
        return {
            x: node.x * this.width + Math.sin(time * 0.001 + phase) * amp,
            y: node.y * this.height + Math.cos(time * 0.0012 + phase) * amp
        };
    },

    colorFor(type) {
        if (type === 'core') return '#ccffef';
        if (type === 'paper') return '#58a6ff';
        if (type === 'topic') return '#2af0b4';
        return '#b986ff';
    },

    draw(time) {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        const bg = ctx.createRadialGradient(this.width * 0.5, this.height * 0.48, 20, this.width * 0.5, this.height * 0.48, this.width * 0.62);
        bg.addColorStop(0, 'rgba(16, 163, 127, 0.18)');
        bg.addColorStop(1, 'rgba(0, 0, 0, 0.04)');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, this.width, this.height);

        this.links.forEach(([sourceId, targetId]) => {
            const source = this.getNode(sourceId);
            const target = this.getNode(targetId);
            if (!source || !target) return;

            const a = this.nodePosition(source, time);
            const b = this.nodePosition(target, time);
            const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
            grad.addColorStop(0, 'rgba(42, 240, 180, 0.08)');
            grad.addColorStop(0.5, 'rgba(42, 240, 180, 0.34)');
            grad.addColorStop(1, 'rgba(88, 166, 255, 0.1)');

            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = grad;
            ctx.lineWidth = source.type === 'core' || target.type === 'core' ? 1.4 : 0.9;
            ctx.stroke();
        });

        this.nodes.forEach(node => {
            const pos = this.nodePosition(node, time);
            const color = this.colorFor(node.type);

            ctx.beginPath();
            ctx.arc(pos.x, pos.y, node.r + 16, 0, Math.PI * 2);
            ctx.fillStyle = `${color}16`;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(pos.x, pos.y, node.r, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.shadowColor = color;
            ctx.shadowBlur = node.type === 'core' ? 28 : 16;
            ctx.fill();
            ctx.shadowBlur = 0;

            ctx.font = node.type === 'core' ? '600 15px JetBrains Mono, monospace' : '500 12px JetBrains Mono, monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
            ctx.fillText(node.id, pos.x, pos.y + node.r + 22);
        });
    },

    animate(time) {
        this.draw(time);
        this.animationId = requestAnimationFrame(this.animate.bind(this));
    }
};

document.addEventListener('DOMContentLoaded', () => {
    PortfolioGraphModule.init();
});
