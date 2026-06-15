export const COUNTRY_OPTIONS = ["Philippines"];

export const PHILIPPINE_REGIONS = [
  "National Capital Region (NCR)",
  "Cordillera Administrative Region (CAR)",
  "Region I - Ilocos Region",
  "Region II - Cagayan Valley",
  "Region III - Central Luzon",
  "Region IV-A - CALABARZON",
  "MIMAROPA Region",
  "Region V - Bicol Region",
  "Region VI - Western Visayas",
  "Region VII - Central Visayas",
  "Region VIII - Eastern Visayas",
  "Region IX - Zamboanga Peninsula",
  "Region X - Northern Mindanao",
  "Region XI - Davao Region",
  "Region XII - SOCCSKSARGEN",
  "Region XIII - Caraga",
  "Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)",
];

export const PROVINCES_BY_REGION = {
  "National Capital Region (NCR)": ["Metro Manila"],
  "Cordillera Administrative Region (CAR)": ["Abra", "Apayao", "Benguet", "Ifugao", "Kalinga", "Mountain Province"],
  "Region I - Ilocos Region": ["Ilocos Norte", "Ilocos Sur", "La Union", "Pangasinan"],
  "Region II - Cagayan Valley": ["Batanes", "Cagayan", "Isabela", "Nueva Vizcaya", "Quirino"],
  "Region III - Central Luzon": ["Aurora", "Bataan", "Bulacan", "Nueva Ecija", "Pampanga", "Tarlac", "Zambales"],
  "Region IV-A - CALABARZON": ["Batangas", "Cavite", "Laguna", "Quezon", "Rizal"],
  "MIMAROPA Region": ["Marinduque", "Occidental Mindoro", "Oriental Mindoro", "Palawan", "Romblon"],
  "Region V - Bicol Region": ["Albay", "Camarines Norte", "Camarines Sur", "Catanduanes", "Masbate", "Sorsogon"],
  "Region VI - Western Visayas": ["Aklan", "Antique", "Capiz", "Guimaras", "Iloilo", "Negros Occidental"],
  "Region VII - Central Visayas": ["Bohol", "Cebu", "Negros Oriental", "Siquijor"],
  "Region VIII - Eastern Visayas": ["Biliran", "Eastern Samar", "Leyte", "Northern Samar", "Samar", "Southern Leyte"],
  "Region IX - Zamboanga Peninsula": ["Zamboanga del Norte", "Zamboanga del Sur", "Zamboanga Sibugay"],
  "Region X - Northern Mindanao": ["Bukidnon", "Camiguin", "Lanao del Norte", "Misamis Occidental", "Misamis Oriental"],
  "Region XI - Davao Region": ["Davao de Oro", "Davao del Norte", "Davao del Sur", "Davao Occidental", "Davao Oriental"],
  "Region XII - SOCCSKSARGEN": ["Cotabato", "Sarangani", "South Cotabato", "Sultan Kudarat"],
  "Region XIII - Caraga": ["Agusan del Norte", "Agusan del Sur", "Dinagat Islands", "Surigao del Norte", "Surigao del Sur"],
  "Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)": ["Basilan", "Lanao del Sur", "Maguindanao del Norte", "Maguindanao del Sur", "Sulu", "Tawi-Tawi"],
};

