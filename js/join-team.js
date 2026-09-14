document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("joinTeamForm");
    if (!form) return;
    form.addEventListener("submit", function (event) {
        event.preventDefault();
        if (!form.reportValidity()) return;
        const data = new FormData(form);
        const subject = `Join Our Team — ${data.get("interest")} — ${data.get("name")}`;
        const body = [
            `Name: ${data.get("name")}`,
            `Email: ${data.get("email")}`,
            `Phone: ${data.get("phone") || "Not provided"}`,
            `Current location: ${data.get("location")}`,
            `Preferred market: ${data.get("market")}`,
            `Interest: ${data.get("interest")}`,
            "",
            "Experience:",
            data.get("experience")
        ].join("\n");
        window.location.href = `mailto:info@sitelinevisuals3d.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
});
