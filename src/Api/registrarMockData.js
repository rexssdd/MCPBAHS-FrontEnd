/**
 * registrarMockData.js
 * ─────────────────────────────────────────────────────────────────
 * Fallback mock data used when the API server is unreachable.
 * Mirrors the exact shape each service method returns so the UI
 * renders identically in offline / dev mode.
 * ─────────────────────────────────────────────────────────────────
 */

export const MOCK_STATS = {
  enrolledToday:  42,
  totalEnrolled:  2039,
  totalCapacity:  2400,
  pendingReview:  128,
  missingDocs:    40,
  transferees:    34,
  todayQuota:     { done: 34, total: 50 },
};

export const MOCK_ENROLLMENT_BY_GRADE = [
  { grade: 7,  enrolled: 378, capacity: 400, male: 182, female: 196, new: 210, returning: 168 },
  { grade: 8,  enrolled: 361, capacity: 400, male: 174, female: 187, new: 98,  returning: 263 },
  { grade: 9,  enrolled: 290, capacity: 400, male: 141, female: 149, new: 72,  returning: 218 },
  { grade: 10, enrolled: 398, capacity: 400, male: 192, female: 206, new: 85,  returning: 313 },
  { grade: 11, enrolled: 342, capacity: 400, male: 160, female: 182, new: 145, returning: 197 },
  { grade: 12, enrolled: 270, capacity: 400, male: 130, female: 140, new: 52,  returning: 218 },
];

export const MOCK_APPLICATION_STATS = {
  total: 378, approved: 210, pending: 128, incomplete: 40,
};

export const MOCK_PENDING_APPLICATIONS = [
  { id:"APP-0091", name:"Reyes, Maria Cristina",   grade:7,  type:"New",        submitted:"Mar 22", docs:"Incomplete", priority:"high"   },
  { id:"APP-0092", name:"Santos, Juan Carlo",       grade:8,  type:"Returning",  submitted:"Mar 22", docs:"Complete",   priority:"normal" },
  { id:"APP-0093", name:"Dela Cruz, Ana Patricia",  grade:11, type:"Transferee", submitted:"Mar 21", docs:"Incomplete", priority:"high"   },
  { id:"APP-0094", name:"Bautista, Marco Luis",     grade:9,  type:"New",        submitted:"Mar 21", docs:"Complete",   priority:"normal" },
  { id:"APP-0095", name:"Garcia, Liza Marie",       grade:12, type:"Returning",  submitted:"Mar 20", docs:"Complete",   priority:"normal" },
  { id:"APP-0096", name:"Villanueva, Jose Antonio", grade:7,  type:"New",        submitted:"Mar 20", docs:"Pending",    priority:"med"    },
  { id:"APP-0097", name:"Torres, Rosa Mae",         grade:10, type:"Transferee", submitted:"Mar 19", docs:"Complete",   priority:"normal" },
  { id:"APP-0098", name:"Lim, Carlo Andre",         grade:8,  type:"New",        submitted:"Mar 19", docs:"Incomplete", priority:"high"   },
];

export const MOCK_RECENTLY_PROCESSED = [
  { name:"Aguilar, Mark C.",     grade:9,  action:"Enrolled",    time:"10:32 am", by:"Reg. Santos" },
  { name:"Benedecto, Albert J.", grade:7,  action:"Enrolled",    time:"10:28 am", by:"Reg. Santos" },
  { name:"Neri, Denise R.",      grade:11, action:"Disapproved", time:"10:15 am", by:"Reg. Cruz"   },
  { name:"Gunio, Berty P.",      grade:8,  action:"Enrolled",    time:"10:09 am", by:"Reg. Santos" },
  { name:"Garcia, Paul S.",      grade:12, action:"On Hold",     time:"09:57 am", by:"Reg. Cruz"   },
  { name:"Rivera, Jenny T.",     grade:9,  action:"Enrolled",    time:"09:44 am", by:"Reg. Santos" },
];

