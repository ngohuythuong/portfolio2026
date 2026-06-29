import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function initUltimateInteractionSystem() {
  // Định nghĩa 2 mốc màn hình chuẩn UX toàn hệ thống
  let mm = gsap.matchMedia();
  const isDesktop = "(min-width: 1024px)";
  const isMobile = "(max-width: 1023px)";

  // ==========================================
  // 1. HỆ THỐNG XỬ LÝ PARALLAX ANIMATION
  // ==========================================
  const parallaxContainers = document.querySelectorAll("[data-parallax-container]");
  
  parallaxContainers.forEach((container) => {
    const parallaxElement = container.querySelector("[data-parallax-element]");
    if (!parallaxElement) return;

    // Đọc thông số cấu hình linh hoạt từ HTML dựa trên bộ tên đầy đủ
    const pStart = container.getAttribute("data-parallax-start") || "top bottom";
    const pEnd = container.getAttribute("data-parallax-end") || "bottom top";
    const pMedia = container.getAttribute("data-parallax-media") || "all";
    // Mặc định tịnh tiến ngược lên -20% chiều cao (phù hợp video/ảnh cao 120vh-130vh)
    const pY = parseInt(container.getAttribute("data-parallax-y")) || -20; 

    const createParallax = () => {
      gsap.fromTo(parallaxElement, 
        { yPercent: 0 },
        {
          yPercent: pY,
          ease: "none",
          scrollTrigger: {
            trigger: container,
            start: pStart,
            end: pEnd,
            scrub: true,
            invalidateOnRefresh: true
          }
        }
      );
    };

    // Phân luồng thiết bị cho Parallax
    if (pMedia === "desktop") {
      mm.add(isDesktop, () => { createParallax(); });
    } else if (pMedia === "mobile") {
      mm.add(isMobile, () => { createParallax(); });
    } else {
      createParallax(); // Chạy trên 'all'
    }
  });


  // ==========================================
  // 2. HỆ THỐNG XỬ LÝ PIN SYSTEM
  // ==========================================
  const pinContainers = document.querySelectorAll("[data-pin-container]");
  if (!pinContainers.length) return;

  pinContainers.forEach((container) => {
    const pinElement = container.querySelector("[data-pin-element]");
    if (!pinElement) return;

    const customStart = container.getAttribute("data-pin-start") || "top 15%";
    const customEnd = container.getAttribute("data-pin-end") || "bottom top";
    const pinMode = container.getAttribute("data-pin-mode");
    const pinMedia = container.getAttribute("data-pin-media") || "all"; 
    const hasSpacing = container.getAttribute("data-pin-space") === "true";
    const endTriggerElement = container.querySelector("[data-pin-end-trigger]");

    const createPinAnimation = () => {
      const scrollConfig = {
        trigger: container,
        pin: pinElement,
        start: customStart,
        end: customEnd,
        endTrigger: endTriggerElement || container,
        pinSpacing: hasSpacing,
        scrub: true,
        invalidateOnRefresh: true,
        anticipatePin: 1
      };

      if (pinMode === "backward") {
        gsap.to(pinElement, {
          scale: 0.9,
          opacity: 0.8,
          yPercent: -15,
          ease: "none",
          scrollTrigger: scrollConfig
        });
      } else {
        ScrollTrigger.create(scrollConfig);
      }
    };

    if (pinMedia === "desktop") {
      mm.add(isDesktop, () => { createPinAnimation(); });
    } else if (pinMedia === "mobile") {
      mm.add(isMobile, () => { createPinAnimation(); });
    } else {
      createPinAnimation();
    }
  });
}

// initUltimateInteractionSystem() will be called in the consolidated listener at the end of this file.

function initInteractiveAnimations() {
    
    // Marquee Infinity Animation
    const marquees = document.querySelectorAll('.marquee:not([data-anim-initialized])');

    marquees.forEach(marquee => {
        marquee.dataset.animInitialized = 'true';
        
        const wrapper = marquee.querySelector('.marquee__track');
        if (!wrapper) return;

        const content = wrapper.innerHTML;
        wrapper.innerHTML += content + content + content;

        const marqueeAnim = gsap.to(wrapper, {
            xPercent: -25,
            ease: "none",
            duration: 25,
            repeat: -1
        });

        marquee.addEventListener("mouseenter", () => {
            marqueeAnim.pause();
        });

        marquee.addEventListener("mouseleave", () => {
            marqueeAnim.play();
        });
    });
}

