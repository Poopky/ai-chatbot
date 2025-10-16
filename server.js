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

const API_KEY = process.env.HUGGINGFACE_API_KEY; 

// 디버깅: API 키 로드 상태 확인 (이전 단계에서 해결됨)
if (!API_KEY) {
    console.error("FATAL ERROR: HUGGINGFACE_API_KEY가 환경 변수에 설정되어 있지 않습니다.");
} else {
    console.log("INFO: HUGGINGFACE_API_KEY가 성공적으로 로드되었습니다.");
}

// !!! 변경: Mistral 7B 모델로 변경하여 엔드포인트 안정성을 높입니다.
const HF_MODEL = "mistralai/Mistral-7B-Instruct-v0.2";
const HF_API_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`;

console.log(`INFO: Hugging Face 모델을 ${HF_MODEL}로 설정했습니다.`);

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

    // Mistral 모델에 맞게 프롬프트 형식을 유지
    const prompt = `당신은 강아지 하네스 판매 보조 AI입니다. 고객의 질문에 친절하고 상세하게 답변하세요. 답변 후에는 반드시 하네스를 추천하는 멘트를 자연스럽게 추가해야 합니다.
    
    고객 질문: ${userMessage}`;
    
    const response = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        inputs: prompt,
         parameters: {
            max_new_tokens: 256,
            temperature: 0.7,
            return_full_text: false
         }
      })
    });

    // Hugging Face API 응답 상태 확인
    if (!response.ok) {
        const errorDetails = await response.text();
        console.error(`Hugging Face API 호출 실패: Status ${response.status}. Details: ${errorDetails.substring(0, 100)}`);
        
        // 404, 429, 500 등 오류 상태를 클라이언트에 전달
        return res.status(response.status).json({ reply: `AI 응답 실패. 상태 코드: ${response.status}. Render 로그를 확인해 주세요. (Hugging Face)` });
    }

    const data = await response.json();
    let replyText = "죄송해요, 응답을 가져올 수 없어요 🐾";

    if (Array.isArray(data) && data.length > 0 && data[0].generated_text) {
      replyText = data[0].generated_text.trim();
        // Mistral 모델이 프롬프트를 반복하는 경우, 불필요한 부분 제거
        if (replyText.startsWith(prompt)) {
            replyText = replyText.substring(prompt.length).trim();
        }
    } else {
        console.error("Hugging Face 응답 구조 이상:", data); 
        // 응답 본문에 에러 메시지가 있을 경우 출력 (Hugging Face 자주 발생)
        if(data && data.error) {
            replyText = `API에서 모델 에러가 발생했습니다: ${data.error}`;
        }
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
    console.log(`✅ 서버 실행 중: http://0.0.0.0:${PORT} (Hugging Face API 사용: ${HF_MODEL})`);
});
