const express = require("express");
const session = require("express-session");
const sqlite3 = require("sqlite3").verbose();
const axios = require("axios");
const multer = require("multer");
const path = require("path");
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

// กำหนดรหัสผ่านสำหรับเข้าหน้าแอดมิน
const ADMIN_PASSWORD = "3579"; 

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './public/uploads');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

app.use('/uploads', express.static('public/uploads'));

app.use(session({
  secret: 'lootbox_super_secret_key_2026',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 600000 }
}));

if (!fs.existsSync('./public/uploads')) {
  fs.mkdirSync('./public/uploads', { recursive: true });
}

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
  roblox_img TEXT,
  points INTEGER DEFAULT 0
)`);

db.run(`CREATE TABLE IF NOT EXISTS history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT,
  roblox_img TEXT,
  reward TEXT,
  time DATETIME DEFAULT CURRENT_TIMESTAMP
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
            body { font-family: Arial, sans-serif; background-color: #1e1e2f; color: #ffffff; text-align: center; padding-top: 30px; }
            .container { background: #2b2b40; padding: 30px; border-radius: 10px; display: inline-block; width: 360px; text-align: left; }
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
            <form action="/register" method="POST" enctype="multipart/form-data">
                <label>Username (สำหรับเข้าเว็บ):</label>
                <input type="text" name="username" required>
                <label>Password:</label>
                <input type="password" name="password" required>
                <label>อัปโหลดรูปโปรไฟล์ Roblox ของคุณ:</label>
                <input type="file" name="roblox_img" accept="image/*" required style="background:white; color:black; padding:5px;">
                <button type="submit">ยืนยันการสมัคร</button>
            </form>
            <a href="/">กลับหน้าแรก</a>
        </div>
    </body>
    </html>
  `);
});

app.post("/register", upload.single('roblox_img'), (req, res) => {
  const { username, password } = req.body;
  const robloxImg = req.file ? `/uploads/${req.file.filename}` : "";

  const sql = `INSERT INTO users (username, password, roblox_img, points) VALUES (?, ?, ?, 0)`;
  db.run(sql, [username, password, robloxImg], (err) => {
    if (err) {
      res.send(`<script>alert("ชื่อผู้ใช้นี้ซ้ำในระบบแล้ว!"); window.location.href="/register";</script>`);
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

  db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, row) => {
    if (!row) return res.redirect("/login");
    const currentPoints = row.points;
    const robloxImg = row.roblox_img;

    res.send(`
      <!DOCTYPE html>
      <html lang="th">
      <head>
          <meta charset="UTF-8">
          <title>สุ่มกล่อง Robux อลังการ</title>
          <style>
              body { font-family: Arial, sans-serif; background-color: #1e1e2f; color: #ffffff; text-align: center; padding-top: 20px; }
              .container { background: #2b2b40; padding: 25px; border-radius: 10px; display: inline-block; width: 450px; margin-bottom: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); }
              h1 { color: #ffd700; font-size: 24px; text-shadow: 0 0 10px rgba(255,215,0,0.5); }
              .wallet { background: rgba(255,255,255,0.1); padding: 10px; border-radius: 5px; margin-bottom: 15px; font-size: 18px; }
              
              /* ปุ่มเปิดกล่องหลัก */
              .box-btn { background: linear-gradient(45deg, #ff4757, #ff6b81); color: white; padding: 14px 25px; border: none; border-radius: 8px; font-size: 18px; cursor: pointer; font-weight: bold; width: 100%; box-shadow: 0 4px 15px rgba(255,71,87,0.4); transition: 0.2s; }
              .box-btn:hover { transform: scale(1.02); background: linear-gradient(45deg, #ff6b81, #ff4757); }
              
              input[type="text"] { width: 100%; padding: 10px; margin: 10px 0; border-radius: 5px; border: none; box-sizing: border-box; }
              .topup-btn { background-color: #2ed573; color: white; padding: 10px; border: none; border-radius: 5px; width: 100%; font-weight: bold; cursor: pointer; }
              .topup-btn:hover { background-color: #26af5f; }
              .profile-img { width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid #ffd700; vertical-align: middle; margin-right: 10px; }
              
              /* รายการของรางวัลในตู้ */
              .reward-showcase { background: rgba(0,0,0,0.3); padding: 12px; border-radius: 8px; margin-bottom: 15px; text-align: left; max-height: 120px; overflow-y: auto; font-size: 13px; border: 1px solid #444; }
              .reward-item { display: inline-block; background: #3d3d5c; padding: 4px 8px; margin: 3px; border-radius: 4px; color: #ffd700; font-weight: bold; }
              .reward-epic { background: #8e44ad; color: #fff; }
              .reward-legend { background: #e74c3c; color: #fff; animation: pulseGlow 1s infinite alternate; }

              /* เอฟเฟกต์อลังการเวลาเปิดได้ของรางวัลใหญ่ */
              #result-box { margin-top: 15px; padding: 15px; border-radius: 8px; font-size: 18px; font-weight: bold; background: rgba(0,0,0,0.4); min-height: 40px; transition: all 0.3s; }
              
              .epic-glow {
                  animation: epicFlash 0.5s infinite alternate, rainbowText 2s linear infinite;
                  box-shadow: 0 0 25px #ffd700, inset 0 0 15px #ff4757;
                  border: 2px solid #ffd700;
                  font-size: 22px !important;
              }

              @keyframes epicFlash {
                  0% { background-color: rgba(255, 215, 0, 0.2); }
                  100% { background-color: rgba(255, 71, 87, 0.4); }
              }

              @keyframes pulseGlow {
                  0% { transform: scale(1); }
                  100% { transform: scale(1.05); }
              }

              hr { border: 0; border-top: 1px solid #444; margin: 20px 0; }
              a { display: block; margin-top: 15px; color: #ff4757; text-decoration: none; }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>🎁 สุ่มกล่อง Roblox Robux</h1>
              
              <div style="margin-bottom: 15px; text-align: left; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px;">
                  <img src="${robloxImg}" class="profile-img">
                  <span>ผู้ใช้งาน: <b>${username}</b></span>
              </div>
              
              <div class="wallet">💰 แต้มคงเหลือ: <span id="points">${currentPoints}</span> แต้ม</div>
              
              <!-- แสดงรายการของรางวัลในกล่องให้ผู้เล่นเห็น -->
              <div style="text-align: left; font-size: 13px; color: #aaa; margin-bottom: 5px;">🏆 ของรางวัลที่มีในกล่องนี้:</div>
              <div class="reward-showcase">
                  <span class="reward-item">0 Robux</span>
                  <span class="reward-item">1 Robux</span>
                  <span class="reward-item">2 Robux</span>
                  <span class="reward-item">3 Robux</span>
                  <span class="reward-item">4 Robux</span>
                  <span class="reward-item">5 Robux</span>
                  <span class="reward-item">6 Robux</span>
                  <span class="reward-item">7 Robux</span>
                  <span class="reward-item">8 Robux</span>
                  <span class="reward-item">9 Robux</span>
                  <span class="reward-item">10 Robux</span>
                  <span class="reward-item">15 Robux</span>
                  <span class="reward-item">20 Robux</span>
                  <span class="reward-item reward-epic">30 Robux</span>
                  <span class="reward-item reward-epic">50 Robux</span>
                  <span class="reward-item reward-legend">100 Robux 🔥</span>
                  <span class="reward-item reward-legend">500 Robux 💎</span>
                  <span class="reward-item reward-legend">1,000 Robux 👑</span>
              </div>

              <button class="box-btn" onclick="openBox()">📦 เปิดกล่องลุ้นโชค (1 แต้ม)</button>
              
              <!-- กล่องแสดงผลลัพธ์พร้อมเอฟเฟกต์อลังการ -->
              <div id="result-box">🎁 กดเปิดกล่องเพื่อลุ้นรับรางวัล!</div>

              <hr>

              <h3>💸 เติมเงินด้วยซองของขวัญ TrueMoney</h3>
              <p style="font-size: 13px; color: #aaa;">นำลิงก์ซองอั่งเปามาวาง (1 บาท = 1 แต้ม)</p>
              <input type="text" id="giftUrl" placeholder="https://gift.truemoney.com/campaign/?v=...">
              <button class="topup-btn" onclick="topupWallet()">ยืนยันการเติมเงิน</button>

              <a href="/">ออกจากระบบ</a>
          </div>

          <script>
              let userPoints = ${currentPoints};
              
              // ระบบสร้างเสียงเอฟเฟกต์ผ่านเว็บ (ไม่ต้องโหลดไฟล์เสียงเพิ่ม)
              function playSound(type) {
                  try {
                      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                      const osc = audioCtx.createOscillator();
                      const gainNode = audioCtx.createGain();
                      osc.connect(gainNode);
                      gainNode.connect(audioCtx.destination);

                      if (type === 'normal') {
                          osc.frequency.setValueAtTime(300, audioCtx.currentTime);
                          osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.15);
                          gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                          gainNode.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
                          osc.start();
                          osc.stop(audioCtx.currentTime + 0.15);
                      } else if (type === 'jackpot') {
                          // เสียงระฆังแจ็คพอตอลังการ
                          let notes = [523.25, 659.25, 783.99, 1046.50];
                          notes.forEach((freq, index) => {
                              let o = audioCtx.createOscillator();
                              let g = audioCtx.createGain();
                              o.connect(g);
                              g.connect(audioCtx.destination);
                              o.frequency.setValueAtTime(freq, audioCtx.currentTime + (index * 0.1));
                              g.gain.setValueAtTime(0.15, audioCtx.currentTime + (index * 0.1));
                              g.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + (index * 0.1) + 0.3);
                              o.start(audioCtx.currentTime + (index * 0.1));
                              o.stop(audioCtx.currentTime + (index * 0.1) + 0.3);
                          });
                      }
                  } catch(e) {}
              }

              function openBox() {
                  if (userPoints < 1) {
                      alert("แต้มของคุณไม่พอใช้งาน! กรุณาเติมเงินก่อนครับ");
                      return;
                  }
                  userPoints -= 1;
                  document.getElementById("points").innerText = userPoints;
                  
                  const resBox = document.getElementById("result-box");
                  resBox.className = "";
                  resBox.innerText = "🌀 กำลังเปิดกล่องลุ้นระทึก...";

                  setTimeout(() => {
                      const rand = Math.random() * 100;
                      let reward = "";
                      let isBigWin = false;

                      if (rand < 0.001) {
                          reward = "1,000 Robux (👑 แจ็คพอตในตำนาน!)";
                          isBigWin = true;
                      } else if (rand < 0.01) {
                          reward = "500 Robux (💎 แจ็คพอตใหญ่มาก!)";
                          isBigWin = true;
                      } else if (rand < 0.05) {
                          reward = "100 Robux (🔥 แจ็คพอตแตก!)";
                          isBigWin = true;
                      } else if (rand < 0.15) {
                          reward = "50 Robux (✨ สุดยอดรางวัล!)";
                          isBigWin = true;
                      } else if (rand < 0.4) {
                          reward = "30 Robux";
                          isBigWin = true;
                      } else if (rand < 1.0) {
                          reward = "20 Robux";
                      } else if (rand < 2.2) {
                      } else if (rand < 2.2) {
                          reward = "15 Robux";
                      } else if (rand < 4.5) {
                          reward = "10 Robux";
                      } else if (rand < 8.0) {
                          reward = "9 Robux";
                      } else if (rand < 13.0) {
                          reward = "8 Robux";
                      } else if (rand < 19.0) {
                          reward = "7 Robux";
                      } else if (rand < 26.0) {
                          reward = "6 Robux";
                      } else if (rand < 35.0) {
                          reward = "5 Robux";
                      } else if (rand < 45.0) {
                          reward = "4 Robux";
                      } else if (rand < 57.0) {
                          reward = "3 Robux";
                      } else if (rand < 70.0) {
                          reward = "2 Robux";
                      } else if (rand < 90.0) {
                          reward = "1 Robux";
                      } else {
                          reward = "0 Robux (😢 เกลือสนั่น)";
                      }

                      if (isBigWin) {
                          playSound('jackpot');
                          resBox.className = "epic-glow";
                          resBox.innerHTML = "🎉 <span style='color:#ffd700; font-size:24px;'>DEVIN WIN!</span> 🎉<br>คุณได้รับ: <b>" + reward + "</b>";
                      } else {
                          playSound('normal');
                          resBox.style.color = "#2ed573";
                          resBox.innerText = "🎉 ผลลัพธ์: ได้รับ " + reward;
                      }

                      fetch('/save-history', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ username: '${username}', reward: reward })
                      });
                  }, 600); // ดีเลย์เปิดกล่อง 0.6 วิเพิ่มความตื่นเต้น
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

app.post("/save-history", (req, res) => {
  const { username, reward } = req.body;
  db.get(`SELECT roblox_img FROM users WHERE username = ?`, [username], (err, row) => {
    if (row) {
      db.run(`INSERT INTO history (username, roblox_img, reward) VALUES (?, ?, ?)`, [username, row.roblox_img, reward]);
    }
  });
  res.sendStatus(200);
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

// --- หน้าแอดมิน ---
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
  db.all(`SELECT * FROM users`, [], (err, usersRows) => {
    db.all(`SELECT * FROM history ORDER BY id DESC`, [], (err, historyRows) => {
      let userHtml = "";
      if (usersRows) {
        usersRows.forEach(u => {
          userHtml += `<tr>
            <td>${u.id}</td>
            <td><b>${u.username}</b></td>
            <td><img src="${u.roblox_img}" style="width:40px; height:40px; border-radius:50%; object-fit:cover;"></td>
            <td>${u.points} แต้ม</td>
          </tr>`;
        });
      }

      let historyHtml = "";
      if (historyRows) {
        historyRows.forEach(h => {
          historyHtml += `<tr>
            <td>${h.id}</td>
            <td>${h.username}</td>
            <td><img src="${h.roblox_img}" style="width:40px; height:40px; border-radius:50%; object-fit:cover;"></td>
            <td style="color:#ffd700;"><b>${h.reward}</b></td>
            <td>${h.time}</td>
          </tr>`;
        });
      }

      res.send(`
        <body style="background:#1e1e2f; color:#fff; text-align:center; padding-top:40px; font-family:Arial;">
          <h2>🛠️ ระบบจัดการหลังบ้าน (แอดมิน)</h2>
          <a href="/admin/logout" style="color:#ff4757; font-weight:bold; text-decoration:none; display:inline-block; margin-bottom:20px;">🔒 ออกจากระบบแอดมิน</a>
          <a href="/" style="color:#70a1ff; text-decoration:none; margin-left:15px;">🏠 กลับหน้าแรก</a>

          <h3>👥 รายชื่อสมาชิกทั้งหมด</h3>
          <table border="1" style="margin: 0 auto; border-collapse: collapse; width: 600px; background:#2b2b40;">
            <tr><th>ID</th><th>Username</th><th>รูปโปรไฟล์ Roblox</th><th>Points</th></tr>
            ${userHtml}
          </table>

          <h3 style="margin-top:40px;">📜 ประวัติการเปิดกล่อง (สำหรับนำไปแจก Robux)</h3>
          <table border="1" style="margin: 0 auto 50px auto; border-collapse: collapse; width: 700px; background:#2b2b40;">
            <tr><th>#ID</th><th>Username</th><th>รูปโปรไฟล์ Roblox</th><th>รางวัลที่ได้</th><th>เวลา</th></tr>
            ${historyHtml}
          </table>
        </body>
      `);
    });
  });
}

app.listen(PORT, () => {
  console.log("Server running smoothly at port " + PORT);
});