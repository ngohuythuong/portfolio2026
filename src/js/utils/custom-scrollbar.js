import Lenis from '@studio-freight/lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const html = document.documentElement;

const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true
});

// Đồng bộ Lenis với ScrollTrigger: chạy chung ticker của GSAP thay vì RAF riêng
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

// DOM được thay mới sau mỗi lần chuyển trang (View Transitions) → lấy lại thumb
let thumb = document.getElementById('custom-scroll-thumb');
document.addEventListener('astro:after-swap', () => {
    thumb = document.getElementById('custom-scroll-thumb');
});

let hideTimer;

lenis.on('scroll', ({ limit, progress }) => {
    // 1. Hiện thanh scroll
    html.classList.add('is-scrolling');

    // 2. Chiều cao con chạy tỷ lệ với viewport (dùng limit của Lenis, không đọc lại DOM)
    if (thumb) {
        const viewportHeight = window.innerHeight;
        const thumbHeight = (viewportHeight / (limit + viewportHeight)) * viewportHeight;

        thumb.style.height = `${thumbHeight}px`;
        thumb.style.transform = `translateY(${progress * (viewportHeight - thumbHeight)}px)`;
    }

    // 3. Tự động ẩn sau khi ngừng cuộn
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
        html.classList.remove('is-scrolling');
    }, 1000);
});
