const FS = require("fs");

// Spielbrettmaße
const width = 200;
const height = 200;

// Zufallsgrößen in Prozent
const rabbit_birth = 70;
const rabbit_move = 80;
const fox_move = 80;
const fox_wins_fight = 80;
const fox_birth = 70;
const rabbit_death = 5;
const fox_death = 50;

// Startwerte
let rabbits = 80;
let foxes = 80;
let round = 1;

let x, y;

// Erstellt ein zufällig generiertes Spielbrett
const board = (() => {
	let board = [];

	for (x = 0; x < width; x++) {
		board[x] = [];

		for (y = 0; y < height; y++) board[x][y] = 0;
	}

	for (let i = 0; i < rabbits + foxes; i++) {
		do {
			x = Math.floor(Math.random() * width);
			y = Math.floor(Math.random() * height);
		} while (board[x][y]);

		board[x][y] = i < rabbits ? 1 : 2;
	}

	return board;
})();

// Setzt den Ausgabeordner zurück
function init(path) {
	if (!FS.existsSync(path + "/logs")) FS.mkdirSync(path + "/logs");

	if (FS.existsSync(path + "/logs/simulation"))
		FS.rmSync(path + "/logs/simulation", { recursive: true, force: true });

	FS.mkdirSync(path + "/logs/simulation");

	FS.writeFileSync(path + "/logs/simulation.csv", "Runde,Hasen,Füchse");
}

// Speichert die aktuelle Runde
function save(path) {
	// Tabelle aus Aufgabe 2
	FS.appendFileSync(
		path + "/logs/simulation.csv",
		`\n${round},${rabbits},${foxes}`
	);

	// Vom Client abgefragte Runden
	FS.writeFileSync(
		path + `/logs/simulation/round${round}.json`,
		JSON.stringify({
			board: board,
			log: `Runde ${round}: ${rabbits} ${
				rabbits != 1 ? "Hasen" : "Hase"
			} & ${foxes} ${foxes != 1 ? "Füchse" : "Fuchs"}`
		})
	);
}

// Wählt unter der gegebenen Wahrscheinlichkeit zufällig einen Wert
function rand(percent) {
	return Math.floor(Math.random() * 100) <= percent;
}

// Iteriert durch alle Felder unter der gegebenen Funktion
function loop(callback) {
	for (x = 0; x < 200; x++) {
		for (y = 0; y < 200; y++) {
			callback();
		}
	}
}

// Sucht alle passenden Nachbarfelder und ersetzt ein zufällig Gewähltes
function overrideNeighbour(old_neighbor, new_neighbor) {
	let neighbors = [
		[x - 1, y - 1],
		[x - 1, y],
		[x - 1, y + 1],
		[x, y - 1],
		[x, y + 1],
		[x + 1, y - 1],
		[x + 1, y],
		[x + 1, y + 1]
	];

	if (x == 199) neighbors.splice(5, 3);
	if (x == 0) neighbors.splice(0, 3);

	// Verfügbare Nachbarn sammeln
	for (let i = 0; i < neighbors.length; i++) {
		if (board[neighbors[i][0]][neighbors[i][1]] != old_neighbor) {
			neighbors.splice(i, 1);
			i--;
		}
	}

	if (neighbors.length == 0) return false;

	// Nachbarfeld überschreiben
	const neighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
	board[neighbor[0]][neighbor[1]] = new_neighbor;

	return true;
}

// Fügt neue Hasen dem Spielbrett hinzu
function addRabbits() {
	loop(() => {
		if (board[x][y] == 1 && rand(rabbit_birth) && overrideNeighbour(0, 1))
			rabbits++;
	});
}

// Fügt neue Füchse dem Spielbrett hinzu
function addFoxes() {
	loop(() => {
		if (board[x][y] == 3) {
			// Entfernt die Sättigung der Füchse wieder
			board[x][y] = 2;

			if (!rand(fox_birth)) return;

			overrideNeighbour(0, 2);
			foxes++;
		}
	});
}

// Bewegt jedes Tier zufällig, falls möglich
function move() {
	loop(() => {
		if (board[x][y] == 1 && rand(rabbit_move))
			board[x][y] = overrideNeighbour(0, 1) ? 0 : 1;
		else if (board[x][y] == 2 && rand(fox_move))
			board[x][y] = overrideNeighbour(0, 2) ? 0 : 2;
	});
}

// Simuliert mögliche Kämpfe
function fight() {
	loop(() => {
		if (board[x][y] == 2 && rand(fox_wins_fight) && overrideNeighbour(1, 0)) {
			// 3 markiert einen Fuchs als Satt
			board[x][y] = 3;
			rabbits--;
		}
	});
}

// Entfernt alle gestorbenen Tiere
function rem() {
	loop(() => {
		if (board[x][y] == 1 && rand(rabbit_death)) {
			board[x][y] = 0;
			rabbits--;
		} else if (board[x][y] == 2 && rand(fox_death)) {
			board[x][y] = 0;
			foxes--;
		}
	});
}

// Haupteinstiegspunkt
function run(path) {
	// Simulation vorbereiten
	init(path);
	save(path);

	// Simulation durchführen
	while (rabbits && foxes && round < 100) {
		// Geburtenphase (Hase)
		if (rabbits) addRabbits();

		// Bewegungsphase
		move();

		// Geburtenphase (Fuchs)
		if (foxes) {
			fight();
			addFoxes();
		}

		// Sterbephase
		rem();

		// Runde speichern und fortfahren
		round++;
		save(path);
	}
}

module.exports = { run };
