import express from "express";
import axios from "axios";
import cors from "cors";

// Create express app
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/api/ytdl", async (req, res) => {
  try {
    const { url } = req.body;

    const response = await axios.post(
      "https://ytdown.to/proxy.php",
      new URLSearchParams({ url }),
      {
        headers: {
          "accept": "*/*",
          "accept-language": "id,en-US;q=0.9,en;q=0.8",
          "cache-control": "no-cache",
          "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
          "origin": "https://ytdown.to",
          "pragma": "no-cache",
          "priority": "u=1, i",
          "referer": "https://ytdown.to/en2/",
          "sec-ch-ua": '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
          "sec-ch-ua-mobile": "?1",
          "sec-ch-ua-platform": '"Android"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "user-agent":
            "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36",
          "x-requested-with": "XMLHttpRequest",
        },
      }
    );

    res.json(response.data.api || response.data);
  } catch (err) {
    res.status(500).json({ error: true, message: err.message });
  }
});

// Export sebagai handler untuk Vercel
export default app;
