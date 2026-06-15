export const GRADE_LEVELS = ["Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12"];
export const SCHOOL_TYPES = ["Public","Private","Special Science School","Integrated School"];
export const PALETTE      = ["#1a5c1a","#2a7a2a","#c4920a","#1d4ed8","#7c3aed","#dc2626","#0891b2","#db2777"];
export const PAGE_SIZE    = 8;
export const getInitials  = name => name.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();
export const getAvatarBg  = name => PALETTE[name.charCodeAt(0)%PALETTE.length];

export const generateDefaultEnrollees = () => {
  const fn=["John Jay","Maria","Jose","Ana","Pedro","Rosa","Carlo","Liza","Marco","Jenny","Renz","Carla","Alvin","Bea","Dan"];
  const ln=["Doe","Santos","Bautista","Cruz","Garcia","Villanueva","Reyes","Tan","Lim","Torres","Rivera","Mendoza","Flores","Ramos","Aquino"];
  return Array.from({length:40},(_,i)=>({
    id:String(100000+i+1), learnerId:String(200000+i+1),
    firstName:fn[i%fn.length], middleName:"Simon", lastName:ln[i%ln.length],
    gradeLevel:GRADE_LEVELS[i%GRADE_LEVELS.length],
    email:`${fn[i%fn.length].toLowerCase().replace(" ",".")}@example.com`,
    phone:`091${String(20000000+i).slice(0,8)}`, dob:"12-01-2008",
    country:"Philippines", city:"Matina, Davao City", postalCode:"8000",
    oldSchoolName:"Talomo National High School", oldSchoolType:"Public",
    oldSchoolId:"612345", oldSchoolAddress:"Brgy. Talomo Proper, Talomo, Davao City",
    status: i%7===2?"Archived":"Active",
  }));
};

export const EMPTY_FORM = {
  firstName:"",middleName:"",lastName:"",email:"",phone:"",dob:"",
  country:"Philippines",city:"",postalCode:"",
  oldSchoolName:"",oldSchoolType:"",oldSchoolId:"",oldSchoolAddress:"",
};
