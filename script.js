const apiKey = '6c4d007a39ab83cd7c21463edf78c359';
let currentSport = 'football';

const sportsApiConfig = {
    football: {
        host: 'v3.football.api-sports.io',
        fixturesEndpoint: 'fixtures',
        leaguesEndpoint: 'leagues'
    },
    formula1: {
        host: 'v1.formula-1.api-sports.io',
        fixturesEndpoint: 'races',
        leaguesEndpoint: 'competitions'
    },
    basketball: {
        host: 'v1.basketball.api-sports.io',
        fixturesEndpoint: 'games',
        leaguesEndpoint: 'leagues'
    },
    mma: {
        host: 'v1.mma.api-sports.io',
        fixturesEndpoint: 'fights',
        leaguesEndpoint: 'leagues'
    }
};

function fetchLeagues() {
    const { host, leaguesEndpoint } = sportsApiConfig[currentSport];

    fetch(`https://${host}/${leaguesEndpoint}`, {
        method: "GET",
        headers: {
            "x-rapidapi-host": host,
            "x-rapidapi-key": apiKey
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.response) {
            populateLeaguesDropdown(data.response);
        } else {
            console.error("No leagues data found.");
        }
    })
    .catch(err => {
        console.error(err);
    });
}

function populateLeaguesDropdown(leagues) {
    const dropdown = document.getElementById('leagueDropdown');
    if (!dropdown) {
        console.error("Dropdown element not found.");
        return;
    }
    dropdown.innerHTML = '<option value="all">All Leagues</option>';

    leagues.forEach(league => {
        const option = document.createElement('option');
        option.value = league.league ? league.league.id : league.id;
        option.textContent = league.league ? league.league.name : league.name;
        dropdown.appendChild(option);
    });

    document.querySelector('.dropdown-container').style.display = 'flex';
    document.getElementById('introText').style.display = 'none';
}

function fetchFixtures(period) {
    const date = new Date();
    const yesterday = new Date(date);
    const tomorrow = new Date(date);
    yesterday.setDate(date.getDate() - 1);
    tomorrow.setDate(date.getDate() + 1);

    const dates = {
        yesterday: formatDate(yesterday),
        today: formatDate(date),
        tomorrow: formatDate(tomorrow)
    };

    const { host, fixturesEndpoint } = sportsApiConfig[currentSport];
    const selectedLeague = document.getElementById('leagueDropdown').value;

    let url = `https://${host}/${fixturesEndpoint}?date=${dates[period]}`;
    if (selectedLeague !== 'all') {
        url += `&league=${selectedLeague}`;
    }

    fetch(url, {
        method: "GET",
        headers: {
            "x-rapidapi-host": host,
            "x-rapidapi-key": apiKey
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log(data); // Log the response to check its structure
        if (data.response && data.response.length > 0) {
            displayMatches(data.response, period);
        } else {
            document.getElementById('matchesContainer').innerHTML = 'No matches found.';
        }
    })
    .catch(err => {
        console.error(err);
    });
}

function formatDate(date) {
    let month = '' + (date.getMonth() + 1);
    let day = '' + date.getDate();
    const year = date.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}

function displayMatches(matches, period) {
    const container = document.getElementById('matchesContainer');
    if (!container) {
        console.error("Matches container not found.");
        return;
    }
    container.innerHTML = '';

    matches.forEach(match => {
        const matchElement = document.createElement('div');
        matchElement.classList.add('match');

        let homeTeamLogo = '';
        let awayTeamLogo = '';
        let teamsInfo = '';
        let leagueName = '';
        let fixtureId = '';
        let matchTime = '';
        let matchStatus = '';

        if (currentSport === 'football' || currentSport === 'basketball') {
            homeTeamLogo = match.teams.home.logo;
            awayTeamLogo = match.teams.away.logo;
            teamsInfo = `${match.teams.home.name} vs ${match.teams.away.name}`;
            leagueName = match.league.name;
            fixtureId = match.fixture ? match.fixture.id : match.id;
            matchTime = match.fixture ? match.fixture.date : match.date;
            matchStatus = match.fixture ? match.fixture.status.short : match.status.short;
        } else if (currentSport === 'formula1') {
            teamsInfo = match.competition.name;
            leagueName = match.competition.name;
            fixtureId = match.race ? match.race.id : match.id;
            matchTime = match.race ? match.race.date : match.date;
            matchStatus = match.race ? match.race.status : match.status;
        } else if (currentSport === 'mma') {
            teamsInfo = `${match.fights[0].fighters[0].name} vs ${match.fights[0].fighters[1].name}`;
            leagueName = match.league.name;
            fixtureId = match.id;
            matchTime = match.date;
            matchStatus = match.status;
        }

        const formattedMatchTime = new Date(matchTime).toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' });
        const countdownText = getCountdownText(new Date(matchTime));

        matchElement.innerHTML = `
            <div class="info">
                ${homeTeamLogo ? `<img src="${homeTeamLogo}" alt="Home Team Logo">` : ''}
                <div class="teams">
                    <div>${teamsInfo}</div>
                    <div>${leagueName}</div>
                </div>
                ${awayTeamLogo ? `<img src="${awayTeamLogo}" alt="Away Team Logo">` : ''}
            </div>
            <div class="status">
                ${matchStatus === 'NS' ? countdownText : matchStatus === 'FT' ? 'Match Ended' : 'Live'}
            </div>
        `;

        if (matchStatus === 'FT') {
            matchElement.addEventListener('click', () => {
                const query = `${teamsInfo} ${formattedMatchTime.split(',')[0]}`;
                const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
                window.open(url, '_blank');
            });
        }

        container.appendChild(matchElement);
    });
}

function showSport(sport) {
    currentSport = sport;
    fetchLeagues();
}

function showMatches(period) {
    const tabs = document.querySelectorAll('.tab-button');
    tabs.forEach(tab => tab.classList.remove('active'));
    document.querySelector(`.tab-button[onclick="showMatches('${period}')"]`).classList.add('active');

    fetchFixtures(period);
}

function getCountdownText(matchDate) {
    const now = new Date();
    const timeDifference = matchDate - now;

    const hours = Math.floor(timeDifference / (1000 * 60 * 60));
    const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
}

document.addEventListener('DOMContentLoaded', () => {
    showMatches('today');
});
