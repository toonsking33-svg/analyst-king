// League and Team Data for Analyst King
const LEAGUES = [
    {
        id: 'ligue1',
        name: 'Ligue 1',
        country: 'Francia',
        flag: '🇫🇷',
        color: '#091C3E',
        teams: [
            'Paris Saint-Germain', 'Olympique Marsella', 'AS Monaco', 'Lille OSC',
            'OGC Niza', 'Stade Rennais', 'RC Lens', 'RC Estrasburgo',
            'Montpellier HSC', 'Estrasburgo', 'Nantes', 'Toulouse FC',
            'Stade Brestois', 'Le Havre AC', 'Clermont Foot', 'FC Metz',
            'Lorient', 'Reims', 'Auxerre', 'Angers SCO'
        ]
    },
    {
        id: 'brasileirao',
        name: 'Brasileirão Betano',
        country: 'Brasil',
        flag: '🇧🇷',
        color: '#009C3B',
        teams: [
            'Botafogo', 'Palmeiras', 'Flamengo', 'Fortaleza', 'São Paulo',
            'Internacional', 'Cruzeiro', 'Bahia', 'Vasco da Gama', 'Fluminense',
            'Grêmio', 'Athletico-PR', 'Criciúma', 'Atlético-MG', 'Juventude',
            'Corinthians', 'Santos', 'Cuiabá', 'Red Bull Bragantino', 'Atlético-GO'
        ]
    },
    {
        id: 'eredivisie',
        name: 'VriendenLoterij Eredivisie',
        country: 'Países Bajos',
        flag: '🇳🇱',
        color: '#FF6600',
        teams: [
            'PSV Eindhoven', 'Ajax', 'Feyenoord', 'AZ Alkmaar', 'FC Twente',
            'FC Utrecht', 'SC Heerenveen', 'Go Ahead Eagles', 'NEC Nijmegen',
            'Willem II', 'Sparta Rotterdam', 'PEC Zwolle', 'Heracles Almelo',
            'NAC Breda', 'Almere City', 'RKC Waalwijk', 'FC Groningen', 'Excelsior'
        ]
    },
    {
        id: 'liga-portugal',
        name: 'Liga Portugal Betclic',
        country: 'Portugal',
        flag: '🇵🇹',
        color: '#006600',
        teams: [
            'Sporting CP', 'FC Porto', 'Benfica', 'Braga', 'Vitória Guimarães',
            'Casa Pia', 'Moreirense', 'Estoril', 'Famalicão', 'Boavista',
            'Arouca', 'Rio Ave', 'Gil Vicente', 'Estrela Amadora', 'Farense',
            'Portimonense', 'Vizela', 'C.D. Tondela'
        ]
    },
    {
        id: 'liga-argentina',
        name: 'Liga Profesional de Fútbol',
        country: 'Argentina',
        flag: '🇦🇷',
        color: '#74ACDF',
        teams: [
            'River Plate', 'Boca Juniors', 'Racing Club', 'San Lorenzo',
            'Independiente', 'Estudiantes', 'Vélez Sarsfield', 'Defensa y Justicia',
            'Talleres', 'Lanús', 'Argentinos Juniors', 'Unión Santa Fe',
            'Banfield', 'Central Córdoba', 'Belgrano', 'Atlético Tucumán',
            'Gimnasia', 'Sarmiento', 'Barracas Central', 'Platense'
        ]
    },
    {
        id: 'copa-argentina',
        name: 'Copa Argentina',
        country: 'Argentina',
        flag: '🇦🇷',
        color: '#74ACDF',
        teams: [
            'River Plate', 'Boca Juniors', 'Racing Club', 'San Lorenzo',
            'Independiente', 'Estudiantes', 'Vélez Sarsfield', 'Defensa y Justicia',
            'Talleres', 'Lanús', 'Argentinos Juniors', 'Unión Santa Fe'
        ]
    },
    {
        id: 'europa-league',
        name: 'UEFA Europa League',
        country: 'Europa',
        flag: '🇪🇺',
        color: '#F37920',
        teams: [
            'Bayer Leverkusen', 'Atalanta', 'Marseille', 'West Ham',
            'Liverpool', 'Roma', 'Bayer Leverkusen', 'Freiburg',
            'Brighton', 'Ajax', 'Rangers', 'Villarreal',
            'Sporting CP', 'Sturm Graz', 'Toulouse', 'Qarabag'
        ]
    },
    {
        id: 'libertadores',
        name: 'CONMEBOL Libertadores',
        country: 'Sudamérica',
        flag: '🌎',
        color: '#00529F',
        teams: [
            'Fluminense', 'Boca Juniors', 'Atlético Mineiro', 'Palmeiras',
            'River Plate', 'Flamengo', 'Botafogo', 'São Paulo',
            'Corinthians', 'Internacional', 'Colón', 'LDU Quito',
            'Nacional', 'Peñarol', 'Cerro Porteño', 'Olimpia'
        ]
    },
    {
        id: 'sudamericana',
        name: 'CONMEBOL Sudamericana',
        country: 'Sudamérica',
        flag: '🌎',
        color: '#F37920',
        teams: [
            'Fortaleza', 'Bahia', 'San Lorenzo', 'Racing Club',
            'Independiente del Valle', 'Universidad Católica', 'Athletico-PR',
            'Cerro Largo', 'Deportivo Táchira', 'Sporting Cristal',
            'Argentinos Juniors', 'Lanús', 'Red Bull Bragantino', 'Cruzeiro'
        ]
    },
    {
        id: 'fa-cup',
        name: 'FA Cup',
        country: 'Inglaterra',
        flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
        color: '#003078',
        teams: [
            'Manchester City', 'Arsenal', 'Liverpool', 'Manchester United',
            'Chelsea', 'Tottenham', 'Newcastle', 'Brighton',
            'Aston Villa', 'West Ham', 'Crystal Palace', 'Wolves'
        ]
    },
    {
        id: 'brasileirao-b',
        name: 'Brasileirão Série B',
        country: 'Brasil',
        flag: '🇧🇷',
        color: '#009C3B',
        teams: [
            'Sport Recife', 'Goiás', 'Coritiba', 'Novorizontino',
            'Criciúma', 'Operário-PR', 'Chapecoense', 'Guarani',
            'ABC', 'Figueirense', 'Ponte Preta', 'Ituano',
            'Tombense', 'Londrina', 'Mirassol', 'Vila Nova'
        ]
    },
    {
        id: 'veikkausliiga',
        name: 'Veikkausliiga',
        country: 'Finlandia',
        flag: '🇫🇮',
        color: '#003580',
        teams: [
            'HJK Helsinki', 'FC KuPS', 'FC Honka', 'Inter Turku',
            'FC Ilves', 'Haka', 'Lahti', 'Mariehamn',
            'SJK', 'FC Haka', 'TPS', 'AC Oulu'
        ]
    },
    {
        id: 'liga-mx',
        name: 'Liga MX, Apertura',
        country: 'México',
        flag: '🇲🇽',
        color: '#006847',
        teams: [
            'Club América', 'Cruz Azul', 'Guadalajara', 'Tigres UANL',
            'Monterrey', 'León', 'Pumas UNAM', 'Santos Laguna',
            'Toluca', 'Puebla', 'Atlas', 'FC Juárez',
            'Mazatlán', 'Necaxa', 'Pachuca', 'Querétaro'
        ]
    },
    {
        id: 'eliteserien',
        name: 'Eliteserien',
        country: 'Noruega',
        flag: '🇳🇴',
        color: '#BA0C2F',
        teams: [
            'Bodø/Glimt', 'Molde', 'Rosenborg', 'Brann',
            'Viking', 'Lillestrøm', 'Strømsgodset', 'Vålerenga',
            'Haugesund', 'Sarpsborg 08', 'Odd', 'Sandefjord',
            'Tromsø', 'Aalesund', 'HamKam', 'Stabæk'
        ]
    },
    {
        id: 'northern-championship',
        name: 'Norwegian 1st Division',
        country: 'Noruega',
        flag: '🇳🇴',
        color: '#BA0C2F',
        teams: [
            'Fredrikstad', 'Ranheim', 'Sogndal', 'Raufoss',
            'Kongsvinger', 'Mjøndalen', 'Åsane', 'Sandnes Ulf',
            'Bryne', 'Mjølker', 'Stjørdals-Blink', 'Grorud',
            'Eidsvold Turn', 'Alta', 'Senja', 'Nordstrand'
        ]
    },
    {
        id: 'champions-league',
        name: 'UEFA Champions League',
        country: 'Europa',
        flag: '🇪🇺',
        color: '#071D49',
        teams: [
            'Real Madrid', 'FC Barcelona', 'Manchester City', 'Bayern Munich',
            'Paris Saint-Germain', 'Inter Milan', 'AC Milan', 'Liverpool',
            'Arsenal', 'Borussia Dortmund', 'Atletico Madrid', 'Napoli',
            'Benfica', 'Porto', 'Sporting CP', 'RB Leipzig'
        ]
    },
    {
        id: 'premier-league',
        name: 'Premier League',
        country: 'Inglaterra',
        flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
        color: '#3D195B',
        teams: [
            'Manchester City', 'Arsenal', 'Liverpool', 'Manchester United',
            'Chelsea', 'Tottenham', 'Newcastle United', 'Aston Villa',
            'Brighton', 'West Ham', 'Crystal Palace', 'Wolves',
            'Fulham', 'Bournemouth', 'Brentford', 'Everton',
            'Nottingham Forest', 'Burnley', 'Luton Town', 'Sheffield United'
        ]
    },
    {
        id: 'championship',
        name: 'Championship',
        country: 'Inglaterra',
        flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
        color: '#3D195B',
        teams: [
            'Leicester City', 'Ipswich Town', 'Leeds United', 'Southampton',
            'West Brom', 'Norwich City', 'Hull City', 'Middlesbrough',
            'Coventry City', 'Sunderland', 'Bristol City', 'Watford',
            'Millwall', 'Blackburn Rovers', 'Cardiff City', 'Stoke City'
        ]
    },
    {
        id: 'laliga',
        name: 'LaLiga',
        country: 'España',
        flag: '🇪🇸',
        color: '#EE8707',
        teams: [
            'Real Madrid', 'FC Barcelona', 'Atletico Madrid', 'Real Sociedad',
            'Athletic Bilbao', 'Real Betis', 'Villarreal', 'Valencia',
            'Girona', 'Sevilla', 'Osasuna', 'Celta Vigo',
            'Mallorca', 'Getafe', 'Las Palmas', 'Alaves',
            'Rayo Vallecano', 'Sevilla', 'Cádiz', 'Granada'
        ]
    },
    {
        id: 'bundesliga',
        name: 'Bundesliga',
        country: 'Alemania',
        flag: '🇩🇪',
        color: '#D20515',
        teams: [
            'Bayer Leverkusen', 'VfB Stuttgart', 'Bayern Munich', 'Borussia Dortmund',
            'RB Leipzig', 'Eintracht Frankfurt', 'SC Freiburg', 'Hoffenheim',
            'Werder Bremen', 'FC Augsburg', 'VfL Wolfsburg', 'Union Berlin',
            'Bochum', 'Mainz 05', 'Darmstadt', 'FC Köln', 'Gladbach'
        ]
    },
    {
        id: 'serie-a',
        name: 'Serie A',
        country: 'Italia',
        flag: '🇮🇹',
        color: '#024494',
        teams: [
            'Inter Milan', 'AC Milan', 'Juventus', 'Napoli',
            'AS Roma', 'Lazio', 'Atalanta', 'Fiorentina',
            'Bologna', 'Torino', 'Monza', 'Genoa',
            'Lecce', 'Cagliari', 'Verona', 'Sassuolo',
            'Udinese', 'Empoli', 'Frosinone', 'Salernitana'
        ]
    },
    {
        id: 'mls',
        name: 'MLS',
        country: 'Estados Unidos',
        flag: '🇺🇸',
        color: '#800000',
        teams: [
            'Inter Miami', 'FC Cincinnati', 'St. Louis City', 'Columbus Crew',
            'Nashville SC', 'Philadelphia Union', 'LAFC', 'New England Revolution',
            'Atlanta United', 'Real Salt Lake', 'LA Galaxy', 'Seattle Sounders',
            'Houston Dynamo', 'New York City FC', 'Orlando City', 'Minnesota United'
        ]
    }
];

