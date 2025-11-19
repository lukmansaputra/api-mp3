import axios from "axios";

export default async function handler(req, res) {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "Missing ?url=" });

    // Ambil videoId
    const videoId = url.includes("youtu.be/")
      ? url.split("youtu.be/")[1]
      : url.split("v=")[1];

    // STEP 1: oEmbed info
    const oembedRes = await axios.get(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { headers: { "User-Agent": "Mozilla/5.0" } }
    );
    const oembed = oembedRes.data;

    // STEP 2: Generate URL download via cnv.cx (tidak di-fetch)
    const converterBase = "https://cnv.cx/v2/converter";
    const downloadParams = new URLSearchParams({
      link: url,
      format: "mp3",
      audioBitrate: "320",
      videoQuality: "720",
      filenameStyle: "pretty",
      vCodec: "h264"
    });

    const downloadUrl = `${converterBase}?${downloadParams.toString()}`;

    // STEP 3: Return info + direct download link
    const info = {
      title: oembed.title,
      author: oembed.author_name,
      thumbnail: oembed.thumbnail_url,
      downloadUrl
    };

    return res.status(200).json(info);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
