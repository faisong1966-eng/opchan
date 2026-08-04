const express = require("express");
const session = require("express-session");
const sqlite3 = require("sqlite3").verbose();
const multer = require("multer");
const path = require("path");
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

const ADMIN_PASSWORD = "3579"; 
const MY_PROMPTPAY_NUMBER = "0643399170";
const MY_ACCOUNT_NAME = "นาย ธีรวัฒน์ คำมุงคุณ";

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const uploadDir = fs.existsSync('/data') ? '/data/uploads' : './public/uploads';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

app.use('/uploads', express.static(uploadDir));

app.use(session({
  secret: 'lootbox_super_secret_key_2026',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 600000 }
}));

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const dbPath = fs.existsSync('/data') ? "/data/database.db" : "./database.db";
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("เชื่อมต่อฐานข้อมูล failed:", err.message);
  } else {
    console.log("Connected to SQLite database at: " + dbPath);
  }
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    roblox_img TEXT,
    points INTEGER DEFAULT 0,
    total_spent INTEGER DEFAULT 0
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    roblox_img TEXT,
    reward TEXT,
    reward_num INTEGER DEFAULT 0,
    time DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS pending_topup (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    exact_amount REAL,
    slip_img TEXT,
    status TEXT DEFAULT 'pending',
    time DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

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
            <p>เว็บสุ่มลุ้นรับ Robux สุดมันส์ พร้อมระบบการันตี</p>
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

  const sql = `INSERT INTO users (username, password, roblox_img, points, total_spent) VALUES (?, ?, ?, 0, 0)`;
  db.run(sql, [username, password, robloxImg], (err) => {
    if (err) {
      res.send(`<script>alert("ชื่อผู้ใช้นี้ซ้ำในระบบแล้ว!"); window.location.href="/register";</script>`);
    } else {
      res.send(`<script>alert("สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ"); window.location.href="/login";</script>`);
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
    const totalSpent = row.total_spent || 0;
    const robloxImg = row.roblox_img;

    db.all(`SELECT * FROM pending_topup WHERE username = ? AND status = 'pending'`, [username], (err, pendingRows) => {
      let pendingHtml = "";
      if (pendingRows && pendingRows.length > 0) {
        pendingRows.forEach(p => {
          pendingHtml += `<li style="color:#ffa502;">ยอดโอน <b>${p.exact_amount} บาท</b> (รอแอดมินตรวจสอบสลิป)</li>`;
        });
      } else {
        pendingHtml = `<span style="color:#aaa; font-size:12px;">ไม่มีรายการรอดำเนินการ</span>`;
      }

      res.send(`
        <!DOCTYPE html>
        <html lang="th">
        <head>
            <meta charset="UTF-8">
            <title>สุ่มกล่อง Roblox Robux</title>
            <style>
                body { font-family: Arial, sans-serif; background-color: #1e1e2f; color: #ffffff; text-align: center; padding-top: 20px; }
                .container { background: #2b2b40; padding: 25px; border-radius: 10px; display: inline-block; width: 460px; margin-bottom: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); }
                h1 { color: #ffd700; font-size: 24px; text-shadow: 0 0 10px rgba(255,215,0,0.5); }
                .wallet { background: rgba(255,255,255,0.1); padding: 10px; border-radius: 5px; margin-bottom: 15px; font-size: 16px; display: flex; justify-content: space-around; }
                
                .box-btn { background: linear-gradient(45deg, #ff4757, #ff6b81); color: white; padding: 14px 25px; border: none; border-radius: 8px; font-size: 18px; cursor: pointer; font-weight: bold; width: 100%; box-shadow: 0 4px 15px rgba(255,71,87,0.4); transition: 0.2s; }
                .box-btn:hover { transform: scale(1.02); background: linear-gradient(45deg, #ff6b81, #ff4757); }
                
                input[type="number"] { width: 100%; padding: 10px; margin: 10px 0; border-radius: 5px; border: none; box-sizing: border-box; }
                .topup-btn { background-color: #2ed573; color: white; padding: 10px; border: none; border-radius: 5px; width: 100%; font-weight: bold; cursor: pointer; }
                .topup-btn:hover { background-color: #26af5f; }
                .profile-img { width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid #ffd700; vertical-align: middle; margin-right: 10px; }
                
                .reward-showcase { background: rgba(0,0,0,0.3); padding: 12px; border-radius: 8px; margin-bottom: 12px; text-align: left; max-height: 100px; overflow-y: auto; font-size: 13px; border: 1px solid #444; }
                .reward-item { display: inline-block; background: #3d3d5c; padding: 4px 8px; margin: 3px; border-radius: 4px; color: #ffd700; font-weight: bold; }
                .reward-epic { background: #8e44ad; color: #fff; }
                .reward-legend { background: #e74c3c; color: #fff; }

                .guarantee-box { background: rgba(255, 165, 2, 0.15); border: 1px dashed #ffa502; padding: 10px; border-radius: 8px; margin-bottom: 15px; text-align: left; font-size: 13px; }
                .guarantee-box b { color: #ffa502; }

                #result-box { margin-top: 15px; padding: 15px; border-radius: 8px; font-size: 16px; font-weight: bold; background: rgba(0,0,0,0.4); min-height: 50px; transition: all 0.3s; text-align: left; }
                
                .epic-glow {
                    animation: epicFlash 0.5s infinite alternate;
                    box-shadow: 0 0 25px #ffd700, inset 0 0 15px #ff4757;
                    border: 2px solid #ffd700;
                }

                @keyframes epicFlash {
                    0% { background-color: rgba(255, 215, 0, 0.2); }
                    100% { background-color: rgba(255, 71, 87, 0.4); }
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
                
                <div class="wallet">
                    <div>💰 แต้ม: <span id="points">${currentPoints}</span></div>
                    <div>🎯 ยอดสุ่มสะสม: <span id="spent">${totalSpent}</span> บาท</div>
                </div>

                <div class="guarantee-box">
                    <b>🛡️ ระบบการันตีสุดคุ้ม (ยอดสะสม):</b><br>
                    • ครบ <b>100 บาท</b> การันตีรับ <b>100 Robux</b><br>
                    • ครบ <b>300 บาท</b> การันตีรับ <b>300 Robux</b><br>
                    • ครบ <b>500 บาท</b> การันตีรับ <b>500 Robux</b><br>
                    • ครบ <b>1,000 บาท</b> การันตีรับ <b>1,000 Robux</b>
                </div>
                
                <div style="text-align: left; font-size: 13px; color: #aaa; margin-bottom: 5px;">🏆 ของรางวัลในกล่อง:</div>
                <div class="reward-showcase">
                    <span class="reward-item">0 Robux (เกลือ)</span>
                    <span class="reward-item">1 - 2 Robux</span>
                    <span class="reward-item">3 - 5 Robux</span>
                    <span class="reward-item reward-epic">10 - 20 Robux</span>
                    <span class="reward-item reward-legend">100 Robux 🔥</span>
                    <span class="reward-item reward-legend">500 Robux 💎</span>
                    <span class="reward-item reward-legend">1,000 Robux 👑</span>
                </div>

                <button class="box-btn" onclick="openBox()">📦 เปิดกล่องลุ้นโชค (1 แต้ม/ครั้ง)</button>
                
                <div id="result-box">🎁 กดเปิดกล่องเพื่อลุ้นรับรางวัล!</div>

                <hr>

                <h3>⚡ เติมเงินผ่าน MyMo (พร้อมเพย์)</h3>
                <p style="font-size: 13px; color: #aaa; text-align: left;">1. ใส่จำนวนเงินเพื่อสร้าง QR<br>2. สแกนโอนผ่าน MyMo แล้วอัปโหลดสลิป</p>
                
                <form action="/create-topup" method="POST" style="text-align: left;">
                    <input type="hidden" name="username" value="${username}">
                    <label style="font-size: 13px;">จำนวนเงินที่ต้องการเติม (บาท):</label>
                    <input type="number" name="amount" placeholder="เช่น 50" required>
                    <button type="submit" class="topup-btn">สร้าง QR Code สแกนจ่าย</button>
                </form>

                <div style="text-align:left; margin-top:15px; background:rgba(0,0,0,0.3); padding:10px; border-radius:5px;">
                    <b style="font-size:13px; color:#ffd700;">📌 สถานะการเติมเงิน:</b>
                    <ul style="padding-left:15px; margin:5px 0;">${pendingHtml}</ul>
                </div>

                <a href="/">ออกจากระบบ</a>
            </div>

            <script>
                let userPoints = ${currentPoints};
                let userSpent = ${totalSpent};
                
                function playSound(type) {
                    try {
                        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                        let notes = type === 'jackpot' ? [523.25, 659.25, 783.99, 1046.50] : [300, 150];
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
                    } catch(e) {}
                }

                function openBox() {
                    if (userPoints < 1) {
                        alert("แต้มของคุณไม่พอใช้งาน! กรุณาเติมเงินก่อนครับ");
                        return;
                    }
                    userPoints -= 1;
                    userSpent += 1;
                    document.getElementById("points").innerText = userPoints;
                    document.getElementById("spent").innerText = userSpent;
                    
                    const resBox = document.getElementById("result-box");
                    resBox.className = "";
                    resBox.innerText = "🌀 กำลังเปิดกล่องลุ้นระทึก...";

                    setTimeout(() => {
                        let reward = "";
                        let rewardNum = 0;
                        let isGuarantee = false;

                        if (userSpent === 1000) {
                            reward = "1,000 Robux (🛡️ การันตีสะสมครบ 1,000 บาท!)";
                            rewardNum = 1000;
                            isGuarantee = true;
                        } else if (userSpent === 500) {
                            reward = "500 Robux (🛡️ การันตีสะสมครบ 500 บาท!)";
                            rewardNum = 500;
                            isGuarantee = true;
                        } else if (userSpent === 300) {
                            reward = "300 Robux (🛡️ การันตีสะสมครบ 300 บาท!)";
                            rewardNum = 300;
                            isGuarantee = true;
                        } else if (userSpent === 100) {
                            reward = "100 Robux (🛡️ การันตีสะสมครบ 100 บาท!)";
                            rewardNum = 100;
                            isGuarantee = true;
                        } else {
                            const rand = Math.random() * 100;
                            if (rand < 0.0005) { reward = "1,000 Robux (👑 แจ็คพอตในตำนาน!)"; rewardNum = 1000; }
                            else if (rand < 0.002) { reward = "500 Robux (💎 แจ็คพอตใหญ่มาก!)"; rewardNum = 500; }
                            else if (rand < 0.01) { reward = "100 Robux (🔥 แจ็คพอตแตก!)"; rewardNum = 100; }
                            else if (rand < 0.05) { reward = "20 Robux"; rewardNum = 20; }
                            else if (rand < 0.15) { reward = "15 Robux"; rewardNum = 15; }
                            else if (rand < 0.5) { reward = "10 Robux"; rewardNum = 10; }
                            else if (rand < 1.5) { reward = "5 Robux"; rewardNum = 5; }
                            else if (rand < 4.0) { reward = "4 Robux"; rewardNum = 4; }
                            else if (rand < 10.0) { reward = "3 Robux"; rewardNum = 3; }
                            else if (rand < 25.0) { reward = "2 Robux"; rewardNum = 2; }
                            else if (rand < 50.0) { reward = "1 Robux"; rewardNum = 1; }
                            else { reward = "0 Robux (😢 เกลือสนั่น)"; rewardNum = 0; }
                        }

                        let noticeText = "<br><span style='font-size:12px; color:#00d2d3; font-weight:normal;'>⏳ แจ้งเตือน: บันทึกข้อมูลเรียบร้อย กรุณารอแอดมินตรวจสอบและจัดส่ง Robux ภายใน 1-24 ชั่วโมงครับ</span>";

                        if (isGuarantee || reward.includes("แจ็คพอต") || reward.includes("100 Robux") || reward.includes("500 Robux") || reward.includes("1,000 Robux")) {
                            playSound('jackpot');
                            resBox.className = "epic-glow";
                            resBox.innerHTML = "🎉 <span style='color:#ffd700; font-size:18px;'>ยอดเยี่ยม! คุณได้รับรางวัลใหญ่/การันตี!</span><br>ได้รับ: <b>" + reward + "</b>" + noticeText;
                        } else {
                            playSound('normal');
                            resBox.style.color = "#ff4757";
                            resBox.innerHTML = "💀 ผลลัพธ์: ได้รับ <b>" + reward + "</b>" + noticeText;
                        }

                        fetch('/save-history', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ username: '${username}', reward: reward, reward_num: rewardNum })
                        });
                    }, 600);
                }
            </script>
        </body>
        </html>
      `);
    });
  });
});

