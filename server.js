<!-- Tailwind CSS CDN 로드 (스타일링을 위해 필요) -->
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
    
<style>
    /* 기본 폰트 설정 (Cafe24 템플릿의 body 폰트와 충돌을 최소화) */
    #poopky-chatbot-widget * {
        font-family: 'Inter', sans-serif;
    }
    /* 위젯 전체 영역 (모바일에서 전체 화면을 차지하도록 설정) */
    #poopky-chatbot-widget {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999; /* 다른 요소 위에 뜨도록 높은 Z-Index 설정 */
    }
    /* 채팅 컨테이너 (데스크톱 사이즈) */
    #chat-container {
        width: 380px;
        height: 600px;
        margin-bottom: 12px;
    }
    /* 모바일 최적화: 화면 너비가 640px 이하일 때 */
    @media (max-width: 640px) {
        #chat-container {
            width: calc(100vw - 40px); /* 화면 너비에 맞춤 */
            height: 80vh; /* 높이도 모바일에 맞춤 */
            right: 20px;
            bottom: 20px;
            left: 20px;
            position: fixed; /* 모바일에서 위젯 위치 고정 */
            margin-bottom: 0;
        }
    }
    /* 커스텀 스크롤바 스타일링 */
    #chat-window::-webkit-scrollbar {
        width: 8px;
    }
    #chat-window::-webkit-scrollbar-thumb {
        background-color: #cbd5e1; /* slate-300 */
        border-radius: 4px;
    }
    #chat-window::-webkit-scrollbar-track {
        background: #f1f5f9; /* slate-100 */
    }
</style>

<!-- POOPKY 플로팅 챗봇 위젯 컨테이너 -->
<div id="poopky-chatbot-widget">

    <!-- 메인 채팅 창 (초기에는 숨김) -->
    <div id="chat-container" class="bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col hidden">
        
        <!-- 헤더 -->
        <div class="p-4 bg-indigo-600 text-white flex justify-between items-center shadow-md">
            <h1 class="text-xl font-bold flex items-center">
                <!-- MessageCircle 아이콘 (인라인 SVG) -->
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
                    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>
                </svg>
                POOPKY AI 추천
            </h1>
            <!-- 닫기 버튼 -->
            <button onclick="toggleChat()" class="text-white hover:text-indigo-200 transition">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        </div>

        <!-- 채팅 메시지 표시 영역 -->
        <div id="chat-window" class="flex-1 overflow-y-auto space-y-4 p-4">
            <!-- 초기 메시지 -->
            <div class="flex justify-start">
                <div class="bg-gray-100 text-gray-800 p-3 rounded-xl rounded-bl-none shadow-sm max-w-[85%]">
                    <p class="font-semibold text-indigo-600">POOPKY AI:</p>
                    <p>안녕하세요! 🐾 강아지의 품종, 크기, 활동량 또는 원하는 스타일(가죽, 튼튼함 등)을 알려주시면 가장 적합한 하네스를 추천해 드릴게요!</p>
                </div>
            </div>
            <!-- 메시지 로딩 인디케이터 (초기에는 숨김) -->
            <div id="loading-indicator" class="hidden flex justify-start">
                <div class="bg-gray-200 p-3 rounded-xl rounded-bl-none shadow-sm max-w-xs">
                    <div class="flex items-center space-x-2">
                        <div class="h-3 w-3 bg-indigo-500 rounded-full animate-bounce delay-75"></div>
                        <div class="h-3 w-3 bg-indigo-500 rounded-full animate-bounce delay-150"></div>
                        <div class="h-3 w-3 bg-indigo-500 rounded-full animate-bounce delay-300"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 입력 영역 -->
        <div class="p-4 border-t border-gray-100">
            <div class="flex space-x-2">
                <input type="text" id="user-input" placeholder="원하는 하네스 특징을 입력하세요..."
                       class="flex-1 p-3 border border-gray-300 rounded-full text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                       onkeydown="if(event.key === 'Enter') document.getElementById('send-button').click()">
                <button id="send-button" onclick="sendMessage()"
                        class="p-3 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition duration-150 active:scale-95 disabled:bg-indigo-300">
                        <!-- Send 아이콘 (인라인 SVG) -->
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </button>
            </div>
        </div>

        <!-- 추천 상품 카드 (채팅창 내부 하단에 배치) -->
        <div id="recommendation-card" class="bg-white p-3 border-t border-gray-100 hidden">
            <div id="product-display" class="w-full text-center p-3 rounded-lg border border-indigo-200 bg-indigo-50 shadow-inner">
                <p id="product-status" class="text-sm font-medium text-gray-600 mb-2">AI가 분석 후 맞춤 상품을 추천합니다.</p>
                
                <img id="product-image" src="" alt="추천 상품 이미지" 
                     class="w-20 h-20 mx-auto rounded-lg object-cover shadow-md mb-2 hidden"
                     onerror="this.onerror=null; this.src='https://placehold.co/80x80/e0e7ff/6366f1?text=NO%20IMG';">
                
                <h3 id="product-name" class="text-md font-bold text-gray-800 truncate mb-1 hidden">상품명</h3>
                <p id="product-price" class="text-sm text-pink-600 font-bold mb-3 hidden">₩00,000</p>
                
                <a id="product-link" href="#" target="_blank"
                   class="w-full inline-block px-3 py-1 text-sm bg-pink-500 text-white font-semibold rounded-full hover:bg-pink-600 transition duration-150 shadow-md hidden">
                    <span class="mr-1 text-xs">🛒</span> 상세 보기
                </a>
            </div>
        </div>
        
    </div>

    <!-- 플로팅 토글 버튼 -->
    <button id="chat-toggle-button" onclick="toggleChat()"
            class="w-14 h-14 rounded-full bg-indigo-600 text-white shadow-xl hover:bg-indigo-700 transition duration-300 flex items-center justify-center active:scale-95">
        <!-- MessageCircle 아이콘 (인라인 SVG) -->
        <svg id="chat-icon" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>
        </svg>
    </button>

