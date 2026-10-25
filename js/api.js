// =========================================================================
// 6. REAL GEMINI API INTEGRATION & TASK EXECUTION
//    - Employee #1: Prompt Editor (submitPromptEditorTask)
//    - Employee #2: Image Generator + Local & GitHub `image/` Save (submitImageGeneratorTask)
//    - Employees #3~#8+: General Task Execution (submitGeneralEmployeeTask)
// =========================================================================

async function callGeminiAPI(payload, customModel) {
    const key = (appConfig.apiKey || '').trim();
    if (!key) {
        throw new Error('尚未設定 Gemini API Key，請點選右上角「⚙️ 設定」輸入 API Key。');
    }

    const model = (customModel || appConfig.geminiModel || 'gemini-2.5-flash').trim();
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

// =========================================================================
// IMAGE SAVING HELPERS: LOCAL `image/` FOLDER & GITHUB `image/` FOLDER
// =========================================================================

function base64ToUint8Array(base64) {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

/**
 * Save image bytes into the bound local `image/` directory handle (Approach A)
 */
async function saveImageToLocalFolder(base64Data, filename, requestPickerIfMissing = false) {
    try {
        if (!localImageDirHandle && requestPickerIfMissing && typeof window.showDirectoryPicker === 'function') {
            const bound = await bindLocalImageFolder();
            if (!bound) {
                return { saved: false, reason: '未選擇本機資料夾' };
            }
        }
        if (!localImageDirHandle) {
            return { saved: false, reason: '尚未綁定本機 image 資料夾' };
        }

        // Verify or request write permission on the directory handle
        if (typeof localImageDirHandle.queryPermission === 'function') {
            let perm = await localImageDirHandle.queryPermission({ mode: 'readwrite' });
            if (perm !== 'granted' && typeof localImageDirHandle.requestPermission === 'function') {
                perm = await localImageDirHandle.requestPermission({ mode: 'readwrite' });
            }
            if (perm !== 'granted') {
                return { saved: false, reason: '未授予本機資料夾寫入權限' };
            }
        }

        const fileHandle = await localImageDirHandle.getFileHandle(filename, { create: true });
        const writable = await fileHandle.createWritable();
        const bytes = base64ToUint8Array(base64Data);
        await writable.write(bytes);
        await writable.close();

        return {
            saved: true,
            folderName: localImageDirHandle.name,
            path: `${localImageDirHandle.name}/${filename}`
        };
    } catch (err) {
        return {
            saved: false,
            reason: err.message || '寫入本機資料夾失敗'
        };
    }
}

/**
 * Save image directly to GitHub repository's `image/` folder via GitHub REST API
 * Works even on mobile when the computer is turned off!
 */
async function saveImageToGitHubRepo(base64Data, filename, promptText) {
    const token = (appConfig.githubToken || '').trim();
    const repo = (appConfig.githubRepo || '').trim().replace(/^\/+|\/+$/g, '');
    const branch = (appConfig.githubBranch || 'main').trim() || 'main';

    if (!token || !repo) {
        return { saved: false, reason: '尚未設定 GitHub Token 或儲存庫名稱' };
    }

    const filePath = `image/${filename}`;
    const apiUrl = `https://api.github.com/repos/${repo}/contents/${filePath}`;

    try {
        const response = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `🎨 2號員工生成圖片: ${filePath} (${promptText.slice(0, 40)})`,
                content: base64Data,
                branch: branch
            })
        });

        if (!response.ok) {
            let errMsg = `HTTP ${response.status}`;
            try {
                const errData = await response.json();
                if (errData?.message) errMsg = errData.message;
            } catch (_) {}
            throw new Error(errMsg);
        }

        const data = await response.json();
        return {
            saved: true,
            path: filePath,
            htmlUrl: data?.content?.html_url || `https://github.com/${repo}/blob/${branch}/${filePath}`
        };
    } catch (err) {
        return {
            saved: false,
            reason: err.message || '上傳 GitHub 失敗'
        };
    }
}

// =========================================================================
// EMPLOYEE #1: PROMPT EDITOR TASK EXECUTION
// =========================================================================

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

        const historyContents = emp.messages
            .filter((m, idx) => idx > 0 && m.type !== 'error')
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

// =========================================================================
// EMPLOYEE #2: AI IMAGE GENERATOR TASK EXECUTION (LOCAL + GITHUB `image/`)
// =========================================================================

