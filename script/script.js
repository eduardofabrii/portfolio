function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Curta de propósito: o suficiente pra não ser um corte seco, sem virar espera.
function smoothScrollTo(targetY, duration = 420) {
    const startY = window.scrollY;
    const diff = targetY - startY;
    const startTime = performance.now();

    // easeOutCubic: sai rápido e só desacelera na chegada.
    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    function step(currentTime) {
        const progress = Math.min((currentTime - startTime) / duration, 1);
        window.scrollTo(0, startY + diff * easeOutCubic(progress));

        if (progress < 1) {
            requestAnimationFrame(step);
        }
    }

    requestAnimationFrame(step);
}

function initSmoothAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener('click', (event) => {
            const target = document.getElementById(link.getAttribute('href').slice(1));

            if (!target) {
                return;
            }

            event.preventDefault();
            const offset = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
            smoothScrollTo(target.getBoundingClientRect().top + window.scrollY - offset);
        });
    });
}

function initHeaderDock() {
    const header = document.getElementById('header');

    if (!header) {
        return;
    }

    let ticking = false;

    // O header nunca some: encostado no topo ele fica limpo, e ao rolar
    // vira a pílula com blur.
    function update() {
        header.classList.toggle('is-stuck', window.scrollY > 40);
        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(update);
        }
    }, { passive: true });

    update();
}

function initExperienceSlides() {
    const stage = document.querySelector('.experience-stage');

    if (!stage) {
        return;
    }

    const track = stage.querySelector('.experience-track');
    const slides = Array.from(track.children);
    const dots = Array.from(document.querySelectorAll('.experience-dot'));
    const next = document.querySelector('.experience-next');
    const interval = 7000;

    if (!slides.length) {
        return;
    }

    let current = 0;
    let timer = null;

    // O palco tem altura fixa por causa do overflow; sem isso os slides curtos
    // deixariam o buraco do slide mais alto.
    function fitHeight() {
        stage.style.height = slides[current].offsetHeight + 'px';
    }

    function go(index) {
        current = (index + slides.length) % slides.length;
        track.style.transform = `translateX(-${current * 100}%)`;
        slides.forEach((slide, i) => slide.classList.toggle('is-active', i === current));
        dots.forEach((dot, i) => dot.classList.toggle('is-active', i === current));
        fitHeight();
    }

    function stop() {
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
    }

    function start() {
        stop();
        timer = setInterval(() => go(current + 1), interval);
    }

    stage.addEventListener('click', () => {
        go(current + 1);
        start();
    });

    if (next) {
        next.addEventListener('click', () => {
            go(current + 1);
            start();
        });
    }

    dots.forEach((dot, index) => {
        dot.addEventListener('click', (event) => {
            event.stopPropagation();
            go(index);
            start();
        });
    });

    stage.addEventListener('mouseenter', stop);
    stage.addEventListener('mouseleave', start);
    window.addEventListener('resize', fitHeight);

    go(0);
    start();
}

function initFaq() {
    document.querySelectorAll('.faq-question').forEach((question) => {
        question.addEventListener('click', () => {
            const answer = question.nextElementSibling;
            const toggleIcon = question.querySelector('.faq-toggle i');

            answer.classList.toggle('active');

            if (answer.classList.contains('active')) {
                toggleIcon.classList.replace('fa-chevron-down', 'fa-chevron-up');
            } else {
                toggleIcon.classList.replace('fa-chevron-up', 'fa-chevron-down');
            }
        });
    });
}

function readSlides(container) {
    const images = Array.from(container.querySelectorAll('img'));
    const extraSources = container.dataset.images
        ? container.dataset.images.split(',').map(source => source.trim()).filter(Boolean)
        : [];

    if (images.length > 1) {
        return images.map(image => ({ src: image.src, alt: image.alt }));
    }

    if (images.length === 1) {
        const first = { src: images[0].src, alt: images[0].alt };
        return [first, ...extraSources.map(src => ({ src, alt: '' }))];
    }

    return extraSources.map(src => ({ src, alt: '' }));
}

