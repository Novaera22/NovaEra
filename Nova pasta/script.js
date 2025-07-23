/**
 * Nova Era X - JavaScript Moderno e Otimizado
 * Desenvolvido para máxima performance e acessibilidade
 */

'use strict';

// ===== CONFIGURAÇÕES E UTILITÁRIOS =====
const CONFIG = {
    ANIMATION_DURATION: 300,
    SCROLL_OFFSET: 100,
    COUNTER_DURATION: 2000,
    MOBILE_BREAKPOINT: 768,
    THROTTLE_DELAY: 16, // ~60fps
};

// Utilitário para throttling de eventos
const throttle = (func, delay) => {
    let timeoutId;
    let lastExecTime = 0;
    return function (...args) {
        const currentTime = Date.now();
        
        if (currentTime - lastExecTime > delay) {
            func.apply(this, args);
            lastExecTime = currentTime;
        } else {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(this, args);
                lastExecTime = Date.now();
            }, delay - (currentTime - lastExecTime));
        }
    };
};

// Utilitário para debouncing
const debounce = (func, delay) => {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
};

// Detecção de dispositivos
const deviceDetection = {
    isMobile: () => window.innerWidth <= CONFIG.MOBILE_BREAKPOINT,
    isTouch: () => 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    prefersReducedMotion: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
};

// Cache de elementos DOM
const elements = {
    header: null,
    backToTop: null,
    mobileMenuToggle: null,
    mobileNav: null,
    mobileNavClose: null,
    mobileOverlay: null,
    loadingOverlay: null,
    navLinks: null,
    mobileNavLinks: null,
    scrollAnimateElements: null,
    statNumbers: null,
};

// Estado da aplicação
const appState = {
    isLoaded: false,
    isMobileMenuOpen: false,
    lastScrollY: 0,
    isScrolling: false,
    countersAnimated: false,
};

// ===== INICIALIZAÇÃO =====
class NovaEraXApp {
    constructor() {
        this.init();
    }

    async init() {
        try {
            // Cache de elementos DOM
            this.cacheElements();
            
            // Configuração inicial
            this.setupInitialState();
            
            // Event listeners
            this.bindEvents();
            
            // Configurações específicas
            this.setupIntersectionObserver();
            this.setupScrollEffects();
            this.setupMobileMenu();
            this.setupSmoothScrolling();
            
            // Loading completo
            await this.handlePageLoad();
            
            console.log('✅ Nova Era X - Aplicação inicializada com sucesso!');
        } catch (error) {
            console.error('❌ Erro na inicialização:', error);
        }
    }

    cacheElements() {
        const elementSelectors = {
            header: '#header',
            backToTop: '#backToTop',
            mobileMenuToggle: '#mobileMenuToggle',
            mobileNav: '#mobileNav',
            mobileNavClose: '#mobileNavClose',
            mobileOverlay: '#mobileOverlay',
            loadingOverlay: '#loadingOverlay',
        };

        // Cache elementos únicos
        Object.entries(elementSelectors).forEach(([key, selector]) => {
            elements[key] = document.querySelector(selector);
        });

        // Cache coleções de elementos
        elements.navLinks = document.querySelectorAll('.nav-link');
        elements.mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
        elements.scrollAnimateElements = document.querySelectorAll('.scroll-animate');
        elements.statNumbers = document.querySelectorAll('.stat-number');
    }

    setupInitialState() {
        // Configurar estado inicial do header
        if (elements.header) {
            elements.header.classList.toggle('scrolled', window.scrollY > CONFIG.SCROLL_OFFSET);
        }

        // Configurar estado inicial do botão back to top
        if (elements.backToTop) {
            elements.backToTop.classList.toggle('show', window.scrollY > 400);
        }

        // Definir link ativo baseado na URL
        this.updateActiveNavLink();
    }

