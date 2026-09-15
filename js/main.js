document.addEventListener("DOMContentLoaded", function () {
    if (!document.body.id) document.body.id = "top";

    /* PREVENT NATIVE FORM SUBMISSION (INTAKE + CONTACT) */
    document.querySelectorAll("form.intake-form").forEach((form) => {
        form.addEventListener("submit", function (e) {
            e.preventDefault();
            console.log("Form submit intercepted (no backend connected yet).");
        });
    });

    /* MOBILE HAMBURGER MENU */
    const hamburgerBtn = document.getElementById("hamburgerBtn");
    const mainNav = document.getElementById("mainNav");
    const navOverlay = document.getElementById("navOverlay");

    function openMenu() {
        mainNav.classList.add("open");
        hamburgerBtn.classList.add("active");
        navOverlay.classList.add("active");
        hamburgerBtn.setAttribute("aria-expanded", "true");
        document.documentElement.classList.add("no-scroll");
        document.body.classList.add("no-scroll");
    }

    function closeMenu() {
        mainNav.classList.remove("open");
        hamburgerBtn.classList.remove("active");
        navOverlay.classList.remove("active");
        hamburgerBtn.setAttribute("aria-expanded", "false");
        document.documentElement.classList.remove("no-scroll");
        document.body.classList.remove("no-scroll");
        document.querySelectorAll(".has-dropdown.open").forEach((el) => {
            el.classList.remove("open");
        });
    }

    if (hamburgerBtn && mainNav && navOverlay) {
        hamburgerBtn.addEventListener("click", function () {
            const isOpen = mainNav.classList.contains("open");
            isOpen ? closeMenu() : openMenu();
        });

        navOverlay.addEventListener("click", closeMenu);

        mainNav.querySelectorAll("a:not(.dropdown-toggle)").forEach((link) => {
            link.addEventListener("click", closeMenu);
        });

        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") closeMenu();
        });
    }

    /* DROPDOWN MENUS */
    const dropdownParents = document.querySelectorAll(".has-dropdown");
    dropdownParents.forEach((parent) => {
        const toggle = parent.querySelector(".dropdown-toggle");
        toggle.addEventListener("click", function (e) {
            if (window.innerWidth <= 1024) {
                e.preventDefault();
                const isOpen = parent.classList.contains("open");
                dropdownParents.forEach((p) => {
                    if (p !== parent) p.classList.remove("open");
                });
                parent.classList.toggle("open", !isOpen);
            }
        });
    });

    /* DRAG & DROP / CLICK-TO-BROWSE UPLOAD ZONE */
    const uploadZone = document.getElementById("uploadZone");
    const fileInput = document.getElementById("fileInput");
    const fileListEl = document.getElementById("uploadFileList");

    if (uploadZone && fileInput) {
        uploadZone.addEventListener("click", function (e) {
            if (e.target !== fileInput) fileInput.click();
        });

        ["dragenter", "dragover"].forEach((evt) => {
            uploadZone.addEventListener(evt, function (e) {
                e.preventDefault();
                e.stopPropagation();
                uploadZone.classList.add("drag-over");
            });
        });

        ["dragleave", "drop"].forEach((evt) => {
            uploadZone.addEventListener(evt, function (e) {
                e.preventDefault();
                e.stopPropagation();
                uploadZone.classList.remove("drag-over");
            });
        });

        uploadZone.addEventListener("drop", function (e) {
            const files = e.dataTransfer.files;
            if (files && files.length) {
                fileInput.files = files;
                renderFileList(files);
            }
        });

        fileInput.addEventListener("change", function () {
            renderFileList(fileInput.files);
        });

        function renderFileList(files) {
            if (!fileListEl) return;
            fileListEl.innerHTML = "";
            Array.from(files).forEach((file) => {
                const chip = document.createElement("div");
                chip.className = "file-chip";
                chip.innerHTML = `<span>${file.name}</span><span>${(file.size / 1024).toFixed(0)} KB</span>`;
                fileListEl.appendChild(chip);
            });
        }
    }

    /* SCROLL-REVEAL ANIMATION */
    const revealEls = document.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window && revealEls.length) {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("in-view");
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.15 }
        );
        revealEls.forEach((el) => observer.observe(el));
    } else {
        revealEls.forEach((el) => el.classList.add("in-view"));
    }

    window.addEventListener("resize", function () {
        if (window.innerWidth > 1024) closeMenu();
    });

    /* SMOOTH-SCROLL FOR IN-PAGE ANCHOR LINKS */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#' || !targetId) return;
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                const headerOffset = 110;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.scrollY - headerOffset;
                window.scrollTo({ top: offsetPosition, behavior: "smooth" });
            }
        });
    });

    /* GENERIC MODAL SYSTEM (RESTORED TO ORIGINAL CLEAN STATE) */
    function initModal({ modalId, closeId, triggerSelector }) {
        const modal = document.getElementById(modalId);
        if (!modal) return null;

        const closeBtn = closeId ? document.getElementById(closeId) : null;
        const triggers = triggerSelector ? document.querySelectorAll(triggerSelector) : [];

        function open(e) {
            if (e) e.preventDefault();
            document.documentElement.classList.add("no-scroll");
            document.body.classList.add("no-scroll");
            modal.classList.add("active");
        }

        function close() {
            modal.classList.remove("active");
            document.documentElement.classList.remove("no-scroll");
            document.body.classList.remove("no-scroll");
        }

        triggers.forEach((btn) => btn.addEventListener("click", open));
        if (closeBtn) closeBtn.addEventListener("click", close);

        modal.addEventListener("click", function (e) {
            if (e.target === modal) close();
        });

        return { open, close };
    }

    // Initialize "START YOUR PROJECT" modal (desktop) + new-tab fallback (mobile)
    const projectModal = initModal({
        modalId: "projectModal",
        closeId: "projectModalClose",
        triggerSelector: null
    });

    (function () {
        const FORM_URL = "https://script.google.com/macros/s/AKfycbxZFA-LA6kgTBS8Hre0f7ZmTF-DIvrzijr5NN31QNaYdLXiHhJIJ-e5nPq87_2ZK53G/exec";
        const isMobile = () => window.matchMedia("(max-width: 768px)").matches;
        const projectTriggers = document.querySelectorAll(".project-modal-trigger");
        const projectIframe = document.querySelector("#projectModal .form-modal-iframe");

        let formWindow = null;
        let pollTimer = null;

        function showReturnMessage() {
            const toast = document.createElement("div");
            toast.textContent = "Thanks for checking out the form! We'll be in touch soon.";
            toast.style.cssText = "position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#151a1e;color:#fff;padding:14px 22px;border-radius:8px;border:1px solid rgba(103,194,32,0.4);font-size:14px;z-index:99999;box-shadow:0 8px 24px rgba(0,0,0,0.5);max-width:90vw;text-align:center;";
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 6000);
        }

        function freshFormUrl() {
            return FORM_URL + "?start=1&t=" + Date.now();
        }

        function openFormNewTab() {
            if (formWindow && !formWindow.closed) {
                formWindow.location.href = freshFormUrl();
                formWindow.focus();
                return;
            }
            formWindow = window.open(freshFormUrl(), "_blank");
            if (pollTimer) clearInterval(pollTimer);
            pollTimer = setInterval(function () {
                if (formWindow && formWindow.closed) {
                    clearInterval(pollTimer);
                    showReturnMessage();
                }
            }, 500);
        }

        projectTriggers.forEach((btn) => {
            btn.addEventListener("click", function (e) {
                e.preventDefault();
                if (!isMobile() && projectModal) {
                    if (projectIframe) {
                        projectIframe.style.visibility = "hidden";
                        projectIframe.addEventListener("load", function revealFreshIntake() {
                            projectIframe.style.visibility = "visible";
                        }, { once: true });
                        projectIframe.src = freshFormUrl();
                    }
                    projectModal.open(e);
                } else {
                    openFormNewTab();
                }
            });
        });
    })();

    // Initialize "REALTOR SERVICES" modal
    initModal({
        modalId: "realtorModal",
        closeId: "realtorModalClose",
        triggerSelector: ".realtor-modal-trigger"
    });

    /* REALTOR / QUOTE BUILDER */
    const serviceOptions = document.querySelectorAll(".service-option");
    const quoteTotalEl = document.getElementById("quoteTotalValue");

    function updateQuoteTotal() {
        let total = 0;
        serviceOptions.forEach((opt) => {
            const checkbox = opt.querySelector('input[type="checkbox"]');
            if (!checkbox) return;
            if (checkbox.checked) {
                total += parseInt(checkbox.value, 10) || 0;
                opt.classList.add("selected");
            } else {
                opt.classList.remove("selected");
            }
        });
        if (quoteTotalEl) quoteTotalEl.textContent = `$${total}`;
    }

    serviceOptions.forEach((opt) => {
        const checkbox = opt.querySelector('input[type="checkbox"]');
        if (!checkbox) return;
        checkbox.addEventListener("change", updateQuoteTotal);
    });

    const quoteContinueBtn = document.getElementById("quoteContinueBtn");
    if (quoteContinueBtn) {
        quoteContinueBtn.addEventListener("click", function () {
            const selected = [];
            serviceOptions.forEach((opt) => {
                const checkbox = opt.querySelector('input[type="checkbox"]');
                if (checkbox && checkbox.checked) {
                    selected.push({ name: checkbox.dataset.name, price: checkbox.value });
                }
            });
            console.log("Realtor quote — selected services:", selected, "Total:", quoteTotalEl ? quoteTotalEl.textContent : "$0");
        });
    }

});

