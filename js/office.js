// =========================================================================
// 5. OFFICE FLOOR RENDERING, BOSS WALKING ANIMATION & MANAGER INDICATOR
// =========================================================================

function renderOfficeEmployees() {
    const container = document.getElementById('employeeDesksContainer');
    const countLabel = document.getElementById('employeeCountLabel');
    if (!container) return;
    if (countLabel) countLabel.textContent = employees.length;

    container.innerHTML = employees.map(emp => {
        let overheadHtml = '';
        if (emp.status === 'working') {
            overheadHtml = `
                <div class="speech-bubble !bg-sky-100 !border-sky-800 !text-sky-950">
                    ⚡ 努力執行中 ${emp.progress}%
                </div>`;
        } else if (emp.status === 'completed') {
            overheadHtml = `
                <div class="speech-bubble !bg-emerald-400 !border-[#3d2516] !text-[#3d2516]">
                    ✅ 任務已完成！
                </div>`;
        } else if (emp.status === 'error') {
            overheadHtml = `
                <div class="speech-bubble !bg-rose-500 !border-[#3d2516] !text-white">
                    ⚠️ 發生錯誤！
                </div>`;
        } else if (emp.bubbleText) {
            overheadHtml = `
                <div class="speech-bubble">
                    ${escapeHtml(emp.bubbleText)}
                </div>`;
        }

        const screenColor = emp.status === 'working'
            ? 'bg-emerald-400 animate-pulse'
            : emp.status === 'completed'
                ? 'bg-amber-300'
                : emp.status === 'error'
                    ? 'bg-rose-500'
                    : 'bg-sky-400';

        const charAnimClass = emp.status === 'working' ? 'animate-work' : 'animate-bob';

        let specialTagHtml = '';
        if (emp.isPromptEditor) {
            specialTagHtml = `
                <span class="absolute top-1 right-1.5 bg-amber-400 text-[#3d2516] border border-[#3d2516] text-[9px] font-black px-1 rounded">
                    ★提示詞編輯
                </span>`;
        } else if (emp.isImageGenerator) {
            specialTagHtml = `
                <span class="absolute top-1 right-1.5 bg-pink-400 text-[#3d2516] border border-[#3d2516] text-[9px] font-black px-1 rounded">
                    🎨生圖存檔
                </span>`;
        }

        return `
        <div id="empDesk_${emp.id}" onclick="handleEmployeeClickFromOffice(${emp.id})" 
             class="desk-station flex flex-col items-center p-2 rounded-xl bg-[#694427]/85 border-3 border-[#3d2516] shadow-lg relative group">
            
            <!-- Employee Number Tag -->
            <span class="absolute top-1 left-1.5 bg-[#3d2516] text-amber-300 text-[10px] font-black px-1.5 py-0.2 rounded">
                #${emp.id}
            </span>

            ${specialTagHtml}

            <!-- Overhead Speech / Status Bubble -->
            <div class="relative w-full flex flex-col items-center mt-3">
                ${overheadHtml}

                <!-- Floating Stat Effect Container -->
                <div id="empStatPopup_${emp.id}"></div>

                <!-- Character Pixel Sprite -->
                <div class="w-12 h-12 ${charAnimClass} z-10">
                    ${PIXEL_AVATARS[emp.avatarKey] || PIXEL_AVATARS.editor_glasses}
                </div>

                <!-- Pixel Office Desk + PC Monitor + Keyboard -->
                <div class="w-full max-w-[125px] h-10 bg-gradient-to-b from-[#c89d66] to-[#9c713f] border-3 border-[#3d2516] rounded -mt-2 relative flex items-center justify-between px-2 shadow-md">
                    <div class="w-7 h-5 bg-emerald-600 border border-[#3d2516] rounded-xs flex items-center justify-center">
                        <div class="w-5 h-2.5 bg-stone-200 border border-stone-600"></div>
                    </div>
                    <div class="w-9 h-7 bg-slate-800 border-2 border-[#3d2516] rounded-xs p-0.5 -mt-4 shadow">
                        <div class="w-full h-full ${screenColor} flex flex-col justify-center gap-0.5 p-0.5">
                            <div class="w-3/4 h-0.5 bg-white/80"></div>
                            <div class="w-1/2 h-0.5 bg-white/80"></div>
                        </div>
                    </div>
                </div>

                <!-- Progress Bar if Working -->
                <div class="w-full max-w-[125px] h-2 bg-stone-900 border border-[#3d2516] rounded-full overflow-hidden mt-1 ${emp.status === 'working' ? 'opacity-100' : 'opacity-0'}">
                    <div class="h-full bg-emerald-400 transition-all duration-300" style="width: ${emp.progress}%"></div>
                </div>
            </div>

            <!-- Job Role Name Badge (名稱即為他的職務內容) -->
            <div class="station-label mt-1 w-full text-center bg-[#fff8e7] text-[#3d2516] border-2 border-[#3d2516] rounded-md px-1.5 py-0.5 text-xs font-black truncate shadow-xs transition-colors" title="${escapeHtml(emp.name)}">
                ${escapeHtml(emp.name)}
            </div>
        </div>
        `;
    }).join('');
}

