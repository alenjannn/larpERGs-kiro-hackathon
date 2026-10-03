# Tuloy — Final Prototype Product and Brand Brief, Revision 6

**Tagline:** Alaga, tuloy-tuloy.  
**Updated:** 4 October 2026, Asia/Manila  
**Planning constraint:** Four people, 11 elapsed hours.  
**Document status:** Final agreed prototype scope and implementation handoff; application implementation and testing are not claimed by this document.

This revision replaces the attached v5 prompt in full. The existing filename is retained for continuity; the content is Revision 6. It supersedes v5 requirements for mandatory trained ML, full mapping, granular sharing grants, specimen logistics, broad offline support, and the longer demonstration. Do not combine both versions into one build list.

Use this brief to align the prototype before preparing step-by-step Kiro prompts. It defines what users see, what actions do, and the minimum shared behavior. Inspect the actual source before choosing implementation details. Earlier references to React/Vite/Dexie describe a presumed baseline, not inspected code.

## 1. One product story

> **Tuloy helps BHWs follow through on screening and follow-up needs, with clinician-reviewed care plans and RHU intervention when work is unassigned or blocked.**

Early detection is supported by helping people reach primary-care assessment and complete clinician-requested next steps. The prototype does not detect or diagnose disease itself. The patient view makes the next action understandable; the BHW view makes follow-through actionable; the RHU view exposes work requiring intervention.

The central demonstration is one patient's help request, one owned BHW response, an existing result set reviewed by a clinician, and a transport barrier that remains visible until addressed. A released plan must not make an unresolved transport problem disappear.

### Evidence and differentiation

One traceable historical pitch anchor: WHO's **2023 Philippines hypertension profile**, using **2019 estimates**, reports that **52% of the estimated 14.5 million adults aged 30–79 with hypertension were diagnosed**. This supports an unmet assessment need; it does not establish that most Filipinos have never been screened, that fragmentation caused undiagnosed disease, or that Tuloy improves detection. Identify both the publication and estimate years when using it. [Source: WHO profile](https://www.who.int/publications/m/item/hypertension-phl-2023-country-profile), [profile collection](https://www.who.int/docs/default-source/ncds/ncd-surveillance/hypertension-profiles-2023.pdf).

Suggested opening: “WHO's 2023 profile estimated that only 52% of Filipino adults aged 30–79 with hypertension were diagnosed in 2019. Tuloy focuses on the follow-through: an owned task, a reviewed plan, and RHU help when care gets stuck.”

Describe the proposed distinction as **a focused BHW-to-RHU follow-through experience around a Philippine primary-care journey**. Do not claim care coordination is new: Community Health Toolkit already documents supervision and community workflows. Do not claim to replace PhilHealth registration channels, iClinicSys, existing EMRs, or e-referral systems. Local workflow validation and system comparison remain necessary before claiming a proven deployment gap.

## 2. Three workspaces, four roles, one application

“Three projects” means three experience ownership areas within one application, with shared records and components. The hackathon demo uses one browser and an explicitly labeled role switcher. It does not require three deployments or cross-device synchronization.

| Workspace | Role | Main responsibility | Boundary |
|---|---|---|---|
| Patient | Patient, with BHW assistance available | See next steps and released plans; request help; report attendance | Cannot confirm clinic attendance or release a clinical plan |
| BHW | Assigned BHW | Follow up assigned patients, record observations and barriers, request support | Cannot diagnose, prescribe, or sign clinical plans |
| RHU | Coordinator | Assign uncovered work, arrange support, follow up stalled handoffs | Cannot sign plans or view full medical documents by default |
| RHU | Clinician | Review assigned results and concerns; release the patient-facing plan | Clinical authority is separate from administrative access |

The RHU workspace has **Coordination** and **Clinical Review** views. The demo switcher explicitly selects the corresponding role. Someone playing both must deliberately switch roles; a coordinator button must not silently acquire clinician authority.

“Filtering information” means scoped visibility and clinician release of interpretations. Routine patient–BHW updates do not wait for coordinator approval. Coordinator access shows operational facts such as owner, delay, barrier, and next action, without automatically exposing results or clinical notes.

