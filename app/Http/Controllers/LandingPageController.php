<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class LandingPageController extends Controller
{
    /**
     * Display the KonservasiAkuatik.com landing page.
     */
    public function index()
    {
        $whatsappNumber = '6281234567890';
        $whatsappDisplay = '0812-3456-7890';

        $packages = [
            [
                'id' => 'klub',
                'name' => 'Kelas Klub',
                'badge' => 'Latihan Bersama',
                'is_popular' => false,
                'description' => 'Program latihan berenang dalam kelompok dengan suasana latihan yang aktif, menyenangkan, dan suportif.',
                'price_prefix' => 'Mulai dari',
                'price' => 'Rp500.000',
                'period' => '/bulan',
                'features' => [
                    'Latihan terjadwal',
                    'Cocok untuk berbagai level',
                    'Suasana latihan bersama',
                    'Pendampingan selama proses belajar',
                ],
                'cta_text' => 'PILIH KELAS KLUB',
                'cta_class' => 'btn-card-outline',
                'whatsapp_msg' => 'Halo KonservasiAkuatik.com, saya ingin mendaftar Kelas Klub di Kota Jambi. Mohon info jadwal dan lokasinya.',
            ],
            [
                'id' => 'privat',
                'name' => 'Kursus Privat',
                'badge' => 'Latihan Lebih Fokus',
                'is_popular' => true,
                'description' => 'Program belajar berenang secara privat dengan latihan yang lebih terarah sesuai kebutuhan dan kemampuan peserta.',
                'price_prefix' => 'Biaya',
                'price' => 'Rp1.000.000',
                'period' => '/bulan',
                'features' => [
                    'Latihan lebih fokus',
                    'Program dapat disesuaikan',
                    'Cocok untuk pemula maupun yang ingin meningkatkan kemampuan',
                    'Pendampingan lebih personal',
                ],
                'cta_text' => 'DAFTAR KURSUS PRIVAT',
                'cta_class' => 'btn-card-primary',
                'whatsapp_msg' => 'Halo KonservasiAkuatik.com, saya ingin mendaftar Kursus Privat renang di Kota Jambi. Mohon informasi ketersediaan jadwal.',
            ],
        ];

        $targetAudience = [
            [
                'tag' => 'SEMUA USIA',
                'title' => 'Balita',
                'description' => 'Pengenalan air ramah motorik dengan pendekatan menyenangkan agar terbiasa di dalam air sejak dini.',
                'icon' => 'child',
            ],
            [
                'tag' => 'SEMUA USIA',
                'title' => 'Anak-anak',
                'description' => 'Membangun kepercayaan diri, water safety, serta mempelajari teknik dasar berenang dengan nyaman.',
                'icon' => 'swimmer',
            ],
            [
                'tag' => 'SEMUA USIA',
                'title' => 'Remaja',
                'description' => 'Mengasah teknik kayuhan, efisiensi napas, ketahanan fisik, serta pembentukan postur tubuh prima.',
                'icon' => 'award',
            ],
            [
                'tag' => 'SEMUA USIA',
                'title' => 'Dewasa',
                'description' => 'Belajar berenang dari nol atau mengatasi rasa takut air dengan metode santai dan terstruktur.',
                'icon' => 'user-check',
            ],
            [
                'tag' => 'SEMUA USIA',
                'title' => 'Orang Tua',
                'description' => 'Olahraga akuatik rendah risiko cedera untuk menjaga kebugaran sendi, kesehatan jantung, dan kebugaran tubuh.',
                'icon' => 'heart-pulse',
            ],
        ];

        $timeSlots = [
            [
                'period' => 'PAGI HARI',
                'time' => '06.00 - 08.00 WIB',
                'note' => 'Udara sejuk & kolam tenang, optimal untuk fokus'
            ],
            [
                'period' => 'PAGI - SIANG',
                'time' => '08.30 - 11.00 WIB',
                'note' => 'Cocok untuk balita & anak sebelum siang'
            ],
            [
                'period' => 'SORE - MALAM',
                'time' => '15.30 - 18.00 WIB',
                'note' => 'Jadwal fleksibel sepulang sekolah atau kerja'
            ],
        ];

        $branches = [
            'Kolam Renang Tepian Ratu (Telanaipura, Kota Jambi)',
            'Kolam Renang Kota Baru Jambi',
            'Kolam Renang Sungai Kambang Jambi',
            'Kolam Renang Mayang Mangurai Jambi',
            'Kolam Renang Pribadi / Rumah Peserta di Kota Jambi',
        ];

        $reasons = [
            [
                'title' => 'Fokus Membantu Peserta Cepat Bisa Berenang',
                'description' => 'Program dirancang agar peserta dapat belajar secara bertahap, memahami teknik dasar, dan membangun kepercayaan diri di dalam air.',
                'icon' => 'target',
            ],
            [
                'title' => 'Untuk Semua Usia',
                'description' => 'Mulai dari balita hingga orang tua dapat mengikuti program sesuai kemampuan masing-masing.',
                'icon' => 'users',
            ],
            [
                'title' => 'Latihan di Kolam Renang Kota Jambi',
                'description' => 'Lokasi latihan menyesuaikan domisili peserta di berbagai kolam renang yang tersedia di Kota Jambi.',
                'icon' => 'location-dot',
            ],
            [
                'title' => 'Program Klub & Privat',
                'description' => 'Peserta dapat memilih latihan bersama klub atau mendapatkan pendampingan secara privat.',
                'icon' => 'award',
            ],
        ];

        $activities = [
            [
                'title' => '[ FOTO KEGIATAN ]',
                'description' => 'Dokumentasi kegiatan latihan kolam renang bersama tim KonservasiAkuatik.com.',
                'image' => asset('images/activity-1.jpg'),
            ],
            [
                'title' => '[ FOTO LATIHAN ]',
                'description' => 'Sesi belajar bersama pelatih dalam menguasai teknik dasar dan pernapasan.',
                'image' => asset('images/activity-2.jpg'),
            ],
            [
                'title' => '[ FOTO PESERTA ]',
                'description' => 'Momen pencapaian milestone kemampuan renang peserta dari berbagai usia.',
                'image' => asset('images/activity-3.jpg'),
            ],
        ];

        $testimonials = [
            [
                'name' => 'Peserta / Orang Tua Peserta 1',
                'role' => 'Orang Tua Siswa Balita & Anak (Kota Jambi)',
                'rating' => 5,
                'comment' => 'Pengalaman pertama anak belajar renang di KonservasiAkuatik Kota Jambi sangat menyenangkan. Pelatihnya sabar dan telaten sehingga anak yang tadinya takut air sekarang jadi berani.',
            ],
            [
                'name' => 'Peserta 2',
                'role' => 'Peserta Dewasa Pemula (Kota Jambi)',
                'rating' => 5,
                'comment' => 'Belajar renang saat dewasa ternyata tidak canggung di sini. Metode belajarnya santai dan terarah, dalam beberapa sesi sudah berani meluncur dan bernapas dengan ritmis.',
            ],
            [
                'name' => 'Peserta / Orang Tua Peserta 3',
                'role' => 'Peserta Kelas Klub (Kota Jambi)',
                'rating' => 5,
                'comment' => 'Suasana latihan klub sangat positif dan suportif. Teman-teman berlatih bersama dengan seru dan perkembangan fisik anak terasa semakin sehat dan bugar.',
            ],
        ];

        $priceTable = [
            [
                'program' => 'Klub Renang',
                'harga' => 'Rp500.000/bulan',
                'cocok_untuk' => 'Peserta yang ingin berlatih bersama',
                'action_label' => 'PILIH KELAS KLUB',
                'is_popular' => false,
                'msg' => 'Halo KonservasiAkuatik.com, saya ingin mendaftar Klub Renang di Kota Jambi.',
            ],
            [
                'program' => 'Kursus Privat',
                'harga' => 'Rp1.000.000/bulan',
                'cocok_untuk' => 'Peserta yang membutuhkan latihan lebih personal',
                'action_label' => 'DAFTAR KURSUS PRIVAT',
                'is_popular' => true,
                'msg' => 'Halo KonservasiAkuatik.com, saya ingin mendaftar Kursus Privat renang di Kota Jambi.',
            ],
        ];

        return view('landing', compact(
            'whatsappNumber',
            'whatsappDisplay',
            'packages',
            'targetAudience',
            'timeSlots',
            'branches',
            'reasons',
            'activities',
            'testimonials',
            'priceTable'
        ));
    }

    /**
     * Handle slot check request.
     */
    public function checkSlot(Request $request)
    {
        $branch = $request->input('branch', 'Kota Jambi');
        $slot = $request->input('slot', 'Pagi Hari (06.00 - 08.00 WIB)');
        $phone = '6281234567890';

        $text = rawurlencode("Halo KonservasiAkuatik.com, saya ingin informasi jadwal latihan dan ketersediaan slot di: {$branch} ({$slot}).");
        $waUrl = "https://wa.me/{$phone}?text={$text}";

        if ($request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => "Informasi jadwal latihan untuk area {$branch} ({$slot}) dapat disesuaikan.",
                'whatsapp_url' => $waUrl,
            ]);
        }

        return redirect()->away($waUrl);
    }
}
