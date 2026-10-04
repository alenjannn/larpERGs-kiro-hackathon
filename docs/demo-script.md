# Tuloy Health: demo video script

This is a script for a recorded walkthrough that judges watch on their own. It runs about 4:40, with one voice over a Chrome screen recording. Times are start marks.

**The one problem: fragmented care.** A patient's health information is split across several places:
- the BHW's paper logbook,
- a lab slip kept at home,
- a clinic record that no one else sees.

Patchy signal makes the split worse. Readings and requests for help don't reach someone who can act, so the chance to step in early is lost.

**What we show:** one patient's information moving across the patient, the BHW and the RHU on one shared record, including while offline (Act 1). After that comes a quick tour of the other features (Act 2).

**Keep these claims on camera:**
- Tuloy supports early intervention. It gets results to a clinician and gets people through follow-up.
- It does not detect or diagnose disease, flag readings or score risk.
- It connects the three teams inside Tuloy. It is not connected to PhilHealth or other health systems.

## Before you record (off camera)

1. Serve the production web export from `apps/mobile`, or use the Vercel deployment:

   ```powershell
   npm run export:web
   npx serve dist
   ```

   Open `http://localhost:3000/demo`. Use `npm run export:web`, not plain `expo export`. It also builds the service worker that the offline reload needs.
2. Set up Chrome:
   - Open DevTools.
   - Turn on the device toolbar at phone width (about 390 px).
   - Keep the Network tab ready for the Offline toggle.
3. On `/demo`, tap "Reset demo data", then confirm "Reset demo data". When it finishes, the app leaves `/demo`, so open `/demo` again. Reset before every take.
4. Have these ready to paste:
   - Lab entry: Blood glucose, Fasting, `110`, mg/dL, with yesterday's date as `YYYY-MM-DD`.
   - Help message: `I need a ride to the RHU (DEMO)`
   - Visit next action: `Tricycle arranged for the RHU follow-up (DEMO)`
   - Care plan summary: `Your fasting blood sugar result and your latest blood pressure were reviewed by your clinician (DEMO).`
   - Care plan next steps: `Attend your follow-up BP check at the RHU. Your BHW is helping arrange transport. Bring your paper lab slip.`
5. Start recording on the `/demo` launcher.

## 0:00 Cold open (about 30 s)

On screen: the Tuloy title card, then the `/demo` launcher.

Say: BHWs screen their communities for high blood pressure and high blood sugar, the two leading causes of kidney disease. But the results are scattered: a paper logbook, a lab slip at home, a clinic record no one else sees. With patchy signal, readings and requests for help often don't reach someone who can act in time. Tuloy puts the patient, the BHW and the Rural Health Unit on one shared record that works offline. Alaga, tuloy-tuloy.

## Act 1: one patient, one record, three teams