// FAQ Accordion
document.addEventListener("DOMContentLoaded", function() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        item.addEventListener('toggle', function() {
            if (this.open) {
                faqItems.forEach(otherItem => {
                    if (otherItem !== this) {
                        otherItem.removeAttribute('open');
                    }
                });
            }
        });
    });
});

/* SITE-WIDE WAYFINDING
   Keep important destinations consistent without duplicating markup on every page. */
document.addEventListener("DOMContentLoaded", function () {
    const navList = document.querySelector(".main-nav .nav-list");
    if (navList && !navList.querySelector('a[href="join-team.html"]')) {
        const item = document.createElement("li");
        item.innerHTML = '<a href="join-team.html">JOIN OUR TEAM</a>';
        navList.appendChild(item);
    }
    document.querySelectorAll(".main-nav .dropdown-menu").forEach((menu) => {
        const parentLink = menu.closest(".has-dropdown")?.querySelector(":scope > a");
        if (parentLink && /SERVICES/i.test(parentLink.textContent) && !menu.querySelector('a[href*="3d-printed-models"]')) {
            const item = document.createElement("li");
            item.innerHTML = '<a href="services.html#3d-printed-models">3D Printed Scale Models</a>';
            menu.appendChild(item);
        }
    });

    document.querySelectorAll("[data-href]").forEach((card) => {
        const destination = card.getAttribute("data-href");
        if (!destination) return;
        card.classList.add("interactive-card");
        card.setAttribute("role", "link");
        card.setAttribute("tabindex", "0");
        const go = () => { window.location.href = destination; };
        card.addEventListener("click", (event) => {
            if (!event.target.closest("a, button, input, select, textarea")) go();
        });
        card.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                go();
            }
        });
    });

    const backToTop = document.createElement("button");
    backToTop.className = "back-to-top";
    backToTop.type = "button";
    backToTop.setAttribute("aria-label", "Back to top");
    backToTop.innerHTML = '<span aria-hidden="true">↑</span><span>Top</span>';
    document.body.appendChild(backToTop);
    const updateTopButton = () => backToTop.classList.toggle("is-visible", window.scrollY > 650);
    window.addEventListener("scroll", updateTopButton, { passive: true });
    updateTopButton();
    backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

    if (!document.querySelector(".mobile-quick-nav")) {
        const quickNav = document.createElement("nav");
        quickNav.className = "mobile-quick-nav";
        quickNav.setAttribute("aria-label", "Quick navigation");
        quickNav.innerHTML = [
            '<a href="packages.html">Packages</a>',
            '<a href="examples.html">Examples</a>',
            '<a href="https://script.google.com/a/macros/sitelinevisuals3d.com/s/AKfycbz71U5INv9AdQohMYs-zPgChKcAfuir9EBifocUbyRALp9pKCNi-VTh82mvklUXR22r/exec" class="project-modal-trigger">Start Project</a>'
        ].join("");
        document.body.appendChild(quickNav);
    }
});
