import Lenis from '@studio-freight/lenis';

const thumb = document.getElementById('custom-scroll-thumb');
const html = document.documentElement;

const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true
});

function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

lenis.on('scroll', ({ scroll, limit, progress }) => {
    // 1. Thêm class để hiện thanh scroll
    html.classList.add('is-scrolling');

    // 2. Tính toán chiều cao con chạy (tỷ lệ thuận với viewport)
    const viewportHeight = window.innerHeight;
    const contentHeight = document.body.scrollHeight;
    const thumbHeight = (viewportHeight / contentHeight) * viewportHeight;

    // 3. Cập nhật vị trí và chiều cao thumb
    if (thumb) {
        thumb.style.height = `${thumbHeight}px`;
        thumb.style.transform = `translateY(${progress * (viewportHeight - thumbHeight)}px)`;
    }

    // 4. Tự động ẩn sau khi ngừng cuộn
    window.clearTimeout(window.scrollTimeout);
    window.scrollTimeout = setTimeout(() => {
        html.classList.remove('is-scrolling');
    }, 1000);
});