var nodeArray = [
    document.querySelector('#header'),
    document.querySelector('#hello-text'),
    document.querySelector('#im-text'),
    document.querySelector('#name-text'),
    document.querySelector('#job-text'),
    document.querySelector('#button'),
    document.querySelector('#about'),
    document.querySelector('#photo'),
    document.querySelector('#about-me-sec'),
    document.querySelector('#text-aboutme'),
    document.querySelector('#cv'),
    document.querySelector('#tech'),
    document.querySelector('#projects'),
    document.querySelector('#projects-1'),
    document.querySelector('#projects-2'),
    document.querySelector('#contact-form'),
    document.querySelector('#navigation'),
    document.querySelector('#social-icons'),
];

ScrollReveal().reveal(nodeArray, { 
    duration: 1000,
    origin: 'bottom',
    distance: '10px', // distância do movimento
    easing: 'ease-in-out',
    reset: true // permite que a animação aconteça novamente ao rolar para cima
});