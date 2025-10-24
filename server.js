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

console.log(`INFO: AI 모델을 Gemini API (${GEMINI_MODEL})로 설정했습니다. (이미지 생성 기능은 사용하지 않음)`);

// 하네스 상품 목록 (여기 있는 상품들 중에서만 추천이 이루어집니다.)
// **이 상품 정보는 Gemini 모델이 추천 대상을 결정하는 데 사용됩니다.**
const products = [
    {
      id: "Harness_1",
      name: "POOPKY Harness 1",
      image: "https://ecimg.cafe24img.com/pg1527b59225322051/poopky1101/web/product/extra/big/20250626/377053af5e3ba70af5090c8d4415b6d2.png",
      price: "29,000",
      link: "https://poopky1101.cafe24.com/product/poopky-harness-1/13/category/55/display/1/",
      description: "A soft, lightweight dog harness with breathable mesh, simple and comfortable for daily walks. Best for small and toy breeds."
    },
    {
      id: "Harness_2",
      name: "POOPKY Harness 2",
      image: "https://ecimg.cafe24img.com/pg1527b59225322051/poopky1101/web/product/extra/big/20250626/93f2be00aee163ae83e07d91007953e6.png",
      price: "29,000",
      link: "https://poopky1101.cafe24.com/product/poopky-harness-2/14/category/55/display/1/",
      description: "A luxurious leather dog harness and leash set, dark brown color, with high-quality metal hardware. Stylish and durable for medium breeds."
    },
    {
      id: "Harness_3",
      name: "POOPKY Harness 3",
      image: "https://ecimg.cafe24img.com/pg1527b59225322051/poopky1101/web/product/extra/big/20250626/11884ae57bba39a72ca6cda5285bc072.png",
      price: "29,000",
      link: "https://poopky1101.cafe24.com/product/poopky-harness-3/36/category/55/display/1/",
      description: "A durable, rugged dog harness for hiking and outdoor activities, with reflective material and strong nylon straps. Excellent for large and active dogs."
    },
    {
      id: "Harness_4",
      name: "POOPKY Harness 4",
      image: "https://ecimg.cafe24img.com/pg1527b59225322051/poopky1101/web/product/extra/big/20250626/9f14d901f586118665ab764838ef0615.png",
      price: "29,000",
      link: "https://poopky1101.cafe24.com/product/poopky-harness-4/43/category/55/display/1/",
      description: "Similar to Harness 3, focusing on ruggedness and security, great for escape artists or high-pulling dogs."
    },
    {
      id: "Harness_5",
      name: "POOPKY Harness 5",
      image: "https://ecimg.cafe24img.com/pg1527b59225322051/poopky1101/web/product/extra/big/20250626/79eea1dc2cd88ef5ffa3cb03907dbbe7.png",
      price: "29,000",
      link: "https://poopky1101.cafe24.com/product/poopky-harness-5/44/category/55/display/1/",
      description: "A comfortable, everyday step-in harness with easy clips. Ideal for calm small to medium dogs."
    },
    {
      id: "Harness_6",
      name: "POOPKY Harness 6",
      image: "https://ecimg.cafe24img.com/pg1527b59225322051/poopky1101/web/product/extra/big/20250626/4065b16c017478d411afeea1402c5d8f.png",
      price: "29,000",
      link: "https://poopky1101.cafe24.com/product/poopky-harness-6/45/category/55/display/1/",
      description: "A vibrant, colorful harness focusing on visibility and style for trendy dogs."
    },
    {
      id: "Harness_7",
      name: "POOPKY Harness 7",
      image: "https://ecimg.cafe24img.com/pg1527b59225322051/poopky1101/web/product/big/20250707/013f3d4776784472c69876f36a30633e.png",
      price: "29,000",
      link: "https://poopky1101.cafe24.com/product/poopky-harness-7/48/category/55/display/1/",
      description: "A no-pull front-clip harness designed to gently discourage pulling during walks. Best for strong pullers."
    },
    {
      id: "Harness_8",
      name: "POOPKY Harness 8",
      image: "https://ecimg.cafe24img.com/pg1527b59225322051/poopky1101/web/product/big/20250707/7afab427395149c562d4ede5ca202fb7.png",
      price: "29,000",
      link: "https://poopky1101.cafe24.com/product/poopky-harness-8/49/category/55/display/1/",
      description: "A wide-chest harness offering maximum comfort and pressure distribution. Suitable for older dogs or those with neck issues."
    },
    {
      id: "Harness_9",
      name: "POOPKY Harness 9",
      image: "https://ecimg.cafe24img.com/pg1527b59225322051/poopky1101/web/product/extra/big/20250707/c465822b338843ffba1fc9909f08fb92.png",
      price: "29,000",
      link: "https://poopky1101.cafe24.com/product/poopky-harness-9/50/category/55/display/1/",
      description: "A multi-use adventure harness with a handle on the back for control. Perfect for outdoor excursions."
    },
    {
      id: "Harness_10",
      name: "POOPKY Harness 10",
      image: "https://ecimg.cafe24img.com/pg1527b59225322051/poopky1101/web/product/big/20250707/2c13ea386a26885eeb18ca5e895d4366.png",
      price: "29,000",
      link: "https://poopky1101.cafe24.com/product/poopky-harness-10/51/category/55/display/1/",
      description: "A high-visibility harness with reflective strips and bright colors for night safety."
    },
    {
      id: "Harness_11",
      name: "POOPKY Harness 11",
      image: "https://ecimg.cafe24img.com/pg1527b59225322051/poopky1101/web/product/big/20250707/9e3e2573aee1c9eb4b2cd32458f2669b.png",
      price: "29,000",
      link: "https://poopky1101.cafe24.com/product/poopky-harness-11/52/category/55/display/1/",
      description: "An adjustable, all-weather harness made from quick-drying material. Good for all seasons."
    },
    {
      id: "Harness_12",
      name: "POOPKY Harness 12",
      image: "https://ecimg.cafe24img.com/pg1527b59225322051/poopky1101/web/product/big/20250707/3d1638d679655f4dda34c2bc63de0988.png",
      price: "29,000",
      link: "https://poopky1101.cafe24.com/product/poopky-harness-12/53/category/55/display/1/",
      description: "A simple, classic design harness focused on neck comfort and ease of put-on/take-off."
    },
    {
      id: "Harness_13",
      name: "POOPKY Harness 13",
      image: "https://ecimg.cafe24img.com/pg1527b59225322051/poopky1101/web/product/big/20250707/1abb54dc04754684cb63d87bb650cc88.png",
      price: "29,000",
      link: "https://poopky1101.cafe24.com/product/poopky-harness-13/54/category/55/display/1/",
      description: "A heavy-duty, tactical style harness with MOLLE webbing and multiple attachment points. For working or service dogs."
    },
];