function buildTrack(container, slides) {
    const track = document.createElement('div');
    track.className = 'carousel-track';

    slides.forEach((slide, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'carousel-slide';

        const image = document.createElement('img');
        image.src = slide.src;
        image.alt = slide.alt || container.getAttribute('aria-label') || `Projeto imagem ${index + 1}`;
        image.loading = 'lazy';

        wrapper.appendChild(image);
        track.appendChild(wrapper);
    });

    return track;
}

function buildOverlay(container, savedOverlayHTML) {
    const overlay = document.createElement('div');
    overlay.className = 'overlay';

    if (savedOverlayHTML) {
        overlay.innerHTML = savedOverlayHTML;
    }

    if (container.dataset.links) {
        container.dataset.links
            .split(',')
            .map(link => link.trim())
            .filter(Boolean)
            .forEach((link) => {
                const anchor = document.createElement('a');
                anchor.href = link;
                anchor.target = '_blank';
                anchor.className = 'icon-link';
                anchor.setAttribute('aria-label', 'Abrir projeto');
                anchor.innerHTML = '<i class="fa-brands fa-github"></i>';
                overlay.appendChild(anchor);
            });
    }

    return overlay;
}

function buildArrow(direction) {
    const isPrevious = direction === 'prev';
    const button = document.createElement('button');

    button.className = isPrevious ? 'carousel-prev' : 'carousel-next';
    button.setAttribute('aria-label', isPrevious ? 'Anterior' : 'Próximo');
    button.innerHTML = `<i class="fa-solid fa-chevron-${isPrevious ? 'left' : 'right'}"></i>`;

    return button;
}

function setupCarouselControls(container, track, slideCount) {
    let current = 0;

    const previous = buildArrow('prev');
    const next = buildArrow('next');
    container.appendChild(previous);
    container.appendChild(next);

    const dots = document.createElement('div');
    dots.className = 'carousel-dots';
    const dotButtons = [];

    for (let index = 0; index < slideCount; index++) {
        const dot = document.createElement('button');
        dot.className = 'carousel-dot';
        dot.setAttribute('aria-label', `Ir para slide ${index + 1}`);

        if (index === 0) {
            dot.classList.add('active');
        }

        dot.addEventListener('click', () => goTo(index));
        dots.appendChild(dot);
        dotButtons.push(dot);
    }

    container.appendChild(dots);

    function update() {
        track.style.transform = `translateX(${-current * 100}%)`;
        dotButtons.forEach((dot, index) => dot.classList.toggle('active', index === current));
    }

    function goTo(index) {
        current = (index + slideCount) % slideCount;
        update();
    }

    previous.addEventListener('click', () => goTo(current - 1));
    next.addEventListener('click', () => goTo(current + 1));

    let startX = 0;
    let deltaX = 0;

    track.addEventListener('touchstart', (event) => {
        startX = event.touches[0].clientX;
    }, { passive: true });

    track.addEventListener('touchmove', (event) => {
        deltaX = event.touches[0].clientX - startX;
    }, { passive: true });

    track.addEventListener('touchend', () => {
        if (Math.abs(deltaX) > 50) {
            goTo(deltaX < 0 ? current + 1 : current - 1);
        }
        deltaX = 0;
    });

    container.tabIndex = 0;
    container.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft') {
            goTo(current - 1);
        }
        if (event.key === 'ArrowRight') {
            goTo(current + 1);
        }
    });

    update();
}

function initProjectCarousels() {
    document.querySelectorAll('.projects-container .project-image').forEach((container) => {
        const slides = readSlides(container);
        const existingOverlay = container.querySelector('.overlay');
        const savedOverlayHTML = existingOverlay ? existingOverlay.innerHTML : '';

        container.innerHTML = '';

        const track = buildTrack(container, slides);
        container.appendChild(track);
        container.appendChild(buildOverlay(container, savedOverlayHTML));

        if (slides.length > 1) {
            setupCarouselControls(container, track, slides.length);
        } else {
            track.style.transform = 'translateX(0)';
        }
    });
}

initFaq();
initSmoothAnchors();
initHeaderDock();
document.addEventListener('DOMContentLoaded', initProjectCarousels);
document.addEventListener('DOMContentLoaded', initExperienceSlides);
