// =========================================================================
// 6. REAL GEMINI API INTEGRATION & TASK EXECUTION
// =========================================================================

async function callGeminiAPI(payload) {
    const key = (appConfig.apiKey || '').trim();
    if (!key) {
        throw new Error('尚未設定 Gemini API Key，請點選右上角「⚙️ 設定」輸入 API Key。');
    }

    const model = (appConfig.geminiModel || 'gemini-2.5-flash').trim();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
    const delays = [1000, 2000];

    for (let attempt = 0; attempt <= delays.length; attempt++) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                let errDetail = `HTTP ${response.status}`;
                try {
                    const errJson = await response.json();
                    if (errJson?.error?.message) {
                        errDetail = errJson.error.message;
                    }
                } catch (_) {}
                throw new Error(errDetail);
            }
            return await response.json();
        } catch (err) {
            if (attempt === delays.length) throw err;
            await new Promise(r => setTimeout(r, delays[attempt]));
        }
    }
}

/**
 * Employee #1: Prompt Editor Task Execution
 * Edits the user's prompt and lists any missing parts in the Remarks (備註).
 */
async function submitPromptEditorTask() {
    const emp = employees.find(e => e.id === activeEmployeeId);
    if (!emp) return;

    const inputEl = document.getElementById('chatTaskInput');
    const userText = inputEl.value.trim();

    if (!userText) {
        showToast('⚠️ 請先輸入您想要編輯的提示詞！');
        return;
    }

    playRetroSound('click');
    inputEl.value = '';

    emp.messages.push({
        role: 'user',
        text: userText
    });

    emp.status = 'working';
    emp.progress = 20;
    emp.currentTask = `編輯提示詞：${userText.slice(0, 28)}${userText.length > 28 ? '...' : ''}`;
    renderOfficeEmployees();
    updateManagerIndicator();
    renderChatMessages(emp);

    const progressTimer = setInterval(() => {
        if (emp.status === 'working' && emp.progress < 90) {
            emp.progress += 10;
            renderOfficeEmployees();
            if (!document.getElementById('managerModal').classList.contains('hidden')) {
                renderManagerModalContent();
            }
        }
    }, 350);

    try {
        const systemPrompt = `${emp.systemPrompt}
請依照以下規則處理使用者輸入的提示詞：
1. 將使用者想打的提示詞進行結構化編輯與專業優化，放入 editedPrompt 欄位。
2. 仔細檢查使用者的提示詞是否有缺少的部分（例如：目標受眾、背景目的、語氣風格、輸出格式、字數限制、邊界條件或範例等），將發現缺少的部分逐條寫在 missingRemarks 陣列（即「備註」）中告訴使用者。若提示詞已經非常完整無缺漏，可在 missingRemarks 說明提示詞要素已齊全。`;

        // Build conversation history for context continuity
        const historyContents = emp.messages
            .filter((m, idx) => idx > 0) // skip initial welcome greeting
            .map(m => {
                if (m.role === 'user') {
                    return { role: 'user', parts: [{ text: m.text }] };
                }
                if (m.type === 'prompt_edit_result' && m.structuredData) {
                    return { role: 'model', parts: [{ text: JSON.stringify(m.structuredData) }] };
                }
                return { role: 'model', parts: [{ text: m.text || '' }] };
            });

        const payload = {
            contents: historyContents,
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: 'OBJECT',
                    properties: {
                        editedPrompt: { type: 'STRING' },
                        missingRemarks: {
                            type: 'ARRAY',
                            items: { type: 'STRING' }
                        }
                    },
                    propertyOrdering: ['editedPrompt', 'missingRemarks']
                }
            }
        };

        const result = await callGeminiAPI(payload);
        const rawJson = result?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawJson) {
            throw new Error('AI 未回傳有效內容');
        }
        const parsed = JSON.parse(rawJson);

        clearInterval(progressTimer);
        emp.status = 'completed';
        emp.progress = 100;
        emp.messages.push({
            role: 'assistant',
            type: 'prompt_edit_result',
            structuredData: parsed
        });

        const remarkCount = (parsed.missingRemarks || []).length;
        emp.latestOutputSummary = `已完成提示詞編輯，並於備註列出 ${remarkCount} 項缺少部分提醒。`;

        playRetroSound('complete');
        triggerFloatingStat(emp.id, '💡 提示詞完成!');
        showToast(`✅ 【${emp.name}】已完成提示詞編輯與備註！`);
    } catch (err) {
        clearInterval(progressTimer);
        emp.status = 'error';
        emp.progress = 50;
        emp.latestOutputSummary = `⚠️ 執行錯誤：${err.message}`;
        emp.messages.push({
            role: 'assistant',
            type: 'error',
            text: `⚠️ 報告老闆，執行任務時發生錯誤：\n${err.message}`
        });
        playRetroSound('error');
        showToast(`⚠️ 【${emp.name}】任務發生錯誤！`);
    }

    renderOfficeEmployees();
    updateManagerIndicator();
    if (!document.getElementById('managerModal').classList.contains('hidden')) {
        renderManagerModalContent();
    }
    if (activeEmployeeId === emp.id) {
        renderChatMessages(emp);
    }
}

