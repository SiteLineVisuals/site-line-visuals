/**
 * Photo Guide modal — pops up during the intake flow to show the customer
 * what photos to take, room by room, before they upload files.
 *
 * Triggers:
 *  1. Manual — clicking the "View Photo Guide" link next to the upload zone.
 *  2. Automatic — the first time the customer sets Project Type to
 *     "Existing Home Listing" in the intake form (the scenario where they'll
 *     be uploading their own photos rather than us capturing the site).
 *
 * Per client direction: these guides are NOT static homepage content —
 * they only appear contextually during intake.
 */
(function () {
    let activeRoom = null;
    let hasAutoOpened = false;

    function getEls() {
        return {
            overlay: document.getElementById("pgModalOverlay"),
            closeBtn: document.getElementById("pgModalClose"),
            tabs: document.getElementById("pgModalTabs"),
            body: document.getElementById("pgModalBody"),
            trigger: document.getElementById("pgTriggerBtn")
        };
    }

    function buildTabs(tabsEl) {
        if (!window.PhotoGuideComponent) return;
        const keys = PhotoGuideComponent.roomKeys();
        tabsEl.innerHTML = keys
            .map(
                (key) =>
                    `<button type="button" class="pg-tab" data-room="${key}">${PhotoGuideComponent.roomLabel(key)}</button>`
            )
            .join("");
    }

    function renderRoom(roomKey) {
        const { tabs, body } = getEls();
        if (!window.PhotoGuideComponent) return;

        activeRoom = roomKey;
        body.innerHTML = PhotoGuideComponent.renderRoom(roomKey);

        tabs.querySelectorAll(".pg-tab").forEach((tab) => {
            tab.classList.toggle("active", tab.getAttribute("data-room") === roomKey);
        });

        body.scrollTop = 0;
    }

    function openModal(preferredRoom) {
        const { overlay, tabs } = getEls();
        if (!overlay) return;

        if (!tabs.children.length) {
            buildTabs(tabs);
        }

        const firstRoom = window.PhotoGuideComponent ? PhotoGuideComponent.roomKeys()[0] : null;
        renderRoom(preferredRoom || activeRoom || firstRoom);

        overlay.classList.add("open");
        document.body.style.overflow = "hidden";
    }

    function closeModal() {
        const { overlay } = getEls();
        if (!overlay) return;
        overlay.classList.remove("open");
        document.body.style.overflow = "";
    }

    function init() {
        const { overlay, closeBtn, tabs, trigger } = getEls();
        if (!overlay) return;

        if (trigger) {
            trigger.addEventListener("click", function () {
                openModal();
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener("click", closeModal);
        }

        overlay.addEventListener("click", function (e) {
            if (e.target === overlay) closeModal();
        });

        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && overlay.classList.contains("open")) closeModal();
        });

        if (tabs) {
            tabs.addEventListener("click", function (e) {
                const tab = e.target.closest(".pg-tab");
                if (tab) renderRoom(tab.getAttribute("data-room"));
            });
            tabs.addEventListener("wheel", function (e) {
                if (e.deltaY !== 0) {
                    e.preventDefault();
                    this.scrollLeft += e.deltaY;
                }
            });
        }

        // Reference "Upload Image" button — content is re-rendered via
        // innerHTML on every room switch, so we delegate from the body
        // container instead of binding to elements that get replaced.
        const { body } = getEls();
        if (body) {
            body.addEventListener("click", function (e) {
                const uploadBtn = e.target.closest("#refUploadBtn");
                if (!uploadBtn) return;
                const fileInput = uploadBtn.querySelector("#refFileInput");
                if (fileInput) fileInput.click();
            });

            body.addEventListener("change", function (e) {
                if (e.target && e.target.id === "refFileInput" && e.target.files.length) {
                    const label = e.target.closest("#refUploadBtn").querySelector(".up-label");
                    if (label) label.textContent = e.target.files[0].name;
                }
            });
        }

        // Auto-open the guide the first time "Existing Home Listing" is selected
        document.addEventListener("cs:change", function (e) {
            const { name, value } = e.detail;
            if (name === "projectType" && value === "existing-home" && !hasAutoOpened) {
                hasAutoOpened = true;
                openModal();
            }
        });
    }

    document.addEventListener("DOMContentLoaded", init);
})();