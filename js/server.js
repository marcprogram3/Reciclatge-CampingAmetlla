require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fetch = require('node-fetch');
const cors = require('cors');
const app = express();

const port = 5050;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

const db = new sqlite3.Database(path.join(__dirname, 'recycling.db'), (err) => {
    if (err) {
        console.error('❌ Error connectant a la base de dades:', err.message);
    } else {
        console.log('✅ Connectat a recycling.db');
        db.run(`
            CREATE TABLE IF NOT EXISTS wastes (
                residu TEXT PRIMARY KEY,
                contenidor TEXT,
                descripcio TEXT,
                consells TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }
});

// 🔍 Detecció senzilla d'idioma
function detectarIdioma(consulta) {
    const text = consulta.toLowerCase();
    if (/hola|gracias|por favor|botella|lata|pilas|papel|vidrio/.test(text)) return 'castellano';
    if (/hello|please|bottle|can|batteries|paper|glass/.test(text)) return 'english';
    if (/bonjour|s'il vous plaît|bouteille|canette|piles|papier|verre/.test(text)) return 'french';
    return 'catalan';
}

// 🧠 Ruta de cerca (ara només retorna informació útil)
app.get('/search', async (req, res) => {
    const searchTerm = req.query.s?.toLowerCase().trim();
    if (!searchTerm) {
        return res.status(400).json({ error: 'Paràmetre de cerca requerit' });
    }

    try {
        // 1. Buscar a la base de dades
        const dbResult = await buscarEnBD(searchTerm);
        if (dbResult) {
            return res.json({
                message: formatMessage(dbResult.contenidor, dbResult.descripcio, dbResult.consells, 'catalan')
            });
        }

        // 2. Si no està a la BD, consultar DeepSeek
        const apiKey = process.env.DEEPSEEK_API_KEY;
        if (!apiKey) throw new Error('API Key no configurada');

        const idioma = detectarIdioma(searchTerm);
        const deepseekResult = await consultarDeepSeek(searchTerm, apiKey, idioma);
        
        // Guardar a la BD per a properes consultes
        await guardarEnBD(searchTerm, deepseekResult);

        res.json({
            message: deepseekResult.message
        });

    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ error: 'Error processant la consulta' });
    }
});

function buscarEnBD(searchTerm) {
    return new Promise((resolve, reject) => {
        db.get(
            'SELECT * FROM wastes WHERE residu = ? OR residu LIKE ? LIMIT 1',
            [searchTerm, `%${searchTerm}%`],
            (err, row) => (err ? reject(err) : resolve(row))
        );
    });
}

async function consultarDeepSeek(query, apiKey, idioma) {
    const url = "https://api.deepseek.com/v1/chat/completions";

    const systemMessages = {
        catalan: `Ets un expert en reciclatge del Camping Ametlla. 
Respon ÚNICAMENT amb aquest format:
🗑️ **Contenidor**: [groc/blau/verd/marró/punt verd]
📌 **Per què?**: [explicació breu]
💡 **Consell**: [consell pràctic]

Sense títols addicionals, sense salutacions. Només aquesta informació.`,
        castellano: `Eres un experto en reciclaje del Camping Ametlla. 
Responde ÚNICAMENT con este formato:
🗑️ **Contenedor**: [amarillo/azul/verde/marrón/punto verde]
📌 **¿Por qué?**: [explicación breve]
💡 **Consejo**: [consejo práctico]

Sin títulos adicionales, sin saludos. Solo esta información.`,
        english: `You are a recycling expert at Camping Ametlla. 
Respond ONLY with this format:
🗑️ **Container**: [yellow/blue/green/brown/green point]
📌 **Why?**: [brief explanation]
💡 **Tip**: [practical tip]

No extra titles, no greetings. Only this information.`,
        french: `Vous êtes un expert en recyclage au Camping Ametlla. 
Répondez UNIQUEMENT avec ce format:
🗑️ **Conteneur**: [jaune/bleu/vert/marron/point vert]
📌 **Pourquoi ?**: [explication brève]
💡 **Conseil**: [conseil pratique]

Pas de titres supplémentaires, pas de salutations. Seulement ces informations.`
    };

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
                { role: "system", content: systemMessages[idioma] },
                { role: "user", content: `On va aquest residu: "${query}"?` }
            ],
            max_tokens: 200,
            temperature: 0.3
        })
    });

    if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Extreure informació per guardar a la BD
    const contenidor = content.match(/contenidor:\s*(.+)/i)?.[1]?.trim() || 
                       content.match(/contenedor:\s*(.+)/i)?.[1]?.trim() ||
                       content.match(/container:\s*(.+)/i)?.[1]?.trim() ||
                       content.match(/conteneur:\s*(.+)/i)?.[1]?.trim() || 'No especificat';

    return {
        message: content,
        contenidor: contenidor,
        descripcio: content,
        consells: content.match(/consell:\s*(.+)/i)?.[1]?.trim() || ''
    };
}

function guardarEnBD(residu, data) {
    return new Promise((resolve, reject) => {
        db.run(
            'INSERT OR REPLACE INTO wastes (residu, contenidor, descripcio, consells) VALUES (?, ?, ?, ?)',
            [residu, data.contenidor || '', data.descripcio || '', data.consells || ''],
            (err) => (err ? reject(err) : resolve())
        );
    });
}

// Formatar missatge des de BD (per si de cas)
function formatMessage(contenidor, descripcio, consells, idioma) {
    const texts = {
        catalan: { container: '🗑️ **Contenidor**', why: '📌 **Per què?**', tip: '💡 **Consell**' },
        castellano: { container: '🗑️ **Contenedor**', why: '📌 **¿Por qué?**', tip: '💡 **Consejo**' },
        english: { container: '🗑️ **Container**', why: '📌 **Why?**', tip: '💡 **Tip**' },
        french: { container: '🗑️ **Conteneur**', why: '📌 **Pourquoi ?**', tip: '💡 **Conseil**' }
    };
    const t = texts[idioma] || texts.catalan;
    return `${t.container}: ${contenidor}\n\n${t.why}: ${descripcio}\n\n${t.tip}: ${consells || 'Separa correctament i ajuda a cuidar el medi ambient!'}`;
}

app.listen(port, () => {
    console.log(`\n🌍 Servidor actiu → http://localhost:${port}`);
    console.log(`🤖 DeepSeek respon en múltiples idiomes amb format professional\n`);
});