export const SF_INFO = {
  1:  { name:"SF1",  title:"School Register",                            desc:"Masterlist of all enrolled learners per section per school year." },
  2:  { name:"SF2",  title:"Daily Attendance Report",                    desc:"Daily attendance record of learners for a given month." },
  3:  { name:"SF3",  title:"Books Issued and Returned",                  desc:"Record of textbooks issued and returned by learners." },
  4:  { name:"SF4",  title:"Progress Report Card",                       desc:"Quarterly assessment and academic progress of each learner." },
  5:  { name:"SF5",  title:"Report on Promotion & Level of Proficiency", desc:"End-of-year promotion status and subject proficiency levels." },
  6:  { name:"SF6",  title:"Summarized Report on Promotion",             desc:"Section-level summary of promotion results per grade/section." },
  7:  { name:"SF7",  title:"Home Address & Health Card",                 desc:"Learner home address, parent info, and basic health profile." },
  8:  { name:"SF8",  title:"Learner's Nutrition Report",                 desc:"Nutritional status assessment of learners per quarter." },
  9:  { name:"SF9",  title:"Parent-Teacher Conference",                  desc:"Record of parent-teacher conferences and outcomes." },
  10: { name:"SF10", title:"Permanent Record / Cumulative Record",       desc:"Comprehensive permanent academic record of each learner." },
};

/* ══════════════════════════════════════════════════════════
   MOCK / DEFAULT DATA
══════════════════════════════════════════════════════════ */
export const LEARNERS = [
  "Aguilar, Mark Casuela","Benedecto, Albert Juan","Garcia, Paul Sola",
  "Gunio, Berty Patas","Neri, Denise Rios","Reyes, Carlo Bautista",
  "Santos, Maria Cruz","Tan, Liza Garcia","Torres, Jenny Rivera",
  "Lim, Marco Mendoza","Ramos, Alvin Flores","Aquino, Bea Torres",
  "Cruz, Ana Dela","Villanueva, Rosa Mendoza","Bautista, Jose Reyes",
];

export const generateMockReports = () => {
  const submitters = ["John Jay Doe","Maria Santos","Jose Bautista","Ana Cruz","Pedro Garcia","Rosa Villanueva","Carlo Reyes","Liza Tan"];
  return Array.from({ length: 40 }, (_, i) => {
    const sfNum = (i % 10) + 1;
    return {
      id:            String(100000 + i + 1),
      sfNumber:      sfNum,
      docId:         `SF${sfNum}-2025-${String(i + 1).padStart(3,"0")}`,
      submittedBy:   submitters[i % submitters.length],
      dateSubmitted: `12/${String((i % 28) + 1).padStart(2,"0")}/25`,
      fileName:      `SF${sfNum}.pdf`,
      fileType:      i % 3 === 0 ? "DOCX" : "PDF",
      fileSize:      "8.77 MB",
      status:        i % 5 === 0 ? "Approved" : i % 5 === 1 ? "Disapproved" : "Pending",
      submittedOn:   "12/05/25",
      evaluatedOn:   "12/06/25",
      gradeLevel:    `Grade ${7 + (i % 6)}`,
      section:       ["Gemini","Orion","Lyra","Vega","Aquila"][i % 5],
      month:         ["January","February","March","April","May","June"][i % 6],
      schoolYear:    "2024-2025",
      comment:       i % 5 === 1 ? "The report contains missing data. Please resubmit with complete records." : "",
      files: [{ name:`SF${sfNum}.pdf`, status:"complete" }, { name:"supporting.docx", status:"complete" }],
    };
  });
};

export const MOCK_REPORTS = generateMockReports();
export const PAGE_SIZE = 10;
export const SUBJECTS = ["Filipino","English","Mathematics","Science","AP","ESP","MAPEH","TLE"];
