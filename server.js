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

// !!! Mistral API 키를 사용합니다.
const API_KEY = process.env.MISTRAL_API_KEY; 

// 디버깅: API 키 로드 상태 확인
if (!API_KEY) {
    console.error("FATAL ERROR: MISTRAL_API_KEY가 환경 변수에 설정되어 있지 않습니다. AI 기능이 작동하지 않습니다.");
} else {
    console.log("INFO: MISTRAL_API_KEY가 성공적으로 로드되었습니다.");
}

// !!! Mistral AI API 설정 (모델을 mistral-tiny에서 mistral-small로 변경하여 품질 개선 시도)
const MISTRAL_MODEL = "mistral-small-latest"; 
const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";

console.log(`INFO: AI 모델을 Mistral AI API (${MISTRAL_MODEL})로 설정했습니다.`);

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
        return res.status(500).json({ reply: "Mistral API 키가 없어 AI 기능이 작동하지 않아요." });
    }

    // Mistral은 OpenAI의 Chat Completion 형식을 따릅니다.
    const systemInstruction = `당신은 강아지 하네스 판매 보조 AI입니다. 고객의 질문에 친절하고 간결하며, 정확한 한국어로 답변하세요. 답변은 두 문장을 넘기지 않도록 합니다. 답변 후에는 반드시 하네스를 추천하는 멘트를 자연스럽게 추가해야 합니다.`;
    
    // Mistral API 요청 페이로드
    const payload = {
        model: MISTRAL_MODEL,
        messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 1024 // 응답이 잘리지 않도록 토큰 제한을 크게 늘림
    };
    
    const response = await fetch(MISTRAL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
         // API 키를 Authorization 헤더로 전송
         "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    // API 응답 상태 확인
    if (!response.ok) {
        const errorDetails = await response.text();
        console.error(`Mistral API 호출 실패: Status ${response.status}. Details: ${errorDetails.substring(0, 100)}`);
        
        // 오류 상태를 클라이언트에 전달
        return res.status(response.status).json({ reply: `AI 응답 실패. 상태 코드: ${response.status}. Render 로그를 확인해 주세요. (Mistral API)` });
    }

    const result = await response.json();
    let replyText = "죄송해요, 응답을 가져올 수 없어요 🐾";

    // 응답 구조에서 텍스트 추출
    const choice = result.choices?.[0];
    if (choice && choice.message?.content) {
        replyText = choice.message.content.trim();
    } else {
        console.error("Mistral 응답 구조 이상 또는 응답 텍스트 없음:", result);
    }

    // 추천 로직은 동일하게 유지
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
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`✅ 서버 실행 중: http://0.0.0.0:${PORT} (Mistral API 사용: ${MISTRAL_MODEL})`);
});
