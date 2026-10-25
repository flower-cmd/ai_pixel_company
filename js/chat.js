// =========================================================================
// 7. EMPLOYEE AI CHAT INTERFACE & MESSAGE RENDERING
// =========================================================================

function openEmployeeChatModal(empId) {
    activeEmployeeId = empId;
    const emp = employees.find(e => e.id === empId);
    if (!emp) return;

    document.getElementById('chatHeaderAvatar').innerHTML = PIXEL_AVATARS[emp.avatarKey] || PIXEL_AVATARS.editor_glasses;
    document.getElementById('chatHeaderBadge').textContent = `#${emp.id} 號員工`;
    document.getElementById('chatHeaderTitle').textContent = emp.name;
    document.getElementById('chatHeaderDesc').textContent = emp.description;

    const workflowBanner = document.getElementById('promptEditorWorkflowBanner');
    const sendTaskBtnLabel = document.getElementById('sendTaskBtnLabel');
    const chatTaskInput = document.getElementById('chatTaskInput');

    if (emp.isPromptEditor) {
        workflowBanner.classList.remove('hidden');
        sendTaskBtnLabel.textContent = "✨ 送出提示詞進行編輯";
        chatTaskInput.placeholder = "請輸入您想要打的提示詞，我會幫您編輯並在備註列出缺少的部分...";
    } else {
        workflowBanner.classList.add('hidden');
        sendTaskBtnLabel.textContent = "🚀 分配任務給他";
        chatTaskInput.placeholder = `請輸入要交辦給【${emp.name}】的任務內容...`;
    }

    renderChatMessages(emp);

    const modal = document.getElementById('employeeChatModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    setTimeout(() => {
        chatTaskInput.focus();
    }, 100);
}