// Sample standings data
const STANDINGS_DATA = {
    'premier-league': [
        { pos: 1, team: 'Manchester City', pj: 38, g: 28, e: 7, p: 3, gf: 96, gc: 34, pts: 91, form: ['W','W','D','W','W'] },
        { pos: 2, team: 'Arsenal', pj: 38, g: 26, e: 6, p: 6, gf: 91, gc: 29, pts: 84, form: ['W','W','W','L','W'] },
        { pos: 3, team: 'Liverpool', pj: 38, g: 24, e: 10, p: 4, gf: 86, gc: 41, pts: 82, form: ['W','D','W','W','D'] },
        { pos: 4, team: 'Aston Villa', pj: 38, g: 20, e: 8, p: 10, gf: 76, gc: 61, pts: 68, form: ['W','L','W','D','W'] },
        { pos: 5, team: 'Tottenham', pj: 38, g: 20, e: 6, p: 12, gf: 74, gc: 61, pts: 66, form: ['L','W','W','L','W'] },
        { pos: 6, team: 'Chelsea', pj: 38, g: 18, e: 9, p: 11, gf: 77, gc: 63, pts: 63, form: ['W','D','W','W','L'] },
        { pos: 7, team: 'Newcastle United', pj: 38, g: 18, e: 7, p: 13, gf: 65, gc: 58, pts: 61, form: ['D','W','L','W','W'] },
        { pos: 8, team: 'Manchester United', pj: 38, g: 18, e: 6, p: 14, gf: 57, gc: 58, pts: 60, form: ['L','W','D','W','L'] },
        { pos: 9, team: 'West Ham', pj: 38, g: 14, e: 10, p: 14, gf: 60, gc: 63, pts: 52, form: ['D','L','W','D','W'] },
        { pos: 10, team: 'Crystal Palace', pj: 38, g: 13, e: 11, p: 14, gf: 57, gc: 58, pts: 50, form: ['W','D','L','W','D'] },
    ],
    'laliga': [
        { pos: 1, team: 'Real Madrid', pj: 38, g: 29, e: 8, p: 1, gf: 87, gc: 26, pts: 95, form: ['W','W','W','D','W'] },
        { pos: 2, team: 'FC Barcelona', pj: 38, g: 26, e: 7, p: 5, gf: 79, gc: 44, pts: 85, form: ['W','W','L','W','W'] },
        { pos: 3, team: 'Girona', pj: 38, g: 25, e: 6, p: 7, gf: 78, gc: 51, pts: 81, form: ['W','D','W','W','L'] },
        { pos: 4, team: 'Atletico Madrid', pj: 38, g: 24, e: 4, p: 10, gf: 70, gc: 43, pts: 76, form: ['W','W','W','W','D'] },
        { pos: 5, team: 'Athletic Bilbao', pj: 38, g: 19, e: 11, p: 8, gf: 61, gc: 37, pts: 68, form: ['D','W','W','D','W'] },
    ],
    'bundesliga': [
        { pos: 1, team: 'Bayer Leverkusen', pj: 34, g: 28, e: 6, p: 0, gf: 89, gc: 24, pts: 90, form: ['W','W','D','W','W'] },
        { pos: 2, team: 'VfB Stuttgart', pj: 34, g: 23, e: 4, p: 7, gf: 78, gc: 39, pts: 73, form: ['W','W','W','L','W'] },
        { pos: 3, team: 'Bayern Munich', pj: 34, g: 23, e: 3, p: 8, gf: 94, gc: 45, pts: 72, form: ['W','L','W','W','W'] },
        { pos: 4, team: 'Borussia Dortmund', pj: 34, g: 18, e: 9, p: 7, gf: 68, gc: 43, pts: 63, form: ['D','W','W','D','W'] },
    ],
    'serie-a': [
        { pos: 1, team: 'Inter Milan', pj: 38, g: 29, e: 7, p: 2, gf: 89, gc: 21, pts: 94, form: ['W','W','W','D','W'] },
        { pos: 2, team: 'AC Milan', pj: 38, g: 22, e: 9, p: 7, gf: 76, gc: 49, pts: 75, form: ['W','D','W','W','L'] },
        { pos: 3, team: 'Juventus', pj: 38, g: 19, e: 14, p: 5, gf: 54, gc: 30, pts: 71, form: ['D','D','W','D','W'] },
        { pos: 4, team: 'AS Roma', pj: 38, g: 18, e: 9, p: 11, gf: 65, gc: 46, pts: 63, form: ['W','L','W','W','D'] },
    ],
    'ligue1': [
        { pos: 1, team: 'Paris Saint-Germain', pj: 34, g: 25, e: 5, p: 4, gf: 81, gc: 33, pts: 80, form: ['W','W','D','W','W'] },
        { pos: 2, team: 'AS Monaco', pj: 34, g: 20, e: 7, p: 7, gf: 68, gc: 42, pts: 67, form: ['W','D','W','L','W'] },
        { pos: 3, team: 'Brest', pj: 34, g: 21, e: 4, p: 9, gf: 54, gc: 34, pts: 67, form: ['W','W','W','D','W'] },
        { pos: 4, team: 'Lille OSC', pj: 34, g: 19, e: 8, p: 7, gf: 58, gc: 36, pts: 65, form: ['D','W','W','W','D'] },
    ],
    'brasileirao': [
        { pos: 1, team: 'Botafogo', pj: 15, g: 10, e: 3, p: 2, gf: 28, gc: 13, pts: 33, form: ['W','W','D','W','W'] },
        { pos: 2, team: 'Palmeiras', pj: 15, g: 9, e: 4, p: 2, gf: 26, gc: 11, pts: 31, form: ['W','D','W','W','W'] },
        { pos: 3, team: 'Flamengo', pj: 15, g: 9, e: 3, p: 3, gf: 25, gc: 15, pts: 30, form: ['W','W','L','W','D'] },
        { pos: 4, team: 'Fortaleza', pj: 15, g: 8, e: 5, p: 2, gf: 22, gc: 14, pts: 29, form: ['D','W','W','W','D'] },
    ],
    'liga-mx': [
        { pos: 1, team: 'Club América', pj: 17, g: 12, e: 3, p: 2, gf: 38, gc: 16, pts: 39, form: ['W','W','W','D','W'] },
        { pos: 2, team: 'Cruz Azul', pj: 17, g: 11, e: 4, p: 2, gf: 32, gc: 14, pts: 37, form: ['W','W','D','W','W'] },
        { pos: 3, team: 'Guadalajara', pj: 17, g: 10, e: 4, p: 3, gf: 29, gc: 18, pts: 34, form: ['D','W','W','L','W'] },
        { pos: 4, team: 'Tigres UANL', pj: 17, g: 9, e: 5, p: 3, gf: 27, gc: 16, pts: 32, form: ['W','D','W','W','D'] },
    ]
};

