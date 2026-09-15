/**
 * Watch Video modal — opens a lightbox with the promo video.
 * Uses the approved Site Line Visuals promotional video.
 */
(function () {
    function init() {
        const trigger = document.getElementById("watchVideoBtn");
        const overlay = document.getElementById("videoModalOverlay");
        const closeBtn = document.getElementById("videoModalClose");
        const video = document.getElementById("heroVideoPlayer");

        if (!trigger || !overlay || !video) return;

        function openModal() {
            overlay.classList.add("open");
            document.body.style.overflow = "hidden";
            video.currentTime = 0;
            video.play().catch(() => {
            });
        }

        function closeModal() {
            overlay.classList.remove("open");
            document.body.style.overflow = "";
            video.pause();
        }

        trigger.addEventListener("click", openModal);
        closeBtn.addEventListener("click", closeModal);

        overlay.addEventListener("click", function (e) {
            if (e.target === overlay) closeModal();
        });

        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && overlay.classList.contains("open")) closeModal();
        });
    }

    document.addEventListener("DOMContentLoaded", init);
})();
