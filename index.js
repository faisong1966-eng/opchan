const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 3000;

// กำหนดรหัสผ่านสำหรับเข้าหน้าแอดมินตรงนี้ (สามารถเปลี่ยนได้ตามต้องการ)
const ADMIN_PASSWORD = "3579"; 

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ปรับให้รองรับ path บน Render หรือสร้างไฟล์ฐานข้อมูลสำรอง
const dbPath = process.env.NODE_ENV === "production" ? "./database.db" : "./database.db";
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("เชื่อมต่อฐานข้อมูล failed:", err.message);
  } else {
    console.log("Connected to SQLite database.");
  }
});

db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password TEXT,
  points INTEGER DEFAULT 100
)`);

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="th">
    <head>
        <meta charset="UTF-8">
        <title>🎁 LootBox Web - หน้าแรก</title>
        <style>
            body { font-family: Arial, sans-serif; background-color: #1e1e2f; color: #ffffff; text-align: center; padding-top: 80px; }
            .container { background: #2b2b40; padding: 30px; border-radius: 10px; display: inline-block; box-shadow: 0 4px 10px rgba(0,0,0,0.3); width: 350px; }
            h1 { color: #ffd700; }
            a { display: block; background-color: #ff4757; color: white; padding: 10px; margin: 10px 0; border-radius: 5px; text-decoration: none; font-weight: bold; }
            a:hover { background-color: #ff6b81; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🎁 LootBox Web</h1>
            <p>เว็บสุ่มกล่องรางวัลสุดมันส์</p>
            <a href="/login">เข้าสู่ระบบ</a>
            <a href="/register" style="background-color: #2ed573;">สมัครสมาชิก</a>
        </div>
    </body>
    </html>
  `);
});

