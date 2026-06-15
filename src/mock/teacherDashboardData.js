// src/hooks/Teacher/teacherDashboardData.js
// All static/mock data for the Teacher Dashboard.
// In production, replace these with real API responses.

export const MOCK_STATS = {
  presentToday:   34,
  totalStudents:  38,
  pendingGrades:  12,
  lowPerformers:   4,
  upcomingEvents:  3,
  classAverage:  "82.4",
};

export const MOCK_ATTENDANCE = [
  { id:"2024-001", name:"Reyes, Ana Marie",   status:"Present", time:"7:42 AM" },
  { id:"2024-002", name:"Santos, Carlo B.",    status:"Late",    time:"8:15 AM" },
  { id:"2024-003", name:"Cruz, Liza P.",       status:"Absent",  time:"—"       },
  { id:"2024-004", name:"Dela Cruz, Mark",     status:"Present", time:"7:38 AM" },
  { id:"2024-005", name:"Mendoza, Jessa R.",   status:"Present", time:"7:55 AM" },
  { id:"2024-006", name:"Garcia, Renz L.",     status:"Late",    time:"8:22 AM" },
  { id:"2024-007", name:"Villanueva, Kaye M.", status:"Present", time:"7:50 AM" },
  { id:"2024-008", name:"Bautista, Nico D.",   status:"Absent",  time:"—"       },
  { id:"2024-009", name:"Torres, Bianca C.",   status:"Present", time:"7:44 AM" },
  { id:"2024-010", name:"Aquino, Jun P.",       status:"Present", time:"7:39 AM" },
  { id:"2024-011", name:"Ramos, Sheila V.",     status:"Late",    time:"8:10 AM" },
  { id:"2024-012", name:"Flores, Eduard M.",    status:"Present", time:"7:57 AM" },
  { id:"2024-013", name:"Castillo, Ria A.",     status:"Absent",  time:"—"       },
  { id:"2024-014", name:"Morales, Danie L.",    status:"Present", time:"7:48 AM" },
  { id:"2024-015", name:"Navarro, Paolo B.",    status:"Present", time:"7:53 AM" },
];

export const MOCK_GRADES = [
  { id:"2024-001", name:"Reyes, Ana Marie",  q1:92, q2:88, q3:90, q4:null, avg:90.0, remarks:"Passed"  },
  { id:"2024-002", name:"Santos, Carlo B.",  q1:76, q2:79, q3:74, q4:null, avg:76.3, remarks:"Passed"  },
  { id:"2024-003", name:"Cruz, Liza P.",      q1:61, q2:64, q3:58, q4:null, avg:61.0, remarks:"At Risk" },
  { id:"2024-004", name:"Dela Cruz, Mark",   q1:85, q2:83, q3:88, q4:null, avg:85.3, remarks:"Passed"  },
  { id:"2024-005", name:"Mendoza, Jessa R.", q1:95, q2:96, q3:94, q4:null, avg:95.0, remarks:"Passed"  },
  { id:"2024-006", name:"Garcia, Renz L.",   q1:70, q2:68, q3:72, q4:null, avg:70.0, remarks:"Passed"  },
  { id:"2024-007", name:"Villanueva, Kaye",  q1:88, q2:91, q3:87, q4:null, avg:88.7, remarks:"Passed"  },
  { id:"2024-008", name:"Bautista, Nico D.", q1:55, q2:59, q3:57, q4:null, avg:57.0, remarks:"Failed"  },
];

export const MOCK_LOW_PERFORMERS = [
  { name:"Cruz, Liza P.",     avg:61.0, absences:6, subject:"Mathematics", grade:8, concern:"Low scores + frequent absences"         },
  { name:"Bautista, Nico D.", avg:57.0, absences:9, subject:"Mathematics", grade:8, concern:"Failing average, needs intervention"     },
  { name:"Garcia, Renz L.",   avg:70.0, absences:3, subject:"Mathematics", grade:8, concern:"Borderline, at risk of failing Q4"       },
  { name:"Santos, Carlo B.",  avg:76.3, absences:2, subject:"Mathematics", grade:8, concern:"Below class average, needs support"      },
];

export const MOCK_SCHEDULE = [
  { period:"1st Period", time:"7:30 – 8:30",   subject:"Mathematics 8",  section:"8-Mabini",    room:"Room 12" },
  { period:"2nd Period", time:"8:30 – 9:30",   subject:"Mathematics 7",  section:"7-Rizal",     room:"Room 12" },
  { period:"3rd Period", time:"9:30 – 10:30",  subject:"Mathematics 9",  section:"9-Bonifacio", room:"Room 12" },
  { period:"Break",      time:"10:30 – 11:00", subject:"—",               section:"—",           room:"—"       },
  { period:"4th Period", time:"11:00 – 12:00", subject:"Advisory Class", section:"8-Mabini",    room:"Room 12" },
  { period:"Lunch",      time:"12:00 – 1:00",  subject:"—",               section:"—",           room:"—"       },
  { period:"5th Period", time:"1:00 – 2:00",   subject:"Mathematics 10", section:"10-Luna",     room:"Room 14" },
];

export const MOCK_CALENDAR = [
  { date:"May 14", type:"deadline", label:"Q3 Grade Submission Deadline"          },
  { date:"May 15", type:"event",    label:"Faculty Meeting – Principal's Office"  },
  { date:"May 19", type:"exam",     label:"Unit Test — Fractions & Decimals"      },
  { date:"May 22", type:"event",    label:"Parent-Teacher Conference"             },
  { date:"May 30", type:"deadline", label:"Quarterly Report Cards Distribution"   },
];

export const MOCK_NOTIFICATIONS = [
  { type:"warn",  msg:"4 students are at risk of failing Q3. Intervention needed.", time:"Today, 7:00 AM" },
  { type:"alert", msg:"Grade submission closes in 3 days. 12 records pending.",     time:"Today, 6:45 AM" },
  { type:"info",  msg:"Parent-Teacher Conference scheduled for May 22.",            time:"Yesterday"      },
  { type:"info",  msg:"Class performance report is ready for download.",            time:"May 10"         },
];

export const MOCK_SUBJECT_PERFORMANCE = [
  { subject:"Whole Numbers",     avgScore:88, passRate:96 },
  { subject:"Fractions",         avgScore:74, passRate:82 },
  { subject:"Algebra Basics",    avgScore:79, passRate:87 },
  { subject:"Geometry",          avgScore:83, passRate:91 },
  { subject:"Data & Statistics", avgScore:69, passRate:76 },
];

export const MOCK_RECENT_ACTIVITIES = [
  { name:"Reyes, Ana Marie",  action:"Grade Updated", detail:"Q3 Math: 92",        time:"10 min ago"  },
  { name:"Cruz, Liza P.",     action:"Absent Marked", detail:"3rd consecutive",     time:"30 min ago"  },
  { name:"Mendoza, Jessa R.", action:"Grade Updated", detail:"Q3 Math: 95",        time:"1 hr ago"    },
  { name:"Bautista, Nico D.", action:"Intervention",  detail:"Consultation logged", time:"2 hrs ago"   },
  { name:"Santos, Carlo B.",  action:"Late",          detail:"8:15 AM arrival",     time:"This morning"},
];
