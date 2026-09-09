/**
 * KonservasiAkuatik.com - Landing Page Interactivity
 */
document.addEventListener('DOMContentLoaded', function () {
    // 1. Mobile Menu Toggle
    const mobileBtn = document.getElementById('mobileMenuBtn');
    const mobileDrawer = document.getElementById('mobileDrawer');
    const menuIcon = document.getElementById('menuIcon');

    if (mobileBtn && mobileDrawer) {
        mobileBtn.addEventListener('click', function () {
            const isClosed = mobileDrawer.classList.contains('hidden');
            if (isClosed) {
                mobileDrawer.classList.remove('hidden');
                if (menuIcon) {
                    menuIcon.classList.remove('fa-bars');
                    menuIcon.classList.add('fa-xmark');
                }
            } else {
                mobileDrawer.classList.add('hidden');
                if (menuIcon) {
                    menuIcon.classList.remove('fa-xmark');
                    menuIcon.classList.add('fa-bars');
                }
            }
        });

        // Close mobile drawer when clicking a link inside it
        const mobileLinks = mobileDrawer.querySelectorAll('a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileDrawer.classList.add('hidden');
                if (menuIcon) {
                    menuIcon.classList.remove('fa-xmark');
                    menuIcon.classList.add('fa-bars');
                }
            });
        });
    }

    // 2. FAQ Accordion Interactivity
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const header = item.querySelector('.faq-header');
        if (header) {
            header.addEventListener('click', function () {
                const isActive = item.classList.contains('active');

                // Close other items (optional single-accordion behavior)
                faqItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('active');
                        const otherHeader = otherItem.querySelector('.faq-header');
                        if (otherHeader) otherHeader.setAttribute('aria-expanded', 'false');
                    }
                });

                if (isActive) {
                    item.classList.remove('active');
                    header.setAttribute('aria-expanded', 'false');
                } else {
                    item.classList.add('active');
                    header.setAttribute('aria-expanded', 'true');
                }
            });
        }
    });

    // 3. Slot Checker Form & Modal Popup
    const slotForm = document.getElementById('slotCheckerForm');
    const slotModal = document.getElementById('slotModal');
    const modalContent = document.getElementById('modalContent');
    const modalWaBtn = document.getElementById('modalWaBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const closeModalBtn2 = document.getElementById('closeModalBtn2');

    if (slotForm && slotModal) {
        slotForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const branchSelect = document.getElementById('branchSelect');
            const slotSelect = document.getElementById('slotSelect');

            const branchVal = branchSelect ? branchSelect.value : 'Kota Jambi';
            const slotVal = slotSelect ? slotSelect.value : 'Sore - Malam';

            // WhatsApp Message setup
            const basePhone = '6281366878833';
            const textMsg = `Halo konservasiakuatik.fund, saya ingin konfirmasi jadwal latihan dan ketersediaan slot di: *${branchVal}* (${slotVal}). Mohon informasi pendaftarannya. Terima kasih!`;
            const waUrl = `https://wa.me/${basePhone}?text=${encodeURIComponent(textMsg)}`;

            // Populate modal
            modalContent.innerHTML = `
                <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 mb-2">
                    <i class="fa-solid fa-circle-check text-emerald-600 text-sm"></i>
                    <span>Jadwal Latihan Tersedia!</span>
                </div>
                <div class="space-y-1.5 text-xs text-slate-600">
                    <p><strong class="text-slate-800">Kolam Renang:</strong> ${branchVal}</p>
                    <p><strong class="text-slate-800">Waktu Latihan:</strong> ${slotVal}</p>
                    <p><strong class="text-slate-800">Program:</strong> Kelas Klub & Kursus Privat untuk Semua Usia</p>
                </div>
                <p class="text-xs text-slate-500 pt-2 border-t border-slate-100">
                    Hubungi kami via WhatsApp untuk mendapatkan informasi jadwal latihan yang tersedia di Kota Jambi.
                </p>
            `;

            if (modalWaBtn) {
                modalWaBtn.setAttribute('href', waUrl);
            }

            // Show modal
            slotModal.classList.remove('hidden');
        });

        const hideModal = () => slotModal.classList.add('hidden');

        if (closeModalBtn) closeModalBtn.addEventListener('click', hideModal);
        if (closeModalBtn2) closeModalBtn2.addEventListener('click', hideModal);

        slotModal.addEventListener('click', function (e) {
            if (e.target === slotModal) hideModal();
        });
    }

    // 4. Smooth Anchor Scroll offset handling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId && targetId !== '#') {
                const targetElem = document.querySelector(targetId);
                if (targetElem) {
                    e.preventDefault();
                    const headerOffset = 80;
                    const elementPosition = targetElem.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // 5. Aceternity UI 3D Tablet Container Scroll Animation
    const tabletContainer = document.getElementById('tabletScrollContainer');
    const tabletCard = document.getElementById('tabletCard');

    if (tabletContainer && tabletCard) {
        let isMobile = window.innerWidth <= 768;
        window.addEventListener('resize', () => {
            isMobile = window.innerWidth <= 768;
        });

        let ticking = false;

        const updateTabletAnimation = () => {
            const rect = tabletContainer.getBoundingClientRect();
            const windowHeight = window.innerHeight || document.documentElement.clientHeight;

            // Compute scroll progress when container moves into view
            // progress = 0 (bottom of viewport) to 1 (top/center of viewport)
            let progress = (windowHeight - rect.top) / (windowHeight + rect.height * 0.4);
            progress = Math.max(0, Math.min(1, progress));

            // Aceternity formula:
            // rotateX: 20 deg at start (progress=0), 0 deg at full scroll (progress=1)
            const rotateX = (1 - progress) * 20;

            // scale:
            // Mobile: 0.7 at start to 0.9 at end
            // Desktop: 1.05 at start to 1.00 at end
            const startScale = isMobile ? 0.7 : 1.05;
            const endScale = isMobile ? 0.9 : 1.0;
            const scale = startScale + (endScale - startScale) * progress;

            // translateY: subtle downward offset at start, smoothly leveling to 0
            const translateY = (1 - progress) * 12;

            tabletCard.style.transform = `rotateX(${rotateX.toFixed(2)}deg) scale(${scale.toFixed(3)}) translateY(${translateY.toFixed(1)}px)`;
            ticking = false;
        };

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(updateTabletAnimation);
                ticking = true;
            }
        }, { passive: true });

        // Trigger initial calculation
        updateTabletAnimation();
    }

    // 6. Ensure Tablet Video Plays Automatically & Interactive Sound Toggle
    const heroVid = document.getElementById('heroTabletVideo');
    const audioToggleBtn = document.getElementById('audioToggleBtn');
    const audioIcon = document.getElementById('audioIcon');
    const audioText = document.getElementById('audioText');

    if (heroVid) {
        heroVid.muted = true;
        const playPromise = heroVid.play();
        if (playPromise !== undefined) {
            playPromise.catch(() => {
                // Retry play on first user interaction if browser policy blocked silent autoplay
                const enablePlay = () => {
                    heroVid.play();
                    document.removeEventListener('touchstart', enablePlay);
                    document.removeEventListener('click', enablePlay);
                };
                document.addEventListener('touchstart', enablePlay, { once: true });
                document.addEventListener('click', enablePlay, { once: true });
            });
        }

        // Toggle Audio (Mute / Unmute) on Button Click or Video Click
        const toggleAudio = (e) => {
            if (e) e.stopPropagation();

            if (heroVid.muted) {
                heroVid.muted = false;
                if (audioIcon) {
                    audioIcon.className = 'fa-solid fa-volume-high text-sky-400';
                }
                if (audioText) {
                    audioText.textContent = 'Suara Aktif (Matikan)';
                }
                if (audioToggleBtn) {
                    audioToggleBtn.classList.add('audio-active');
                }
            } else {
                heroVid.muted = true;
                if (audioIcon) {
                    audioIcon.className = 'fa-solid fa-volume-xmark text-slate-300';
                }
                if (audioText) {
                    audioText.textContent = 'Klik untuk Hidupkan Suara';
                }
                if (audioToggleBtn) {
                    audioToggleBtn.classList.remove('audio-active');
                }
            }
        };

        if (audioToggleBtn) {
            audioToggleBtn.addEventListener('click', toggleAudio);
        }

        // 7. Page Visibility API & IntersectionObserver Video Lifecycle Management
        const bgVid = document.querySelector('.hero-bg-video');

        // Pause video when tab is in background, resume when active
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                if (heroVid && !heroVid.paused) heroVid.pause();
                if (bgVid && !bgVid.paused) bgVid.pause();
            } else {
                if (heroVid && heroVid.paused) heroVid.play().catch(() => {});
                if (bgVid && bgVid.paused) bgVid.play().catch(() => {});
            }
        });

        // Pause video when scrolled out of viewport, play when in view
        if ('IntersectionObserver' in window) {
            const videoObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        if (heroVid && heroVid.paused) heroVid.play().catch(() => {});
                    } else {
                        if (heroVid && !heroVid.paused) heroVid.pause();
                    }
                });
            }, { threshold: 0.1 });

            if (tabletContainer) videoObserver.observe(tabletContainer);
        }
    }

    // 8. Auto Cache Clean & Fresh State on BFCache Restore / Re-enter
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            // Force cache refresh if restored from back-forward cache
            window.location.reload();
        }
    });
});




