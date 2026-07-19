// League and Team Data - 10 Major Leagues
const LEAGUES = [
    {
        id: 'world-cup',
        name: 'World Cup 2026',
        country: 'Internacional',
        flag: '🏆',
        color: '#FFD700',
        teams: []
    },
    {
        id: 'friendlies',
        name: 'Amistosos',
        country: 'Internacional',
        flag: '🤝',
        color: '#6B7280',
        teams: []
    },
    {
        id: 'allsvenskan',
        name: 'Allsvenskan',
        country: 'Suecia',
        flag: '🇸🇪',
        color: '#005B9F',
        teams: []
    },
    {
        id: 'liga-mx',
        name: 'Liga MX',
        country: 'Mexico',
        flag: '🇲🇽',
        color: '#006847',
        teams: []
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
            'Rayo Vallecano', 'Granada', 'Cadiz', 'Almeria'
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
            'Bochum', 'Mainz 05', 'Darmstadt', 'FC Koln', 'Gladbach'
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
        id: 'ligue1',
        name: 'Ligue 1',
        country: 'Francia',
        flag: '🇫🇷',
        color: '#091C3E',
        teams: [
            'Paris Saint-Germain', 'Olympique Marseille', 'AS Monaco', 'Lille OSC',
            'OGC Nice', 'Stade Rennais', 'RC Lens', 'RC Strasbourg',
            'Montpellier', 'Nantes', 'Toulouse FC', 'Stade Brestois',
            'Le Havre', 'Clermont', 'Metz', 'Lorient',
            'Reims', 'Auxerre', 'Angers'
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
        id: 'brasileirao',
        name: 'Brasileirao',
        country: 'Brasil',
        flag: '🇧🇷',
        color: '#009C3B',
        teams: [
            'Botafogo', 'Palmeiras', 'Flamengo', 'Fortaleza', 'Sao Paulo',
            'Internacional', 'Cruzeiro', 'Bahia', 'Vasco da Gama', 'Fluminense',
            'Gremio', 'Athletico-PR', 'Criciuma', 'Atletico-MG', 'Juventude',
            'Corinthians', 'Santos', 'Cuiaba', 'Bragantino', 'Atletico-GO'
        ]
    },
    {
        id: 'liga-argentina',
        name: 'Liga Profesional',
        country: 'Argentina',
        flag: '🇦🇷',
        color: '#74ACDF',
        teams: [
            'River Plate', 'Boca Juniors', 'Racing Club', 'San Lorenzo',
            'Independiente', 'Estudiantes', 'Velez Sarsfield', 'Defensa y Justicia',
            'Talleres', 'Lanus', 'Argentinos Juniors', 'Union Santa Fe',
            'Banfield', 'Central Cordoba', 'Belgrano', 'Atletico Tucuman',
            'Gimnasia', 'Sarmiento', 'Barracas Central', 'Platense'
        ]
    },
    {
        id: 'eredivisie',
        name: 'Eredivisie',
        country: 'Paises Bajos',
        flag: '🇳🇱',
        color: '#FF6600',
        teams: [
            'PSV Eindhoven', 'Ajax', 'Feyenoord', 'AZ Alkmaar', 'FC Twente',
            'FC Utrecht', 'SC Heerenveen', 'Go Ahead Eagles', 'NEC Nijmegen',
            'Willem II', 'Sparta Rotterdam', 'PEC Zwolle', 'Heracles Almelo',
            'NAC Breda', 'Almere City', 'RKC Waalwijk', 'FC Groningen'
        ]
    },
    {
        id: 'liga-portugal',
        name: 'Liga Portugal',
        country: 'Portugal',
        flag: '🇵🇹',
        color: '#006600',
        teams: [
            'Sporting CP', 'FC Porto', 'Benfica', 'Braga', 'Vitoria Guimaraes',
            'Casa Pia', 'Moreirense', 'Estoril', 'Famalicao', 'Boavista',
            'Arouca', 'Rio Ave', 'Gil Vicente', 'Estrela Amadora', 'Farense',
            'Portimonense', 'Vizela'
        ]
    }
];

function getLeagueById(id) {
    return LEAGUES.find(league => league.id === id);
}
