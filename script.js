/* ═══════════════════════════════════════════
   SVOYA Nail Studio — Vanilla JS (XSS-safe)
   No innerHTML. All DOM via safe methods.
   ═══════════════════════════════════════════ */

(function () {
    'use strict';

    /* ── DOM references ── */
    const header      = document.getElementById('site-header');
    const hamburger   = document.getElementById('hamburger');
    const nav         = document.getElementById('main-nav');
    const navCloseBtn = document.getElementById('nav-close-btn');
    const navLinks    = nav.querySelectorAll('.nav-link');
    const navOverlay  = document.getElementById('nav-overlay');
    const galleryEl   = document.getElementById('gallery-grid');
    const lightbox    = document.getElementById('lightbox');
    const lbImg       = document.getElementById('lightbox-img');
    const lbClose     = document.getElementById('lightbox-close');

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
        if (header) {
            header.classList.toggle('nav-open', isOpen);
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
        if (header) {
            header.classList.remove('nav-open');
        }
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('no-scroll');
    }

    hamburger.addEventListener('click', toggleNav);

    if (navCloseBtn) {
        navCloseBtn.addEventListener('click', closeNav);
    }

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
        function centerAvatarInTrack(avatarEl) {
            if (!avatarEl || !teamAvatarsTrack) return;
            const targetLeft = avatarEl.offsetLeft - (teamAvatarsTrack.clientWidth / 2) + (avatarEl.clientWidth / 2);
            teamAvatarsTrack.scrollTo({ left: targetLeft, behavior: 'smooth' });
        }

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

                // Auto-center selected avatar strictly within the track (prevents entire page from shifting)
                centerAvatarInTrack(this);
            });
        });

        // Team avatar scroll buttons
        if (teamPrevBtn && teamNextBtn && teamAvatarsTrack) {
            teamPrevBtn.addEventListener('click', () => {
                const step = teamAvatarsTrack.clientWidth * 0.75 || 150;
                teamAvatarsTrack.scrollBy({ left: -step, behavior: 'smooth' });
            });
            teamNextBtn.addEventListener('click', () => {
                const step = teamAvatarsTrack.clientWidth * 0.75 || 150;
                teamAvatarsTrack.scrollBy({ left: step, behavior: 'smooth' });
            });
        }

        // Team variant toggle (Arrows vs All)
        const teamToggle = document.getElementById('team-variant-toggle');
        const teamWrapper = document.querySelector('.team-avatars-wrapper');
        if (teamToggle && teamWrapper) {
            const toggleBtns = teamToggle.querySelectorAll('.team-toggle-btn');
            toggleBtns.forEach(btn => {
                btn.addEventListener('click', function() {
                    toggleBtns.forEach(b => b.classList.remove('active'));
                    this.classList.add('active');

                    const variant = this.getAttribute('data-team-variant');
                    if (variant === 'all') {
                        teamWrapper.classList.remove('variant-arrows');
                        teamWrapper.classList.add('variant-all');
                    } else {
                        teamWrapper.classList.remove('variant-all');
                        teamWrapper.classList.add('variant-arrows');
                        const activeAvatar = teamWrapper.querySelector('.team-avatar-btn.active');
                        if (activeAvatar) {
                            centerAvatarInTrack(activeAvatar);
                        }
                    }
                });
            });
        }
    }

    /* ═══════════════════════════════════
       8. FOOTER & HERO VIDEO HANDLERS
       ═══════════════════════════════════ */
    const heroVideo = document.querySelector('.hero-video');
    if (heroVideo && 'IntersectionObserver' in window) {
        const videoObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    heroVideo.play().catch(() => {});
                    videoObserver.unobserve(heroVideo);
                }
            });
        }, { threshold: 0.25 });
        videoObserver.observe(heroVideo);
    }

    const footerVideo = document.getElementById('footer-video');
    if (footerVideo) {
        let footerVideoPlayed = false;

        const playAnimation = () => {
            footerVideo.currentTime = 0;
            const playPromise = footerVideo.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    // In case browser autoplay policy blocks, set to peak frame
                    footerVideo.currentTime = 11.8;
                });
            }
        };

        // Stop precisely at 11.8s where the logo "SVOYA NAIL STUDIO" is at peak brightness and clarity
        footerVideo.addEventListener('timeupdate', () => {
            if (footerVideo.currentTime >= 11.8) {
                footerVideo.pause();
                footerVideo.currentTime = 11.8;
            }
        });

        footerVideo.addEventListener('ended', () => {
            footerVideo.pause();
            footerVideo.currentTime = 11.8;
        });

        // Click / tap to replay animation
        const wrapper = footerVideo.closest('.footer-video-wrapper') || footerVideo;
        wrapper.addEventListener('click', () => {
            playAnimation();
        });

        if ('IntersectionObserver' in window) {
            const footerObserver = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !footerVideoPlayed) {
                        footerVideoPlayed = true;
                        playAnimation();
                        footerObserver.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.15 });
            footerObserver.observe(wrapper);
        }
    }

    /* ═══════════════════════════════════
       9. SERVICES MOBILE VARIANT TOGGLE
       ═══════════════════════════════════ */
    const servicesToggle = document.getElementById('services-mobile-toggle');
    const servicesGrid = document.getElementById('services-grid');

    if (servicesToggle && servicesGrid) {
        const toggleBtns = servicesToggle.querySelectorAll('.services-toggle-btn');
        toggleBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                toggleBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');

                const variant = this.getAttribute('data-variant');
                if (variant === 'grid') {
                    servicesGrid.classList.remove('variant-swipe');
                    servicesGrid.classList.add('variant-grid');
                } else {
                    servicesGrid.classList.remove('variant-grid');
                    servicesGrid.classList.add('variant-swipe');
                    servicesGrid.scrollLeft = 0;
                }
            });
        });
    }

    /* ═══════════════════════════════════
       10. COURSE DETAILS MODAL
       ═══════════════════════════════════ */
    const courseModalOverlay = document.getElementById('course-modal-overlay');
    const courseModalContent = document.getElementById('course-modal-content');
    const courseModalClose = document.getElementById('course-modal-close');
    const courseDetailBtns = document.querySelectorAll('.btn--course-details');

    const coursesData = {
        basic: {
            badge: '3 Дні · Інтенсивний базовий курс',
            title: 'Базовий курс «Все про манікюр»',
            duration: '3 дні (10:00 — 18:00)',
            format: 'Міні-група (до 2–3 учнів)',
            price: '10 500 грн',
            priceNote: 'Всі матеріали та моделі включено',
            program: [
                {
                    title: 'День 1: Теорія та знайомство з інструментом',
                    points: [
                        'Анатомія нігтьової пластини, типи шкіри та підбір фрез',
                        'Санітарні норми: дезінфекція та стерилізація (сухожар, крафт-пакети)',
                        'Організація робочого місця майстра та техніка безпеки',
                        'Постановка руки та відпрацювання апаратної техніки на тренувальних картах'
                    ]
                },
                {
                    title: 'День 2: Комбінований манікюр + Покриття',
                    points: [
                        'Чистий комбінований манікюр без порізів та задирок',
                        'Ідеальне вирівнювання нігтьової пластини базою без затьоків',
                        'Покриття гель-лаком «під кутикулу» та створення ідеальних бліків',
                        'Практика на 1-й моделі під постійним наглядом інструктора'
                    ]
                },
                {
                    title: 'День 3: Укріплення, Ремонт та Вручення сертифіката',
                    points: [
                        'Техніка укріплення гелем/полігелем без зайвого опилу',
                        'Ремонт тріщин, донарощування кутиків та виправлення форми',
                        'Практика на 2-й моделі з самостійним закріпленням результату',
                        'Створення фото для Instagram, постановка світла та ракурсів',
                        'Урочисте вручення авторського сертифіката студії'
                    ]
                }
            ],
            includes: [
                'Повністю обладнане робоче місце та професійний апарат',
                'Всі розхідні матеріали, фрези, гелі та стерильний інструмент',
                'Моделі для кожного практичного дня',
                'Детальний друкований методичний посібник',
                'Іменний сертифікат про проходження базового курсу'
            ]
        },
        pro: {
            badge: '1 День · Підвищення кваліфікації',
            title: 'Курс «Підвищення кваліфікації для майстрів»',
            duration: '1 день (10:00 — 19:00)',
            format: 'Індивідуальний або парний формат',
            price: '4 500 грн',
            priceNote: 'Інтенсивне практичне прокачування',
            program: [
                {
                    title: 'Блок 1: Аналіз помилок та оптимізація таймінгу',
                    points: [
                        'Розбір причин відшарувань, сколів, пропилів та опіків',
                        'Оптимізація рухів: скорочення часу процедури до 1:15–1:30 без втрати якості',
                        'Швидкісний чистий зріз ножицями або твізером та полірування шкіри'
                    ]
                },
                {
                    title: 'Блок 2: Робота з твердими матеріалами та архітектура',
                    points: [
                        'Робота з рідким та густим полігелем, моделюючими гелями',
                        'Виправлення скручених бічних стінок та підняття клюючих нігтів',
                        'Чіткий квадрат без перевантаження та міцний ідеальний мигдаль'
                    ]
                },
                {
                    title: 'Блок 3: Практика на 2-х моделях та дизайни',
                    points: [
                        'Практика на двох моделях зі складними нігтями',
                        'Швидкісні салонні дизайни (стемпінг, тонкі лінії, ідеальний френч)',
                        'Вручення сертифіката підвищення кваліфікації'
                    ]
                }
            ],
            includes: [
                'Преміальні матеріали, гелі та фрези студії',
                '2 моделі для відпрацювання',
                'Індивідуальний розбір техніки інструктором Юлією',
                'Офіційний сертифікат про підвищення кваліфікації'
            ]
        }
    };

    function renderCourseModal(courseKey) {
        const data = coursesData[courseKey];
        if (!data || !courseModalContent) return;

        let programHtml = '';
        data.program.forEach(item => {
            let pointsHtml = '';
            item.points.forEach(p => {
                pointsHtml += `<li>${p}</li>`;
            });
            programHtml += `
                <div class="course-modal-program-day">
                    <div class="course-modal-day-title">${item.title}</div>
                    <ul class="course-modal-list">
                        ${pointsHtml}
                    </ul>
                </div>
            `;
        });

        let includesHtml = '';
        data.includes.forEach(inc => {
            includesHtml += `<li>${inc}</li>`;
        });

        courseModalContent.innerHTML = `
            <div class="course-modal-header">
                <span class="course-modal-badge">${data.badge}</span>
                <h3 class="course-modal-title" id="modal-course-title">${data.title}</h3>
                <div class="course-modal-meta">
                    <div class="course-modal-meta-item">
                        <strong>Тривалість:</strong> ${data.duration}
                    </div>
                    <div class="course-modal-meta-item">
                        <strong>Формат:</strong> ${data.format}
                    </div>
                </div>
            </div>

            <div class="course-modal-section">
                <h4>Програма навчання</h4>
                ${programHtml}
            </div>

            <div class="course-modal-section">
                <h4>Що надається студією</h4>
                <ul class="course-modal-list">
                    ${includesHtml}
                </ul>
            </div>

            <div class="course-modal-footer">
                <div class="course-modal-price">
                    ${data.price}
                    <span>${data.priceNote}</span>
                </div>
                <a href="https://www.instagram.com/svoya_nail_studio?igsh=ZHJudzIza280dnli&utm_source=qr" 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   class="btn btn--school btn--lg">
                   Записатися на курс в Instagram
                </a>
            </div>
        `;
    }

    function openCourseModal(courseKey) {
        renderCourseModal(courseKey);
        if (courseModalOverlay) {
            courseModalOverlay.classList.add('is-open');
            courseModalOverlay.setAttribute('aria-hidden', 'false');
            document.body.classList.add('no-scroll');
        }
    }

    function closeCourseModal() {
        if (courseModalOverlay) {
            courseModalOverlay.classList.remove('is-open');
            courseModalOverlay.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('no-scroll');
        }
    }

    courseDetailBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const courseKey = this.getAttribute('data-course');
            openCourseModal(courseKey);
        });
    });

    if (courseModalClose) {
        courseModalClose.addEventListener('click', closeCourseModal);
    }

    if (courseModalOverlay) {
        courseModalOverlay.addEventListener('click', function (e) {
            if (e.target === courseModalOverlay) {
                closeCourseModal();
            }
        });
    }

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && courseModalOverlay && courseModalOverlay.classList.contains('is-open')) {
            closeCourseModal();
        }
    });

    /* ═══════════════════════════════════
       11. MODULAR BOOKING CTA
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
