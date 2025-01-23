
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
    document.querySelector('#cv'),
    document.querySelector('#tech'),
    document.querySelector('#contact-form'),
    document.querySelector('#navigation'),
    document.querySelector('#social-icons'),
    document.querySelector('#faq'),
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

// Menu Sanduiche
const menuToggle = document.querySelector('.menu-toggle');
const navBar = document.querySelector('.nav-bar');

menuToggle.addEventListener('click', () => {
    navBar.classList.toggle('active');
    menuToggle.classList.toggle('open');
});


// Quadradinho lateral para subir tela
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}


// Abrir perguntas frequentes
document.addEventListener("DOMContentLoaded", () => {
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
});