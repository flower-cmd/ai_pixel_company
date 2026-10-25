// =========================================================================
// 1. GLOBAL CONFIGURATION, STORAGE HANDLES & UTILITIES
// =========================================================================

const appConfig = {
    apiKey: localStorage.getItem('pixel_ai_api_key') || '',
    geminiModel: localStorage.getItem('pixel_ai_model') || 'gemini-2.5-flash',
    imageModel: localStorage.getItem('pixel_ai_image_model') || 'gemini-2.5-flash-image',
    githubToken: localStorage.getItem('pixel_ai_github_token') || '',
    githubRepo: localStorage.getItem('pixel_ai_github_repo') || '',
    githubBranch: localStorage.getItem('pixel_ai_github_branch') || 'main',
    walkAnimationEnabled: localStorage.getItem('pixel_ai_walk_enabled') !== 'false',
    walkDurationMs: parseInt(localStorage.getItem('pixel_ai_walk_duration') || '950', 10),
    soundEnabled: localStorage.getItem('pixel_ai_sound_enabled') !== 'false'
};

// Runtime UI state
let isBossWalking = false;
let activeEmployeeId = null;
let selectedAvatarKeyForForm = 'editor_glasses';

// File System Access API Handle for local `image/` folder (Desktop Chrome/Edge)
let localImageDirHandle = null;

function saveConfigToStorage() {
    localStorage.setItem('pixel_ai_api_key', appConfig.apiKey);
    localStorage.setItem('pixel_ai_model', appConfig.geminiModel);
    localStorage.setItem('pixel_ai_image_model', appConfig.imageModel);
    localStorage.setItem('pixel_ai_github_token', appConfig.githubToken);
    localStorage.setItem('pixel_ai_github_repo', appConfig.githubRepo);
    localStorage.setItem('pixel_ai_github_branch', appConfig.githubBranch);
    localStorage.setItem('pixel_ai_walk_enabled', String(appConfig.walkAnimationEnabled));
    localStorage.setItem('pixel_ai_walk_duration', String(appConfig.walkDurationMs));
    localStorage.setItem('pixel_ai_sound_enabled', String(appConfig.soundEnabled));
}

// =========================================================================
// INDEXEDDB PERSISTENCE FOR LOCAL `image/` DIRECTORY HANDLE
// =========================================================================

function openHandleDB() {
    return new Promise((resolve, reject) => {
        if (!window.indexedDB) {
            resolve(null);
            return;
        }
        const req = indexedDB.open('pixel_ai_company_db', 1);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('handles')) {
                db.createObjectStore('handles');
            }
        };
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror = () => resolve(null);
    });
}

async function saveDirHandleToIDB(handle) {
    const db = await openHandleDB();
    if (!db) return;
    return new Promise((resolve) => {
        const tx = db.transaction('handles', 'readwrite');
        tx.objectStore('handles').put(handle, 'local_image_dir');
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
    });
}

async function restoreDirHandleFromIDB() {
    const db = await openHandleDB();
    if (!db) return;
    return new Promise((resolve) => {
        const tx = db.transaction('handles', 'readonly');
        const req = tx.objectStore('handles').get('local_image_dir');
        req.onsuccess = () => {
            if (req.result) {
                localImageDirHandle = req.result;
                updateImageStorageStatusUI();
            }
            resolve();
        };
        req.onerror = () => resolve();
    });
}

/**
 * Let user pick the local `image/` folder via Browser File System Access API
 */
async function bindLocalImageFolder() {
    playRetroSound('click');
    if (typeof window.showDirectoryPicker !== 'function') {
        showToast('📱 目前裝置瀏覽器不支援直接綁定本機資料夾，請使用 GitHub 自動存檔或直接下載圖片！');
        return false;
    }
    try {
        const handle = await window.showDirectoryPicker({
            id: 'pixel_ai_image_folder',
            mode: 'readwrite'
        });
        localImageDirHandle = handle;
        await saveDirHandleToIDB(handle);
        updateImageStorageStatusUI();
        showToast(`📂 已成功綁定本機資料夾：「${handle.name}」！`);
        return true;
    } catch (err) {
        if (err.name !== 'AbortError') {
            showToast(`⚠️ 無法綁定本機資料夾：${err.message}`);
        }
        return false;
    }
}

function updateImageStorageStatusUI() {
    const localBadge = document.getElementById('bannerLocalFolderStatus');
    const settingsLocalBadge = document.getElementById('settingsLocalFolderStatus');
    const githubBadge = document.getElementById('bannerGithubFolderStatus');

    const localText = localImageDirHandle
        ? `✅ 已綁定 (${localImageDirHandle.name}/)`
        : (typeof window.showDirectoryPicker === 'function' ? '尚未綁定本機 image 資料夾' : '手機/行動端 (使用 GitHub 或下載)');

    if (localBadge) {
        localBadge.textContent = localText;
        localBadge.className = localImageDirHandle
            ? 'text-emerald-800 font-black'
            : 'text-amber-900 font-bold';
    }
    if (settingsLocalBadge) {
        settingsLocalBadge.textContent = localImageDirHandle
            ? `✅ 已綁定資料夾：${localImageDirHandle.name}`
            : '尚未綁定（點擊右側按鈕選擇專案下的 image 資料夾）';
    }

    if (githubBadge) {
        const hasGithub = Boolean(appConfig.githubToken && appConfig.githubRepo);
        githubBadge.textContent = hasGithub
            ? `✅ 已啟用 (${appConfig.githubRepo}/image)`
            : '未設定';
        githubBadge.className = hasGithub
            ? 'text-emerald-800 font-black'
            : 'text-stone-600 font-bold';
    }
}

// =========================================================================
// COMMON UI HELPERS
// =========================================================================

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
    }, 2800);
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
