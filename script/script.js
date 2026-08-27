const revealTargets = [
    document.querySelector('#hello-text'),
    document.querySelector('#greeting-text'),
    document.querySelector('#im-text'),
    document.querySelector('#name-text'),
    document.querySelector('#job-text'),
    document.querySelector('#btnn'),
    document.querySelector('#photo'),
    document.querySelector('#text-center'),
    document.querySelector('#about-me-sec'),
    document.querySelector('#text-aboutme'),
    document.querySelector('#experience'),
    document.querySelector('#tech'),
    document.querySelector('#contact-form'),
    document.querySelector('#navigation'),
    document.querySelector('#social-icons'),
    document.querySelector('#faq'),
].filter(Boolean);

ScrollReveal().reveal(revealTargets, {
    duration: 1500,
    origin: 'bottom',
    scale: 0.9,
    easing: 'ease-in-out',
    reset: true
});

ScrollReveal().reveal('.projects-container .project-content', {
    duration: 1100,
    origin: 'bottom',
    distance: '30px',
    easing: 'ease-in-out',
    interval: 180,
    reset: true
});

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
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
document.addEventListener('DOMContentLoaded', initProjectCarousels);
