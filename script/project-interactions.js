(() => {
    const links = [...document.querySelectorAll('.case-image > a')];
    if (!links.length) return;
    const viewer = document.createElement('dialog');
    viewer.className = 'image-viewer';
    viewer.setAttribute('aria-label', 'Imagens ampliadas do projeto');
    viewer.innerHTML = '<button type="button" class="viewer-close" aria-label="Fechar imagem ampliada">fechar <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 4 8 8m0-8-8 8"/></svg></button><button type="button" class="viewer-arrow viewer-prev" aria-label="Imagem anterior"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6"/></svg></button><figure class="viewer-figure"><img class="viewer-image" alt=""><figcaption class="viewer-caption" aria-live="polite" aria-atomic="true"><span class="viewer-count"></span><span class="viewer-description"></span></figcaption></figure><button type="button" class="viewer-arrow viewer-next" aria-label="Próxima imagem"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 6 6 6-6 6"/></svg></button>';
    document.body.append(viewer);
    const image = viewer.querySelector('img');
    const caption = viewer.querySelector('.viewer-description');
    const count = viewer.querySelector('.viewer-count');
    const closeButton = viewer.querySelector('.viewer-close');
    const previous = viewer.querySelector('.viewer-prev');
    const next = viewer.querySelector('.viewer-next');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let source = null, opener = null, busy = false, closeRequested = false, previousOverflow = '';
    let gallery = [], current = 0, carousel = null, track = null, trackTransition = '';

    function move(from, to, opening) {
        if (reduced.matches || !from.width || !to.width) return Promise.resolve();
        const transform = `translate(${from.x + from.width / 2 - to.x - to.width / 2}px, ${from.y + from.height / 2 - to.y - to.height / 2}px) scale(${from.width / to.width}, ${from.height / to.height})`;
        const frames = [{ transform, opacity: .5 }, { transform: 'none', opacity: 1 }];
        return image.animate(opening ? frames : frames.reverse(), { duration: opening ? 330 : 230, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'both' }).finished.catch(() => {});
    }

    async function loadCurrent() {
        opener = gallery[current];
        source = opener.querySelector('img');
        image.src = opener.href;
        image.alt = source.alt;
        caption.textContent = opener.parentElement.querySelector('figcaption')?.textContent || source.alt;
        count.textContent = `${current + 1} / ${gallery.length}`;
        previous.hidden = next.hidden = gallery.length < 2;
        await image.decode().catch(() => {});
    }

    function ready() {
        busy = false;
        if (closeRequested) { closeRequested = false; close(); return false; }
        return true;
    }

    async function navigate(direction) {
        if (busy || !viewer.open || gallery.length < 2) return;
        busy = true;
        source.style.visibility = '';
        current = (current + direction + gallery.length) % gallery.length;
        // Keep the carousel underneath on the same image, including its focus target.
        const selectedSlide = gallery[current].closest('.case-image');
        const slideIndex = [...carousel.querySelectorAll('.case-image')].indexOf(selectedSlide);
        carousel.dispatchEvent(new CustomEvent('case-gallery:show', { detail: { index: slideIndex } }));
        await loadCurrent();
        source.style.visibility = 'hidden';
        if (!reduced.matches) {
            await image.animate([{ opacity: .35, transform: `translateX(${direction * 12}px)` }, { opacity: 1, transform: 'none' }], { duration: 170, easing: 'ease-out' }).finished.catch(() => {});
        }
        ready();
    }

    async function close() {
        if (!viewer.open) return;
        if (busy) { closeRequested = true; return; }
        busy = true;
        await move(source.getBoundingClientRect(), image.getBoundingClientRect(), false);
        source.style.visibility = '';
        viewer.close();
        document.documentElement.style.overflow = previousOverflow;
        if (track) track.style.transition = trackTransition;
        image.getAnimations().forEach(a => a.cancel());
        opener.focus({ preventScroll: true });
        busy = false;
    }

    links.forEach(link => link.addEventListener('click', async event => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
        if (!viewer.showModal) return;
        event.preventDefault();
        if (busy || viewer.open) return;
        busy = true;
        carousel = link.closest('.case-carousel');
        gallery = carousel ? [...carousel.querySelectorAll('.case-image > a')] : links;
        current = gallery.indexOf(link);
        const start = link.querySelector('img').getBoundingClientRect();
        await loadCurrent();
        track = carousel?.querySelector('.case-carousel-track');
        trackTransition = track?.style.transition || '';
        if (track) track.style.transition = 'none';
        previousOverflow = document.documentElement.style.overflow;
        document.documentElement.style.overflow = 'hidden';
        viewer.showModal();
        source.style.visibility = 'hidden';
        await move(start, image.getBoundingClientRect(), true);
        image.getAnimations().forEach(a => a.cancel());
        if (ready()) closeButton.focus({ preventScroll: true });
    }));
    previous.addEventListener('click', () => navigate(-1));
    next.addEventListener('click', () => navigate(1));
    closeButton.addEventListener('click', close);
    viewer.addEventListener('cancel', event => { event.preventDefault(); close(); });
    viewer.addEventListener('click', event => { if (event.target === viewer) close(); });
    viewer.addEventListener('keydown', event => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        event.stopPropagation();
        navigate(event.key === 'ArrowRight' ? 1 : -1);
    });
})();