async function submitImageGeneratorTask() {
    const emp = employees.find(e => e.id === activeEmployeeId);
    if (!emp) return;

    const inputEl = document.getElementById('chatTaskInput');
    const userText = inputEl.value.trim();

    if (!userText) {
        showToast('⚠️ 請先輸入要生成圖片的提示詞！');
        return;
    }

    playRetroSound('click');
    inputEl.value = '';

    emp.messages.push({
        role: 'user',
        text: userText
    });

    emp.status = 'working';
    emp.progress = 15;
    emp.currentTask = `生成圖片：${userText.slice(0, 26)}${userText.length > 26 ? '...' : ''}`;
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
    }, 450);

    try {
        const payload = {
            contents: [
                {
                    role: 'user',
                    parts: [{ text: `請根據以下提示詞生成一張高品質圖片：\n${userText}` }]
                }
            ],
            generationConfig: {
                responseModalities: ['TEXT', 'IMAGE']
            }
        };

        // Try user's chosen image model first, with fallback to alternate Gemini image models if needed
        const candidateModels = [
            appConfig.imageModel || 'gemini-2.5-flash-image',
            'gemini-2.5-flash-image',
            'gemini-2.0-flash-exp-image-generation',
            'gemini-3.1-flash-image-preview'
        ].filter((v, i, a) => a.indexOf(v) === i);

        let result = null;
        let lastErr = null;

        for (const modelName of candidateModels) {
            try {
                result = await callGeminiAPI(payload, modelName);
                const parts = result?.candidates?.[0]?.content?.parts || [];
                const hasImg = parts.some(p => p.inlineData && p.inlineData.data);
                if (hasImg) break;
            } catch (e) {
                lastErr = e;
            }
        }

        const parts = result?.candidates?.[0]?.content?.parts || [];
        const imgPart = parts.find(p => p.inlineData && p.inlineData.data);
        const textPart = parts.find(p => p.text);

        if (!imgPart) {
            const textReason = textPart?.text ? ` (${textPart.text})` : '';
            throw new Error((lastErr ? lastErr.message : '模型未回傳圖片資料') + textReason);
        }

        const mimeType = imgPart.inlineData.mimeType || 'image/png';
        const base64Data = imgPart.inlineData.data;
        const ext = mimeType.includes('jpeg') || mimeType.includes('jpg') ? 'jpg' : 'png';
        const now = new Date();
        const timeStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
        const filename = `img_${timeStr}.${ext}`;

        // 1. Save to Local `image/` folder if bound (or on desktop)
        const localResult = await saveImageToLocalFolder(base64Data, filename, false);

        // 2. Save to GitHub `image/` folder if configured (works on mobile even when PC is off!)
        const githubResult = await saveImageToGitHubRepo(base64Data, filename, userText);

        clearInterval(progressTimer);
        emp.status = 'completed';
        emp.progress = 100;

        emp.messages.push({
            role: 'assistant',
            type: 'image_result',
            imageData: {
                prompt: userText,
                caption: textPart?.text || '',
                mimeType: mimeType,
                base64Data: base64Data,
                filename: filename,
                localSaved: localResult.saved,
                localPath: localResult.path || '',
                localReason: localResult.reason || '',
                githubSaved: githubResult.saved,
                githubPath: githubResult.path || '',
                githubUrl: githubResult.htmlUrl || '',
                githubReason: githubResult.reason || ''
            }
        });

        const statusNotes = [];
        if (localResult.saved) statusNotes.push(`已存入本機 ${localResult.path}`);
        if (githubResult.saved) statusNotes.push(`已存入 GitHub ${githubResult.path}`);
        if (statusNotes.length === 0) statusNotes.push(`已生成 ${filename}（可點擊存入 image 資料夾或下載）`);

        emp.latestOutputSummary = `🎨 圖片生成完成：${statusNotes.join(' ｜ ')}`;

        playRetroSound('complete');
        triggerFloatingStat(emp.id, '🎨 生圖完成!');
        showToast(`✅ 【${emp.name}】已生成圖片：${filename}！`);
    } catch (err) {
        clearInterval(progressTimer);
        emp.status = 'error';
        emp.progress = 50;
        emp.latestOutputSummary = `⚠️ 生圖錯誤：${err.message}`;
        emp.messages.push({
            role: 'assistant',
            type: 'error',
            text: `⚠️ 報告老闆，生成圖片時發生錯誤：\n${err.message}`
        });
        playRetroSound('error');
        showToast(`⚠️ 【${emp.name}】生成圖片失敗！`);
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

// =========================================================================
// EMPLOYEES #3~#8+: GENERAL TASK EXECUTION
// =========================================================================

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