app.post("/create-topup", (req, res) => {
  const { username, amount } = req.body;
  const randomDecimal = (Math.floor(Math.random() * 99) + 1) / 100;
  const exactAmount = parseFloat(amount) + randomDecimal;
  const qrCodeUrl = `https://promptpay.io/${MY_PROMPTPAY_NUMBER}/${exactAmount.toFixed(2)}.png`;

  res.send(`
    <!DOCTYPE html><html lang="th"><head><meta charset="UTF-8"><title>สแกนและแนบสลิป</title>
    <style>
        body { font-family: Arial; background: #1e1e2f; color: #fff; text-align: center; padding-top: 30px; }
        .box { background: #2b2b40; padding: 25px; display: inline-block; border-radius: 10px; width: 380px; text-align: left; }
    </style></head>
    <body><div class="box">
        <h2 style="color:#2ed573; text-align:center;">📱 สแกนจ่ายด้วย MyMo</h2>
        <p style="font-size:13px; color:#aaa; text-align:center;">ชื่อบัญชี: <b>${MY_ACCOUNT_NAME}</b></p>
        
        <div style="background:#fff; padding:10px; text-align:center; border-radius:8px; margin:10px 0;">
            <img src="${qrCodeUrl}" style="width:180px; height:180px;">
        </div>
        
        <h2 style="color:#ffd700; text-align:center; margin:5px 0;">${exactAmount.toFixed(2)} บาท</h2>
        <p style="font-size:12px; color:#ff4757; text-align:center;">⚠️ โอนให้ตรงกับเศษสตางค์เป๊ะๆ</p>
        
        <hr style="border:0; border-top:1px solid #444; margin:15px 0;">

        <form action="/upload-slip" method="POST" enctype="multipart/form-data">
            <input type="hidden" name="username" value="${username}">
            <input type="hidden" name="exact_amount" value="${exactAmount.toFixed(2)}">
            
            <label style="font-size:13px; display:block; margin-bottom:5px;">📤 อัปโหลดสลิปโอนเงิน:</label>
            <input type="file" name="slip_img" accept="image/*" required style="background:#fff; color:#000; padding:5px; width:100%; box-sizing:border-box; border-radius:4px;">
            
            <button type="submit" style="width:100%; background:#2ed573; color:#fff; padding:10px; border:none; border-radius:5px; font-weight:bold; cursor:pointer; margin-top:15px;">ส่งสลิปให้แอดมินตรวจสอบ</button>
        </form>

        <a href="/lootbox?username=${username}" style="display:block; text-align:center; margin-top:15px; color:#70a1ff; text-decoration:none; font-size:13px;">กลับหน้าสุ่มกล่อง</a>
    </div></body></html>
  `);
});