// ID를 기반으로 상품을 찾는 헬퍼 함수
const findProductById = (id) => products.find(p => p.id === id);

// --- 헬스 체크 엔드포인트 추가 ---
app.get("/", (req, res) => {
    // 서버가 정상 작동하는지 확인하기 위한 간단한 응답을 보냅니다.
    res.json({
        status: "OK",
        message: "POOPKY Gemini Chatbot Server is running successfully.",
        model: GEMINI_MODEL,
        uptime: process.uptime() // 서버 실행 시간 (초)
    });
});
// -----------------------------


// 채팅 API
app.post("/chat", async (req, res) => {
    const userMessage = req.body.message;
    let selectedProduct = null;
    
    try {
        if (!API_KEY) {
            return res.status(500).json({ reply: "Gemini API 키가 없어 AI 기능이 작동하지 않아요." });
        }

        // --- 1. Gemini에게 상품 추천 및 답변 생성 요청 ---

        // Gemini에게 상품 목록을 전달하여 적합한 상품 ID를 선택하도록 요청합니다.
        const productListForPrompt = products.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description
        }));
        
        // Gemini에게 JSON 응답을 요청하기 위한 시스템 지침 및 스키마 정의
        const systemInstruction = `
            당신은 강아지 하네스 판매 보조 AI입니다.
            고객의 질문에 친절하고 간결하며, 정확한 한국어로 답변해야 합니다.
            **절대로 우리 상점에 없는 특정 브랜드나 제품명을 언급하지 마세요. 오직 우리 상점에서 추천하는 상품에 대한 일반적인 이점만 설명하세요.**
            답변은 두 문장을 넘기지 않도록 합니다.

            **임무:**
            1. 고객의 질문(query)을 분석하여 아래 제공된 JSON 형식의 상품 목록 중 가장 적합한 상품 1개를 선택하세요.
            2. 응답은 JSON 형식만 사용해야 하며, 'recommendation_id' 필드에 선택된 상품의 ID를, 'reply_text' 필드에 고객에게 보낼 챗봇 답변을 포함해야 합니다.

            **사용 가능한 상품 목록:**
            ${JSON.stringify(productListForPrompt, null, 2)}
        `;

        const responseSchema = {
            type: "OBJECT",
            properties: {
                reply_text: {
                    type: "STRING",
                    description: "고객의 질문에 대한 챗봇의 간결한 한국어 답변입니다. 두 문장을 넘기지 않아야 합니다. 답변 후에는 반드시 고객의 질문에 맞는 하네스를 추천하는 멘트를 자연스럽게 추가해야 합니다."
                },
                recommendation_id: {
                    type: "STRING",
                    description: "고객의 질문에 가장 적합한 상품 ID (예: 'Harness_1')입니다. 상품 목록에 없는 ID를 반환해서는 안 됩니다."
                }
            },
            required: ["reply_text", "recommendation_id"]
        };


        const payload = {
            contents: [{ role: "user", parts: [{ text: userMessage }] }],
            systemInstruction: { parts: [{ text: systemInstruction }] },
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.7,
                maxOutputTokens: 1024
            }
        };
        
        const geminiResponse = await fetch(GEMINI_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!geminiResponse.ok) {
            // Gemini 응답 실패 처리
            const errorDetails = await geminiResponse.text();
            console.error(`Gemini API 호출 실패: Status ${geminiResponse.status}. Details: ${errorDetails.substring(0, 100)}`);
            return res.status(geminiResponse.status).json({ reply: `AI 응답 실패. 상태 코드: ${geminiResponse.status}. (Gemini API)` });
        }

        const geminiResult = await geminiResponse.json();
        let replyText = "죄송해요, 응답을 가져올 수 없어요 🐾";
        let recommendationId = null;
        
        const candidate = geminiResult.candidates?.[0];
        
        if (candidate && candidate.content?.parts?.[0]?.text) {
            try {
                // Gemini가 반환한 JSON 문자열 파싱
                const jsonText = candidate.content.parts[0].text.trim();
                const parsedJson = JSON.parse(jsonText);
                
                replyText = parsedJson.reply_text || replyText;
                recommendationId = parsedJson.recommendation_id;
                
                // 파싱된 ID로 상품 정보 찾기
                if (recommendationId) {
                    selectedProduct = findProductById(recommendationId);
                }

            } catch (e) {
                // JSON 파싱 실패 또는 응답 구조 이상
                console.error("Gemini JSON 응답 파싱 실패:", e, "Raw Text:", candidate.content.parts[0].text);
                replyText = "AI가 유효하지 않은 형식으로 응답했어요. 다시 시도해 주세요.";
            }
        }
        
        // --- 2. 클라이언트 응답 구성 ---
        
        let imageUrl = null;
        if (selectedProduct) {
            console.log(`INFO: AI가 추천한 상품 ID: ${selectedProduct.id}`);
            imageUrl = selectedProduct.image;
        } else {
             // 만약 추천 상품을 찾지 못했다면, 랜덤으로 하나 추천
            selectedProduct = products[Math.floor(Math.random() * products.length)];
            console.log(`INFO: AI 추천 실패. 랜덤 상품 ID: ${selectedProduct.id} 추천.`);
        }

        // 최종적으로 답변 텍스트, 추천 상품 정보, 그리고 이미지 URL을 클라이언트에 보냅니다.
        res.json({ 
            reply: replyText, 
            product: selectedProduct, 
            imageUrl: selectedProduct ? selectedProduct.image : null 
        });

    } catch (err) {
        console.error("서버 내부에서 예상치 못한 오류 발생:", err);
        res.status(500).json({ reply: "서버 오류가 발생했어요 🐾 Render 로그를 확인해 주세요." });
    }
});

// 포트
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`✅ 서버 실행 중: http://0.0.0.0:${PORT} (Gemini API 사용: ${GEMINI_MODEL}, 이미지 URL 사용)`);
});