export const CITIES_BY_PROVINCE = {
  "Metro Manila": ["Caloocan", "Las Pinas", "Makati", "Malabon", "Mandaluyong", "Manila", "Marikina", "Muntinlupa", "Navotas", "Paranaque", "Pasay", "Pasig", "Quezon City", "San Juan", "Taguig", "Valenzuela"],
  "Lanao del Norte": ["Bacolod", "Baloi", "Baroy", "Iligan City", "Kapatagan", "Kauswagan", "Kolambugan", "Lala", "Linamon", "Magsaysay", "Maigo", "Matungao", "Munai", "Nunungan", "Pantao Ragat", "Pantar", "Poona Piagapo", "Salvador", "Sapad", "Sultan Naga Dimaporo", "Tagoloan", "Tangcal", "Tubod"],
  "Misamis Oriental": ["Alubijid", "Balingasag", "Cagayan de Oro City", "Claveria", "El Salvador City", "Gingoog City", "Initao", "Jasaan", "Laguindingan", "Manticao", "Opol", "Tagoloan", "Villanueva"],
  "Bukidnon": ["Malaybalay City", "Valencia City", "Manolo Fortich", "Maramag", "Quezon", "San Fernando", "Talakag"],
  "Misamis Occidental": ["Oroquieta City", "Ozamiz City", "Tangub City", "Jimenez", "Plaridel"],
  "Camiguin": ["Catarman", "Guinsiliban", "Mahinog", "Mambajao", "Sagay"],
  "Davao del Sur": ["Davao City", "Digos City", "Bansalan", "Hagonoy", "Kiblawan", "Magsaysay", "Malalag", "Matanao", "Padada", "Santa Cruz", "Sulop"],
  "Davao del Norte": ["Panabo City", "Samal", "Tagum City", "Asuncion", "Carmen", "Kapalong", "New Corella", "Santo Tomas"],
  "Davao de Oro": ["Compostela", "Laak", "Mabini", "Maco", "Maragusan", "Mawab", "Monkayo", "Montevista", "Nabunturan", "New Bataan", "Pantukan"],
  "Davao Occidental": ["Don Marcelino", "Jose Abad Santos", "Malita", "Santa Maria", "Sarangani"],
  "Davao Oriental": ["Mati City", "Baganga", "Banaybanay", "Boston", "Caraga", "Cateel", "Governor Generoso", "Lupon", "Manay", "San Isidro", "Tarragona"],
  "Cebu": ["Cebu City", "Lapu-Lapu City", "Mandaue City", "Talisay City", "Toledo City"],
  "Bohol": ["Tagbilaran City", "Alburquerque", "Anda", "Panglao", "Tubigon"],
  "Pangasinan": ["Dagupan City", "San Carlos City", "Urdaneta City", "Alaminos City"],
  "Cavite": ["Bacoor City", "Cavite City", "Dasmarinas City", "General Trias City", "Imus City", "Tagaytay City", "Trece Martires City"],
  "Laguna": ["Binan City", "Calamba City", "San Pablo City", "Santa Rosa City"],
  "Rizal": ["Antipolo City", "Cainta", "Rodriguez", "San Mateo", "Taytay"],
  "Batangas": ["Batangas City", "Lipa City", "Tanauan City", "Nasugbu"],
  "Iloilo": ["Iloilo City", "Passi City", "Oton", "Pototan"],
  "Negros Occidental": ["Bacolod City", "Bago City", "Cadiz City", "Kabankalan City", "Silay City"],
  "South Cotabato": ["General Santos City", "Koronadal City", "Polomolok", "Tupi"],
  "Cotabato": ["Kidapawan City", "Midsayap", "Mlang", "Pigcawayan"],
  "Agusan del Norte": ["Butuan City", "Cabadbaran City", "Buenavista", "Nasipit"],
  "Surigao del Norte": ["Surigao City", "Dapa", "General Luna", "Placer"],
  "Zamboanga del Sur": ["Pagadian City", "Zamboanga City", "Molave"],
  "Zamboanga del Norte": ["Dapitan City", "Dipolog City", "Sindangan"],
};

export const ALL_PROVINCES = Object.values(PROVINCES_BY_REGION).flat();
export const ALL_CITIES = Array.from(new Set(Object.values(CITIES_BY_PROVINCE).flat())).sort();

export function getProvinceOptions(region) {
  return PROVINCES_BY_REGION[region] || ALL_PROVINCES;
}

export function getCityOptions(province) {
  return CITIES_BY_PROVINCE[province] || ALL_CITIES;
}



