# Tuloy: Three-Team Product and Brand Brief

Version 2 • 4 October 2026 • Feature and experience proposal for the hackathon

This brief consolidates the patient, BHW and RHU workspaces into one service. It describes proposed user-facing behavior and team responsibilities; it does not implement source code or select a technical stack. Existing Tuloy/SuriHatid work remains the starting point. The priorities below are recommendations for this iteration, not a claim that every feature already exists.

**What changed in Version 2:** local storage and offline-first behavior are now part of Tuloy's main feature, not an optional extra. Section 7 defines the required offline journey, its scope, team ownership and acceptance tests. Section 8 adds offline branding. Section 9 adds the offline demo steps and an updated definition of completion.

## 1. Shared product promise

**Help people take the next step in preventive care—and help their care team follow through, even without a stable connection.**

Use Tuloy as the shared product identity: Tuloy Patient, Tuloy BHW and Tuloy RHU. If retained, SuriHatid should identify the existing screening/diagnostics module within that identity. Avoid presenting three unrelated products.

The central experience is a YAKAP checkup and screening navigator supported by a personal health record, BHW follow-through and clinician review. The app supports early detection by helping patients reach appropriate assessment and complete follow-up; collecting measurements alone does not establish a diagnosis.

Offline-first is part of that promise. A patient who has opened Tuloy before can still see their next care step and ask for help when the connection drops, and the request reaches the care team once connectivity returns.

Do not state that most Filipinos have never been screened without a traceable study, population, date and definition of screening. The defensible product problem is that people can miss preventive care and lose continuity between consultation, testing and follow-up.

## 2. Three teams, distinct responsibilities

| Workspace | Main user and question | Foundational screens | Responsibility |
|---|---|---|---|
| Patient | What should I do next? | Home; My Health; YAKAP & Clinics; Care Plan | Patient records, reminders, next steps, selective sharing, requests for assistance and the offline help-request outbox |
| BHW | Who needs help today? | Today; My Patients; Patient Visit | Assigned worklist, assisted registration, measurements, attendance confirmation, outreach, barriers and received help requests |
| RHU | Where is care getting stuck? | Needs Attention; Assignments; Summary; restricted Clinical Review | Ownership and exception handling, service information, clinical assessment, released plans and the demo clinic inbox |

The RHU team owns two permission-based experiences: **coordinator** and **clinician**. They may be in the same project, but an operations administrator cannot diagnose, prescribe or sign clinical assessments merely because they have administrative access. Clinical authority follows professional role and local practice.

Patient-approved sharing and role permissions determine who can access information. Routine BHW updates reach authorized care-team members without an RHU coordinator manually forwarding them. Clinicians release their assessments and care instructions. Patients continue to see their own submitted documents and measurements; pending clinical interpretation must be clearly labeled.

## 3. Flagship feature: YAKAP checkup and screening navigator

Suggested patient-facing title: **My YAKAP Checkup**. Supporting copy: “Get help accessing YAKAP benefits and completing your next care step.” Avoid a blanket promise that every requested test, medicine or clinic service is free.

PhilHealth's published FAQ describes benefits according to patient need and doctor recommendation. Its December 2025 member advisory distinguishes clinic selection, a first patient encounter and the empanelment slip. These are reasons to track separate milestones rather than treating an in-app selection as official enrollment. [2–3]

| Stage shown to patient | Patient action | Care-team action |
|---|---|---|
| Need help getting started | View official enrollment guidance; find a clinic; ask BHW for help | Help resolve membership or access questions through the appropriate official channel |
| Clinic selected; confirmation pending | Save chosen clinic and contact details | Verify the local record against clinic confirmation; do not claim official integration |
| First checkup planned | See date, location and clinic-provided preparation instructions | Confirm appointment or record that scheduling is still pending |
| Checkup and risk assessment | Attend consultation and have applicable measurements recorded | Record encounter and clinician assessment; confirm empanelment separately when completed |
| Tests requested, if needed | View clinician-requested tests and where to obtain them | Record referral, destination and due date; offer help with access barriers |
| Results available; review pending | Upload original report or ask for assisted entry | Check transcription and route to the responsible clinician |
| Plan available | Read the clinician-released assessment and next steps | Release care plan; record medicine access needs where prescribed |
| Continued monitoring | See the next follow-up; record requested measurements | Follow through and reassess according to the care plan |

The path branches: a patient who does not need testing proceeds to the next appropriate care step. Medicines/GAMOT are conditional on prescription and applicable benefit arrangements. Completed upload is not completed clinical review.