Use synthetic data and predefined role visibility. Label this **“Demo role access; no real authentication.”** Enforce role rules in shared application actions as well as the UI, but do not describe browser-only checks as production security. Patient-controlled sharing, expiry, and revocation are deferred, not silently simulated as completed functionality.

## 3. Frozen feature scope

| Feature | Required prototype behavior | Scope limit |
|---|---|---|
| Patient next-step dashboard | Next action, date if known, facility, contact route, help button, four YAKAP milestones | No broad statistics dashboard or health score |
| Patient care plan | Read clinician-released instructions and who released them | Draft clinical notes remain hidden |
| Help requests | “I need help,” “I cannot attend,” or “Please contact me”; assigned response task after demo receipt | No scheduled messaging campaign or live SMS |
| BHW Today list | Assigned work, due/overdue indicator, owner, next action, requests awaiting contact | No separate full caseload-management product |
| BHW patient visit panel | Record contact outcome, attendance evidence, barrier, observation, next action and next-check date | No automatic diagnosis or visit confirmation |
| Clinician review | Open seeded result set and original; record disposition; release plan and next follow-up | No new laboratory workflow |
| RHU Needs Attention | Unassigned, overdue, blocked work; aging; support and reassignment actions | Routine care does not pass through an approval gate |
| RHU operational summary | Actionable counts plus one confirmed-attendance percentage | No extra KPI suite or cohort selectors |
| Offline help-request queue | Local save, waiting, retry, acknowledged receipt into the simulated clinic inbox | No general offline-sync or conflict-resolution system |
| Small source-record panel | Open a seeded synthetic report; manually enter/check a relevant value against it | No new camera/OCR/document-wallet subsystem |
| Care Finder cards | Two or three static fictional clinic/service cards with source and freshness labels; request assistance | No interactive map, live booking, or nationwide database |

The four CHT-inspired candidates are retained in bounded form: monitoring through a clinician-defined next task; missed-follow-up recovery through contact and attendance outcomes; patient check-ins through user-initiated help requests; supervision through the RHU exception queue. Automated recurring schedules, nonresponse campaigns, and complex assignment proposals are deferred.

If prior features already work, preserve their source and data. Keep them out of primary demo navigation unless they fit this brief without extending the sprint. Do not delete existing clinical histories or attachments merely to simplify the presentation. **SuriHatid specimen logistics is parked**; do not budget for unverified reusable code.

## 4. Screen and interaction contract

Build **five primary views**, using small drawers, tabs, and dialogs for supporting actions. Do not turn each row below into several routes.

### A. Patient Home

Order content by usefulness:

1. **My next step:** action, date or “Date not yet arranged,” clinic, responsible worker, and “I need help.” A requested date must not look like a confirmed appointment.
2. **My YAKAP Checkup:** four compact milestones with the current next step.
3. **My care plan:** a summary and a drawer containing the released plan; otherwise “Awaiting clinician review.”
4. **Latest recorded measurements:** optional compact rows for available BP/glucose/weight/height with dates, units, and source. Show only available records; no trend chart, inferred normality, or pressure to fill every measurement.
5. **Clinic information:** collapsed Care Finder cards and a request-assistance action.

Help is a short form: reason, optional short note, optional link to the current visit, and submit. BHW-assisted submission records who assisted and must not require the patient to own a smartphone, email address, or PhilHealth number merely to use the synthetic prototype. Creating a Tuloy profile does not register anyone with PhilHealth.

After submission, show the exact delivery status and responsible team where known. Receipt is not a promise of a response time.

### B. BHW Today

One worklist with filters such as **Due today**, **Overdue**, and **Needs contact**; an assigned-patient search can reuse this page. Each row shows patient reference/name within scope, task type, due date, owner, one next action, and barrier if present.

Unknown attendance after a visit becomes due produces **Verify attendance** work. A documented missed visit produces **Arrange follow-up** work. A passed appointment time alone does not prove nonattendance. Use one open task for the same issue; retries and repeated app openings must not duplicate it.

