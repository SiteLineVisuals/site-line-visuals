/**
 * Custom dropdown/select component.
 * Replaces native <select> in forms to avoid inconsistent / overflowing
 * native picker rendering on mobile browsers and dev-tools emulation.
 *
 * Markup contract (see index.html):
 * <div class="custom-select" data-name="fieldName">
 *   <button class="cs-trigger"><span class="cs-label">Placeholder</span><span class="cs-arrow">▼</span></button>
 *   <ul class="cs-options"><li data-value="x">Label</li>...</ul>
 *   <input type="hidden" name="fieldName" value="">
 * </div>
 */
(function () {
    function closeAll(except) {
        document.querySelectorAll(".custom-select.open").forEach((el) => {
            if (el !== except) el.classList.remove("open");
        });
    }

    function initCustomSelects() {
        const selects = document.querySelectorAll(".custom-select");

        selects.forEach((select) => {
            const trigger = select.querySelector(".cs-trigger");
            const label = select.querySelector(".cs-label");
            const options = select.querySelectorAll(".cs-options li");
            const hiddenInput = select.querySelector("input[type='hidden']");

            trigger.addEventListener("click", function (e) {
                e.stopPropagation();
                const isOpen = select.classList.contains("open");
                closeAll(select);
                select.classList.toggle("open", !isOpen);
            });

            options.forEach((option) => {
                option.addEventListener("click", function () {
                    const value = option.getAttribute("data-value");
                    const text = option.textContent;

                    label.textContent = text;
                    hiddenInput.value = value;
                    select.classList.add("has-value");
                    select.classList.remove("open");

                    options.forEach((o) => o.classList.remove("active"));
                    option.classList.add("active");

                    // Let other components (e.g. the Photo Guide modal) react to this selection
                    select.dispatchEvent(
                        new CustomEvent("cs:change", {
                            bubbles: true,
                            detail: {
                                name: select.getAttribute("data-name"),
                                value: value,
                                label: text
                            }
                        })
                    );
                });
            });
        });

        // Close any open custom-select when clicking elsewhere on the page
        document.addEventListener("click", function () {
            closeAll();
        });

        // Close on Escape
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") closeAll();
        });
    }

    document.addEventListener("DOMContentLoaded", initCustomSelects);
})();
