// --- Node.js Express Server for AI Product Recommendation ---
// 이 파일은 Node.js 서버 환경에서 실행되어야 하며, HTML 코드가 포함되어서는 안 됩니다.

// Load necessary modules
const express = require('express');
const cors = require('cors'); // CORS 미들웨어 (네트워크 연결 오류 수정에 필수)
const fetch = require('node-fetch'); // Server-side API 호출용

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
// **CORS Fix:** 모든 Originからの 요청을 허용합니다 (테스트 목적).
// NOTE: 실제 운영 환경에서는 보안을 위해 `origin: 'https://[당신의_쇼핑몰_도메인].com'` 와 같이 특정 도메인만 허용하도록 변경해야 합니다.
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

    // Gemini 모델을 위한 시스템 지침
    const systemInstruction = `당신은 POOPKY 쇼핑몰의 전문 상품 추천 AI 챗봇입니다.
    사용자 문의에 친절하고 상세하게 답변하세요.
    항상 사용자 메시지를 분석하여 제공된 상품 목록 중 가장 적합한 상품 1개를 **반드시** 추천해야 합니다.
    추천 결과는 반드시 다음과 같은 JSON 형식으로 출력해야 합니다.
    {
      "reply": "사용자에게 보여줄 AI의 친절한 답변 (markdown 포맷 사용 가능)",
      "product_id": "가장 적합한 상품의 ID (숫자)"
    }
    
    ## 상품 목록:
    ${productListString}
    
    만약 질문이 상품 추천과 관련이 없더라도, 답변 후 "하지만 강아지 하네스에 대해 궁금한 점이 있다면 언제든 물어봐 주세요!"와 같이 상품 추천으로 유도하는 문구를 추가하세요.
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
                throw new Error("Invalid response format from Gemini API.");
            }
            
            geminiResponse = JSON.parse(jsonString);
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

    if (!geminiResponse || !geminiResponse.product_id) {
        return res.status(500).json({ reply: 'AI가 추천 결과를 생성하지 못했습니다. 질문을 구체적으로 해 주세요.', error: 'No product ID in response.' });
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