### C. BHW Patient Visit

Open from Today. Show the current task, released instructions, relevant source/measurement panel, and a short history. The action form records:

| Field | Choices or behavior |
|---|---|
| Contact outcome | Not attempted, attempted but not reached, reached |
| Attendance | Unknown, patient reports attended, clinic confirms attended, clinic confirms missed; record source and time |
| Barrier | None reported, transport, schedule, service unavailable, unable to contact, other |
| Observation | Optional permitted measurement with value, unit, observed time, context and recorder |
| Next action | Short actionable instruction and responsible worker |
| Next check | Explicit staff-set date; no invented clinical interval |
| Need RHU support | Adds the same unresolved task to Needs Attention with a reason |

The attendance form labels clinic confirmation as **“Record clinic-confirmed evidence”** and requires the reporting clinic/person or source; a BHW cannot upgrade their assumption to confirmation. A patient's report can be retained even when provider confirmation is unknown.

Checking a transcribed value against the original is separate from clinical review and issuer authenticity. Unknown units/dates remain unknown; do not guess handwriting. Corrections preserve prior values and who corrected them.

For monitoring, a released plan specifies the next task, responsible BHW and date. Record an observation or contact outcome against it; create an owned clinician review request when staff explicitly request review. Use the same clinical queue. No automated medical threshold engine or recurrence scheduler is required.

### D. RHU Clinical Review

Show pending result sets and manually routed concerns for the clinician's assigned cases. The review panel includes the seeded source report, checked values with provenance, relevant observations, and prior released instructions.

The clinician records a disposition: **Plan ready**, **More information needed**, or **Consultation needed**. Unfinished review retains a named owner and next check. A disposition is not generated from a transport barrier.

The release form asks **What to do / When / Where / Whom to contact**, plus the next monitoring or follow-up task if needed. Explicit release records clinician identity, time, and plan version. Publishing the same version twice creates no duplicate tasks.

Only released content enters the patient care-plan drawer. Preserve older released versions when an update is made. A coordinator or BHW attempting to release a plan is denied in the shared action handler, not merely hidden from the button.

Releasing the plan neither confirms attendance nor closes a separate access barrier.

### E. RHU Needs Attention

Lead with a task queue; show the small operational summary below it. Team availability and reassignment are a drawer on this page, not a new dashboard.

| Exception | Information visible | Coordinator action |
|---|---|---|
| No worker assigned | Task type, area, due date, time unassigned | Assign an eligible available worker |
| Blocked access | Barrier code, owner, last action, next check, time blocked | Record support action or arrange an alternative |
| Overdue work/review | Responsible role/person, due date, elapsed delay | Follow up responsible service and set next check |
| Worker needs support | Affected tasks and reported availability | Reassign suitable work or record support |

Clinical review assignments go only to clinicians; BHW coordination tasks go only to eligible BHWs. Coordinators may record staffing problems but cannot substitute their own clinical sign-off. If no eligible person is available, retain **Unassigned**, name the coordinator responsible for arranging coverage, and keep the exception visible.

One item can have multiple exception labels. Show it once in the combined queue; filtered counts may overlap and must not be summed as unique cases. Closing an issue requires a recorded outcome. Unresolved work stays open with a next check; there is no “complete patient” button.

## 5. YAKAP: proactive checkup guidance

Use **My YAKAP Checkup**, not a blanket **Free Screening** promise. The tracker summarizes the journey; it is not an official eligibility or empanelment verification service.

| Visible milestone | Supporting content and completion evidence |
|---|---|
| Clinic selected | Guide to official selection channels or BHW assistance; recorded choice does not prove official empanelment |
| First visit done | Arrange the first encounter; explain clinic-led identity/liveness procedures and primary-care assessment; patient report remains distinguishable from clinic confirmation |
| Empanelment slip signed | Record reported/confirmed signing and source; no Tuloy button officially empanels the patient |
| Follow-up due | Show clinician-directed next action and date; “Not yet scheduled” if absent; repeat care does not become permanently completed |