Each next-step card shows: the action, clinic or responsible person, date if known, status and a help button. Allow “I already attended,” “I need another date,” and “I need help.” A patient-reported attendance update stays distinguishable from clinic-confirmed attendance. Rescheduling closes or updates the old reminder instead of generating repeated overdue tasks. The help button works offline (Section 7).

Use due dates from confirmed appointments or clinician plans. Do not invent a universal screening interval or automatically label every adult overdue for every test. For people whose history is unknown, offer assistance arranging a preventive checkup.

Care Finder entries show service, address, contact details, accreditation source where applicable, available assistance, source and last-verified date. Unknown availability remains unknown. Opening a clinic card does not book an appointment. Official PhilHealth enrollment and dispensing remain outside the prototype unless a real, authorized connection is separately established.

## 4. Patient workspace

**Home prioritizes action over statistics.** Show the next care step first, followed by upcoming follow-up, latest dated measurements and review status. Do not produce a general “healthy” score from incomplete records. Home and care information must remain readable offline after the app has been loaded once (Section 7).

My Health includes blood pressure and available glucose results, height, weight and uploaded laboratory reports. Glucose entries preserve test type and units; other laboratory values preserve their reported units and context. Liver and lipid records can be stored when available without implying that everyone needs those tests. Trends must distinguish measurement dates, stale records and missing data. An absent reading is not zero.

Digital clearbook behavior:

1. Capture or upload the original document.
2. Enter values manually, or use optional OCR to propose fields.
3. Confirm the patient, test date, value, units and test type against the original.
4. Save confirmed transcription with its source; retain the original.
5. Show clinical interpretation as a separate review status.

Checking transcription does not establish the report's authenticity or a diagnosis. Unconfirmed OCR output must not enter clinical trend calculations or risk assessment. Manual entry and document-only storage remain available if OCR fails.

Use **clinician review and sign-off**, rather than clinician authentication, for the approval step. Authentication establishes who is using the system; review evaluates the record and proposed assessment.

Possible ML remains an experimental extension. It may assist a clinician's review, with input sources, limitations and model status visible. Do not show an unvalidated disease probability or label a patient as diagnosed. Clinician sign-off does not itself prove model accuracy. A useful foundational demo works with measurements, review queues and clinician-entered plans before ML is added.

## 5. BHW workspace

Today lists assigned patients needing a scheduled visit, attendance confirmation, result follow-up or help overcoming a barrier. Every work item has an owner, due date when applicable and one next action. Separate “attendance not yet confirmed” from “confirmed missed appointment.” No response is not evidence of non-adherence or disease.

Patient help requests received by the demo clinic inbox appear in the BHW queue as owned work items, showing the patient, request reason, when it was created on the patient's device and when it was received. The two timestamps stay separate so a request created offline hours earlier is not mistaken for a new one.

Add Patient supports a patient QR and an assisted/manual route for people without smartphones. Scanning locates a patient reference; staff still confirm identity and authorized access. The QR should not expose the patient's health history or function as blanket consent.

A patient visit allows permitted measurements, a contact outcome, a barrier and the next action to be recorded together. Suggested outcomes include contacted, could not reach, patient-reported attendance, clinic-confirmed attendance, rescheduled and help needed. Use barrier options such as transport, unavailable appointment, laboratory access, document help and medicine access.

Escalate a persistent operational blockage to the RHU coordinator. Clinical concerns go to an authorized clinician through locally agreed workflows. Neither an offline queue nor a routine inbox should imply live emergency monitoring.

Keep medical inventory as a stretch feature: a full stock ledger creates reconciliation work. Initially, a BHW can record “patient needs help obtaining prescribed medicine” as an owned task without claiming current stock availability.

## 6. RHU workspace and meaningful percentages

Start with **Needs Attention**, then Assignments and Summary. Exceptions include unassigned work, overdue review, unresolved access barriers and staff absence. The clinician sees a separate restricted review queue. Operational coordinators see the information necessary to resolve coordination issues; broad clinical document access is not the default.

| Metric | Definition for the selected period/cohort | Action after selecting it |
|---|---|---|
| First-checkup completion | Tracked people with confirmed first checkup ÷ tracked people in the selected onboarding cohort | Find who needs scheduling or attendance confirmation |
| Confirmed follow-up attendance | Due follow-ups with confirmed attendance ÷ all tracked follow-ups due in the period | Separate unknown, confirmed missed, rescheduled and completed cases |
| Clinical review completion | Received result sets with completed required review ÷ received result sets requiring review | Route pending reviews to the authorized clinician |
| Task ownership coverage | Open tasks with an active assigned owner ÷ all open tasks | Assign or reassign remaining tasks |

