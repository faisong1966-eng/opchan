require('dotenv').config();

const express = require("express");
const session = require("express-session");
const multer = require("multer");
const path = require("path");
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD; 
const MY_PROMPTPAY_NUMBER = "0643399170";
const MY_ACCOUNT_NAME = "นาย ธีรวัฒน์ คำมุงคุณ";

const MY_TRUEMONEY_NUMBER = "0643399170";
const MY_TRUEMONEY_NAME = "ธีรวัฒน์ คำมุงคุณ";

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

async function uploadToSupabaseStorage(file) {
    if (!file) return "";
    const fileExt = path.extname(file.originalname);
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}${fileExt}`;
    const filePath = `public/${fileName}`;

    const { data, error } = await supabase.storage
        .from('uploads')
        .upload(filePath, file.buffer, {
            contentType: file.mimetype,
            upsert: false
        });

    if (error) {
        console.error("Supabase Storage Error:", error);
        return "";
    }

    const { data: publicUrlData } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
}

app.use(session({
    secret: process.env.SESSION_SECRET || 'linerangers_lootbox_secret_2026',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 600000 }
}));

// ตรวจสอบอายุใช้งานบัญชี 30 วัน
async function checkUserExpiration(username) {
    try {
        const { data: user } = await supabase
            .from('users')
            .select('created_at, username')
            .eq('username', username)
            .single();

        if (user && user.created_at) {
            const createdTime = new Date(user.created_at).getTime();
            const now = new Date().getTime();
            const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

            if (now - createdTime > thirtyDaysMs) {
                await supabase.from('users').delete().eq('username', username);
                await supabase.from('history').delete().eq('username', username);
                await supabase.from('pending_topup').delete().eq('username', username);
                await supabase.from('pending_withdraw').delete().eq('username', username);
                return true; 
            }
        }
    } catch (e) {}
    return false; 
}

// ------------------- FRONTEND ROUTES -------------------

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="th">
    <head>
        <meta charset="UTF-8">
        <title>🛡️ Line Rangers LootBox - สุ่มไอดีเกมสุดอลังการ</title>
        <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;600;800&display=swap" rel="stylesheet">
        <style>
            body { background: linear-gradient(135deg, #0d1117, #161b22); color: #ffffff; text-align: center; padding-top: 80px; font-family: 'Kanit', sans-serif; }
            .container { background: #21262d; padding: 35px; border-radius: 16px; display: inline-block; box-shadow: 0 8px 24px rgba(0,0,0,0.5); width: 360px; border: 1px solid #30363d; }
            h1 { color: #2ea043; font-size: 26px; text-shadow: 0 0 10px rgba(46,160,67,0.4); margin-bottom: 5px; }
            p { color: #8b949e; font-size: 14px; }
            a { display: block; background: #238636; color: white; padding: 12px; margin: 12px 0; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; transition: 0.2s; }
            a:hover { background: #2ea043; transform: translateY(-2px); }
            a.reg-btn { background: #1f6beb; }
            a.reg-btn:hover { background: #388bfd; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🛡️ LINE RANGERS BOX</h1>
            <p>เว็บสุ่มไอดี Line Rangers ระดับเทพ ลุ้นไอดี SSR!</p>
            <a href="/login">🔑 เข้าสู่ระบบ</a>
            <a href="/register" class="reg-btn">📝 สมัครสมาชิก</a>
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
        <title>สมัครสมาชิก - Line Rangers LootBox</title>
        <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;600&display=swap" rel="stylesheet">
        <style>
            body { background-color: #0d1117; color: #ffffff; text-align: center; padding-top: 30px; font-family: 'Kanit', sans-serif; }
            .container { background: #21262d; padding: 30px; border-radius: 12px; display: inline-block; width: 360px; text-align: left; border: 1px solid #30363d; }
            h2 { color: #2ea043; text-align: center; margin-top: 0; }
            label { display: block; margin-top: 12px; font-size: 14px; color: #c9d1d9; }
            input { width: 100%; padding: 10px; margin-top: 5px; border-radius: 6px; border: 1px solid #30363d; background: #0d1117; color: #fff; box-sizing: border-box; font-family: 'Kanit'; }
            button { width: 100%; background-color: #238636; color: white; padding: 12px; border: none; border-radius: 6px; margin-top: 20px; font-weight: bold; cursor: pointer; font-size: 15px; font-family: 'Kanit'; }
            button:hover { background-color: #2ea043; }
            a { display: block; text-align: center; margin-top: 15px; color: #58a6ff; text-decoration: none; font-size: 13px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>📝 สมัครสมาชิก</h2>
            <p style="font-size:12px; color:#d29922; text-align:center;">⚠️ บัญชีมีอายุใช้งาน 30 วันนับจากวันที่สมัคร</p>
            <form action="/register" method="POST">
                <label>Username (สำหรับเข้าเว็บ):</label>
                <input type="text" name="username" placeholder="ตั้งชื่อผู้ใช้งาน" required>
                
                <label>Password:</label>
                <input type="password" name="password" placeholder="ตั้งรหัสผ่าน" required>
                
                <label>ลิงก์ Facebook ส่วนตัวของคุณ:</label>
                <input type="url" name="facebook_url" placeholder="https://www.facebook.com/your.profile" required>
                <span style="font-size:11px; color:#8b949e; display:block; margin-top:4px;">*แนบลิงก์เฟซบุ๊กเพื่อรับรางวัลเมื่อสุ่มได้ไอดีเทพ</span>

                <button type="submit">ยืนยันการสมัครสมาชิก</button>
            </form>
            <a href="/">กลับหน้าแรก</a>
        </div>
    </body>
    </html>
  `);
});

