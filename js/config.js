// =========================================================================
// 1. GLOBAL CONFIGURATION & UTILITIES
// =========================================================================

const appConfig = {
    apiKey: localStorage.getItem('pixel_ai_api_key') || '',
    geminiModel: localStorage.getItem('pixel_ai_model') || 'gemini-2.5-flash',
    walkAnimationEnabled: localStorage.getItem('pixel_ai_walk_enabled') !== 'false',
    walkDurationMs: parseInt(localStorage.getItem('pixel_ai_walk_duration') || '950', 10),
    soundEnabled: localStorage.getItem('pixel_ai_sound_enabled') !== 'false'
};

// Runtime UI state
let isBossWalking = false;
let activeEmployeeId = null;
let selectedAvatarKeyForForm = 'editor_glasses';

function saveConfigToStorage() {
    localStorage.setItem('pixel_ai_api_key', appConfig.apiKey);
    localStorage.setItem('pixel_ai_model', appConfig.geminiModel);
    localStorage.setItem('pixel_ai_walk_enabled', String(appConfig.walkAnimationEnabled));
    localStorage.setItem('pixel_ai_walk_duration', String(appConfig.walkDurationMs));
    localStorage.setItem('pixel_ai_sound_enabled', String(appConfig.soundEnabled));
}

function showToast(message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'kairo-panel !bg-[#3d2516] !text-amber-200 px-4 py-2.5 text-xs sm:text-sm font-black shadow-lg flex items-center gap-2';
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.25s ease';
        setTimeout(() => toast.remove(), 250);
    }, 2600);
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatSimpleMarkdown(str) {
    const safe = escapeHtml(str);
    return safe.replace(/\*\*(.*?)\*\*/g, '<strong class="text-amber-900 font-black">$1</strong>');
}

function copyString(str) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(str).then(() => {
            playRetroSound('click');
            showToast('📋 已複製到剪貼簿！');
        }).catch(() => fallbackCopyString(str));
    } else {
        fallbackCopyString(str);
    }
}

function fallbackCopyString(str) {
    const ta = document.createElement('textarea');
    ta.value = str;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    playRetroSound('click');
    showToast('📋 已複製到剪貼簿！');
}