// Chạy khởi tạo hiệu ứng interactive cho mỗi lần load trang (kể cả first load và chuyển trang)
document.addEventListener('astro:page-load', initInteractiveAnimations);

// text animation

function initGlobalTextAnimations() {
  const targets = document.querySelectorAll("[data-split-text-anim]");
  if (!targets.length) return;

  const getTriggerElement = (el) => {
    // Tìm container không bị ghim gần nhất để làm trigger có tọa độ cuộn ổn định tuyệt đối
    const pinContainer = el.closest('[data-pin-container]');
    if (pinContainer) return pinContainer;
    
    const humanSide = el.closest('.human-side');
    if (humanSide) return humanSide;
    
    const maskTrigger = el.closest('[data-mask-trigger="true"]');
    if (maskTrigger) return maskTrigger;
    
    const zoomTrigger = el.closest('[data-zoom-trigger="true"]');
    if (zoomTrigger) return zoomTrigger;
    
    return el;
  };

  targets.forEach((el) => {
    // Ngăn chặn việc nhân bản thẻ khi Astro SPA cập nhật trang
    if (el.querySelector(".global-line-overflow") || el.querySelector(".anim_line_mask")) return;

    const animType = el.getAttribute("data-split-text-anim"); 
    if (!["word", "line", "linesMask"].includes(animType)) return;

    // Thiết lập thông số an toàn mặc định
    let config = { 
      bgColor: "rgba(0,0,0,0.32)", 
      fgColor: "currentColor",
      duration: 1.5,
      delay: 0,
      stagger: 0.1,
      scrub: false,
      repeat: false
    }; 
    
    const rawSettings = el.getAttribute("data-settings");
    if (rawSettings) {
      try {
        const sanitized = rawSettings.replace(/'/g, '"');
        const parsed = JSON.parse(sanitized);
        if (parsed.bgColor) config.bgColor = parsed.bgColor;
        if (parsed.fgColor) config.fgColor = parsed.fgColor;
        if (typeof parsed.duration === "number") config.duration = parsed.duration;
        if (typeof parsed.delay === "number") config.delay = parsed.delay;
        if (typeof parsed.stagger === "number") config.stagger = parsed.stagger;
        if (typeof parsed.scrub === "boolean" || typeof parsed.scrub === "number") config.scrub = parsed.scrub;
        if (typeof parsed.repeat === "boolean") config.repeat = parsed.repeat;
      } catch (e) {
        console.warn("Lỗi đọc cấu hình data-settings:", e);
      }
    }

    const textContent = el.textContent.trim();
    if (!textContent) return;
    const words = textContent.split(/\s+/);

    // ==========================================
    // CHẠY LUỒNG 1: WORD UP
    // ==========================================
    if (animType === "word") {
      el.innerHTML = "";
      const fragment = document.createDocumentFragment();
      words.forEach((word) => {
        const maskSpan = document.createElement("span");
        maskSpan.className = "global-line-overflow";

        const innerSpan = document.createElement("span");
        innerSpan.className = "global-item-inner";
        innerSpan.textContent = word;

        maskSpan.appendChild(innerSpan);
        fragment.appendChild(maskSpan);
      });
      el.appendChild(fragment);

      const items = el.querySelectorAll(".global-item-inner");
      const triggerEl = getTriggerElement(el);

      const scrollTriggerConfig = {
        trigger: triggerEl,
        start: "top 85%",
        scrub: config.scrub ? (typeof config.scrub === "boolean" ? 0.5 : config.scrub) : false,
        toggleActions: config.repeat ? "play reverse play reverse" : "play none none none",
        invalidateOnRefresh: true
      };

      gsap.fromTo(items, { yPercent: 100 }, {
        yPercent: 0,
        duration: config.duration,
        delay: config.delay,
        stagger: config.stagger,
        ease: config.scrub ? "none" : "power3.out",
        scrollTrigger: scrollTriggerConfig
      });
    }

    // ==========================================
    // CHẠY LUỒNG 2: LINE UP (Cơ chế tính toán dòng mượt)
    // ==========================================
    else if (animType === "line") {
      el.innerHTML = ""; 
      words.forEach((word) => {
        const span = document.createElement("span");
        span.className = "global-temp-word";
        span.textContent = word + " ";
        el.appendChild(span);
      });

      const tempWords = el.querySelectorAll(".global-temp-word");
      let lines = [];
      let currentLine = [];
      let currentTop = tempWords[0].offsetTop;

      tempWords.forEach((wordSpan) => {
        if (Math.abs(wordSpan.offsetTop - currentTop) > 6 && currentLine.length > 0) {
          lines.push([...currentLine]);
          currentLine = [];
          currentTop = wordSpan.offsetTop;
        }
        currentLine.push(wordSpan.textContent);
      });
      if (currentLine.length > 0) lines.push(currentLine);

      el.innerHTML = "";
      const fragment = document.createDocumentFragment();
      lines.forEach((lineWords) => {
        const maskSpan = document.createElement("span");
        maskSpan.className = "global-line-overflow";

        const innerSpan = document.createElement("span");
        innerSpan.className = "global-item-inner";
        innerSpan.textContent = lineWords.join("").trim();

        maskSpan.appendChild(innerSpan);
        fragment.appendChild(maskSpan);
      });
      el.appendChild(fragment);

      const items = el.querySelectorAll(".global-item-inner");
      const triggerEl = getTriggerElement(el);

      const scrollTriggerConfig = {
        trigger: triggerEl,
        start: "top 85%",
        scrub: config.scrub ? (typeof config.scrub === "boolean" ? 0.5 : config.scrub) : false,
        toggleActions: config.repeat ? "play reverse play reverse" : "play none none none",
        invalidateOnRefresh: true
      };

      gsap.fromTo(items, { yPercent: 100 }, {
        yPercent: 0,
        duration: config.duration,
        delay: config.delay,
        stagger: config.stagger,
        ease: config.scrub ? "none" : "power3.out",
        scrollTrigger: scrollTriggerConfig
      });
    }

    // ==========================================
    // CHẠY LUỒNG 3: LINES MASK
    // ==========================================
    else if (animType === "linesMask") {
      el.innerHTML = ""; 
      words.forEach((word) => {
        const span = document.createElement("span");
        span.className = "global-temp-word";
        span.textContent = word + " ";
        el.appendChild(span);
      });

      const tempWords = el.querySelectorAll(".global-temp-word");
      let lines = [];
      let currentLine = [];
      let currentTop = tempWords[0].offsetTop;

      tempWords.forEach((wordSpan) => {
        if (Math.abs(wordSpan.offsetTop - currentTop) > 6 && currentLine.length > 0) {
          lines.push([...currentLine]);
          currentLine = [];
          currentTop = wordSpan.offsetTop;
        }
        currentLine.push(wordSpan.textContent);
      });
      if (currentLine.length > 0) lines.push(currentLine);

      el.innerHTML = "";
      const linesContainer = document.createDocumentFragment();
      lines.forEach((lineWords) => {
        const text = lineWords.join("").trim() + " ";
        const lineMask = document.createElement("span");
        lineMask.className = "anim_line_mask";

        const bgSpan = document.createElement("span");
        bgSpan.className = "line-bg";
        bgSpan.textContent = text;
        bgSpan.style.color = config.bgColor; 

        const fgSpan = document.createElement("span");
        fgSpan.className = "line-fg";
        fgSpan.textContent = text;
        fgSpan.style.color = config.fgColor; 

        lineMask.appendChild(bgSpan);
        lineMask.appendChild(fgSpan);
        linesContainer.appendChild(lineMask);
      });
      el.appendChild(linesContainer);

      const allLineForegrounds = el.querySelectorAll(".anim_line_mask .line-fg");
      gsap.set(allLineForegrounds, { 
        clipPath: "inset(0% 100% 0% 0%)",
        webkitClipPath: "inset(0% 100% 0% 0%)"
      });

      const triggerEl = getTriggerElement(el);

      const scrollTriggerConfig = {
        trigger: triggerEl,
        start: "top 65%",
        end: "bottom 35%",
        scrub: config.scrub ? (typeof config.scrub === "boolean" ? 0.5 : config.scrub) : false,
        toggleActions: config.repeat ? "play reverse play reverse" : "play none none none",
        invalidateOnRefresh: true
      };

      gsap.to(allLineForegrounds, {
        clipPath: "inset(0% 0% 0% 0%)",
        webkitClipPath: "inset(0% 0% 0% 0%)",
        duration: config.duration,
        delay: config.delay,
        ease: config.scrub ? "none" : "power2.out", 
        stagger: config.stagger,
        scrollTrigger: scrollTriggerConfig
      });
    }
  });
}

// generic element scroll animation (fade, slide, etc. without modifying innerHTML)
function initElementScrollAnimations() {
  const targets = document.querySelectorAll("[data-scroll-anim]");
  if (!targets.length) return;

  const getTriggerElement = (el) => {
    const pinContainer = el.closest('[data-pin-container]');
    if (pinContainer) return pinContainer;
    const humanSide = el.closest('.human-side');
    if (humanSide) return humanSide;
    const maskTrigger = el.closest('[data-mask-trigger="true"]');
    if (maskTrigger) return maskTrigger;
    const zoomTrigger = el.closest('[data-zoom-trigger="true"]');
    if (zoomTrigger) return zoomTrigger;
    return el;
  };

  targets.forEach((el) => {
    const animType = el.getAttribute("data-scroll-anim");
    if (!["slide-up", "slide-down"].includes(animType)) return;

    let config = {
      duration: 1.5,
      delay: 0,
      y: 80,
      stagger: 0.15,
      scrub: false,
      repeat: false,
      // Stagger children mode
      staggerChildren: false,
      selector: null
    };

    const rawSettings = el.getAttribute("data-settings");
    if (rawSettings) {
      try {
        const sanitized = rawSettings.replace(/'/g, '"');
        const parsed = JSON.parse(sanitized);
        if (typeof parsed.duration === "number") config.duration = parsed.duration;
        if (typeof parsed.delay === "number") config.delay = parsed.delay;
        if (typeof parsed.y === "number") config.y = parsed.y;
        if (typeof parsed.stagger === "number") config.stagger = parsed.stagger;
        if (typeof parsed.scrub === "boolean" || typeof parsed.scrub === "number") config.scrub = parsed.scrub;
        if (typeof parsed.repeat === "boolean") config.repeat = parsed.repeat;
        if (typeof parsed.staggerChildren === "boolean") config.staggerChildren = parsed.staggerChildren;
        if (typeof parsed.selector === "string") config.selector = parsed.selector;
      } catch (e) {
        console.warn("Lỗi đọc cấu hình data-settings cho scroll-anim:", e);
      }
    }

    const triggerEl = getTriggerElement(el);
    const scrollTriggerConfig = {
      trigger: triggerEl,
      start: "top 90%",
      scrub: config.scrub ? (typeof config.scrub === "boolean" ? 0.5 : config.scrub) : false,
      toggleActions: config.repeat ? "play reverse play reverse" : "play none none none",
      invalidateOnRefresh: true
    };

    // --- STAGGER CHILDREN MODE ---
    // Kích hoạt khi: có attribute data-scroll-stagger, hoặc config.staggerChildren = true
    const hasStaggerAttr = el.hasAttribute("data-scroll-stagger");
    const isStaggerMode = hasStaggerAttr || config.staggerChildren || !!config.selector;

    let targets;
    if (isStaggerMode) {
      // Ưu tiên: giá trị của data-scroll-stagger > config.selector > tất cả con trực tiếp
      const staggerAttrVal = el.getAttribute("data-scroll-stagger");
      const childSelector = (staggerAttrVal && staggerAttrVal !== "" && staggerAttrVal !== "true")
        ? staggerAttrVal
        : (config.selector || ":scope > *");
      const children = el.querySelectorAll(childSelector);
      targets = children.length > 0 ? children : el;
    } else {
      targets = el;
    }

    if (animType === "slide-up") {
      gsap.fromTo(targets, 
        { y: config.y, opacity: 0 }, 
        {
          y: 0,
          opacity: 1,
          duration: config.duration,
          delay: config.delay,
          stagger: config.stagger,
          ease: "power3.out",
          scrollTrigger: scrollTriggerConfig
        }
      );
    } else if (animType === "slide-down") {
      gsap.fromTo(targets, 
        { y: -config.y, opacity: 0 }, 
        {
          y: 0,
          opacity: 1,
          duration: config.duration,
          delay: config.delay,
          stagger: config.stagger,
          ease: "power3.out",
          scrollTrigger: scrollTriggerConfig
        }
      );
    }
  });
}

// initGlobalTextAnimations() will be called in the consolidated listener at the end of this file.

//-----------

// image block animation

function initImageBlockAnimation() {
  const mediaTargets = document.querySelectorAll('[data-img-anim="block"]');
  if (!mediaTargets.length) return;

  mediaTargets.forEach((target) => {

    if (target.querySelector(".media-block-overlay")) return;

    let config = {
      type: "down",
      blockColor: "#f1f1f1", 
      duration: 1.5,
      delay: 0,
      stagger: 0.1,
      scrub: false, 
    };

    const rawSettings = target.getAttribute("data-settings");
    if (rawSettings) {
      try {
        const parsed = JSON.parse(rawSettings);
        if (parsed.type) config.type = parsed.type;
        if (parsed.blockColor) config.blockColor = parsed.blockColor;
        if (typeof parsed.duration === "number") config.duration = parsed.duration;
        if (typeof parsed.delay === "number") config.delay = parsed.delay;
        if (typeof parsed.stagger === "number") config.stagger = parsed.stagger;
        if (typeof parsed.scrub === "boolean") config.scrub = parsed.scrub;
        if (typeof parsed.repeat === "boolean") config.repeat = parsed.repeat;
      } catch (e) {
        console.error("Lỗi đọc cấu hình image settings:", e);
      }
    }

    // Tìm thẻ ảnh bên trong (Hỗ trợ cả thẻ img chuẩn và CustomImage component)
    const img = target.querySelector("img, video");
    if (!img) return;

    // 2. TỰ ĐỘNG SINH KHỐI MÀU CUSTOM OVERLAY
    const overlay = document.createElement("div");
    overlay.className = "media-block-overlay";
    overlay.style.backgroundColor = config.blockColor; 
    target.appendChild(overlay);

    // 3. XÂY DỰNG TIMELINE HOẠT HỌA PHỐI HỢP VỚI SCROLLTRIGGER
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: target,
        start: "top 80%", // Kích hoạt khi khung ảnh chạm 80% viewport
        scrub: config.scrub ? (typeof config.scrub === "boolean" ? 0.5 : config.scrub) : false, // Bật/Tắt scrub theo cấu hình
        toggleActions: config.repeat 
          ? "play reverse play reverse"  // Nếu repeat: on -> Tự động chạy lại khi cuộn lên/xuống
          : "play none none none",       // Nếu repeat: off -> Chỉ chạy đúng 1 lần duy nhất
        invalidateOnRefresh: true
      }
    });

    // Thiết lập trạng thái ban đầu dựa theo hướng 'down'
    if (config.type === "down") {
      // Đặt khối màu phủ kín 100% từ đỉnh xuống đáy
      gsap.set(overlay, { clipPath: "inset(0% 0% 0% 0%)" });
      gsap.set(img, { scale: 1.1, opacity: 0 }); // Ảnh hơi scale nhẹ để tạo cảm giác cinematic khi lộ ra

      // Chạy chuỗi hiệu ứng (Timeline)
      tl.to(img, {
        opacity: 1,
        scale: 1,
        duration: 0.4,
        delay: config.delay, // Áp dụng độ trễ xuất hiện
        ease: "power2.out"
      })
      .to(overlay, {
        // Quét mặt nạ kéo từ trên xuống dưới (độ hở inset top tăng từ 0% lên 100%)
        clipPath: "inset(100% 0% 0% 0%)", 
        duration: config.duration, // Áp dụng thời gian chạy duration
        ease: "power3.inOut",
        stagger: config.stagger // Áp dụng độ trễ stagger nếu có nhiều ảnh song song
      }, "-=0.4"); // Chạy gối đầu đè lên nhau nhẹ để tạo sự mượt mà
    }
  });
}