app.post("/register", async (req, res) => {
  const { username, password, facebook_url } = req.body;

  try {
    const { error } = await supabase
      .from('users')
      .insert([{ 
          username, 
          password, 
          roblox_img: facebook_url, // ใช้ฟีลด์ roblox_img ในการเก็บ facebook_url เพื่อไม่ต้องเปลี่ยนโครงสร้าง DB
          points: 0, 
          total_spent: 0, 
          step1_salt: 0, step1_reward: 'normal',
          step2_salt: 0, step2_reward: 'normal',
          step3_salt: 0, step3_reward: 'normal',
          step4_salt: 0, step4_reward: 'normal',
          step5_salt: 0, step5_reward: 'normal'
      }]);

    if (error) {
      return res.send(`<script>alert("ชื่อผู้ใช้นี้ซ้ำในระบบแล้ว หรือเกิดข้อผิดพลาด!"); window.location.href="/register";</script>`);
    }
    res.send(`<script>alert("สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ"); window.location.href="/login";</script>`);
  } catch (err) {
    res.send(`<script>alert("เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล"); window.location.href="/register";</script>`);
  }
});

app.get("/login", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="th">
    <head>
        <meta charset="UTF-8">
        <title>เข้าสู่ระบบ - Line Rangers LootBox</title>
        <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;600&display=swap" rel="stylesheet">
        <style>
            body { background-color: #0d1117; color: #ffffff; text-align: center; padding-top: 50px; font-family: 'Kanit', sans-serif; }
            .container { background: #21262d; padding: 30px; border-radius: 12px; display: inline-block; width: 350px; text-align: left; border: 1px solid #30363d; }
            h2 { color: #d29922; text-align: center; margin-top: 0; }
            label { display: block; margin-top: 10px; font-size: 14px; }
            input { width: 100%; padding: 10px; margin-top: 5px; border-radius: 6px; border: 1px solid #30363d; background: #0d1117; color: #fff; box-sizing: border-box; font-family: 'Kanit'; }
            button { width: 100%; background-color: #238636; color: white; padding: 12px; border: none; border-radius: 6px; margin-top: 20px; font-weight: bold; cursor: pointer; font-size: 15px; font-family: 'Kanit'; }
            button:hover { background-color: #2ea043; }
            a { display: block; text-align: center; margin-top: 15px; color: #58a6ff; text-decoration: none; font-size: 13px; }
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

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  
  const isExpired = await checkUserExpiration(username);
  if (isExpired) {
      return res.send(`<script>alert("บัญชีของคุณหมดอายุการใช้งาน 30 วันแล้ว!"); window.location.href="/login";</script>`);
  }

  try {
    const { data: row } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();

    if (row) {
      res.redirect(`/lootbox?username=${row.username}`);
    } else {
      res.send(`<script>alert("รหัสผ่านหรือชื่อผู้ใช้ไม่ถูกต้อง!"); window.location.href="/login";</script>`);
    }
  } catch (err) {
    res.send(`<script>alert("รหัสผ่านหรือชื่อผู้ใช้ไม่ถูกต้อง!"); window.location.href="/login";</script>`);
  }
});

// API Realtime สถานะยูสเซอร์
app.get("/api/user-status", async (req, res) => {
  const username = req.query.username;
  if (!username) return res.json({ success: false });

  try {
    const { data: user } = await supabase
      .from('users')
      .select('points, total_spent')
      .eq('username', username)
      .single();

    const { data: pendingRows } = await supabase
      .from('pending_topup')
      .select('*')
      .eq('username', username)
      .eq('status', 'pending');

    res.json({
      success: true,
      points: user ? user.points : 0,
      total_spent: user ? user.total_spent : 0,
      pendingRows: pendingRows || []
    });
  } catch (e) {
    res.json({ success: false });
  }
});

// ------------------- MAIN LOOTBOX PAGE -------------------

app.get("/lootbox", async (req, res) => {
  const username = req.query.username;
  const countParam = parseInt(req.query.count) || 1;
  if (!username) return res.redirect("/login");

  const isExpired = await checkUserExpiration(username);
  if (isExpired) {
      return res.send(`<script>alert("บัญชีของคุณหมดอายุใช้งาน 30 วันแล้ว!"); window.location.href="/login";</script>`);
  }

  try {
    const { data: row } = await supabase.from('users').select('*').eq('username', username).single();
    if (!row) return res.redirect("/login");

    const currentPoints = row.points;
    const totalSpent = row.total_spent || 0;
    const createdAt = row.created_at;

    // ดึงคลังไอดีเกมที่แอดมินตั้งไว้มาโชว์ที่หน้าบ้าน
    const { data: gameAccounts } = await supabase.from('game_accounts').select('*').eq('status', 'available');

    const { data: pendingRows } = await supabase
      .from('pending_topup')
      .select('*')
      .eq('username', username)
      .eq('status', 'pending');

    let pendingHtml = "";
    if (pendingRows && pendingRows.length > 0) {
      pendingRows.forEach(p => {
        pendingHtml += `<li style="color:#f1e05a;">ยอดโอน <b>${p.exact_amount} บาท</b> (รอแอดมินตรวจสอบสลิป)</li>`;
      });
    } else {
      pendingHtml = `<span style="color:#8b949e; font-size:12px;">ไม่มีรายการรอดำเนินการ</span>`;
    }

    // สรรค์สร้างการ์ดโชว์ไอดี (Showcase Grid)
    let showcaseCardsHtml = "";
    if (gameAccounts && gameAccounts.length > 0) {
      gameAccounts.forEach(acc => {
        let badgeColor = "#2ea043";
        if (acc.rarity === "SSR" || acc.rarity === "เทพมังกร") badgeColor = "#d29922";
        else if (acc.rarity === "SS+") badgeColor = "#a371f7";
        else if (acc.rarity === "S") badgeColor = "#58a6ff";

        showcaseCardsHtml += `
          <div class="reward-card" style="border-color:${badgeColor}">
              <div style="font-size:20px;">🛡️</div>
              <div class="r-name" style="color:${badgeColor}">${acc.title}</div>
              <div style="font-size:10px; color:#8b949e;">ระดับ: ${acc.rarity}</div>
          </div>
        `;
      });
    } else {
      showcaseCardsHtml = `
        <div class="reward-card" style="grid-column: span 4;">
            <div style="font-size:18px; color:#8b949e;">📦 เกลือ 0 Point</div>
        </div>
        <div class="reward-card legendary" style="grid-column: span 4;">
            <div style="font-size:22px;">🐉</div>
            <div class="r-name" style="color:#d29922;">ไอดี Line Rangers ระดับ SSR / เทพมังกร</div>
        </div>
      `;
    }

    res.send(`
      <!DOCTYPE html>
      <html lang="th">
      <head>
          <meta charset="UTF-8">
          <title>สุ่มกล่องไอดี Line Rangers</title>
          <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;600;800&display=swap" rel="stylesheet">
          <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>
          <style>
              body { background-color: #0d1117; color: #ffffff; text-align: center; margin: 0; padding: 15px 0; font-family: 'Kanit', sans-serif; }
              .main-wrapper { max-width: 480px; margin: 0 auto; background: #161b22; border-radius: 16px; border: 1px solid #30363d; box-shadow: 0 10px 30px rgba(0,0,0,0.8); overflow: hidden; padding: 20px; box-sizing: border-box; }
              
              .banner-header h2 { color: #2ea043; font-size: 22px; margin: 5px 0 0 0; text-shadow: 0 0 10px rgba(46,160,67,0.4); }
              .banner-header p { color: #58a6ff; font-size: 13px; margin: 3px 0 0 0; font-weight: bold; }

              .user-bar { background: #21262d; border: 1px solid #30363d; border-radius: 10px; padding: 10px 15px; display: flex; justify-content: space-between; align-items: center; margin: 12px 0; }
              .btn-history { background: #58a6ff; color: #000; padding: 5px 10px; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: bold; }

              .wallet-box { background: #21262d; border: 1px solid #30363d; border-radius: 10px; padding: 10px; display: flex; justify-content: space-around; font-size: 15px; margin-bottom: 12px; font-weight: bold; color: #d29922; }
              
              #countdown-box { background: rgba(210,153,34,0.1); border: 1px dashed #d29922; padding: 6px; border-radius: 6px; margin-bottom: 12px; font-size: 12px; color: #d29922; font-weight: bold; }

              .showcase-container { background: #0d1117; border: 1px solid #30363d; border-radius: 12px; padding: 10px; margin-bottom: 15px; }
              .showcase-title { font-size: 13px; color: #8b949e; text-align: left; margin-bottom: 8px; font-weight: bold; }
              .rewards-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
              .reward-card { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 8px 4px; text-align: center; }
              .reward-card .r-name { font-size: 11px; color: #fff; font-weight: bold; }

              .select-group { display: grid; grid-template-columns: repeat(6, 1fr); gap: 4px; margin-bottom: 12px; }
              .select-group button { background: #21262d; color: #fff; border: 1px solid #30363d; padding: 6px 0; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 11px; font-family:'Kanit'; }
              .select-group button.active { background: #238636; color: #fff; border-color: #2ea043; box-shadow: 0 0 8px rgba(46,160,67,0.5); }

              .box-btn { background: linear-gradient(135deg, #238636, #2ea043); color: white; padding: 14px; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; font-weight: bold; width: 100%; box-shadow: 0 4px 15px rgba(35,134,54,0.4); margin-bottom: 10px; font-family:'Kanit'; }
              .box-btn:hover { filter: brightness(1.1); }
              .box-btn:disabled { background: #484f58 !important; cursor: not-allowed; box-shadow: none; }

              #result-box { margin-top: 10px; padding: 12px; border-radius: 8px; font-size: 13px; font-weight: bold; background: #0d1117; border: 1px solid #30363d; min-height: 40px; text-align: left; max-height: 180px; overflow-y: auto; }

              .topup-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px; }
              .topup-card { background: #21262d; border: 1px solid #30363d; border-radius: 10px; padding: 10px; text-align: left; }
              input[type="number"] { width: 100%; padding: 8px; background: #0d1117; border: 1px solid #30363d; color: #fff; border-radius: 4px; box-sizing: border-box; font-size: 12px; margin-bottom: 6px; font-family:'Kanit'; }
              .topup-sub-btn { width: 100%; padding: 8px; border: none; border-radius: 4px; font-weight: bold; font-size: 12px; cursor: pointer; font-family:'Kanit'; }
              
              /* Modal Winner Effect */
              .modal { display: none; position: fixed; z-index: 999; left: 0; top: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); backdrop-filter: blur(5px); }
              .modal-content { background: linear-gradient(135deg, #161b22, #21262d); border: 2px solid #d29922; margin: 15% auto; padding: 25px; border-radius: 16px; width: 80%; max-width: 360px; text-align: center; box-shadow: 0 0 30px rgba(210,153,34,0.6); animation: popup 0.4s ease-out; }
              @keyframes popup { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
          </style>
      </head>
      <body>
          <div class="main-wrapper">
              
              <div class="banner-header">
                  <h2>🛡️ LINE RANGERS BOX</h2>
                  <p>✨ สุ่มไอดีเกมสุดเทพ ลุ้นไอดี SSR และรางวัลใหญ่! ✨</p>
              </div>

              <div class="user-bar">
                  <div style="text-align: left; font-size: 13px;">
                      <span style="color: #8b949e; display: block; font-size: 10px;">ผู้ใช้งาน</span>
                      <b>${username}</b>
                  </div>
                  <div>
                      <a href="/my-history?username=${username}" class="btn-history">📜 ประวัติสุ่มรางวัล</a>
                  </div>
              </div>

              <div id="countdown-box">⏳ ID นี้ใช้งานได้อีก: กำลังคำนวณเวลา...</div>
              
              <div class="wallet-box">
                  <div>💰 แต้มสะสม: <span id="points">${currentPoints}</span></div>
                  <div>🎯 สุ่มไปแล้ว: <span id="spent">${totalSpent}</span> ฿</div>
              </div>

              <div class="showcase-container">
                  <div class="showcase-title">🏆 คลังไอดี Line Rangers ที่มีในกล่องสุ่ม</div>
                  <div class="rewards-grid">
                      ${showcaseCardsHtml}
                  </div>
              </div>

              <div style="font-size:12px; color:#d29922; text-align:left; margin-bottom:6px; font-weight:bold;">⚙️ เลือกจำนวนครั้งในการสุ่ม:</div>
              <div class="select-group">
                  <button type="button" class="${countParam === 1 ? 'active' : ''}" onclick="setCount(1, this)">1 ครั้ง</button>
                  <button type="button" class="${countParam === 10 ? 'active' : ''}" onclick="setCount(10, this)">10 ครั้ง</button>
                  <button type="button" class="${countParam === 20 ? 'active' : ''}" onclick="setCount(20, this)">20 ครั้ง</button>
                  <button type="button" class="${countParam === 30 ? 'active' : ''}" onclick="setCount(30, this)">30 ครั้ง</button>
                  <button type="button" class="${countParam === 50 ? 'active' : ''}" onclick="setCount(50, this)">50 ครั้ง</button>
                  <button type="button" class="${countParam === 100 ? 'active' : ''}" onclick="setCount(100, this)">100 ครั้ง</button>
              </div>

              <button class="box-btn" id="open-box-btn" onclick="openBox()">📦 เปิดกล่องลุ้นโชค (${countParam} ครั้ง / ใช้ ${countParam} แต้ม)</button>
              
              <div id="result-box">🎁 กดเปิดกล่องเพื่อลุ้นรับไอดีเกม Line Rangers!</div>

              <div style="font-size:15px; color:#d29922; text-align:left; margin:15px 0 5px 0; font-weight:bold; border-left:3px solid #d29922; padding-left:6px;">💳 ช่องทางการเติมเงิน</div>
              
              <div class="topup-grid">
                  <div class="topup-card">
                      <h4 style="color: #2ea043; margin:0 0 8px 0; font-size:12px;">📱 พร้อมเพย์</h4>
                      <form action="/create-topup" method="POST">
                          <input type="hidden" name="username" value="${username}">
                          <input type="hidden" name="topup_type" value="promptpay">
                          <input type="number" name="amount" placeholder="จำนวนเงิน" required>
                          <button type="submit" class="topup-sub-btn" style="background:#2ea043; color:#fff;">สแกน QR</button>
                      </form>
                  </div>

                  <div class="topup-card">
                      <h4 style="color: #f85149; margin:0 0 8px 0; font-size:12px;">🧡 Wallet</h4>
                      <form action="/create-topup" method="POST">
                          <input type="hidden" name="username" value="${username}">
                          <input type="hidden" name="topup_type" value="truemoney">
                          <input type="number" name="amount" placeholder="จำนวนเงิน" required>
                          <button type="submit" class="topup-sub-btn" style="background:#f85149; color:#fff;">แจ้งโอนเงิน</button>
                      </form>
                  </div>
              </div>

              <div style="text-align:left; margin-top:10px; background:#21262d; padding:8px; border-radius:6px; font-size:11px;">
                  <b style="color:#d29922;">📌 สถานะการเติมเงิน:</b>
                  <ul id="pending-list-container" style="padding-left:15px; margin:3px 0;">${pendingHtml}</ul>
              </div>

              <a href="/" style="display:block; margin-top:20px; color:#f85149; text-decoration:none; font-size:12px; font-weight:bold;">ออกจากระบบ</a>
          </div>

          <!-- Popup Effect Modal เมื่อได้ไอดีเทพ -->
          <div id="winModal" class="modal">
              <div class="modal-content">
                  <h2 style="color:#d29922; margin:0 0 10px 0;">🎉 ยินดีด้วย! แจ็คพอตแตก 🎉</h2>
                  <p style="font-size:14px; color:#fff;" id="winModalText"></p>
                  <p style="font-size:11px; color:#8b949e;">แอดมินจะทักแชท Facebook ไปส่งมอบไอดีให้คุณโดยเร็วที่สุด!</p>
                  <button onclick="closeModal()" style="background:#238636; color:#fff; border:none; padding:10px 20px; border-radius:6px; font-weight:bold; cursor:pointer; font-family:'Kanit';">ตกลง</button>
              </div>
          </div>

          <script>
              let userPoints = ${currentPoints};
              let userSpent = ${totalSpent};
              let selectedCount = ${countParam};
              const createdAtTime = new Date("${createdAt}").getTime();
              const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

              function setCount(count, btn) {
                  selectedCount = count;
                  document.querySelectorAll('.select-group button').forEach(b => b.classList.remove('active'));
                  btn.classList.add('active');
                  document.getElementById('open-box-btn').innerText = \`📦 เปิดกล่องลุ้นโชค (\${count} ครั้ง / ใช้ \${count} แต้ม)\`;
              }

              function updateCountdown() {
                  const now = new Date().getTime();
                  const timeLeft = (createdAtTime + thirtyDaysMs) - now;
                  const box = document.getElementById("countdown-box");
                  if (timeLeft <= 0) {
                      box.innerHTML = "❌ บัญชีของคุณหมดอายุการใช้งานแล้ว!";
                      return;
                  }
                  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
                  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                  box.innerHTML = \`⏳ ID นี้ใช้งานได้อีก: \${days} วัน \${hours} ชม. \${minutes} นาที\`;
              }
              setInterval(updateCountdown, 1000);
              updateCountdown();

              function openBox() {
                  if (userPoints < selectedCount) {
                      alert("แต้มของคุณไม่พอใช้งาน! กรุณาเติมเงินก่อนครับ");
                      return;
                  }

                  const openBtn = document.getElementById("open-box-btn");
                  openBtn.disabled = true;

                  const resBox = document.getElementById("result-box");
                  resBox.innerText = \`🌀 กำลังเปิดกล่องลุ้นโชค \${selectedCount} ครั้ง...\`;

                  fetch('/open-lootbox', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ username: '${username}', count: selectedCount })
                  })
                  .then(response => response.json())
                  .then(data => {
                      openBtn.disabled = false; 

                      if (!data.success) {
                          alert(data.message || "เกิดข้อผิดพลาด");
                          return;
                      }

                      userPoints = data.newPoints;
                      userSpent = data.newSpent;
                      document.getElementById("points").innerText = userPoints;
                      document.getElementById("spent").innerText = userSpent;

                      let summaryListHtml = "";
                      let hasWinAccount = false;
                      let winDetails = "";

                      for (const [rew, count] of Object.entries(data.summaryRewards)) {
                          summaryListHtml += \`• \${rew} x \${count} ครั้ง<br>\`;
                          if (!rew.includes("เกลือ")) {
                              hasWinAccount = true;
                              winDetails += rew + " ";
                          }
                      }

                      resBox.innerHTML = \`🎉 <b>สรุปผลสุ่ม \${selectedCount} ครั้ง:</b><br>
                          <div style="font-size:12px; margin-top:5px; background:rgba(0,0,0,0.3); padding:8px; border-radius:5px;">\${summaryListHtml}</div>\`;

                      // หากสุ่มได้ไอดีเทพ ให้จุดพลุ Confetti + แสดง Modal
                      if (hasWinAccount) {
                          confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
                          document.getElementById("winModalText").innerText = "คุณสุ่มได้: " + winDetails;
                          document.getElementById("winModal").style.display = "block";
                      }
                  })
                  .catch(err => {
                      openBtn.disabled = false;
                      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
                  });
              }

              function closeModal() {
                  document.getElementById("winModal").style.display = "none";
              }
          </script>
      </body>
      </html>
    `);
  } catch (err) {
    res.redirect("/login");
  }
});

// ประวัติการสุ่ม
app.get("/my-history", async (req, res) => {
  const username = req.query.username;
  if (!username) return res.redirect("/login");

  const { data: rows } = await supabase
    .from('history')
    .select('*')
    .eq('username', username)
    .order('id', { ascending: false });

  let historyList = "";
  if (rows && rows.length > 0) {
    rows.forEach((r, index) => {
      historyList += `<tr><td style="padding:8px;">${index + 1}</td><td style="padding:8px; color:#d29922;"><b>${r.reward}</b></td><td style="padding:8px;">${r.time || '-'}</td></tr>`;
    });
  } else {
    historyList = `<tr><td colspan="3" style="padding:15px; color:#8b949e;">คุณยังไม่มีประวัติการสุ่ม</td></tr>`;
  }

  res.send(`
    <!DOCTYPE html>
    <html lang="th">
    <head>
        <meta charset="UTF-8">
        <title>ประวัติการสุ่มของฉัน</title>
        <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;600&display=swap" rel="stylesheet">
        <style>
            body { background-color: #0d1117; color: #ffffff; text-align: center; padding-top: 40px; font-family:'Kanit'; }
            .container { background: #161b22; padding: 30px; display: inline-block; border-radius: 12px; width: 480px; border: 1px solid #30363d; }
            table { width: 100%; border-collapse: collapse; background: #0d1117; border-color: #30363d; margin-bottom: 20px; font-size: 14px; }
            th { padding: 10px; background: #21262d; color: #d29922; }
            a { display: inline-block; background: #238636; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <h2 style="color:#d29922;">📜 ประวัติการสุ่ม: ${username}</h2>
            <table border="1">
                <tr><th>ลำดับ</th><th>รางวัลที่ได้</th><th>เวลา</th></tr>
                ${historyList}
            </table>
            <a href="/lootbox?username=${username}">⬅️ กลับหน้าสุ่มกล่อง</a>
        </div>
    </body>
    </html>
  `);
});

// เติมเงินและสลิป (รูปแบบเดิม)
app.post("/create-topup", (req, res) => {
  const { username, amount, topup_type } = req.body;
  const exactAmount = parseFloat(amount).toFixed(2);
  const qrCodeUrl = `https://promptpay.io/${MY_PROMPTPAY_NUMBER}/${exactAmount}.png`;

  res.send(`
    <!DOCTYPE html><html lang="th"><head><meta charset="UTF-8"><title>เติมเงิน</title>
    <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;600&display=swap" rel="stylesheet">
    <style>
        body { background: #0d1117; color: #fff; text-align: center; padding-top: 30px; font-family:'Kanit'; }
        .box { background: #161b22; padding: 25px; display: inline-block; border-radius: 12px; width: 380px; text-align: left; border: 1px solid #30363d; }
    </style></head>
    <body><div class="box">
        <h2 style="color:#2ea043; text-align:center;">💳 ชำระเงิน ${exactAmount} บาท</h2>
        ${topup_type === 'promptpay' ? `<div style="background:#fff; padding:10px; text-align:center; border-radius:8px;"><img src="${qrCodeUrl}" style="width:180px;"></div>` : `<p style="text-align:center;">โอน TrueMoney Wallet เบอร์: <b>${MY_TRUEMONEY_NUMBER}</b> (${MY_TRUEMONEY_NAME})</p>`}
        <form action="/upload-slip" method="POST" enctype="multipart/form-data" style="margin-top:15px;">
            <input type="hidden" name="username" value="${username}">
            <input type="hidden" name="exact_amount" value="${exactAmount}">
            <input type="hidden" name="topup_type" value="${topup_type}">
            <label>📤 อัปโหลดสลิปโอนเงิน:</label>
            <input type="file" name="slip_img" accept="image/*" required style="background:#fff; color:#000; width:100%; box-sizing:border-box; margin-top:5px;">
            <button type="submit" style="width:100%; background:#238636; color:#fff; padding:10px; border:none; border-radius:6px; margin-top:15px; font-weight:bold; cursor:pointer; font-family:'Kanit';">ส่งสลิปให้แอดมินตรวจสอบ</button>
        </form>
        <a href="/lootbox?username=${username}" style="display:block; text-align:center; margin-top:15px; color:#58a6ff; text-decoration:none;">กลับหน้าสุ่ม</a>
    </div></body></html>
  `);
});

app.post("/upload-slip", upload.single('slip_img'), async (req, res) => {
  const { username, exact_amount, topup_type } = req.body;
  try {
    const slipImg = await uploadToSupabaseStorage(req.file);
    await supabase.from('pending_topup').insert([{ 
        username, 
        exact_amount: parseFloat(exact_amount), 
        slip_img: slipImg, 
        status: 'pending',
        topup_type: topup_type || 'promptpay' 
    }]);
    res.send(`<script>alert("ส่งสลิปสำเร็จ! รอแอดมินตรวจสอบ"); window.location.href="/lootbox?username=${username}";</script>`);
  } catch (err) {
    res.send(`<script>alert("เกิดข้อผิดพลาด"); window.location.href="/lootbox?username=${username}";</script>`);
  }
});

// ------------------- ALGORITHM กล่องสุ่ม (ระบบเกลือ 5 สเต็ปเดิม) -------------------

app.post("/open-lootbox", async (req, res) => {
  const { username, count } = req.body;
  const selectedCount = parseInt(count) || 1;

  const { data: user } = await supabase.from('users').select('*').eq('username', username).single();
  if (!user || user.points < selectedCount) return res.json({ success: false, message: "แต้มของคุณไม่พอ!" });

  // ดึงคลังไอดีเกม Line Rangers ทั้งหมดที่มีในระบบ
  const { data: gameAccounts } = await supabase.from('game_accounts').select('*').eq('status', 'available');

  let historyBatch = [];
  let summaryRewards = {};

  let steps = [
    { salt: user.step1_salt || 0, reward: user.step1_reward || 'normal' },
    { salt: user.step2_salt || 0, reward: user.step2_reward || 'normal' },
    { salt: user.step3_salt || 0, reward: user.step3_reward || 'normal' },
    { salt: user.step4_salt || 0, reward: user.step4_reward || 'normal' },
    { salt: user.step5_salt || 0, reward: user.step5_reward || 'normal' }
  ];

  for (let i = 0; i < selectedCount; i++) {
      let reward = "";
      let handled = false;

      // เช็คระบบ 5 สเต็ปของแอดมิน
      for (let s = 0; s < steps.length; s++) {
          if (steps[s].salt > 0) {
              reward = "🧂 เกลือ (0 Point)";
              steps[s].salt -= 1;
              handled = true;
              break;
          } else if (steps[s].salt === 0 && steps[s].reward && steps[s].reward !== 'normal') {
              // ออกรางวัลตาม ID ไอดีเกมที่แอดมินตั้งสเปกไว้ในสเต็ป
              reward = `🛡️ ${steps[s].reward}`;
              steps[s].reward = 'normal';
              handled = true;
              break;
          }
      }

      // สุ่มเรตปกติ หากไม่ได้ติดสเต็ป
      if (!handled) {
          const rand = Math.random() * 100;
          
          if (gameAccounts && gameAccounts.length > 0 && rand < 5.0) { // มีโอกาส 5% หลุดไอดีเกม
              const randomAccount = gameAccounts[Math.floor(Math.random() * gameAccounts.length)];
              reward = `🛡️ [${randomAccount.rarity}] ${randomAccount.title}`;
          } else {
              reward = "🧂 เกลือ (0 Point)";
          }
      }

      summaryRewards[reward] = (summaryRewards[reward] || 0) + 1;

      historyBatch.push({
          username: username,
          roblox_img: user.roblox_img, // ลิงก์ Facebook ยูสเซอร์
          reward: reward,
          reward_num: 0,
          is_withdrawn: false
      });
  }

  const newPoints = user.points - selectedCount;
  const newSpent = (user.total_spent || 0) + selectedCount;

  await supabase.from('users').update({ 
      points: newPoints, 
      total_spent: newSpent,
      step1_salt: steps[0].salt, step1_reward: steps[0].reward,
      step2_salt: steps[1].salt, step2_reward: steps[1].reward,
      step3_salt: steps[2].salt, step3_reward: steps[2].reward,
      step4_salt: steps[3].salt, step4_reward: steps[3].reward,
      step5_salt: steps[4].salt, step5_reward: steps[4].reward
  }).eq('username', username);

  await supabase.from('history').insert(historyBatch);

  return res.json({
      success: true,
      newPoints: newPoints,
      newSpent: newSpent,
      summaryRewards: summaryRewards
  });
});

// ------------------- ADMIN BACKEND (หลังบ้านแอดมิน) -------------------

app.get("/admin", async (req, res) => {
  if (req.session.isAdmin) return renderAdminDashboard(req, res);

  res.send(`
    <body style="background:#0d1117; color:#fff; text-align:center; padding-top:80px; font-family:sans-serif;">
      <div style="background:#161b22; padding:30px; display:inline-block; border-radius:12px; border:1px solid #30363d;">
        <h2>🛠️ เข้าสู่ระบบผู้ดูแลระบบ</h2>
        <form action="/admin/login" method="POST">
          <input type="password" name="password" placeholder="รหัสผ่านแอดมิน" style="padding:10px; width:240px; border-radius:6px; border:1px solid #30363d; background:#0d1117; color:#fff;" required>
          <button type="submit" style="padding:10px 15px; background:#238636; color:#fff; border:none; border-radius:6px; font-weight:bold; cursor:pointer; margin-top:10px; width:100%;">เข้าสู่ระบบ</button>
        </form>
      </div>
    </body>
  `);
});

app.post("/admin/login", (req, res) => {
  if (req.body.password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    res.redirect("/admin");
  } else {
    res.send(`<script>alert("รหัสผ่านไม่ถูกต้อง!"); window.location.href="/admin";</script>`);
  }
});

app.get("/admin/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/admin"));
});

// แอดมินอนุมัติสลิปเติมเงิน (ระบบเดิม)
app.post("/admin/approve-topup", async (req, res) => {
  if (!req.session.isAdmin) return res.redirect("/admin");
  const { topup_id, username, exact_amount } = req.body;
  const pointsToAdd = Math.floor(parseFloat(exact_amount));

  const { data: user } = await supabase.from('users').select('points').eq('username', username).single();
  if (user) {
    await supabase.from('users').update({ points: user.points + pointsToAdd }).eq('username', username);
  }
  await supabase.from('pending_topup').update({ status: 'completed' }).eq('id', topup_id);
  res.send(`<script>alert("อนุมัติและเพิ่ม ${pointsToAdd} แต้มเรียบร้อย!"); window.location.href="/admin";</script>`);
});

app.post("/admin/delete-topup", async (req, res) => {
  if (!req.session.isAdmin) return res.redirect("/admin");
  await supabase.from('pending_topup').delete().eq('id', req.body.topup_id);
  res.send(`<script>alert("ลบสลิปสำเร็จ!"); window.location.href="/admin";</script>`);
});

// แอดมินเพิ่มไอดี Line Rangers เข้าคลัง
app.post("/admin/add-game-account", async (req, res) => {
  if (!req.session.isAdmin) return res.redirect("/admin");
  const { title, rarity, account_data, rate } = req.body;

  await supabase.from('game_accounts').insert([{
      title,
      rarity,
      account_data,
      rate: parseFloat(rate) || 1.0,
      status: 'available'
  }]);

  res.send(`<script>alert("เพิ่มไอดี Line Rangers เข้าสู่กล่องสุ่มสำเร็จ!"); window.location.href="/admin";</script>`);
});

app.post("/admin/delete-game-account", async (req, res) => {
  if (!req.session.isAdmin) return res.redirect("/admin");
  await supabase.from('game_accounts').delete().eq('id', req.body.account_id);
  res.send(`<script>alert("ลบไอดีเกมสำเร็จ!"); window.location.href="/admin";</script>`);
});

// แอดมินตั้งค่าเรตเกลือ 5 สเต็ปของยูสเซอร์ (ระบบเดิม)
app.post("/admin/update-user-luck", async (req, res) => {
  if (!req.session.isAdmin) return res.redirect("/admin");
  const { 
      username, 
      step1_salt, step1_reward,
      step2_salt, step2_reward,
      step3_salt, step3_reward,
      step4_salt, step4_reward,
      step5_salt, step5_reward
  } = req.body;

  await supabase.from('users').update({ 
      step1_salt: parseInt(step1_salt) || 0, step1_reward: step1_reward || 'normal',
      step2_salt: parseInt(step2_salt) || 0, step2_reward: step2_reward || 'normal',
      step3_salt: parseInt(step3_salt) || 0, step3_reward: step3_reward || 'normal',
      step4_salt: parseInt(step4_salt) || 0, step4_reward: step4_reward || 'normal',
      step5_salt: parseInt(step5_salt) || 0, step5_reward: step5_reward || 'normal',
  }).eq('username', username);

  res.send(`<script>alert("บันทึกเรต 5 สเต็ปให้ ${username} สำเร็จ!"); window.location.href="/admin";</script>`);
});

// แสดงผลแดชบอร์ดหลังบ้าน
async function renderAdminDashboard(req, res) {
  const { data: usersRows } = await supabase.from('users').select('*').order('id', { ascending: false });
  const { data: pendingRows } = await supabase.from('pending_topup').select('*').eq('status', 'pending');
  const { data: gameAccounts } = await supabase.from('game_accounts').select('*').order('id', { ascending: false });

  // รายการสลิปเติมเงิน
  let pendingSlipHtml = "";
  if (pendingRows && pendingRows.length > 0) {
    pendingRows.forEach((p, index) => {
      pendingSlipHtml += `<tr>
        <td>${index + 1}</td>
        <td><b>${p.username}</b></td>
        <td style="color:#d29922;"><b>${p.exact_amount} บาท</b></td>
        <td><a href="${p.slip_img}" target="_blank"><img src="${p.slip_img}" style="width:50px; height:70px; object-fit:cover;"></a></td>
        <td>
          <form action="/admin/approve-topup" method="POST" style="display:inline;">
            <input type="hidden" name="topup_id" value="${p.id}"><input type="hidden" name="username" value="${p.username}"><input type="hidden" name="exact_amount" value="${p.exact_amount}">
            <button type="submit" style="background:#238636; color:#fff; border:none; padding:5px 8px; border-radius:4px;">✅ อนุมัติ</button>
          </form>
          <form action="/admin/delete-topup" method="POST" style="display:inline;">
            <input type="hidden" name="topup_id" value="${p.id}">
            <button type="submit" style="background:#f85149; color:#fff; border:none; padding:5px 8px; border-radius:4px;">🗑️ ลบ</button>
          </form>
        </td>
      </tr>`;
    });
  } else {
    pendingSlipHtml = `<tr><td colspan="5" style="color:#8b949e; padding:10px;">ไม่มีสลิปรอตรวจสอบ</td></tr>`;
  }

  // รายการไอดีเกม Line Rangers ในคลัง
  let gameAccHtml = "";
  if (gameAccounts && gameAccounts.length > 0) {
    gameAccounts.forEach((acc, i) => {
      gameAccHtml += `<tr>
        <td>${i+1}</td>
        <td><b>${acc.title}</b></td>
        <td style="color:#d29922;">${acc.rarity}</td>
        <td><code>${acc.account_data}</code></td>
        <td>
          <form action="/admin/delete-game-account" method="POST" style="margin:0;">
             <input type="hidden" name="account_id" value="${acc.id}">
             <button type="submit" style="background:#f85149; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">🗑️ ลบไอดี</button>
          </form>
        </td>
      </tr>`;
    });
  } else {
    gameAccHtml = `<tr><td colspan="5" style="color:#8b949e; padding:10px;">ยังไม่มีไอดี Line Rangers ในคลัง</td></tr>`;
  }

  // ตัวเลือกรางวัลในสเต็ปสุ่ม
  function renderRewardOptions(currentVal) {
      let opts = `<option value="normal" ${currentVal==='normal'?'selected':''}>--- สุ่มตามเรตปกติ ---</option>`;
      opts += `<option value="always_salt" ${currentVal==='always_salt'?'selected':''}>🔒 บังคับเกลือ</option>`;
      if (gameAccounts) {
          gameAccounts.forEach(acc => {
              const val = `[${acc.rarity}] ${acc.title}`;
              opts += `<option value="${val}" ${currentVal===val?'selected':''}>🛡️ ออกไอดี: ${acc.title}</option>`;
          });
      }
      return opts;
  }

  // รายชื่อสมาชิกและการปรับเรตเกลือ
  let userHtml = "";
  if (usersRows && usersRows.length > 0) {
    usersRows.forEach((u, index) => {
      userHtml += `<tr>
        <td>${index + 1}</td>
        <td><b>${u.username}</b></td>
        <td><a href="${u.roblox_img}" target="_blank" style="color:#58a6ff;">🔗 เฟซบุ๊กผู้เล่น</a></td>
        <td>${u.points} แต้ม</td>
        <td>
          <form action="/admin/update-user-luck" method="POST" style="background:rgba(0,0,0,0.3); padding:6px; border-radius:6px; text-align:left;">
            <input type="hidden" name="username" value="${u.username}">
            <div style="font-size:11px; color:#d29922; margin-bottom:3px;">⚙️ ตั้งค่าเรต 5 สเต็ปยูสนี้:</div>
            <div style="font-size:10px; margin-bottom:2px;">สเต็ป 1: เกลือ <input type="number" name="step1_salt" value="${u.step1_salt||0}" style="width:30px;"> ครั้ง -> หลุดไอดี <select name="step1_reward">${renderRewardOptions(u.step1_reward)}</select></div>
            <div style="font-size:10px; margin-bottom:2px;">สเต็ป 2: เกลือ <input type="number" name="step2_salt" value="${u.step2_salt||0}" style="width:30px;"> ครั้ง -> หลุดไอดี <select name="step2_reward">${renderRewardOptions(u.step2_reward)}</select></div>
            <div style="font-size:10px; margin-bottom:2px;">สเต็ป 3: เกลือ <input type="number" name="step3_salt" value="${u.step3_salt||0}" style="width:30px;"> ครั้ง -> หลุดไอดี <select name="step3_reward">${renderRewardOptions(u.step3_reward)}</select></div>
            <div style="font-size:10px; margin-bottom:2px;">สเต็ป 4: เกลือ <input type="number" name="step4_salt" value="${u.step4_salt||0}" style="width:30px;"> ครั้ง -> หลุดไอดี <select name="step4_reward">${renderRewardOptions(u.step4_reward)}</select></div>
            <div style="font-size:10px; margin-bottom:4px;">สเต็ป 5: เกลือ <input type="number" name="step5_salt" value="${u.step5_salt||0}" style="width:30px;"> ครั้ง -> หลุดไอดี <select name="step5_reward">${renderRewardOptions(u.step5_reward)}</select></div>
            <button type="submit" style="background:#58a6ff; color:#000; border:none; padding:3px; border-radius:4px; font-weight:bold; width:100%; font-size:10px;">💾 บันทึก 5 สเต็ป</button>
          </form>
        </td>
      </tr>`;
    });
  }

  res.send(`
    <body style="background:#0d1117; color:#fff; text-align:center; padding:20px; font-family:sans-serif;">
      <h2>🛠️ ระบบหลังบ้านแอดมิน (Line Rangers LootBox)</h2>
      <a href="/admin/logout" style="color:#f85149;">🔒 ออกจากระบบ</a> | <a href="/" style="color:#58a6ff;">🏠 ไปหน้าแรก</a>

      <!-- ส่วนที่ 1: เพิ่มไอดีเกม Line Rangers -->
      <div style="background:#161b22; padding:20px; border-radius:10px; border:1px solid #30363d; width:850px; margin:20px auto; text-align:left;">
          <h3 style="color:#2ea043; margin-top:0;">➕ เพิ่มไอดีเกม Line Rangers เข้าคลังสุ่ม</h3>
          <form action="/admin/add-game-account" method="POST" style="display:grid; grid-template-columns: 2fr 1fr 2fr 1fr; gap:10px;">
              <input type="text" name="title" placeholder="ชื่อไอดี เช่น ID Line Rangers SSR" required style="padding:8px;">
              <select name="rarity" style="padding:8px;">
                  <option value="Normal">ระดับ Normal</option>
                  <option value="S">ระดับ S</option>
                  <option value="SS+">ระดับ SS+</option>
                  <option value="SSR">ระดับ SSR</option>
                  <option value="เทพมังกร">ระดับ เทพมังกร</option>
              </select>
              <input type="text" name="account_data" placeholder="ข้อมูลไอดี/รหัสผ่าน" required style="padding:8px;">
              <button type="submit" style="background:#238636; color:#fff; border:none; border-radius:6px; font-weight:bold; cursor:pointer;">บันทึกไอดี</button>
          </form>

          <h4 style="color:#d29922; margin-top:20px;">📦 รายการไอดี Line Rangers ในคลังระบบ</h4>
          <table border="1" style="width:100%; border-collapse:collapse; background:#0d1117; border-color:#30363d; font-size:12px; text-align:center;">
             <tr style="background:#21262d;"><th>ลำดับ</th><th>ชื่อรางวัล</th><th>ระดับ</th><th>ข้อมูลไอดี</th><th>จัดการ</th></tr>
             ${gameAccHtml}
          </table>
      </div>

      <!-- ส่วนที่ 2: สลิปเติมเงินรอตรวจสอบ -->
      <h3 style="color:#d29922;">📥 รายการสลิปเติมเงินรอตรวจสอบ</h3>
      <table border="1" style="margin:0 auto 30px auto; border-collapse:collapse; width:700px; background:#161b22; border-color:#30363d;">
        <tr style="background:#21262d;"><th>ลำดับ</th><th>Username</th><th>ยอดเงิน</th><th>สลิป</th><th>จัดการ</th></tr>
        ${pendingSlipHtml}
      </table>

      <!-- ส่วนที่ 3: จัดการสมาชิกและเรตสเต็ปความเกลือ -->
      <h3 style="color:#d29922;">👥 รายชื่อสมาชิก และ การปรับแต่งเรตเกลือ 5 สเต็ป</h3>
      <table border="1" style="margin:0 auto 30px auto; border-collapse:collapse; width:900px; background:#161b22; border-color:#30363d;">
        <tr style="background:#21262d;"><th>ลำดับ</th><th>Username</th><th>Facebook Link</th><th>แต้ม</th><th>ตั้งค่าเรตความเกลือ (5 สเต็ป)</th></tr>
        ${userHtml}
      </table>
    </body>
  `);
}

app.listen(PORT, () => {
  console.log("Line Rangers Lootbox Server running on port " + PORT);
});