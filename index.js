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
        <title>🛡️ Line Rangers LootBox - หน้าแรก</title>
        <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;600;800&display=swap" rel="stylesheet">
        <style>
            body { background-color: #0b0c10; color: #ffffff; text-align: center; padding-top: 80px; font-family: 'Kanit', sans-serif; }
            .container { background: #13151f; padding: 35px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 15px rgba(0,0,0,0.5); width: 350px; border: 1px solid #25283c; }
            h1 { color: #00b900; }
            a { display: block; background-color: #00b900; color: white; padding: 12px; margin: 10px 0; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 15px; }
            a:hover { background-color: #009900; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🛡️ LINE RANGERS BOX</h1>
            <p>เว็บสุ่มไอดีเกม Line Rangers ลุ้นไอดีสุดเทพ!</p>
            <a href="/login">🔑 เข้าสู่ระบบ</a>
            <a href="/register" style="background-color: #1f6beb;">📝 สมัครสมาชิก</a>
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
        <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;600&display=swap" rel="stylesheet">
        <style>
            body { background-color: #0b0c10; color: #ffffff; text-align: center; padding-top: 30px; font-family: 'Kanit', sans-serif; }
            .container { background: #13151f; padding: 30px; border-radius: 10px; display: inline-block; width: 360px; text-align: left; border: 1px solid #25283c; }
            h2 { color: #00b900; text-align: center; margin-top:0; }
            label { display: block; margin-top: 10px; font-size: 14px; }
            input { width: 100%; padding: 10px; margin-top: 5px; border-radius: 4px; border: 1px solid #25283c; background:#1b1e2e; color:#fff; box-sizing: border-box; font-family:'Kanit'; }
            button { width: 100%; background-color: #00b900; color: white; padding: 12px; border: none; border-radius: 5px; margin-top: 20px; font-weight: bold; cursor: pointer; font-family:'Kanit'; }
            a { display: block; text-align: center; margin-top: 15px; color: #70a1ff; text-decoration: none; font-size: 13px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>📝 สมัครสมาชิก</h2>
            <p style="font-size:12px; color:#ffd700; text-align:center;">⚠️ บัญชีมีอายุใช้งาน 30 วันนับจากวันที่สมัคร</p>
            <form action="/register" method="POST">
                <label>Username (สำหรับเข้าเว็บ):</label>
                <input type="text" name="username" placeholder="ตั้งชื่อผู้ใช้งาน" required>
                <label>Password:</label>
                <input type="password" name="password" placeholder="ตั้งรหัสผ่าน" required>
                <label>ลิงก์ Facebook ส่วนตัวของคุณ:</label>
                <input type="url" name="facebook_url" placeholder="https://www.facebook.com/your.profile" required>
                <span style="font-size:11px; color:#a4b0be; display:block; margin-top:3px;">*คัดลอกลิงก์โปรไฟล์เฟซบุ๊กมาวางไว้ เพื่อให้แอดมินทักไปส่งรางวัล</span>
                <button type="submit">ยืนยันการสมัคร</button>
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
          facebook_url: facebook_url || '',
          points: 0, 
          total_spent: 0, 
          step1_salt: 0, step1_reward: 'normal',
          step2_salt: 0, step2_reward: 'normal',
          step3_salt: 0, step3_reward: 'normal',
          step4_salt: 0, step4_reward: 'normal',
          step5_salt: 0, step5_reward: 'normal'
      }]);

    if (error) {
      console.error("Register Error:", error);
      return res.send(`<script>alert("ชื่อผู้ใช้นี้ซ้ำในระบบแล้ว หรือเกิดข้อผิดพลาด!"); window.location.href="/register";</script>`);
    }
    res.send(`<script>alert("สมัครสมาชิกสำเร็จ! บัญชีใช้งานได้ 30 วัน กรุณาเข้าสู่ระบบ"); window.location.href="/login";</script>`);
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
        <title>เข้าสู่ระบบ</title>
        <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;600&display=swap" rel="stylesheet">
        <style>
            body { background-color: #0b0c10; color: #ffffff; text-align: center; padding-top: 50px; font-family:'Kanit'; }
            .container { background: #13151f; padding: 30px; border-radius: 10px; display: inline-block; width: 350px; text-align: left; border: 1px solid #25283c; }
            h2 { color: #ffd700; text-align: center; margin-top:0; }
            label { display: block; margin-top: 10px; font-size: 14px; }
            input { width: 100%; padding: 10px; margin-top: 5px; border-radius: 4px; border: 1px solid #25283c; background:#1b1e2e; color:#fff; box-sizing: border-box; font-family:'Kanit'; }
            button { width: 100%; background-color: #ff4757; color: white; padding: 12px; border: none; border-radius: 5px; margin-top: 20px; font-weight: bold; cursor: pointer; font-family:'Kanit'; }
            a { display: block; text-align: center; margin-top: 15px; color: #70a1ff; text-decoration: none; font-size:13px; }
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

// Realtime Status API
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

    const { data: unwithdrawnHistory } = await supabase
      .from('history')
      .select('*')
      .eq('username', username)
      .eq('is_withdrawn', false);

    let hasClaimable = false;
    if (unwithdrawnHistory) {
      unwithdrawnHistory.forEach(h => {
        if (h.reward && !h.reward.includes("เกลือ")) {
          hasClaimable = true;
        }
      });
    }

    res.json({
      success: true,
      points: user ? user.points : 0,
      total_spent: user ? user.total_spent : 0,
      pendingRows: pendingRows || [],
      hasClaimable: hasClaimable
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

    const { data: gameAccounts } = await supabase.from('game_accounts').select('*').order('id', { ascending: true });

    const { data: pendingRows } = await supabase
      .from('pending_topup')
      .select('*')
      .eq('username', username)
      .eq('status', 'pending');

    let pendingHtml = "";
    if (pendingRows && pendingRows.length > 0) {
      pendingRows.forEach(p => {
        const typeBadge = p.topup_type === 'truemoney' ? '[Wallet]' : '[พร้อมเพย์]';
        pendingHtml += `<li style="color:#ffa502;">ยอดโอน <b>${p.exact_amount} บาท</b> ${typeBadge} (รอแอดมินตรวจสอบสลิป)</li>`;
      });
    } else {
      pendingHtml = `<span style="color:#aaa; font-size:12px;">ไม่มีรายการรอดำเนินการ</span>`;
    }

    const { data: unwithdrawnHistory } = await supabase
      .from('history')
      .select('*')
      .eq('username', username)
      .eq('is_withdrawn', false);

    let hasClaimable = false;
    if (unwithdrawnHistory) {
      unwithdrawnHistory.forEach(h => {
        if (h.reward && !h.reward.includes("เกลือ")) {
          hasClaimable = true;
        }
      });
    }

    const { data: pendingWithdrawRow } = await supabase
      .from('pending_withdraw')
      .select('*')
      .eq('username', username)
      .eq('status', 'pending')
      .single();

    let pendingWithdrawNotice = "";
    if (pendingWithdrawRow) {
      pendingWithdrawNotice = `
        <div style="background:rgba(255,165,2,0.15); border:1px solid #ffa502; padding:10px; border-radius:6px; margin-top:12px; font-size:12px; color:#ffa502; text-align:center;">
            ⏳ มีคำขอรับรางวัลอยู่ระหว่างแอดมินตรวจสอบ (แอดมินจะทักแชท Facebook ไปมอบให้) <br>
            <span style="color:#aaa; font-size:10px;">*คุณยังคงกดสุ่มเล่นต่อได้ตามปกติครับ*</span>
        </div>
      `;
    }

    let claimButtonHtml = "";
    if (hasClaimable) {
      claimButtonHtml = `
        <form action="/request-withdraw" method="POST" style="margin-top:10px;">
            <input type="hidden" name="username" value="${username}">
            <button type="submit" style="width:100%; background:#00b900; color:#fff; padding:12px; border:none; border-radius:6px; font-weight:bold; font-size:14px; cursor:pointer; font-family:'Kanit'; box-shadow:0 0 10px rgba(0,185,0,0.4);">
                🎁 กดขอรับรางวัลทั้งหมดที่คุณสุ่มได้!
            </button>
        </form>
      `;
    }

    let showcaseCardsHtml = "";
    if (gameAccounts && gameAccounts.length > 0) {
      gameAccounts.forEach(acc => {
        let badgeColor = "#2ed573";
        if (acc.rarity === "SSR" || acc.rarity === "เทพมังกร") badgeColor = "#ffd700";
        else if (acc.rarity === "SS+") badgeColor = "#a4b0be";
        else if (acc.rarity === "S") badgeColor = "#70a1ff";

        const isOutOfStock = acc.status === 'out_of_stock';
        const cardStyle = isOutOfStock ? 'border-color:#ff4757; opacity:0.6; position:relative;' : `border-color:${badgeColor};`;
        const stockStatusHtml = isOutOfStock 
            ? `<div style="color:#ff4757; font-weight:800; font-size:13px; margin-top:2px; text-shadow:0 0 5px rgba(255,71,87,0.5);">❌ หมด</div>` 
            : `<div style="font-size:10px; color:#aaa;">ระดับ: ${acc.rarity}</div>`;

        showcaseCardsHtml += `
          <div class="reward-card" style="${cardStyle}">
              <div style="font-size:20px;">🛡️</div>
              <div class="r-name" style="color:${isOutOfStock ? '#ff4757' : badgeColor}">${acc.title}</div>
              ${stockStatusHtml}
          </div>
        `;
      });
    } else {
      showcaseCardsHtml = `
        <div class="reward-card" style="grid-column: span 2;">
            <div style="font-size:18px; color:#aaa;">📦 เกลือ (0 Point)</div>
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
              body { background-color: #0b0c10; color: #ffffff; text-align: center; margin: 0; padding: 15px 0; font-family: 'Kanit', sans-serif; }
              .main-wrapper { max-width: 460px; margin: 0 auto; background: #13151f; border-radius: 16px; border: 1px solid #25283c; box-shadow: 0 10px 30px rgba(0,0,0,0.8); overflow: hidden; padding: 20px; box-sizing: border-box; }
              
              .banner-header h2 { color: #ffd700; font-size: 20px; margin: 5px 0 0 0; text-shadow: 0 0 10px rgba(255,215,0,0.4); }
              .banner-header p { color: #00d2d3; font-size: 13px; margin: 3px 0 0 0; font-weight: bold; }

              .user-bar { background: #1b1e2e; border: 1px solid #2a2e45; border-radius: 10px; padding: 10px 15px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
              .btn-history { background: #00d2d3; color: #000; padding: 4px 8px; border-radius: 4px; text-decoration: none; font-size: 11px; font-weight: bold; }

              .wallet-box { background: #1b1e2e; border: 1px solid #2a2e45; border-radius: 10px; padding: 10px; display: flex; justify-around: space-around; font-size: 14px; margin-bottom: 12px; font-weight: bold; color: #ffd700; }
              
              #countdown-box { background: rgba(255,215,0,0.1); border: 1px dashed #ffd700; padding: 6px; border-radius: 6px; margin-bottom: 12px; font-size: 12px; color: #ffd700; font-weight: bold; }

              .showcase-container { background: #181b2a; border: 1px solid #282c44; border-radius: 12px; padding: 10px; margin-bottom: 15px; }
              .showcase-title { font-size: 12px; color: #a4b0be; text-align: left; margin-bottom: 8px; font-weight: bold; }
              .rewards-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }
              .reward-card { background: #13151f; border: 1px solid #2c314f; border-radius: 8px; padding: 6px 2px; text-align: center; }
              .reward-card .r-name { font-size: 10px; color: #fff; font-weight: bold; }

              .select-group { display: grid; grid-template-columns: repeat(6, 1fr); gap: 4px; margin-bottom: 12px; }
              .select-group button { background: #1b1e2e; color: #fff; border: 1px solid #2f3452; padding: 6px 0; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 11px; font-family:'Kanit'; }
              .select-group button.active { background: #ffd700; color: #000; border-color: #ffaa00; box-shadow: 0 0 8px rgba(255,215,0,0.5); }

              .box-btn { background: linear-gradient(135deg, #ff4757, #ff6b81); color: white; padding: 12px; border: none; border-radius: 8px; font-size: 14px; cursor: pointer; font-weight: bold; width: 100%; box-shadow: 0 4px 15px rgba(255,71,87,0.4); margin-bottom: 10px; font-family:'Kanit'; }
              .box-btn:hover { filter: brightness(1.1); }
              .box-btn:disabled { background: #555 !important; cursor: not-allowed; box-shadow: none; }

              #result-box { margin-top: 10px; padding: 12px; border-radius: 8px; font-size: 13px; font-weight: bold; background: #181b2a; border: 1px solid #2c314f; min-height: 40px; text-align: left; max-height: 180px; overflow-y: auto; }

              .topup-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px; }
              .topup-card { background: #1b1e2e; border: 1px solid #2a2e45; border-radius: 10px; padding: 10px; text-align: left; }
              input[type="number"] { width: 100%; padding: 6px; background: #13151f; border: 1px solid #333856; color: #fff; border-radius: 4px; box-sizing: border-box; font-size: 12px; margin-bottom: 6px; font-family:'Kanit'; }
              .topup-sub-btn { width: 100%; padding: 6px; border: none; border-radius: 4px; font-weight: bold; font-size: 11px; cursor: pointer; font-family:'Kanit'; }
              
              /* Modal Winner / Salt Effect */
              .modal { display: none; position: fixed; z-index: 999; left: 0; top: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); backdrop-filter: blur(5px); }
              .modal-content { background: linear-gradient(135deg, #13151f, #1b1e2e); border: 2px solid #2c314f; margin: 20% auto; padding: 25px; border-radius: 16px; width: 80%; max-width: 350px; text-align: center; box-shadow: 0 0 30px rgba(0,0,0,0.8); animation: popup 0.3s ease-out; }
              @keyframes popup { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
          </style>
      </head>
      <body>
          <div class="main-wrapper">
              
              <div class="banner-header">
                  <h2>🛡️ LINE RANGERS BOX</h2>
                  <p>✨ สุ่มไอดีเกมสุดเทพ ลุ้นรางวัลใหญ่! ✨</p>
              </div>

              <div class="user-bar">
                  <div style="text-align: left; font-size: 12px;">
                      <span style="color: #a4b0be; display: block; font-size: 10px;">ผู้ใช้งาน</span>
                      <b>${username}</b>
                  </div>
                  <div>
                      <a href="/my-history?username=${username}" class="btn-history">📜 ประวัติสุ่ม</a>
                  </div>
              </div>

              <div id="countdown-box">⏳ ID นี้ใช้งานได้อีก: กำลังคำนวณเวลา...</div>
              
              <div class="wallet-box">
                  <div>💰 แต้ม: <span id="points">${currentPoints}</span></div>
                  <div>🎯 สุ่มสะสม: <span id="spent">${totalSpent}</span> ฿</div>
              </div>

              ${pendingWithdrawNotice}
              <div id="claim-btn-container">${claimButtonHtml}</div>

              <div class="showcase-container" style="margin-top:10px;">
                  <div class="showcase-title">🏆 คลังไอดี Line Rangers ในกล่องสุ่ม</div>
                  <div class="rewards-grid">
                      ${showcaseCardsHtml}
                  </div>
              </div>

              <div style="font-size:12px; color:#ffd700; text-align:left; margin-bottom:6px; font-weight:bold;">⚙️ เลือกจำนวนครั้งในการเปิดกล่อง:</div>
              <div class="select-group">
                  <button type="button" class="${countParam === 1 ? 'active' : ''}" onclick="setCount(1, this)">1 ครั้ง</button>
                  <button type="button" class="${countParam === 10 ? 'active' : ''}" onclick="setCount(10, this)">10 ครั้ง</button>
                  <button type="button" class="${countParam === 20 ? 'active' : ''}" onclick="setCount(20, this)">20 ครั้ง</button>
                  <button type="button" class="${countParam === 30 ? 'active' : ''}" onclick="setCount(30, this)">30 ครั้ง</button>
                  <button type="button" class="${countParam === 50 ? 'active' : ''}" onclick="setCount(50, this)">50 ครั้ง</button>
                  <button type="button" class="${countParam === 100 ? 'active' : ''}" onclick="setCount(100, this)">100 ครั้ง</button>
              </div>

              <button class="box-btn" id="open-box-btn" onclick="openBox()">📦 เปิดกล่องลุ้นโชค (${countParam} ครั้ง / ใช้ ${countParam} แต้ม)</button>
              
              <div id="result-box">🎁 กดเปิดกล่องเพื่อลุ้นรับรางวัล!</div>

              <div style="font-size:15px; color:#ffd700; text-align:left; margin:15px 0 5px 0; font-weight:bold; border-left:3px solid #ffd700; padding-left:6px;">💳 ช่องทางการเติมเงิน</div>
              
              <div class="topup-grid">
                  <div class="topup-card">
                      <h4 style="color: #2ed573; margin:0 0 8px 0; font-size:12px;">📱 พร้อมเพย์</h4>
                      <form action="/create-topup" method="POST">
                          <input type="hidden" name="username" value="${username}">
                          <input type="hidden" name="topup_type" value="promptpay">
                          <input type="number" name="amount" placeholder="เช่น 50" required>
                          <button type="submit" class="topup-sub-btn" style="background:#2ed573; color:#fff;">สร้าง QR สแกน</button>
                      </form>
                  </div>

                  <div class="topup-card">
                      <h4 style="color: #ff4757; margin:0 0 8px 0; font-size:12px;">🧡 Wallet</h4>
                      <form action="/create-topup" method="POST">
                          <input type="hidden" name="username" value="${username}">
                          <input type="hidden" name="topup_type" value="truemoney">
                          <input type="number" name="amount" placeholder="เช่น 50" required>
                          <button type="submit" class="topup-sub-btn" style="background:#ff4757; color:#fff;">แจ้งโอนเงิน</button>
                      </form>
                  </div>
              </div>

              <div style="text-align:left; margin-top:10px; background:#1b1e2e; padding:8px; border-radius:6px; font-size:11px;">
                  <b style="color:#ffd700;">📌 สถานะการเติมเงิน:</b>
                  <ul id="pending-list-container" style="padding-left:15px; margin:3px 0;">${pendingHtml}</ul>
              </div>

              <a href="/" style="display:block; margin-top:20px; color:#ff4757; text-decoration:none; font-size:12px; font-weight:bold;">ออกจากระบบ</a>
          </div>

          <!-- Popup Result Modal -->
          <div id="resultModal" class="modal">
              <div class="modal-content" id="modalCard">
                  <h2 id="modalTitle" style="margin:0 0 10px 0;"></h2>
                  <div id="modalBody" style="font-size:14px; margin-bottom:15px;"></div>
                  <button onclick="closeModal()" style="background:#00b900; color:#fff; border:none; padding:10px 25px; border-radius:6px; font-weight:bold; cursor:pointer; font-family:'Kanit';">ตกลง</button>
              </div>
          </div>

          <script>
              let userPoints = ${currentPoints};
              let userSpent = ${totalSpent};
              let selectedCount = ${countParam};
              const createdAtTime = new Date("${createdAt}").getTime();
              const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

              const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
              function playSadSound() {
                  try {
                      const osc = audioCtx.createOscillator();
                      const gain = audioCtx.createGain();
                      osc.type = 'sawtooth';
                      osc.frequency.setValueAtTime(140, audioCtx.currentTime);
                      osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.5);
                      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
                      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
                      osc.connect(gain);
                      gain.connect(audioCtx.destination);
                      osc.start();
                      osc.stop(audioCtx.currentTime + 0.5);
                  } catch(e){}
              }

              function playWinSound() {
                  try {
                      const osc = audioCtx.createOscillator();
                      const gain = audioCtx.createGain();
                      osc.type = 'triangle';
                      osc.frequency.setValueAtTime(523, audioCtx.currentTime);
                      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15);
                      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
                      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
                      osc.connect(gain);
                      gain.connect(audioCtx.destination);
                      osc.start();
                      osc.stop(audioCtx.currentTime + 0.5);
                  } catch(e){}
              }

              setInterval(() => {
                  fetch('/api/user-status?username=${username}')
                  .then(res => res.json())
                  .then(data => {
                      if (!data.success) return;

                      if (userPoints !== data.points) {
                          userPoints = data.points;
                          document.getElementById("points").innerText = userPoints;
                      }
                      if (userSpent !== data.total_spent) {
                          userSpent = data.total_spent;
                          document.getElementById("spent").innerText = userSpent;
                      }

                      let pendingHtml = "";
                      if (data.pendingRows && data.pendingRows.length > 0) {
                          data.pendingRows.forEach(p => {
                              const typeBadge = p.topup_type === 'truemoney' ? '[Wallet]' : '[พร้อมเพย์]';
                              pendingHtml += \`<li style="color:#ffa502;">ยอดโอน <b>\${p.exact_amount} บาท</b> \${typeBadge} (รอแอดมินตรวจสอบสลิป)</li>\`;
                          });
                      } else {
                          pendingHtml = \`<span style="color:#aaa; font-size:12px;">ไม่มีรายการรอดำเนินการ</span>\`;
                      }
                      document.getElementById("pending-list-container").innerHTML = pendingHtml;

                      if (data.hasClaimable) {
                          document.getElementById("claim-btn-container").innerHTML = \`
                            <form action="/request-withdraw" method="POST" style="margin-top:10px;">
                                <input type="hidden" name="username" value="${username}">
                                <button type="submit" style="width:100%; background:#00b900; color:#fff; padding:12px; border:none; border-radius:6px; font-weight:bold; font-size:14px; cursor:pointer; font-family:'Kanit'; box-shadow:0 0 10px rgba(0,185,0,0.4);">
                                    🎁 กดขอรับรางวัลทั้งหมดที่คุณสุ่มได้!
                                </button>
                            </form>
                          \`;
                      }
                  }).catch(e => {});
              }, 3000);

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
                      alert("แต้มของคุณไม่พอใช้งานสำหรับ " + selectedCount + " ครั้ง! กรุณาเติมเงินก่อนครับ");
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
                          alert(data.message || "เกิดข้อผิดพลาดในการเปิดกล่อง");
                          return;
                      }

                      userPoints = data.newPoints;
                      userSpent = data.newSpent;
                      document.getElementById("points").innerText = userPoints;
                      document.getElementById("spent").innerText = userSpent;

                      let summaryListHtml = "";
                      let hasWin = false;
                      let winDetails = "";

                      for (const [rew, count] of Object.entries(data.summaryRewards)) {
                          summaryListHtml += \`• \${rew}<br>\`;
                          if (!rew.includes("เกลือ")) {
                              hasWin = true;
                              winDetails += \`<b>\${rew}</b><br>\`;
                          }
                      }

                      resBox.innerHTML = \`🎉 <b>สรุปผลสุ่ม \${selectedCount} ครั้ง:</b><br>
                          <div style="font-size:12px; margin-top:5px; background:rgba(0,0,0,0.3); padding:8px; border-radius:5px;">\${summaryListHtml}</div>\`;

                      const modalCard = document.getElementById("modalCard");
                      const modalTitle = document.getElementById("modalTitle");
                      const modalBody = document.getElementById("modalBody");

                      if (hasWin) {
                          playWinSound();
                          confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
                          modalCard.style.borderColor = "#ffd700";
                          modalCard.style.boxShadow = "0 0 30px rgba(255,215,0,0.6)";
                          modalTitle.style.color = "#ffd700";
                          modalTitle.innerText = "🎉 ยินดีด้วย! แจ็คพอตแตก 🎉";
                          modalBody.innerHTML = \`คุณสุ่มได้ไอดี Line Rangers!<br><br>\${winDetails}<br><span style="font-size:11px; color:#a4b0be;">อย่าลืมกดปุ่ม "ขอรับรางวัล" ที่หน้าเว็บนะครับ</span>\`;
                      } else {
                          playSadSound();
                          modalCard.style.borderColor = "#ff4757";
                          modalCard.style.boxShadow = "0 0 20px rgba(255,71,87,0.4)";
                          modalTitle.style.color = "#ff4757";
                          modalTitle.innerText = "😢 เสียใจด้วย...";
                          modalBody.innerHTML = \`<span style="color:#ff4757; font-size:16px;">คุณสุ่มได้ <b>เกลือ (0 Point)</b></span><br>ลองเติมเงินแล้วกดสุ่มใหม่อีกครั้ง!\`;
                      }

                      document.getElementById("resultModal").style.display = "block";
                  })
                  .catch(err => {
                      openBtn.disabled = false;
                      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
                  });
              }

              function closeModal() {
                  window.location.reload(); 
              }
          </script>
      </body>
      </html>
    `);
  } catch (err) {
    res.redirect("/login");
  }
});

app.get("/my-history", async (req, res) => {
  const username = req.query.username;
  if (!username) return res.redirect("/login");

  const { data: rows } = await supabase
    .from('history')
    .select('*')
    .eq('username', username)
    .eq('is_withdrawn', false)
    .order('id', { ascending: false });

  let historyList = "";
  if (rows && rows.length > 0) {
    rows.forEach((r, index) => {
      historyList += `<tr><td style="padding:8px;">${index + 1}</td><td style="padding:8px; color:#ffd700;"><b>${r.reward}</b></td><td style="padding:8px;">${r.time || '-'}</td></tr>`;
    });
  } else {
    historyList = `<tr><td colspan="3" style="padding:15px; color:#aaa;">คุณยังไม่มีประวัติการสุ่ม</td></tr>`;
  }

  res.send(`
    <!DOCTYPE html>
    <html lang="th">
    <head>
        <meta charset="UTF-8">
        <title>ประวัติการสุ่มของฉัน</title>
        <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;600&display=swap" rel="stylesheet">
        <style>
            body { background-color: #1e1e2f; color: #ffffff; text-align: center; padding-top: 40px; font-family:'Kanit'; }
            .container { background: #2b2b40; padding: 30px; display: inline-block; border-radius: 10px; width: 500px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); }
            table { width: 100%; border-collapse: collapse; background: #1e1e2f; border-color: #444; margin-bottom: 20px; font-size: 14px; }
            th { padding: 10px; background: #3d3d5c; color: #ffd700; }
            a { display: inline-block; background: #70a1ff; color: #fff; padding: 10px 20px; border-radius: 5px; text-decoration: none; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <h2 style="color:#ffd700;">📜 ประวัติการสุ่มของ: ${username}</h2>
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

app.post("/request-withdraw", async (req, res) => {
  const { username } = req.body;

  const { data: userHistory } = await supabase
    .from('history')
    .select('*')
    .eq('username', username)
    .eq('is_withdrawn', false);

  if (!userHistory || userHistory.length === 0) {
    return res.send(`<script>alert("คุณไม่มีประวัติการสุ่มที่จะแลกรับรางวัล!"); window.location.href="/lootbox?username=${username}";</script>`);
  }

  const { data: userData } = await supabase
    .from('users')
    .select('facebook_url')
    .eq('username', username)
    .single();

  const facebookUrl = userData && userData.facebook_url ? userData.facebook_url : "";

  let rewardsSummaryList = [];
  let idsToUpdate = [];

  userHistory.forEach(h => {
    if (h.reward && !h.reward.includes("เกลือ")) {
      rewardsSummaryList.push(h.reward);
    }
    idsToUpdate.push(h.id);
  });

  await supabase
    .from('pending_withdraw')
    .insert([{
      username: username,
      facebook_url: facebookUrl,
      total_opens: userHistory.length,
      total_robux: rewardsSummaryList.length,
      status: 'pending',
      history_snapshot: JSON.stringify(rewardsSummaryList)
    }]);

  if (idsToUpdate.length > 0) {
    await supabase
      .from('history')
      .update({ is_withdrawn: true })
      .in('id', idsToUpdate);
  }

  res.send(`<script>alert("ส่งคำขอรับรางวัลสำเร็จแล้ว! แอดมินจะทักแชท Facebook ไปส่งมอบให้ครับ"); window.location.href="/lootbox?username=${username}";</script>`);
});

app.post("/create-topup", (req, res) => {
  const { username, amount, topup_type } = req.body;
  const exactAmount = parseFloat(amount).toFixed(2);
  
  let titleText = "";
  let infoHtml = "";

  if (topup_type === "truemoney") {
      titleText = "🧡 แจ้งโอนเงิน TrueMoney Wallet";
      infoHtml = `
        <p style="font-size:13px; color:#aaa; text-align:center;">โอนเข้าเบอร์: <b style="color:#ff4757; font-size:16px;">${MY_TRUEMONEY_NUMBER}</b></p>
        <p style="font-size:13px; color:#aaa; text-align:center;">ชื่อบัญชี: <b>${MY_TRUEMONEY_NAME}</b></p>
      `;
  } else {
      titleText = "📱 สแกนจ่ายด้วยพร้อมเพย์";
      const qrCodeUrl = `https://promptpay.io/${MY_PROMPTPAY_NUMBER}/${exactAmount}.png`;
      infoHtml = `
        <p style="font-size:13px; color:#aaa; text-align:center;">ชื่อบัญชี: <b>${MY_ACCOUNT_NAME}</b></p>
        <div style="background:#fff; padding:10px; text-align:center; border-radius:8px; margin:10px 0;">
            <img src="${qrCodeUrl}" style="width:180px; height:180px;">
        </div>
      `;
  }

  res.send(`
    <!DOCTYPE html><html lang="th"><head><meta charset="UTF-8"><title>${titleText}</title>
    <style>
        body { background: #1e1e2f; color: #fff; text-align: center; padding-top: 30px; font-family:'Kanit'; }
        .box { background: #2b2b40; padding: 25px; display: inline-block; border-radius: 10px; width: 380px; text-align: left; }
    </style></head>
    <body><div class="box">
        <h2 style="color:${topup_type === 'truemoney' ? '#ff4757' : '#2ed573'}; text-align:center;">${titleText}</h2>
        ${infoHtml}
        
        <h2 style="color:#ffd700; text-align:center; margin:5px 0;">${exactAmount} บาท</h2>
        
        <hr style="border:0; border-top:1px solid #444; margin:15px 0;">

        <form action="/upload-slip" method="POST" enctype="multipart/form-data" onsubmit="handleUpload(this)">
            <input type="hidden" name="username" value="${username}">
            <input type="hidden" name="exact_amount" value="${exactAmount}">
            <input type="hidden" name="topup_type" value="${topup_type || 'promptpay'}">
            
            <label style="font-size:13px; display:block; margin-bottom:5px;">📤 อัปโหลดสลิปโอนเงิน:</label>
            <input type="file" name="slip_img" accept="image/*" required style="background:#fff; color:#000; padding:5px; width:100%; box-sizing:border-box; border-radius:4px;">
            
            <button type="submit" id="submit-btn" style="width:100%; background:${topup_type === 'truemoney' ? '#ff4757' : '#2ed573'}; color:#fff; padding:10px; border:none; border-radius:5px; font-weight:bold; cursor:pointer; margin-top:15px;">ส่งสลิปให้แอดมินตรวจสอบ</button>
        </form>

        <div id="loading-text" style="display:none; text-align:center; margin-top:10px; color:#ffd700; font-size:13px; font-weight:bold;">
            ⏳ กำลังอัปโหลดสลิปและบันทึกข้อมูล กรุณารอ...
        </div>

        <a href="/lootbox?username=${username}" style="display:block; text-align:center; margin-top:15px; color:#70a1ff; text-decoration:none; font-size:13px;">กลับหน้าสุ่มกล่อง</a>
    </div>
    <script>
        function handleUpload(form) {
            const btn = document.getElementById('submit-btn');
            const loading = document.getElementById('loading-text');
            btn.disabled = true;
            btn.style.background = '#555';
            btn.innerText = 'กำลังส่งข้อมูล...';
            loading.style.display = 'block';
        }
    </script>
    </body></html>
  `);
});

app.post("/upload-slip", upload.single('slip_img'), async (req, res) => {
  const { username, exact_amount, topup_type } = req.body;
  
  try {
    const slipImg = await uploadToSupabaseStorage(req.file);

    const { error } = await supabase
      .from('pending_topup')
      .insert([{ 
          username, 
          exact_amount: parseFloat(exact_amount), 
          slip_img: slipImg, 
          status: 'pending',
          topup_type: topup_type || 'promptpay' 
      }]);

    if (error) {
      return res.send(`<script>alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่"); window.location.href="/lootbox?username=${username}";</script>`);
    }
    res.send(`<script>alert("ส่งสลิปสำเร็จ! กรุณารอแอดมินตรวจสอบและเติมแต้มให้ภายในไม่กี่นาที"); window.location.href="/lootbox?username=${username}";</script>`);
  } catch (err) {
    res.send(`<script>alert("เกิดข้อผิดพลาดในการอัปโหลดไฟล์"); window.location.href="/lootbox?username=${username}";</script>`);
  }
});

// ------------------- ALGORITHM กล่องสุ่ม (ตัดไอดีที่หมดออกจากสุ่ม) -------------------

app.post("/open-lootbox", async (req, res) => {
  const { username, count } = req.body;
  const selectedCount = parseInt(count) || 1;

  if (!username || selectedCount <= 0) {
    return res.json({ success: false, message: "ข้อมูลไม่ถูกต้อง" });
  }

  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (userError || !user) return res.json({ success: false, message: "ไม่พบผู้ใช้งาน" });
    if (user.points < selectedCount) return res.json({ success: false, message: "แต้มของคุณไม่พอใช้งาน!" });

    // ดึงเฉพาะไอดีที่ยังมีสถานะ 'available' หรือไม่ใช่ 'out_of_stock'
    const { data: gameAccounts } = await supabase
      .from('game_accounts')
      .select('*')
      .neq('status', 'out_of_stock');

    let historyBatch = [];
    let summaryRewards = {};
    let accountsToUpdateStatus = [];

    let steps = [
      { salt: user.step1_salt || 0, reward: user.step1_reward || 'normal' },
      { salt: user.step2_salt || 0, reward: user.step2_reward || 'normal' },
      { salt: user.step3_salt || 0, reward: user.step3_reward || 'normal' },
      { salt: user.step4_salt || 0, reward: user.step4_reward || 'normal' },
      { salt: user.step5_salt || 0, reward: user.step5_reward || 'normal' }
    ];

    const safeFacebookUrl = (user && user.facebook_url) ? user.facebook_url : '';

    for (let i = 0; i < selectedCount; i++) {
        let reward = "";
        let handled = false;

        // เช็คระบบ 5 สเต็ป
        for (let s = 0; s < steps.length; s++) {
            if (steps[s].salt > 0) {
                reward = "🧂 เกลือ (0 Point)";
                steps[s].salt -= 1;
                handled = true;
                break;
            } else if (steps[s].salt === 0 && steps[s].reward && steps[s].reward !== 'normal') {
                reward = `🛡️ ${steps[s].reward}`;
                steps[s].reward = 'normal';
                handled = true;
                break;
            }
        }

        // สุ่มตามเรตปกติ (เลือกสุ่มเฉพาะไอดีที่มีของ)
        if (!handled) {
            const rand = Math.random() * 100;
            let currentAcc = null;

            if (gameAccounts && gameAccounts.length > 0) {
                for (let accIndex = 0; accIndex < gameAccounts.length; accIndex++) {
                    const acc = gameAccounts[accIndex];
                    const rate = parseFloat(acc.rate) || 0;
                    if (rand < rate) {
                        currentAcc = acc;
                        // ลบไอดีนี้ออกจาก Array เพื่อไม่ให้สุ่มได้ซ้ำอีกในรอบเดียวกัน
                        gameAccounts.splice(accIndex, 1);
                        accountsToUpdateStatus.push(acc.id);
                        break;
                    }
                }
            }

            if (currentAcc) {
                reward = `🛡️ [${currentAcc.rarity}] ${currentAcc.title}`;
            } else {
                reward = "🧂 เกลือ (0 Point)";
            }
        }

        summaryRewards[reward] = (summaryRewards[reward] || 0) + 1;

        historyBatch.push({
            username: username,
            facebook_url: safeFacebookUrl,
            reward: reward,
            reward_num: 0,
            is_withdrawn: false
        });
    }

    // อัปเดตไอดีที่สุ่มออกไปแล้วให้เป็น out_of_stock
    if (accountsToUpdateStatus.length > 0) {
        await supabase
          .from('game_accounts')
          .update({ status: 'out_of_stock' })
          .in('id', accountsToUpdateStatus);
    }

    const newPoints = user.points - selectedCount;
    const newSpent = (user.total_spent || 0) + selectedCount;

    await supabase.from('users').update({ 
        points: parseInt(newPoints) || 0, 
        total_spent: parseInt(newSpent) || 0,
        step1_salt: parseInt(steps[0].salt) || 0, step1_reward: steps[0].reward || 'normal',
        step2_salt: parseInt(steps[1].salt) || 0, step2_reward: steps[1].reward || 'normal',
        step3_salt: parseInt(steps[2].salt) || 0, step3_reward: steps[2].reward || 'normal',
        step4_salt: parseInt(steps[3].salt) || 0, step4_reward: steps[3].reward || 'normal',
        step5_salt: parseInt(steps[4].salt) || 0, step5_reward: steps[5].reward || 'normal'
    }).eq('username', username);

    const { error: histError } = await supabase.from('history').insert(historyBatch);
    if (histError) {
        console.error("History Insert Error:", histError);
    }

    return res.json({
        success: true,
        newPoints: newPoints,
        newSpent: newSpent,
        summaryRewards: summaryRewards
    });

  } catch (err) {
    console.error("Open Lootbox Crash Error:", err);
    return res.json({ success: false, message: "เกิดข้อผิดพลาดในการประมวลผลคำขอสุ่ม" });
  }
});

// ------------------- ADMIN DASHBOARD -------------------

app.get("/admin", async (req, res) => {
  if (req.session.isAdmin) return renderAdminDashboard(req, res);

  res.send(`
    <body style="background:#1e1e2f; color:#fff; text-align:center; padding-top:80px; font-family:sans-serif;">
      <div style="background:#2b2b40; padding:30px; display:inline-block; border-radius:10px;">
        <h2>🛠️ เข้าสู่ระบบผู้ดูแลระบบ</h2>
        <form action="/admin/login" method="POST">
          <input type="password" name="password" placeholder="รหัสผ่านแอดมิน" style="padding:10px; width:240px; border-radius:4px; border:none; box-sizing:border-box;" required>
          <button type="submit" style="padding:10px 15px; background:#ff4757; color:#fff; border:none; border-radius:4px; font-weight:bold; cursor:pointer; margin-top:10px; width:100%;">เข้าสู่ระบบ</button>
        </form>
        <br><a href="/" style="color:#70a1ff; text-decoration:none;">กลับหน้าแรก</a>
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

app.post("/admin/approve-topup", async (req, res) => {
  if (!req.session.isAdmin) return res.redirect("/admin");
  const { topup_id, username, exact_amount } = req.body;
  const pointsToAdd = Math.floor(parseFloat(exact_amount));

  const { data: user } = await supabase.from('users').select('points').eq('username', username).single();
  if (user) {
    await supabase.from('users').update({ points: user.points + pointsToAdd }).eq('username', username);
  }
  await supabase.from('pending_topup').update({ status: 'completed' }).eq('id', topup_id);
  res.send(`<script>alert("อนุมัติยอดเงินและเพิ่ม ${pointsToAdd} แต้มให้ ${username} เรียบร้อย!"); window.location.href="/admin";</script>`);
});

app.post("/admin/delete-topup", async (req, res) => {
  if (!req.session.isAdmin) return res.redirect("/admin");
  await supabase.from('pending_topup').delete().eq('id', req.body.topup_id);
  res.send(`<script>alert("ลบสลิปรายการนี้เรียบร้อยแล้ว!"); window.location.href="/admin";</script>`);
});

app.post("/admin/approve-withdraw", async (req, res) => {
  if (!req.session.isAdmin) return res.redirect("/admin");
  const { withdraw_id, username } = req.body;

  await supabase.from('pending_withdraw').delete().eq('id', withdraw_id);
  await supabase.from('history').delete().eq('username', username).eq('is_withdrawn', true);

  res.send(`<script>alert("อนุมัติส่งมอบรางวัลให้ ${username} เรียบร้อย! ประวัติเดิมถูกลบออกแล้ว"); window.location.href="/admin";</script>`);
});

app.post("/admin/add-game-account", async (req, res) => {
  if (!req.session.isAdmin) return res.redirect("/admin");
  const { title, rarity, rate } = req.body;

  await supabase.from('game_accounts').insert([{
      title,
      rarity,
      rate: parseFloat(rate) || 1.0,
      status: 'available'
  }]);

  res.send(`<script>alert("เพิ่มรางวัล Line Rangers เข้าสู่คลังสำเร็จ!"); window.location.href="/admin";</script>`);
});

app.post("/admin/update-game-account-rate", async (req, res) => {
  if (!req.session.isAdmin) return res.redirect("/admin");
  const { account_id, rate, status } = req.body;

  await supabase.from('game_accounts').update({ 
      rate: parseFloat(rate) || 0,
      status: status || 'available'
  }).eq('id', account_id);

  res.send(`<script>alert("อัปเดตข้อมูลไอดีเรียบร้อย!"); window.location.href="/admin";</script>`);
});

app.post("/admin/delete-game-account", async (req, res) => {
  if (!req.session.isAdmin) return res.redirect("/admin");
  await supabase.from('game_accounts').delete().eq('id', req.body.account_id);
  res.send(`<script>alert("ลบไอดีสำเร็จ!"); window.location.href="/admin";</script>`);
});

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

  res.send(`<script>alert("บันทึกเรต 5 สเต็ปสำเร็จ!"); window.location.href="/admin";</script>`);
});

app.post("/admin/delete-user", async (req, res) => {
  if (!req.session.isAdmin) return res.redirect("/admin");
  const { username } = req.body;

  await supabase.from('users').delete().eq('username', username);
  await supabase.from('history').delete().eq('username', username);
  await supabase.from('pending_topup').delete().eq('username', username);
  await supabase.from('pending_withdraw').delete().eq('username', username);

  res.send(`<script>alert("ลบสมาชิก ${username} เรียบร้อยแล้ว!"); window.location.href="/admin";</script>`);
});

async function renderAdminDashboard(req, res) {
  const { data: usersRows } = await supabase.from('users').select('*').order('id', { ascending: false });
  const { data: pendingRows } = await supabase.from('pending_topup').select('*').eq('status', 'pending');
  const { data: pendingWithdrawRows } = await supabase.from('pending_withdraw').select('*').eq('status', 'pending');
  const { data: gameAccounts } = await supabase.from('game_accounts').select('*').order('id', { ascending: false });

  let pendingSlipHtml = "";
  if (pendingRows && pendingRows.length > 0) {
    pendingRows.forEach((p, index) => {
      let topupBadge = p.topup_type === 'truemoney' 
          ? `<span style="background:#ff4757; color:#fff; padding:3px 6px; border-radius:4px; font-size:11px; font-weight:bold;">🧡 True Wallet</span>` 
          : `<span style="background:#2ed573; color:#fff; padding:3px 6px; border-radius:4px; font-size:11px; font-weight:bold;">📱 PromptPay</span>`;

      pendingSlipHtml += `<tr>
        <td>${index + 1}</td>
        <td><b>${p.username}</b></td>
        <td>${topupBadge}</td>
        <td style="color:#ffd700;"><b>${p.exact_amount} บาท</b></td>
        <td><a href="${p.slip_img}" target="_blank"><img src="${p.slip_img}" style="width:50px; height:70px; object-fit:cover;"></a></td>
        <td>
          <form action="/admin/approve-topup" method="POST" style="display:inline;">
            <input type="hidden" name="topup_id" value="${p.id}"><input type="hidden" name="username" value="${p.username}"><input type="hidden" name="exact_amount" value="${p.exact_amount}">
            <button type="submit" style="background:#2ed573; color:#fff; border:none; padding:5px 8px; border-radius:4px; font-weight:bold; cursor:pointer;">✅ อนุมัติ</button>
          </form>
          <form action="/admin/delete-topup" method="POST" style="display:inline;">
            <input type="hidden" name="topup_id" value="${p.id}">
            <button type="submit" style="background:#ff4757; color:#fff; border:none; padding:5px 8px; border-radius:4px; font-weight:bold; cursor:pointer;">🗑️ ลบสลิป</button>
          </form>
        </td>
      </tr>`;
    });
  } else {
    pendingSlipHtml = `<tr><td colspan="6" style="color:#aaa; padding:12px;">ไม่มีสลิปรอตรวจสอบ</td></tr>`;
  }

  let withdrawHtml = "";
  if (pendingWithdrawRows && pendingWithdrawRows.length > 0) {
    pendingWithdrawRows.forEach((w, index) => {
      let rewardsList = "";
      try {
        const parsed = JSON.parse(w.history_snapshot);
        rewardsList = parsed.join(", ");
      } catch(e) { rewardsList = "ไอดี Line Rangers"; }

      withdrawHtml += `<tr>
        <td>${index + 1}</td>
        <td><b>${w.username}</b></td>
        <td><a href="${w.facebook_url || '#'}" target="_blank" style="background:#70a1ff; color:#fff; padding:4px 8px; border-radius:4px; text-decoration:none; font-size:12px; font-weight:bold;">👤 กดดูโปรไฟล์ Facebook</a></td>
        <td style="color:#ffd700; font-size:12px;">${rewardsList}</td>
        <td>
          <form action="/admin/approve-withdraw" method="POST" style="margin:0;">
            <input type="hidden" name="withdraw_id" value="${w.id}">
            <input type="hidden" name="username" value="${w.username}">
            <button type="submit" style="background:#2ed573; color:#fff; border:none; padding:6px 12px; border-radius:4px; font-weight:bold; cursor:pointer;">✅ อนุมัติส่งมอบเรียบร้อย</button>
          </form>
        </td>
      </tr>`;
    });
  } else {
    withdrawHtml = `<tr><td colspan="5" style="color:#aaa; padding:12px;">ไม่มีคำขอรับรางวัลที่ค้างอยู่</td></tr>`;
  }

  let gameAccHtml = "";
  if (gameAccounts && gameAccounts.length > 0) {
    gameAccounts.forEach((acc, i) => {
      const isOut = acc.status === 'out_of_stock';
      gameAccHtml += `<tr>
        <td>${i+1}</td>
        <td><b>${acc.title}</b></td>
        <td style="color:#ffd700;">${acc.rarity}</td>
        <td>
          <form action="/admin/update-game-account-rate" method="POST" style="display:inline-flex; gap:4px; align-items:center; margin:0;">
             <input type="hidden" name="account_id" value="${acc.id}">
             <input type="number" step="0.0001" name="rate" value="${acc.rate || 0}" style="width:65px; padding:3px; text-align:center;"> %
             <select name="status" style="padding:3px; font-size:11px;">
                <option value="available" ${!isOut ? 'selected' : ''}>🟢 มีของ</option>
                <option value="out_of_stock" ${isOut ? 'selected' : ''}>❌ หมด</option>
             </select>
             <button type="submit" style="background:#70a1ff; color:#000; border:none; padding:4px 6px; border-radius:3px; font-weight:bold; cursor:pointer; font-size:11px;">💾 บันทึก</button>
          </form>
        </td>
        <td>
          <form action="/admin/delete-game-account" method="POST" style="margin:0;">
             <input type="hidden" name="account_id" value="${acc.id}">
             <button type="submit" style="background:#ff4757; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">🗑️ ลบ</button>
          </form>
        </td>
      </tr>`;
    });
  } else {
    gameAccHtml = `<tr><td colspan="5" style="color:#aaa; padding:10px;">ยังไม่มีไอดี Line Rangers ในคลัง</td></tr>`;
  }

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

  let userHtml = "";
  if (usersRows && usersRows.length > 0) {
    usersRows.forEach((u, index) => {
      userHtml += `<tr>
        <td>${index + 1}</td>
        <td><b>${u.username}</b></td>
        <td><a href="${u.facebook_url || '#'}" target="_blank" style="color:#70a1ff;">🔗 เฟซบุ๊กผู้เล่น</a></td>
        <td>${u.points} แต้ม</td>
        <td>
          <form action="/admin/update-user-luck" method="POST" style="background:rgba(0,0,0,0.3); padding:6px; border-radius:6px; text-align:left;">
            <input type="hidden" name="username" value="${u.username}">
            <div style="font-size:11px; color:#ffd700; margin-bottom:3px;">⚙️ ตั้งค่าเรต 5 สเต็ปยูสนี้:</div>
            <div style="font-size:10px; margin-bottom:2px;">สเต็ป 1: เกลือ <input type="number" name="step1_salt" value="${u.step1_salt||0}" style="width:30px;"> ครั้ง -> หลุดไอดี <select name="step1_reward">${renderRewardOptions(u.step1_reward)}</select></div>
            <div style="font-size:10px; margin-bottom:2px;">สเต็ป 2: เกลือ <input type="number" name="step2_salt" value="${u.step2_salt||0}" style="width:30px;"> ครั้ง -> หลุดไอดี <select name="step2_reward">${renderRewardOptions(u.step2_reward)}</select></div>
            <div style="font-size:10px; margin-bottom:2px;">สเต็ป 3: เกลือ <input type="number" name="step3_salt" value="${u.step3_salt||0}" style="width:30px;"> ครั้ง -> หลุดไอดี <select name="step3_reward">${renderRewardOptions(u.step3_reward)}</select></div>
            <div style="font-size:10px; margin-bottom:2px;">สเต็ป 4: เกลือ <input type="number" name="step4_salt" value="${u.step4_salt||0}" style="width:30px;"> ครั้ง -> หลุดไอดี <select name="step4_reward">${renderRewardOptions(u.step4_reward)}</select></div>
            <div style="font-size:10px; margin-bottom:4px;">สเต็ป 5: เกลือ <input type="number" name="step5_salt" value="${u.step5_salt||0}" style="width:30px;"> ครั้ง -> หลุดไอดี <select name="step5_reward">${renderRewardOptions(u.step5_reward)}</select></div>
            <button type="submit" style="background:#70a1ff; color:#000; border:none; padding:3px; border-radius:4px; font-weight:bold; width:100%; font-size:10px;">💾 บันทึก 5 สเต็ป</button>
          </form>
          <form action="/admin/delete-user" method="POST" onsubmit="return confirm('ต้องการลบสมาชิก ${u.username} ใช่หรือไม่?');" style="margin-top:4px;">
            <input type="hidden" name="username" value="${u.username}">
            <button type="submit" style="background:#ff4757; color:#fff; border:none; padding:3px 6px; border-radius:3px; font-weight:bold; cursor:pointer; font-size:10px; width:100%;">🗑️ ลบยูส</button>
          </form>
        </td>
      </tr>`;
    });
  }

  res.send(`
    <body style="background:#1e1e2f; color:#fff; text-align:center; padding:20px; font-family:sans-serif;">
      <h2>🛠️ ระบบจัดการหลังบ้านแอดมิน (Line Rangers Box)</h2>
      <a href="/admin/logout" style="color:#ff4757; font-weight:bold; text-decoration:none;">🔒 ออกจากระบบ</a> | <a href="/" style="color:#70a1ff; text-decoration:none;">🏠 กลับหน้าแรก</a>

      <h3 style="color:#ffd700; margin-top:25px;">🎁 รายการคำขอรับรางวัลไอดี Line Rangers จากผู้เล่น</h3>
      <table border="1" style="margin: 0 auto 30px auto; border-collapse: collapse; width: 850px; background:#2b2b40; border-color:#444;">
        <tr style="background:#3d3d5c;"><th>ลำดับ</th><th>Username</th><th>Facebook ผู้เล่น</th><th>รางวัลที่สุ่มได้</th><th>จัดการ</th></tr>
        ${withdrawHtml}
      </table>

      <div style="background:#2b2b40; padding:20px; border-radius:10px; border:1px solid #444; width:850px; margin:20px auto; text-align:left;">
          <h3 style="color:#2ed573; margin-top:0;">➕ เพิ่มไอดีเกม / รางวัล Line Rangers เข้าคลัง</h3>
          <form action="/admin/add-game-account" method="POST" style="display:flex; gap:10px; align-items:center;">
              <input type="text" name="title" placeholder="ชื่อรางวัล เช่น ID Line Rangers SSR" required style="padding:8px; flex:2;">
              <select name="rarity" style="padding:8px;">
                  <option value="Normal">ระดับ Normal</option>
                  <option value="S">ระดับ S</option>
                  <option value="SS+">ระดับ SS+</option>
                  <option value="SSR">ระดับ SSR</option>
                  <option value="เทพมังกร">ระดับ เทพมังกร</option>
              </select>
              <input type="number" step="0.0001" name="rate" placeholder="อัตรา % เช่น 0.0005" required style="padding:8px; width:120px;">
              <button type="submit" style="background:#2ed573; color:#fff; border:none; border-radius:5px; font-weight:bold; cursor:pointer; padding:9px 15px;">บันทึกรางวัล</button>
          </form>

          <h4 style="color:#ffd700; margin-top:20px;">📦 คลังรางวัล และ การตั้งค่าอัตราออก (%)</h4>
          <table border="1" style="width:100%; border-collapse:collapse; background:#1e1e2f; border-color:#444; font-size:12px; text-align:center;">
             <tr style="background:#3d3d5c;"><th>ลำดับ</th><th>ชื่อรางวัล</th><th>ระดับ</th><th>อัตราออก (%) / สถานะ</th><th>จัดการ</th></tr>
             ${gameAccHtml}
          </table>
      </div>

      <h3 style="color:#ffd700;">📥 รายการสลิปเติมเงินรอตรวจสอบ</h3>
      <table border="1" style="margin:0 auto 30px auto; border-collapse:collapse; width:800px; background:#2b2b40; border-color:#444;">
        <tr style="background:#3d3d5c;"><th>ลำดับ</th><th>Username</th><th>ช่องทาง</th><th>ยอดเงิน</th><th>สลิป</th><th>จัดการ</th></tr>
        ${pendingSlipHtml}
      </table>

      <h3 style="color:#ffd700;">👥 รายชื่อสมาชิกทั้งหมด และ การตั้งค่าเรตเกลือ 5 สเต็ป</h3>
      <table border="1" style="margin:0 auto 30px auto; border-collapse:collapse; width:900px; background:#2b2b40; border-color:#444;">
        <tr style="background:#3d3d5c;"><th>ลำดับ</th><th>Username</th><th>Facebook Link</th><th>แต้ม</th><th>ตั้งค่าเรตความเกลือ (5 สเต็ป)</th></tr>
        ${userHtml}
      </table>
    </body>
  `);
}

app.listen(PORT, () => {
  console.log("Server running smoothly on port " + PORT);
});