app.post("/upload-slip", upload.single('slip_img'), (req, res) => {
  const { username, exact_amount } = req.body;
  const slipImg = req.file ? `/uploads/${req.file.filename}` : "";

  db.run(`INSERT INTO pending_topup (username, exact_amount, slip_img, status) VALUES (?, ?, ?, 'pending')`, [username, exact_amount, slipImg], (err) => {
    if (err) {
      return res.send(`<script>alert("เกิดข้อผิดพลาด กรุณาลองใหม่"); window.location.href="/lootbox?username=${username}";</script>`);
    }
    res.send(`<script>alert("ส่งสลิปสำเร็จ! กรุณารอแอดมินตรวจสอบและเติมแต้มให้ภายในไม่กี่นาที"); window.location.href="/lootbox?username=${username}";</script>`);
  });
});

app.post("/save-history", (req, res) => {
  const { username, reward, reward_num } = req.body;
  db.get(`SELECT roblox_img FROM users WHERE username = ?`, [username], (err, row) => {
    if (row) {
      db.run(`UPDATE users SET points = points - 1, total_spent = total_spent + 1 WHERE username = ?`, [username], () => {
        db.run(`INSERT INTO history (username, roblox_img, reward, reward_num) VALUES (?, ?, ?, ?)`, [username, row.roblox_img, reward, reward_num || 0]);
      });
    }
  });
  res.sendStatus(200);
});

