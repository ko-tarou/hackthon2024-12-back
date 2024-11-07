const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();
const port = 5000;

// HTTPサーバーを作成してSocket.IOを初期化
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000", // クライアントのURLに合わせて変更
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(bodyParser.json());

// データベースの接続
let db = new sqlite3.Database("./data.db", (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log("Connected to the database.");
  }
});

// データベースにテーブルを作成（初回のみ）
db.run(
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL
  )`
);

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
        // 新しいユーザーが追加されたことをWebSocket経由で通知
        io.emit("userAdded", { id: this.lastID, name, email });
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

// WebSocketのイベントリスナー
io.on("connection", (socket) => {
  console.log("クライアントが接続しました:", socket.id);

  // クライアントの切断処理
  socket.on("disconnect", () => {
    console.log("クライアントが切断しました:", socket.id);
  });
});

// HTTPサーバーを起動（Socket.IOも対応）
httpServer.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// サーバー終了時にデータベース接続を閉じる
process.on("SIGINT", () => {
  db.close((err) => {
    if (err) {
      console.error("データベース接続のクローズ中にエラーが発生しました:", err.message);
    } else {
      console.log("データベース接続が正常に閉じられました。");
    }
    process.exit(0); // 正常にプロセスを終了
  });
});