//image hero block animation (tự chạy không cần scroll)

function initHeroImageBlockAnimation() {
  // Tìm riêng các khối được chỉ định làm hiệu ứng Hero tự động
  const heroTargets = document.querySelectorAll('[data-img-anim="hero-block"]');
  if (!heroTargets.length) return;

  heroTargets.forEach((target) => {
    if (target.querySelector(".media-block-overlay")) return;

    // --- PARSE CẤU HÌNH AN TOÀN TỪ DATA-SETTINGS ---
    let config = {
      type: "down",
      blockColor: "#f1f1f1",
      duration: 1.5,
      delay: 1.3,
      stagger: 0.1
    };

    const rawSettings = target.getAttribute("data-settings");
    if (rawSettings) {
      try {
        const sanitized = rawSettings.replace(/'/g, '"');
        const parsed = JSON.parse(sanitized);
        if (parsed.type) config.type = parsed.type;
        if (parsed.blockColor) config.blockColor = parsed.blockColor;
        if (typeof parsed.duration === "number") config.duration = parsed.duration;
        if (typeof parsed.delay === "number") config.delay = parsed.delay;
        if (typeof parsed.stagger === "number") config.stagger = parsed.stagger;
      } catch (e) {
        console.warn("Dùng cấu hình mặc định cho Hero do lỗi JSON:", e);
      }
    }

    const img = target.querySelector("img, .hero-image");
    if (!img) return;

    // Tự sinh khối màu lót overlay
    const overlay = document.createElement("div");
    overlay.className = "media-block-overlay";
    overlay.style.backgroundColor = config.blockColor;
    target.appendChild(overlay);

    // --- HÀM CHẠY TỰ ĐỘNG KHÔNG CẦN SCROLL ---
    const runHeroAnimation = () => {
      // Khởi tạo Timeline thuần túy tự chạy
      const tl = gsap.timeline();

      if (config.type === "down") {
        // Thiết lập trạng thái gốc
        gsap.set(overlay, { clipPath: "inset(0% 0% 0% 0%)" });
        gsap.set(img, { scale: 1.08, opacity: 0 });

        tl.to(img, {
          opacity: 1,
          scale: 1,
          duration: 0.3,
          delay: config.delay, // Chờ đúng khoảng delay quy định (1.3s)
          ease: "power2.out"
        })
        .to(overlay, {
          clipPath: "inset(100% 0% 0% 0%)", // Quét khối màu tuột xuống dưới để lộ ảnh
          duration: config.duration, // Chạy trong bao lâu (1.5s)
          ease: "power3.inOut",
          stagger: config.stagger
        }, "-=0.2"); // Gối đầu nhẹ giúp hiệu ứng mượt mà
      }
    };

    // Đảm bảo ảnh đã nạp dữ liệu xong để tránh lỗi nhảy pixel
    if (img.complete) {
      runHeroAnimation();
    } else {
      img.addEventListener("load", runHeroAnimation);
    }
  });
}

function initHumanSideStack() {
  if (window.innerWidth <= 991) return;

  const section = document.querySelector(".human-side");
  const cards = document.querySelectorAll("[data-stack-card]");
  if (!section || !cards.length) return;

  // 1. Trạng thái ban đầu: Tất cả card xếp chồng tại chỗ, mỗi card xoay so le nhẹ (Scatter)
  cards.forEach((card, index) => {
    const initRotate = card.getAttribute("data-rotate") || "0";
    
    gsap.set(card, {
      rotation: parseFloat(initRotate),
      y: 0,
      zIndex: index + 1,          // Card cuối cùng trong DOM nằm trên cùng
      transformOrigin: "center center"
    });
  });

  // 2. Khởi tạo Timeline cuộn ghim
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: "+=200%",               // Kéo dài tiến trình cuộn để từng card bay đi mượt mà
      scrub: 0.6,
      pin: true,
      invalidateOnRefresh: true
    }
  });

  // 3. Lần lượt đẩy card trên cùng bay lên mất hút (từ card cuối → card thứ 2)
  //    Card đáy (index 0) giữ nguyên làm card cuối cùng hiển thị
  const totalCards = cards.length;
  for (let i = totalCards - 1; i >= 1; i--) {
    tl.to(cards[i], {
      yPercent: -200,              // Trượt thẳng lên trên bay mất hút
      opacity: 1,                  // Mờ dần khi bay xa
      ease: "power2.inOut",
      duration: 1
    });
  }
}