| Time | Screen and tap | Say |
|---|---|---|
| 0:30 | Launcher: tap "Demo as Patient". Point at "Your health worker: Liza Mendoza (DEMO)" and the "Next step" card. | Juana is synthetic DEMO DATA, like everyone here. Her Home names her health worker and leads with her next step, a confirmed follow-up BP check. |
| 0:39 | My Health tab: tap "Add a lab result from my paper". Pick "Blood glucose" and "Fasting", enter 110, pick "mg/dL" and enter the date. Tap "Save", then "Save", then "Done". | Juana got a fasting blood sugar result on a paper slip. She copies it in and checks it against the paper; Tuloy doesn't interpret it. |
| 0:58 | Under "Lab results you entered", point at the chips "Synced" and "Awaiting clinical review". | Instead of staying in her bag, the result is now with her care team, waiting for a clinician. |
| 1:03 | Home tab. Set Network to "Offline" and reload. Point at the offline banner and "Last updated". | Now she loses signal and reopens the app. Her next step and care plan are still there. |
| 1:11 | Tap "I need help" and pick "Transport / Transportasyon". Paste the message, scroll past the urgent-care box and tap "Submit". | She has no ride to her follow-up, so she asks her health worker. The sheet makes clear this isn't an emergency channel and says where to get urgent care. |
| 1:21 | The sheet shows "Saved on this device · Waiting to send". Tap "Done". | It's saved on her phone, waiting to send. |
| 1:25 | Set Network back to "No throttling" and don't tap anything. The "My requests" chip changes to "Received in demo clinic inbox". | When signal returns, the request sends itself, and it only says Received once the server confirms it. The ID was made on her phone, so a retry can't create a duplicate. |
| 1:37 | Go to `/demo` and tap "Demo as BHW". Under "Today · Help requests", point at Juana's item, then tap "Acknowledge". | Liza, her BHW, has exactly one new item, routed to her automatically, with the created and received times shown separately. She acknowledges it. |
| 1:49 | Set Network to "Offline". Under "Follow-ups due", tap "Log visit" on Juana. Enter 130 and 82, pick "Contacted · Nakausap" and "Transport · Transportasyon", paste the next action, then tap "Save visit on this device". | Liza visits Juana with no signal. One form takes the BP reading, the outcome, the transport barrier and the next action. |
| 2:03 | Sync tab. Set Network to "No throttling", tap "Sync Now (1)", and wait for "Synced 1 record. The demo server confirmed each one." | Back in signal, one tap sends the visit, and the server confirms it. |
| 2:10 | Go to `/demo`, tap "Demo as Admin" and turn the device toolbar off. On Needs Attention, point at "Demo clinic inbox" (Juana, Liza, "Acknowledged") and "Latest field records" ("Synced from field"). | At the Rural Health Unit, Carmen sees Juana's request once, owned and acknowledged. Liza's field visit is right behind it. |
| 2:20 | Clinical Review tab: tap "Turn on Clinician mode". In the review queue, tap "Review" on Juana's "Blood glucose (entered by patient)" and scroll down. | Dr. Ramon's review queue now holds the result Juana copied from paper. Clinician mode is simulated, and it's labeled that way. |
| 2:29 | Point at "Latest readings" (BP 130/82 from Liza's visit) and at "Results awaiting review (1)" (Glucose 110 mg/dL). | Her own lab result and the BP Liza took in the field are now in one place, in front of a clinician who can act on them. |
| 2:38 | Paste the summary and next steps. Tap "Release plan", then confirm with "Release plan". | He writes plain-language next steps, with no diagnosis label or risk score, and releases them. |
| 2:50 | Go to `/demo`, tap "Demo as Patient" and turn the device toolbar on. On the Care Plan tab, point at the new plan, then go to Home and point at Blood pressure "130/82 mmHg". | The loop closes on Juana's phone. The clinician's plan and Liza's field reading are both in her own record. |
| 3:04 | Stay on Home. | That's the whole loop: a paper result and a field reading reached a clinician, and a request for help reached its owner. None of it got lost when the signal dropped. |

## Act 2: also in Tuloy (one line each)

| Time | Screen and tap | Say |
|---|---|---|
| 3:16 | YAKAP & Clinics tab: point at "You are here", then expand "Demo Family Clinic (DEMO)". | My YAKAP Checkup walks her through her PhilHealth checkup steps. Unknown accreditation stays Unknown, and picking a clinic isn't enrollment. |
| 3:25 | Home: tap "Filipino" in the header and point at "Natanggap sa demo clinic inbox" and "Transportasyon". Then tap "English". | Status labels and help reasons switch to Filipino. They're marked as drafts for native-speaker review. |
| 3:32 | Go to `/demo` and tap "Demo as BHW". On My Patients, point at "+ Register New Patient" and Lorna's "Assisted (no smartphone)". Tap "Show QR" on Pedro, then "Close". | BHWs register patients offline, including assisted patients with no smartphone. Each patient gets a QR reference card that holds only an ID. |
| 3:44 | Map tab ("Field Map"). | The Field Map shows households with each status written in words. Offline, it falls back to a list of last-known locations. |
| 3:51 | Sync tab: point at the five count tiles. | Every queued item shows one of five states, from Waiting to send to Needs review. A conflicting record is never overwritten. |
| 3:59 | Go to `/demo` and tap "Demo as Admin". On Needs Attention, tap "Assign" on Ernesto's request, pick "Joel Bautista (DEMO)", then tap "Assign to Joel Bautista (DEMO)". Point at "BHWs inactive > 3 days" (Ana). | Anything without an owner lands in Needs Attention, like Ernesto's request, and Carmen assigns it. Ana, who's been inactive for five days, is flagged and isn't offered as an owner. |
| 4:13 | Summary tab: tap "Clinical review completion". | Summary tracks follow-through, such as clinical review completion, as a count out of a total. Empty groups say No cases, not a misleading zero. |

## 4:22 Close (about 15 s)

On screen, a closing card:
- **Deferred:**
  - cloud sync of every record type
  - cross-device conflict resolution
  - sending while the app is closed
  - backup and restore
  - OCR, ML and SMS
  - an inventory ledger
  - any connection to PhilHealth or other health systems
- **Security:**
  - The app uses synthetic DEMO DATA only.
  - The app holds only the Supabase anon key, never a service_role key.
  - Row-level security is relaxed for the hackathon. A real deployment needs real sign-in and RLS.

Say: Still deferred: full cloud sync, cross-device conflict resolution, sending while the app is closed, backup, OCR, ML, SMS and inventory. All data is synthetic, logins are simulated, and the app only ever holds Supabase's public anon key.

## Recording notes

**Before the offline steps**
- Don't skip the 0:30 step. Loading Juana's Home online is what caches it, so without it the offline reload has nothing to show.
- The offline reload only works on the exported build, not under `expo start`. Rehearse it once.

**The lab result**
- Use blood glucose, not serum creatinine or cholesterol. For those two, Clinical Review shows the entry's title but not its value yet.
- If the entry shows "Not shared with your care team yet", tap "Share now" while you're online.

**Timing**
- After reconnecting, the app checks the server before sending, so give it a few seconds. If the chip hasn't changed after about 15 seconds, tap "Try again" on the request. That button is a real feature, so it's fine to show on camera.
- If Juana's request isn't on Liza's Today list, pull down to refresh. The list doesn't update live.

**What you'll see on screen**
- Lito's older result sits first in the review queue. Tap "Review" on Juana's row, not his.
- Liza's visit with a transport barrier adds an "Open barriers" item to her Today list. That's expected.
- Scroll past the developer cards: "Database connection test" on Patient Home and "Offline storage test" on BHW Today.

**Wording and limits**
- The QR is a reference card. There's no camera scanner, so don't say "scan".
- Liza is the only BHW persona you can sign in as. Joel and Ana appear only on the RHU screens.
- To switch roles, type `/demo` in the address bar.
- The Filipino toggle changes status chips and help reasons only.
- Failed and Needs review can't be triggered on demand, so describe them rather than staging them.