Show both counts and percentages: “18 of 30 (60%).” A zero denominator displays “No cases,” not 0%. Every metric identifies period, cohort, source freshness and unknown records. Follow-up breakdowns must reconcile to the denominator and avoid counting the same appointment twice. Patients transferred out or excluded must follow one shared, visible cohort rule.

Use counts and aging for unresolved barriers and overdue reviews. These often guide work better than another percentage. Do not call the dashboard municipal disease prevalence, screening coverage for all residents, or NCD control unless the data and denominator support those claims. Aggregate operational views should not become a public ranking of BHWs.

**Staffing feasibility is conditional.** Name an existing coordinator and backup only after confirming capacity and protected time. Configure response hours and absence coverage. Reduce work through event-generated tasks, a single combined contact update and summaries built from existing workflow entries. Routine updates need no separate admin approval or duplicate daily report.

A pilot should measure actual admin minutes, duplicate entries, unresolved queue age, BHW time and clinician response delays. If work arrives faster than the team can resolve it, reduce scope or secure capacity before expanding. Software cannot create clinical staffing.

## 7. Offline-first core: local storage and the help-request journey

Local storage and offline-first behavior are a **main feature** of this iteration. They are required for the foundation and the shared demonstration.

### 7.1 Required offline journey

1. The patient opens the previously loaded app without internet.
2. Cached Patient Home and care information remain accessible.
3. A help request is saved locally.
4. It displays **Saved on this device → Waiting to send**.
5. When connectivity returns, it is delivered once.
6. It becomes **Received in demo clinic inbox** and appears in the BHW queue.

“Received in demo clinic inbox” confirms delivery only. Staff acknowledgment and any action on the request are separate later events.

### 7.2 Scope

**In scope (required):**

- All demo records use persistent local storage and survive a page refresh or app restart on the demo device.
- The app and the patient's last-loaded Home, next step, follow-up and care plan remain viewable offline, with a visible last-updated time.
- Only the help-request pathway requires an offline send/retry queue.
- Each help request carries a unique identifier created on the device. The demo clinic inbox accepts a given identifier once, so retries, double taps or connectivity flapping never create duplicate inbox records or duplicate BHW work items.
- The status changes to “Received in demo clinic inbox” only after the inbox confirms receipt, not merely when sending starts.
- Sending is attempted when the app is open and connectivity returns, and from a manual **Try again** action.

**Deferred (not part of this iteration):**

- Cloud synchronization of records.
- Cross-device conflict detection and resolution.
- Background sending while the app is closed.
- Backup and restore of local data.

Other records (measurements, visit notes, documents, assignments, plans) are saved to persistent local storage and survive refresh, but they do not need an outgoing send queue in this iteration. Do not label them as sent or synchronized.

### 7.3 Offline behavior by activity

| Activity | Offline behavior | What remains pending |
|---|---|---|
| Open the app and read previously available records | Show the cached app, permitted cached information and last update time | New clinic or schedule changes are unavailable until refreshed |
| Ask for help | Save the request locally and place it in the outgoing queue; show “Saved on this device → Waiting to send” | Delivery to the demo clinic inbox, then staff acknowledgment |
| Add measurement, visit note or document | Save to persistent local storage with clear confirmation | Remote upload and synchronization (deferred) |
| View follow-up | Show last-known schedule | New appointment or rescheduling confirmation |
| Use OCR | Offer it only if available in the current mode; allow manual entry | Any extraction requiring connectivity |

Keep transport and care statuses separate: “Saved on this device,” “Waiting to send,” “Received in demo clinic inbox,” and “Reviewed by clinician” are different events. Show send errors with a **Try again** action and retain the request. When cross-device synchronization is built later, conflicting schedule changes must require confirmation rather than silent replacement.

### 7.4 Team ownership

| Team | Owns | Must hand off |
|---|---|---|
| Patient | Offline-readable Patient Home and care information; help-request form; local outbox, retry and transport status display | A help request with a unique ID, patient reference, reason, device-created time and status |
| BHW | Display of received help requests in the BHW queue as owned work items; persistent local storage of BHW visit records | Owner, next action and acknowledgment state for each received request |
| RHU | Demo clinic inbox: receipt confirmation, once-only acceptance by request ID and routing to the BHW queue; persistent local storage of assignments and plans | Receipt confirmation back to the patient outbox; unassigned requests surfaced in Needs Attention |
| All three (shared) | One local-storage naming convention, the shared status dictionary, the synthetic sample patient and a visible **Reset demo data** control | Agreed before teams build independently |

