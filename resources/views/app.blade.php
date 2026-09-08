<!DOCTYPE html>
<html class="light" lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>CuanGO</title>
    <!-- Fonts & Icons -->
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <!-- Leaflet.js CSS & JS CDN (Bebas API Key) -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
    
    <!-- Chart.js CDN -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <!-- App styles and scripts -->
    <link href="{{ asset('css/app.css') }}?v={{ time() }}" rel="stylesheet" />
    <script src="{{ asset('js/app.js') }}?v={{ time() }}" defer></script>
    @inertiaHead
    <script>
        window.BASE_URL = "{{ url('/') }}/";
        window.GOOGLE_MAPS_API_KEY = "{{ env('GOOGLE_MAPS_API_KEY', '') }}";
        // Force unregister all old service workers to clear cache
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(registrations) {
                for (let registration of registrations) {
                    registration.unregister().then(function(boolean) {
                        if (boolean) {
                            console.log('Old Service Worker unregistered successfully.');
                            window.location.reload();
                        }
                    });
                }
            });
        }
    </script>
</head>
<body class="font-sans text-slate-800 bg-slate-50">
    @inertia
</body>
</html>
