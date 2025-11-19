import express from "express";
import axios from "axios";

const app = express();
const port = 3000;

app.get("/download", async (req, res) => {
  try {
    const { url, getDownload } = req.query;
    if (!url) return res.status(400).json({ error: "Missing ?url=" });

    // STEP 1: oEmbed untuk info
    const videoId = url.split("youtu.be/")[1] || url.split("v=")[1];
    const oembedRes = await axios.get(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      }
    );
    const oembed = oembedRes.data;

    // STEP 2: Converter API (cnv.cx) untuk URL download
    const convertRes = await axios.post(
      "https://cnv.cx/v2/converter",
      new URLSearchParams({
        link: url,
        format: "mp3",
        audioBitrate: "320",
        videoQuality: "720",
        filenameStyle: "pretty",
        vCodec: "h264"
      }),
      {
        headers: {
          accept: "*/*",
          "accept-language": "id,en-US;q=0.9,en;q=0.8",
          "cache-control": "no-cache",
          key: "MjYwZWY4OGM4Njg1ZjZmNTVmYzcxN2I3M2JhZmU4MjhjYjVhMGE2YTIyOWEwYTRhOTI3OGM4NzBjNGQ3ODQyM3xNVGMyTXpVMU5EWXhNakk0Tnc9PQ==",
          origin: "https://iframe.y2meta-uk.com",
          pragma: "no-cache",
          referer: "https://iframe.y2meta-uk.com/",
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36"
        }
      }
    );

    const convertData = convertRes.data;

    // STEP 3: Gabungkan info
    const info = {
      title: oembed.title,
      author: oembed.author_name,
      thumbnail: oembed.thumbnail_url,
      duration: convertData.duration || null,
      formats: [
        {
          ext: "mp3",
          quality: "320kbps",
          size: convertData.size || null,
          url: convertData.url
        }
      ]
    };

    // STEP 4: Kalau cuma info → return JSON
    if (getDownload !== "true") return res.json(info);

    // STEP 5: Kalau download → stream
    const fileRes = await axios.get(convertData.url, {
      responseType: "arraybuffer",
      headers: {
        "User-Agent": "Mozilla/5.0",
        Referer: "https://iframe.y2meta-uk.com/",
        Origin: "https://iframe.y2meta-uk.com"
      }
    });

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${convertData.filename}"`
    );
    return res.send(fileRes.data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
