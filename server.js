import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const API_KEY = process.env.OPENAI_API_KEY;

const products = [
  {
    name: "데일리 소프트 하네스",
    image: "https://cdn.pixabay.com/photo/2018/02/10/21/33/dog-3144257_1280.jpg",
    price: "₩19,900",
    link: "https://example.com/product/soft-harness"
  },
  {
    name: "프리미엄 리드 하네스 세트",
    image: "https://cdn.pixabay.com/photo/2017/09/25/13/12/dog-2785074_1280.jpg",
    price: "₩29,900",
    link: "https://example.com/product/premium-set"
  },
  {
    name: "야외 산책용 견고한 하네스",
    image: "https://cdn.pixabay.com/photo/2016/02/19/10/00/dog-1209621_1280.jpg",
    price: "₩24,900",
    link: "https://example.com/product/outdoor-harness"
  }
];

// 채팅 API
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "너는 강아지 하네스 판매 보조 AI야." },
          { role: "user", content: userMessage }
        ]
      })
    });

    const data = await response.json();
    let replyText = "죄송해요, 응답을 가져올 수 없어요 🐾";
    if (data.choices && data.choices[0] && data.choices[0].message) {
      replyText = data.choices[0].message.content;
    }

    let selected = null;
    if (userMessage.includes("작은") || userMessage.includes("소형")) selected = products[0];
    else if (userMessage.includes("고급") || userMessage.includes("예쁜")) selected = products[1];
    else if (userMessage.includes("튼튼") || userMessage.includes("산책")) selected = products[2];
    else if (Math.random() > 0.5) selected = products[Math.floor(Math.random() * products.length)];

    res.json({ reply: replyText, product: selected });
  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: "서버 오류가 발생했어요 🐾" });
  }
});

// 포트
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ 서버 실행 중: http://localhost:${PORT}`));
