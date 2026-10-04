// Patient workspace copy (Spec 03). English first; Filipino forms below.
// FIL: needs native-speaker review — every Filipino string in this file is a draft.
//
// Never add interpretation ("normal", "high"), scores, promises of free services,
// booking/enrollment claims or live-monitoring claims here (design §5).

export const PATIENT_COPY = {
  tabs: { home: 'Home', health: 'My Health', yakap: 'YAKAP & Clinics', carePlan: 'Care Plan', profile: 'Profile' },

  // Home
  upcomingFollowUp: 'Upcoming follow-up',
  latestMeasurements: 'Latest measurements',
  reviewStatus: 'Review status',
  noReviewWaiting: 'No results waiting for review.',
  reviewPendingText: 'A clinician will review your results. Your plan shows here when it is released.',
  reviewReleasedText: 'Your clinician released a care plan.',
  seeMyHealth: 'See My Health',
  iAttended: 'I already attended',
  anotherDate: 'I need another date',
  attendOffline: 'Connect to report that you attended. You can still ask for help.',
  attendWaiting: 'Waiting for the clinic to confirm',
  attendConfirmTitle: 'Did you attend this appointment?',
  attendConfirmLabel: 'Yes, I attended',
  attendAlreadyUpdated: 'This appointment was already updated. Pull to refresh.',
  attendFailed: 'Could not update your attendance.',

  // My Health
  olderReading: 'Older reading',
  noReadings: 'No readings yet',
  noReadingsMessage: 'Readings from your health worker or your paper reports will show here.',
  bpTrend: 'Blood pressure trend',
  bpTrendTooFew: 'Not enough dated readings for a trend yet.',
  bpTrendNote: 'Shows dated readings only. Tuloy does not interpret results.',
  history: 'History',
  labsYouEntered: 'Lab results you entered',
  addLab: 'Add a lab result from my paper',
  noInterpretation: 'Tuloy does not interpret results. A clinician will review it.',
  noEntries: 'No lab results entered yet.',
  enteredByYou: 'Entered by you · confirmed by you',
  notShared: 'Not shared with your care team yet',
  shareNow: 'Share now',
  connectToShare: 'Connect to share it.',
  checkAgainstPaper: 'Check this against your paper',
  // Spec 06: more clearbook labs
  otherLabs: 'Other lab results',
  otherLabsNote: 'Shows a value only when one was entered. Not every checkup includes these tests.',
  labEntryIntro: 'Copy one result from your paper report. All fields are required.',
  labTestLabel: 'Test (required)',
  glucoseTestTypeLabel: 'Glucose test type (required)',

  // YAKAP & Clinics
  yakapTitle: 'My YAKAP Checkup',
  yakapTagline: 'Get help accessing YAKAP benefits and completing your next care step',
  notEnrollment: 'Choosing a clinic in Tuloy is not YAKAP enrollment. Your clinic confirms it.',
  askGettingStarted: 'Ask for help getting started',
  philhealthLink: 'Official PhilHealth YAKAP page',
  needsConnection: 'Needs a connection',
  noBooking: 'Opening this card does not book an appointment. Ask your health worker or call the clinic.',
  clinics: 'Clinics',
  noClinics: 'No clinics listed yet',
  clinicsConnectOnce: 'Connect once to load the clinic list',
  youAreHere: 'You are here',
  yourSteps: 'Your steps',
  notStarted: 'Not started yet',

  // Care Plan
  carePlanTitle: 'Care Plan',
  lastReleasedPlan: 'Your last released plan',
  noPlanTitle: 'No care plan yet',
  noPlanMessage: 'Your clinician releases it after your checkup.',
  careTeam: 'Your care team',
  yourHealthWorker: 'Your health worker',
  yourClinic: 'Your clinic',
  noHealthWorker: 'No health worker assigned yet',
  unknown: 'Unknown',
} as const;

/** FIL: needs native-speaker review. */
export const PATIENT_COPY_FIL = {
  tabs: { home: 'Tahanan', health: 'Aking Kalusugan', yakap: 'YAKAP at mga Klinika', carePlan: 'Plano ng Pangangalaga', profile: 'Profile' },
  upcomingFollowUp: 'Susunod na follow-up',
  latestMeasurements: 'Pinakabagong sukat',
  reviewStatus: 'Katayuan ng pagsusuri',
  labsYouEntered: 'Mga resulta ng lab na inilagay mo',
  addLab: 'Magdagdag ng resulta mula sa papel ko',
  otherLabs: 'Iba pang resulta ng lab', // FIL: needs native-speaker review
  bpTrend: 'Takbo ng presyon ng dugo',
  history: 'Kasaysayan',
  yakapTitle: 'Aking YAKAP Checkup',
  yourSteps: 'Ang iyong mga hakbang',
  clinics: 'Mga klinika',
  carePlanTitle: 'Plano ng Pangangalaga',
  careTeam: 'Ang iyong care team',
  iAttended: 'Nakadalo na ako',
  anotherDate: 'Kailangan ko ng ibang petsa',
} as const;

export const PHILHEALTH_YAKAP_URL = 'https://www.philhealth.gov.ph/yakap/';
