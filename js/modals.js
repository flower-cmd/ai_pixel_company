// =========================================================================
// 8. MODALS: BOSS ROSTER, MANAGER PROGRESS, SETTINGS & EMPLOYEE FORM
// =========================================================================

// -------------------- BOSS MODAL (員工名冊) --------------------
function openBossModal() {
    playRetroSound('click');
    renderBossRoster();
    const modal = document.getElementById('bossModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeBossModal() {
    playRetroSound('click');
    const modal = document.getElementById('bossModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function renderBossRoster() {
    const grid = document.getElementById('bossRosterGrid');
    if (!grid) return;

    grid.innerHTML = employees.map(emp => {
        const statusBadge = getStatusBadgeHtml(emp.status, emp.progress);
        let roleTag = '';
        if (emp.isPromptEditor) {
            roleTag = `<span class="bg-amber-400 text-[#3d2516] border border-[#3d2516] text-[10px] font-black px-1.5 py-0.2 rounded">提示詞編輯＋缺漏備註</span>`;
        } else if (emp.isImageGenerator) {
            roleTag = `<span class="bg-pink-400 text-[#3d2516] border border-[#3d2516] text-[10px] font-black px-1.5 py-0.2 rounded">AI 生圖＋自動存入 image/</span>`;
        }

        return `
        <div onclick="selectEmployeeFromBossRoster(${emp.id})" 
             class="kairo-panel !bg-white hover:!bg-amber-50 p-3.5 cursor-pointer transition-transform hover:-translate-y-0.5 flex items-center justify-between gap-3">
            <div class="flex items-center gap-3 min-w-0">
                <div class="w-14 h-14 bg-amber-100 border-3 border-[#3d2516] rounded-lg p-1 shrink-0 relative">
                    ${PIXEL_AVATARS[emp.avatarKey] || PIXEL_AVATARS.editor_glasses}
                    <span class="absolute -top-2 -left-2 bg-[#3d2516] text-amber-300 text-[10px] font-black px-1.5 rounded">#${emp.id}</span>
                </div>
                <div class="min-w-0">
                    <div class="flex items-center gap-1.5 flex-wrap">
                        <h3 class="font-black text-base text-[#3d2516] truncate">${escapeHtml(emp.name)}</h3>
                        ${roleTag}
                    </div>
                    <p class="text-xs text-stone-600 line-clamp-2 mt-0.5">${escapeHtml(emp.description)}</p>
                    <div class="mt-1.5 flex items-center gap-2">
                        ${statusBadge}
                    </div>
                </div>
            </div>
            <button class="kairo-btn bg-amber-500 text-white text-xs px-3 py-2 shrink-0 flex flex-col items-center">
                <span>👉 指派</span>
                <span class="text-[10px] opacity-90">${appConfig.walkAnimationEnabled ? '走過去交辦' : '立即開啟'}</span>
            </button>
        </div>
        `;
    }).join('');
}

function selectEmployeeFromBossRoster(empId) {
    closeBossModal();
    triggerBossAssignInteraction(empId);
}

// -------------------- MANAGER MODAL (員工工作進度畫面) --------------------
function openManagerModal() {
    playRetroSound('click');
    renderManagerModalContent();
    const modal = document.getElementById('managerModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeManagerModal() {
    playRetroSound('click');
    const modal = document.getElementById('managerModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function renderManagerModalContent() {
    const countersEl = document.getElementById('managerStatsCounters');
    const listEl = document.getElementById('managerProgressList');
    if (!countersEl || !listEl) return;

    const workingCount = employees.filter(e => e.status === 'working').length;
    const completedCount = employees.filter(e => e.status === 'completed').length;
    const errorCount = employees.filter(e => e.status === 'error').length;
    const idleCount = employees.filter(e => e.status === 'idle').length;

    countersEl.innerHTML = `
        <span class="bg-stone-200 border-2 border-[#3d2516] px-2.5 py-1 rounded">👥 總員工：${employees.length}</span>
        <span class="bg-sky-200 border-2 border-[#3d2516] px-2.5 py-1 rounded text-sky-950">⏳ 工作中：${workingCount}</span>
        <span class="bg-emerald-300 border-2 border-[#3d2516] px-2.5 py-1 rounded text-emerald-950">✅ 已完成：${completedCount}</span>
        <span class="bg-rose-300 border-2 border-[#3d2516] px-2.5 py-1 rounded text-rose-950">⚠️ 錯誤：${errorCount}</span>
        <span class="bg-amber-100 border-2 border-[#3d2516] px-2.5 py-1 rounded text-amber-950">☕ 待命中：${idleCount}</span>
    `;

    listEl.innerHTML = employees.map(emp => {
        const statusBadge = getStatusBadgeHtml(emp.status, emp.progress);
        const barColor = emp.status === 'error'
            ? 'bg-rose-500'
            : emp.status === 'completed'
                ? 'bg-emerald-500'
                : emp.status === 'working'
                    ? 'bg-sky-500'
                    : 'bg-stone-400';

        return `
        <div class="bg-white border-3 border-[#3d2516] rounded-xl p-3.5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <!-- Left: Avatar & Info -->
            <div class="flex items-center gap-3 min-w-0 flex-1">
                <div class="w-12 h-12 bg-amber-100 border-2 border-[#3d2516] rounded-lg p-1 shrink-0">
                    ${PIXEL_AVATARS[emp.avatarKey] || PIXEL_AVATARS.editor_glasses}
                </div>
                <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2 flex-wrap">
                        <span class="bg-[#3d2516] text-amber-300 text-[10px] font-black px-1.5 py-0.2 rounded">#${emp.id}</span>
                        <h4 class="font-black text-base text-[#3d2516]">${escapeHtml(emp.name)}</h4>
                        ${statusBadge}
                    </div>
                    <p class="text-xs text-stone-700 font-bold mt-1 truncate">
                        📌 目前任務：${emp.currentTask ? escapeHtml(emp.currentTask) : '<span class="text-stone-400 font-normal">尚未指派任務</span>'}
                    </p>
                    ${emp.latestOutputSummary ? `
                    <p class="text-xs ${emp.status === 'error' ? 'text-rose-800 bg-rose-50 border-rose-200' : 'text-emerald-800 bg-emerald-50 border-emerald-200'} border rounded px-2 py-1 mt-1 line-clamp-2">
                        💬 最新回報：${escapeHtml(emp.latestOutputSummary)}
                    </p>` : ''}
                </div>
            </div>

            <!-- Middle: Progress Bar -->
            <div class="w-full md:w-44 shrink-0">
                <div class="flex justify-between text-xs font-black mb-1">
                    <span>工作進度</span>
                    <span>${emp.progress}%</span>
                </div>
                <div class="w-full h-4 bg-stone-200 border-2 border-[#3d2516] rounded-full overflow-hidden p-0.5">
                    <div class="h-full ${barColor} rounded-full transition-all duration-300" style="width: ${emp.progress}%"></div>
                </div>
            </div>

            <!-- Right: Action Button -->
            <div class="flex items-center gap-1.5 shrink-0 w-full md:w-auto justify-end">
                <button onclick="closeManagerModal(); openEmployeeChatModal(${emp.id});" class="kairo-btn bg-amber-500 text-white text-xs px-3.5 py-2">
                    💬 查看對話 / 驗收成果
                </button>
            </div>
        </div>
        `;
    }).join('');
}

function getStatusBadgeHtml(status, progress) {
    if (status === 'working') {
        return `<span class="bg-sky-500 text-white text-[11px] font-black px-2 py-0.5 rounded border border-[#3d2516]">⏳ 工作中 (${progress}%)</span>`;
    }
    if (status === 'completed') {
        return `<span class="bg-emerald-500 text-white text-[11px] font-black px-2 py-0.5 rounded border border-[#3d2516]">✅ 已完成任務</span>`;
    }
    if (status === 'error') {
        return `<span class="bg-rose-600 text-white text-[11px] font-black px-2 py-0.5 rounded border border-[#3d2516]">⚠️ 發生錯誤</span>`;
    }
    return `<span class="bg-stone-200 text-stone-700 text-[11px] font-bold px-2 py-0.5 rounded border border-stone-400">☕ 待命中</span>`;
}

// -------------------- SETTINGS MODAL (系統設定) --------------------
function syncWalkToggleUI() {
    const statusText = document.getElementById('quickWalkStatusText');
    const quickIcon = document.getElementById('quickWalkIcon');
    const bossModalCheckbox = document.getElementById('bossModalWalkCheckbox');
    const settingsCheckbox = document.getElementById('settingsWalkCheckbox');
    const bossModalHint = document.getElementById('bossModalWalkHint');

    if (statusText && quickIcon) {
        if (appConfig.walkAnimationEnabled) {
            statusText.textContent = "開啟";
            statusText.className = "text-emerald-700";
            quickIcon.textContent = "🚶";
        } else {
            statusText.textContent = "關閉";
            statusText.className = "text-rose-700";
            quickIcon.textContent = "⚡";
        }
    }

    if (bossModalHint) {
        if (appConfig.walkAnimationEnabled) {
            bossModalHint.textContent = "（開啟：點選員工後老闆會親自走到他座位旁！）";
            bossModalHint.className = "text-emerald-800 font-black";
        } else {
            bossModalHint.textContent = "（關閉：點選員工後直接跳出 AI 聊天介面！）";
            bossModalHint.className = "text-stone-600 font-bold";
        }
    }

    if (bossModalCheckbox) bossModalCheckbox.checked = appConfig.walkAnimationEnabled;
    if (settingsCheckbox) settingsCheckbox.checked = appConfig.walkAnimationEnabled;
}

function toggleWalkAnimation(forceState) {
    playRetroSound('click');
    if (typeof forceState === 'boolean') {
        appConfig.walkAnimationEnabled = forceState;
    } else {
        appConfig.walkAnimationEnabled = !appConfig.walkAnimationEnabled;
    }
    saveConfigToStorage();
    syncWalkToggleUI();

    const bossModal = document.getElementById('bossModal');
    if (bossModal && !bossModal.classList.contains('hidden')) {
        renderBossRoster();
    }
}

function updateWalkSpeed(val) {
    appConfig.walkDurationMs = parseInt(val, 10);
    saveConfigToStorage();
    const sec = (appConfig.walkDurationMs / 1000).toFixed(1);
    const label = document.getElementById('walkSpeedValueLabel');
    if (label) label.textContent = `${sec} 秒`;
}

function toggleSoundEffect(enabled) {
    appConfig.soundEnabled = enabled;
    saveConfigToStorage();
    if (enabled) playRetroSound('click');
}

function openSettingsModal() {
    playRetroSound('click');
    const apiKeyInput = document.getElementById('settingsApiKeyInput');
    const modelSelect = document.getElementById('settingsModelSelect');
    const imageModelSelect = document.getElementById('settingsImageModelSelect');
    const githubTokenInput = document.getElementById('settingsGithubTokenInput');
    const githubRepoInput = document.getElementById('settingsGithubRepoInput');
    const githubBranchInput = document.getElementById('settingsGithubBranchInput');
    const walkCheckbox = document.getElementById('settingsWalkCheckbox');
    const walkSpeedRange = document.getElementById('walkSpeedRange');
    const soundCheckbox = document.getElementById('settingsSoundCheckbox');

    if (apiKeyInput) apiKeyInput.value = appConfig.apiKey;
    if (modelSelect) modelSelect.value = appConfig.geminiModel;
    if (imageModelSelect) imageModelSelect.value = appConfig.imageModel;
    if (githubTokenInput) githubTokenInput.value = appConfig.githubToken;
    if (githubRepoInput) githubRepoInput.value = appConfig.githubRepo;
    if (githubBranchInput) githubBranchInput.value = appConfig.githubBranch;
    if (walkCheckbox) walkCheckbox.checked = appConfig.walkAnimationEnabled;
    if (walkSpeedRange) {
        walkSpeedRange.value = appConfig.walkDurationMs;
        updateWalkSpeed(appConfig.walkDurationMs);
    }
    if (soundCheckbox) soundCheckbox.checked = appConfig.soundEnabled;

    updateImageStorageStatusUI();

    const modal = document.getElementById('settingsModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeSettingsModal() {
    playRetroSound('click');
    const modal = document.getElementById('settingsModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function saveSettingsFromModal() {
    const apiKeyInput = document.getElementById('settingsApiKeyInput');
    const modelSelect = document.getElementById('settingsModelSelect');
    const imageModelSelect = document.getElementById('settingsImageModelSelect');
    const githubTokenInput = document.getElementById('settingsGithubTokenInput');
    const githubRepoInput = document.getElementById('settingsGithubRepoInput');
    const githubBranchInput = document.getElementById('settingsGithubBranchInput');

    if (apiKeyInput) appConfig.apiKey = apiKeyInput.value.trim();
    if (modelSelect) appConfig.geminiModel = modelSelect.value.trim();
    if (imageModelSelect) appConfig.imageModel = imageModelSelect.value.trim();
    if (githubTokenInput) appConfig.githubToken = githubTokenInput.value.trim();
    if (githubRepoInput) appConfig.githubRepo = githubRepoInput.value.trim();
    if (githubBranchInput) appConfig.githubBranch = githubBranchInput.value.trim() || 'main';

    saveConfigToStorage();
    updateImageStorageStatusUI();
    closeSettingsModal();
    showToast('💾 設定已儲存！');
}

// -------------------- ADD / EDIT EMPLOYEE MODAL (新增或編輯員工職務) --------------------
function renderAvatarPicker() {
    const grid = document.getElementById('avatarPickerGrid');
    if (!grid) return;
    grid.innerHTML = Object.keys(PIXEL_AVATARS).map(key => `
        <div onclick="selectFormAvatar('${key}')" 
             class="p-2 rounded-lg border-3 cursor-pointer flex items-center justify-center h-14 ${selectedAvatarKeyForForm === key ? 'bg-amber-300 border-[#3d2516] shadow-inner' : 'bg-white border-stone-300 hover:bg-amber-50'}">
            <div class="w-10 h-10">${PIXEL_AVATARS[key]}</div>
        </div>
    `).join('');
}

function selectFormAvatar(key) {
    playRetroSound('click');
    selectedAvatarKeyForForm = key;
    renderAvatarPicker();
}

function openAddEmployeeModal() {
    playRetroSound('click');
    document.getElementById('employeeFormModalTitle').textContent = "➕ 招募新 AI 員工 (擴充座位)";
    document.getElementById('editEmployeeTargetId').value = "";
    document.getElementById('empNameInput').value = "";
    document.getElementById('empDescInput').value = "";
    document.getElementById('empPromptInput').value = "";
    const keys = Object.keys(PIXEL_AVATARS);
    selectedAvatarKeyForForm = keys[employees.length % keys.length];
    renderAvatarPicker();

    const modal = document.getElementById('employeeFormModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function openEditEmployeeModal(empId) {
    playRetroSound('click');
    const emp = employees.find(e => e.id === empId);
    if (!emp) return;

    document.getElementById('employeeFormModalTitle').textContent = `✏️ 編輯 #${emp.id} 員工職務設定`;
    document.getElementById('editEmployeeTargetId').value = emp.id;
    document.getElementById('empNameInput').value = emp.name;
    document.getElementById('empDescInput').value = emp.description;
    document.getElementById('empPromptInput').value = emp.systemPrompt;
    selectedAvatarKeyForForm = emp.avatarKey;
    renderAvatarPicker();

    const modal = document.getElementById('employeeFormModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeEmployeeFormModal() {
    playRetroSound('click');
    const modal = document.getElementById('employeeFormModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function saveEmployeeForm() {
    playRetroSound('click');
    const targetId = document.getElementById('editEmployeeTargetId').value;
    const name = document.getElementById('empNameInput').value.trim();
    const desc = document.getElementById('empDescInput').value.trim() || `負責處理【${name}】相關的專業 AI 任務。`;
    const sysPrompt = document.getElementById('empPromptInput').value.trim() || `你是 AI 公司的「${name}」。請以專業、清晰的繁體中文完成老闆交辦的任務。`;

    if (!name) {
        showToast("⚠️ 請輸入員工名稱（職務內容）！");
        return;
    }

    if (targetId) {
        const emp = employees.find(e => e.id === parseInt(targetId, 10));
        if (emp) {
            emp.name = name;
            emp.description = desc;
            emp.systemPrompt = sysPrompt;
            emp.avatarKey = selectedAvatarKeyForForm;
            showToast(`✅ 已更新 #${emp.id} 【${emp.name}】的職務設定！`);
            if (activeEmployeeId === emp.id) {
                openEmployeeChatModal(emp.id);
            }
        }
    } else {
        const newId = employees.length + 1;
        employees.push({
            id: newId,
            name: name,
            avatarKey: selectedAvatarKeyForForm,
            isPromptEditor: false,
            isImageGenerator: false,
            description: desc,
            systemPrompt: sysPrompt,
            status: "idle",
            progress: 0,
            currentTask: "",
            latestOutputSummary: "",
            bubbleText: "新報到！",
            messages: [
                {
                    role: "assistant",
                    type: "text",
                    text: `老闆好！我是新報到的 **#${newId}號員工：${name}** ✨。\n${desc}\n請問有什麼任務要交給我呢？`
                }
            ]
        });
        playRetroSound('complete');
        showToast(`🎉 成功招募第 ${newId} 位員工：【${name}】！`);
    }

    closeEmployeeFormModal();
    renderOfficeEmployees();
    updateManagerIndicator();
}