// Sample matches data
const SAMPLE_MATCHES = [
    { home: 'Manchester City', away: 'Arsenal', league: 'premier-league', time: '15:00', date: 'Hoy', status: 'upcoming' },
    { home: 'Real Madrid', away: 'FC Barcelona', league: 'laliga', time: '21:00', date: 'Hoy', status: 'upcoming' },
    { home: 'Bayern Munich', away: 'Borussia Dortmund', league: 'bundesliga', time: '18:30', date: 'Mañana', status: 'upcoming' },
    { home: 'PSG', away: 'Olympique Marsella', league: 'ligue1', time: '20:45', date: 'Mañana', status: 'upcoming' },
    { home: 'Inter Miami', away: 'LAFC', league: 'mls', time: '20:00', date: 'Hoy', status: 'upcoming' },
    { home: 'Botafogo', away: 'Flamengo', league: 'brasileirao', time: '21:30', date: 'Hoy', status: 'upcoming' },
    { home: 'Club América', away: 'Cruz Azul', league: 'liga-mx', time: '19:00', date: 'Hoy', status: 'upcoming' },
    { home: 'Inter Milan', away: 'AC Milan', league: 'serie-a', time: '20:45', date: 'Mañana', status: 'upcoming' },
];

// Sample AI insights
const SAMPLE_INSIGHTS = [
    {
        title: 'Manchester City vs Arsenal - Clásico de la Premier',
        text: 'El Manchester City tiene un 62% de victorias en los últimos 10 enfrentamientos directos. Haaland promedia 1.2 goles por partido en casa. Arsenal ha concedido solo 28 goles esta temporada.',
        priority: 'high',
        league: 'premier-league'
    },
    {
        title: 'Real Madrid favorito en el Clásico',
        text: 'Con Vinícius Jr. en racha de 5 partidos consecutivos anotando, el Real Madrid llega como favorito. El Barcelona ha perdido 3 de sus últimos 5 visitas al Bernabéu.',
        priority: 'high',
        league: 'laliga'
    },
    {
        title: 'Botafogo lidera el Brasileirão',
        text: 'El Botafogo mantiene una racha de 7 victorias consecutivas. Luiz Henrique es el goleador líder con 12 goles en 15 partidos.',
        priority: 'medium',
        league: 'brasileirao'
    },
    {
        title: 'PSG dominador en Ligue 1',
        text: 'Paris Saint-Germain ha ganado los últimos 8 enfrentamientos contra el Marsella. Bradley Barcola ha anotado en los últimos 4 partidos.',
        priority: 'medium',
        league: 'ligue1'
    },
    {
        title: 'Inter Miami en racha ascendente',
        text: 'Con Messi en el equipo, Inter Miami ha ganado 8 de sus últimos 10 partidos. Luis Suárez ha aportado 6 asistencias en el último mes.',
        priority: 'low',
        league: 'mls'
    }
];

