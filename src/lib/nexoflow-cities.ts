// Nexoflow City Partners — 137 cities across Luzon, Visayas & Mindanao
// Source: Nexoflow City Partners document

export type Island = "Luzon" | "Visayas" | "Mindanao";

export interface NexoflowCity {
  city: string;
  province: string;
  island: Island;
  isMetroManila?: boolean;
  hub?: "NCR" | "North Luzon" | "South Luzon" | "Visayas" | "Mindanao";
  lat?: number;
  lng?: number;
}

export const NEXOFLOW_CITIES: NexoflowCity[] = [
  // ── Luzon (68 cities) ────────────────────────────────────────────────────
  { city: "Caloocan",          province: "Metro Manila",     island: "Luzon", isMetroManila: true,  hub: "NCR",          lat: 14.7492, lng: 121.0600 },
  { city: "Las Piñas",         province: "Metro Manila",     island: "Luzon", isMetroManila: true,  hub: "NCR",          lat: 14.4453, lng: 120.9837 },
  { city: "Makati",            province: "Metro Manila",     island: "Luzon", isMetroManila: true,  hub: "NCR",          lat: 14.5547, lng: 121.0244 },
  { city: "Malabon",           province: "Metro Manila",     island: "Luzon", isMetroManila: true,  hub: "NCR",          lat: 14.6597, lng: 120.9700 },
  { city: "Mandaluyong",       province: "Metro Manila",     island: "Luzon", isMetroManila: true,  hub: "NCR",          lat: 14.5794, lng: 121.0359 },
  { city: "Manila",            province: "Metro Manila",     island: "Luzon", isMetroManila: true,  hub: "NCR",          lat: 14.5995, lng: 120.9842 },
  { city: "Marikina",          province: "Metro Manila",     island: "Luzon", isMetroManila: true,  hub: "NCR",          lat: 14.6507, lng: 121.1029 },
  { city: "Muntinlupa",        province: "Metro Manila",     island: "Luzon", isMetroManila: true,  hub: "NCR",          lat: 14.4082, lng: 121.0450 },
  { city: "Navotas",           province: "Metro Manila",     island: "Luzon", isMetroManila: true,  hub: "NCR",          lat: 14.6667, lng: 120.9500 },
  { city: "Parañaque",         province: "Metro Manila",     island: "Luzon", isMetroManila: true,  hub: "NCR",          lat: 14.4793, lng: 121.0198 },
  { city: "Pasay",             province: "Metro Manila",     island: "Luzon", isMetroManila: true,  hub: "NCR",          lat: 14.5378, lng: 121.0014 },
  { city: "Pasig",             province: "Metro Manila",     island: "Luzon", isMetroManila: true,  hub: "NCR",          lat: 14.5764, lng: 121.0851 },
  { city: "Quezon City",       province: "Metro Manila",     island: "Luzon", isMetroManila: true,  hub: "NCR",          lat: 14.6760, lng: 121.0437 },
  { city: "San Juan",          province: "Metro Manila",     island: "Luzon", isMetroManila: true,  hub: "NCR",          lat: 14.6000, lng: 121.0333 },
  { city: "Taguig",            province: "Metro Manila",     island: "Luzon", isMetroManila: true,  hub: "NCR",          lat: 14.5176, lng: 121.0509 },
  { city: "Valenzuela",        province: "Metro Manila",     island: "Luzon", isMetroManila: true,  hub: "NCR",          lat: 14.7011, lng: 120.9830 },
  { city: "Antipolo",          province: "Rizal",            island: "Luzon",                       hub: "NCR",          lat: 14.6260, lng: 121.1752 },
  { city: "Bacoor",            province: "Cavite",           island: "Luzon",                       hub: "NCR",          lat: 14.4580, lng: 120.9342 },
  { city: "Cavite City",       province: "Cavite",           island: "Luzon",                       hub: "NCR",          lat: 14.4791, lng: 120.8970 },
  { city: "Dasmariñas",        province: "Cavite",           island: "Luzon",                       hub: "South Luzon",  lat: 14.3294, lng: 120.9367 },
  { city: "General Trias",     province: "Cavite",           island: "Luzon",                       hub: "South Luzon",  lat: 14.3868, lng: 120.8807 },
  { city: "Tagaytay",          province: "Cavite",           island: "Luzon",                       hub: "South Luzon",  lat: 14.1153, lng: 120.9621 },
  { city: "Trece Martires",    province: "Cavite",           island: "Luzon",                       hub: "South Luzon",  lat: 14.2832, lng: 120.8577 },
  { city: "Malolos",           province: "Bulacan",          island: "Luzon",                       hub: "North Luzon",  lat: 14.8527, lng: 120.8120 },
  { city: "Meycauayan",        province: "Bulacan",          island: "Luzon",                       hub: "North Luzon",  lat: 14.7347, lng: 120.9606 },
  { city: "San Jose del Monte", province: "Bulacan",         island: "Luzon",                       hub: "North Luzon",  lat: 14.8137, lng: 121.0453 },
  { city: "Biñan",             province: "Laguna",           island: "Luzon",                       hub: "South Luzon",  lat: 14.3407, lng: 121.0818 },
  { city: "Cabuyao",           province: "Laguna",           island: "Luzon",                       hub: "South Luzon",  lat: 14.2746, lng: 121.1250 },
  { city: "Calamba",           province: "Laguna",           island: "Luzon",                       hub: "South Luzon",  lat: 14.2116, lng: 121.1653 },
  { city: "San Pablo",         province: "Laguna",           island: "Luzon",                       hub: "South Luzon",  lat: 14.0685, lng: 121.3219 },
  { city: "San Pedro",         province: "Laguna",           island: "Luzon",                       hub: "South Luzon",  lat: 14.3588, lng: 121.0470 },
  { city: "Santa Rosa",        province: "Laguna",           island: "Luzon",                       hub: "South Luzon",  lat: 14.3122, lng: 121.1114 },
  { city: "Batangas City",     province: "Batangas",         island: "Luzon",                       hub: "South Luzon",  lat: 13.7565, lng: 121.0583 },
  { city: "Lipa",              province: "Batangas",         island: "Luzon",                       hub: "South Luzon",  lat: 13.9411, lng: 121.1635 },
  { city: "Santo Tomas",       province: "Batangas",         island: "Luzon",                       hub: "South Luzon",  lat: 14.1059, lng: 121.1415 },
  { city: "Tanauan",           province: "Batangas",         island: "Luzon",                       hub: "South Luzon",  lat: 13.9980, lng: 121.1498 },
  { city: "Lucena",            province: "Quezon",           island: "Luzon",                       hub: "South Luzon",  lat: 13.9317, lng: 121.6172 },
  { city: "Tayabas",           province: "Quezon",           island: "Luzon",                       hub: "South Luzon",  lat: 14.0244, lng: 121.5936 },
  { city: "Angeles",           province: "Pampanga",         island: "Luzon",                       hub: "North Luzon",  lat: 15.1450, lng: 120.5887 },
  { city: "San Fernando",      province: "Pampanga",         island: "Luzon",                       hub: "North Luzon",  lat: 15.0288, lng: 120.6889 },
  { city: "Balanga",           province: "Bataan",           island: "Luzon",                       hub: "North Luzon",  lat: 14.6751, lng: 120.5363 },
  { city: "Olongapo",          province: "Zambales",         island: "Luzon",                       hub: "North Luzon",  lat: 14.8295, lng: 120.2834 },
  { city: "Cabanatuan",        province: "Nueva Ecija",      island: "Luzon",                       hub: "North Luzon",  lat: 15.4872, lng: 120.9707 },
  { city: "Palayan",           province: "Nueva Ecija",      island: "Luzon",                       hub: "North Luzon",  lat: 15.5377, lng: 121.0837 },
  { city: "San Jose",          province: "Nueva Ecija",      island: "Luzon",                       hub: "North Luzon",  lat: 15.7939, lng: 120.9935 },
  { city: "Dagupan",           province: "Pangasinan",       island: "Luzon",                       hub: "North Luzon",  lat: 16.0430, lng: 120.3330 },
  { city: "Alaminos",          province: "Pangasinan",       island: "Luzon",                       hub: "North Luzon",  lat: 16.1524, lng: 119.9797 },
  { city: "San Carlos",        province: "Pangasinan",       island: "Luzon",                       hub: "North Luzon",  lat: 15.9268, lng: 120.3242 },
  { city: "Urdaneta",          province: "Pangasinan",       island: "Luzon",                       hub: "North Luzon",  lat: 15.9759, lng: 120.5706 },
  { city: "Baguio",            province: "Benguet",          island: "Luzon",                       hub: "North Luzon",  lat: 16.4023, lng: 120.5960 },
  { city: "San Fernando",      province: "La Union",         island: "Luzon",                       hub: "North Luzon",  lat: 16.6159, lng: 120.3166 },
  { city: "Batac",             province: "Ilocos Norte",     island: "Luzon",                       hub: "North Luzon",  lat: 18.0550, lng: 120.5644 },
  { city: "Laoag",             province: "Ilocos Norte",     island: "Luzon",                       hub: "North Luzon",  lat: 18.1977, lng: 120.5937 },
  { city: "Candon",            province: "Ilocos Sur",       island: "Luzon",                       hub: "North Luzon",  lat: 17.1952, lng: 120.4522 },
  { city: "Vigan",             province: "Ilocos Sur",       island: "Luzon",                       hub: "North Luzon",  lat: 17.5747, lng: 120.3869 },
  { city: "Cauayan",           province: "Isabela",          island: "Luzon",                       hub: "North Luzon",  lat: 16.9312, lng: 121.7727 },
  { city: "Ilagan",            province: "Isabela",          island: "Luzon",                       hub: "North Luzon",  lat: 17.1488, lng: 121.8906 },
  { city: "Santiago",          province: "Isabela",          island: "Luzon",                       hub: "North Luzon",  lat: 16.6884, lng: 121.5497 },
  { city: "Tuguegarao",        province: "Cagayan",          island: "Luzon",                       hub: "North Luzon",  lat: 17.6130, lng: 121.7270 },
  { city: "Legazpi",           province: "Albay",            island: "Luzon",                       hub: "South Luzon",  lat: 13.1391, lng: 123.7437 },
  { city: "Ligao",             province: "Albay",            island: "Luzon",                       hub: "South Luzon",  lat: 13.2289, lng: 123.5331 },
  { city: "Tabaco",            province: "Albay",            island: "Luzon",                       hub: "South Luzon",  lat: 13.3587, lng: 123.7337 },
  { city: "Iriga",             province: "Camarines Sur",    island: "Luzon",                       hub: "South Luzon",  lat: 13.4249, lng: 123.4082 },
  { city: "Naga",              province: "Camarines Sur",    island: "Luzon",                       hub: "South Luzon",  lat: 13.6218, lng: 123.1945 },
  { city: "Sorsogon City",     province: "Sorsogon",         island: "Luzon",                       hub: "South Luzon",  lat: 12.9742, lng: 124.0030 },
  { city: "Masbate City",      province: "Masbate",          island: "Luzon",                       hub: "South Luzon",  lat: 12.3685, lng: 123.6177 },
  { city: "Calapan",           province: "Oriental Mindoro", island: "Luzon",                       hub: "South Luzon",  lat: 13.4149, lng: 121.1799 },
  { city: "Puerto Princesa",   province: "Palawan",          island: "Luzon",                       hub: "South Luzon",  lat: 9.7392,  lng: 118.7353 },

  // ── Visayas (36 cities) ──────────────────────────────────────────────────
  { city: "Cebu City",         province: "Cebu",             island: "Visayas",                     hub: "Visayas",      lat: 10.3157, lng: 123.8854 },
  { city: "Lapu-Lapu",         province: "Cebu",             island: "Visayas",                     hub: "Visayas",      lat: 10.3103, lng: 124.0029 },
  { city: "Mandaue",           province: "Cebu",             island: "Visayas",                     hub: "Visayas",      lat: 10.3236, lng: 123.9223 },
  { city: "Talisay",           province: "Cebu",             island: "Visayas",                     hub: "Visayas",      lat: 10.2441, lng: 123.8487 },
  { city: "Danao",             province: "Cebu",             island: "Visayas",                     hub: "Visayas",      lat: 10.5228, lng: 124.0224 },
  { city: "Bogo",              province: "Cebu",             island: "Visayas",                     hub: "Visayas",      lat: 11.0519, lng: 124.0051 },
  { city: "Carcar",            province: "Cebu",             island: "Visayas",                     hub: "Visayas",      lat: 10.1063, lng: 123.6378 },
  { city: "Toledo",            province: "Cebu",             island: "Visayas",                     hub: "Visayas",      lat: 10.3772, lng: 123.6375 },
  { city: "Bacolod",           province: "Negros Occidental",island: "Visayas",                     hub: "Visayas",      lat: 10.6713, lng: 122.9511 },
  { city: "Bago",              province: "Negros Occidental",island: "Visayas",                     hub: "Visayas",      lat: 10.5378, lng: 122.8377 },
  { city: "Escalante",         province: "Negros Occidental",island: "Visayas",                     hub: "Visayas",      lat: 10.8456, lng: 123.4993 },
  { city: "Himamaylan",        province: "Negros Occidental",island: "Visayas",                     hub: "Visayas",      lat: 10.0986, lng: 122.8696 },
  { city: "Kabankalan",        province: "Negros Occidental",island: "Visayas",                     hub: "Visayas",      lat: 9.9895,  lng: 122.8145 },
  { city: "La Carlota",        province: "Negros Occidental",island: "Visayas",                     hub: "Visayas",      lat: 10.4235, lng: 122.9208 },
  { city: "Sagay",             province: "Negros Occidental",island: "Visayas",                     hub: "Visayas",      lat: 10.8956, lng: 123.4223 },
  { city: "San Carlos",        province: "Negros Occidental",island: "Visayas",                     hub: "Visayas",      lat: 10.4938, lng: 123.4132 },
  { city: "Silay",             province: "Negros Occidental",island: "Visayas",                     hub: "Visayas",      lat: 10.7983, lng: 122.9747 },
  { city: "Sipalay",           province: "Negros Occidental",island: "Visayas",                     hub: "Visayas",      lat: 9.7535,  lng: 122.4025 },
  { city: "Talisay",           province: "Negros Occidental",island: "Visayas",                     hub: "Visayas",      lat: 10.7393, lng: 122.9724 },
  { city: "Victorias",         province: "Negros Occidental",island: "Visayas",                     hub: "Visayas",      lat: 10.9001, lng: 123.0761 },
  { city: "Bais",              province: "Negros Oriental",  island: "Visayas",                     hub: "Visayas",      lat: 9.5924,  lng: 123.1218 },
  { city: "Canlaon",           province: "Negros Oriental",  island: "Visayas",                     hub: "Visayas",      lat: 10.3882, lng: 123.1989 },
  { city: "Dumaguete",         province: "Negros Oriental",  island: "Visayas",                     hub: "Visayas",      lat: 9.3068,  lng: 123.3054 },
  { city: "Guihulngan",        province: "Negros Oriental",  island: "Visayas",                     hub: "Visayas",      lat: 10.1238, lng: 123.2706 },
  { city: "Tanjay",            province: "Negros Oriental",  island: "Visayas",                     hub: "Visayas",      lat: 9.5139,  lng: 123.1572 },
  { city: "Iloilo City",       province: "Iloilo",           island: "Visayas",                     hub: "Visayas",      lat: 10.7202, lng: 122.5621 },
  { city: "Passi",             province: "Iloilo",           island: "Visayas",                     hub: "Visayas",      lat: 11.1030, lng: 122.6415 },
  { city: "Roxas",             province: "Capiz",            island: "Visayas",                     hub: "Visayas",      lat: 11.5886, lng: 122.7511 },
  { city: "Tacloban",          province: "Leyte",            island: "Visayas",                     hub: "Visayas",      lat: 11.2543, lng: 125.0000 },
  { city: "Baybay",            province: "Leyte",            island: "Visayas",                     hub: "Visayas",      lat: 10.6801, lng: 124.7994 },
  { city: "Ormoc",             province: "Leyte",            island: "Visayas",                     hub: "Visayas",      lat: 11.0064, lng: 124.6076 },
  { city: "Maasin",            province: "Southern Leyte",   island: "Visayas",                     hub: "Visayas",      lat: 10.1325, lng: 124.8449 },
  { city: "Catbalogan",        province: "Samar",            island: "Visayas",                     hub: "Visayas",      lat: 11.7759, lng: 124.8862 },
  { city: "Calbayog",          province: "Samar",            island: "Visayas",                     hub: "Visayas",      lat: 12.0735, lng: 124.5949 },
  { city: "Borongan",          province: "Eastern Samar",    island: "Visayas",                     hub: "Visayas",      lat: 11.6092, lng: 125.4320 },
  { city: "Tagbilaran",        province: "Bohol",            island: "Visayas",                     hub: "Visayas",      lat: 9.6500,  lng: 123.8500 },

  // ── Mindanao (33 cities) ─────────────────────────────────────────────────
  { city: "Davao City",        province: "Davao del Sur",    island: "Mindanao",                    hub: "Mindanao",     lat: 7.1907,  lng: 125.4553 },
  { city: "Digos",             province: "Davao del Sur",    island: "Mindanao",                    hub: "Mindanao",     lat: 6.7497,  lng: 125.3572 },
  { city: "Mati",              province: "Davao Oriental",   island: "Mindanao",                    hub: "Mindanao",     lat: 6.9524,  lng: 126.2154 },
  { city: "Panabo",            province: "Davao del Norte",  island: "Mindanao",                    hub: "Mindanao",     lat: 7.3088,  lng: 125.6847 },
  { city: "Samal",             province: "Davao del Norte",  island: "Mindanao",                    hub: "Mindanao",     lat: 7.0590,  lng: 125.7126 },
  { city: "Tagum",             province: "Davao del Norte",  island: "Mindanao",                    hub: "Mindanao",     lat: 7.4479,  lng: 125.8078 },
  { city: "Cagayan de Oro",    province: "Misamis Oriental", island: "Mindanao",                    hub: "Mindanao",     lat: 8.4542,  lng: 124.6319 },
  { city: "El Salvador",       province: "Misamis Oriental", island: "Mindanao",                    hub: "Mindanao",     lat: 8.5593,  lng: 124.5223 },
  { city: "Gingoog",           province: "Misamis Oriental", island: "Mindanao",                    hub: "Mindanao",     lat: 8.8228,  lng: 125.1094 },
  { city: "Oroquieta",         province: "Misamis Occidental",island: "Mindanao",                   hub: "Mindanao",     lat: 8.4857,  lng: 123.8057 },
  { city: "Ozamiz",            province: "Misamis Occidental",island: "Mindanao",                   hub: "Mindanao",     lat: 8.1500,  lng: 123.8402 },
  { city: "Tangub",            province: "Misamis Occidental",island: "Mindanao",                   hub: "Mindanao",     lat: 8.0671,  lng: 123.7499 },
  { city: "Iligan",            province: "Lanao del Norte",  island: "Mindanao",                    hub: "Mindanao",     lat: 8.2280,  lng: 124.2452 },
  { city: "Marawi",            province: "Lanao del Sur",    island: "Mindanao",                    hub: "Mindanao",     lat: 7.9986,  lng: 124.2928 },
  { city: "Malaybalay",        province: "Bukidnon",         island: "Mindanao",                    hub: "Mindanao",     lat: 8.1575,  lng: 125.1277 },
  { city: "Valencia",          province: "Bukidnon",         island: "Mindanao",                    hub: "Mindanao",     lat: 7.9057,  lng: 125.0939 },
  { city: "General Santos",    province: "South Cotabato",   island: "Mindanao",                    hub: "Mindanao",     lat: 6.1128,  lng: 125.1716 },
  { city: "Koronadal",         province: "South Cotabato",   island: "Mindanao",                    hub: "Mindanao",     lat: 6.5032,  lng: 124.8448 },
  { city: "Cotabato City",     province: "Maguindanao",      island: "Mindanao",                    hub: "Mindanao",     lat: 7.2236,  lng: 124.2465 },
  { city: "Kidapawan",         province: "Cotabato",         island: "Mindanao",                    hub: "Mindanao",     lat: 7.0083,  lng: 125.0890 },
  { city: "Tacurong",          province: "Sultan Kudarat",   island: "Mindanao",                    hub: "Mindanao",     lat: 6.6930,  lng: 124.6759 },
  { city: "Butuan",            province: "Agusan del Norte", island: "Mindanao",                    hub: "Mindanao",     lat: 8.9475,  lng: 125.5406 },
  { city: "Cabadbaran",        province: "Agusan del Norte", island: "Mindanao",                    hub: "Mindanao",     lat: 9.1236,  lng: 125.5355 },
  { city: "Bayugan",           province: "Agusan del Sur",   island: "Mindanao",                    hub: "Mindanao",     lat: 8.9491,  lng: 125.7536 },
  { city: "Surigao City",      province: "Surigao del Norte",island: "Mindanao",                    hub: "Mindanao",     lat: 9.7839,  lng: 125.4965 },
  { city: "Bislig",            province: "Surigao del Sur",  island: "Mindanao",                    hub: "Mindanao",     lat: 8.1953,  lng: 126.0811 },
  { city: "Tandag",            province: "Surigao del Sur",  island: "Mindanao",                    hub: "Mindanao",     lat: 9.0801,  lng: 126.1980 },
  { city: "Zamboanga City",    province: "Zamboanga del Sur",island: "Mindanao",                    hub: "Mindanao",     lat: 6.9214,  lng: 122.0790 },
  { city: "Pagadian",          province: "Zamboanga del Sur",island: "Mindanao",                    hub: "Mindanao",     lat: 7.8268,  lng: 123.4380 },
  { city: "Dapitan",           province: "Zamboanga del Norte",island: "Mindanao",                  hub: "Mindanao",     lat: 8.6565,  lng: 123.4238 },
  { city: "Dipolog",           province: "Zamboanga del Norte",island: "Mindanao",                  hub: "Mindanao",     lat: 8.5872,  lng: 123.3414 },
  { city: "Isabela City",      province: "Basilan",          island: "Mindanao",                    hub: "Mindanao",     lat: 6.7073,  lng: 121.9710 },
  { city: "Lamitan",           province: "Basilan",          island: "Mindanao",                    hub: "Mindanao",     lat: 6.6546,  lng: 122.1304 },
];

