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
    document.querySelector('#cv'),
    document.querySelector('#tech'),
    document.querySelector('#contact-form'),
    document.querySelector('#navigation'),
    document.querySelector('#social-icons'),
];

var leftToCenter = [
    document.querySelector('#projects-img-1'),
    document.querySelector('#projects-desc-2'),
];

var rightToCenter = [
    document.querySelector('#projects-desc-1'),
    document.querySelector('#projects-img-2'),
];

ScrollReveal().reveal(nodeArray, { 
    duration: 1500,
    origin: 'bottom',
    scale: 0.9, // escala inicial menor para dar efeito de zoom
    easing: 'ease-in-out',
    reset: true // permite que a animação aconteça novamente ao rolar para cima
});

ScrollReveal().reveal(leftToCenter, { 
    duration: 2000, 
    origin: 'left',
    distance: '100%', 
    easing: 'ease-in-out',
    reset: true 
});

ScrollReveal().reveal(rightToCenter, { 
    duration: 2000, 
    origin: 'right',
    distance: '100%', 
    easing: 'ease-in-out',
    reset: true 
});