// Helper function to get league by ID
function getLeagueById(id) {
    return LEAGUES.find(league => league.id === id);
}

// Helper function to get standings for a league
function getStandings(leagueId) {
    return STANDINGS_DATA[leagueId] || [];
}

// Helper function to generate random form
function generateRandomForm() {
    const results = ['W', 'D', 'L'];
    return Array.from({ length: 5 }, () => results[Math.floor(Math.random() * 3)]);
}

// Helper function to generate random standings
function generateStandings(leagueId) {
    const league = getLeagueById(leagueId);
    if (!league) return [];
    
    return league.teams.slice(0, 20).map((team, index) => {
        const pj = Math.floor(Math.random() * 10) + 28;
        const g = Math.floor(Math.random() * 15) + 10;
        const p = Math.floor(Math.random() * 10) + 2;
        const e = pj - g - p;
        const gf = Math.floor(Math.random() * 40) + 40;
        const gc = Math.floor(Math.random() * 30) + 20;
        const pts = g * 3 + e;
        
        return {
            pos: index + 1,
            team: team,
            pj: pj,
            g: g,
            e: e,
            p: p,
            gf: gf,
            gc: gc,
            pts: pts,
            form: generateRandomForm()
        };
    }).sort((a, b) => b.pts - a.pts).map((item, index) => ({ ...item, pos: index + 1 }));
}