//mask transition animation

function initGlobalMaskTransition() {
    // Tìm tất cả các section đăng ký sử dụng hiệu ứng mask trên trang
    const maskWrappers = document.querySelectorAll('[data-mask-trigger="true"]');
    
    if (!maskWrappers.length) return;

    maskWrappers.forEach((wrapper) => {
      // Xác định phần tử con thứ nhất (Tấm màn)
      const topLayer = wrapper.children[0];
      if (!topLayer) return;

      // Tạo timeline độc lập cho từng cụm UI
      gsap.fromTo(topLayer, 
        {
          // TỪ: Phủ kín toàn bộ màn hình
          clipPath: "polygon(0% 0%, 100% 0%, 100% 50%, 0% 50%, 0% 50%, 100% 50%, 100% 100%, 0% 100%)",
          webkitClipPath: "polygon(0% 0%, 100% 0%, 100% 50%, 0% 50%, 0% 50%, 100% 50%, 100% 100%, 0% 100%)"
        },
        {
          // ĐẾN: Co dẹt lại thành một đường thẳng ở chính giữa (Mở ra hai đầu Top/Bottom)
          clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%, 0% 100%, 100% 100%, 100% 100%, 0% 100%)",
          webkitClipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%, 0% 100%, 100% 100%, 100% 100%, 0% 100%)",
          ease: "none",
          scrollTrigger: {
            trigger: wrapper,
            start: "top top",      // Ghim khi wrapper chạm đỉnh màn hình
            // FIX: Dùng function để tính end LUÔN dựa trên chiều cao thực tế sau khi layout,
            // ảnh và font đã load xong — tránh lỗi đo sai khi dùng "+=120%" (% của element height
            // được tính tại thời điểm init, trước khi ảnh render xong → spacer quá ngắn).
            end: () => "+=" + (wrapper.offsetHeight + window.innerHeight * 0.5),
            scrub: 0.6,            // Vuốt mượt theo tay cuộn chuột
            pin: true,             // Khóa màn hình tại chỗ
            pinSpacing: true,      // Tường minh: GSAP thêm spacer đủ lớn để section sau không đè lên
            anticipatePin: 1,      // Tính toán trước vị trí ghim để tránh giật
            invalidateOnRefresh: true
          }
        }
      );
    });
  }

