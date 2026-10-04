# Offline Acceptance Tests — Manual Checklist

**Build:** `npx serve dist` (exported build)  
**Test environment:** Chrome DevTools Network tab set to **Offline**  
**Date:** ________________  
**Tester:** ________________

---

## Test Setup

1. Export the build: `npx expo export --platform web`
2. Serve locally: `npx serve dist`
3. Open in Chrome at `http://localhost:3000`
4. Load each role once while online to populate cache
5. Then proceed with each test step below

---

## Acceptance Tests 1–10

| # | Test | Expected Result | Pass | Fail | Notes |
|---|---|---|---|---|---|
| 1 | **Load online, then disconnect and reopen/refresh** — Set DevTools **Network** tab throttling to Offline, then press F5 or close and reopen the tab. (Application → Service Workers → "Offline" or a dropped Wi-Fi also work: the app checks if Supabase is reachable within ~15 s.) | Patient Home and care information display with an offline banner and last-updated time; no blank screen or generic browser error | ☐ | ☐ | |
| 2 | **Create a help request while offline** — Switch to Patient role, tap "I need help" (or equivalent button), select a reason (e.g. "transport"), optionally add a message, then submit | The request displays "Saved on this device" → "Waiting to send" | ☐ | ☐ | |
| 3 | **Refresh or close and reopen while still offline** — With DevTools still Offline, refresh the page or close and reopen the tab | The request is still listed as "Waiting to send" with its original content and created-on-device time intact | ☐ | ☐ | |
| 4 | **Restore connectivity with app open** — In DevTools Network tab, change from Offline back to normal (or selected throttle) while the app is running | The request is delivered without re-entry and shows "Received in demo clinic inbox" | ☐ | ☐ | |
| 5 | **Check inbox and BHW queue after delivery** — Switch to BHW role and then to Admin/RHU role to view the demo clinic inbox | Exactly one inbox record exists and exactly one BHW work item exists for the same request | ☐ | ☐ | |
| 6 | **Tap Try again repeatedly, or toggle connectivity on/off during sending** — While the request is sending (or after a send), toggle DevTools Offline on and off several times, or tap "Try again" on the request multiple times | Still exactly one inbox record and one BHW work item exist; no duplicates | ☐ | ☐ | |
| 7 | **Simulate a send failure** — With the app online, artificially block the sync (e.g., set DevTools to Offline before the app attempts the next retry, or disable the sync endpoint) | The request shows "Send failed" with a visible "Try again" button and the request is not lost | ☑ | ☐ | **VERIFIED IN CHROME:** Blocked only `/rest/v1/help_requests`; the saved request changed to "Not sent yet. Try again.", retained its reason/message/time, and showed Try again. A retry while blocked made a second delivery attempt without losing the request. After unblocking, Try again reached "Received in demo clinic inbox". No page errors. |
| 8 | **Refresh each workspace after creating demo records** — In each role (Patient, BHW, Admin), create a sample record (measurement, visit note, assignment, or plan), then refresh the page | Measurements, visit notes, assignments and plans persist after refresh in local storage | ☑ | ☐ | **AUTOMATED TEST:** All BHW visits, Admin assignments, Clinical data persist after F5. All Patient tabs (Home, My Health, Care Plan, Profile, YAKAP) load without white screens. Care Plan persists after F5. Minor: Filipino title "Naka-save sa device na ito" not visible (deferred). |
| 9 | **Review help-request copy** — Read the help request form, confirmation messages, status display and any related guidance | Nothing implies live emergency monitoring or a guaranteed response time; urgent-care guidance is shown where applicable | ☑ | ☐ | **VERIFIED IN CHROME:** The rendered form says this is not an emergency service, identifies the demo inbox, says nobody watches it live and no response time is set, and directs urgent cases to the nearest hospital emergency room or 911. Filipino urgent-care guidance is also rendered. |
| 10 | **Use Reset demo data** — Find and tap the "Reset demo data" button (usually in settings or a demo control panel) | The synthetic starting state is restored; all demo records return to their initial seeded state for the next run | ☑ | ☐ | **VERIFIED IN CHROME:** Created a non-seed request, confirmed the reset warning, and invoked reset through `/demo`. The RPC deleted the marker; exactly two canonical seed requests and their statuses were restored. Juana, 132/84 vitals, released plan and "No requests yet" rendered correctly. Demo cache/outbox keys were cleared while an unrelated localStorage key was preserved. No page errors. |

---

## Summary

**Total Passed:** _____ / 10  
**Total Failed:** _____ / 10  

**Blocker issues:**
- [ ] None
- [ ] (Describe any critical failures below)

```
[Describe blockers and critical failures here]
```

**Non-critical observations:**

```
- Test #2: Filipino translation line ("Naka-save sa device na ito") did not render under
  "Saved on this device" in HelpRequestSheet.tsx. Deferred — fix after all 10 tests pass.
```

---

## Tester Sign-Off

- **Offline banner visible & correctly worded:** Yes / No
- **Transport status chips use shared dictionary:** Yes / No
- **No red "offline" branding (offline is calm/slate):** Yes / No
- **Last-updated times accurate & visible:** Yes / No
- **All demo roles load without errors:** Yes / No

**Approved for demo:** ☐ Yes ☐ No

**Sign-off:** ________________ **Date:** ________________

