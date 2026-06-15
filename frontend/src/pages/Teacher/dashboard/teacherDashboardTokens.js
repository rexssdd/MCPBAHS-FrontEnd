export const attendanceColor = {
  Present: { bg:"#f0fdf4", color:"#15803d", border:"#bbf7d0" },
  Late:    { bg:"#fefce8", color:"#a16207", border:"#fde68a" },
  Absent:  { bg:"#fef2f2", color:"#b91c1c", border:"#fecaca" },
};
export const remarksColor = {
  Passed:    { bg:"#f0fdf4", color:"#15803d" },
  "At Risk": { bg:"#fefce8", color:"#a16207" },
  Failed:    { bg:"#fef2f2", color:"#b91c1c" },
};
export const notifColor = {
  warn:  { bg:"#fefce8", border:"#fde047", icon:"⚠", color:"#854d0e" },
  info:  { bg:"#f0fdf4", border:"#bbf7d0", icon:"ℹ", color:"#14532d" },
  alert: { bg:"#fef2f2", border:"#fca5a5", icon:"!", color:"#991b1b" },
};
export const eventColor = { deadline:"#ef4444", event:"#1a5c1a", exam:"#d97706" };

export const TABS = [
  { id:"overview",   label:"Overview"   },
  { id:"grades",     label:"Grades"     },
  { id:"attendance", label:"Attendance" },
  { id:"schedule",   label:"Schedule"   },
];