/**
 * General Employee (#2 ~ #8+) Task Execution
 */
async function submitGeneralEmployeeTask() {
    const emp = employees.find(e => e.id === activeEmployeeId);
    if (!emp) return;

    const inputEl = document.getElementById('chatTaskInput');
    const userText = inputEl.value.trim();
    if (!userText) {
        showToast('⚠️ 請輸入要交辦給員工的任務內容！');
        return;
    }

    playRetroSound('click');
    inputEl.value = '';

    emp.messages.push({
        role: 'user',
        text: userText
    });

    emp.status = 'working';
    emp.progress = 20;
    emp.currentTask = userText;
    renderOfficeEmployees();
    updateManagerIndicator();
    renderChatMessages(emp);

    const progressTimer = setInterval(() => {
        if (emp.status === 'working' && emp.progress < 90) {
            emp.progress += 12;
            renderOfficeEmployees();
            if (!document.getElementById('managerModal').classList.contains('hidden')) {
                renderManagerModalContent();
            }
        }
    }, 400);

    try {
        const historyContents = emp.messages
            .filter((m, idx) => idx > 0 && m.type !== 'error')
            .map(m => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.text || '' }]
            }));

        const payload = {
            contents: historyContents,
            systemInstruction: {
                parts: [{ text: emp.systemPrompt }]
            }
        };

        const result = await callGeminiAPI(payload);
        const replyText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!replyText) {
            throw new Error('AI 未回傳有效內容');
        }

        clearInterval(progressTimer);
        emp.status = 'completed';
        emp.progress = 100;
        emp.latestOutputSummary = replyText.slice(0, 90) + (replyText.length > 90 ? '...' : '');
        emp.messages.push({
            role: 'assistant',
            type: 'text',
            text: replyText
        });

        playRetroSound('complete');
        triggerFloatingStat(emp.id, '🎮 任務完成!');
        showToast(`✅ 【${emp.name}】已完成您交辦的任務！`);
    } catch (err) {
        clearInterval(progressTimer);
        emp.status = 'error';
        emp.progress = 50;
        emp.latestOutputSummary = `⚠️ 執行錯誤：${err.message}`;
        emp.messages.push({
            role: 'assistant',
            type: 'error',
            text: `⚠️ 報告老闆，執行任務時發生錯誤：\n${err.message}`
        });
        playRetroSound('error');
        showToast(`⚠️ 【${emp.name}】執行任務時發生錯誤！`);
    }

    renderOfficeEmployees();
    updateManagerIndicator();
    if (!document.getElementById('managerModal').classList.contains('hidden')) {
        renderManagerModalContent();
    }
    if (activeEmployeeId === emp.id) {
        renderChatMessages(emp);
    }
}
