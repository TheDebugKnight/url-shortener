require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const url = require('url');
const app = express();

const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.urlencoded({ extended: false }));

app.use('/public', express.static(`${ process.cwd() }/public`));

app.get('/', function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
});

// in-memory store: { counter, urls: { [short]: original } }
const store = { counter: 1, urls: {} };

app.post('/api/shorturl', function (req, res) {
    const original = req.body.url;

    let parsed;
    try {
        parsed = new url.URL(original);
    } catch (_) {
        return res.json({ error: 'invalid url' });
    }

    if ( parsed.protocol !== 'http:' && parsed.protocol !== 'https:' ) {
        return res.json({ error: 'invalid url' });
    }

    dns.lookup(parsed.hostname, function (err) {
        if (err) return res.json({ error: 'invalid url' });

        const short = store.counter++;
        store.urls[short] = original;
        res.json({ original_url: original, short_url: short });
    });
});

app.get('/api/shorturl/:short', async function (req, res) {
    const target = store.urls[parseInt(req.params.short)];
    if (!target) return res.json({ error: 'No short URL found' });
    await res.redirect(target);
});

app.get('/health', (req, res) => {
    res.send('OK');
});

app.listen(port, function () {
    console.log(`Listening on port ${ port }`);
});
