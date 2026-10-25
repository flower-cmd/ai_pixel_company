// =========================================================================
// 9. APPLICATION INITIALIZATION
// =========================================================================

window.addEventListener('DOMContentLoaded', () => {
    syncWalkToggleUI();
    renderOfficeEmployees();
    updateManagerIndicator();
    startAmbientOfficeLife();

    // Allow Ctrl+Enter or Cmd+Enter to submit task in chat textarea
    const chatTaskInput = document.getElementById('chatTaskInput');
    if (chatTaskInput) {
        chatTaskInput.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                handleSendTask();
            }
        });
    }
});