Explain the fuller journey in a short expandable note: primary-care checkup and risk assessment; measurements as appropriate; clinician-directed tests if indicated; clinical review; prescribed treatment where applicable; continued monitoring. Tests and medicines are conditional. Do not make liver/lipid testing, a particular glucose test, or a fixed screening interval universal.

The cited PhilHealth member advisory describes clinic selection, a first encounter with clinic-led liveness checks, and signing the empanelment slip. The app explains these steps without implementing PhilHealth identity checks or claiming official integration. Benefits and services must be confirmed with the clinic under applicable guidance; do not promise every test or medicine is always free or available.

Do not implement a blanket “30-kilometer community empanelment” exception. Out-of-facility arrangements need the applicable issuance and local confirmation before being represented as available.

Sources: [PhilHealth Advisory 2025-0071](https://www.philhealth.gov.ph/advisories/2025/PA2025-0071.pdf), [YAKAP FAQ, July 2025](https://www.philhealth.gov.ph/yakap/YAKAP_FAQs.pdf), [Advisory 2026-0023](https://www.philhealth.gov.ph/advisories/2026/PA2026-0023.pdf). These are dated guidance, not a guarantee that later rules or local service availability are unchanged.

## 6. Independent states and honest offline behavior

Keep four independent dimensions in the shared records. Show only the labels relevant to the current action; do not display a wall of badges.

| Dimension | Minimum represented states | Never imply |
|---|---|---|
| Help-request transport | Saved on this device; Waiting to send; Received in demo clinic inbox | Local save means a real clinic received it |
| Encounter attendance | Unknown; patient-reported attended; clinic-confirmed attended; clinic-confirmed missed | A reminder, call, or elapsed due date proves attendance |
| Clinical work | Awaiting review; reviewed with disposition; care plan draft/released | Reading or transcribing a result is a diagnosis |
| Coordination | Open; blocked; resolved, with ownership stored separately | A finished contact attempt means all care is complete |

**Offline scope is the help-request queue only.** Persist the request before reporting Saved. Queue it as Waiting until the receiving action succeeds. Retrying uses the same request ID. Saving or receiving failures retain the request with an error/retry message; no success toast after failed persistence.

For the single-browser prototype, the receiving action writes to a separate logical **demo clinic inbox** in the shared local store and returns acknowledgment only after the write succeeds. Then it creates/reuses the corresponding task and shows **Received in demo clinic inbox**. Label the exercise **“Simulated delivery in this browser; no clinic contacted.”** Do not use a timer that changes a badge without a receiving record.

A visible demo control can pause/resume delivery. It must be called simulated connectivity unless actual network disconnection has been tested. Retained browser data should survive refresh; opening the application from scratch without network requires cached assets and is not claimed by queue persistence alone. Test actual offline reload only if shell caching already exists and is verified.

No remote sync, multi-device conflict handling, real delivery receipts, or background dispatch while the app is closed is required. Show local update time. Browser-data clearing can remove local records; this is not backup.

Urgent help text appears beside the help form and in the worker panel: **“This app is not monitored continuously. If urgent, contact the RHU through its local urgent-care route. Do not wait for an in-app reply.”** Use a non-dialable demo contact placeholder. Provide a manual urgent-concern flag and an action to record attempted escalation, recipient, outcome and next owner. A flag is neither an emergency diagnosis nor proof someone was reached. No numeric clinical thresholds are added.

## 7. Small supporting features

**Source records:** Seed one clearly synthetic report for the main patient, readable in the app. Preserve it beside manually checked values. Reuse a working clearbook if one exists; new uploads, retake/rotate tools, grant management, OCR and printable packets are not mandatory. A patient can view their supplied source report independently of the clinician's unpublished draft interpretation.

**Care Finder:** Two or three fictional cards with facility type, simulated service list, area/landmark, availability wording, and “Demo information checked: [date]” or “Not verified.” Every card says **Fictional demo facility**. Use no fake accreditation badge, price, live telephone, slot, or map route. Selecting a card creates a help/coordination request using the same flow, not an appointment. Real directory imports and live availability are deferred.

**No automated disease score:** Patient measurements are records for review, not an ML diagnosis. Do not include dummy risk cards or a clinician-signoff checkbox that makes an unvalidated model appear accurate. ML remains a future independently evaluated feature.

## 8. RHU workload and one percentage

Coordinator is a locally assigned responsibility with a backup, not an assumed new LGU position. The deployment hypothesis is that a single record and exception queue can reduce repeated chasing; this has not been demonstrated. A participating RHU must identify who has capacity, when routine work is checked, and the urgent/out-of-hours route.

Record once, update all appropriate views, group repeat alerts by issue, and avoid routine approval gates. Do not add a second reporting form for the same visit. Making neglected work visible can increase workload; software cannot create clinicians, transport, stock, or appointment slots.

Required operations display:

- Counts of unassigned, blocked and overdue open tasks; each opens the matching list.
- Age since the relevant exception began, last action time, and next-check date. Preserve the original exception age when staff add a note or change the next check.
- One **Confirmed follow-up attendance** percentage, with the underlying counts and unknowns.

Freeze one visible demo reporting window and as-of time in Asia/Manila; no period selector. Define the denominator as unique tracked follow-up appointment occurrences due within that window by the as-of time, excluding occurrences explicitly canceled or superseded before their scheduled time. The numerator is those occurrences with clinic-confirmed attendance recorded by the as-of time. Unknown and patient-reported-only outcomes remain in the denominator; show them separately. A later replacement does not erase an original missed occurrence. If no appointments qualify, display **N/A — no follow-ups due**, not 0%.

Example fixture: **6 of 10 confirmed attended — 60%**; remaining outcomes: **1 patient-reported only, 2 unknown, 1 confirmed missed**. These are synthetic appointment counts, not municipality coverage or measured clinical impact. Clinical plan release must not change this metric.

## 9. One shared visual identity

Use **Tuloy** as the only primary product name, with workspace subtitles **Patient**, **BHW**, and **RHU**. Park SuriHatid as a future module name. Use the tagline **Alaga, tuloy-tuloy.** consistently. No government logo or implied endorsement.

| Token | Value | Usage |
|---|---|---|
| Primary | `#0F766E` | Primary buttons, active navigation, focus accents |
| Text | `#16324F` | Headings and primary text |
| Muted text | `#475569` | Supporting labels and timestamps |
| Background | `#F8FAFC` | Page canvas |
| Surface | `#FFFFFF` | Cards, drawers and tables |
| Border | `#CBD5E1` | Card boundaries and dividers |
| Pending | `#B45309` | Waiting/needs-action text with pale amber surface |
| Urgent/error | `#B91C1C` | Error or manually flagged urgent-concern label |
| Confirmed | `#166534` | Confirmed action label with pale green surface |

Use the existing readable sans-serif font or a system sans-serif stack, one icon family, a 16 px default body size, an 8 px spacing rhythm, 12 px card corners, and roughly 44 px minimum interactive targets. Validate contrast and keyboard focus. Status always includes words and, where helpful, an icon; green must never mean “healthy.”

Patient and BHW layouts prioritize narrow screens. RHU uses a compact table on desktop and stacked task cards on mobile. Use a consistent header, page title, next-action card, task row, status chip, form labels, and save/error behavior. Keep one prominent primary action per panel; avoid decorative graphs and oversized empty dashboard cards.

One implementation language: plain English, with the Filipino tagline retained. Full translation is deferred. Do not let separate teams invent different names for the same state. Use **Patient** in navigation, **Clinician review**, **Released plan**, **Attendance not confirmed**, and **Needs Attention** consistently.

The demo banner is visible across all workspaces: **“Synthetic data • Demo role access • Single-browser prototype.”** Delivery simulation receives an additional label at the action itself. Shared brand tokens and components have one owner and are reused, not copied independently into three projects.

## 10. Minimum shared contract and team ownership

Freeze the shared contract in hour 0–1. Retain a working stack if verified. If starting fresh, decide one frontend and one shared persistent store before screen work; do not spend this brief selecting framework versions or infrastructure. All workspaces must read the same patient/task IDs and shared actions.

| Shared record | Minimum facts needed |
|---|---|
| Patient / actor | Stable ID, synthetic flag, assigned BHW/clinician, role and facility scope |
| Help request | Stable request ID, patient, reason, created time, local/receipt status, linked task |
| Task | Patient, type, owner or unassigned, coordinator responsible for coverage, due date, next check, state, barrier, exception start, outcome |
| Appointment | Stable occurrence ID, scheduled time, requested/confirmed arrangement, attendance evidence/source/time, cancellation/replacement link |
| Source / observation | Original reference, value/unit/context/date if known, recorder, transcription check, correction history |
| Review / care plan | Assigned clinician, source references, disposition, plan version, draft/released status, release actor/time, next action |
| Activity history | Actor/role, action, record reference, timestamp and short reason where needed |

Use shared actions for save/request, demo receive, record contact, record attendance evidence, request review, release plan, assign/reassign, and record resolution. Screen code must not make separate interpretations of these actions. Retrying a request or release must not duplicate work. Capture source/time for milestone updates without creating a separate government-verification subsystem.

| Person | Primary ownership | Shared dependency |
|---|---|---|
| A | Shared records/actions, role switcher, brand components, RHU Needs Attention | Publishes the initial contract; integrates branches |
| B | BHW Today/Visit and RHU clinician review/release | Uses A's actions and C's patient plan view |
| C | Patient Home, care-plan drawer, help form and queue behavior | Uses shared request/receive actions |
| D | Source evidence, demo script, stakeholder questions, QA, backup recording | Validates behavior across all roles; helps integration |

These are three product areas across four people, not three independently staffed teams.

Planning budget: shared core **3.5 person-hours**, patient **2.5**, BHW **3**, clinician **2**, RHU **2**, help queue **1**, seeded source/card support **2**: approximately **16 build person-hours**, plus approximately **8 for evidence/pitch/QA/video**. These are provisional targets, not a measured estimate; source inspection and integration may consume much of the remaining nominal 44 person-hours. Dependencies prevent all work from running independently.

Suggested elapsed gates: **0–1** inspect/freeze; **1–4** implement shared core and role views; **4–6** integrate the single scenario; **6–8** verify edge cases and layout; **8–10** rehearse and fix blockers; **10–11** freeze and record backup. No new feature starts after the integration gate without removing equivalent scope.

## 11. Kiro and Amazon Quick boundaries

Later Kiro prompts should implement this brief incrementally: inspect baseline, freeze shared contract/components, connect the three workspaces, verify, then polish. Report working/partial/blocked/deferred features. Do not restore old mandatory ML, map, consent, or specimen requirements because they remain in old files.

Keep Amazon Quick meaningful as a **bounded supporting demonstration** after the core passes, if required for the hackathon. It is outside the 75-second care walkthrough. Reuse an actual available Quick workflow; do not assume it exists or require its integration to save a help request.

For this scope, use a synthetic operational snapshot with task ID, task type, owner role, due/exception timestamps, barrier code and worker availability. Exclude names, patient IDs, source reports, observations, diagnoses, precise locations and free text. Ask Quick to summarize where work is stuck and suggest operational follow-up from supplied facts. It must not interpret disease risk, invent staff/services, assign clinical urgency or release plans.

The coordinator applies a selected support/assignment action manually through the same validated form. Automated proposal import and atomic batch writeback are deferred. Label actual live use, a recorded genuine run, or a blocked account accurately. If event rules require live Quick, treat unavailable access as an unresolved judging dependency, not a completed integration.

## 12. Demo, acceptance and validation

Seed the same patient, Maria, with an upcoming/pending follow-up, assigned BHW, an **existing synthetic result set awaiting review**, and an RHU clinician. Use other small fixtures only for unassigned work, role-denial tests and the attendance denominator. No seeded diagnosis or result is evidence about a real person.

### 75-second care walkthrough

| Time | Action | What the audience should understand |
|---|---|---|
| 0–15 s | Patient requests help; pause/resume simulated delivery; show Saved, Waiting, Received | Saving and receiving are different events |
| 15–40 s | BHW opens owned request, records contact and transport barrier; requests RHU support | Someone owns the next action; attendance remains unconfirmed |
| 40–55 s | Clinician reviews the existing report and releases next steps; briefly show patient plan in the same prepared navigation sequence | Clinical interpretation requires clinician release |
| 55–75 s | RHU sees the still-blocked task, owner and aging, plus the one attendance percentage | Oversight addresses exceptions; plan release did not fix transport |

For a two-minute pitch, reserve about 20 seconds for problem/context, 75 for this walkthrough, and 25 for differentiation and limitations. Rehearse the actual navigation. Do not silently replace a real patient view update with a staged screenshot. Directory browsing, manual transcription, Quick and extra edge cases belong in Q&A or a backup recording.

### Minimum acceptance checklist

- The same request survives refresh, retries without duplication, and appears in the BHW queue only after acknowledged demo receipt. Failed saves/receipts remain visible.
- A transport barrier produces one RHU exception with owner, reason, age and next check. A routine update without an exception does not require coordinator approval.
- Patient report, unknown attendance, and clinic-confirmed evidence remain distinguishable. A passed due date alone never marks a visit missed.
- Coordinator and BHW plan-release attempts fail through shared actions. Clinician release makes the plan visible to the correct patient and creates at most one intended follow-up task.
- Draft interpretation is hidden from patient/coordinator views; source-record availability follows the defined role scope.
- Releasing a plan does not alter attendance, close the transport barrier, or inflate the attendance metric.
- Unassigned/blocked/overdue counts link to the correct lists; aging does not reset on an ordinary note; the fixed metric shows counts/unknowns and handles a zero denominator.
- Urgent flag and escalation outcome are visible; an attempted contact is not marked reached. No automated diagnostic or urgency threshold appears.
- At narrow mobile and desktop widths, primary actions remain usable, labels do not rely on color, and keyboard focus is visible.
- Run the actual project's required build/check gate and a complete scenario walkthrough. Report actual results and untested behavior; do not fabricate test completion in this brief.

### Small stakeholder walkthrough, prepared but not yet conducted

Use synthetic records with one patient, one BHW and one RHU clinician; include the proposed coordinator if possible. Ask whether the patient can identify the next step, the BHW can find and act on assigned work, the clinician can see adequate source context, and the coordinator can resolve an exception without reading the full medical file.

Record time per action, assistance needed, repeated entry, calls/messages still required, unresolved work, and work shifted to another role. Identify which existing task or report Tuloy could replace. Do not claim time savings, clinical accuracy, legal compliance or representative validation from a prepared guide or a few interviews.

## 13. Deferred roadmap and completion handoff

Explicitly deferred: three trained disease models; OCR/camera enhancement; QR registration; selective sharing/expiry/revocation; comprehensive clearbook; interactive map and routing; live directory/service verification; scheduled two-way messaging/SMS; recurring-task scheduler; medical inventory and medicine information; specimen transport/SuriHatid; trend charts; printable summaries; additional interface languages; extra KPIs/cohort controls; cloud synchronization/conflict UI; production authentication and authorization; PhilHealth/EMR integration; automatic Quick proposal application.

These are not implied acceptance requirements. Preserve any already working implementation without letting it become a dependency of the reduced demo. Reconsider each only after the shared care journey is working and its additional workload is understood.

The later prototype handoff must provide runnable source, actual run/build instructions, the shared contract, the seed/reset procedure, the short demo script, a feature-status table, and actual check results. Reset is an explicit demo action, never an automatic side effect of role switching or refresh. State plainly what is local/simulated and which external services were actually used.

Reference for existing supervision patterns: [Community Health Toolkit — CHW Supervision and Performance Management](https://docs.communityhealthtoolkit.org/reference-apps/supervisor-reference-app/). Adapting a workflow pattern does not mean CHT is installed or integrated.

**Done means:** one patient request receives an owned response, a clinician releases a plan based on available clinical information, and unresolved access work remains actionable for the RHU. It does not mean the patient is cured, a real clinic received data, or the product is ready for deployment with real patient records.