// ── Derived helpers ──────────────────────────────────────────────────────────

export const NEXOFLOW_CITY_NAMES = NEXOFLOW_CITIES.map((c) => c.city);

export function getCitiesByHub(hub: NexoflowCity["hub"]) {
  return NEXOFLOW_CITIES.filter((c) => c.hub === hub);
}

export function getCitiesByIsland(island: Island) {
  return NEXOFLOW_CITIES.filter((c) => c.island === island);
}

export function isCovered(city: string): boolean {
  return NEXOFLOW_CITIES.some((c) => c.city.toLowerCase() === city.toLowerCase());
}

export const HUB_STATS = {
  NCR:          { label: "NCR / Metro Manila",  cities: getCitiesByHub("NCR").length,          color: "text-brand-600 bg-brand-50 border-brand-200" },
  "North Luzon": { label: "North Luzon",         cities: getCitiesByHub("North Luzon").length,  color: "text-purple-600 bg-purple-50 border-purple-200" },
  "South Luzon": { label: "South Luzon",         cities: getCitiesByHub("South Luzon").length,  color: "text-info-600 bg-info-50 border-info-200" },
  Visayas:      { label: "Visayas",             cities: getCitiesByHub("Visayas").length,       color: "text-success-600 bg-success-50 border-success-200" },
  Mindanao:     { label: "Mindanao",            cities: getCitiesByHub("Mindanao").length,      color: "text-warning-600 bg-warning-50 border-warning-200" },
};
