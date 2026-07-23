
// Elementos para o Scroll Reveal
var nodeArray = [
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

ScrollReveal().reveal(nodeArray, {
    duration: 1500,
    origin: 'bottom',
    scale: 0.9, // escala inicial menor para dar efeito de zoom
    easing: 'ease-in-out',
    reset: true // permite que a animação aconteça novamente ao rolar para cima
});

// Animação específica dos cards de projetos, sem expandir a seção inteira
ScrollReveal().reveal('.projects-container .project-content', {
    duration: 1100,
    origin: 'bottom',
    distance: '30px',
    easing: 'ease-in-out',
    interval: 180,
    reset: true
});

// Quadradinho lateral para subir tela
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}


// Abrir perguntas frequentes
const faqQuestions = document.querySelectorAll(".faq-question");

faqQuestions.forEach((question) => {
    question.addEventListener("click", () => {
        const answer = question.nextElementSibling;
        const toggleIcon = question.querySelector(".faq-toggle i");

        // Muda a visibilidade da resposta
        answer.classList.toggle("active");

        // Altera o ícone
        if (answer.classList.contains("active")) {
            toggleIcon.classList.replace("fa-chevron-down", "fa-chevron-up");
        } else {
            toggleIcon.classList.replace("fa-chevron-up", "fa-chevron-down");
        }
    });
});


// Projetos: carousel simples por projeto
function initProjectCarousels() {
    const projectImages = document.querySelectorAll('.projects-container .project-image');

    projectImages.forEach((container) => {
        // gather image URLs (+ alt text): existing <img> children or data-images attribute
        const existingImgs = Array.from(container.querySelectorAll('img'));
        let slides = [];

        if (existingImgs.length > 1) {
            slides = existingImgs.map(img => ({ src: img.src, alt: img.alt }));
        } else if (existingImgs.length === 1 && container.dataset.images) {
            // data-images="url1,url2"
            const extra = container.dataset.images.split(',').map(s => s.trim()).filter(Boolean);
            slides = [{ src: existingImgs[0].src, alt: existingImgs[0].alt }, ...extra.map(src => ({ src, alt: '' }))];
        } else if (existingImgs.length === 1) {
            slides = [{ src: existingImgs[0].src, alt: existingImgs[0].alt }];
        } else if (container.dataset.images) {
            slides = container.dataset.images.split(',').map(s => s.trim()).filter(Boolean).map(src => ({ src, alt: '' }));
        }

        // preserve existing overlay HTML (GitHub/download icons), then clear container and build carousel structure
        const existingOverlay = container.querySelector('.overlay');
        const existingOverlayHTML = existingOverlay ? existingOverlay.innerHTML : '';
        container.innerHTML = '';
        const track = document.createElement('div');
        track.className = 'carousel-track';
        slides.forEach((slideData, i) => {
            const slide = document.createElement('div');
            slide.className = 'carousel-slide';
            const img = document.createElement('img');
            img.src = slideData.src;
            img.alt = slideData.alt || container.getAttribute('aria-label') || `Projeto imagem ${i + 1}`;
            img.loading = 'lazy';
            slide.appendChild(img);
            track.appendChild(slide);
        });
        container.appendChild(track);

        // overlay (icons) already existed in markup before; create a wrapper and restore previous content if any
        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        if (existingOverlayHTML) overlay.innerHTML = existingOverlayHTML;
        // keep existing icon links from data-links (optional) in addition to restored HTML
        if (container.dataset.links) {
            const links = container.dataset.links.split(',').map(s => s.trim()).filter(Boolean);
            links.forEach(link => {
                const a = document.createElement('a');
                a.href = link;
                a.target = '_blank';
                a.className = 'icon-link';
                a.setAttribute('aria-label', 'Abrir projeto');
                a.innerHTML = '<i class="fa-brands fa-github"></i>';
                overlay.appendChild(a);
            });
        }
        container.appendChild(overlay);

        // controls and dots only if more than 1 slide
        let current = 0;
        const slideCount = slides.length;

        if (slideCount > 1) {
            const prev = document.createElement('button');
            prev.className = 'carousel-prev';
            prev.setAttribute('aria-label', 'Anterior');
            prev.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';

            const next = document.createElement('button');
            next.className = 'carousel-next';
            next.setAttribute('aria-label', 'Próximo');
            next.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';

            container.appendChild(prev);
            container.appendChild(next);

            const dots = document.createElement('div');
            dots.className = 'carousel-dots';
            const dotButtons = [];
            for (let i = 0; i < slideCount; i++) {
                const b = document.createElement('button');
                b.className = 'carousel-dot';
                b.setAttribute('aria-label', `Ir para slide ${i + 1}`);
                if (i === 0) b.classList.add('active');
                dots.appendChild(b);
                dotButtons.push(b);
                b.addEventListener('click', () => goTo(i));
            }
            container.appendChild(dots);

            function update() {
                const offset = -current * 100;
                track.style.transform = `translateX(${offset}%)`;
                dotButtons.forEach((b, i) => b.classList.toggle('active', i === current));
            }

            function goTo(i) {
                current = (i + slideCount) % slideCount;
                update();
            }

            prev.addEventListener('click', () => goTo(current - 1));
            next.addEventListener('click', () => goTo(current + 1));

            // touch support
            let startX = 0;
            let deltaX = 0;
            track.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, {passive:true});
            track.addEventListener('touchmove', (e) => { deltaX = e.touches[0].clientX - startX; }, {passive:true});
            track.addEventListener('touchend', () => {
                if (Math.abs(deltaX) > 50) {
                    if (deltaX < 0) goTo(current + 1); else goTo(current - 1);
                }
                deltaX = 0;
            });

            // keyboard navigation when container focused
            container.tabIndex = 0;
            container.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowLeft') goTo(current - 1);
                if (e.key === 'ArrowRight') goTo(current + 1);
            });

            // initial layout (track e slides ficam 100% via CSS/flex; só a transform muda)
            update();
        } else {
            // single image: make sure track fills and no controls
            track.style.transform = 'translateX(0)';
        }
    });
}

// initialize after DOM ready
document.addEventListener('DOMContentLoaded', initProjectCarousels);

