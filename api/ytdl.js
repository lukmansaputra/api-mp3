// File: api/ytdl.js

import express from "express";
import axios from "axios";
import cors from "cors";

// 1. Inisialisasi Express
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- KONFIGURASI ENDPOINT ---
const REFERER_URL = 'https://ytdown.to/en2/';
const PROXY_URL = 'https://ytdown.to/proxy.php';
// ----------------------------

// Header dasar yang meniru browser (tanpa 'Cookie' dan 'Referer' yang dinamis)
const commonHeaders = {
    "accept": "*/*",
    "accept-language": "id,en-US;q=0.9,en;q=0.8",
    "cache-control": "no-cache",
    "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
    "origin": "https://ytdown.to",
    "pragma": "no-cache",
    "priority": "u=1, i",
    "sec-ch-ua": '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
    "sec-ch-ua-mobile": "?1",
    "sec-ch-ua-platform": '"Android"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "user-agent": "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36",
    "x-requested-with": "XMLHttpRequest",
};

/**
 * 🔑 Tahap 1: Mengambil cookie sesi (PHPSESSID, _ga) dari URL referer.
 * @returns {Promise<string>} String cookies yang siap digunakan di header 'Cookie'.
 */
async function fetchNewCookies() {
    try {
        // Request GET ke halaman referer untuk mendapatkan cookies baru
        const response = await axios.get(REFERER_URL, {
            headers: commonHeaders,
            maxRedirects: 0,
        });

        const setCookieHeader = response.headers['set-cookie'];

        if (!setCookieHeader) {
            console.warn('Peringatan: Header Set-Cookie tidak ditemukan.');
            return '';
        }

        // Gabungkan semua item cookie menjadi string yang dipisahkan semicolon (; )
        const rawCookies = setCookieHeader.map(cookie => {
            return cookie.split(';')[0];
        }).join('; ');
        
        return rawCookies;

    } catch (error) {
        // Di lingkungan Vercel, logging console.error membantu debugging
        console.error('ERROR: Gagal mengambil cookie sesi:', error.message);
        return ''; // Kembalikan string kosong agar request proxy tetap dicoba (walau mungkin gagal)
    }
}


// 2. Definisi Rute
app.post("/", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: true, message: "URL is required" });
    }

    // --- TAHAP 1: AMBIL COOKIES SANGAT BARU ---
    const cookiesString = await fetchNewCookies();
    // ------------------------------------------

    // Data yang dikirim ke proxy
    const requestData = new URLSearchParams({ url });

    // --- TAHAP 2: REQUEST POST DENGAN COOKIES DINAMIS ---
    const response = await axios.post(
      PROXY_URL,
      requestData,
      {
        headers: {
          ...commonHeaders, // Header umum
           "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
          "referer": REFERER_URL, // Referer wajib
           // VITAL: Kirim cookie sesi baru yang didapat di Tahap 1
           "cookie": cookiesString 
        },
      }
    );

    // ytdown.to sering membungkus data di key 'api', kita coba ambil itu dulu
    res.json(response.data.api || response.data); 
  } catch (err) {
    console.error("YTDL Error:", err.message);
    res.status(500).json({ error: true, message: "Failed to process the request." });
  }
});

// 3. Wajib: Export sebagai handler default untuk Vercel (ESM)
// Di lingkungan serverless (Vercel), app.listen diabaikan
export default app;