function closeEmployeeChatModal() {
    playRetroSound('click');
    const modal = document.getElementById('employeeChatModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function renderChatMessages(emp) {
    const container = document.getElementById('chatMessagesContainer');
    if (!container) return;

    container.innerHTML = emp.messages.map((msg, idx) => {
        if (msg.role === 'user') {
            return `
            <div class="flex justify-end">
                <div class="max-w-[82%] bg-amber-500 text-white border-3 border-[#3d2516] rounded-2xl rounded-tr-xs px-4 py-3 shadow-md">
                    <div class="flex items-center justify-between gap-2 mb-1">
                        <span class="text-[11px] font-black bg-[#3d2516] text-amber-300 px-2 py-0.2 rounded">👑 老闆交辦</span>
                    </div>
                    <div class="text-sm font-bold whitespace-pre-wrap leading-relaxed select-text">${escapeHtml(msg.text)}</div>
                </div>
            </div>`;
        }

        // Structured output for Employee #1: Edited Prompt + Remarks (備註)
        if (msg.type === 'prompt_edit_result' && msg.structuredData) {
            const data = msg.structuredData;
            const remarks = Array.isArray(data.missingRemarks) ? data.missingRemarks : [];
            const missingListHtml = remarks.length > 0
                ? remarks.map((item, i) => `
                    <li class="flex items-start gap-2 text-xs sm:text-sm text-amber-950 font-bold">
                        <span class="bg-amber-600 text-white text-[11px] font-black px-1.5 py-0.2 rounded shrink-0 mt-0.5">備註 ${i + 1}</span>
                        <span class="select-text">${escapeHtml(item)}</span>
                    </li>
                `).join('')
                : `<li class="text-xs sm:text-sm text-emerald-800 font-bold">✔ 您的提示詞資訊已經相當完整，沒有發現明顯缺少的部分！</li>`;

            return `
            <div class="flex justify-start">
                <div class="max-w-[92%] w-full bg-white border-3 border-[#3d2516] rounded-2xl rounded-tl-xs p-4 shadow-md space-y-3.5">
                    <div class="flex items-center justify-between border-b-2 border-amber-200 pb-2">
                        <span class="bg-amber-400 text-[#3d2516] border-2 border-[#3d2516] text-xs font-black px-2.5 py-0.5 rounded">✨ 提示詞編輯結果與備註</span>
                        <span class="text-xs text-stone-500 font-bold">${escapeHtml(emp.name)}</span>
                    </div>

                    <!-- 1. Edited Prompt Box -->
                    <div class="bg-sky-50 border-2 border-sky-700 rounded-xl p-3.5">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-xs sm:text-sm font-black text-sky-950">📌 編輯後的提示詞：</span>
                            <button onclick="copyTextToClipboard(${idx}, 'editedPrompt')" class="kairo-btn bg-sky-600 text-white text-xs px-2.5 py-1">📋 複製提示詞</button>
                        </div>
                        <div class="bg-white border-2 border-sky-200 rounded-lg p-3 text-xs sm:text-sm text-stone-800 whitespace-pre-wrap font-medium leading-relaxed select-text">${escapeHtml(data.editedPrompt || '')}</div>
                    </div>

                    <!-- 2. Remarks (備註：發現提示詞缺少的部分) -->
                    <div class="bg-amber-50 border-3 border-amber-600 rounded-xl p-3.5">
                        <div class="flex items-center gap-2 mb-2">
                            <span class="bg-amber-500 text-white text-xs font-black px-2 py-0.5 rounded border border-[#3d2516]">📝 備註（提示詞缺少的部分）</span>
                        </div>
                        <ul class="space-y-2 mt-2">
                            ${missingListHtml}
                        </ul>
                    </div>
                </div>
            </div>`;
        }

        // Error Message Card
        if (msg.type === 'error') {
            return `
            <div class="flex justify-start">
                <div class="max-w-[85%] bg-rose-50 border-3 border-rose-700 rounded-2xl rounded-tl-xs px-4 py-3 shadow-md">
                    <div class="flex items-center justify-between gap-3 mb-1.5 border-b border-rose-200 pb-1">
                        <span class="text-xs font-black text-rose-800">⚠️ ${escapeHtml(emp.name)} - 執行異常</span>
                        <button onclick="openSettingsModal()" class="text-[11px] bg-rose-600 text-white rounded px-2 py-0.5 font-bold">⚙️ 檢查 API 設定</button>
                    </div>
                    <div class="text-sm text-rose-900 whitespace-pre-wrap font-bold leading-relaxed select-text">${escapeHtml(msg.text)}</div>
                </div>
            </div>`;
        }

        // Standard Assistant Message
        return `
        <div class="flex justify-start">
            <div class="max-w-[85%] bg-white border-3 border-[#3d2516] rounded-2xl rounded-tl-xs px-4 py-3 shadow-md">
                <div class="flex items-center justify-between gap-3 mb-1.5 border-b border-stone-200 pb-1">
                    <span class="text-xs font-black text-amber-900">🧑‍💻 ${escapeHtml(emp.name)}</span>
                    <button onclick="copyRawMessageText(${idx})" class="text-[11px] bg-stone-100 hover:bg-amber-200 border border-stone-400 rounded px-2 py-0.2 font-bold">📋 複製內容</button>
                </div>
                <div class="text-sm text-stone-800 whitespace-pre-wrap leading-relaxed select-text">${formatSimpleMarkdown(msg.text)}</div>
            </div>
        </div>`;
    }).join('');

    container.scrollTop = container.scrollHeight;
}

function handleSendTask() {
    const emp = employees.find(e => e.id === activeEmployeeId);
    if (!emp) return;

    if (emp.status === 'working') {
        showToast('⏳ 這位員工正在處理任務中，請稍候...');
        return;
    }

    if (emp.isPromptEditor) {
        submitPromptEditorTask();
    } else {
        submitGeneralEmployeeTask();
    }
}

function clearEmployeeHistory(empId) {
    playRetroSound('click');
    const emp = employees.find(e => e.id === empId);
    if (!emp) return;
    emp.messages = emp.messages.slice(0, 1);
    emp.status = "idle";
    emp.progress = 0;
    emp.currentTask = "";
    emp.latestOutputSummary = "";
    renderChatMessages(emp);
    renderOfficeEmployees();
    updateManagerIndicator();
    showToast("🧹 已清空對話紀錄並重置該員工狀態");
}

function copyTextToClipboard(msgIndex, fieldName) {
    const emp = employees.find(e => e.id === activeEmployeeId);
    if (!emp || !emp.messages[msgIndex]) return;
    const text = emp.messages[msgIndex].structuredData?.[fieldName] || '';
    copyString(text);
}

function copyRawMessageText(msgIndex) {
    const emp = employees.find(e => e.id === activeEmployeeId);
    if (!emp || !emp.messages[msgIndex]) return;
    copyString(emp.messages[msgIndex].text || '');
}
