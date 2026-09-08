@extends('layouts.app')

@section('title', 'Klub & Kursus Renang untuk Semua Usia di Kota Jambi - KonservasiAkuatik.com')

@section('content')

    <!-- ==================== 1. HERO SECTION (DIRECT VIDEO BACKGROUND & BOTTOM GLASS GRADIENT) ==================== -->
    <section class="hero-section" id="hero">
        <!-- Background Video Layer (Clear & High Fidelity) -->
        <div class="hero-video-bg-container">
            <video class="hero-bg-video" autoplay muted loop playsinline preload="auto">
                <source src="https://kvvhxytklcxvculklnqr.supabase.co/storage/v1/object/public/konservasiaquatic/videobackground.webm" type="video/webm">
            </video>
            <!-- Gradasi Putih di Bagian Atas (Smooth Minimalist Fade from Header) -->
            <div class="hero-top-glass-gradient"></div>
            <!-- Very soft top tint so text remains crisp and readable -->
            <div class="hero-video-tint"></div>
            <!-- Subtle Blueprint Grid Pattern -->
            <div class="hero-video-grid"></div>
            <!-- Gradasi Putih di Bagian Bawah (Kebawah Solid Putih) -->
            <div class="hero-bottom-glass-gradient"></div>
        </div>

        <div class="container-custom relative z-10">
            <!-- Hero Content Direct on Video (Tanpa Shape / Card Box - Minimalist Spacing) -->
            <div class="hero-content-direct text-center max-w-4xl mx-auto mb-14">
                <!-- Promo Pill Badge -->
                <div class="inline-flex items-center gap-2 mb-7">
                    <span class="pill-badge hero-pill">
                        <i class="fa-solid fa-water text-sky-600"></i>
                        <span>Klub &amp; Kursus Renang untuk Semua Usia di Kota Jambi</span>
                    </span>
                </div>

                <!-- Main Headline (Strictly 3 Lines) -->
                <h1 class="hero-title mb-7">
                    <span class="hero-title-line hero-line-1">Belajar Berenang Lebih Cepat,</span>
                    <span class="hero-title-line hero-line-2"><span class="text-sky-600">Percaya Diri</span>, dan</span>
                    <span class="hero-title-line hero-line-3">Menyenangkan!</span>
                </h1>

                <!-- Subtitle / Paragraph -->
                <p class="hero-subtitle mb-7 max-w-2xl mx-auto">
                    KonservasiAkuatik.com hadir sebagai klub dan kursus renang untuk membantu siapa saja mulai dari balita, anak-anak, remaja, hingga orang tua agar semakin percaya diri dan mampu berenang dengan baik.
                </p>

                <!-- Location Sub-note -->
                <div class="mb-10">
                    <span class="hero-location-pill">
                        <i class="fa-solid fa-location-dot text-sky-600 mr-1.5"></i>
                        Latihan tersedia di berbagai kolam renang di Kota Jambi, menyesuaikan domisili peserta.
                    </span>
                </div>

                <!-- CTA Buttons -->
                <div class="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5 mb-10">
                    <a href="#program" class="btn-hero-cta w-full sm:w-auto">
                        <span>DAFTAR KURSUS SEKARANG</span>
                        <i class="fa-solid fa-arrow-right text-xs"></i>
                    </a>
                    <a href="https://wa.me/{{ $whatsappNumber }}?text={{ rawurlencode('Halo KonservasiAkuatik.com, saya ingin konsultasi dan tanya info pendaftaran kursus renang di Kota Jambi.') }}" 
                       target="_blank" 
                       class="btn-hero-secondary hero-btn-glass w-full sm:w-auto">
                        <i class="fa-brands fa-whatsapp text-emerald-500 text-base"></i>
                        <span>HUBUNGI VIA WHATSAPP</span>
                    </a>
                </div>

                <!-- Feature Badges Row -->
                <div class="flex flex-wrap items-center justify-center gap-3.5 sm:gap-4 text-xs sm:text-sm font-bold text-slate-800">
                    <div class="hero-feature-chip">
                        <i class="fa-solid fa-circle-check text-sky-600 text-sm"></i>
                        <span>Klub &amp; Privat</span>
                    </div>
                    <div class="hero-feature-chip">
                        <i class="fa-solid fa-circle-check text-sky-600 text-sm"></i>
                        <span>Semua Usia (Balita - Orang Tua)</span>
                    </div>
                    <div class="hero-feature-chip">
                        <i class="fa-solid fa-circle-check text-sky-600 text-sm"></i>
                        <span>Kolam Renang Kota Jambi</span>
                    </div>
                    <div class="hero-feature-chip">
                        <i class="fa-solid fa-circle-check text-sky-600 text-sm"></i>
                        <span>Jadwal Fleksibel</span>
                    </div>
                </div>
            </div>

            <!-- Hero Tablet 3D Showcase (Aceternity UI Container Scroll Animation - Large 3:4 Portrait Tablet) -->
            <div class="tablet-scroll-container w-full max-w-4xl mx-auto relative z-10 mt-8 md:mt-12 mb-6 md:mb-10" id="tabletScrollContainer">
                <div class="tablet-scroll-wrapper" style="perspective: 1000px;">
                    <!-- 3D Tablet Frame Device Mockup -->
                    <div class="tablet-card shadow-2xl transition-transform duration-75 ease-out" id="tabletCard">
                        <!-- Tablet Camera Lens Notch -->
                        <div class="tablet-notch"></div>

                        <!-- Tablet Screen Container displaying the webm video -->
                        <div class="tablet-screen overflow-hidden rounded-2xl bg-slate-950 relative shadow-inner">
                            <!-- Interactive Audio Toggle Button -->
                            <button type="button" id="audioToggleBtn" class="tablet-audio-btn" aria-label="Hidupkan / Matikan Suara Video">
                                <i class="fa-solid fa-volume-xmark text-slate-300" id="audioIcon"></i>
                                <span id="audioText">Klik untuk Hidupkan Suara</span>
                            </button>

                            <video 
                                id="heroTabletVideo"
                                poster="{{ asset('images/hero-pool.jpg') }}"
                                autoplay 
                                muted 
                                loop 
                                playsinline 
                                preload="auto"
                                class="w-full h-full object-cover rounded-2xl">
                                <source src="https://kvvhxytklcxvculklnqr.supabase.co/storage/v1/object/public/konservasiaquatic/WhatsApp%20Video%202026-09-07%20at%2021.46.24.webm" type="video/webm">
                                <source src="{{ asset('videos/hero-tablet-video.webm') }}" type="video/webm">
                                <source src="{{ asset('videos/videobackground.webm') }}" type="video/webm">
                            </video>

                            <!-- Glass Glare overlay -->
                            <div class="tablet-screen-glow"></div>
                            
                            <!-- Floating Info Badge at Bottom of Tablet Screen -->
                            <div class="hero-floating-badge">
                                <div class="flex items-center gap-3">
                                    <div class="w-9 h-9 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center flex-shrink-0">
                                        <i class="fa-solid fa-location-dot text-base"></i>
                                    </div>
                                    <div>
                                        <h4 class="text-xs sm:text-sm font-bold text-slate-800">Latihan di Berbagai Kolam Renang di Kota Jambi</h4>
                                        <p class="text-xs text-slate-500">Menyesuaikan domisili peserta &amp; fasilitas kolam renang yang tersedia</p>
                                    </div>
                                </div>
                                <a href="#lokasi" class="btn-primary-pill text-xs self-start sm:self-center">
                                    <span>Lihat Lokasi</span>
                                    <i class="fa-solid fa-angle-right text-xs"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- ==================== 2. PROGRAM KAMI ==================== -->
    <section class="py-16 bg-white" id="program">
        <div class="container-custom">
            <div class="text-center max-w-2xl mx-auto mb-12">
                <span class="pill-badge mb-3">PILIHAN KELAS</span>
                <h2 class="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
                    PROGRAM KAMI
                </h2>
                <p class="text-slate-600 text-sm sm:text-base">
                    Pilih program latihan bersama klub atau pendampingan kursus privat sesuai kebutuhan dan tujuan Anda.
                </p>
            </div>

            <!-- 2 Cards Comparison matching exact user specifications -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
                <!-- Card 1: Kelas Klub -->
                <div class="pricing-card">
                    <div>
                        <div class="flex items-center justify-between mb-3">
                            <div class="flex items-center gap-2">
                                <div class="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center text-sm">
                                    <i class="fa-solid fa-users"></i>
                                </div>
                                <h3 class="text-xl font-bold text-slate-900">Kelas Klub</h3>
                            </div>
                            <span class="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">Latihan Bersama</span>
                        </div>
                        <p class="text-slate-600 text-xs sm:text-sm leading-relaxed mb-4">
                            Program latihan berenang dalam kelompok dengan suasana latihan yang aktif, menyenangkan, dan suportif.
                        </p>

                        <!-- Price Tag -->
                        <div class="price-box-regular">
                            <div class="text-xs text-slate-500 font-semibold uppercase tracking-wider">Mulai dari</div>
                            <div class="flex items-baseline gap-1 mt-1">
                                <span class="text-2xl sm:text-3xl font-extrabold text-slate-900">Rp500.000</span>
                                <span class="text-xs font-medium text-slate-500">/bulan</span>
                            </div>
                        </div>

                        <!-- Features -->
                        <div class="space-y-2.5 mb-8">
                            <div class="flex items-start gap-2 text-xs sm:text-sm text-slate-600">
                                <i class="fa-solid fa-circle-check text-sky-600 text-sm mt-0.5"></i>
                                <span>Latihan terjadwal</span>
                            </div>
                            <div class="flex items-start gap-2 text-xs sm:text-sm text-slate-600">
                                <i class="fa-solid fa-circle-check text-sky-600 text-sm mt-0.5"></i>
                                <span>Cocok untuk berbagai level</span>
                            </div>
                            <div class="flex items-start gap-2 text-xs sm:text-sm text-slate-600">
                                <i class="fa-solid fa-circle-check text-sky-600 text-sm mt-0.5"></i>
                                <span>Suasana latihan bersama</span>
                            </div>
                            <div class="flex items-start gap-2 text-xs sm:text-sm text-slate-600">
                                <i class="fa-solid fa-circle-check text-sky-600 text-sm mt-0.5"></i>
                                <span>Pendampingan selama proses belajar</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <a href="https://wa.me/{{ $whatsappNumber }}?text={{ rawurlencode('Halo KonservasiAkuatik.com, saya ingin mendaftar Kelas Klub di Kota Jambi. Mohon info jadwal dan persyaratannya.') }}" 
                           target="_blank" 
                           class="btn-card-outline">
                            <span>PILIH KELAS KLUB</span>
                            <i class="fa-solid fa-arrow-right text-xs"></i>
                        </a>
                    </div>
                </div>

                <!-- Card 2: Kursus Privat (Popular Highlighted) -->
                <div class="pricing-card popular">
                    <!-- Top Ribbon Badge -->
                    <div class="popular-top-badge">
                        <i class="fa-solid fa-star text-amber-300 mr-1"></i> Rekomendasi - Pendampingan Personal
                    </div>

                    <div>
                        <div class="flex items-center justify-between mb-3">
                            <div class="flex items-center gap-2">
                                <div class="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center text-sm">
                                    <i class="fa-solid fa-user-shield"></i>
                                </div>
                                <h3 class="text-xl font-bold text-slate-900">Kursus Privat</h3>
                            </div>
                            <span class="text-xs font-semibold text-sky-700 bg-sky-100 px-2.5 py-1 rounded-full">Latihan Lebih Fokus</span>
                        </div>
                        <p class="text-slate-600 text-xs sm:text-sm leading-relaxed mb-4">
                            Program belajar berenang secara privat dengan latihan yang lebih terarah sesuai kebutuhan dan kemampuan peserta.
                        </p>

                        <!-- Price Tag Cyan Box -->
                        <div class="price-box-cyan">
                            <div class="text-xs text-sky-700 font-semibold uppercase tracking-wider">Biaya Kursus</div>
                            <div class="flex items-baseline gap-1 mt-1">
                                <span class="text-2xl sm:text-3xl font-extrabold text-sky-700">Rp1.000.000</span>
                                <span class="text-xs font-medium text-sky-600">/bulan</span>
                            </div>
                        </div>

                        <!-- Features -->
                        <div class="space-y-2.5 mb-8">
                            <div class="flex items-start gap-2 text-xs sm:text-sm text-slate-600">
                                <i class="fa-solid fa-circle-check text-sky-600 text-sm mt-0.5"></i>
                                <span>Latihan lebih fokus</span>
                            </div>
                            <div class="flex items-start gap-2 text-xs sm:text-sm text-slate-600">
                                <i class="fa-solid fa-circle-check text-sky-600 text-sm mt-0.5"></i>
                                <span>Program dapat disesuaikan</span>
                            </div>
                            <div class="flex items-start gap-2 text-xs sm:text-sm text-slate-600">
                                <i class="fa-solid fa-circle-check text-sky-600 text-sm mt-0.5"></i>
                                <span>Cocok untuk pemula maupun yang ingin meningkatkan kemampuan</span>
                            </div>
                            <div class="flex items-start gap-2 text-xs sm:text-sm text-slate-600">
                                <i class="fa-solid fa-circle-check text-sky-600 text-sm mt-0.5"></i>
                                <span>Pendampingan lebih personal</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <a href="https://wa.me/{{ $whatsappNumber }}?text={{ rawurlencode('Halo KonservasiAkuatik.com, saya ingin mendaftar Kursus Privat renang di Kota Jambi. Mohon info jadwal yang tersedia.') }}" 
                           target="_blank" 
                           class="btn-card-primary">
                            <span>DAFTAR KURSUS PRIVAT</span>
                            <i class="fa-solid fa-arrow-right text-xs"></i>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- ==================== 3. UNTUK SIAPA PROGRAM INI? ==================== -->
    <section class="py-16 bg-slate-50" id="untuk-siapa">
        <div class="container-custom">
            <div class="text-center max-w-2xl mx-auto mb-12">
                <span class="pill-badge mb-3">SEMUA USIA</span>
                <h2 class="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
                    UNTUK SIAPA PROGRAM INI?
                </h2>
                <p class="text-slate-700 font-semibold text-sm sm:text-base mb-2">
                    Tidak perlu khawatir jika masih pemula.
                </p>
                <p class="text-slate-600 text-xs sm:text-sm">
                    KonservasiAkuatik.com membuka program untuk:
                </p>
            </div>

            <!-- 5 Categories Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
                <!-- Cat 1: Balita -->
                <div class="category-card">
                    <div class="category-icon-box">
                        <i class="fa-solid fa-child"></i>
                    </div>
                    <span class="text-xs font-bold text-sky-600 uppercase mb-1">PROGRAM 1</span>
                    <h4 class="text-base font-bold text-slate-900 mb-2">Balita</h4>
                    <p class="text-xs text-slate-600 leading-relaxed mb-4 flex-1">
                        Pengenalan air ramah motorik dengan pendekatan yang menyenangkan agar terbiasa di dalam air sejak dini.
                    </p>
                    <a href="#program" class="text-xs font-semibold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1">
                        <span>Pilih Program</span> <i class="fa-solid fa-angle-right text-xs"></i>
                    </a>
                </div>

                <!-- Cat 2: Anak-anak -->
                <div class="category-card">
                    <div class="category-icon-box">
                        <i class="fa-solid fa-person-swimming"></i>
                    </div>
                    <span class="text-xs font-bold text-sky-600 uppercase mb-1">PROGRAM 2</span>
                    <h4 class="text-base font-bold text-slate-900 mb-2">Anak-anak</h4>
                    <p class="text-xs text-slate-600 leading-relaxed mb-4 flex-1">
                        Membangun water confidence, teknik dasar renang, serta rasa percaya diri dan gembira di dalam air.
                    </p>
                    <a href="#program" class="text-xs font-semibold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1">
                        <span>Pilih Program</span> <i class="fa-solid fa-angle-right text-xs"></i>
                    </a>
                </div>

                <!-- Cat 3: Remaja -->
                <div class="category-card">
                    <div class="category-icon-box">
                        <i class="fa-solid fa-award"></i>
                    </div>
                    <span class="text-xs font-bold text-sky-600 uppercase mb-1">PROGRAM 3</span>
                    <h4 class="text-base font-bold text-slate-900 mb-2">Remaja</h4>
                    <p class="text-xs text-slate-600 leading-relaxed mb-4 flex-1">
                        Mengasah teknik kayuhan, efisiensi napas, ketahanan fisik, dan pembentukan postur tubuh prima.
                    </p>
                    <a href="#program" class="text-xs font-semibold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1">
                        <span>Pilih Program</span> <i class="fa-solid fa-angle-right text-xs"></i>
                    </a>
                </div>

                <!-- Cat 4: Dewasa -->
                <div class="category-card">
                    <div class="category-icon-box">
                        <i class="fa-solid fa-user-check"></i>
                    </div>
                    <span class="text-xs font-bold text-sky-600 uppercase mb-1">PROGRAM 4</span>
                    <h4 class="text-base font-bold text-slate-900 mb-2">Dewasa</h4>
                    <p class="text-xs text-slate-600 leading-relaxed mb-4 flex-1">
                        Belajar berenang dari nol atau mengatasi rasa takut air dengan metode santai, tenang, dan tanpa canggung.
                    </p>
                    <a href="#program" class="text-xs font-semibold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1">
                        <span>Pilih Program</span> <i class="fa-solid fa-angle-right text-xs"></i>
                    </a>
                </div>

                <!-- Cat 5: Orang Tua -->
                <div class="category-card">
                    <div class="category-icon-box">
                        <i class="fa-solid fa-heart-pulse"></i>
                    </div>
                    <span class="text-xs font-bold text-sky-600 uppercase mb-1">PROGRAM 5</span>
                    <h4 class="text-base font-bold text-slate-900 mb-2">Orang Tua</h4>
                    <p class="text-xs text-slate-600 leading-relaxed mb-4 flex-1">
                        Aktivitas akuatik sehat minim risiko cedera untuk memelihara kelenturan sendi, jantung, dan kebugaran tubuh.
                    </p>
                    <a href="#program" class="text-xs font-semibold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1">
                        <span>Pilih Program</span> <i class="fa-solid fa-angle-right text-xs"></i>
                    </a>
                </div>
            </div>

            <!-- Closing Note Card -->
            <div class="max-w-2xl mx-auto p-4 bg-white border border-sky-100 rounded-2xl shadow-sm text-center">
                <p class="text-xs sm:text-sm font-bold text-sky-700 flex items-center justify-center gap-2">
                    <i class="fa-solid fa-circle-check text-sky-600"></i>
                    <span>Baik untuk yang belum bisa berenang sama sekali maupun yang ingin meningkatkan kemampuan berenang.</span>
                </p>
            </div>
        </div>
    </section>

    <!-- ==================== 4. JADWAL LATIHAN ==================== -->
    <section class="py-16 bg-white" id="jadwal">
        <div class="container-custom">
            <div class="schedule-banner-box">
                <div class="schedule-grid-2col">
                    <!-- Left: Schedule Info -->
                    <div>
                        <span class="pill-badge mb-3">WAKTU FLEKSIBEL</span>
                        <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
                            JADWAL LATIHAN: Senin – Minggu
                        </h2>
                        <p class="text-slate-600 text-xs sm:text-sm leading-relaxed mb-5">
                            Tersedia jadwal latihan sepanjang minggu dengan waktu yang dapat disesuaikan berdasarkan program dan ketersediaan peserta.
                        </p>

                        <!-- Callout Note -->
                        <div class="p-3.5 bg-sky-50 border border-sky-100 rounded-xl mb-6 flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                            <i class="fa-solid fa-calendar-check text-sky-600 text-base mt-0.5"></i>
                            <span><strong>Hubungi kami</strong> untuk mendapatkan informasi jadwal latihan yang tersedia di Kota Jambi.</span>
                        </div>

                        <!-- 3 Slot Chips -->
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div class="time-slot-card">
                                <span class="text-xs font-bold text-sky-600 uppercase">PAGI HARI</span>
                                <div class="text-base font-extrabold text-slate-900 mt-0.5">06.00 - 08.00</div>
                                <span class="text-xs text-slate-500 mt-0.5 block">Udara sejuk &amp; tenang</span>
                            </div>
                            <div class="time-slot-card">
                                <span class="text-xs font-bold text-sky-600 uppercase">PAGI - SIANG</span>
                                <div class="text-base font-extrabold text-slate-900 mt-0.5">08.30 - 11.00</div>
                                <span class="text-xs text-slate-500 mt-0.5 block">Cocok anak &amp; balita</span>
                            </div>
                            <div class="time-slot-card">
                                <span class="text-xs font-bold text-sky-600 uppercase">SORE - MALAM</span>
                                <div class="text-base font-extrabold text-slate-900 mt-0.5">15.30 - 18.00</div>
                                <span class="text-xs text-slate-500 mt-0.5 block">Waktu fleksibel favorit</span>
                            </div>
                        </div>
                    </div>

                    <!-- Right: Booking Form with 3 macOS dots -->
                    <div>
                        <div class="booking-form-box">
                            <div class="flex items-center gap-1.5 mb-3">
                                <span class="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block"></span>
                                <span class="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
                                <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>
                                <span class="text-xs font-bold text-slate-600 ml-1.5 uppercase">Cek Jadwal Latihan Kota Jambi</span>
                            </div>

                            <form id="slotCheckerForm" class="space-y-3">
                                @csrf
                                <div>
                                    <label class="block text-xs font-semibold text-slate-700 mb-1">Pilih Titik Kolam di Kota Jambi</label>
                                    <select name="branch" id="branchSelect" class="form-select-custom">
                                        @foreach($branches as $branch)
                                            <option value="{{ $branch }}">{{ $branch }}</option>
                                        @endforeach
                                    </select>
                                </div>

                                <div>
                                    <label class="block text-xs font-semibold text-slate-700 mb-1">Pilih Jam &amp; Sesi Latihan</label>
                                    <select name="slot" id="slotSelect" class="form-select-custom">
                                        <option value="Pagi Hari (06.00 - 08.00 WIB)">Pagi Hari (06.00 - 08.00 WIB)</option>
                                        <option value="Pagi - Siang (08.30 - 11.00 WIB)">Pagi - Siang (08.30 - 11.00 WIB)</option>
                                        <option value="Sore - Malam (15.30 - 18.00 WIB)" selected>Sore - Malam (15.30 - 18.00 WIB)</option>
                                    </select>
                                </div>

                                <button type="submit" class="btn-card-primary mt-2" id="btnCekSlot">
                                    <i class="fa-regular fa-calendar-check"></i>
                                    <span>Cek Jadwal &amp; Info Latihan</span>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- ==================== 5. KENAPA KONVERSASIAKUATIK.COM? ==================== -->
    <section class="py-16 bg-slate-50" id="kenapa-kami">
        <div class="container-custom">
            <div class="text-center max-w-2xl mx-auto mb-12">
                <span class="pill-badge mb-3">KEUNGGULAN KAMI</span>
                <h2 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mb-3 break-words">
                    KENAPA <span class="text-sky-600">KONSERVASIAKUATIK.COM</span>?
                </h2>
                <p class="text-slate-600 text-sm sm:text-base">
                    Dedikasi mendampingi setiap langkah pembelajaran renang Anda hingga mahir dan percaya diri.
                </p>
            </div>

            <!-- 4 Cards matching user prompt -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <!-- Pillar 1 -->
                <div class="value-card">
                    <div class="value-icon-box">
                        <i class="fa-solid fa-bullseye"></i>
                    </div>
                    <h4 class="text-base font-bold text-slate-900 mb-2">Fokus Membantu Peserta Cepat Bisa Berenang</h4>
                    <p class="text-xs text-slate-600 leading-relaxed">
                        Program dirancang agar peserta dapat belajar secara bertahap, memahami teknik dasar, dan membangun kepercayaan diri di dalam air.
                    </p>
                </div>

                <!-- Pillar 2 -->
                <div class="value-card">
                    <div class="value-icon-box">
                        <i class="fa-solid fa-users"></i>
                    </div>
                    <h4 class="text-base font-bold text-slate-900 mb-2">Untuk Semua Usia</h4>
                    <p class="text-xs text-slate-600 leading-relaxed">
                        Mulai dari balita hingga orang tua dapat mengikuti program sesuai kemampuan masing-masing.
                    </p>
                </div>

                <!-- Pillar 3 -->
                <div class="value-card">
                    <div class="value-icon-box">
                        <i class="fa-solid fa-location-dot"></i>
                    </div>
                    <h4 class="text-base font-bold text-slate-900 mb-2">Latihan di Kolam Renang Kota Jambi</h4>
                    <p class="text-xs text-slate-600 leading-relaxed">
                        Lokasi latihan menyesuaikan domisili peserta di berbagai kolam renang yang tersedia di Kota Jambi.
                    </p>
                </div>

                <!-- Pillar 4 -->
                <div class="value-card">
                    <div class="value-icon-box">
                        <i class="fa-solid fa-award"></i>
                    </div>
                    <h4 class="text-base font-bold text-slate-900 mb-2">Program Klub &amp; Privat</h4>
                    <p class="text-xs text-slate-600 leading-relaxed">
                        Peserta dapat memilih latihan bersama klub atau mendapatkan pendampingan secara privat.
                    </p>
                </div>
            </div>
        </div>
    </section>

    <!-- ==================== 6. PRESTASI & MILESTONE ==================== -->
    <section class="py-16 bg-white" id="prestasi">
        <div class="container-custom">
            <div class="coach-grid-2col">
                <!-- Left Details -->
                <div>
                    <span class="pill-badge mb-3">PERJALANAN BELAJAR</span>
                    <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-5 leading-snug">
                        PRESTASI &amp; MILESTONE
                    </h2>
                    
                    <div class="space-y-4 mb-6">
                        <!-- Point 1: One Prestasi -->
                        <div class="milestone-item-card">
                            <div class="flex items-start gap-3">
                                <div class="w-9 h-9 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <i class="fa-solid fa-trophy text-sm"></i>
                                </div>
                                <div>
                                    <h4 class="text-sm sm:text-base font-bold text-slate-900">One Prestasi</h4>
                                    <p class="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                                        Berbagai pencapaian menjadi bagian dari perjalanan dan perkembangan peserta KonservasiAkuatik.com.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- Point 2: One Milestone -->
                        <div class="milestone-item-card">
                            <div class="flex items-start gap-3">
                                <div class="w-9 h-9 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <i class="fa-solid fa-flag-checkered text-sm"></i>
                                </div>
                                <div>
                                    <h4 class="text-sm sm:text-base font-bold text-slate-900">One Milestone</h4>
                                    <p class="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                                        Setiap kemampuan baru yang berhasil dikuasai merupakan sebuah milestone dalam perjalanan belajar berenang.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Note -->
                    <p class="text-xs sm:text-sm font-semibold text-slate-600 mb-6 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                        <i class="fa-solid fa-quote-left text-sky-600 mr-1.5"></i>
                        Karena setiap peserta memiliki proses dan pencapaian masing-masing.
                    </p>

                    <a href="https://wa.me/{{ $whatsappNumber }}?text={{ rawurlencode('Halo KonservasiAkuatik.com, saya ingin konsultasi perkembangan kemampuan renang untuk memulai di Kota Jambi.') }}" 
                       target="_blank" 
                       class="text-xs sm:text-sm font-bold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1.5 transition-colors">
                        <span>Konsultasikan target kemampuan renang Anda bersama tim kami</span>
                        <i class="fa-solid fa-arrow-right text-xs"></i>
                    </a>
                </div>

                <!-- Right: Coach Photo with Quote Overlay -->
                <div>
                    <div class="coach-photo-wrapper">
                        <img src="{{ asset('images/coach-sarah.jpg') }}" alt="Prestasi & Milestone Konservasi Akuatik Kota Jambi" loading="lazy">
                        <div class="coach-photo-overlay">
                            <p class="text-sm sm:text-base font-bold italic text-white mb-2 leading-relaxed">
                                «"Dari takut air menjadi percaya diri. Dari belum bisa berenang menjadi mampu berenang."»
                            </p>
                            <span class="text-xs text-sky-200 font-semibold tracking-wider uppercase">
                                — KonservasiAkuatik.com Kota Jambi
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- ==================== 7. KEGIATAN LATIHAN ==================== -->
    <section class="py-16 bg-slate-50" id="kegiatan">
        <div class="container-custom">
            <div class="text-center max-w-2xl mx-auto mb-12">
                <span class="pill-badge mb-3">DOKUMENTASI KELAS</span>
                <h2 class="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
                    KEGIATAN LATIHAN
                </h2>
                <p class="text-slate-600 text-sm sm:text-base font-semibold">
                    Dokumentasi kegiatan akan segera hadir.
                </p>
            </div>

            <!-- 3 Photo Cards matching user tags -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <!-- Photo 1: [ FOTO KEGIATAN ] -->
                <div class="activity-photo-card">
                    <div class="activity-photo-img">
                        <img src="{{ asset('images/activity-1.jpg') }}" alt="Foto Kegiatan Latihan Renang Kota Jambi" loading="lazy">
                        <span class="activity-photo-badge">
                            <i class="fa-solid fa-camera mr-1"></i> [ FOTO KEGIATAN ]
                        </span>
                    </div>
                    <div class="p-5 text-center">
                        <h4 class="text-sm font-bold text-slate-900 mb-1">[ FOTO KEGIATAN ]</h4>
                        <p class="text-xs text-slate-500">Dokumentasi suasana kolam renang dan aktivitas latihan bersama.</p>
                    </div>
                </div>

                <!-- Photo 2: [ FOTO LATIHAN ] -->
                <div class="activity-photo-card">
                    <div class="activity-photo-img">
                        <img src="{{ asset('images/activity-2.jpg') }}" alt="Foto Sesi Latihan Renang Kota Jambi" loading="lazy">
                        <span class="activity-photo-badge">
                            <i class="fa-solid fa-person-chalkboard mr-1"></i> [ FOTO LATIHAN ]
                        </span>
                    </div>
                    <div class="p-5 text-center">
                        <h4 class="text-sm font-bold text-slate-900 mb-1">[ FOTO LATIHAN ]</h4>
                        <p class="text-xs text-slate-500">Pendampingan teknik dasar, pernapasan, dan kayuhan di air.</p>
                    </div>
                </div>

                <!-- Photo 3: [ FOTO PESERTA ] -->
                <div class="activity-photo-card">
                    <div class="activity-photo-img">
                        <img src="{{ asset('images/activity-3.jpg') }}" alt="Foto Peserta Renang Kota Jambi" loading="lazy">
                        <span class="activity-photo-badge">
                            <i class="fa-solid fa-award mr-1"></i> [ FOTO PESERTA ]
                        </span>
                    </div>
                    <div class="p-5 text-center">
                        <h4 class="text-sm font-bold text-slate-900 mb-1">[ FOTO PESERTA ]</h4>
                        <p class="text-xs text-slate-500">Milestone dan kebersamaan peserta dari balita hingga orang tua.</p>
                    </div>
                </div>
            </div>

            <!-- Bottom Note -->
            <div class="dashed-info-box max-w-2xl mx-auto">
                <p class="text-xs sm:text-sm text-slate-500 font-medium">
                    <i class="fa-regular fa-image text-sky-600 mr-1.5"></i>
                    Tambahkan foto kolam renang, kegiatan latihan, pelatih, serta dokumentasi peserta di bagian ini.
                </p>
            </div>
        </div>
    </section>

    <!-- ==================== 8. CERITA & TESTIMONI PESERTA ==================== -->
    <section class="py-16 bg-white" id="testimoni">
        <div class="container-custom">
            <div class="text-center max-w-2xl mx-auto mb-12">
                <span class="pill-badge mb-3">PENGALAMAN PESERTA</span>
                <h2 class="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
                    CERITA &amp; TESTIMONI PESERTA
                </h2>
                <p class="text-slate-600 text-sm sm:text-base">
                    Pengalaman peserta menjadi bagian penting dari perjalanan kami.
                </p>
            </div>

            <!-- 3 Testimonial Cards -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <!-- Testi 1 -->
                <div class="testi-card">
                    <div>
                        <div class="flex items-center justify-between mb-3">
                            <span class="text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-100">[ Testimoni 1 ]</span>
                            <div class="star-row">
                                <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
                            </div>
                        </div>
                        <p class="text-slate-600 text-xs sm:text-sm leading-relaxed italic mb-5">
                            "Awalnya sangat takut air, sekarang anak saya jadi percaya diri dan selalu antusias setiap hari latihan tiba. Pelatih mendampingi dengan ramah dan sabar."
                        </p>
                    </div>
                    <div class="flex items-center gap-2.5 pt-3 border-t border-slate-100">
                        <div class="w-8 h-8 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center font-bold text-xs">
                            P1
                        </div>
                        <div>
                            <h5 class="text-xs font-bold text-slate-900">[ Testimoni 1 ]</h5>
                            <p class="text-xs text-slate-400">Orang Tua Peserta (Kota Jambi)</p>
                        </div>
                    </div>
                </div>

                <!-- Testi 2 -->
                <div class="testi-card">
                    <div>
                        <div class="flex items-center justify-between mb-3">
                            <span class="text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-100">[ Testimoni 2 ]</span>
                            <div class="star-row">
                                <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
                            </div>
                        </div>
                        <p class="text-slate-600 text-xs sm:text-sm leading-relaxed italic mb-5">
                            "Belajar renang di usia dewasa ternyata menyenangkan dan tidak canggung. Latihan privat membantu fokus menguasai teknik dasar dengan aman."
                        </p>
                    </div>
                    <div class="flex items-center gap-2.5 pt-3 border-t border-slate-100">
                        <div class="w-8 h-8 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center font-bold text-xs">
                            P2
                        </div>
                        <div>
                            <h5 class="text-xs font-bold text-slate-900">[ Testimoni 2 ]</h5>
                            <p class="text-xs text-slate-400">Peserta Dewasa Pemula (Kota Jambi)</p>
                        </div>
                    </div>
                </div>

                <!-- Testi 3 -->
                <div class="testi-card">
                    <div>
                        <div class="flex items-center justify-between mb-3">
                            <span class="text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-100">[ Testimoni 3 ]</span>
                            <div class="star-row">
                                <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
                            </div>
                        </div>
                        <p class="text-slate-600 text-xs sm:text-sm leading-relaxed italic mb-5">
                            "Suasana kelas klub seru dan suportif. Teman-teman berlatih bersama dan kemampuan berenang terus meningkat di setiap sesi latihan."
                        </p>
                    </div>
                    <div class="flex items-center gap-2.5 pt-3 border-t border-slate-100">
                        <div class="w-8 h-8 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center font-bold text-xs">
                            P3
                        </div>
                        <div>
                            <h5 class="text-xs font-bold text-slate-900">[ Testimoni 3 ]</h5>
                            <p class="text-xs text-slate-400">Peserta Kelas Klub (Kota Jambi)</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Bottom Note -->
            <div class="dashed-info-box max-w-2xl mx-auto">
                <p class="text-xs sm:text-sm text-slate-500 font-medium">
                    <i class="fa-regular fa-comment-dots text-sky-600 mr-1.5"></i>
                    Bagian ini dapat diisi setelah tersedia testimoni dari peserta/orang tua peserta.
                </p>
            </div>
        </div>
    </section>

    <!-- ==================== 9. PILIH PROGRAM ANDA (TABEL PERBANDINGAN) ==================== -->
    <section class="py-16 bg-slate-50">
        <div class="container-custom">
            <div class="text-center max-w-2xl mx-auto mb-12">
                <span class="pill-badge mb-3">PERBANDINGAN PAKET</span>
                <h2 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
                    PILIH PROGRAM ANDA
                </h2>
                <p class="text-slate-600 text-sm sm:text-base">
                    Tabel ringkas program dan rincian biaya yang dirancang sesuai kebutuhan Anda.
                </p>
            </div>

            <!-- Mobile Scroll Tip -->
            <div class="sm:hidden text-right text-xs text-sky-600 font-semibold mb-2 flex items-center justify-end gap-1">
                <i class="fa-solid fa-arrows-left-right text-xs"></i>
                <span>Geser tabel ke samping</span>
            </div>

            <div class="table-wrapper max-w-4xl mx-auto">
                <div class="overflow-x-auto">
                    <table class="custom-table">
                        <thead>
                            <tr>
                                <th>Program</th>
                                <th>Harga</th>
                                <th>Cocok Untuk</th>
                                <th class="text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- Row 1: Klub Renang -->
                            <tr>
                                <td class="font-bold text-slate-900 whitespace-nowrap">
                                    <div class="flex items-center gap-2">
                                        <div class="w-7 h-7 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center text-xs">
                                            <i class="fa-solid fa-users"></i>
                                        </div>
                                        <span>Klub Renang</span>
                                    </div>
                                </td>
                                <td class="font-extrabold text-slate-900 whitespace-nowrap">
                                    Rp500.000/bulan
                                </td>
                                <td class="text-slate-600">
                                    Peserta yang ingin berlatih bersama
                                </td>
                                <td class="text-center whitespace-nowrap">
                                    <a href="https://wa.me/{{ $whatsappNumber }}?text={{ rawurlencode('Halo KonservasiAkuatik.com, saya ingin mendaftar Klub Renang di Kota Jambi.') }}" 
                                       target="_blank" 
                                       class="btn-primary-pill text-xs">
                                        <span>PILIH KELAS KLUB</span>
                                        <i class="fa-solid fa-angle-right text-xs"></i>
                                    </a>
                                </td>
                            </tr>

                            <!-- Row 2: Kursus Privat (Highlighted) -->
                            <tr class="highlighted-row">
                                <td class="font-bold text-sky-800 whitespace-nowrap">
                                    <div class="flex items-center gap-2">
                                        <div class="w-7 h-7 rounded-lg bg-sky-200 text-sky-800 flex items-center justify-center text-xs">
                                            <i class="fa-solid fa-user-shield"></i>
                                        </div>
                                        <span>Kursus Privat</span>
                                        <span class="text-xs bg-sky-200 text-sky-800 font-bold px-2 py-0.5 rounded-full ml-1">Fokus</span>
                                    </div>
                                </td>
                                <td class="font-extrabold text-sky-800 whitespace-nowrap">
                                    Rp1.000.000/bulan
                                </td>
                                <td class="text-slate-700 font-medium">
                                    Peserta yang membutuhkan latihan lebih personal
                                </td>
                                <td class="text-center whitespace-nowrap">
                                    <a href="https://wa.me/{{ $whatsappNumber }}?text={{ rawurlencode('Halo KonservasiAkuatik.com, saya ingin mendaftar Kursus Privat renang di Kota Jambi.') }}" 
                                       target="_blank" 
                                       class="btn-primary-pill text-xs">
                                        <span>DAFTAR KURSUS PRIVAT</span>
                                        <i class="fa-solid fa-angle-right text-xs"></i>
                                    </a>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Consultation Notice -->
            <div class="text-center mt-8">
                <p class="text-sm font-semibold text-slate-700 mb-2">
                    Belum yakin memilih program yang mana?
                </p>
                <a href="https://wa.me/{{ $whatsappNumber }}?text={{ rawurlencode('Halo KonservasiAkuatik.com, saya ingin konsultasi kebutuhan program renang yang cocok untuk saya/keluarga saya di Kota Jambi.') }}" 
                   target="_blank" 
                   class="text-xs sm:text-sm font-bold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1.5 transition-colors">
                    <i class="fa-brands fa-whatsapp text-emerald-500 text-base"></i>
                    <span>Konsultasikan kebutuhan Anda terlebih dahulu melalui WhatsApp</span>
                    <i class="fa-solid fa-arrow-right text-xs"></i>
                </a>
            </div>
        </div>
    </section>

    <!-- ==================== 10. SIAP MULAI BELAJAR BERENANG? ==================== -->
    <section class="final-cta-clean">
        <div class="container-custom max-w-2xl mx-auto">
            <span class="pill-badge mb-3">MULAI SEKARANG</span>
            <h2 class="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
                SIAP MULAI BELAJAR BERENANG?
            </h2>
            <p class="text-slate-700 font-semibold text-sm sm:text-base leading-relaxed mb-2">
                Jangan biarkan rasa takut terhadap air menjadi penghalang.
            </p>
            <p class="text-slate-600 text-xs sm:text-sm leading-relaxed mb-6">
                Mulai perjalanan berenang Anda bersama KonservasiAkuatik.com.
            </p>

            <!-- 5 Checklist Items from User -->
            <div class="final-cta-checklist">
                <span class="final-cta-check-item">
                    <i class="fa-solid fa-circle-check text-sky-600"></i>
                    <span>Program Klub &amp; Privat</span>
                </span>
                <span class="final-cta-check-item">
                    <i class="fa-solid fa-circle-check text-sky-600"></i>
                    <span>Balita hingga Orang Tua</span>
                </span>
                <span class="final-cta-check-item">
                    <i class="fa-solid fa-circle-check text-sky-600"></i>
                    <span>Senin – Minggu</span>
                </span>
                <span class="final-cta-check-item">
                    <i class="fa-solid fa-circle-check text-sky-600"></i>
                    <span>Kota Jambi</span>
                </span>
                <span class="final-cta-check-item">
                    <i class="fa-solid fa-circle-check text-sky-600"></i>
                    <span>Mulai Rp500.000/bulan</span>
                </span>
            </div>

            <!-- WhatsApp CTA Button -->
            <div>
                <a href="https://wa.me/{{ $whatsappNumber }}?text={{ rawurlencode('Halo KonservasiAkuatik.com, saya siap mulai belajar berenang di Kota Jambi. Mohon panduan pendaftarannya.') }}" 
                   target="_blank" 
                   class="btn-final-whatsapp">
                    <i class="fa-brands fa-whatsapp text-xl"></i>
                    <span>DAFTAR SEKARANG VIA WHATSAPP</span>
                </a>
            </div>

            <!-- WhatsApp Number Display -->
            <p class="text-xs sm:text-sm font-semibold text-slate-500 mt-4">
                WhatsApp: <a href="https://wa.me/{{ $whatsappNumber }}" target="_blank" class="text-sky-600 hover:underline">081*** ({{ $whatsappDisplay }})</a>
            </p>
        </div>
    </section>

    <!-- ==================== 11. LOKASI LATIHAN ==================== -->
    <section class="py-16 bg-slate-50" id="lokasi">
        <div class="container-custom">
            <div class="location-container">
                <div class="location-grid-2col items-stretch">
                    <!-- Left: Description & Details -->
                    <div class="p-5 sm:p-8 md:p-10">
                        <span class="pill-badge mb-3">LOKASI KOTA JAMBI</span>
                        <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-3 break-words">
                            LOKASI LATIHAN
                        </h2>
                        <p class="text-slate-600 text-xs sm:text-sm leading-relaxed mb-6">
                            Latihan tersedia di berbagai kolam renang di Kota Jambi, menyesuaikan domisili peserta.
                        </p>

                        <div class="space-y-3.5 mb-6 text-xs sm:text-sm text-slate-700">
                            <div class="flex items-start gap-3">
                                <i class="fa-solid fa-location-dot text-sky-600 text-base mt-0.5 flex-shrink-0"></i>
                                <span class="leading-normal">Kolam Renang Tepian Ratu (Telanaipura, Kota Jambi)</span>
                            </div>
                            <div class="flex items-start gap-3">
                                <i class="fa-solid fa-location-dot text-sky-600 text-base mt-0.5 flex-shrink-0"></i>
                                <span class="leading-normal">Kolam Renang Kota Baru Jambi</span>
                            </div>
                            <div class="flex items-start gap-3">
                                <i class="fa-solid fa-location-dot text-sky-600 text-base mt-0.5 flex-shrink-0"></i>
                                <span class="leading-normal">Kolam Renang Sungai Kambang &amp; Mayang Mangurai</span>
                            </div>
                            <div class="flex items-start gap-3">
                                <i class="fa-solid fa-location-dot text-sky-600 text-base mt-0.5 flex-shrink-0"></i>
                                <span class="leading-normal">Kolam Renang Pribadi / Domisili Peserta di Kota Jambi</span>
                            </div>
                        </div>

                        <div class="p-3.5 bg-sky-50 rounded-xl border border-sky-100 text-xs text-slate-600 flex items-start gap-3">
                            <i class="fa-solid fa-circle-info text-sky-600 text-base mt-0.5 flex-shrink-0"></i>
                            <span class="leading-relaxed">Menyesuaikan jadwal dan domisili terdekat peserta di Kota Jambi.</span>
                        </div>
                    </div>

                    <!-- Right: Google Maps Area & Action -->
                    <div class="subtle-grid-box p-5 sm:p-8 flex items-center justify-center border-t lg:border-t-0 lg:border-l border-slate-200">
                        <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-md text-center max-w-sm w-full">
                            <div class="w-12 h-12 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center mx-auto mb-3 text-xl">
                                <i class="fa-solid fa-map-location-dot"></i>
                            </div>
                            <h4 class="text-sm font-bold text-slate-900 mb-1">TITIK KOLAM RENANG KOTA JAMBI</h4>
                            <p class="text-xs text-slate-500 mb-4">
                                Latihan tersedia di berbagai kolam renang di Kota Jambi.
                            </p>
                            
                            <!-- Google Maps Button -->
                            <a href="https://maps.google.com/?q=Kolam+Renang+Kota+Jambi" 
                               target="_blank" 
                               class="btn-primary-pill text-xs w-full justify-center mb-3">
                                <span>LIHAT LOKASI / GOOGLE MAPS</span>
                                <i class="fa-solid fa-arrow-up-right-from-square text-xs"></i>
                            </a>

                            <p class="text-xs text-slate-400 italic">
                                Link Google Maps dapat ditambahkan setelah tersedia.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

@endsection
