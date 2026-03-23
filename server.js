const express = require('express');
const db = require('./db');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

// REGISTER
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
    if (user) return res.json({ error: "exists" });

    const hash = await bcrypt.hash(password, 10);

    db.run(
      "INSERT INTO users (username, password) VALUES (?, ?)",
      [username, hash],
      () => res.json({ ok: true })
    );
  });
});

// LOGIN
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
    if (!user) return res.json({ error: "No user" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.json({ error: "Wrong password" });

    res.json({ userId: user.id });
  });
});

// ABBREVIATIONS
app.get('/abbreviations/:userId', (req, res) => {
  db.all("SELECT * FROM abbreviations WHERE user_id = ?", [req.params.userId], (err, rows) => {
    res.json(rows);
  });
});

app.post('/abbreviation', (req, res) => {
  const { user_id, short, full } = req.body;

  db.get(
    "SELECT * FROM abbreviations WHERE user_id = ? AND short = ?",
    [user_id, short],
    (err, row) => {
      if (row) {
        return db.run(
          "UPDATE abbreviations SET full = ? WHERE id = ?",
          [full, row.id],
          () => res.json({ replaced: true })
        );
      }

      db.run(
        "INSERT INTO abbreviations (user_id, short, full) VALUES (?, ?, ?)",
        [user_id, short, full],
        () => res.json({ replaced: false })
      );
    }
  );
});

app.delete('/abbreviation/:id', (req, res) => {
  db.run("DELETE FROM abbreviations WHERE id = ?", [req.params.id], () => {
    res.sendStatus(200);
  });
});

// PROCESS
app.post('/process', (req, res) => {
  const { user_id, text } = req.body;

  db.all("SELECT * FROM abbreviations WHERE user_id = ?", [user_id], (err, rows) => {
    let output = text;

    rows.forEach(r => {
      const regex = new RegExp(`\\b${r.short}\\b`, 'gi');
      output = output.replace(regex, r.full);
    });

    db.run(
      "INSERT INTO history (user_id, input, output) VALUES (?, ?, ?)",
      [user_id, text, output]
    );

    res.json({ output });
  });
});

// HISTORY
app.get('/history/:userId', (req, res) => {
  db.all(
    "SELECT * FROM history WHERE user_id = ? ORDER BY id DESC",
    [req.params.userId],
    (err, rows) => res.json(rows)
  );
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on", PORT));