    bindEvents() {
        // Scroll events (throttled)
        window.addEventListener('scroll', throttle(() => {
            this.handleScroll();
        }, CONFIG.THROTTLE_DELAY));

        // Resize events (debounced)
        window.addEventListener('resize', debounce(() => {
            this.handleResize();
        }, 250));

        // Mobile menu events
        if (elements.mobileMenuToggle) {
            elements.mobileMenuToggle.addEventListener('click', () => {
                this.toggleMobileMenu();
            });
        }

        if (elements.mobileNavClose) {
            elements.mobileNavClose.addEventListener('click', () => {
                this.closeMobileMenu();
            });
        }

        if (elements.mobileOverlay) {
            elements.mobileOverlay.addEventListener('click', () => {
                this.closeMobileMenu();
            });
        }

        // Back to top button
        if (elements.backToTop) {
            elements.backToTop.addEventListener('click', () => {
                this.scrollToTop();
            });
        }

        // Navigation links
        this.bindNavigationEvents();

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            this.handleKeyboard(e);
        });

        // Prevent context menu on touch devices for better UX
        if (deviceDetection.isTouch()) {
            document.addEventListener('contextmenu', (e) => {
                if (e.target.closest('.floating-element')) {
                    e.preventDefault();
                }
            });
        }
    }

    bindNavigationEvents() {
        // Desktop navigation
        elements.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                this.scrollToSection(targetId);
                this.updateActiveNavLink(link);
            });
        });

        // Mobile navigation
        elements.mobileNavLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                this.scrollToSection(targetId);
                this.updateActiveNavLink(link);
                this.closeMobileMenu();
            });
        });
    }

    // ===== SCROLL HANDLING =====
    handleScroll() {
        const currentScrollY = window.scrollY;
        
        // Header background
        if (elements.header) {
            elements.header.classList.toggle('scrolled', currentScrollY > CONFIG.SCROLL_OFFSET);
        }

        // Back to top button
        if (elements.backToTop) {
            elements.backToTop.classList.toggle('show', currentScrollY > 400);
        }

        // Update active navigation based on scroll position
        this.updateActiveNavOnScroll();

        // Parallax effect for hero (only on desktop and if motion is allowed)
        if (!deviceDetection.isMobile() && !deviceDetection.prefersReducedMotion()) {
            const hero = document.querySelector('.hero');
            if (hero && currentScrollY < window.innerHeight) {
                hero.style.transform = `translateY(${currentScrollY * 0.3}px)`;
            }
        }

        appState.lastScrollY = currentScrollY;
    }

    updateActiveNavOnScroll() {
        const sections = document.querySelectorAll('section[id]');
        const scrollPosition = window.scrollY + 200;

        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const id = section.getAttribute('id');

            if (scrollPosition >= top && scrollPosition < top + height) {
                // Update desktop nav
                elements.navLinks.forEach(link => {
                    link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
                });

                // Update mobile nav
                elements.mobileNavLinks.forEach(link => {
                    link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
                });
            }
        });
    }

    // ===== MOBILE MENU =====
    setupMobileMenu() {
        // Close mobile menu on outside click
        document.addEventListener('click', (e) => {
            if (appState.isMobileMenuOpen && 
                !elements.mobileNav.contains(e.target) && 
                !elements.mobileMenuToggle.contains(e.target)) {
                this.closeMobileMenu();
            }
        });
    }

    toggleMobileMenu() {
        if (appState.isMobileMenuOpen) {
            this.closeMobileMenu();
        } else {
            this.openMobileMenu();
        }
    }

    openMobileMenu() {
        appState.isMobileMenuOpen = true;
        elements.mobileNav.classList.add('open');
        elements.mobileOverlay.classList.add('active');
        elements.mobileMenuToggle.setAttribute('aria-expanded', 'true');
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        // Focus first menu item
        const firstMenuItem = elements.mobileNav.querySelector('.mobile-nav-link');
        if (firstMenuItem) {
            firstMenuItem.focus();
        }
    }

    closeMobileMenu() {
        appState.isMobileMenuOpen = false;
        elements.mobileNav.classList.remove('open');
        elements.mobileOverlay.classList.remove('active');
        elements.mobileMenuToggle.setAttribute('aria-expanded', 'false');
        
        // Restore body scroll
        document.body.style.overflow = '';
        
        // Return focus to toggle button
        elements.mobileMenuToggle.focus();
    }

    // ===== SMOOTH SCROLLING =====
    setupSmoothScrolling() {
        // Ensure smooth scrolling is supported
        if (!CSS.supports('scroll-behavior', 'smooth')) {
            this.polyfillSmoothScroll();
        }
    }

    scrollToSection(sectionId) {
        const section = document.querySelector(sectionId);
        if (!section) return;

        const headerHeight = elements.header ? elements.header.offsetHeight : 0;
        const targetPosition = section.offsetTop - headerHeight - 20;

        if (deviceDetection.prefersReducedMotion()) {
            window.scrollTo(0, targetPosition);
        } else {
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    }

    scrollToTop() {
        if (deviceDetection.prefersReducedMotion()) {
            window.scrollTo(0, 0);
        } else {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    }

    updateActiveNavLink(clickedLink = null) {
        if (clickedLink) {
            // Desktop nav
            elements.navLinks.forEach(link => {
                link.classList.remove('active');
            });
            clickedLink.classList.add('active');

            // Mobile nav
            elements.mobileNavLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === clickedLink.getAttribute('href')) {
                    link.classList.add('active');
                }
            });
        }
    }

    // ===== INTERSECTION OBSERVER =====
    setupIntersectionObserver() {
        const options = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        // Observer para animações de scroll
        const scrollObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate');
                }
            });
        }, options);

        elements.scrollAnimateElements.forEach(el => {
            scrollObserver.observe(el);
        });

        // Observer para contadores (hero stats)
        const heroObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !appState.countersAnimated) {
                    this.animateCounters();
                    appState.countersAnimated = true;
                    heroObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        const heroSection = document.querySelector('.hero');
        if (heroSection) {
            heroObserver.observe(heroSection);
        }
    }

    setupScrollEffects() {
        // FUNÇÃO ADICIONADA PRA NÃO DAR ERRO
        // Coloque aqui seus efeitos de scroll personalizados depois
    }

    // ===== COUNTER ANIMATION =====
    animateCounters() {
        elements.statNumbers.forEach(counter => {
            const target = parseInt(counter.dataset.target);
            const suffix = this.getCounterSuffix(target);
            
            this.animateCounter(counter, target, suffix);
        });
    }

    animateCounter(element, target, suffix = '') {
        const duration = CONFIG.COUNTER_DURATION;
        const start = 0;
        const increment = target / (duration / 16);
        let current = start;

        const updateCounter = () => {
            current += increment;
            
            if (current < target) {
                element.textContent = Math.floor(current) + (target !== 100 && target !== 24 ? '+' : suffix);
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = target + suffix;
            }
        };

        // Adicionar delay baseado no índice para efeito escalonado
        const delay = Array.from(elements.statNumbers).indexOf(element) * 200;
        setTimeout(updateCounter, delay);
    }

    getCounterSuffix(target) {
        switch (target) {
            case 100: return '%';
            case 24: return 'h';
            default: return '+';
        }
    }

    // ===== KEYBOARD NAVIGATION =====
    handleKeyboard(e) {
        // ESC key closes mobile menu
        if (e.key === 'Escape' && appState.isMobileMenuOpen) {
            this.closeMobileMenu();
        }

        // Tab navigation within mobile menu
        if (appState.isMobileMenuOpen && e.key === 'Tab') {
            this.handleMobileMenuTabbing(e);
        }
    }

    handleMobileMenuTabbing(e) {
        const focusableElements = elements.mobileNav.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
            if (document.activeElement === firstElement) {
                lastElement.focus();
                e.preventDefault();
            }
        } else {
            if (document.activeElement === lastElement) {
                firstElement.focus();
                e.preventDefault();
            }
        }
    }

    // ===== RESIZE HANDLING =====
    handleResize() {
        // Close mobile menu on resize to desktop
        if (!deviceDetection.isMobile() && appState.isMobileMenuOpen) {
            this.closeMobileMenu();
        }

        // Reset parallax on resize
        if (deviceDetection.isMobile()) {
            const hero = document.querySelector('.hero');
            if (hero) {
                hero.style.transform = '';
            }
        }
    }

    // ===== PAGE LOAD HANDLING =====
    async handlePageLoad() {
        return new Promise((resolve) => {
            const hideLoading = () => {
                if (elements.loadingOverlay) {
                    elements.loadingOverlay.classList.add('hidden');
                    
                    setTimeout(() => {
                        elements.loadingOverlay.style.display = 'none';
                        document.body.classList.add('loaded');
                        appState.isLoaded = true;
                        resolve();
                    }, 600);
                } else {
                    document.body.classList.add('loaded');
                    appState.isLoaded = true;
                    resolve();
                }
            };

            // Aguardar carregamento completo
            if (document.readyState === 'complete') {
                setTimeout(hideLoading, 500);
            } else {
                window.addEventListener('load', () => {
                    setTimeout(hideLoading, 500);
                });
            }
        });
    }

    // ===== POLYFILLS =====
    polyfillSmoothScroll() {
        // Polyfill básico para smooth scroll
        const smoothScrollTo = (targetY, duration = 500) => {
            const startY = window.scrollY;
            const difference = targetY - startY;
            const startTime = performance.now();

            const step = (currentTime) => {
                const elapsedTime = currentTime - startTime;
                const progress = Math.min(elapsedTime / duration, 1);
                const ease = this.easeInOutCubic(progress);
                
                window.scrollTo(0, startY + difference * ease);
                
                if (progress < 1) {
                    requestAnimationFrame(step);
                }
            };

            requestAnimationFrame(step);
        };

        // Override scrollTo behavior
        const originalScrollTo = window.scrollTo;
        window.scrollTo = function(x, y) {
            if (typeof x === 'object' && x.behavior === 'smooth') {
                smoothScrollTo(x.top, 500);
            } else {
                originalScrollTo.call(window, x, y);
            }
        };
    }

    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    }
}

// ===== FUNÇÕES GLOBAIS PARA BOTÕES =====
window.scrollToSection = function(sectionId) {
    const section = document.querySelector(sectionId);
    if (!section) return;

    const headerHeight = elements.header ? elements.header.offsetHeight : 0;
    const targetPosition = section.offsetTop - headerHeight - 20;

    window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
    });
};

// ===== INICIALIZAÇÃO DA APLICAÇÃO =====
document.addEventListener("DOMContentLoaded", () => {
  new NovaEraXApp();
});

// ===== ABRIR WHATSAPP =====
window.openWhatsApp = function (phone = '5511999999999', message = 'Olá! Gostaria de saber mais sobre a Nova Era X.') {
  const encodedMsg = encodeURIComponent(message);
  const url = `https://wa.me/${phone}?text=${encodedMsg}`;
  window.open(url, '_blank');
};