Build one outbox mechanism, owned by the Patient team, instead of three separate implementations.

### 7.5 Acceptance tests

| # | Test | Pass condition |
|---|---|---|
| 1 | Load the app online, then disconnect and reopen or refresh | Patient Home and care information display with an offline indicator and last-updated time; no blank screen or generic browser error |
| 2 | Create a help request while offline | It shows “Saved on this device,” then “Waiting to send” |
| 3 | Refresh or close and reopen the app while still offline | The request is still listed as “Waiting to send” with its original content and created time |
| 4 | Restore connectivity with the app open | The request is delivered without re-entry and shows “Received in demo clinic inbox” |
| 5 | Check the inbox and BHW queue after delivery | Exactly one inbox record and one BHW work item exist |
| 6 | Tap **Try again** repeatedly, or toggle connectivity on and off during sending | Still exactly one inbox record and one BHW work item |
| 7 | Simulate a send failure | The request shows “Send failed” with **Try again** and is not lost |
| 8 | Refresh each workspace after creating demo records | Measurements, visit notes, assignments and plans persist |
| 9 | Review help-request copy | Nothing implies live emergency monitoring or guaranteed response time; urgent-care guidance is shown |
| 10 | Use **Reset demo data** | The synthetic starting state is restored for the next run |

### 7.6 Safety and privacy

Offline storage of health records needs device access protection and appropriate sign-out behavior. Do not promise immediate deletion of already cached data on another offline device after access is revoked. Local reminders must be described according to the behavior actually demonstrated; do not claim guaranteed background alerts, background sending or SMS delivery merely because an item was saved. The help request is a request for assistance, not an emergency channel; show where to seek urgent care.

## 8. Shared brand and interaction rules

Proposed tagline: **Alaga, tuloy-tuloy.** Tone: calm, respectful and practical. Avoid guilt-inducing language such as “non-compliant patient.” Explain the next action using familiar words.

| Token | Proposed color | Use |
|---|---|---|
| Primary | Teal #0F766E | Main actions and active navigation |
| Main text | Navy #16324F | Titles, labels and body text |
| Background | Off-white #F8FAFC | Page canvas |
| Surface | White #FFFFFF | Cards and forms |
| Supporting text | Slate #475569 | Dates, units, source notes and offline/saved-locally states |
| Pending/attention | Amber #B45309 | Pending action, including “Waiting to send,” with explicit text and icon |
| Urgent/error | Red #B91C1C | Errors such as “Send failed,” or urgency under an approved workflow |
| Completed | Green #166534 | Confirmed completion, including “Received in demo clinic inbox,” with text and icon |

Validate contrast for actual foreground/background combinations. Colors alone never convey status or disease. All three workspaces use the same logo, typeface, spacing, buttons, icons, measurement cards and status vocabulary. Use one readable sans-serif family, approximately 16px body text, clear hierarchy and generous touch areas as design targets.

Patient and BHW layouts prioritize mobile use; RHU prioritizes tables and queues with a usable narrow-screen view. All share component behavior. Use English/Filipino labels consistently; further local-language support is an extension. A date format such as “04 Oct 2026” avoids numeric ambiguity. Always show units and whether a time is appointment time, measurement time, created-on-device time or last update time.

### 8.1 Offline branding

Offline is a normal, expected state, not a failure. Present it calmly and consistently across all three workspaces.

- **Offline banner:** a slim, non-blocking slate or navy banner with a no-connection icon: “You're offline. Your saved information is still here. Requests will send when you reconnect.” Do not use red for being offline.
- **Last updated:** cached screens show “Last updated 04 Oct 2026, 9:15 AM” near the content they describe.
- **Transport status chips**, each with text and an icon:

| Status | Color | Icon | Suggested copy |
|---|---|---|---|
| Saved on this device | Slate | Phone/device | “Saved on this device” |
| Waiting to send | Amber | Clock | “Waiting to send — will send when you're online” |
| Sending | Teal | Upward arrow | “Sending…” |
| Send failed | Red | Alert + retry | “Not sent yet. Try again.” |
| Received in demo clinic inbox | Green | Check | “Received in demo clinic inbox” |

- **Filipino labels:** provide paired labels (for example “Naka-save sa device na ito” and “Naghihintay maipadala”) and have native speakers confirm wording before the demo.
- **Supporting line:** “Tuloy ang alaga, kahit offline” may accompany the offline banner or onboarding as a brand expression of the tagline; it must not promise delivery while the device is offline.
- Use the same chip component for help requests in the patient view and for received items in the BHW queue and RHU inbox.

