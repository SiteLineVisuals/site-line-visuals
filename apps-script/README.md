# Direct website inquiries — prepared, not activated

This isolated Google Apps Script application handles short contact and quote requests. It does not change the full project intake or create purchases, payment records or authorized projects.

## Customer experience

- Contact: name, email, optional phone and project ZIP, and question.
- Quote: the same contact details, optional project notes and carried-over package selections.
- Send directly; show receipt only after the server confirms storage.
- Preserve entered details on failure and retain the existing email fallback.

## Delivery

Store each request in a new `Website_Inquiries` tab of the existing Intake Responses spreadsheet. Notify `info@sitelinevisuals3d.com`, with the applicant as Reply-To. Calculate estimates from the approved public or contractor catalog rather than accepting submitted prices. The written proposal controls final scope and pricing. Duplicate request IDs do not create duplicate records or notifications.

## Activation steps

1. Create a standalone Apps Script project alongside the existing intake; add Code.gs, Catalog.gs and Inquiry.html.
2. Set script properties `SLV_INQUIRY_SHEET_ID` to the verified Intake Responses spreadsheet ID and `SLV_INQUIRY_RECIPIENT` to the company email above.
3. Deploy as a web app executing as the owner, with access suitable for public visitors. Grant only the required spreadsheet and mail permissions.
4. Confirm a clearly labeled test request produces exactly one spreadsheet row, one company notification, and a visible receipt. Confirm a retry with the same request ID does not duplicate delivery.
5. Verify public and contractor quote estimates, quantities, custom quotes, and error recovery in the deployed application.
6. Replace `DEPLOYMENT_URL_REQUIRED` in both js/inquiry.js files with the verified deployment URL.
7. Only then merge this branch to main. Confirm contact and quote requests on both websites.

The website draft currently contains a deliberate inactive endpoint marker. Do not merge or publish it before activation and delivery verification.

## Validation already performed

Mocked server tests passed for approved price calculations, quantities, invalid input, mutually exclusive selections, visualization prerequisites, duplicate protection, spreadsheet-formula escaping, saved records and notification-failure retention. These tests sent no real email. JavaScript syntax and contact-page integration checks passed. Real Google delivery and iPad browser testing remain pending.

## Rollback

Main remains unchanged during preparation. After activation, revert the inquiry integration commit to restore the existing email-based quote request. Preserve received inquiry records; do not delete the tab during rollback.
