const rect = document.getElementsByTagName("canvas")[0].getContext("2d");
const code = document.getElementsByTagName("code")[0];
const play_button = document.getElementById("play");

let round = Number(new URLSearchParams(location.search).get("round"));
let current_round = 0;

// Erstellt ein leeres Spielbrett
function emptyBoard() {
	let board = [];

	for (let x = 0; x < 200; x++) {
		board[x] = [];

		for (let y = 0; y < 200; y++) board[x][y] = 0;
	}

	return board;
}

// Sorgt für einen farblich alternierten Hintergrund, durch wechselnde Farben
function background(x, y) {
	return (x + (y % 2 == 0 ? 0 : 1)) % 2 == 0 ? "#c0d470" : "#a4c263";
}

// Hasen (1) werden Blau und Füchse (2) werden Rot anzeigt
function foreground(field) {
	return field == 1 ? "blue" : "red";
}

// Zeichnet den Inhalt des Canvas neu
function draw(board) {
	for (let x = 0; x < 200; x++) {
		for (let y = 0; y < 200; y++) {
			// Alt: rect.fillStyle = board[x][y] ? foreground(board[x][y]) : "#0000";
			rect.fillStyle = board[x][y] ? foreground(board[x][y]) : background(x, y);
			rect.fillRect(x, y, 1, 1);
		}
	}
}

// Startet die Autoplay-Funktion
function play() {
	play_button.innerText = play_button.innerText == "⏸️" ? "▶️" : "⏸️";

	autoplay();
}

// Lädt in festen Zeitabständen die nächste Runde
function autoplay() {
	if (play_button.innerText == "▶️") return;

	load(1);

	setTimeout(autoplay, 1000);
}

// Lädt eine ausgewählte Runde
async function load(round_offset) {
	round += round_offset;

	// Runde 0 gehört nicht zur Simulation und wird daher leer gerendert
	if (round < 1) {
		round = 0;
		window.history.pushState({}, "", location.pathname);
		draw(emptyBoard());
		return;
	}

	const request = await fetch("simulation?round=" + round);

	// Gibt an ob die Simulation beendet ist
	if (request.status == 404) {
		round -= round_offset;
		play_button.innerText = "▶️";
		alert("Es konnte keine weitere Runde gefunden werden!");
		return;
	}

	// Wirft jede erhaltene Fehlermeldung
	if (request.status != 200) {
		round -= round_offset;
		play_button.innerText = "▶️";
		alert("ERROR: " + request.status);
		return;
	}

	// Übernimmt die neue Runde
	const response = await request.json();
	window.history.pushState({}, "", "?round=" + round);
	draw(response.board);

	// Ergänzt die Simulationsausgabe, falls nötig
	if (round > current_round) {
		current_round = round;
		code.innerHTML += "<br>" + response.log;
	}
}

onload = () => load(0);
