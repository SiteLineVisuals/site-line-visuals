/**
 * Renders a Photo Guide block's markup for a given room.
 * Used by js/photo-guide-modal.js to inject content into the
 * intake-flow modal (guides are NOT shown as static homepage content —
 * per client direction, they appear during the intake/upload steps).
 */
window.PhotoGuideComponent = (function () {
    function renderReferenceBlock() {
        return `
            <div class="reference-box">
                <h4><span class="ref-icon">🖼️</span> REFERENCE (OPTIONAL):</h4>
                <div class="ref-content">
                    <p>Upload a reference image if you have a preferred style, finish, or look you want us to match.</p>
                    <div class="upload-btn" id="refUploadBtn">
                        <span class="up-icon">☁️</span>
                        <span class="up-label">Upload Image</span>
                        <input type="file" id="refFileInput" accept="image/*" hidden>
                    </div>
                </div>
            </div>`;
    }

    function renderRoom(roomKey) {
        const room = ROOM_GUIDES[roomKey];
        if (!room) return "";

        const itemsHtml = room.items
            .map(
                (item, i) => `
                <li>
                    <span class="step-num">${i + 1}</span> ${item}
                    <span class="cam-icon">📷</span>
                </li>`
            )
            .join("");

        const tipsHtml = room.tips.map((tip) => `<li>${tip}</li>`).join("");

        const captureHtml = CAPTURE_STEPS.map(
            (step, i) => `
                <div class="cap-step">
                    <div class="cap-num">${i + 1}</div>
                    <div class="cap-icon">${step.icon}</div>
                    <span>${step.label}</span>
                </div>
                ${i < CAPTURE_STEPS.length - 1 ? '<div class="cap-arrow">----&gt;</div>' : ""}`
        ).join("");

        return `
        <div class="guide-card">
            <div class="guide-main-content">
                <div class="guide-sidebar">
                    <h2 class="guide-title">${room.title}<br><span class="text-green">${room.titleAccent}</span></h2>
                    <div class="take-photos-list">
                        <h4>TAKE PHOTOS OF:</h4>
                        <ul>${itemsHtml}</ul>
                    </div>
                    <div class="tips-box">
                        <h4><span class="tips-icon">📷</span> TIPS:</h4>
                        <ul>${tipsHtml}</ul>
                    </div>
                    ${room.showReference ? renderReferenceBlock() : ""}
                </div>
                <div class="guide-image-area">
                    <img src="${room.image}" alt="${room.imageAlt}">
                </div>
            </div>
            <div class="guide-footer">
                <h4 class="footer-title">HOW TO CAPTURE</h4>
                <div class="capture-steps">${captureHtml}</div>
            </div>
        </div>`;
    }

    function roomKeys() {
        return Object.keys(ROOM_GUIDES);
    }

    function roomLabel(roomKey) {
        const room = ROOM_GUIDES[roomKey];
        return room ? room.title : roomKey;
    }

    return { renderRoom, roomKeys, roomLabel };
})();
