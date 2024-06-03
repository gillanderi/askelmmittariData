import express from 'express';
import path from "path";
import multer from "multer";
import fs from "fs/promises";

const app: express.Application = express();

const uploadKasittelija: express.RequestHandler = multer({

    dest: path.resolve(__dirname, "tmp"),
    limits: {
        fileSize: 1024 * 500,
    },
    fileFilter: (req, file, callback) => {
        if (file.mimetype === 'application/json') {
            callback(null, true);
        } else {
            callback(new Error('Virheellinen tiedostomuoto. Käytä ainoastaan JSON-tiedostoja.'));
        }
    },

}).single("tiedosto");

const portti: number = 3001;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.resolve(__dirname, "public")));



const kuukaudet = [
    "Tammikuu", "Helmikuu", "Maaliskuu", "Huhtikuu",
    "Toukokuu", "Kesäkuu", "Heinäkuu", "Elokuu",
    "Syyskuu", "Lokakuu", "Marraskuu", "Joulukuu"
];

app.get("/", (req: express.Request, res: express.Response) => {
    res.render("index");
});

app.get('/favicon.ico', (req, res) => res.status(204));

app.post("/lataa", async (req: express.Request, res: express.Response) => {
    try {
        uploadKasittelija(req, res, async (err: any) => {

            if (err) {
                console.error(err);
                res.render('error', { virhe: err.message });
            } else {
                try {
                    if (!req.file) {
                        throw new Error('Tiedosto puuttuu');
                    }

                    const tiedostoPolku = req.file.path;
                    const tiedostoData = await fs.readFile(tiedostoPolku, 'utf-8');

                    const data = JSON.parse(tiedostoData);

                    const kuukausiNumero = data[0]?.kk;
                    const kuukausiNimi = kuukaudet[kuukausiNumero - 1]
                    const vuosi = data[0]?.vvvv;

                    const askeleetYhteensa = data.reduce((summa: number, entry: any) => summa + entry.askeleet, 0);
                    const keskiarvoAskeleet = (askeleetYhteensa / data.length).toFixed(0);

                    res.render('tulokset', { tiedostoData, kuukausiNimi, vuosi, askeleetYhteensa, keskiarvoAskeleet });
                } catch (error: any) {
                    console.error(error);
                    res.render("error", { virhe: error.message });
                } finally {
                    if (req.file && req.file.path) {
                        await fs.unlink(req.file.path);
                    }
                }
            }
        });
    } catch (error: any) {
        console.error(error);
        res.render("error", { virhe: error.message });
    }
});

app.get("/back", (req: express.Request, res: express.Response) => {
    res.redirect("/");
});

app.listen(portti, () => {
    console.log(`Palvelin käynnistyi porttiin http://localhost:${portti}`);
});
