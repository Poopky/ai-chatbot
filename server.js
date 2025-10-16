import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// 환경 변수 로드 (.env 파일)
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// 모든 도메인에서의 요청을 허용합니다 (CORS 해결).
// 만약 특정 도메인만 허용하고 싶다면 cors({ origin: 'https://[당신의 쇼핑몰 도메인]' }) 형식으로 변경해야 합니다.
app.use(cors());
app.use(express.json());
// Render 환경에서는 정적 파일 경로가 다를 수 있으나, 일단 public 폴더를 지정합니다.
app.use(express.static(path.join(__dirname, "public")));

const API_KEY = process.env.OPENAI_API_KEY;

// !!! 디버깅: API 키 로드 상태 확인
if (!API_KEY) {
    console.error("FATAL ERROR: OPENAI_API_KEY가 .env 파일 또는 환경 변수에 설정되어 있지 않습니다.");
} else {
    console.log("INFO: OPENAI_API_KEY가 성공적으로 로드되었습니다.");
}


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
    
    if (!API_KEY) {
        return res.status(500).json({ reply: "API 키가 없어 AI 기능이 작동하지 않아요." });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "너는 강아지 하네스 판매 보조 AI야. 답변 후에는 반드시 하네스를 추천하는 멘트를 자연스럽게 추가해야 해." },
          { role: "user", content: userMessage }
        ]
      })
    });

    // !!! 디버깅: OpenAI API 응답 상태 확인
    if (!response.ok) {
        const errorDetails = await response.text();
        console.error(`OpenAI API 호출 실패: Status ${response.status}. Details: ${errorDetails.substring(0, 100)}`);
        // API 키 오류(401) 등 발생 시 클라이언트에게 오류 메시지를 보냄
        return res.status(response.status).json({ reply: `AI 응답 실패. 상태 코드: ${response.status}. Render 로그를 확인해 주세요.` });
    }

    const data = await response.json();
    let replyText = "죄송해요, 응답을 가져올 수 없어요 🐾"; // 이 메시지는 이제 OpenAI API가 성공했음에도 불구하고 응답 구조가 이상할 때만 남습니다.
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      replyText = data.choices[0].message.content;
    } else {
        // 응답은 200이었으나, body에 오류 메시지가 포함된 경우를 위해 로깅
        console.error("OpenAI 응답 구조 이상:", data); 
    }

    let selected = null;
    if (userMessage.includes("작은") || userMessage.includes("소형") || userMessage.includes("경량")) selected = products[0];
    else if (userMessage.includes("고급") || userMessage.includes("예쁜") || userMessage.includes("가죽")) selected = products[1];
    else if (userMessage.includes("튼튼") || userMessage.includes("산책") || userMessage.includes("오래")) selected = products[2];
    else if (Math.random() > 0.6) selected = products[Math.floor(Math.random() * products.length)];

    res.json({ reply: replyText, product: selected });
  } catch (err) {
    console.error("서버 내부에서 예상치 못한 오류 발생:", err);
    res.status(500).json({ reply: "서버 오류가 발생했어요 🐾 Render 로그를 확인해 주세요." });
  }
});

// 포트
const PORT = process.env.PORT || 10000; // 포트 10000으로 기본 설정
app.listen(PORT, () => {
    // 0.0.0.0을 사용하여 Render 환경에서 모든 인터페이스를 수신하도록 안내
    console.log(`✅ 서버 실행 중: http://0.0.0.0:${PORT} (Render 환경 확인 필요)`);
});