/**
 * Manager Overhead Status Indicator Logic:
 * - 出現錯誤 ➔ 紅色三角形 (Red Triangle)
 * - 全部員工皆完成任務 ➔ 綠色打勾 (Green Check)
 * - 有員工已完成任務 ➔ 驚嘆號 (Exclamation Mark)
 */
function updateManagerIndicator() {
    const badgeContainer = document.getElementById('managerOverheadBadge');
    const summaryText = document.getElementById('managerQuickSummaryText');
    const hudMiniBadge = document.getElementById('hudManagerMiniBadge');
    if (!badgeContainer || !summaryText || !hudMiniBadge) return;

    const errorCount = employees.filter(e => e.status === 'error').length;
    const completedCount = employees.filter(e => e.status === 'completed').length;
    const workingCount = employees.filter(e => e.status === 'working').length;
    const totalCount = employees.length;

    // 1. Any employee has error -> Red Triangle (紅色三角形)
    if (errorCount > 0) {
        badgeContainer.innerHTML = `
            <div class="flex flex-col items-center">
                <svg class="w-12 h-12" viewBox="0 0 24 24">
                    <polygon points="12,2 23,21 1,21" fill="#ef4444" stroke="#3d2516" stroke-width="2.5" stroke-linejoin="round"/>
                    <rect x="11" y="8" width="2.2" height="6.5" fill="#ffffff"/>
                    <rect x="11" y="16.5" width="2.2" height="2.2" fill="#ffffff"/>
                </svg>
                <span class="bg-rose-600 text-white text-[10px] font-black px-2 py-0.2 rounded border-2 border-[#3d2516] -mt-1 shadow">異常錯誤 (${errorCount})</span>
            </div>
        `;
        summaryText.textContent = `⚠️ 警報：有 ${errorCount} 位員工任務發生錯誤！點擊查看`;
        summaryText.className = "mt-1.5 text-[11px] font-bold text-white bg-rose-600 px-2.5 py-0.5 rounded border border-white";
        hudMiniBadge.textContent = "▲";
        hudMiniBadge.className = "ml-1 px-1.5 py-0.2 bg-rose-500 text-white rounded text-xs font-black";
        return;
    }

    // 2. All employees completed -> Green Check (綠色打勾)
    if (completedCount === totalCount && totalCount > 0) {
        badgeContainer.innerHTML = `
            <div class="flex flex-col items-center">
                <svg class="w-12 h-12" viewBox="0 0 24 24">
                    <rect x="2" y="2" width="20" height="20" rx="5" fill="#10b981" stroke="#3d2516" stroke-width="2.5"/>
                    <path d="M6.5 12.5L10.2 16.2L17.8 8.2" fill="none" stroke="#ffffff" stroke-width="3.2" stroke-linecap="square"/>
                </svg>
                <span class="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.2 rounded border-2 border-[#3d2516] -mt-1 shadow">全體完成 (${completedCount}/${totalCount})</span>
            </div>
        `;
        summaryText.textContent = `✅ 全部 ${completedCount} 位員工皆已完成任務！`;
        summaryText.className = "mt-1.5 text-[11px] font-bold text-white bg-emerald-600 px-2.5 py-0.5 rounded border border-white";
        hudMiniBadge.textContent = "✓";
        hudMiniBadge.className = "ml-1 px-1.5 py-0.2 bg-emerald-500 text-white rounded text-xs font-black";
        return;
    }

    // 3. At least one employee has completed a task -> Exclamation Mark (驚嘆號)
    if (completedCount > 0) {
        badgeContainer.innerHTML = `
            <div class="flex flex-col items-center">
                <svg class="w-12 h-12" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" fill="#f59e0b" stroke="#3d2516" stroke-width="2.5"/>
                    <rect x="10.5" y="5.5" width="3" height="8" rx="1" fill="#ffffff"/>
                    <rect x="10.5" y="15.5" width="3" height="3" rx="1" fill="#ffffff"/>
                </svg>
                <span class="bg-amber-500 text-[#3d2516] text-[10px] font-black px-2 py-0.2 rounded border-2 border-[#3d2516] -mt-1 shadow">有任務完成 (${completedCount})</span>
            </div>
        `;
        summaryText.textContent = `❗ 通知：已有 ${completedCount} 位員工完成任務！(工作中: ${workingCount})`;
        summaryText.className = "mt-1.5 text-[11px] font-bold text-[#3d2516] bg-amber-300 px-2.5 py-0.5 rounded border border-[#3d2516]";
        hudMiniBadge.textContent = "!";
        hudMiniBadge.className = "ml-1 px-1.5 py-0.2 bg-amber-400 text-[#3d2516] rounded text-xs font-black";
        return;
    }

    // 4. Employees currently working
    if (workingCount > 0) {
        badgeContainer.innerHTML = `
            <div class="bg-sky-500 text-white text-xs font-black px-2.5 py-1 rounded-full border-2 border-[#3d2516] shadow">
                ⏳ ${workingCount} 人執行任務中...
            </div>
        `;
        summaryText.textContent = `⏳ 目前有 ${workingCount} 位員工正在執行任務...`;
        summaryText.className = "mt-1.5 text-[11px] font-bold text-sky-100 bg-sky-800/90 px-2.5 py-0.5 rounded";
        hudMiniBadge.classList.add('hidden');
        return;
    }

    // Default Idle State
    badgeContainer.innerHTML = `
        <div class="bg-stone-800/90 text-amber-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full border-2 border-amber-400/80 shadow">
            👀 監控待命中
        </div>
    `;
    summaryText.textContent = `目前全體待命中（點我查看全體員工工作進度）`;
    summaryText.className = "mt-1.5 text-[11px] font-bold text-amber-100 bg-black/35 px-2.5 py-0.5 rounded";
    hudMiniBadge.classList.add('hidden');
}

