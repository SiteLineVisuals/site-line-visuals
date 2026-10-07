/**
 * Contact page "Send Us a Message" form handler.
 *
 * TODO(client/dev): wire this up to a real backend (e.g. the same Apps
 * Script pattern used for the intake, or a service like Formspree). Until
 * then this only prevents a dead submit and gives the visitor honest
 * feedback instead of a silent no-op.
 *
 * Note: main.js already attaches a generic no-op submit handler to every
 * form.intake-form (this form included) for the still-unconnected intake
 * flow. Both handlers currently run harmlessly side by side; once real
 * delivery is wired up here, remove this form from that generic handler
 * in main.js (or vice versa) so there's only one source of truth.
 */
(function () {
    function init() {
        var form = document.getElementById('contactForm');
        var status = document.getElementById('contactFormStatus');
        if (!form) return;

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            status.classList.remove('success', 'error');
            status.textContent = "Thanks — your message is ready to send. (Form delivery isn't wired up yet; please also reach out via the Start Your Project button above so we don't miss you.)";
            status.classList.add('show', 'success');
            form.reset();
        });
    }

    document.addEventListener('DOMContentLoaded', init);
})();