export const MOCK_MISSING_DOCUMENTS = [
  { name:"Reyes, Maria C.",     grade:7,  missing:["Birth Certificate","Form 138"]           },
  { name:"Dela Cruz, Ana P.",   grade:11, missing:["Good Moral Certificate","Transfer Cert"] },
  { name:"Lim, Carlo A.",       grade:8,  missing:["Birth Certificate"]                      },
  { name:"Villanueva, Jose A.", grade:7,  missing:["Medical Certificate","Form 138"]         },
  { name:"Mendoza, Carla D.",   grade:12, missing:["Good Moral Certificate"]                 },
];

export const MOCK_REQUIRED_DOCUMENTS = [
  { name:"Birth Certificate",       submitted:312, pending:66 },
  { name:"Form 138 (Report Card)",  submitted:298, pending:80 },
  { name:"Good Moral Certificate",  submitted:320, pending:58 },
  { name:"Medical Certificate",     submitted:285, pending:93 },
  { name:"Transfer Certificate",    submitted:145, pending:43 },
];

export const MOCK_DOCUMENT_STATS = {
  completionRate: 84,
  fullyComplete:  210,
  withMissing:    128,
  notSubmitted:   40,
};

export const MOCK_SECTION_CAPACITY = [
  { section:"7 - Sampaguita",  enrolled:40, cap:45, adviser:"Ms. Reyes"    },
  { section:"7 - Gumamela",    enrolled:42, cap:45, adviser:"Mr. Santos"   },
  { section:"8 - Ilang-Ilang", enrolled:45, cap:45, adviser:"Ms. Garcia"   },
  { section:"9 - Rosal",       enrolled:38, cap:45, adviser:"Mr. Dela Cruz" },
  { section:"10 - Dahlia",     enrolled:44, cap:45, adviser:"Ms. Lim"      },
  { section:"11 - Camia",      enrolled:41, cap:45, adviser:"Mr. Bautista" },
];

export const MOCK_ENROLLMENT_BREAKDOWN = {
  new: 662, returning: 1377, transferees: 34, reEnrollees: 8,
  male: 979, female: 1060,
};

export const MOCK_TRANSFEREES = [
  { name:"Dela Cruz, Ana P.", from:"Talomo NHS",    grade:11, status:"Pending Docs"  },
  { name:"Torres, Rosa Mae",  from:"Buhangin NHS",  grade:10, status:"Approved"      },
  { name:"Aquino, Bea R.",    from:"Mintal NHS",    grade:8,  status:"For Interview" },
  { name:"Mendoza, Carlo T.", from:"Outside Davao", grade:9,  status:"Pending Docs"  },
];

export const MOCK_CALENDAR_EVENTS = [
  { date:"Mar 25", label:"Enrollment deadline – Grade 7",       type:"deadline" },
  { date:"Mar 28", label:"Parent-Teacher Conference",           type:"event"    },
  { date:"Apr 2",  label:"DepEd Report Submission (SF1, SF2)",  type:"deadline" },
  { date:"Apr 5",  label:"Foundation Week – No Classes",        type:"event"    },
  { date:"Apr 10", label:"Quarterly Exam – All Grades",         type:"exam"     },
  { date:"Apr 15", label:"Close of Enrollment Period",          type:"deadline" },
];

export const MOCK_COMPLIANCE_CHECKLIST = [
  { label:"SF1 – School Register",           done:true,  note:"Submitted Mar 10" },
  { label:"SF2 – Daily Attendance",          done:true,  note:"Submitted Mar 12" },
  { label:"SF4 – Progress Report Card",      done:false, note:"Due Apr 2"        },
  { label:"SF9 – Parent-Teacher Conference", done:false, note:"Due Apr 2"        },
  { label:"Enrollment Summary",              done:false, note:"Due Mar 30"       },
  { label:"Section Assignment Roster",       done:true,  note:"Submitted Mar 8"  },
];

export const MOCK_NOTIFICATIONS = [
  { msg:"Grade 7 – Sampaguita is at full capacity (45/45)",     type:"warn",  time:"2m ago"  },
  { msg:"8 applications have incomplete documents",             type:"alert", time:"15m ago" },
  { msg:"DepEd report SF1 due in 9 days",                      type:"alert", time:"1h ago"  },
  { msg:"APP-0093 transferee docs verified by Guidance Office", type:"info",  time:"2h ago"  },
  { msg:"3 students re-enrolled after dropping last SY",        type:"info",  time:"3h ago"  },
];