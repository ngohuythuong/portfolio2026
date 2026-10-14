import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, SplitText);

// Mốc màn hình chuẩn UX toàn hệ thống
const BP_DESKTOP = "(min-width: 1024px)";
const BP_MOBILE = "(max-width: 1023px)";
const BP_STACK = "(min-width: 992px)";

// Mỗi trang có 1 context + 1 matchMedia riêng → revert toàn bộ khi rời trang
let ctx;
let mm;

// ==========================================
// HELPERS
// ==========================================

/**
 * Đọc JSON từ data-settings và merge vào giá trị mặc định.
 * Chỉ nhận key có trong defaults và đúng kiểu (scrub nhận cả boolean lẫn number).
 */
function readSettings(el, defaults) {
  const config = { ...defaults };
  const raw = el.getAttribute("data-settings");
  if (!raw) return config;

  try {
    const parsed = JSON.parse(raw.replace(/'/g, '"'));
    for (const key in defaults) {
      const value = parsed[key];
      const isScrub = key === "scrub" && typeof value === "number";
      if (typeof value === typeof defaults[key] || isScrub) config[key] = value;
    }
  } catch (e) {
    console.warn("data-settings không hợp lệ:", el, e);
  }
  return config;
}

/** ScrollTrigger config dùng chung cho các hiệu ứng "xuất hiện khi cuộn tới" */
function revealTrigger(trigger, config, extra = {}) {
  return {
    trigger,
    start: "top 85%",
    scrub: config.scrub === true ? 0.5 : config.scrub,
    toggleActions: config.repeat ? "play reverse play reverse" : "play none none none",
    invalidateOnRefresh: true,
    ...extra,
  };
}

// Phần tử nằm trong khối bị ghim phải dùng container không bị ghim làm trigger
// để tọa độ cuộn ổn định (thứ tự = độ ưu tiên)
const STABLE_TRIGGERS = [
  "[data-pin-container]",
  ".human-side",
  '[data-mask-trigger="true"]',
  '[data-zoom-trigger="true"]',
];

function getTrigger(el) {
  for (const selector of STABLE_TRIGGERS) {
    const container = el.closest(selector);
    if (container) return container;
  }
  return el;
}

/** Chạy hàm tạo animation theo data-*-media: "desktop" | "mobile" | "all" */
function runForMedia(media, create) {
  if (media === "desktop") mm.add(BP_DESKTOP, () => { create(); });
  else if (media === "mobile") mm.add(BP_MOBILE, () => { create(); });
  else create();
}

function createOverlay(target, color) {
  const overlay = document.createElement("div");
  overlay.className = "media-block-overlay";
  overlay.style.backgroundColor = color;
  target.appendChild(overlay);
  return overlay;
}

// ==========================================
// 1. PARALLAX
// ==========================================

function initParallax() {
  document.querySelectorAll("[data-parallax-container]").forEach((container) => {
    const target = container.querySelector("[data-parallax-element]");
    if (!target) return;

    const { parallaxStart, parallaxEnd, parallaxMedia, parallaxY } = container.dataset;
    // Mặc định tịnh tiến -20% (phù hợp video/ảnh cao 120vh-130vh)
    const yPercent = parseFloat(parallaxY) || -20;

    runForMedia(parallaxMedia, () => {
      gsap.fromTo(target, { yPercent: 0 }, {
        yPercent,
        ease: "none",
        scrollTrigger: {
          trigger: container,
          start: parallaxStart || "top bottom",
          end: parallaxEnd || "bottom top",
          scrub: 1.5,
          invalidateOnRefresh: true,
        },
      });
    });
  });
}

// ==========================================
// 2. PIN
// ==========================================

function initPins() {
  document.querySelectorAll("[data-pin-container]").forEach((container) => {
    const pinElement = container.querySelector("[data-pin-element]");
    if (!pinElement) return;

    const { pinStart, pinEnd, pinMode, pinMedia, pinSpace } = container.dataset;

    const scrollTrigger = {
      trigger: container,
      pin: pinElement,
      start: pinStart || "top 15%",
      end: pinEnd || "bottom top",
      endTrigger: container.querySelector("[data-pin-end-trigger]") || container,
      pinSpacing: pinSpace === "true",
      scrub: true,
      invalidateOnRefresh: true,
      anticipatePin: 1,
    };

    runForMedia(pinMedia, () => {
      if (pinMode === "backward") {
        gsap.to(pinElement, { scale: 0.9, opacity: 0.8, yPercent: -15, ease: "none", scrollTrigger });
      } else {
        ScrollTrigger.create(scrollTrigger);
      }
    });
  });
}

// ==========================================
// 3. MARQUEE
// ==========================================

function initMarquees() {
  document.querySelectorAll(".marquee:not([data-anim-initialized])").forEach((marquee) => {
    const track = marquee.querySelector(".marquee__track");
    if (!track) return;
    marquee.dataset.animInitialized = "true";

    // Nhân 3 bản sao để lặp liền mạch (4 bản → dịch -25% = đúng 1 bản)
    const originals = [...track.children];
    for (let i = 0; i < 3; i++) {
      originals.forEach((node) => {
        const clone = node.cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        track.appendChild(clone);
      });
    }

    const tween = gsap.to(track, { xPercent: -25, ease: "none", duration: 25, repeat: -1 });

    // Tạm dừng khi ra khỏi màn hình để tiết kiệm tài nguyên
    ScrollTrigger.create({
      trigger: marquee,
      start: "top bottom",
      end: "bottom top",
      onToggle: (self) => (self.isActive ? tween.play() : tween.pause()),
    });

    marquee.addEventListener("mouseenter", () => tween.pause());
    marquee.addEventListener("mouseleave", () => tween.play());
  });
}

// ==========================================
// 4. TEXT ANIMATION (SplitText)
// ==========================================

const TEXT_DEFAULTS = {
  bgColor: "rgba(0,0,0,0.32)",
  fgColor: "currentColor",
  duration: 1.5,
  delay: 0,
  stagger: 0.1,
  scrub: false,
  repeat: false,
};

function initTextAnimations() {
  document.querySelectorAll("[data-split-text-anim]").forEach((el) => {
    const type = el.getAttribute("data-split-text-anim");
    if (!el.textContent.trim()) return;

    const config = readSettings(el, TEXT_DEFAULTS);
    const trigger = getTrigger(el);
    const tweenVars = {
      duration: config.duration,
      delay: config.delay,
      stagger: config.stagger,
    };

    // --- WORD UP / LINE UP: từng từ/dòng trượt lên từ trong mask ---
    if (type === "word" || type === "line") {
      const unit = type === "word" ? "words" : "lines";

      SplitText.create(el, {
        type: unit,
        mask: unit,
        [`${unit}Class`]: `split-${type}`,
        // Tách dòng phụ thuộc font & chiều rộng → tự tách lại khi font load / resize
        autoSplit: type === "line",
        onSplit: (self) =>
          gsap.fromTo(self[unit], { yPercent: 100 }, {
            ...tweenVars,
            yPercent: 0,
            ease: config.scrub ? "none" : "power3.out",
            scrollTrigger: revealTrigger(trigger, config),
          }),
      });
    }

    // --- LINES MASK: lớp chữ đậm quét từ trái sang phải trên lớp chữ mờ ---
    else if (type === "linesMask") {
      // currentColor phải lấy trước khi đổi màu dòng sang bgColor
      const fgColor = config.fgColor === "currentColor" ? getComputedStyle(el).color : config.fgColor;

      SplitText.create(el, {
        type: "lines",
        linesClass: "anim_line_mask",
        autoSplit: true,
        onSplit: (self) => {
          const foregrounds = self.lines.map((line) => {
            line.style.color = config.bgColor;

            const fg = document.createElement("span");
            fg.className = "line-fg";
            fg.setAttribute("aria-hidden", "true");
            fg.textContent = line.textContent;
            fg.style.color = fgColor;
            line.appendChild(fg);
            return fg;
          });

          return gsap.fromTo(foregrounds, { clipPath: "inset(0% 100% 0% 0%)" }, {
            ...tweenVars,
            clipPath: "inset(0% 0% 0% 0%)",
            ease: config.scrub ? "none" : "power2.out",
            scrollTrigger: revealTrigger(trigger, config, { start: "top 65%", end: "bottom 35%" }),
          });
        },
      });
    }
  });
}

// ==========================================
// 5. ELEMENT SCROLL ANIMATION (slide-up / slide-down)
// ==========================================

const SCROLL_DEFAULTS = {
  duration: 1.5,
  delay: 0,
  y: 80,
  stagger: 0.15,
  scrub: false,
  repeat: false,
  staggerChildren: false,
  selector: "",
};

function initScrollReveal() {
  document.querySelectorAll("[data-scroll-anim]").forEach((el) => {
    const type = el.getAttribute("data-scroll-anim");
    if (type !== "slide-up" && type !== "slide-down") return;

    const config = readSettings(el, SCROLL_DEFAULTS);

    // Stagger con: data-scroll-stagger="<selector>" > config.selector > con trực tiếp
    let targets = el;
    const staggerAttr = el.getAttribute("data-scroll-stagger");
    if (staggerAttr !== null || config.staggerChildren || config.selector) {
      const selector = staggerAttr && staggerAttr !== "true" ? staggerAttr : config.selector || ":scope > *";
      const children = el.querySelectorAll(selector);
      if (children.length) targets = children;
    }

    gsap.fromTo(targets, { y: type === "slide-up" ? config.y : -config.y, opacity: 0 }, {
      y: 0,
      opacity: 1,
      duration: config.duration,
      delay: config.delay,
      stagger: config.stagger,
      ease: "power3.out",
      scrollTrigger: revealTrigger(getTrigger(el), config, { start: "top 90%" }),
    });
  });
}

// ==========================================
// 6. IMAGE BLOCK REVEAL
// ==========================================

function initImageBlocks() {
  document.querySelectorAll('[data-img-anim="block"]').forEach((target) => {
    const config = readSettings(target, {
      type: "down",
      blockColor: "#f1f1f1",
      duration: 1.5,
      delay: 0,
      scrub: false,
      repeat: false,
    });

    const media = target.querySelector("img, video");
    if (config.type !== "down" || !media) return;

    const overlay = createOverlay(target, config.blockColor);

    gsap.timeline({ scrollTrigger: revealTrigger(target, config, { start: "top 80%" }) })
      // Ảnh hơi phóng to rồi thu về để tạo cảm giác cinematic khi lộ ra
      .fromTo(media, { scale: 1.1, opacity: 0 }, {
        scale: 1,
        opacity: 1,
        duration: 0.4,
        delay: config.delay,
        ease: "power2.out",
      })
      // Khối màu tuột từ trên xuống dưới
      .fromTo(overlay, { clipPath: "inset(0% 0% 0% 0%)" }, {
        clipPath: "inset(100% 0% 0% 0%)",
        duration: config.duration,
        ease: "power3.inOut",
      }, "-=0.4");
  });
}

// Hero: tự chạy khi ảnh load xong, không cần scroll
function initHeroImageBlocks() {
  document.querySelectorAll('[data-img-anim="hero-block"]').forEach((target) => {
    const config = readSettings(target, {
      type: "down",
      blockColor: "#f1f1f1",
      duration: 1.5,
      delay: 1.3,
    });

    const img = target.querySelector("img, .hero-image");
    if (config.type !== "down" || !img) return;

    const overlay = createOverlay(target, config.blockColor);

    // ctx.add để timeline vẫn được dọn khi chạy bất đồng bộ (sau sự kiện load)
    const play = () => ctx?.add(() => {
      gsap.timeline()
        .fromTo(img, { scale: 1.08, opacity: 0 }, {
          scale: 1,
          opacity: 1,
          duration: 0.3,
          delay: config.delay,
          ease: "power2.out",
        })
        .fromTo(overlay, { clipPath: "inset(0% 0% 0% 0%)" }, {
          clipPath: "inset(100% 0% 0% 0%)",
          duration: config.duration,
          ease: "power3.inOut",
        }, "-=0.2");
    });

    // Đợi ảnh nạp xong để tránh nhảy pixel; lỗi ảnh vẫn chạy để không kẹt overlay
    if (img.complete) {
      play();
    } else {
      img.addEventListener("load", play, { once: true });
      img.addEventListener("error", play, { once: true });
    }
  });
}

// ==========================================
// 7. HUMAN SIDE — STACK CARDS (desktop)
// ==========================================

function initHumanSideStack() {
  const section = document.querySelector(".human-side");
  const cards = gsap.utils.toArray("[data-stack-card]");
  if (!section || !cards.length) return;

  mm.add(BP_STACK, () => {
    // Xếp chồng, xoay so le nhẹ; card cuối trong DOM nằm trên cùng
    cards.forEach((card, index) => {
      gsap.set(card, {
        rotation: parseFloat(card.dataset.rotate) || 0,
        zIndex: index + 1,
        transformOrigin: "center center",
      });
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: "+=200%",
        scrub: 0.6,
        pin: true,
        invalidateOnRefresh: true,
      },
    });

    // Lần lượt đẩy card trên cùng bay lên; card đáy (index 0) giữ lại
    for (let i = cards.length - 1; i >= 1; i--) {
      tl.to(cards[i], { yPercent: -200, ease: "power2.inOut", duration: 1 });
    }
  });
}

// ==========================================
// LIFECYCLE (Astro View Transitions)
// ==========================================

function initPage() {
  mm = gsap.matchMedia();
  ctx = gsap.context(() => {});

  ctx.add(() => {
    initParallax();
    initPins();
    initMarquees();
    initTextAnimations();
    initScrollReveal();
    initImageBlocks();
    initHeroImageBlocks();
    initHumanSideStack();
  });

  // Sắp xếp theo vị trí trên trang rồi tính lại tọa độ
  ScrollTrigger.sort();
  ScrollTrigger.refresh();

  // Font custom load xong có thể làm đổi chiều cao layout
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}

// Hàm init đang chờ tín hiệu mở màn che (để gỡ nếu rời trang trước khi kịp chạy)
let pendingInit;

function cleanupPage() {
  if (pendingInit) document.removeEventListener("page:revealed", pendingInit);
  pendingInit = undefined;

  // Revert: kill tween/ScrollTrigger, gỡ pin-spacer, khôi phục text đã split
  mm?.revert();
  ctx?.revert();
  mm = ctx = undefined;
}

document.addEventListener("astro:page-load", () => {
  // requestAnimationFrame: đợi layout render xong trước khi đo
  const start = () => {
    pendingInit = undefined;
    requestAnimationFrame(initPage);
  };

  // Lần load đầu, loader + overlay che màn hình vài giây → đợi PageTransition
  // báo "page:revealed" rồi mới chạy, nếu không animation sẽ chạy xong khi còn bị che
  if (document.documentElement.dataset.revealed === "true") {
    start();
  } else {
    pendingInit = start;
    document.addEventListener("page:revealed", start, { once: true });
  }
});
// Trang cũ đã bị overlay che kín lúc này nên revert không gây giật hình
document.addEventListener("astro:before-swap", cleanupPage);
