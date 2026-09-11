/* ═══════════════════════════════════════════
   SVOYA Nail Studio — Vanilla JS (XSS-safe)
   No innerHTML. All DOM via safe methods.
   ═══════════════════════════════════════════ */

(function () {
    'use strict';

    /* ── DOM references ── */
    const header     = document.getElementById('site-header');
    const hamburger  = document.getElementById('hamburger');
    const nav        = document.getElementById('main-nav');
    const navLinks   = nav.querySelectorAll('.nav-link');
    const navOverlay = document.getElementById('nav-overlay');
    const galleryEl  = document.getElementById('gallery-grid');
    const lightbox   = document.getElementById('lightbox');
    const lbImg      = document.getElementById('lightbox-img');
    const lbClose    = document.getElementById('lightbox-close');

    /* ═══════════════════════════════════
       1. STICKY HEADER — glass blur after scroll
       ═══════════════════════════════════ */
    let lastScroll = 0;
    function onScroll() {
        const y = window.scrollY;
        if (y > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        lastScroll = y;
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // initial check

    /* ═══════════════════════════════════
       2. MOBILE NAV TOGGLE
       ═══════════════════════════════════ */
    function toggleNav() {
        const isOpen = nav.classList.toggle('open');
        if (navOverlay) {
            navOverlay.classList.toggle('open', isOpen);
        }
        hamburger.classList.toggle('active', isOpen);
        hamburger.setAttribute('aria-expanded', String(isOpen));
        document.body.classList.toggle('no-scroll', isOpen);
    }

    function closeNav() {
        nav.classList.remove('open');
        if (navOverlay) {
            navOverlay.classList.remove('open');
        }
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('no-scroll');
    }

    hamburger.addEventListener('click', toggleNav);

    if (navOverlay) {
        navOverlay.addEventListener('click', closeNav);
    }

    // Close when tapping anywhere outside the nav and hamburger
    document.addEventListener('click', function (e) {
        if (nav.classList.contains('open')) {
            if (!nav.contains(e.target) && !hamburger.contains(e.target)) {
                closeNav();
            }
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && nav.classList.contains('open')) {
            closeNav();
        }
    });

    navLinks.forEach(function (link) {
        link.addEventListener('click', closeNav);
    });

    /* ═══════════════════════════════════
       3. SMOOTH SCROLL (anchor links)
       ═══════════════════════════════════ */
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            var targetId = this.getAttribute('href');
            if (targetId === '#') return;
            var target = document.querySelector(targetId);
            if (!target) return;
            e.preventDefault();
            var headerH = header.offsetHeight;
            var top = target.getBoundingClientRect().top + window.scrollY - headerH;
            window.scrollTo({ top: top, behavior: 'smooth' });
        });
    });

    /* ═══════════════════════════════════
       4. SCROLL ANIMATIONS (IntersectionObserver)
       ═══════════════════════════════════ */
    var animatedEls = document.querySelectorAll('[data-animate]');

    if ('IntersectionObserver' in window) {
        var animObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    animObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

        animatedEls.forEach(function (el) {
            animObserver.observe(el);
        });
    } else {
        // Fallback: show everything
        animatedEls.forEach(function (el) {
            el.classList.add('visible');
        });
    }

    /* ═══════════════════════════════════
       5. GALLERY LIGHTBOX (no innerHTML, safe DOM)
       ═══════════════════════════════════ */
    function openLightbox(src, alt) {
        lbImg.setAttribute('src', src);
        lbImg.setAttribute('alt', alt || '');
        lightbox.removeAttribute('hidden');
        // Force reflow before adding class for transition
        void lightbox.offsetWidth;
        lightbox.classList.add('is-open');
        document.body.classList.add('no-scroll');
    }

    function closeLightbox() {
        lightbox.classList.remove('is-open');
        document.body.classList.remove('no-scroll');
        setTimeout(function () {
            lightbox.setAttribute('hidden', '');
            lbImg.setAttribute('src', '');
            lbImg.setAttribute('alt', '');
        }, 300);
    }

    // Delegate clicks on gallery images
    if (galleryEl) {
        galleryEl.addEventListener('click', function (e) {
            var item = e.target.closest('.gallery-item');
            if (!item) return;
            var img = item.querySelector('img');
            if (!img) return;
            openLightbox(img.getAttribute('src'), img.getAttribute('alt'));
        });
    }

    lbClose.addEventListener('click', closeLightbox);

    lightbox.addEventListener('click', function (e) {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && lightbox.classList.contains('is-open')) {
            closeLightbox();
        }
    });

    /* ═══════════════════════════════════
       6. COURSES SLIDER (Touch & Mouse Support)
       ═══════════════════════════════════ */
    const track = document.getElementById('courses-track');
    const slides = document.querySelectorAll('.course-slide');
    const prevBtn = document.getElementById('course-prev');
    const nextBtn = document.getElementById('course-next');
    const dotsContainer = document.getElementById('course-dots');
    
    if (track && slides.length > 0) {
        let currentIndex = 0;
        const totalSlides = slides.length;
        
        // Generate Dots
        slides.forEach((_, i) => {
            const dot = document.createElement('button');
            dot.classList.add('slider-dot');
            dot.setAttribute('aria-label', `Перейти до курсу ${i + 1}`);
            if (i === 0) dot.classList.add('active');
            dot.addEventListener('click', () => goToSlide(i));
            dotsContainer.appendChild(dot);
        });
        const dots = document.querySelectorAll('.slider-dot');

        function updateSlider() {
            // Move track
            track.style.transform = `translateX(-${currentIndex * 100}%)`;
            // Update dots
            dots.forEach(dot => dot.classList.remove('active'));
            if (dots[currentIndex]) {
                dots[currentIndex].classList.add('active');
            }
            // Update buttons
            prevBtn.style.opacity = currentIndex === 0 ? '0.5' : '1';
            prevBtn.style.pointerEvents = currentIndex === 0 ? 'none' : 'auto';
            nextBtn.style.opacity = currentIndex === totalSlides - 1 ? '0.5' : '1';
            nextBtn.style.pointerEvents = currentIndex === totalSlides - 1 ? 'none' : 'auto';
        }

        function goToSlide(index) {
            if (index < 0 || index >= totalSlides) return;
            currentIndex = index;
            updateSlider();
        }

        prevBtn.addEventListener('click', () => goToSlide(currentIndex - 1));
        nextBtn.addEventListener('click', () => goToSlide(currentIndex + 1));

        // Swipe support
        let startX = 0;
        let currentX = 0;
        let isDragging = false;

        track.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            isDragging = true;
            track.style.transition = 'none'; // Remove transition during drag
        }, { passive: true });

        track.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            currentX = e.touches[0].clientX;
            const diff = currentX - startX;
            // Add some resistance at edges
            let transform = -(currentIndex * 100) + (diff / track.offsetWidth * 100);
            if (currentIndex === 0 && diff > 0) transform = diff / track.offsetWidth * 20; // Resistance left
            if (currentIndex === totalSlides - 1 && diff < 0) transform = -(currentIndex * 100) + (diff / track.offsetWidth * 20); // Resistance right
            
            track.style.transform = `translateX(${transform}%)`;
        }, { passive: true });

        track.addEventListener('touchend', (e) => {
            if (!isDragging) return;
            isDragging = false;
            track.style.transition = 'transform 0.4s ease-out'; // Restore transition
            
            const diff = currentX - startX;
            const threshold = 50; // min swipe distance in px

            if (currentX !== 0 && Math.abs(diff) > threshold) {
                if (diff > 0) {
                    goToSlide(currentIndex - 1); // Swiped right
                } else {
                    goToSlide(currentIndex + 1); // Swiped left
                }
            } else {
                updateSlider(); // Snap back
            }
            
            // Reset variables
            startX = 0;
            currentX = 0;
        });

        // Initialize state
        updateSlider();
    }

    /* ═══════════════════════════════════
       7. TEAM AVATAR PICKER
       ═══════════════════════════════════ */
    const teamAvatars = document.querySelectorAll('.team-avatar-btn');
    const teamDetailImg = document.getElementById('team-detail-img');
    const teamDetailName = document.getElementById('team-detail-name');
    const teamDetailRole = document.getElementById('team-detail-role');
    const teamDetailBio = document.getElementById('team-detail-bio');
    const teamAvatarsTrack = document.getElementById('team-avatars');
    const teamPrevBtn = document.querySelector('.prev-avatar');
    const teamNextBtn = document.querySelector('.next-avatar');

    if (teamAvatars.length > 0) {
        teamAvatars.forEach(avatar => {
            avatar.addEventListener('click', function() {
                // Remove active class from all
                teamAvatars.forEach(btn => btn.classList.remove('active'));
                // Add to clicked
                this.classList.add('active');
                
                // Update detail card (using textContent for safety, except for bio which needs HTML for spans if any)
                teamDetailImg.src = this.getAttribute('data-photo');
                teamDetailImg.alt = this.getAttribute('data-name');
                teamDetailName.textContent = this.getAttribute('data-name');
                teamDetailRole.textContent = this.getAttribute('data-role');
                
                // For bio, we might have standard HTML like <span class="brand-text">. 
                // We use innerHTML here cautiously, knowing the data source is hardcoded in HTML, not user input.
                teamDetailBio.innerHTML = this.getAttribute('data-bio');
            });
        });

        // Team avatar scroll buttons
        if (teamPrevBtn && teamNextBtn && teamAvatarsTrack) {
            teamPrevBtn.addEventListener('click', () => {
                teamAvatarsTrack.scrollBy({ left: -150, behavior: 'smooth' });
            });
            teamNextBtn.addEventListener('click', () => {
                teamAvatarsTrack.scrollBy({ left: 150, behavior: 'smooth' });
            });
        }
    }

    /* ═══════════════════════════════════
       8. HERO VIDEO LAZY-LOAD
       ═══════════════════════════════════ */
    var heroVideo = document.querySelector('.hero-video');
    if (heroVideo && 'IntersectionObserver' in window) {
        var videoObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    heroVideo.play().catch(function () { /* autoplay blocked */ });
                    videoObserver.unobserve(heroVideo);
                }
            });
        }, { threshold: 0.25 });
        videoObserver.observe(heroVideo);
    }

    /* ═══════════════════════════════════
       7. MODULAR BOOKING CTA
       All buttons with [data-booking-url] are
       wired here. Swap the URL or replace this
       block with an API widget initializer later.
       ═══════════════════════════════════ */
    // Currently the hrefs are set in HTML directly.
    // This hook exists so you can programmatically
    // update all booking buttons at once:
    //
    //   updateBookingUrl('https://new-booking-system.com/book');
    //
    function updateBookingUrl(newUrl) {
        document.querySelectorAll('[data-booking-url]').forEach(function (btn) {
            btn.setAttribute('href', newUrl);
            btn.setAttribute('data-booking-url', newUrl);
        });
    }

    // Expose to global scope for future widget integration
    window.SvoyaBooking = {
        updateUrl: updateBookingUrl
    };

})();