app.get("/register", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="th">
    <head>
        <meta charset="UTF-8">
        <title>สมัครสมาชิก</title>
        <style>
            body { font-family: Arial, sans-serif; background-color: #1e1e2f; color: #ffffff; text-align: center; padding-top: 50px; }
            .container { background: #2b2b40; padding: 30px; border-radius: 10px; display: inline-block; width: 350px; text-align: left; }
            h2 { color: #2ed573; text-align: center; }
            label { display: block; margin-top: 10px; font-size: 14px; }
            input { width: 100%; padding: 8px; margin-top: 5px; border-radius: 4px; border: none; box-sizing: border-box; }
            button { width: 100%; background-color: #2ed573; color: white; padding: 10px; border: none; border-radius: 5px; margin-top: 20px; font-weight: bold; cursor: pointer; }
            a { display: block; text-align: center; margin-top: 15px; color: #70a1ff; text-decoration: none; }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>📝 สมัครสมาชิก</h2>
            <form action="/register" method="POST">
                <label>Username:</label>
                <input type="text" name="username" required>
                <label>Password:</label>
                <input type="password" name="password" required>
                <button type="submit">ยืนยันการสมัคร</button>
            </form>
            <a href="/">กลับหน้าแรก</a>
        </div>
    </body>
    </html>
  `);
});

app.post("/register", (req, res) => {
  const { username, password } = req.body;
  const sql = `INSERT INTO users (username, password, points) VALUES (?, ?, 100)`;
  db.run(sql, [username, password], (err) => {
    if (err) {
      res.send(`<script>alert("ชื่อผู้ใช้นี้ซ้ำ!"); window.location.href="/register";</script>`);
    } else {
      res.send(`<script>alert("สมัครสมาชิกสำเร็จ! (รับฟรี 100 แต้ม)"); window.location.href="/login";</script>`);
    }
  });
});

app.get("/login", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="th">
    <head>
        <meta charset="UTF-8">
        <title>เข้าสู่ระบบ</title>
        <style>
            body { font-family: Arial, sans-serif; background-color: #1e1e2f; color: #ffffff; text-align: center; padding-top: 50px; }
            .container { background: #2b2b40; padding: 30px; border-radius: 10px; display: inline-block; width: 350px; text-align: left; }
            h2 { color: #ffd700; text-align: center; }
            label { display: block; margin-top: 10px; font-size: 14px; }
            input { width: 100%; padding: 8px; margin-top: 5px; border-radius: 4px; border: none; box-sizing: border-box; }
            button { width: 100%; background-color: #ff4757; color: white; padding: 10px; border: none; border-radius: 5px; margin-top: 20px; font-weight: bold; cursor: pointer; }
            a { display: block; text-align: center; margin-top: 15px; color: #70a1ff; text-decoration: none; }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>🔑 เข้าสู่ระบบ</h2>
            <form action="/login" method="POST">
                <label>Username:</label>
                <input type="text" name="username" required>
                <label>Password:</label>
                <input type="password" name="password" required>
                <button type="submit">เข้าสู่ระบบ</button>
            </form>
            <a href="/">กลับหน้าแรก</a>
        </div>
    </body>
    </html>
  `);
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const sql = `SELECT * FROM users WHERE username = ? AND password = ?`;
  db.get(sql, [username, password], (err, row) => {
    if (row) {
      res.redirect(`/lootbox?username=${row.username}`);
    } else {
      res.send(`<script>alert("รหัสผ่านหรือชื่อผู้ใช้ไม่ถูกต้อง!"); window.location.href="/login";</script>`);
    }
  });
});

app.get("/lootbox", (req, res) => {
  const username = req.query.username;
  if (!username) return res.redirect("/login");

  db.get(`SELECT points FROM users WHERE username = ?`, [username], (err, row) => {
    const currentPoints = row ? row.points : 0;

    res.send(`
      <!DOCTYPE html>
      <html lang="th">
      <head>
          <meta charset="UTF-8">
          <title>สุ่มกล่องรางวัล & เติมเงิน</title>
          <style>
              body { font-family: Arial, sans-serif; background-color: #1e1e2f; color: #ffffff; text-align: center; padding-top: 40px; }
              .container { background: #2b2b40; padding: 25px; border-radius: 10px; display: inline-block; width: 420px; margin-bottom: 30px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }
              h1 { color: #ffd700; font-size: 24px; }
              .wallet { background: rgba(255,255,255,0.1); padding: 10px; border-radius: 5px; margin-bottom: 15px; font-size: 18px; }
              .box-btn { background-color: #ff4757; color: white; padding: 12px 25px; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; font-weight: bold; width: 100%; }
              .box-btn:hover { background-color: #ff6b81; }
              input[type="text"] { width: 100%; padding: 10px; margin: 10px 0; border-radius: 5px; border: none; box-sizing: border-box; }
              .topup-btn { background-color: #2ed573; color: white; padding: 10px; border: none; border-radius: 5px; width: 100%; font-weight: bold; cursor: pointer; }
              .topup-btn:hover { background-color: #26af5f; }
              hr { border: 0; border-top: 1px solid #444; margin: 20px 0; }
              a { display: block; margin-top: 15px; color: #ff4757; text-decoration: none; }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>🎁 หน้าสุ่มกล่องรางวัล</h1>
              <p>ผู้ใช้งาน: <b>${username}</b></p>
              <div class="wallet">💰 แต้มคงเหลือ: <span id="points">${currentPoints}</span> แต้ม</div>
              
              <button class="box-btn" onclick="openBox()">📦 เปิดกล่อง (50 แต้ม)</button>
              <p id="result" style="margin-top: 15px; font-size: 16px; color: #2ed573;"></p>

              <hr>

              <h3>💸 เติมเงินด้วยซองของขวัญ TrueMoney</h3>
              <p style="font-size: 13px; color: #aaa;">นำลิงก์ซองอั่งเปามาวาง (1 บาท = 1 แต้ม)</p>
              <input type="text" id="giftUrl" placeholder="https://gift.truemoney.com/campaign/?v=...">
              <button class="topup-btn" onclick="topupWallet()">ยืนยันการเติมเงิน</button>

              <a href="/">ออกจากระบบ</a>
          </div>

          <script>
              let userPoints = ${currentPoints};
              
              function openBox() {
                  if (userPoints < 50) {
                      alert("แต้มของคุณไม่พอใช้งาน!");
                      return;
                  }
                  userPoints -= 50;
                  document.getElementById("points").innerText = userPoints;
                  
                  const rewards = ["🎉 เกลือ (ไม่ได้อะไรเลย)", "🏆 ไอเทมระดับ SSR!", "💎 เพชร 500 เม็ด"];
                  const randomReward = rewards[Math.floor(Math.random() * rewards.length)];
                  document.getElementById("result").innerText = randomReward;
              }

              function topupWallet() {
                  const url = document.getElementById("giftUrl").value;
                  if (!url) {
                      alert("กรุณากรอกลิงก์ซองของขวัญก่อนครับ!");
                      return;
                  }

                  fetch('/topup', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ username: '${username}', giftUrl: url })
                  })
                  .then(response => response.json())
                  .then(data => {
                      alert(data.message);
                      if (data.success) {
                          location.reload();
                      }
                  })
                  .catch(error => {
                      alert("เกิดข้อผิดพลาดในการเชื่อมต่อกับระบบเติมเงิน!");
                  });
              }
          </script>
      </body>
      </html>
    `);
  });
});

app.post("/topup", async (req, res) => {
  const { username, giftUrl } = req.body;

  try {
    let match = giftUrl.match(/v=([a-zA-Z0-9]+)/);
    if (!match) {
      return res.json({ success: false, message: "รูปแบบลิงก์ซองของขวัญไม่ถูกต้อง!" });
    }
    let voucherCode = match[1];

    let myWalletPhone = "0812345678"; 

    let apiResponse = await axios.post(`https://gift.truemoney.com/campaign/vouchers/${voucherCode}/redeem`, {
      mobile: myWalletPhone,
      voucher_hash: voucherCode
    });

    let data = apiResponse.data;

    if (data.status.code === "SUCCESS") {
      let amount = parseFloat(data.data.my_ticket.amount_baht);

      db.run(`UPDATE users SET points = points + ? WHERE username = ?`, [amount, username], (err) => {
        if (err) {
          res.json({ success: false, message: "เติมเงินสำเร็จ แต่บันทึกแต้มลงฐานข้อมูลไม่สำเร็จ!" });
        } else {
          res.json({ success: true, message: `เติมเงินสำเร็จ! คุณได้รับ ${amount} แต้มเข้าบัญชีแล้ว` });
        }
      });
    } else {
      res.json({ success: false, message: "ซองของขวัญไม่ถูกต้อง, ถูกใช้งานไปแล้ว, หรือหมดอายุแล้ว!" });
    }

  } catch (error) {
    res.json({ success: false, message: "ไม่สามารถตรวจสอบซองได้ (ซองอาจถูกใช้ไปแล้ว หรือลิงก์ไม่ถูกต้อง)" });
  }
});

// หน้าแอดมิน (ป้องกันด้วยรหัสผ่าน)
app.get("/admin", (req, res) => {
  const pass = req.query.pass;
  if (pass !== ADMIN_PASSWORD) {
    return res.send(`
      <body style="background:#1e1e2f; color:#fff; text-align:center; padding-top:80px; font-family:Arial;">
        <div style="background:#2b2b40; padding:30px; display:inline-block; border-radius:10px;">
          <h2>🛠️ เข้าสู่ระบบแอดมิน</h2>
          <form action="/admin" method="GET">
            <input type="password" name="pass" placeholder="กรอกรหัสผ่านแอดมิน" style="padding:8px; width:220px; border-radius:4px; border:none;" required>
            <button type="submit" style="padding:8px 15px; background:#ff4757; color:#fff; border:none; border-radius:4px; cursor:pointer; font-weight:bold;">เข้าสู่ระบบ</button>
          </form>
          <br><a href="/" style="color:#70a1ff; text-decoration:none;">กลับหน้าแรก</a>
        </div>
      </body>
    `);
  }

  db.all(`SELECT * FROM users`, [], (err, rows) => {
    let htmlRows = "";
    if (rows) {
      rows.forEach(user => {
        htmlRows += `<tr><td>${user.id}</td><td><b>${user.username}</b></td><td>${user.points} แต้ม</td></tr>`;
      });
    }
    res.send(`
      <body style="background:#1e1e2f; color:#fff; text-align:center; padding-top:50px; font-family:Arial;">
        <h2>🛠️ รายชื่อสมาชิกทั้งหมด (ผู้ดูแลระบบ)</h2>
        <table border="1" style="margin: 0 auto; border-collapse: collapse; width: 500px; background:#2b2b40;">
          <tr><th>ID</th><th>Username</th><th>Points</th></tr>
          ${htmlRows}
        </table>
        <br><a href="/" style="color:#70a1ff;">กลับหน้าแรก</a>
      </body>
    `);
  });
});

app.listen(PORT, () => {
  console.log("Server running smoothly at port " + PORT);
});