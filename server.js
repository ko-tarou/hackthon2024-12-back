// server.js
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");

const app = express();
const port = 5000;

const cors = require("cors");
app.use(cors());


// データベースの接続
let db = new sqlite3.Database("./data.db", (err) => {
	if (err) {
    console.error(err.message);
  }
  console.log("Connected to the database.");
});

// データベースにテーブルを作成（初回のみ）
db.run(
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL
  )`
);

app.use(bodyParser.json());

// ユーザー情報を追加するエンドポイント
app.post("/api/users", (req, res) => {
  const { name, email } = req.body;
  db.run(
    `INSERT INTO users (name, email) VALUES (?, ?)`,
    [name, email],
    function (err) {
      if (err) {
        console.error(err.message);
        res.status(500).send("データの保存に失敗しました。");
      } else {
        res.status(201).send(`ユーザーが追加されました。ID: ${this.lastID}`);
      }
    }
  );
});

// すべてのユーザー情報を取得するエンドポイント
app.get("/api/users", (req, res) => {
  db.all(`SELECT * FROM users`, [], (err, rows) => {
    if (err) {
      res.status(500).send("データの取得に失敗しました。");
    } else {
      res.status(200).json(rows);
    }
  });
});

// サーバーを起動
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