</div>

<script>
    // CHAT_URL 변수에는 Render 서버의 실제 전체 URL과 '/chat' 엔드포인트를 포함해야 합니다!
    const CHAT_URL = 'https://ai-poopky.onrender.com/chat'; 
    const chatContainer = document.getElementById('chat-container');
    const chatWindow = document.getElementById('chat-window');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const loadingIndicator = document.getElementById('loading-indicator');
    const recommendationCard = document.getElementById('recommendation-card');
    
    const productStatus = document.getElementById('product-status');
    const productImage = document.getElementById('product-image');
    const productName = document.getElementById('product-name');
    const productPrice = document.getElementById('product-price');
    const productLink = document.getElementById('product-link');
    const chatIcon = document.getElementById('chat-icon');
    const toggleButton = document.getElementById('chat-toggle-button');

    // 채팅창 열기/닫기 토글 함수
    function toggleChat() {
        chatContainer.classList.toggle('hidden');
        if (!chatContainer.classList.contains('hidden')) {
            // 열릴 때, 아이콘을 X로 바꾸고 스크롤 이동
            toggleButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
            scrollToBottom();
        } else {
            // 닫힐 때, 아이콘을 채팅으로 복구
            toggleButton.innerHTML = `<svg id="chat-icon" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>`;
        }
    }

    // 스크롤을 맨 아래로 이동
    function scrollToBottom() {
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    // 메시지를 채팅창에 추가하는 함수
    function addMessage(sender, text) {
        const isUser = sender === 'user';
        const alignment = isUser ? 'justify-end' : 'justify-start';
        const bubbleClass = isUser ? 'bg-indigo-500 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none';
        const senderName = isUser ? '나' : 'POOPKY AI';

        const messageHtml = `
            <div class="flex ${alignment}">
                <div class="p-3 rounded-xl shadow-sm max-w-[85%] ${bubbleClass}">
                    ${!isUser ? `<p class="font-semibold text-indigo-600">${senderName}:</p>` : ''}
                    <p>${text.replace(/\n/g, '<br>')}</p>
                </div>
            </div>
        `;
        chatWindow.insertAdjacentHTML('beforeend', messageHtml);
        scrollToBottom();
    }

    // 추천 상품 카드 업데이트
    function updateRecommendationCard(productData) {
        // 모든 요소를 숨김
        [productImage, productName, productPrice, productLink].forEach(el => el.classList.add('hidden'));
        recommendationCard.classList.add('hidden');
        productStatus.classList.remove('hidden');

        if (productData && productData.image) {
            // 상품 정보 업데이트 및 표시
            productImage.src = productData.image;
            productName.textContent = productData.name;
            // 가격 형식화: 쉼표를 사용하여 보기 쉽게 만듭니다.
            productPrice.textContent = `₩${productData.price.replace(/[^0-9]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`; 
            productLink.href = productData.link;
            productStatus.textContent = "AI가 추천한 상품입니다.";

            // 요소 표시
            recommendationCard.classList.remove('hidden');
            productImage.classList.remove('hidden');
            productName.classList.remove('hidden');
            productPrice.classList.remove('hidden');
            productLink.classList.remove('hidden');
        } else {
            productStatus.textContent = "AI가 추천 상품을 찾는 데 실패했어요. 다시 질문해 주시겠어요?";
        }
    }

    async function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;

        // 사용자 메시지 추가
        addMessage('user', message);
        userInput.value = '';
        
        // 전송 비활성화 및 로딩 표시
        sendButton.disabled = true;
        loadingIndicator.classList.remove('hidden');
        scrollToBottom();

        try {
            // CHAT_URL을 사용 (Render URL로 변경해야 함)
            const response = await fetch(CHAT_URL, {
                method: 'POST',
                mode: 'cors', // CORS 모드 추가
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: message })
            });

            if (!response.ok) {
                // HTTP 오류 응답(4xx, 5xx) 처리
                const error = await response.json();
                addMessage('ai', `죄송해요, 서버 응답 오류가 발생했어요. 상태코드: ${response.status}. 서버 로그를 확인해 주세요.`);
                return;
            }

            const data = await response.json();
            
            // AI 답변 추가
            addMessage('ai', data.reply);

            // 추천 상품 카드 업데이트
            updateRecommendationCard(data.product);

        } catch (error) {
            console.error('Fetch error: CORS 또는 네트워크 문제일 가능성이 높습니다.', error);
            // CORS/네트워크 실패 시 사용자에게 서버 설정을 확인하도록 안내
            addMessage('ai', '⚠️ **네트워크 연결 실패 (CORS 문제 예상)**: Render 서버의 **CORS 설정**을 확인해 주세요. 브라우저 개발자 콘솔(F12)에 빨간색 오류가 있는지 확인하면 문제 해결에 도움이 됩니다.');
        } finally {
            // 전송 활성화 및 로딩 숨김
            sendButton.disabled = false;
            loadingIndicator.classList.add('hidden');
            scrollToBottom();
        }
    }
</script>
