// =========================================================================
// 3. PIXEL ART CHARACTER SPRITE TEMPLATES
// =========================================================================

const PIXEL_AVATARS = {
    // #1 Prompt Editor: Smart Glasses & Emerald Scarf Editor
    editor_glasses: `
        <svg class="w-full h-full" viewBox="0 0 16 16" shape-rendering="crispEdges">
            <rect x="4" y="1" width="8" height="3" fill="#451a03"/>
            <rect x="3" y="2" width="1" height="4" fill="#451a03"/>
            <rect x="12" y="2" width="1" height="4" fill="#451a03"/>
            <rect x="4" y="4" width="8" height="4" fill="#fed7aa"/>
            <rect x="4" y="5" width="3" height="2" fill="#0284c7"/>
            <rect x="9" y="5" width="3" height="2" fill="#0284c7"/>
            <rect x="7" y="5" width="2" height="1" fill="#38bdf8"/>
            <rect x="3" y="8" width="10" height="5" fill="#10b981"/>
            <rect x="5" y="8" width="6" height="2" fill="#fef08a"/>
        </svg>`,
    // #2 Yellow Box-Head Robot
    yellow_robot: `
        <svg class="w-full h-full" viewBox="0 0 16 16" shape-rendering="crispEdges">
            <rect x="3" y="1" width="10" height="7" fill="#facc15"/>
            <rect x="3" y="1" width="10" height="1" fill="#a16207"/>
            <rect x="5" y="4" width="2" height="2" fill="#1e293b"/>
            <rect x="9" y="4" width="2" height="2" fill="#1e293b"/>
            <rect x="6" y="6" width="4" height="1" fill="#713f12"/>
            <rect x="3" y="8" width="10" height="5" fill="#dc2626"/>
            <rect x="6" y="9" width="4" height="3" fill="#facc15"/>
        </svg>`,
    // #3 Cute Bear Suit
    bear_suit: `
        <svg class="w-full h-full" viewBox="0 0 16 16" shape-rendering="crispEdges">
            <rect x="3" y="1" width="2" height="2" fill="#d97706"/>
            <rect x="11" y="1" width="2" height="2" fill="#d97706"/>
            <rect x="4" y="2" width="8" height="6" fill="#f59e0b"/>
            <rect x="5" y="4" width="2" height="2" fill="#1e293b"/>
            <rect x="9" y="4" width="2" height="2" fill="#1e293b"/>
            <rect x="6" y="5" width="4" height="3" fill="#fef3c7"/>
            <rect x="7" y="5" width="2" height="1" fill="#1e293b"/>
            <rect x="3" y="8" width="10" height="5" fill="#d97706"/>
            <rect x="5" y="9" width="6" height="4" fill="#fef3c7"/>
        </svg>`,
    // #4 Blue Luchador Wrestler Mask
    blue_mask: `
        <svg class="w-full h-full" viewBox="0 0 16 16" shape-rendering="crispEdges">
            <rect x="4" y="1" width="8" height="7" fill="#0284c7"/>
            <rect x="6" y="1" width="4" height="2" fill="#facc15"/>
            <rect x="4" y="4" width="3" height="2" fill="#fed7aa"/>
            <rect x="9" y="4" width="3" height="2" fill="#fed7aa"/>
            <rect x="5" y="4" width="1" height="2" fill="#1e293b"/>
            <rect x="10" y="4" width="1" height="2" fill="#1e293b"/>
            <rect x="6" y="6" width="4" height="1" fill="#f43f5e"/>
            <rect x="3" y="8" width="10" height="5" fill="#334155"/>
            <rect x="7" y="8" width="2" height="4" fill="#38bdf8"/>
        </svg>`,
    // #5 Blonde Designer Girl
    blonde_designer: `
        <svg class="w-full h-full" viewBox="0 0 16 16" shape-rendering="crispEdges">
            <rect x="4" y="1" width="8" height="3" fill="#facc15"/>
            <rect x="3" y="2" width="2" height="6" fill="#facc15"/>
            <rect x="11" y="2" width="2" height="6" fill="#facc15"/>
            <rect x="5" y="4" width="6" height="4" fill="#fed7aa"/>
            <rect x="5" y="5" width="2" height="2" fill="#1e293b"/>
            <rect x="9" y="5" width="2" height="2" fill="#1e293b"/>
            <rect x="3" y="8" width="10" height="5" fill="#ec4899"/>
            <rect x="4" y="9" width="8" height="2" fill="#a3e635"/>
        </svg>`,
    // #6 White Headscarf / Desert Tycoon Guru
    white_headgear: `
        <svg class="w-full h-full" viewBox="0 0 16 16" shape-rendering="crispEdges">
            <rect x="3" y="1" width="10" height="7" fill="#f8fafc"/>
            <rect x="4" y="2" width="8" height="1" fill="#eab308"/>
            <rect x="5" y="4" width="6" height="4" fill="#e0ab76"/>
            <rect x="5" y="5" width="2" height="1" fill="#1e293b"/>
            <rect x="9" y="5" width="2" height="1" fill="#1e293b"/>
            <rect x="6" y="7" width="4" height="1" fill="#451a03"/>
            <rect x="3" y="8" width="10" height="5" fill="#fef9c3"/>
            <rect x="6" y="8" width="4" height="5" fill="#ca8a04"/>
        </svg>`,
    // #7 Cute Monkey Coder
    monkey_coder: `
        <svg class="w-full h-full" viewBox="0 0 16 16" shape-rendering="crispEdges">
            <rect x="2" y="3" width="2" height="3" fill="#78350f"/>
            <rect x="12" y="3" width="2" height="3" fill="#78350f"/>
            <rect x="4" y="1" width="8" height="7" fill="#78350f"/>
            <rect x="5" y="3" width="6" height="5" fill="#fde68a"/>
            <rect x="5" y="4" width="2" height="2" fill="#1e293b"/>
            <rect x="9" y="4" width="2" height="2" fill="#1e293b"/>
            <rect x="3" y="8" width="10" height="5" fill="#92400e"/>
            <rect x="6" y="9" width="4" height="3" fill="#fde68a"/>
        </svg>`,
    // #8 Purple Headphones QA Hacker
    purple_hacker: `
        <svg class="w-full h-full" viewBox="0 0 16 16" shape-rendering="crispEdges">
            <rect x="4" y="1" width="8" height="3" fill="#1e1b4b"/>
            <rect x="2" y="3" width="2" height="4" fill="#a855f7"/>
            <rect x="12" y="3" width="2" height="4" fill="#a855f7"/>
            <rect x="4" y="4" width="8" height="4" fill="#fed7aa"/>
            <rect x="5" y="5" width="2" height="2" fill="#1e293b"/>
            <rect x="9" y="5" width="2" height="2" fill="#1e293b"/>
            <rect x="3" y="8" width="10" height="5" fill="#7e22ce"/>
            <rect x="6" y="8" width="4" height="5" fill="#f3e8ff"/>
        </svg>`
};
