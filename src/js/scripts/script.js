// ==========================================
// 1. VIDEO: chỉ phát khi trong tầm nhìn
// ==========================================

let videoObserver;

function initVideoAutoplay() {
    videoObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            const video = entry.target.querySelector('video');
            if (!video) return;

            if (entry.isIntersecting) {
                if (entry.target.dataset.autoplay === 'true') {
                    video.play().catch(() => {
                        // Autoplay bị chặn bởi trình duyệt hoặc chế độ tiết kiệm pin
                    });
                }
            } else {
                // Ra khỏi tầm nhìn → tạm dừng để tiết kiệm tài nguyên
                video.pause();
            }
        });
    }, { threshold: 0.1 }); // Chạy khi 10% video xuất hiện trên màn hình

    document.querySelectorAll('.media-embed').forEach((container) => videoObserver.observe(container));
}

// ==========================================
// 2. CLOCK (giờ Việt Nam)
// ==========================================

const timeFormatter = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: 'Asia/Ho_Chi_Minh',
});

function updateClocks() {
    const clocks = document.querySelectorAll('.clock__display');
    if (!clocks.length) return;

    const timeString = timeFormatter.format(new Date());
    clocks.forEach((clock) => {
        clock.textContent = timeString;
    });
}

// 1 interval duy nhất cho cả site; DOM mới sau khi chuyển trang được query lại mỗi tick
setInterval(updateClocks, 1000);

// ==========================================
// 3. SPLIT WAVE HOVER ([data-hover]) — sóng chạy từ trái sang phải
// ==========================================

const WAVE_STEP = 0.025; // Độ trễ trung bình (s) giữa 2 ký tự liền kề

/**
 * Độ trễ theo đường cong sine (sine.out) từ trái sang phải:
 * khoảng trễ lớn ở đầu chữ rồi dồn dần về cuối, như ngọn sóng đổ qua chữ.
 */
function getWaveDelay(index, total) {
    if (total <= 1) return 0;

    const progress = index / (total - 1); // 0 (trái) → 1 (phải)
    return WAVE_STEP * (total - 1) * Math.sin((progress * Math.PI) / 2);
}

function createWrapper(className, text, icons) {
    const wrapper = document.createElement('span');
    wrapper.classList.add('split-wrapper', className);
    wrapper.setAttribute('aria-hidden', 'true');

    const items = [
        ...[...text].map((char) => {
            const span = document.createElement('span');
            span.textContent = char === ' ' ? ' ' : char;
            return span;
        }),
        // Icon nằm cuối, nhận độ trễ như 1 ký tự trong sóng
        ...icons.map((icon) => icon.cloneNode(true)),
    ];

    items.forEach((item, index) => {
        item.style.setProperty('--d', `${getWaveDelay(index, items.length).toFixed(3)}s`);
        wrapper.appendChild(item);
    });

    return wrapper;
}

function initSplitHover() {
    document.querySelectorAll('[data-hover]:not(.split-initialized)').forEach((element) => {
        // Lưu lại icon trước khi xóa HTML
        const icons = Array.from(element.querySelectorAll('svg, i, [class*="icon"]'));
        const text = element.textContent.trim();
        if (!text && !icons.length) return;

        if (text && !element.hasAttribute('aria-label')) element.setAttribute('aria-label', text);
        element.classList.add('split-initialized');

        element.replaceChildren(
            createWrapper('original', text, icons),
            createWrapper('clone', text, icons),
        );
    });
}

// ==========================================
// LIFECYCLE (Astro View Transitions)
// ==========================================

// astro:page-load chạy cả lần load đầu lẫn sau mỗi lần chuyển trang
document.addEventListener('astro:page-load', () => {
    initVideoAutoplay();
    initSplitHover();
    updateClocks();
});

document.addEventListener('astro:before-swap', () => {
    videoObserver?.disconnect();
    videoObserver = undefined;
});
