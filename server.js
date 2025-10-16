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

// NOTE: Hugging Face API 키를 사용하도록 변수명을 변경합니다.
const API_KEY = process.env.HUGGINGFACE_API_KEY; 

// 디버깅: API 키 로드 상태 확인
if (!API_KEY) {
    console.error("FATAL ERROR: HUGGINGFACE_API_KEY가 환경 변수에 설정되어 있지 않습니다.");
} else {
    console.log("INFO: HUGGINGFACE_API_KEY가 성공적으로 로드되었습니다.");
}

// 사용할 Hugging Face 모델 및 엔드포인트 설정
const HF_MODEL = "google/gemma-2b-it";
const HF_API_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`;

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
        return res.status(500).json({ reply: "Hugging Face API 키가 없어 AI 기능이 작동하지 않아요." });
    }

    // Hugging Face Inference API는 단순 텍스트 입력을 사용합니다.
    // 모델의 역할을 명확히 하기 위해 사용자 메시지 앞에 페르소나 지침을 추가합니다.
    const prompt = `당신은 강아지 하네스 판매 보조 AI입니다. 고객의 질문에 친절하고 상세하게 답변하세요. 답변 후에는 반드시 하네스를 추천하는 멘트를 자연스럽게 추가해야 합니다.
    
    고객 질문: ${userMessage}`;
    
    const response = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Authorization 헤더에 Bearer 토큰을 사용합니다.
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        inputs: prompt,
         parameters: {
            // 텍스트 생성 길이와 다양성 설정
            max_new_tokens: 256,
            temperature: 0.7,
            // 모델이 처음부터 다시 생성하지 않도록 처리
            return_full_text: false
         }
      })
    });

    // Hugging Face API 응답 상태 확인
    if (!response.ok) {
        const errorDetails = await response.text();
        console.error(`Hugging Face API 호출 실패: Status ${response.status}. Details: ${errorDetails.substring(0, 100)}`);
        // 429 오류는 Hugging Face에서도 발생할 수 있습니다.
        return res.status(response.status).json({ reply: `AI 응답 실패. 상태 코드: ${response.status}. Render 로그를 확인해 주세요. (Hugging Face)` });
    }

    const data = await response.json();
    let replyText = "죄송해요, 응답을 가져올 수 없어요 🐾";

    // Hugging Face 응답 구조는 보통 배열 [ { generated_text: "..." } ] 형태입니다.
    if (Array.isArray(data) && data.length > 0 && data[0].generated_text) {
      replyText = data[0].generated_text.trim();
    } else {
        console.error("Hugging Face 응답 구조 이상:", data); 
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
    console.log(`✅ 서버 실행 중: http://0.0.0.0:${PORT} (Hugging Face API 사용)`);
});
