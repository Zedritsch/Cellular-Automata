const FS = require("fs");
const SERVER = require("express")();
const SIMULATOR = require("./simulator");
const { PORT, PUBLIC_DIR } = require("js-yaml").load(
	FS.readFileSync("./config.yml", { encoding: "utf-8" })
);
const DIR = __dirname + PUBLIC_DIR;

// Leitet den Benutzer zu "/index.html" weiter
SERVER.get("/", (_req, res) => res.redirect("/index.html"));

// Leitet den Benutzer zum gewünschten Spielstand weiter
SERVER.get("/simulation", (req, res) => {
	res.redirect("/logs/simulation/round" + req.query.round + ".json");
});

// Gibt statische Dateien aus dem DIR-Ordner oder einen 404-Fehler zurück
SERVER.get("*", (req, res) =>
	(
		FS.existsSync(DIR + req.path)
			? !FS.lstatSync(DIR + req.path).isDirectory()
			: false
	)
		? res.sendFile(DIR + req.path)
		: res.sendStatus(404)
);

// Startet den Server und logt den Status/Link
SERVER.listen(PORT, (err) =>
	err ? console.log(err) : console.log("http://localhost:" + PORT)
);

// Führt eine neue Simulation durch
SIMULATOR.run(DIR);
