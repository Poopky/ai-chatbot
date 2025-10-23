// --- Node.js Express Server for AI Product Recommendation (ES Module) ---
// Node.js ESM 환경에 맞춰 require()를 import 구문으로 변경했습니다.

// Load necessary modules using ES Module syntax
import express from 'express';
import cors from 'cors'; // CORS 미들웨어 (네트워크 연결 오류 수정에 필수)
// Note: Node.js v22.16.0은 전역 fetch를 지원하므로, 'node-fetch' import를 제거했습니다.

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
// **CORS Fix:** 모든 Originからの 요청을 허용합니다 (테스트 목적).
app.use(cors()); 
app.use(express.json()); // JSON 요청 본문 파싱

// 실제 상품 목록 (사용자님의 상품 목록을 기반으로 재구성되었습니다)
const products = [
    { id: 1, name: '프리미엄 가죽 하네스', price: '72,000', image: 'https://placehold.co/100x100/A0522D/ffffff?text=Leather', link: 'https://poopky-mall.com/product/1' },
    { id: 2, name: '반사 스트라이프 산책 하네스', price: '45,000', image: 'https://placehold.co/100x100/0000FF/ffffff?text=Reflective', link: 'https://poopky-mall.com/product/2' },
    { id: 3, name: '초경량 소프트 에어 하네스', price: '32,000', image: 'https://placehold.co/100x100/87CEEB/ffffff?text=AirMesh', link: 'https://poopky-mall.com/product/3' },
    { id: 4, name: '대형견용 튼튼한 택티컬 하네스', price: '98,000', image: 'https://placehold.co/100x100/4B0082/ffffff?text=Tactical', link: 'https://poopky-mall.com/product/4' },
    { id: 5, name: '맞춤형 이름 각인 하네스', price: '55,000', image: 'https://placehold.co/100x100/FFD700/000000?text=Custom', link: 'https://poopky-mall.com/product/5' },
];

// LLM을 위한 상품 목록 문자열
const productListString = products.map(p => 
    `ID: ${p.id}, 이름: ${p.name}, 가격: ${p.price}, 특징: [${p.name.includes('가죽') ? '고급스러운 가죽 소재' : p.name.includes('반사') ? '야간 산책용 반사 기능' : p.name.includes('에어') ? '가볍고 통풍 잘됨' : p.name.includes('택티컬') ? '견고하고 튼튼함' : '일반적인 소재'}], Link: ${p.link}`
).join('\n');

// API Key 및 URL 설정
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`;

// --- AI Chat Endpoint ---
app.post('/chat', async (req, res) => {
    const userMessage = req.body.message;
    if (!userMessage) {
        return res.status(400).json({ error: 'Message is required.' });
    }

    // Gemini 모델을 위한 시스템 지침 (JSON 준수를 강력하게 요청)
    const systemInstruction = `당신은 POOPKY 쇼핑몰의 전문 상품 추천 AI 챗봇입니다.
    당신의 유일한 목표는 사용자의 질문을 분석하여 제공된 상품 목록 중 가장 적합한 상품 1개를 고르고, 그 결과를 **반드시** 지정된 JSON Schema에 맞춰 출력하는 것입니다.
    **절대로** JSON 외의 다른 텍스트(설명, 마크다운 코드 블록 마커 등)를 추가하지 마세요. 오직 유효한 JSON 객체만 출력해야 합니다.
    **"reply" 필드**에는 사용자에게 보여줄 친절하고 상세한 답변을 작성하세요.
    **"product_id" 필드**에는 추천할 상품의 ID(숫자)를 **반드시** 포함해야 합니다.

    ## 상품 목록:
    ${productListString}

    만약 질문이 상품 추천과 관련 없더라도, "product_id"는 목록에서 아무 상품 ID(예: 1)를 선택하고 "reply"에 "하네스에 대해 궁금한 점이 있다면 언제든 물어봐 주세요!"와 같이 추천을 유도하는 문구를 추가하세요.
    절대 상품 목록이나 ID를 사용자에게 직접 노출하지 마세요.`;

    const userQuery = `사용자 질문: ${userMessage}`;

    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: "OBJECT",
                properties: {
                    "reply": { "type": "STRING", "description": "The friendly and detailed response to the user." },
                    "product_id": { "type": "NUMBER", "description": "The ID of the most relevant product from the list." }
                }
            },
        },
    };

    let attempts = 0;
    const maxAttempts = 3;
    let geminiResponse;

    while (attempts < maxAttempts) {
        try {
            // fetch는 Node v22의 전역 API를 사용합니다.
            const apiResponse = await fetch(GEMINI_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!apiResponse.ok) {
                // API 키 오류 등을 포함한 HTTP 오류 처리
                throw new Error(`Gemini API HTTP error! status: ${apiResponse.status}`);
            }

            const apiData = await apiResponse.json();
            
            // 응답에서 JSON 문자열 추출 및 파싱
            const jsonString = apiData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!jsonString) {
                console.error("Gemini API returned data but no parsable text content:", apiData);
                throw new Error("Invalid response structure from Gemini API (No text content).");
            }
            
            try {
                geminiResponse = JSON.parse(jsonString);
            } catch (parseError) {
                // JSON 파싱 실패 시 원본 문자열을 콘솔에 기록
                console.error("JSON Parsing failed. Raw string:", jsonString);
                throw new Error("Failed to parse AI response as JSON.");
            }

            // 디버깅: 파싱된 응답 확인
            console.log("Gemini Parsed Response:", geminiResponse);

            break; // 성공적으로 응답을 받은 경우
        } catch (error) {
            attempts++;
            console.error(`Attempt ${attempts} failed: ${error.message}`);
            if (attempts >= maxAttempts) {
                return res.status(500).json({ reply: 'AI 서버와 통신 중 문제가 발생했습니다. API 키나 서버 로그를 확인해 주세요.', error: error.message });
            }
            // 지수 백오프 적용
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts)));
        }
    }

    // 최종 확인: product_id가 숫자인지 확인
    if (!geminiResponse || typeof geminiResponse.product_id !== 'number') {
        // AI가 product_id를 누락했거나, 문자열 등으로 잘못 넣었을 경우
        console.error("AI failed to return mandatory product_id (number). Final response:", geminiResponse);
        return res.status(500).json({ reply: 'AI가 추천 결과를 생성하지 못했습니다. 질문을 구체적으로 해 주세요.', error: 'No product ID (number) in final response.' });
    }

    // 추천 상품 정보 찾기
    const recommendedProduct = products.find(p => p.id === geminiResponse.product_id);
    
    // 최종 응답 객체 구성
    const finalResponse = {
        reply: geminiResponse.reply,
        product: recommendedProduct ? recommendedProduct : null,
    };
    
    res.json(finalResponse);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