app.get("/admin", (req, res) => {
  if (req.session.isAdmin) {
    return renderAdminDashboard(res);
  }

  res.send(`
    <body style="background:#1e1e2f; color:#fff; text-align:center; padding-top:80px; font-family:Arial;">
      <div style="background:#2b2b40; padding:30px; display:inline-block; border-radius:10px; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
        <h2>🛠️ เข้าสู่ระบบผู้ดูแลระบบ</h2>
        <form action="/admin/login" method="POST">
          <input type="password" name="password" placeholder="รหัสผ่านแอดมิน" style="padding:10px; width:240px; border-radius:4px; border:none; box-sizing:border-box;" required>
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
    res.send(`<script>alert("รหัสผ่านไม่ถูกต้อง!"); window.location.href="/admin";</script>`);
  }
});

app.get("/admin/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/admin");
  });
});

app.post("/admin/approve-topup", (req, res) => {
  if (!req.session.isAdmin) return res.redirect("/admin");
  const { topup_id, username, exact_amount } = req.body;
  const pointsToAdd = Math.floor(parseFloat(exact_amount));

  db.run(`UPDATE users SET points = points + ? WHERE username = ?`, [pointsToAdd, username], () => {
    db.run(`UPDATE pending_topup SET status = 'completed' WHERE id = ?`, [topup_id], () => {
      res.send(`<script>alert("อนุมัติยอดเงินและเพิ่ม ${pointsToAdd} แต้มให้ ${username} เรียบร้อย!"); window.location.href="/admin";</script>`);
    });
  });
});

app.post("/admin/update-points", (req, res) => {
  if (!req.session.isAdmin) return res.redirect("/admin");
  const { username, points, action } = req.body;
  const numPoints = parseInt(points) || 0;

  let sql = action === "add" ? 
    `UPDATE users SET points = points + ? WHERE username = ?` : 
    `UPDATE users SET points = MAX(0, points - ?) WHERE username = ?`;

  db.run(sql, [numPoints, username], () => {
    res.send(`<script>alert("อัปเดตแต้มสำเร็จ!"); window.location.href="/admin";</script>`);
  });
});

// หน้าต่างดูประวัติย่อยเฉพาะยูสเซอร์นั้นๆ แบบละเอียด
app.get("/admin/user-detail", (req, res) => {
  if (!req.session.isAdmin) return res.redirect("/admin");
  const username = req.query.username;

  db.all(`SELECT * FROM history WHERE username = ? ORDER BY id DESC`, [username], (err, rows) => {
    let historyList = "";
    if (rows && rows.length > 0) {
      rows.forEach(r => {
        historyList += `<tr><td>${r.id}</td><td style="color:#ffd700;"><b>${r.reward}</b></td><td>${r.time}</td></tr>`;
      });
    } else {
      historyList = `<tr><td colspan="3" style="padding:15px; color:#aaa;">ไม่มีประวัติการสุ่ม</td></tr>`;
    }

    res.send(`
      <body style="background:#1e1e2f; color:#fff; text-align:center; padding-top:40px; font-family:Arial;">
        <div style="background:#2b2b40; padding:30px; display:inline-block; border-radius:10px; width:600px;">
          <h2 style="color:#ffd700;">📦 ประวัติการสุ่มของ: ${username}</h2>
          <table border="1" style="width:100%; border-collapse:collapse; background:#1e1e2f; border-color:#444; margin-bottom:20px;">
            <tr><th style="padding:8px;">ID</th><th style="padding:8px;">รางวัลที่ได้</th><th style="padding:8px;">เวลา</th></tr>
            ${historyList}
          </table>
          <a href="/admin" style="background:#70a1ff; color:#fff; padding:10px 20px; border-radius:5px; text-decoration:none; font-weight:bold; display:inline-block;">⬅️ กลับหน้าแอดมินหลัก</a>
        </div>
      </body>
    `);
  });
});

app.post("/admin/clear-user-history", (req, res) => {
  if (!req.session.isAdmin) return res.redirect("/admin");
  const { username } = req.body;
  db.run(`DELETE FROM history WHERE username = ?`, [username], () => {
    res.send(`<script>alert("ล้างประวัติการสุ่มของ ${username} เรียบร้อย!"); window.location.href="/admin";</script>`);
  });
});

function renderAdminDashboard(res) {
  db.all(`SELECT * FROM users`, [], (err, usersRows) => {
    db.all(`SELECT * FROM pending_topup WHERE status = 'pending' ORDER BY id DESC`, [], (err, pendingRows) => {
      // สรุปยอดรวม: นับจำนวนครั้ง และ บวกผลรวม Robux ทั้งหมด (SUM) ออกมาให้เลย
      db.all(`SELECT username, roblox_img, COUNT(id) as total_opens, SUM(reward_num) as total_robux FROM history GROUP BY username`, [], (err, summaryRows) => {
        
        let pendingSlipHtml = "";
        if (pendingRows && pendingRows.length > 0) {
          pendingRows.forEach(p => {
            pendingSlipHtml += `<tr>
              <td>${p.id}</td>
              <td><b>${p.username}</b></td>
              <td style="color:#ffd700;"><b>${p.exact_amount} บาท</b></td>
              <td><a href="${p.slip_img}" target="_blank"><img src="${p.slip_img}" style="width:60px; height:80px; object-fit:cover; border:1px solid #fff;"></a></td>
              <td>${p.time}</td>
              <td>
                <form action="/admin/approve-topup" method="POST" style="margin:0;">
                  <input type="hidden" name="topup_id" value="${p.id}">
                  <input type="hidden" name="username" value="${p.username}">
                  <input type="hidden" name="exact_amount" value="${p.exact_amount}">
                  <button type="submit" style="background:#2ed573; color:#fff; border:none; padding:6px 12px; border-radius:4px; font-weight:bold; cursor:pointer;">✅ อนุมัติแต้ม</button>
                </form>
              </td>
            </tr>`;
          });
        } else {
          pendingSlipHtml = `<tr><td colspan="6" style="padding:15px; color:#aaa;">ไม่มีรายการสลิปรอตรวจสอบ</td></tr>`;
        }

        let userHtml = "";
        if (usersRows) {
          usersRows.forEach(u => {
            userHtml += `<tr>
              <td>${u.id}</td>
              <td><b>${u.username}</b></td>
              <td><img src="${u.roblox_img}" style="width:40px; height:40px; border-radius:50%; object-fit:cover;"></td>
              <td>${u.points} แต้ม</td>
              <td>${u.total_spent || 0} บาท</td>
              <td>
                <form action="/admin/update-points" method="POST" style="display:inline-flex; gap:5px; align-items:center; margin:0;">
                  <input type="hidden" name="username" value="${u.username}">
                  <input type="number" name="points" value="1" min="1" style="width:50px; padding:4px; text-align:center; border-radius:4px; border:none;">
                  <button type="submit" name="action" value="add" style="background:#2ed573; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-weight:bold;" title="เพิ่มแต้ม">➕</button>
                  <button type="submit" name="action" value="subtract" style="background:#ff4757; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-weight:bold;" title="ลดแต้ม">➖</button>
                </form>
              </td>
            </tr>`;
          });
        }

        let summaryHtml = "";
        if (summaryRows && summaryRows.length > 0) {
          summaryRows.forEach(s => {
            summaryHtml += `<tr>
              <td><b>${s.username}</b></td>
              <td><img src="${s.roblox_img}" style="width:45px; height:45px; border-radius:50%; object-fit:cover; border:2px solid #ffd700;"></td>
              <td style="color:#00d2d3; font-weight:bold;">สุ่มไป ${s.total_opens} ครั้ง</td>
              <td style="color:#2ed573; font-size:16px; font-weight:bold;">รวมได้ ${s.total_robux || 0} Robux</td>
              <td>
                <a href="/admin/user-detail?username=${s.username}" style="background:#00d2d3; color:#000; padding:6px 12px; border-radius:4px; text-decoration:none; font-weight:bold; display:inline-block; margin-bottom:5px;">🔍 ดูประวัติย่อย</a>
                <form action="/admin/clear-user-history" method="POST" onsubmit="return confirm('เคลียร์ประวัติของ ${s.username} แล้วใช่ไหม? (กดยืนยันเมื่อแจกของให้ผู้เล่นคนนี้เรียบร้อยแล้ว)');" style="margin:0;">
                  <input type="hidden" name="username" value="${s.username}">
                  <button type="submit" style="background:#ff4757; color:#fff; border:none; padding:6px 12px; border-radius:4px; font-weight:bold; cursor:pointer;">🎁 เคลียร์รายการ (แจกแล้ว)</button>
                </form>
              </td>
            </tr>`;
          });
        } else {
          summaryHtml = `<tr><td colspan="5" style="padding:15px; color:#aaa;">ยังไม่มีประวัติการเปิดกล่องจากผู้เล่นคนไหนเลย</td></tr>`;
        }

        res.send(`
          <body style="background:#1e1e2f; color:#fff; text-align:center; padding-top:30px; font-family:Arial;">
            <h2>🛠️ ระบบจัดการหลังบ้าน (แอดมิน)</h2>
            <div style="margin-bottom: 20px;">
                <a href="/admin/logout" style="color:#ff4757; font-weight:bold; text-decoration:none; margin-right:15px;">🔒 ออกจากระบบ</a>
                <a href="/" style="color:#70a1ff; text-decoration:none;">🏠 กลับหน้าแรก</a>
            </div>

            <h3 style="color:#ffd700;">📥 รายการสลิปรอตรวจสอบการเติมเงิน</h3>
            <table border="1" style="margin: 0 auto 30px auto; border-collapse: collapse; width: 750px; background:#2b2b40; border-color:#444;">
              <tr><th style="padding:8px;">ID</th><th style="padding:8px;">Username</th><th style="padding:8px;">ยอดเงิน</th><th style="padding:8px;">รูปสลิป (คลิกดูภาพใหญ่)</th><th style="padding:8px;">เวลา</th><th style="padding:8px;">จัดการ</th></tr>
              ${pendingSlipHtml}
            </table>

            <h3 style="color:#ffd700;">🎁 สรุปยอดรวมรางวัล Robux แยกตามรายชื่อผู้ใช้</h3>
            <table border="1" style="margin: 0 auto 30px auto; border-collapse: collapse; width: 850px; background:#2b2b40; border-color:#444;">
              <tr><th style="padding:8px;">Username</th><th style="padding:8px;">รูป Roblox</th><th style="padding:8px;">จำนวนครั้งที่สุ่ม</th><th style="padding:8px;">ยอดรวม Robux ที่ต้องแจก</th><th style="padding:8px;">จัดการ / ดูรายละเอียด</th></tr>
              ${summaryHtml}
            </table>

            <h3 style="color:#ffd700; margin-top:40px;">👥 รายชื่อสมาชิกทั้งหมด (จัดการแต้มด่วนหลังชื่อ)</h3>
            <table border="1" style="margin: 0 auto 50px auto; border-collapse: collapse; width: 800px; background:#2b2b40; border-color:#444;">
              <tr><th style="padding:8px;">ID</th><th style="padding:8px;">Username</th><th style="padding:8px;">รูป Roblox</th><th style="padding:8px;">แต้มคงเหลือ</th><th style="padding:8px;">ยอดใช้จ่ายสะสม</th><th style="padding:8px;">จัดการแต้ม (+/-)</th></tr>
              ${userHtml}
            </table>
          </body>
        `);
      });
    });
  });
}

app.listen(PORT, () => {
  console.log("Server running smoothly at port " + PORT);
});