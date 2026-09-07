export interface OriginPort {
  name: string;
  lat: number;
  lon: number;
  code: string;
  region: string;
}

export interface AntarcticDestination {
  name: string;
  lat: number;
  lon: number;
  code: string;
  flag: string;
}

export interface VesselClassOption {
  id: string;
  label: string;
  modifier: string;
}

export const NCPOR_ORIGIN_PORTS: OriginPort[] = [
  { name: "Port of Mormugao, Goa (India)", lat: 15.4026, lon: 73.8016, code: "GOI", region: "🇮🇳 India / NCPOR HQ" },
  { name: "Cape Town (South Africa)", lat: -33.9249, lon: 18.4241, code: "CPT", region: "🇿🇦 South Africa Gateway" },
  { name: "Port of Durban (South Africa)", lat: -29.8587, lon: 31.0218, code: "DUR", region: "🇿🇦 South Africa Gateway" },
  { name: "Ushuaia (Argentina)", lat: -54.8019, lon: -68.3030, code: "USH", region: "🇦🇷 South America / Drake" },
  { name: "Punta Arenas (Chile)", lat: -53.1638, lon: -70.9171, code: "PUQ", region: "🇨🇱 South America / Magellan" },
  { name: "Hobart, Tasmania (Australia)", lat: -42.8821, lon: 147.3272, code: "HBA", region: "🇦🇺 Oceania Gateway" },
  { name: "Fremantle / Perth (Australia)", lat: -32.0569, lon: 115.7439, code: "FRE", region: "🇦🇺 Oceania Gateway" },
  { name: "Lyttelton / Christchurch (New Zealand)", lat: -43.6031, lon: 172.7194, code: "LYT", region: "🇳🇿 Oceania Gateway" },
  { name: "Port Stanley (Falkland Islands)", lat: -51.6977, lon: -57.8517, code: "PSY", region: "🇫🇰 South Atlantic" },
  { name: "Port of Bremerhaven (Germany)", lat: 53.5417, lon: 8.5833, code: "BRV", region: "🇩🇪 Europe / Polarstern" }
];

export const NCPOR_DESTINATIONS: AntarcticDestination[] = [
  { name: "Maitri Research Station (India, DML)", lat: -70.7667, lon: 11.7333, code: "MAITRI", flag: "🇮🇳" },
  { name: "Bharati Research Station (India, Larsemann)", lat: -69.4067, lon: 76.1903, code: "BHARATI", flag: "🇮🇳" },
  { name: "Dakshin Gangotri Historical Base (India)", lat: -70.0900, lon: 12.0000, code: "DG-HIST", flag: "🇮🇳" },
  { name: "McMurdo Station (USA, Ross Island)", lat: -77.8460, lon: 166.6680, code: "MCMURDO", flag: "🇺🇸" },
  { name: "Halley VI Research Station (UK, Brunt)", lat: -75.5833, lon: -25.5000, code: "HALLEY", flag: "🇬🇧" },
  { name: "Rothera Research Station (UK, Peninsula)", lat: -67.5683, lon: -68.1250, code: "ROTHERA", flag: "🇬🇧" },
  { name: "Neumayer Station III (Germany, Atka)", lat: -70.6667, lon: -8.2667, code: "NEU-III", flag: "🇩🇪" },
  { name: "Troll Research Station (Norway, DML)", lat: -72.0117, lon: 2.5350, code: "TROLL", flag: "🇳🇴" },
  { name: "Princess Elisabeth (Belgium, Zero-Emission)", lat: -71.9500, lon: 23.3500, code: "PE-BEL", flag: "🇧🇪" },
  { name: "Casey Station (Australia, Wilkes Land)", lat: -66.2822, lon: 110.5244, code: "CASEY", flag: "🇦🇺" },
  { name: "Davis Station (Australia, Vestfold Hills)", lat: -68.5764, lon: 77.9672, code: "DAVIS", flag: "🇦🇺" },
  { name: "Mawson Station (Australia, Holme Bay)", lat: -67.6042, lon: 62.8744, code: "MAWSON", flag: "🇦🇺" },
  { name: "Showa Station (Japan, Lützow-Holm)", lat: -69.0069, lon: 39.5828, code: "SHOWA", flag: "🇯🇵" },
  { name: "Zhongshan Station (China, Larsemann)", lat: -69.3731, lon: 76.3783, code: "ZHONGSHAN", flag: "🇨🇳" },
  { name: "Dumont d'Urville (France, Adélie Coast)", lat: -66.6628, lon: 140.0014, code: "DDU-FRA", flag: "🇫🇷" },
  { name: "Base Esperanza (Argentina, Hope Bay)", lat: -63.3967, lon: -56.9983, code: "ESPERANZA", flag: "🇦🇷" },
  { name: "Base Presidente Frei (Chile, King George Is.)", lat: -62.1917, lon: -58.9767, code: "FREI-CHL", flag: "🇨🇱" },
  { name: "Weddell Sea Continental Ice Shelf (Ronne)", lat: -75.0000, lon: -45.0000, code: "WEDDELL", flag: "🌐" }
];

export const VESSEL_CLASSES: VesselClassOption[] = [
  { id: "PC-3", label: "Polar Class 3 (Year-round second-year ice)", modifier: "Heavy Icebreaker" },
  { id: "PC-5", label: "Polar Class 5 (Year-round medium first-year ice)", modifier: "SA Agulhas II" },
  { id: "PC-7", label: "Polar Class 7 (Summer thin first-year ice)", modifier: "Light Ice Reinforced" },
  { id: "Open-Water", label: "Open Water Non-Ice Strengthened", modifier: "Commercial Vessel" }
];
