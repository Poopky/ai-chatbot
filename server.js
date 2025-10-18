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
app.use(cors()); // CORS 활성화
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// !!! Gemini API 키를 사용합니다.
const API_KEY = process.env.GEMINI_API_KEY; 

// 디버깅: API 키 로드 상태 확인
if (!API_KEY) {
    console.error("FATAL ERROR: GEMINI_API_KEY가 환경 변수에 설정되어 있지 않습니다. AI 기능이 작동하지 않습니다.");
} else {
    console.log("INFO: GEMINI_API_KEY가 성공적으로 로드되었습니다.");
}

// !!! Gemini API 설정
const GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025"; 
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${API_KEY}`;

console.log(`INFO: AI 모델을 Gemini API (${GEMINI_MODEL})로 설정했습니다.`);

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
        return res.status(500).json({ reply: "Gemini API 키가 없어 AI 기능이 작동하지 않아요." });
    }

    // Gemini API 요청 페이로드
    const systemInstruction = `당신은 강아지 하네스 판매 보조 AI입니다. 고객의 질문에 친절하고 간결하며, 정확한 한국어로 답변하세요. **절대로 우리 상점에 없는 특정 브랜드나 제품명을 언급하지 마세요. 오직 우리 상점에서 추천하는 상품에 대한 일반적인 이점만 설명하세요.** 답변은 두 문장을 넘기지 않도록 합니다. 답변 후에는 반드시 고객의 질문에 맞는 하네스를 추천하는 멘트를 자연스럽게 추가해야 합니다.`;
    
    const payload = {
        contents: [{ role: "user", parts: [{ text: userMessage }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024
        }
    };
    
    // API 키는 URL 쿼리 파라미터로 전송됩니다.
    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    // API 응답 상태 확인
    if (!response.ok) {
        const errorDetails = await response.text();
        console.error(`Gemini API 호출 실패: Status ${response.status}. Details: ${errorDetails.substring(0, 100)}`);
        
        // 오류 상태를 클라이언트에 전달
        return res.status(response.status).json({ reply: `AI 응답 실패. 상태 코드: ${response.status}. Render 로그를 확인해 주세요. (Gemini API)` });
    }

    const result = await response.json();
    let replyText = "죄송해요, 응답을 가져올 수 없어요 🐾";

    // 응답 구조에서 텍스트 추출
    const candidate = result.candidates?.[0];
    if (candidate && candidate.content?.parts?.[0]?.text) {
        replyText = candidate.content.parts[0].text.trim();
    } else {
        console.error("Gemini 응답 구조 이상 또는 응답 텍스트 없음:", result);
    }


    // 추천 로직은 동일하게 유지
    let selected = null;
    if (userMessage.includes("작은") || userMessage.includes("소형") || userMessage.includes("경량")) selected = products[0];
    else if (userMessage.includes("고급") || userMessage.includes("예쁜") || userMessage.includes("가죽")) selected = products[1];
    else if (userMessage.includes("튼튼") || userMessage.includes("산책") || userMessage.includes("오래")) selected = products[2];
    else if (Math.random() > 0.6) selected = products[Math.floor(Math.random() * products.length)];

    // 최종적으로 답변 텍스트와 추천 상품 정보를 클라이언트에 보냅니다.
    res.json({ reply: replyText, product: selected });
  } catch (err) {
    console.error("서버 내부에서 예상치 못한 오류 발생:", err);
    res.status(500).json({ reply: "서버 오류가 발생했어요 🐾 Render 로그를 확인해 주세요." });
  }
});

// 포트
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`✅ 서버 실행 중: http://0.0.0.0:${PORT} (Gemini API 사용: ${GEMINI_MODEL})`);
});
