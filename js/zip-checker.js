/**
 * ZIP / service-area checker (homepage).
 * North Idaho launch-area ZIP codes synchronized from the approved
 * Intake Form Settings spreadsheet, Active_ZIPs tab.
 */
(function () {
    var IN_AREA_ZIPS = [
        '83801', '83803', '83804', '83809', '83810', '83811', '83812', '83813',
        '83814', '83815', '83821', '83822', '83833', '83835', '83836', '83837',
        '83839', '83842', '83846', '83848', '83850', '83852', '83854', '83856',
        '83858', '83860', '83864', '83868', '83869', '83873', '83874', '83876'
    ];

    function init() {
        var form = document.getElementById('zipCheckerForm');
        var result = document.getElementById('zipResult');
        if (!form) return;

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var zipInput = document.getElementById('zipInput');
            var zip = zipInput ? zipInput.value.trim() : '';

            result.classList.remove('in-area', 'out-area');

            if (!/^\d{5}$/.test(zip)) {
                result.textContent = 'Please enter a valid 5-digit ZIP code.';
                result.classList.add('show', 'out-area');
                return;
            }

            if (IN_AREA_ZIPS.indexOf(zip) !== -1) {
                result.textContent = "Yes — you're in our service area.";
                result.classList.add('show', 'in-area');
            } else {
                result.textContent = "Not currently in our confirmed service area.";
                result.classList.add('show', 'out-area');
            }
        });
    }

    document.addEventListener('DOMContentLoaded', init);
})();
