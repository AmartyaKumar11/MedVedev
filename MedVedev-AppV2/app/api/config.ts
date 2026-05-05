// ─── API Configuration ───────────────────────────────────────────────────────
// Change API_BASE_URL to point at your running backend.
//
//  Local dev (Android emulator on the same machine):
//    'http://10.0.2.2:8000'
//
//  Local dev (physical device on same Wi-Fi):
//    Run `ipconfig` (Windows) or `ifconfig` (Mac/Linux), find your PC's
//    IPv4 address under the WiFi adapter (e.g. 192.168.1.5), then use:
//    'http://192.168.1.X:8000'   ← replace X with your actual IP
//
//  Production:
//    'https://api.yourserver.com'
//
// ⚠️  FOR PHYSICAL DEVICE TESTING: change the line below from 10.0.2.2
//     to your PC's local IP address — phones cannot reach localhost/10.0.2.2.

export const API_BASE_URL = 'http://10.133.204.102:8000';

/**
 * If true, uses mock data instead of real API calls.
 */
export const USE_MOCK_API = false;
