---
inclusion: always
---

# Tuloy Health — Product steering

Full product brief: #[[file:docs/product-brief.md]]
When this file and the brief disagree, the brief wins. Name the conflict instead of choosing silently.
Older steering files in this folder (architecture.md, expo.md, security.md) predate this pack. Where they disagree with product.md, tech.md or structure.md, these three files win; name the conflict instead of choosing silently.

## 1. Mission and core objective

**Help people take the next step in preventive care, and help their care team follow through, even without a stable connection.** Tagline: *Alaga, tuloy-tuloy.*

The core experience is a YAKAP checkup and screening navigator, supported by:
- a personal health record (the clearbook),
- BHW follow-through,
- clinician review.

Tuloy helps patients reach assessment and complete follow-up. It never diagnoses. Collected measurements are not a diagnosis.

**Offline-first is a main feature, not an extra.** The required offline journey:
1. The patient opens the previously loaded app without internet.
2. Cached Patient Home and care information remain accessible.
3. A help request is saved locally.
4. It shows **Saved on this device → Waiting to send**.
5. When connectivity returns, it is delivered **once**.
6. It becomes **Received in demo clinic inbox** and appears in the BHW queue.

## 2. Audience and deployment

| Role in code | Brief name | User | Main question |
|---|---|---|---|
| `admin` | Tuloy RHU: coordinator, plus a restricted **clinician** mode | Rural Health Unit staff | Where is care getting stuck? |
| `bhw` | Tuloy BHW | Barangay Health Workers, often offline in the field | Who needs help today? |
| `patient` | Tuloy Patient | Community members, including low-literacy and low-connectivity users | What should I do next? |

- **Primary deployment:** Expo Web, exported as a static PWA on Vercel, as one link. It is demoed on a phone-width browser and a laptop.
- **Secondary:** Expo Go or a development build on Android.
- **Layouts:** Patient and BHW are mobile-first. RHU is table- and queue-first, with a usable narrow-screen view.
- **Language:** English/Filipino labels, used consistently. Dates are written like "04 Oct 2026".

## 3. Hackathon constraints and non-negotiables

- **Builds on the existing project.** Changes are additive. Do not rename existing tables, columns, routes or services. Schema changes go into new migrations, and `supabase/setup.sql` is regenerated with `node scripts/build-setup-sql.mjs`.
- **Synthetic data only.** All seed data is labeled DEMO DATA. No real names, addresses or phone numbers.
- **No real login.** Roles are chosen in the Demo Quick-Switch Launcher. RLS stays permissive for the hackathon. The clinician mode is labeled "Simulated role — no real authentication".
- **No diagnosis.** No unvalidated risk scores or "healthy" scores. A missing reading is never shown as zero.
- **Clinical authority.** Only clinician mode can release a care plan. Coordinator mode cannot diagnose, prescribe or sign.
- **No emergency claims.** Help requests are not an emergency channel. Always show where to seek urgent care. Never imply live monitoring or a guaranteed response time.
- **No official integration claims.** Selecting a clinic is not YAKAP enrollment. Opening a clinic card does not book an appointment. Unknown availability stays "Unknown".
- **Deferred, never presented as working:**
  - cloud sync of every record type,
  - cross-device conflict resolution,
  - background sending while the app is closed,
  - backup and restore,
  - OCR,
  - ML,
  - SMS,
  - inventory ledger.
- **Status is never color alone.** Every status chip has text and an icon.

## 4. Feature matrix by role (foundation scope)

| Area | Admin (RHU) | BHW | Patient |
|---|---|---|---|
| Home | **Needs Attention**: unassigned help requests, overdue reviews, blocked barriers, inactive BHWs | **Today**: owned work items (help requests, attendance confirmation, follow-ups, barriers) | **Home**: next care step first, then upcoming follow-up, latest dated measurements, review status |
| People | **Assignments**: create BHW accounts; assign and reassign patients and help requests | **My Patients**: list and Mapbox map; assisted/manual registration, which works offline | **Care team**: assigned BHW and clinic contact |
| Records | Field records feed tagged "synced from field" | **Patient Visit**: measurements, contact outcome, barrier and next action in one save, offline | **My Health**: vitals history with dates and units; manual clearbook entry |
| Care pathway | **Clinical Review** (clinician mode only): review results, release care plan | Confirm attendance: patient-reported vs clinic-confirmed | **My YAKAP Checkup** stage tracker; **YAKAP & Clinics** finder; **Care Plan** (released plans only) |
| Offline | Demo clinic inbox (receives help requests once) | **Sync** tab: Sync Now, which already exists | Offline Home and the help-request outbox: auto-send on reconnect, plus Try again |
| Metrics | **Summary**: 4 metrics as "count of total (%)"; zero denominator shows "No cases" | — | — |

## 5. Help requests

- **Reasons:**
  - transport,
  - need another date,
  - lab access,
  - document help,
  - medicine access,
  - other.
- **Required:** a patient reference and a timestamp created on the device.
- **Optional:** a short message.
- A BHW queue item shows the created-on-device time and the received time **separately**.

## 6. Shared status dictionary (use these exact meanings everywhere)

- **Transport:** Saved on this device · Waiting to send · Sending · Received in demo clinic inbox (help requests) or Synced (BHW field records) · Send failed · Needs review (conflict).
- **Encounter:** requested · confirmed · patient-reported attended · clinic-confirmed attended · missed · rescheduled.
- **Clinical:** transcription pending · awaiting clinical review · plan released.
- **Coordination:** unassigned · assigned · acknowledged · blocked · completed.

Never use one generic "complete" flag across these groups.

## 7. Demo scenario and seed personas

**Fixed UUIDs.** All personas use fixed UUIDs so that **Reset demo data** is deterministic.

**Staff:**
- Admin coordinator: *Carmen Reyes (DEMO)*.
- Clinician: *Dr. Ramon Santos (DEMO)*.
- BHWs:
  - *Liza Mendoza (DEMO)*, active.
  - *Joel Bautista (DEMO)*, active.
  - *Ana Villanueva (DEMO)*, inactive 5 days, which tests staff absence.

**Patients.** The primary patient is *Juana Dela Cruz (DEMO)*, assigned to Liza. She has a cached Home, a confirmed follow-up and a released care plan. Seven more patients cover:
- unknown attendance,
- confirmed missed follow-up,
- result awaiting clinical review,
- unresolved transport barrier,
- unassigned patient,
- patient without a smartphone (assisted),
- newly onboarded with no measurements (shows "No readings yet", not zero).

**Combined demo, about 4 minutes:**
1. Admin: Needs Attention.
2. BHW: log a visit offline, then Sync Now.
3. Patient (Juana): go offline, reopen the app, see Home, send a help request ("Saved on this device → Waiting to send"), refresh, reconnect, see "Received in demo clinic inbox".
4. BHW: exactly one new Today item; acknowledge it.
5. Admin: the item shows as assigned and acknowledged; the clinician releases a plan.
6. Patient: sees the new plan.
