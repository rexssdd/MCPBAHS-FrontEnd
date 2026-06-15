export const DEFAULT_SECTIONS = [
  { id:"sec-001", gradeLevel:"9",  sectionName:"Gumamela",    adviser:"Mr. John Jay Doe",   students:30 },
  { id:"sec-002", gradeLevel:"8",  sectionName:"Sampaguita",  adviser:"Ms. Maria Santos",   students:35 },
  { id:"sec-003", gradeLevel:"10", sectionName:"Rosal",       adviser:"Ms. Ana Dela Cruz",  students:38 },
  { id:"sec-004", gradeLevel:"7",  sectionName:"Ilang-Ilang", adviser:"Mr. Pedro Garcia",   students:32 },
  { id:"sec-005", gradeLevel:"11", sectionName:"Dahlia",      adviser:"Mr. Carlo Reyes",    students:29 },
  { id:"sec-006", gradeLevel:"12", sectionName:"Camia",       adviser:"Ms. Liza Tan",       students:28 },
  { id:"sec-007", gradeLevel:"9",  sectionName:"Rosas",       adviser:"Mr. Mark Villanueva",students:31 },
  { id:"sec-008", gradeLevel:"8",  sectionName:"Sunflower",   adviser:"Ms. Joy Reyes",      students:33 },
  { id:"sec-009", gradeLevel:"10", sectionName:"Adelfa",      adviser:"Mr. Leo Santos",     students:37 },
  { id:"sec-010", gradeLevel:"7",  sectionName:"Lotus",       adviser:"Ms. Nina Cruz",      students:34 },
  { id:"sec-011", gradeLevel:"11", sectionName:"Lily",        adviser:"Mr. Ben Flores",     students:27 },
  { id:"sec-012", gradeLevel:"12", sectionName:"Orchid",      adviser:"Ms. Carla Mendoza",  students:26 },
];
export const DEFAULT_SCHEDULES = [
  { id:"sch-001", subject:"Science",            gradeLevel:"9",  section:"Gumamela",    adviser:"Mr. John Jay Doe",   timeslot:"Mon-Wed at 10:00 am - 11:00 am" },
  { id:"sch-002", subject:"Mathematics",        gradeLevel:"8",  section:"Sampaguita",  adviser:"Ms. Maria Santos",   timeslot:"Tue-Thu at 8:00 am - 9:00 am"   },
  { id:"sch-003", subject:"English",            gradeLevel:"10", section:"Rosal",       adviser:"Ms. Ana Dela Cruz",  timeslot:"Mon-Fri at 1:00 pm - 2:00 pm"   },
  { id:"sch-004", subject:"Filipino",           gradeLevel:"7",  section:"Ilang-Ilang", adviser:"Mr. Pedro Garcia",   timeslot:"Wed-Fri at 9:00 am - 10:00 am"  },
  { id:"sch-005", subject:"MAPEH",              gradeLevel:"11", section:"Dahlia",      adviser:"Mr. Carlo Reyes",    timeslot:"Tue-Thu at 2:00 pm - 3:00 pm"   },
  { id:"sch-006", subject:"TLE",                gradeLevel:"12", section:"Camia",       adviser:"Ms. Liza Tan",       timeslot:"Mon-Wed at 3:00 pm - 4:00 pm"   },
  { id:"sch-007", subject:"Araling Panlipunan", gradeLevel:"9",  section:"Rosas",       adviser:"Mr. Mark Villanueva",timeslot:"Mon-Wed at 11:00 am - 12:00 pm" },
  { id:"sch-008", subject:"Science",            gradeLevel:"8",  section:"Sunflower",   adviser:"Ms. Joy Reyes",      timeslot:"Thu-Fri at 10:00 am - 11:00 am" },
  { id:"sch-009", subject:"Mathematics",        gradeLevel:"10", section:"Adelfa",      adviser:"Mr. Leo Santos",     timeslot:"Mon-Wed at 8:00 am - 9:00 am"   },
  { id:"sch-010", subject:"English",            gradeLevel:"7",  section:"Lotus",       adviser:"Ms. Nina Cruz",      timeslot:"Tue-Thu at 1:00 pm - 2:00 pm"   },
  { id:"sch-011", subject:"Filipino",           gradeLevel:"11", section:"Lily",        adviser:"Mr. Ben Flores",     timeslot:"Wed-Fri at 11:00 am - 12:00 pm" },
  { id:"sch-012", subject:"MAPEH",              gradeLevel:"12", section:"Orchid",      adviser:"Ms. Carla Mendoza",  timeslot:"Mon-Tue at 2:00 pm - 3:00 pm"   },
];
export const STUDENT_ROSTER = {
  "Gumamela":    [{last:"Cooper",first:"Kristin"},{last:"Miles",first:"Esther"},{last:"Nguyen",first:"Shane"},{last:"Black",first:"Marvin"},{last:"Henry",first:"Arthur"},{last:"Flores",first:"Juanita"},{last:"Torres",first:"Leo"},{last:"Rivera",first:"Camille"}],
  "Sampaguita":  [{last:"Reyes",first:"Ana"},{last:"Santos",first:"Mark"},{last:"Cruz",first:"Lily"},{last:"Bautista",first:"Jose"}],
  "Rosal":       [{last:"Garcia",first:"Pedro"},{last:"Tan",first:"Liza"},{last:"Mendoza",first:"Carla"}],
  "Ilang-Ilang": [{last:"Villanueva",first:"Mark"},{last:"Reyes",first:"Joy"},{last:"Santos",first:"Leo"}],
};
export const TEACHERS      = ["Mr. John Jay Doe","Ms. Maria Santos","Ms. Ana Dela Cruz","Mr. Pedro Garcia","Mr. Carlo Reyes","Ms. Liza Tan","Mr. Mark Villanueva","Ms. Joy Reyes","Mr. Leo Santos","Ms. Nina Cruz","Mr. Ben Flores","Ms. Carla Mendoza"];
export const SUBJECTS      = ["Science","Mathematics","English","Filipino","MAPEH","TLE","Araling Panlipunan","ESP","Computer Science","Values Education"];
export const GRADE_LEVELS  = ["7","8","9","10","11","12"];
export const SECTION_NAMES = ["Gumamela","Sampaguita","Rosal","Ilang-Ilang","Dahlia","Camia","Rosas","Lotus","Sunflower","Adelfa","Lily","Orchid","Waling-Waling","Everlasting","Santan","Jasmine"];
export const TIMESLOTS     = ["Mon-Wed at 7:00 am - 8:00 am","Mon-Wed at 8:00 am - 9:00 am","Mon-Wed at 9:00 am - 10:00 am","Mon-Wed at 10:00 am - 11:00 am","Mon-Wed at 11:00 am - 12:00 pm","Mon-Wed at 1:00 pm - 2:00 pm","Mon-Wed at 2:00 pm - 3:00 pm","Mon-Wed at 3:00 pm - 4:00 pm","Tue-Thu at 7:00 am - 8:00 am","Tue-Thu at 8:00 am - 9:00 am","Tue-Thu at 9:00 am - 10:00 am","Tue-Thu at 10:00 am - 11:00 am","Tue-Thu at 1:00 pm - 2:00 pm","Tue-Thu at 2:00 pm - 3:00 pm","Tue-Thu at 3:00 pm - 4:00 pm","Wed-Fri at 9:00 am - 10:00 am","Wed-Fri at 11:00 am - 12:00 pm","Mon-Fri at 1:00 pm - 2:00 pm","Thu-Fri at 10:00 am - 11:00 am","Mon-Tue at 2:00 pm - 3:00 pm"];
export const PAGE_SIZE = 8;
