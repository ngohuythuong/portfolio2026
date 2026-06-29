document.addEventListener("DOMContentLoaded", () => {
    const videoContainers = document.querySelectorAll('.media-embed');

    const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target.querySelector('video');
            const isAutoplay = entry.target.getAttribute('data-autoplay') === 'true';

            if (entry.isIntersecting) {
                // Video đi vào tầm mắt người dùng
                if (isAutoplay) {
                    video.play().catch(error => {
                        console.log("Autoplay bị chặn bởi trình duyệt hoặc chế độ tiết kiệm pin");
                    });
                }
            } else {
                // Video ra khỏi tầm mắt -> Tạm dừng để tiết kiệm tài nguyên
                video.pause();
            }
        });
    }, { threshold: 0.1 }); // Chạy khi 10% video xuất hiện trên màn hình

    videoContainers.forEach(container => videoObserver.observe(container));

    // Clock
    function updateClock() {
        const clockElement = document.querySelector(".clock__display");
        if (!clockElement) return;

        const now = new Date();

        const timeString = now.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
            timeZone: "Asia/Ho_Chi_Minh",
        });

        clockElement.textContent = timeString;
    }

    if (document.querySelector(".clock__display")) {
        updateClock();
        setInterval(updateClock, 1000);
    }

    // Split text hover effect
    const initSplitHover = () => {
        document.querySelectorAll('[data-hover]:not(.split-initialized)').forEach(element => {
            // Lưu lại các icon trước khi xóa HTML
            const iconElements = Array.from(element.querySelectorAll('svg, i, [class*="icon"]'));
            const iconClones = iconElements.map(icon => icon.cloneNode(true));

            const text = element.textContent.trim();
            if (!text && iconElements.length === 0) return;

            element.setAttribute('aria-label', element.getAttribute('aria-label') || text);
            element.innerHTML = '';
            element.classList.add('split-initialized');

            // Tạo wrapper cho text nếu có
            if (text) {
                const createWrapper = (className) => {
                    const wrapper = document.createElement('span');
                    wrapper.classList.add('split-wrapper', className);
                    wrapper.setAttribute('aria-hidden', 'true');

                    [...text].forEach((char, index) => {
                        const span = document.createElement('span');
                        span.textContent = char === ' ' ? '\u00A0' : char;
                        span.style.setProperty('--i', index);
                        wrapper.appendChild(span);
                    });

                    // Thêm icon vào mỗi wrapper
                    iconClones.forEach(icon => {
                        wrapper.appendChild(icon.cloneNode(true));
                    });

                    return wrapper;
                };

                element.appendChild(createWrapper('original'));
                element.appendChild(createWrapper('clone'));
            } else {
                // Nếu không có text, chỉ có icon
                const createIconWrapper = (className) => {
                    const wrapper = document.createElement('span');
                    wrapper.classList.add('split-wrapper', className);
                    wrapper.setAttribute('aria-hidden', 'true');
                    iconClones.forEach(icon => {
                        wrapper.appendChild(icon.cloneNode(true));
                    });
                    return wrapper;
                };

                element.appendChild(createIconWrapper('original'));
                element.appendChild(createIconWrapper('clone'));
            }

            // Thêm hover listeners
            element.addEventListener('mouseenter', () => {
                element.classList.add('is-hovering');
            });

            element.addEventListener('mouseleave', () => {
                element.classList.remove('is-hovering');
            });
        });
    };

    // Khởi tạo khi load trang
    initSplitHover();

    // Re-initialize khi Astro chuyển trang (View Transitions)
    document.addEventListener('astro:after-swap', initSplitHover);

    // Theo dõi dynamic content
    const observer = new MutationObserver(() => {
        initSplitHover();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

});