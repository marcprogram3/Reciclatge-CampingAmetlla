const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fetch = require('node-fetch');
const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, '..')));

app.get('/', (req, res) => {
    res.send('Servidor en marxa');
});

const db = new sqlite3.Database('recycling.db', (err) => {
    if (err) {
        console.error('Error connectant a la base de dades:', err.message);
    } else {
        console.log('Connectat a la base de dades recycling.db');
        db.run(`
            CREATE TABLE IF NOT EXISTS wastes (
                residu TEXT PRIMARY KEY,
                contenidor TEXT,
                descripcio TEXT,
                normativa TEXT,
                consells TEXT
            )
        `);
    }
});

// Ruta per la cerca amb Grok
app.get('/grok-search', async (req, res) => {
    const query = req.query.s;
    if (!query) {
        res.status(400).json({ error: 'Paràmetre de cerca requerit' });
        return;
    }

    const apiKey = "xai-675Lr0g2NQN5JQoRK1TNDtiC0lKe7loAPY96TNc28wwkrk1BvkyNqEXo68PjyGAI1wTDPvWxPhMxhB8v"; // La teva clau
    const url = "https://api.x.ai/v1/chat/completions";

    const requestBody = {
        model: "grok-3",
        messages: [
            {
                role: "system",
                content: "Ets Grok, creat per xAI. Totes les teves respostes han de tractar-se com a consultes sobre gestió de residus. Proporciona consells clars i útils sobre on reciclar cada residu (contenidors com groc, blau, verd, marró, o punts específics com contenidors de piles), amb un to professional i genèric, sense citar lleis específiques. Si no coneixes el residu, suggereix consultar un punt verd."
            },
            {
                role: "user",
                content: `On s’ha de reciclar el residu "${query}"?`
            }
        ],
        max_tokens: 150
    };

    try {
        console.log("Enviant sol·licitud a l'API amb query:", query);
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        });

        console.log("Resposta de l'API:", response.status, response.statusText);
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Dades rebudes de l'API:", data);
        if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
            throw new Error("Resposta de l'API invàlida o sense contingut.");
        }

        const result = data.choices[0].message.content;
        res.json({ message: result });
    } catch (error) {
        console.error("Error amb Grok:", error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/search', (req, res) => {
    const searchTerm = req.query.s.toLowerCase();
    db.all(`
        SELECT * FROM wastes WHERE residu LIKE ? LIMIT 5
    `, [`%${searchTerm}%`], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.listen(port, () => {
    console.log(`Servidor executant-se a http://localhost:${port}`);
});