//image zoom animation

function initPureImageZoomScroll() {
    const zoomWrappers = document.querySelectorAll('[data-zoom-trigger="true"]');
    
    if (!zoomWrappers.length) return;

    zoomWrappers.forEach((wrapper) => {
      const mediaBox = wrapper.querySelector('.zoom-media-layer');
      if (!mediaBox) return;
      
      const img = mediaBox.querySelector("img");

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrapper,
          start: "top top",      // Ghim chặt khi chạm đỉnh màn hình
          end: "+=120%",         // Chiều dài hành trình cuộn chuột làm hiệu ứng
          scrub: 0.8,            // Độ vuốt mượt bám theo tay cuộn
          pin: true,             // Khóa màn hình tại chỗ
          pinSpacing: true,      // Tạo khoảng trống đệm ngăn section sau đè lên sớm
          anticipatePin: 1,      // Tính toán trước tọa độ ghim mượt mà
          invalidateOnRefresh: true
        }
      });

      // 1. Phóng to khung bọc ảnh tràn viền 100% và xóa bo góc
      tl.to(mediaBox, {
        width: "100vw",
        height: "100vh",
        borderRadius: "0px",
        ease: "none"
      }, 0);

      // 2. Tạo chuyển động thấu kính Parallax nhẹ cho ảnh bên trong
      if (img) {
        tl.to(img, {
          scale: 1.2,
          ease: "none"
        }, 0);
      }
    });
  }
  
document.addEventListener("astro:page-load", () => {
  console.log("🔄 Astro page navigated & Interaction System fully loaded");
  
  // Chạy trong requestAnimationFrame để đảm bảo tất cả font chữ, CSS và layout đã được render xong hoàn chỉnh trước khi đo offsetTop
  requestAnimationFrame(() => {
    // 1. Khởi chạy hệ thống Pin và Parallax gốc
    initUltimateInteractionSystem();
    
    // 2. Khởi chạy hiệu ứng chữ toàn trang
    initGlobalTextAnimations();
    initElementScrollAnimations();
    
    // 3. Khởi chạy các khối hiệu ứng hình ảnh/giao diện khác
    initImageBlockAnimation();
    initHeroImageBlockAnimation();
    initHumanSideStack();
    initGlobalMaskTransition(); 
    initPureImageZoomScroll();
    
    // 4. Sắp xếp và tính toán lại toàn bộ tọa độ ScrollTrigger chính xác
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
  });
});

