require("dotenv").config();
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const Tesseract = require("tesseract.js");
const { OpenAI } = require("openai");

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🟢 HOME PAGE (UI)
app.get("/", (req, res) => {
  res.send(`
    <h2>AI Document Tool</h2>

    <input type="file" id="file"/>
    <button onclick="upload()">Upload</button>

    <br><br>
    <textarea id="text" rows="10" cols="50"></textarea>

    <br>
    <button onclick="summary()">Summary</button>
    <button onclick="voice()">Voice</button>

    <h3 id="result"></h3>

    <script>
      async function upload(){
        const file = document.getElementById("file").files[0];
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/upload", {
          method: "POST",
          body: formData
        });

        const data = await res.json();
        document.getElementById("text").value = data.text;
      }

      async function summary(){
        const text = document.getElementById("text").value;

        const res = await fetch("/summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text })
        });

        const data = await res.json();
        document.getElementById("result").innerText = data.summary;
      }

      function voice(){
        const text = document.getElementById("text").value;
        const speech = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(speech);
      }
    </script>
  `);
});

// 📄 OCR
app.post("/upload", upload.single("file"), async (req, res) => {
  const result = await Tesseract.recognize(req.file.buffer, "eng");
  res.json({ text: result.data.text });
});

// 🧠 SUMMARY
app.post("/summary", async (req, res) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: "Summarize: " + req.body.text }],
  });

  res.json({ summary: response.choices[0].message.content });
});

// 🚀 START
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Running on " + PORT));