function handleEmployeeClickFromOffice(empId) {
    triggerBossAssignInteraction(empId);
}

/**
 * Boss Walking Animation from Boss Station to Target Employee Desk
 */
function triggerBossAssignInteraction(empId) {
    playRetroSound('click');
    const emp = employees.find(e => e.id === empId);
    if (!emp) return;

    if (!appConfig.walkAnimationEnabled || isBossWalking) {
        openEmployeeChatModal(empId);
        return;
    }

    const viewport = document.getElementById('officeViewport');
    const bossDeskEl = document.getElementById('bossDeskElement');
    const targetDeskEl = document.getElementById(`empDesk_${empId}`);
    const walkingSprite = document.getElementById('walkingBossSprite');
    const walkingBubble = document.getElementById('walkingBossBubble');
    const bossSeated = document.getElementById('bossSeatedSprite');
    const bossAwaySign = document.getElementById('bossAwaySign');

    if (!viewport || !bossDeskEl || !targetDeskEl) {
        openEmployeeChatModal(empId);
        return;
    }

    isBossWalking = true;

    const viewportRect = viewport.getBoundingClientRect();
    const bossRect = bossDeskEl.getBoundingClientRect();
    const targetRect = targetDeskEl.getBoundingClientRect();

    const startX = (bossRect.left - viewportRect.left) + (bossRect.width / 2) - 34;
    const startY = (bossRect.top - viewportRect.top) + 18;

    const endX = (targetRect.left - viewportRect.left) + (targetRect.width / 2) + 18;
    const endY = (targetRect.top - viewportRect.top) + 6;

    bossSeated.classList.add('hidden');
    bossAwaySign.classList.remove('hidden');

    walkingBubble.textContent = `去找【${emp.name}】交辦任務！`;
    walkingSprite.style.transitionDuration = '0ms';
    walkingSprite.style.left = `${startX}px`;
    walkingSprite.style.top = `${startY}px`;
    walkingSprite.style.display = 'block';

    const stepInterval = setInterval(() => {
        playRetroSound('step');
    }, 220);

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            walkingSprite.style.transitionDuration = `${appConfig.walkDurationMs}ms`;
            walkingSprite.style.left = `${endX}px`;
            walkingSprite.style.top = `${endY}px`;
        });
    });

    setTimeout(() => {
        clearInterval(stepInterval);
        walkingBubble.textContent = `「這項任務交給你了！」`;
        triggerFloatingStat(empId, '🔥 任務指派!');

        setTimeout(() => {
            openEmployeeChatModal(empId);

            walkingBubble.textContent = `「好好表現！」`;
            walkingSprite.style.transitionDuration = `${Math.round(appConfig.walkDurationMs * 0.85)}ms`;
            walkingSprite.style.left = `${startX}px`;
            walkingSprite.style.top = `${startY}px`;

            setTimeout(() => {
                walkingSprite.style.display = 'none';
                bossSeated.classList.remove('hidden');
                bossAwaySign.classList.add('hidden');
                isBossWalking = false;
            }, Math.round(appConfig.walkDurationMs * 0.85));
        }, 380);
    }, appConfig.walkDurationMs);
}

function triggerFloatingStat(empId, text) {
    const popupHolder = document.getElementById(`empStatPopup_${empId}`);
    if (!popupHolder) return;
    popupHolder.innerHTML = `<div class="stat-popup pixel-font">${text}</div>`;
    setTimeout(() => {
        if (popupHolder) popupHolder.innerHTML = '';
    }, 1850);
}

const AMBIENT_BUBBLES = [
    "感覺不錯", "交給我改提示詞！", "交給我生圖！", "靈感湧現中",
    "喝杯咖啡☕", "邏輯超順暢", "效率+100%", "隨時待命中！"
];

function startAmbientOfficeLife() {
    setInterval(() => {
        const idleEmps = employees.filter(e => e.status === 'idle');
        if (idleEmps.length === 0) return;
        const randomEmp = idleEmps[Math.floor(Math.random() * idleEmps.length)];
        randomEmp.bubbleText = AMBIENT_BUBBLES[Math.floor(Math.random() * AMBIENT_BUBBLES.length)];
        renderOfficeEmployees();
    }, 5500);
}
