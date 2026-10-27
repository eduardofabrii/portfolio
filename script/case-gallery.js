document.querySelectorAll('.case-carousel').forEach((carousel) => {
    const track = carousel.querySelector('.case-carousel-track');
    const slides = Array.from(track.children);
    const count = carousel.querySelector('[data-carousel-count]');
    let current = 0;

    function show(index) {
        current = (index + slides.length) % slides.length;
        track.style.transform = `translateX(-${current * 100}%)`;
        slides.forEach((slide, i) => {
            slide.inert = i !== current;
            slide.setAttribute('aria-hidden', String(i !== current));
            slide.setAttribute('role', 'group');
            slide.setAttribute('aria-roledescription', 'slide');
            slide.setAttribute('aria-label', `${i + 1} de ${slides.length}`);
        });
        count.textContent = `${current + 1} de ${slides.length}`;
    }

    carousel.querySelector('[data-carousel-prev]').addEventListener('click', () => show(current - 1));
    carousel.querySelector('[data-carousel-next]').addEventListener('click', () => show(current + 1));
    carousel.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault();
            show(current + (event.key === 'ArrowRight' ? 1 : -1));
        }
    });

    let start = null;
    carousel.addEventListener('touchstart', (event) => {
        const touch = event.touches[0];
        start = { x: touch.clientX, y: touch.clientY };
    }, { passive: true });
    carousel.addEventListener('touchend', (event) => {
        if (!start) return;
        const touch = event.changedTouches[0];
        const dx = touch.clientX - start.x;
        const dy = touch.clientY - start.y;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(current + (dx < 0 ? 1 : -1));
        start = null;
    }, { passive: true });
    carousel.addEventListener('touchcancel', () => { start = null; }, { passive: true });
    show(0);
});
