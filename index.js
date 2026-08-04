const express = require("express");
const session = require("express-session");
const sqlite3 = require("sqlite3").verbose();
const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 3000;

// กำหนดรหัสผ่านสำหรับเข้าหน้าแอดมิน
const ADMIN_PASSWORD = "3579"; 

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ตั้งค่า Session สำหรับความปลอดภัย
app.use(session({
  secret: 'lootbox_super_secret_key_2026',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 600000 }
}));

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
  points INTEGER DEFAULT 0
)`);

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="th">
    <head>
        <meta charset="UTF-8">
        <title>🎁 Roblox Robux LootBox - หน้าแรก</title>
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
            <h1>🎁 Roblox Robux Box</h1>
            <p>เว็บสุ่มลุ้นรับ Robux สุดมันส์</p>
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
  const sql = `INSERT INTO users (username, password, points) VALUES (?, ?, 0)`;
  db.run(sql, [username, password], (err) => {
    if (err) {
      res.send(`<script>alert("ชื่อผู้ใช้นี้ซ้ำ!"); window.location.href="/register";</script>`);
    } else {
      res.send(`<script>alert("สมัครสมาชิกสำเร็จ! (เริ่มต้น 0 แต้ม กรุณาเติมเงินก่อนใช้งาน)"); window.location.href="/login";</script>`);
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
          <title>สุ่มกล่อง Robux & เติมเงิน</title>
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
              <h1>🎁 สุ่มกล่อง Robux</h1>
              <p>ผู้ใช้งาน: <b>${username}</b></p>
              <div class="wallet">💰 แต้มคงเหลือ: <span id="points">${currentPoints}</span> แต้ม</div>
              
              <button class="box-btn" onclick="openBox()">📦 เปิดกล่อง (1 แต้ม)</button>
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
                  if (userPoints < 1) {
                      alert("แต้มของคุณไม่พอใช้งาน! กรุณาเติมเงินก่อนครับ");
                      return;
                  }
                  userPoints -= 1;
                  document.getElementById("points").innerText = userPoints;
                  
                  // ระบบสุ่ม Robux (0 โล ออกเยอะสุด, 1 โล ออกรองลงมา, รางวัลอื่นออกยาก)
                  const rand = Math.random() * 100; // สุ่ม 0 - 100
                  let reward = "";

                  if (rand < 0.2) {
                      reward = "🔥 แจ็คพอตแตก! ได้รับ 100 Robux!";
                  } else if (rand < 0.6) {
                      reward = "💎 ยอดเยี่ยม! ได้รับ 50 Robux!";
                  } else if (rand < 1.2) {
                      reward = "✨ ได้รับ 30 Robux!";
                  } else if (rand < 2.0) {
                      reward = "🎉 ได้รับ 20 Robux!";
                  } else if (rand < 3.5) {
                      reward = "🎁 ได้รับ 15 Robux!";
                  } else if (rand < 6.0) {
                      reward = "📦 ได้รับ 10 Robux";
                  } else if (rand < 9.5) {
                      reward = "📦 ได้รับ 9 Robux";
                  } else if (rand < 14.0) {
                      reward = "📦 ได้รับ 8 Robux";
                  } else if (rand < 19.5) {
                      reward = "📦 ได้รับ 7 Robux";
                  } else if (rand < 26.0) {
                      reward = "📦 ได้รับ 6 Robux";
                  } else if (rand < 34.0) {
                      reward = "📦 ได้รับ 5 Robux";
                  } else if (rand < 43.0) {
                      reward = "📦 ได้รับ 4 Robux";
                  } else if (rand < 53.0) {
                      reward = "📦 ได้รับ 3 Robux";
                  } else if (rand < 65.0) {
                      reward = "📦 ได้รับ 2 Robux";
                  } else if (rand < 88.0) {
                      reward = "📦 ได้รับ 1 Robux (เน้นออกบ่อย)";
                  } else {
                      reward = "😢 เกลือ! ได้รับ 0 Robux (ออกเยอะที่สุด)";
                  }

                  document.getElementById("result").innerText = reward;
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

// --- หน้าแอดมิน (ปลอดภัยด้วย Session) ---
app.get("/admin", (req, res) => {
  if (req.session.isAdmin) {
    return renderAdminDashboard(res);
  }

  res.send(`
    <body style="background:#1e1e2f; color:#fff; text-align:center; padding-top:80px; font-family:Arial;">
      <div style="background:#2b2b40; padding:30px; display:inline-block; border-radius:10px; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
        <h2>🛠️ เข้าสู่ระบบผู้ดูแลระบบ</h2>
        <form action="/admin/login" method="POST">
          <input type="password" name="password" placeholder="กรอกรหัสผ่านแอดมิน" style="padding:10px; width:240px; border-radius:4px; border:none; box-sizing:border-box;" required>
          <button type="submit" style="padding:10px 15px; background:#ff4757; color:#fff; border:none; border-radius:4px; cursor:pointer; font-weight:bold; margin-top:10px; width:100%;">เข้าสู่ระบบ</button>
        </form>
        <br><a href="/" style="color:#70a1ff; text-decoration:none; margin-top:15px; display:inline-block;">กลับหน้าแรก</a>
      </div>
    </body>
  `);
});

app.post("/admin/login", (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    res.redirect("/admin");
  } else {
    res.send(`<script>alert("รหัสผ่านแอดมินไม่ถูกต้อง!"); window.location.href="/admin";</script>`);
  }
});

app.get("/admin/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/admin");
  });
});

function renderAdminDashboard(res) {
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
        <br>
        <a href="/admin/logout" style="color:#ff4757; font-weight:bold; text-decoration:none; margin-right:15px;">🔒 ออกจากระบบแอดมิน</a>
        <a href="/" style="color:#70a1ff; text-decoration:none;">🏠 กลับหน้าแรก</a>
      </body>
    `);
  });
}

app.listen(PORT, () => {
  console.log("Server running smoothly at port " + PORT);
});