### 8.2 Status dictionary

Choose one shared status dictionary, divided by meaning:

- Transport: saved on this device, waiting to send, sending, received in demo clinic inbox, send failed.
- Encounter: requested, confirmed, patient-reported attended, clinic-confirmed attended, missed, rescheduled.
- Clinical: transcription pending, awaiting clinical review, plan released.
- Coordination: unassigned, assigned, acknowledged, blocked, completed.

Do not reuse one generic “complete” flag for all four.

## 9. Build priorities and shared demonstration

**Foundation:** shared identity/components; persistent local storage for all demo records; offline-readable Patient Home and care information; the offline help-request outbox with once-only delivery to the demo clinic inbox and BHW queue; patient clearbook and manual measurements; YAKAP next-step card and clinic information; BHW patient/task list and assisted onboarding; clinician review/released plan; RHU exceptions/assignment; visible offline, transport and sharing states; simple operational counts.

**If time remains:** OCR assistance; patient QR; richer trend charts; extra language support; printable visit summaries; consented messaging integration; medicine-availability information with a named maintainer; experimental ML with appropriate evaluation. A full stock-management module should follow after the screening-to-follow-up journey works.

**Deferred beyond this iteration:** cloud synchronization, cross-device conflict resolution, background sending and backup/restore (Section 7.2).

Patient QR can be moved into the foundation if another registration feature is removed; it must not displace assisted registration. Likewise, retain a working manual record flow before spending time on OCR. Offline help-request delivery must not be cut to make room for stretch features.

Shared demo scenario: a person feeling well asks for a preventive checkup; a BHW helps with clinic access; a confirmed visit produces measurements and, if indicated, a test request; results reach a clinician; the clinician releases a plan; the patient sees the next step; a missed follow-up creates owned outreach; RHU intervenes only when that work is unassigned or blocked. Use synthetic records and clearly mark simulated actions.

### 9.1 Offline demo steps

1. Reset demo data. Open Tuloy Patient online so the app and Patient Home load.
2. Turn off connectivity on the demo device and show it is offline.
3. Refresh or reopen the app. Show the offline banner, Patient Home, next step, care plan and last-updated time.
4. Tap **I need help**, choose a reason and submit. Show “Saved on this device → Waiting to send.”
5. Refresh again to show the request survived.
6. Optionally tap **Try again** while offline to show the request stays queued and is not lost.
7. Restore connectivity. Show the status change to “Received in demo clinic inbox.”
8. Switch to Tuloy BHW. Show exactly one new work item with created-on-device and received times, then assign or acknowledge it.
9. Switch to Tuloy RHU. Show the inbox record and that it is no longer unassigned.

Narrate that background sending, cloud sync and cross-device conflicts are deferred, and that the inbox is a demo inbox.

### 9.2 Definition of complete

Before teams build independently, agree on the same sample patient, record labels, timestamps, status definitions, local-storage conventions, component examples and handoff outcomes.

A handoff is complete when the next role can identify the patient, see the relevant authorized information, identify the next action and know who owns it.

The iteration is complete when:

1. The shared demo scenario runs end to end with synthetic records.
2. All demo records persist across refresh in every workspace.
3. The offline help-request journey (Section 7.1) passes all acceptance tests in Section 7.5 on the demo device.
4. Each help request is delivered once and appears once in both the demo clinic inbox and the BHW queue.
5. Offline, transport, encounter, clinical and coordination states use the shared dictionary and offline branding.
6. The demonstration includes one offline help request with a retry and one unknown-attendance case.
7. Deferred capabilities are not presented as working.

## 10. Source notes

Program facts and product recommendations are distinct. The workflow, team split, design system, offline scope and priority decisions above are proposals. Program details must be kept aligned with the clinic's current official process before a real deployment.

1. PhilHealth, YAKAP official overview and linked program information: https://www.philhealth.gov.ph/yakap/
2. PhilHealth Advisory 2025-0071, dated 22 December 2025, member empanelment process: https://www.philhealth.gov.ph/advisories/2025/PA2025-0071.pdf
3. PhilHealth, YAKAP FAQ, dated 31 July 2025, benefit scope and clinician-directed services: https://www.philhealth.gov.ph/yakap/YAKAP_FAQs.pdf
4. Community Health Toolkit reference apps, background inspiration from the earlier project review: https://docs.communityhealthtoolkit.org/reference-apps/

The older FAQ is not treated as a complete current benefit schedule. The prototype should link to official information and identify when clinic information was last verified, rather than hard-code universal eligibility, prices, test intervals or medicine entitlements.
