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
    secret: process.env.SESSION_SECRET || 'tree_planting_secret_2026',
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
                await Promise.all([
                    supabase.from('users').delete().eq('username', username),
                    supabase.from('history').delete().eq('username', username),
                    supabase.from('pending_topup').delete().eq('username', username),
                    supabase.from('pending_withdraw').delete().eq('username', username),
                    supabase.from('user_trees').delete().eq('username', username)
                ]);
                return true; 
            }
        }
    } catch (e) {}
    return false; 
}

// ------------------- SCI-FI / NATURE THEME CSS -------------------
const exactSciFiCSS = `
    * { box-sizing: border-box; }
    body { 
        background: radial-gradient(circle at 50% 30%, #132e1b 0%, #08140e 50%, #030805 100%);
        color: #ffffff; 
        text-align: center; 
        margin: 0;
        min-height: 100vh;
        font-family: 'Kanit', sans-serif;
        overflow-x: hidden;
        position: relative;
    }
    body::before {
        content: '';
        position: fixed;
        top: 0; left: 0; width: 100%; height: 100%;
        background: 
            radial-gradient(circle at 15% 25%, rgba(46, 213, 115, 0.2) 0%, transparent 45%),
            radial-gradient(circle at 85% 30%, rgba(0, 210, 211, 0.2) 0%, transparent 45%),
            radial-gradient(circle at 50% 85%, rgba(255, 165, 2, 0.15) 0%, transparent 55%),
            linear-gradient(to bottom, rgba(3,8,5,0.8), rgba(8,20,14,0.95));
        pointer-events: none;
        z-index: 0;
    }
    .winner-ticker-banner {
        background: linear-gradient(90deg, #2ed573, #ffa502, #00d2d3, #2ed573);
        background-size: 300% 300%;
        animation: gradientTicker 6s ease infinite;
        color: #000;
        font-weight: 800;
        font-size: 13px;
        padding: 8px 0;
        position: relative;
        z-index: 10;
        box-shadow: 0 2px 15px rgba(0,0,0,0.5);
        overflow: hidden;
        white-space: nowrap;
    }
    @keyframes gradientTicker {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
    }
    .winner-ticker-text {
        display: inline-block;
        padding-left: 100%;
        animation: tickerScroll 20s linear infinite;
    }
    @keyframes tickerScroll {
        0% { transform: translate(0, 0); }
        100% { transform: translate(-100%, 0); }
    }
    .top-lang-bar {
        position: absolute;
        top: 45px; right: 20px;
        display: flex; gap: 10px; align-items: center;
        z-index: 10;
        font-size: 13px;
    }
    .lang-badge, .audio-btn {
        background: rgba(0,0,0,0.6);
        border: 1px solid rgba(255,255,255,0.2);
        padding: 4px 12px;
        border-radius: 20px;
        color: #fff;
        backdrop-filter: blur(5px);
    }
    .main-title-container {
        position: relative;
        padding-top: 25px;
        z-index: 4;
    }
    .game-logo-badge {
        background: linear-gradient(90deg, #2ed573, #00d2d3);
        color: #000;
        font-size: 11px;
        font-weight: 800;
        padding: 3px 15px;
        border-radius: 12px;
        display: inline-block;
        margin-bottom: 5px;
        box-shadow: 0 0 15px rgba(46,213,115,0.6);
        letter-spacing: 1px;
    }
    h1.main-title {
        font-size: 38px;
        font-weight: 900;
        line-height: 1.1;
        margin: 0;
        background: linear-gradient(180deg, #ffffff 30%, #2ed573 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        text-shadow: 0 0 30px rgba(46, 255, 135, 0.5);
        letter-spacing: 2px;
    }
    .sub-title-box {
        font-size: 13px;
        color: #00d2d3;
        margin-top: 8px;
        font-weight: 600;
        text-shadow: 0 0 10px rgba(0,210,211,0.6);
    }
    .scifi-box {
        background: rgba(13, 30, 20, 0.94);
        backdrop-filter: blur(25px);
        -webkit-backdrop-filter: blur(25px);
        border: 2px solid #2ed573;
        border-radius: 24px;
        box-shadow: 0 0 50px rgba(46, 213, 115, 0.3), inset 0 0 25px rgba(46, 213, 115, 0.1);
        position: relative;
        z-index: 4;
        margin: 20px auto;
        padding: 25px;
        width: 92%;
        max-width: 460px;
    }
    .footer-copy {
        font-size: 10px;
        color: #718093;
        margin: 20px 0 15px 0;
        z-index: 4;
        position: relative;
    }
`;

// ------------------- TICKER API -------------------
app.get("/api/ticker", async (req, res) => {
  try {
      const { data: recentWins } = await supabase
          .from('history')
          .select('username, reward')
          .order('id', { ascending: false })
          .limit(8);

      let tickerHtml = "🌱 ยินดีต้อนรับสู่กิจกรรมปลูกต้นไม้รับรางวัลใหญ่! ซื้อปุ๋ยรดน้ำต้นไม้ให้โตครบ 100% เพื่อรับรางวัลพรีเมียมก่อนใคร! 🌱";
      if (recentWins && recentWins.length > 0) {
          let parts = recentWins.map(w => `🎉 คุณ <b>${w.username}</b> ได้รับ <span style="color:#ffd700;">${w.reward}</span>`);
          tickerHtml = parts.join(" &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp; ");
      }
      res.json({ success: true, tickerHtml });
  } catch (e) {
      res.json({ success: false });
  }
});

// ------------------- FRONTEND ROUTES: HOME / LOGIN / REGISTER -------------------
app.get("/", async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.send(`
    <!DOCTYPE html>
    <html lang="th">
    <head>
        <meta charset="UTF-8">
        <title>🌳 กิจกรรมปลูกต้นไม้รับรางวัล - หน้าแรก</title>
        <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;600;800;900&display=swap" rel="stylesheet">
        <style>
            ${exactSciFiCSS}
            .btn-scifi { display: block; width: 100%; padding: 14px; margin: 15px 0; border-radius: 12px; font-size: 16px; font-weight: 800; text-decoration: none; font-family: 'Kanit'; cursor: pointer; }
            .btn-login { background: linear-gradient(135deg, #2ed573, #17b978); color: #000; box-shadow: 0 4px 20px rgba(46, 213, 115, 0.5); border: 1px solid #7efff5; }
            .btn-reg { background: linear-gradient(135deg, #1e90ff, #3742fa); color: #fff; box-shadow: 0 4px 20px rgba(30, 144, 255, 0.5); border: 1px solid #70a1ff; }
        </style>
    </head>
    <body>
        <div class="winner-ticker-banner"><div class="winner-ticker-text">🌱 ยินดีต้อนรับสู่กิจกรรมปลูกต้นไม้รับรางวัลใหญ่! รดปุ๋ยเร่งโตรับไอดีเกมพรีเมียมฟรี! 🌱</div></div>
        <div class="main-title-container">
            <div class="game-logo-badge">TREE PLANTING EVENT</div>
            <h1 class="main-title">กิจกรรมปลูกต้นไม้<br><span style="font-size: 20px; color: #2ed573;">--- GROWING TREE ---</span></h1>
            <div class="sub-title-box">✨ ซื้อปุ๋ยมาใส่ให้ต้นไม้โตไว 100% รับรางวัลใหญ่ก่อนใคร! ✨</div>
        </div>
        <div class="scifi-box">
            <div style="color: #2ed573; font-weight: bold; font-size: 16px; margin-bottom: 5px;">🌳 ระบบปลูกต้นไม้สะสมรางวัล</div>
            <div style="font-size: 12px; color: #00d2d3; margin-bottom: 20px;">✦ เข้าสู่ระบบเพื่อเริ่มปลูกและใส่ปุ๋ย ✦</div>
            <a href="/login" class="btn-scifi btn-login">🔑 เข้าสู่ระบบ</a>
            <a href="/register" class="btn-scifi btn-reg">📝 สมัครสมาชิก</a>
        </div>
        <div class="footer-copy">© TREE PLANTING EVENT ALL RIGHTS RESERVED.</div>
    </body>
    </html>
  `);
});

app.get("/register", async (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="th">
    <head><meta charset="UTF-8"><title>สมัครสมาชิก</title>
    <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;600&display=swap" rel="stylesheet">
    <style>
        ${exactSciFiCSS}
        .container { background: rgba(13, 30, 20, 0.94); padding: 25px; border-radius: 16px; display: inline-block; width: 360px; text-align: left; border: 1px solid #2ed573; margin-top:20px; box-shadow:0 0 25px rgba(46,213,115,0.3); position:relative; z-index:4; }
        label { display: block; margin-top: 10px; font-size: 13px; color:#dcdde1; }
        input { width: 100%; padding: 10px; margin-top: 5px; border-radius: 6px; border: 1px solid #25283c; background:#1b2e1e; color:#fff; box-sizing: border-box; font-family:'Kanit'; }
        button { width: 100%; background: linear-gradient(135deg, #2ed573, #17b978); color: #000; padding: 12px; border: none; border-radius: 6px; margin-top: 20px; font-weight: 800; cursor: pointer; font-family:'Kanit'; font-size:15px; }
        a { display: block; text-align: center; margin-top: 15px; color: #70a1ff; text-decoration: none; font-size: 13px; }
    </style></head>
    <body>
        <div class="container">
            <h2 style="color: #2ed573; text-align: center; margin-top:0;">📝 สมัครสมาชิก</h2>
            <p style="font-size:11px; color:#ffd700; text-align:center;">⚠️ บัญชีมีอายุใช้งาน 30 วันนับจากวันที่สมัคร</p>
            <form action="/register" method="POST">
                <label>Username:</label>
                <input type="text" name="username" required>
                <label>Password:</label>
                <input type="password" name="password" required>
                <label>ลิงก์ Facebook ส่วนตัว:</label>
                <input type="url" name="facebook_url" placeholder="https://www.facebook.com/your.profile" required>
                <button type="submit">ยืนยันการสมัคร</button>
            </form>
            <a href="/">กลับหน้าแรก</a>
        </div>
    </body></html>
  `);
});

app.post("/register", async (req, res) => {
  const { username, password, facebook_url } = req.body;
  try {
    const { error } = await supabase.from('users').insert([{ 
        username, password, facebook_url: facebook_url || '', points: 0, fertilizers: 0, total_spent: 0 
    }]);
    if (error) return res.send(`<script>alert("ชื่อผู้ใช้นี้ซ้ำในระบบแล้ว!"); window.location.href="/register";</script>`);
    res.send(`<script>alert("สมัครสำเร็จ! บัญชีใช้งานได้ 30 วัน"); window.location.href="/login";</script>`);
  } catch (err) {
    res.send(`<script>alert("เกิดข้อผิดพลาด"); window.location.href="/register";</script>`);
  }
});

app.get("/login", async (req, res) => {
  res.send(`
    <!DOCTYPE html><html lang="th"><head><meta charset="UTF-8"><title>เข้าสู่ระบบ</title>
    <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;600&display=swap" rel="stylesheet">
    <style>
        ${exactSciFiCSS}
        .container { background: rgba(13, 30, 20, 0.94); padding: 25px; border-radius: 16px; display: inline-block; width: 350px; text-align: left; border: 1px solid #2ed573; margin-top:30px; box-shadow:0 0 25px rgba(46,213,115,0.3); position:relative; z-index:4; }
        label { display: block; margin-top: 10px; font-size: 13px; color:#dcdde1; }
        input { width: 100%; padding: 10px; margin-top: 5px; border-radius: 6px; border: 1px solid #25283c; background:#1b2e1e; color:#fff; box-sizing: border-box; font-family:'Kanit'; }
        button { width: 100%; background: linear-gradient(135deg, #2ed573, #17b978); color: #000; padding: 12px; border: none; border-radius: 6px; margin-top: 20px; font-weight: 800; cursor: pointer; font-family:'Kanit'; font-size:15px; }
        a { display: block; text-align: center; margin-top: 15px; color: #70a1ff; text-decoration: none; font-size:13px; }
    </style></head>
    <body>
        <div class="container">
            <h2 style="color: #ffd700; text-align: center; margin-top:0;">🔑 เข้าสู่ระบบ</h2>
            <form action="/login" method="POST">
                <label>Username:</label>
                <input type="text" name="username" required>
                <label>Password:</label>
                <input type="password" name="password" required>
                <button type="submit">เข้าสู่ระบบ</button>
            </form>
            <a href="/">กลับหน้าแรก</a>
        </div>
    </body></html>
  `);
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (await checkUserExpiration(username)) {
      return res.send(`<script>alert("บัญชีของคุณหมดอายุการใช้งาน 30 วันแล้ว!"); window.location.href="/login";</script>`);
  }
  try {
    const { data: row } = await supabase.from('users').select('*').eq('username', username).eq('password', password).single();
    if (row) {
      res.redirect(`/lootbox?username=${row.username}`);
    } else {
      res.send(`<script>alert("รหัสผ่านหรือชื่อผู้ใช้ไม่ถูกต้อง!"); window.location.href="/login";</script>`);
    }
  } catch (err) {
    res.send(`<script>alert("เกิดข้อผิดพลาด"); window.location.href="/login";</script>`);
  }
});

// ------------------- 1. FERTILIZER STORE ROUTE (REPLACES CAPTION STORE) -------------------
app.get("/store", async (req, res) => {
  const username = req.query.username;
  if (!username) return res.redirect("/login");

  if (await checkUserExpiration(username)) {
      return res.send(`<script>alert("บัญชีของคุณหมดอายุการใช้งานแล้ว!"); window.location.href="/login";</script>`);
  }

  try {
    const [userRes, packagesRes, pendingRes, recentWinsRes] = await Promise.all([
      supabase.from('users').select('*').eq('username', username).single(),
      supabase.from('captions').select('*').order('price', { ascending: true }), // ใช้ตารางเดิมเก็บแพ็กเกจปุ๋ย
      supabase.from('pending_topup').select('*').eq('username', username).eq('status', 'pending'),
      supabase.from('history').select('username, reward').order('id', { ascending: false }).limit(5)
    ]);

    const user = userRes.data;
    if (!user) return res.redirect("/login");
    const packages = packagesRes.data || [];
    const pendingRows = pendingRes.data || [];

    let tickerHtml = "🌱 ซื้อปุ๋ยเร่งโตเพื่อรดน้ำต้นไม้สะสมเปอร์เซ็นต์รับรางวัลใหญ่! 🌱";
    if (recentWinsRes.data && recentWinsRes.data.length > 0) {
        tickerHtml = recentWinsRes.data.map(w => `🎉 คุณ <b>${w.username}</b> ได้รับ <span style="color:#ffd700;">${w.reward}</span>`).join(" &nbsp;&nbsp;|&nbsp;&nbsp; ");
    }

    let pendingHtml = pendingRows.length > 0 ? pendingRows.map(p => `<li style="color:#ffa502;">ยอดโอน <b>${p.exact_amount} บาท</b> (รอตรวจสอบ)</li>`).join("") : `<span style="color:#aaa; font-size:12px;">ไม่มีรายการรอดำเนินการ</span>`;

    let packagesCardsHtml = "";
    if (packages.length > 0) {
      packages.forEach(pkg => {
        packagesCardsHtml += `
          <div style="background:#13251a; border:1px solid #2ed573; border-radius:12px; padding:15px; text-align:left; display:flex; flex-direction:column; justify-content:space-between; box-shadow:0 0 15px rgba(46,213,115,0.15); margin-bottom:12px;">
              <div>
                  <div style="color:#ffd700; font-weight:bold; font-size:16px; margin-bottom:4px;">🛍️ ${pkg.title}</div>
                  <div style="font-size:13px; color:#a4b0be; margin-bottom:10px;">${pkg.content || 'ปุ๋ยเร่งโตคุณภาพสูง เพิ่มเปอร์เซ็นต์ต้นไม้'}</div>
              </div>
              <div>
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; font-size:13px;">
                      <span style="color:#2ed573; font-weight:bold;">💵 ราคา: ${pkg.price} แต้ม</span>
                      <span style="color:#00ff87; font-weight:bold; background:rgba(0,255,135,0.1); padding:2px 8px; border-radius:6px;">🧪 ได้ปุ๋ย ${pkg.tickets_bonus} ถุง (+${pkg.tickets_bonus}%)</span>
                  </div>
                  <form action="/buy-fertilizer" method="POST" onsubmit="return confirm('ยืนยันการซื้อแพ็กเกจนี้ (${pkg.price} แต้ม)?');">
                      <input type="hidden" name="username" value="${username}">
                      <input type="hidden" name="package_id" value="${pkg.id}">
                      <button type="submit" style="width:100%; background:linear-gradient(135deg, #2ed573, #17b978); color:#000; border:none; padding:10px; border-radius:6px; font-weight:bold; cursor:pointer; font-family:'Kanit'; font-size:13px;">🛒 ซื้อปุ๋ยทันที</button>
                  </form>
              </div>
          </div>
        `;
      });
    } else {
      packagesCardsHtml = `<div style="background:#13251a; border:1px dashed #2ed573; padding:20px; border-radius:12px; color:#a4b0be;">ยังไม่มีแพ็กเกจปุ๋ยในระบบ (แอดมินสามารถเพิ่มได้ที่หลังบ้าน)</div>`;
    }

    res.send(`
      <!DOCTYPE html>
      <html lang="th">
      <head>
          <meta charset="UTF-8">
          <title>🌱 ร้านค้าซื้อปุ๋ย - กิจกรรมปลูกต้นไม้</title>
          <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;600;800;900&display=swap" rel="stylesheet">
          <style>
              ${exactSciFiCSS}
              .user-bar { background: #1b2e1e; border: 1px solid #2ed573; border-radius: 10px; padding: 10px 15px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
              .btn-nav { background: #2ed573; color: #000; padding: 5px 12px; border-radius: 6px; text-decoration: none; font-size: 11px; font-weight: bold; }
              .wallet-box { background: #1b2e1e; border: 1px solid #ffd700; border-radius: 10px; padding: 10px; display: flex; justify-content: space-around; font-size: 14px; margin-bottom: 15px; font-weight: bold; color: #ffd700; }
              .topup-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; }
              .topup-card { background: #1b2e1e; border: 1px solid #2a4533; border-radius: 10px; padding: 10px; text-align: left; }
              input[type="number"] { width: 100%; padding: 6px; background: #13251a; border: 1px solid #33563e; color: #fff; border-radius: 4px; box-sizing: border-box; font-size: 12px; margin-bottom: 6px; font-family:'Kanit'; }
              .topup-sub-btn { width: 100%; padding: 6px; border: none; border-radius: 4px; font-weight: bold; font-size: 11px; cursor: pointer; font-family:'Kanit'; }
          </style>
      </head>
      <body>
          <div class="winner-ticker-banner"><div class="winner-ticker-text">${tickerHtml}</div></div>
          <div class="main-title-container">
              <div class="game-logo-badge">FERTILIZER STORE</div>
              <h1 class="main-title" style="font-size: 30px;">ร้านค้าซื้อปุ๋ยเร่งโต</h1>
              <div class="sub-title-box">✦ ซื้อปุ๋ยมาเติมใส่ต้นไม้ เพื่อเพิ่มเปอร์เซ็นต์การเจริญเติบโต ✦</div>
          </div>
          <div class="scifi-box" style="max-width: 520px;">
              <div class="user-bar">
                  <div style="text-align: left; font-size: 12px;">
                      <span style="color: #a4b0be; display: block; font-size: 10px;">ผู้ใช้งาน</span><b>${username}</b>
                  </div>
                  <div><a href="/lootbox?username=${username}" class="btn-nav">🌳 ไปหน้าปลูกต้นไม้</a></div>
              </div>
              <div class="wallet-box">
                  <div>💰 แต้ม: <span id="points">${user.points || 0}</span> ฿</div>
                  <div>🧪 ปุ๋ยในตัว: <span id="fertilizers" style="color:#00ff87;">${user.fertilizers || 0}</span> ถุง (1%=1ถุง)</div>
              </div>
              <div style="font-size:13px; color:#ffd700; text-align:left; margin-bottom:10px; font-weight:bold;">🛒 เลือกซื้อแพ็กเกจปุ๋ยเร่งโต:</div>
              ${packagesCardsHtml}
              <div style="font-size:14px; color:#ffd700; text-align:left; margin:20px 0 6px 0; font-weight:bold; border-left:3px solid #ffd700; padding-left:6px;">💳 เติมเงินเพื่อรับแต้ม (Points)</div>
              <div class="topup-grid">
                  <div class="topup-card">
                      <h4 style="color: #2ed573; margin:0 0 6px 0; font-size:12px;">📱 พร้อมเพย์</h4>
                      <form action="/create-topup" method="POST">
                          <input type="hidden" name="username" value="${username}">
                          <input type="hidden" name="topup_type" value="promptpay">
                          <input type="number" name="amount" placeholder="เช่น 50" required>
                          <button type="submit" class="topup-sub-btn" style="background:#2ed573; color:#fff;">สร้าง QR สแกน</button>
                      </form>
                  </div>
                  <div class="topup-card">
                      <h4 style="color: #ff4757; margin:0 0 6px 0; font-size:12px;">🧡 Wallet</h4>
                      <form action="/create-topup" method="POST">
                          <input type="hidden" name="username" value="${username}">
                          <input type="hidden" name="topup_type" value="truemoney">
                          <input type="number" name="amount" placeholder="เช่น 50" required>
                          <button type="submit" class="topup-sub-btn" style="background:#ff4757; color:#fff;">แจ้งโอนเงิน</button>
                      </form>
                  </div>
              </div>
              <div style="text-align:left; margin-top:12px; background:#1b2e1e; padding:8px; border-radius:6px; font-size:11px;">
                  <b style="color:#ffd700;">📌 สถานะการเติมเงิน:</b>
                  <ul style="padding-left:15px; margin:3px 0;">${pendingHtml}</ul>
              </div>
              <a href="/" style="display:block; margin-top:20px; color:#ff4757; text-decoration:none; font-size:12px; font-weight:bold;">ออกจากระบบ</a>
          </div>
          <div class="footer-copy">© TREE PLANTING EVENT ALL RIGHTS RESERVED.</div>
      </body>
      </html>
    `);
  } catch (err) {
    res.redirect("/login");
  }
});

app.post("/buy-fertilizer", async (req, res) => {
  const { username, package_id } = req.body;
  try {
      const [userRes, pkgRes] = await Promise.all([
          supabase.from('users').select('*').eq('username', username).single(),
          supabase.from('captions').select('*').eq('id', package_id).single()
      ]);
      const user = userRes.data;
      const pkg = pkgRes.data;
      if (!user || !pkg) return res.send(`<script>alert("ไม่พบข้อมูล"); window.location.href="/store?username=${username}";</script>`);

      const price = parseFloat(pkg.price) || 0;
      const bonusFertilizer = parseInt(pkg.tickets_bonus) || 0;

      if (user.points < price) {
          return res.send(`<script>alert("แต้มของคุณไม่พอ! กรุณาเติมเงินก่อน"); window.location.href="/store?username=${username}";</script>`);
      }

      await supabase.from('users').update({
          points: user.points - price,
          fertilizers: (user.fertilizers || 0) + bonusFertilizer,
          total_spent: (user.total_spent || 0) + price
      }).eq('username', username);

      res.send(`<script>alert("ซื้อปุ๋ยสำเร็จ! ได้รับปุ๋ยเพิ่ม +${bonusFertilizer} ถุง"); window.location.href="/lootbox?username=${username}";</script>`);
  } catch (e) {
      res.send(`<script>alert("เกิดข้อผิดพลาด"); window.location.href="/store?username=${username}";</script>`);
  }
});

// ------------------- 2. MAIN TREE PLANTING & GROWTH PAGE (REPLACES LOOTBOX) -------------------
app.get("/lootbox", async (req, res) => {
  const username = req.query.username;
  if (!username) return res.redirect("/login");

  if (await checkUserExpiration(username)) {
      return res.send(`<script>alert("บัญชีของคุณหมดอายุการใช้งานแล้ว!"); window.location.href="/login";</script>`);
  }

  try {
    const [userRes, treeRes, rewardsRes, pendingRes, pendingWithdrawRes, historyRes, recentWinsRes] = await Promise.all([
      supabase.from('users').select('*').eq('username', username).single(),
      supabase.from('user_trees').select('*').eq('username', username).single(),
      supabase.from('game_accounts').select('*').order('id', { ascending: true }), // ใช้ตารางรางวัลเดิมแสดงของรางวัลตามเปอร์เซ็นต์
      supabase.from('pending_topup').select('*').eq('username', username).eq('status', 'pending'),
      supabase.from('pending_withdraw').select('*').eq('username', username).eq('status', 'pending'),
      supabase.from('history').select('*').eq('username', username).eq('is_withdrawn', false),
      supabase.from('history').select('username, reward').order('id', { ascending: false }).limit(5)
    ]);

    const user = userRes.data;
    if (!user) return res.redirect("/login");
    
    let tree = treeRes.data;
    // ถ้ายังไม่มีต้นไม้ ให้สร้างให้อัตโนมัติ (ปุ่มปลูกต้นไม้)
    if (!tree) {
        const { data: newTree } = await supabase.from('user_trees').insert([{
            username: username,
            growth_percent: 0,
            planted_at: new Date()
        }]).select().single();
        tree = newTree;
    }

    const rewards = rewardsRes.data || [];
    const pendingWithdrawRows = pendingWithdrawRes.data || [];
    const hasPendingWithdraw = pendingWithdrawRows && pendingWithdrawRows.length > 0;
    const unwithdrawnHistory = historyRes.data || [];
    let hasClaimable = unwithdrawnHistory.length > 0;

    let claimButtonHtml = "";
    if (hasPendingWithdraw) {
      claimButtonHtml = `<div style="background: rgba(255, 165, 2, 0.15); border: 1px dashed #ffa502; padding: 10px; border-radius: 8px; margin-top: 10px; text-align: center; font-size:12px; color:#ffa502;">⏳ รอแอดมินตรวจสอบการรับรางวัลภายใน 24 ชม.</div>`;
    } else if (hasClaimable) {
      claimButtonHtml = `
        <form action="/request-withdraw" method="POST" style="margin-top:10px;">
            <input type="hidden" name="username" value="${username}">
            <button type="submit" style="width:100%; background:#00b900; color:#fff; padding:10px; border:none; border-radius:6px; font-weight:bold; font-size:13px; cursor:pointer;">🎁 ขอรับรางวัลต้นไม้ที่ได้รับแล้ว (ส่งให้แอดมิน)</button>
        </form>`;
    }

    // แสดงรายการรางวัลที่ Admin กำหนดคู่กับเปอร์เซ็นต์การโต
    let rewardsSidebarHtml = "";
    rewards.forEach(rew => {
        rewardsSidebarHtml += `
          <div style="background:#13251a; border:1px solid #2ed573; border-radius:8px; padding:8px; margin-bottom:6px; text-align:left; font-size:11px;">
              <div style="color:#ffd700; font-weight:bold;">🏆 ${rew.title}</div>
              <div style="color:#a4b0be;">เรต/เงื่อนไข: ระดับ ${rew.rarity || 'ทั่วไป'} | เติบโต: ${rew.pity_target || 100}%</div>
          </div>`;
    });

    let tickerHtml = "🌱 ยินดีต้อนรับสู่กิจกรรมปลูกต้นไม้รดปุ๋ยรับรางวัลใหญ่! 🌱";
    if (recentWinsRes.data && recentWinsRes.data.length > 0) {
        tickerHtml = recentWinsRes.data.map(w => `🎉 คุณ <b>${w.username}</b> ได้รับ <span style="color:#ffd700;">${w.reward}</span>`).join(" &nbsp;&nbsp;|&nbsp;&nbsp; ");
    }

    res.send(`
      <!DOCTYPE html>
      <html lang="th">
      <head>
          <meta charset="UTF-8">
          <title>🌳 หน้าปลูกต้นไม้ - กิจกรรมรดปุ๋ยรับรางวัล</title>
          <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;600;800;900&display=swap" rel="stylesheet">
          <style>
              ${exactSciFiCSS}
              .user-bar { background: #1b2e1e; border: 1px solid #2ed573; border-radius: 10px; padding: 10px 15px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
              .btn-nav { background: #2ed573; color: #000; padding: 5px 10px; border-radius: 6px; text-decoration: none; font-size: 11px; font-weight: bold; }
              .wallet-box { background: #1b2e1e; border: 1px solid #ffd700; border-radius: 10px; padding: 10px; display: flex; justify-content: space-around; font-size: 13.5px; margin-bottom: 10px; font-weight: bold; color: #ffd700; }
              .tree-display-box { background: rgba(0,0,0,0.4); border: 2px dashed #2ed573; border-radius: 15px; padding: 20px; margin: 15px 0; }
              .progress-bar-bg { background: #112215; border-radius: 10px; height: 20px; width: 100%; border: 1px solid #2ed573; overflow: hidden; margin: 10px 0; position: relative; }
              .progress-bar-fill { background: linear-gradient(90deg, #2ed573, #00d2d3); height: 100%; width: ${tree.growth_percent || 0}%; transition: width 0.4s ease; }
              .btn-action { background: linear-gradient(135deg, #2ed573, #17b978); color: #000; padding: 12px; border: none; border-radius: 8px; font-size: 14px; cursor: pointer; font-weight: bold; width: 100%; font-family:'Kanit'; box-shadow: 0 4px 15px rgba(46,213,115,0.4); }
          </style>
      </head>
      <body>
          <div class="winner-ticker-banner"><div class="winner-ticker-text">${tickerHtml}</div></div>
          <div class="main-title-container">
              <div class="game-logo-badge">TREE GROWING EVENT</div>
              <h1 class="main-title" style="font-size: 32px;">กิจกรรมปลูกต้นไม้</h1>
              <div class="sub-title-box">✦ รดปุ๋ยเร่งโตสะสมเปอร์เซ็นต์รับรางวัลพรีเมียม ✦</div>
          </div>
          <div class="scifi-box" style="max-width: 500px;">
              <div class="user-bar">
                  <div style="text-align: left; font-size: 12px;">
                      <span style="color: #a4b0be; display: block; font-size: 10px;">ผู้ใช้งาน</span><b>${username}</b>
                  </div>
                  <div style="display:flex; gap:5px;">
                      <a href="/store?username=${username}" class="btn-nav" style="background:#ffd700; color:#000;">🛒 ร้านขายปุ๋ย</a>
                      <a href="/my-history?username=${username}" class="btn-nav" style="background:#70a1ff; color:#000;">📜 ประวัติใส่ปุ๋ย</a>
                  </div>
              </div>

              <div class="wallet-box">
                  <div>🧪 ปุ๋ยในตัว: <span style="color:#00ff87;" id="user-fertilizer">${user.fertilizers || 0}</span> ถุง</div>
                  <div>📈 เติบโต: <span style="color:#ffd700;" id="tree-percent">${tree.growth_percent || 0}</span>%</div>
              </div>

              <div class="tree-display-box">
                  <div style="font-size: 55px;" id="tree-icon">🌳</div>
                  <div style="font-size: 14px; color: #2ed573; font-weight: bold; margin-top: 5px;" id="tree-status-text">ต้นไม้ของคุณกำลังเจริญเติบโต</div>
                  <div class="progress-bar-bg">
                      <div class="progress-bar-fill" id="progress-fill"></div>
                  </div>
                  <div style="font-size: 11px; color: #a4b0be;">ใส่ปุ๋ย 1 ถุง = โตขึ้น 1% (ครบ 100% รับรางวัลสูงสุดอัตโนมัติ)</div>
              </div>

              <div style="margin-bottom: 12px;">
                  <button class="btn-action" onclick="feedTree()">🧪 ใส่ปุ๋ยเร่งโต (ใช้ 1 ถุง = +1%)</button>
              </div>

              <div style="text-align: left; margin-top: 15px;">
                  <div style="font-size: 12px; color: #ffd700; font-weight: bold; margin-bottom: 5px;">🏆 รางวัลตามระดับการเติบโตของต้นไม้:</div>
                  <div style="max-height: 140px; overflow-y: auto; padding-right: 5px;">
                      ${rewardsSidebarHtml}
                  </div>
              </div>

              <div id="claim-btn-container">${claimButtonHtml}</div>
              <a href="/" style="display:block; margin-top:20px; color:#ff4757; text-decoration:none; font-size:12px; font-weight:bold;">ออกจากระบบ</a>
          </div>

          <div class="footer-copy">© TREE PLANTING EVENT ALL RIGHTS RESERVED.</div>

          <script>
              function feedTree() {
                  fetch('/feed-tree', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ username: '${username}', amount: 1 })
                  })
                  .then(res => res.json())
                  .then(data => {
                      if (!data.success) {
                          alert(data.message || "เกิดข้อผิดพลาด");
                          if(data.needFertilizer) window.location.href = "/store?username=${username}";
                          return;
                      }
                      document.getElementById('user-fertilizer').innerText = data.remainingFertilizers;
                      document.getElementById('tree-percent').innerText = data.growthPercent;
                      document.getElementById('progress-fill').style.width = data.growthPercent + '%';
                      
                      if(data.rewardWon) {
                          alert("🎉 ยินดีด้วย! ต้นไม้โตถึงเป้าหมาย ได้รับรางวัล: " + data.rewardWon);
                          location.reload();
                      } else {
                          alert("🧪 รดปุ๋ยสำเร็จ! ต้นไม้โตขึ้น +1% (ปัจจุบัน " + data.growthPercent + "%)");
                      }
                  })
                  .catch(err => alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้"));
              }
          </script>
      </body>
      </html>
    `);
  } catch (err) {
    res.redirect("/login");
  }
});

// ------------------- TREE FEEDING API -------------------
app.post("/feed-tree", async (req, res) => {
  const { username, amount } = req.body;
  try {
      const [userRes, treeRes, rewardsRes] = await Promise.all([
          supabase.from('users').select('*').eq('username', username).single(),
          supabase.from('user_trees').select('*').eq('username', username).single(),
          supabase.from('game_accounts').select('*').order('pity_target', { ascending: true })
      ]);

      const user = userRes.data;
      const tree = treeRes.data;
      if (!user || !tree) return res.json({ success: false, message: "ไม่พบข้อมูลผู้ใช้หรือต้นไม้" });

      const feedAmount = parseInt(amount) || 1;
      if ((user.fertilizers || 0) < feedAmount) {
          return res.json({ success: false, message: "ปุ๋ยในตัวของคุณหมดแล้ว! กรุณาไปซื้อปุ๋ยเพิ่มที่ร้านค้า", needFertilizer: true });
      }

      let newGrowth = (tree.growth_percent || 0) + feedAmount;
      let wonRewardName = null;

      // ตรวจสอบรางวัลเมื่อถึงเปอร์เซ็นต์ที่กำหนด
      const matchedReward = (rewardsRes.data || []).find(r => r.pity_target === newGrowth || (newGrowth >= 100 && r.pity_target >= 100));
      if (matchedReward) {
          wonRewardName = matchedReward.title;
          // บันทึกลงประวัติ history
          await supabase.from('history').insert([{
              username: username,
              facebook_url: user.facebook_url || '',
              reward: `🌳 [ต้นไม้โต ${newGrowth}%] ${wonRewardName}`,
              is_withdrawn: false
          }]);
      }

      // ถ้าโตครบ 100% ให้ Reset ต้นไม้และประวัติการใส่ปุ๋ยรอบนี้ตามโจทย์
      if (newGrowth >= 100) {
          newGrowth = 0; // Reset ต้นไม้
      }

      await Promise.all([
          supabase.from('users').update({ fertilizers: user.fertilizers - feedAmount }).eq('username', username),
          supabase.from('user_trees').update({ growth_percent: newGrowth }).eq('username', username),
          supabase.from('fertilizer_history').insert([{ username: username, amount: feedAmount, time: new Date().toLocaleString() }])
      ]);

      res.json({
          success: true,
          remainingFertilizers: user.fertilizers - feedAmount,
          growthPercent: newGrowth,
          rewardWon: wonRewardName
      });
  } catch (e) {
      res.json({ success: false, message: "เกิดข้อผิดพลาดในการรดปุ๋ย" });
  }
});

// ------------------- HISTORY ROUTE (SHOWS FERTILIZER FEED HISTORY) -------------------
app.get("/my-history", async (req, res) => {
  const username = req.query.username;
  if (!username) return res.redirect("/login");

  const { data: rows } = await supabase
    .from('fertilizer_history')
    .select('*')
    .eq('username', username)
    .order('id', { ascending: false });

  let historyList = "";
  if (rows && rows.length > 0) {
    rows.forEach((r, index) => {
      historyList += `<tr><td style="padding:8px;">${index + 1}</td><td style="padding:8px; color:#2ed573;"><b>ใส่ปุ๋ย ${r.amount} ถุง</b></td><td style="padding:8px;">${r.time || '-'}</td></tr>`;
    });
  } else {
    historyList = `<tr><td colspan="3" style="padding:15px; color:#aaa;">ยังไม่มีประวัติการใส่ปุ๋ยในรอบนี้</td></tr>`;
  }

  res.send(`
    <!DOCTYPE html>
    <html lang="th">
    <head><meta charset="UTF-8"><title>ประวัติการใส่ปุ๋ย</title>
    <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;600&display=swap" rel="stylesheet">
    <style>
        ${exactSciFiCSS}
        .container { background: rgba(13, 30, 20, 0.95); padding: 30px; display: inline-block; border-radius: 10px; width: 500px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); border: 1px solid #2ed573; margin-top:30px; position:relative; z-index:4; }
        table { width: 100%; border-collapse: collapse; background: #1b2e1e; border-color: #444; margin-bottom: 20px; font-size: 14px; }
        th { padding: 10px; background: #224029; color: #ffd700; }
        a { display: inline-block; background: #70a1ff; color: #fff; padding: 10px 20px; border-radius: 5px; text-decoration: none; font-weight: bold; }
    </style></head>
    <body>
        <div class="container">
            <h2 style="color:#ffd700;">📜 ประวัติการใส่ปุ๋ยของ: ${username}</h2>
            <table border="1">
                <tr><th>ลำดับ</th><th>รายการ</th><th>เวลา</th></tr>
                ${historyList}
            </table>
            <a href="/lootbox?username=${username}">⬅️ กลับหน้าปลูกต้นไม้</a>
        </div>
    </body></html>
  `);
});

// ------------------- REMAINDER SYSTEM: WITHDRAW, TOPUP, ADMIN (KEPT INTACT) -------------------
app.post("/request-withdraw", async (req, res) => {
  const { username } = req.body;
  const [userHistoryRes, userDataRes] = await Promise.all([
    supabase.from('history').select('*').eq('username', username).eq('is_withdrawn', false),
    supabase.from('users').select('facebook_url').eq('username', username).single()
  ]);

  const userHistory = userHistoryRes.data;
  if (!userHistory || userHistory.length === 0) {
    return res.send(`<script>alert("คุณไม่มีรางวัลที่จะขอรับ!"); window.location.href="/lootbox?username=${username}";</script>`);
  }

  let fullDetailedList = userHistory.map(h => h.reward);
  await Promise.all([
    supabase.from('pending_withdraw').insert([{
      username: username,
      facebook_url: userDataRes.data?.facebook_url || '',
      total_opens: userHistory.length,
      total_robux: userHistory.length,
      status: 'pending',
      history_snapshot: JSON.stringify(fullDetailedList)
    }]),
    supabase.from('history').update({ is_withdrawn: true }).in('id', userHistory.map(h => h.id))
  ]);

  res.send(`<script>alert("ส่งคำขอรับรางวัลสำเร็จ! แอดมินจะติดต่อกลับทาง Facebook"); window.location.href="/lootbox?username=${username}";</script>`);
});

app.post("/create-topup", (req, res) => {
  const { username, amount, topup_type } = req.body;
  const exactAmount = parseFloat(amount).toFixed(2);
  const qrCodeUrl = `https://promptpay.io/${MY_PROMPTPAY_NUMBER}/${exactAmount}.png`;

  res.send(`
    <!DOCTYPE html><html lang="th"><head><meta charset="UTF-8"><title>เติมเงิน</title>
    <style>${exactSciFiCSS} .box { background: rgba(13, 30, 20, 0.95); padding: 25px; display: inline-block; border-radius: 10px; width: 380px; text-align: left; border: 1px solid #2ed573; margin-top:30px; position:relative; z-index:4; }</style></head>
    <body>
        <div class="box">
            <h2 style="color:#2ed573; text-align:center;">📱 สแกนจ่ายพร้อมเพย์ / Wallet</h2>
            <p style="text-align:center;">โอนเข้าเบอร์: <b>${MY_PROMPTPAY_NUMBER}</b> (${MY_ACCOUNT_NAME})</p>
            <div style="background:#fff; padding:10px; text-align:center; border-radius:8px; margin:10px 0;"><img src="${qrCodeUrl}" style="width:180px; height:180px;"></div>
            <h2 style="color:#ffd700; text-align:center;">${exactAmount} บาท</h2>
            <form action="/upload-slip" method="POST" enctype="multipart/form-data">
                <input type="hidden" name="username" value="${username}">
                <input type="hidden" name="exact_amount" value="${exactAmount}">
                <input type="hidden" name="topup_type" value="${topup_type}">
                <label style="font-size:13px; display:block; margin-bottom:5px;">📤 อัปโหลดสลิป:</label>
                <input type="file" name="slip_img" accept="image/*" required style="background:#fff; color:#000; padding:5px; width:100%; box-sizing:border-box;">
                <button type="submit" style="width:100%; background:#2ed573; color:#fff; padding:12px; border:none; border-radius:5px; font-weight:bold; cursor:pointer; margin-top:15px;">ส่งสลิปให้แอดมิน</button>
            </form>
            <a href="/store?username=${username}" style="display:block; text-align:center; margin-top:15px; color:#70a1ff; text-decoration:none;">กลับหน้าร้านค้า</a>
        </div>
    </body></html>
  `);
});

app.post("/upload-slip", upload.single('slip_img'), async (req, res) => {
  const { username, exact_amount, topup_type } = req.body;
  try {
    const slipImg = await uploadToSupabaseStorage(req.file);
    await supabase.from('pending_topup').insert([{ username, exact_amount: parseFloat(exact_amount), slip_img: slipImg, status: 'pending', topup_type }]);
    res.send(`<script>alert("ส่งสลิปสำเร็จ! รอแอดมินตรวจสอบ"); window.location.href="/store?username=${username}";</script>`);
  } catch (err) {
    res.send(`<script>alert("เกิดข้อผิดพลาด"); window.location.href="/store?username=${username}";</script>`);
  }
});

// ------------------- ADMIN DASHBOARD -------------------
app.get("/admin", async (req, res) => {
  if (req.session.isAdmin) return renderAdminDashboard(req, res);
  res.send(`
    <body style="background:#13251a; color:#fff; text-align:center; padding-top:80px; font-family:sans-serif;">
      <div style="background:#1b2e1e; padding:30px; display:inline-block; border-radius:10px; border:1px solid #2ed573;">
        <h2>🛠️ เข้าสู่ระบบแอดมิน</h2>
        <form action="/admin/login" method="POST">
          <input type="password" name="password" placeholder="รหัสผ่านแอดมิน" style="padding:10px; width:240px; border-radius:4px; border:none;" required>
          <button type="submit" style="padding:10px 15px; background:#2ed573; color:#000; border:none; border-radius:4px; font-weight:bold; cursor:pointer; margin-top:10px; width:100%;">เข้าสู่ระบบ</button>
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

app.post("/admin/approve-topup", async (req, res) => {
  if (!req.session.isAdmin) return res.redirect("/admin");
  const { topup_id, username, exact_amount } = req.body;
  const pointsToAdd = Math.floor(parseFloat(exact_amount));
  const { data: user } = await supabase.from('users').select('points').eq('username', username).single();
  if (user) await supabase.from('users').update({ points: (user.points || 0) + pointsToAdd }).eq('username', username);
  await supabase.from('pending_topup').update({ status: 'completed' }).eq('id', topup_id);
  res.send(`<script>alert("อนุมัติยอดเงินและเพิ่ม ${pointsToAdd} แต้มสำเร็จ!"); window.location.href="/admin";</script>`);
});

app.post("/admin/approve-withdraw", async (req, res) => {
  if (!req.session.isAdmin) return res.redirect("/admin");
  const { withdraw_id, username } = req.body;
  await Promise.all([
    supabase.from('pending_withdraw').update({ status: 'completed' }).eq('id', withdraw_id),
    supabase.from('history').delete().eq('username', username).eq('is_withdrawn', true)
  ]);
  res.send(`<script>alert("อนุมัติรางวัลสำเร็จ!"); window.location.href="/admin";</script>`);
});

app.post("/admin/add-game-account-json", upload.single('image_file'), async (req, res) => {
  if (!req.session.isAdmin) return res.status(403).json({ success: false });
  const { title, rarity, rate, pity_target } = req.body;
  let imageUrl = await uploadToSupabaseStorage(req.file);
  const { data, error } = await supabase.from('game_accounts').insert([{
      title, rarity: rarity || 'Normal', rate: parseFloat(rate) || 1.0, pity_target: parseInt(pity_target) || 100, image_url: imageUrl, status: 'available'
  }]).select();
  if (error) return res.json({ success: false, message: error.message });
  res.json({ success: true, newAccount: data[0] });
});

app.post("/admin/delete-game-account", async (req, res) => {
  if (!req.session.isAdmin) return res.redirect("/admin");
  await supabase.from('game_accounts').delete().eq('id', req.body.acc_id);
  res.send(`<script>alert("ลบรางวัลสำเร็จ!"); window.location.href="/admin";</script>`);
});

app.post("/admin/add-caption", async (req, res) => {
  if (!req.session.isAdmin) return res.redirect("/admin");
  const { title, content, price, tickets_bonus } = req.body;
  await supabase.from('captions').insert([{ title, content, price: parseFloat(price) || 0, tickets_bonus: parseInt(tickets_bonus) || 0 }]);
  res.send(`<script>alert("เพิ่มแพ็กเกจปุ๋ยสำเร็จ!"); window.location.href="/admin";</script>`);
});

app.post("/admin/delete-caption", async (req, res) => {
  if (!req.session.isAdmin) return res.redirect("/admin");
  await supabase.from('captions').delete().eq('id', req.body.caption_id);
  res.send(`<script>alert("ลบสำเร็จ!"); window.location.href="/admin";</script>`);
});

async function renderAdminDashboard(req, res) {
  const [usersRes, pendingRes, pendingWithdrawRes, gameAccRes, captionsRes] = await Promise.all([
    supabase.from('users').select('*').order('id', { ascending: false }),
    supabase.from('pending_topup').select('*').eq('status', 'pending'),
    supabase.from('pending_withdraw').select('*').eq('status', 'pending'),
    supabase.from('game_accounts').select('*').order('id', { ascending: false }),
    supabase.from('captions').select('*').order('id', { ascending: false })
  ]);

  res.send(`
    <body style="background:#13251a; color:#fff; text-align:center; padding:20px; font-family:sans-serif;">
      <h2>🛠️ ระบบหลังบ้านแอดมิน (กิจกรรมปลูกต้นไม้)</h2>
      <a href="/admin/logout" style="color:#ff4757; font-weight:bold;">🔒 ออกจากระบบ</a> | <a href="/" style="color:#70a1ff;">🏠 หน้าแรก</a>

      <div style="background:#1b2e1e; padding:20px; border-radius:10px; border:1px solid #2ed573; width:900px; margin:20px auto; text-align:left;">
          <h3 style="color:#ffd700; margin-top:0;">🏆 กำหนดของรางวัลตามเปอร์เซ็นต์การโตของต้นไม้ (เป้าหมาย %)</h3>
          <form id="add-game-form" onsubmit="addRewardDynamic(event)" style="display:flex; gap:8px; align-items:center; margin-bottom:15px;">
              <input type="text" id="new-title" placeholder="ชื่อรางวัล เช่น ไอดี Line Rangers SSR" required style="padding:8px; flex:2;">
              <input type="text" id="new-rarity" placeholder="ระดับ เช่น SSR" required style="padding:8px; width:90px;">
              <input type="number" id="new-pity" placeholder="โตถึง %" required style="padding:8px; width:90px;">
              <button type="submit" style="background:#2ed573; color:#000; border:none; border-radius:5px; font-weight:bold; cursor:pointer; padding:9px 15px;">➕ เพิ่มรางวัล</button>
          </form>
          <table border="1" style="width:100%; border-collapse:collapse; background:#13251a; border-color:#444; font-size:12px; text-align:center;">
             <tr style="background:#224029;"><th>ชื่อรางวัล</th><th>ระดับ</th><th>เป้าหมายเปอร์เซ็นต์โต (%)</th><th>จัดการ</th></tr>
             ${(gameAccRes.data || []).map(acc => `<tr><td><b>${acc.title}</b></td><td>${acc.rarity}</td><td style="color:#ffd700;"><b>${acc.pity_target}%</b></td><td><form action="/admin/delete-game-account" method="POST" style="margin:0;"><input type="hidden" name="acc_id" value="${acc.id}"><button type="submit" style="background:#ff4757; color:#fff; border:none; padding:3px 8px; border-radius:4px; cursor:pointer;">ลบ</button></form></td></tr>`).join('')}
          </table>
      </div>

      <div style="background:#1b2e1e; padding:20px; border-radius:10px; border:1px solid #2ed573; width:900px; margin:20px auto; text-align:left;">
          <h3 style="color:#00d2d3; margin-top:0;">🛒 จัดการแพ็กเกจขายปุ๋ยในร้านค้า</h3>
          <form action="/admin/add-caption" method="POST" style="display:flex; gap:8px; align-items:center; margin-bottom:15px;">
              <input type="text" name="title" placeholder="ชื่อแพ็กเกจ เช่น ถุงปุ๋ยใหญ่พิเศษ" required style="padding:8px; flex:2;">
              <input type="text" name="content" placeholder="รายละเอียด" style="padding:8px; flex:2;">
              <input type="number" name="price" placeholder="ราคา (แต้ม)" required style="padding:8px; width:90px;">
              <input type="number" name="tickets_bonus" placeholder="จำนวนปุ๋ย (ถุง)" required style="padding:8px; width:90px;">
              <button type="submit" style="background:#00d2d3; color:#000; border:none; border-radius:5px; font-weight:bold; cursor:pointer; padding:9px 15px;">➕ เพิ่มแพ็กเกจ</button>
          </form>
          <table border="1" style="width:100%; border-collapse:collapse; background:#13251a; border-color:#444; font-size:12px; text-align:center;">
              <tr style="background:#224029;"><th>ชื่อแพ็กเกจ</th><th>รายละเอียด</th><th>ราคา</th><th>จำนวนปุ๋ยที่ได้</th><th>จัดการ</th></tr>
              ${(captionsRes.data || []).map(c => `<tr><td><b>${c.title}</b></td><td>${c.content}</td><td style="color:#2ed573;">${c.price} แต้ม</td><td style="color:#ffd700;">+${c.tickets_bonus} ถุง</td><td><form action="/admin/delete-caption" method="POST" style="margin:0;"><input type="hidden" name="caption_id" value="${c.id}"><button type="submit" style="background:#ff4757; color:#fff; border:none; padding:3px 8px; border-radius:4px; cursor:pointer;">ลบ</button></form></td></tr>`).join('')}
          </table>
      </div>

      <h3 style="color:#ffd700;">🎁 รายการคำขอรับรางวัลจากผู้เล่น</h3>
      <table border="1" style="margin: 0 auto 30px auto; border-collapse: collapse; width: 900px; background:#1b2e1e; border-color:#444;">
        <tr style="background:#224029;"><th>Username</th><th>Facebook</th><th>รางวัล</th><th>จัดการ</th></tr>
        ${(pendingWithdrawRows.data || pendingWithdrawRows || []).map(w => `<tr><td><b>${w.username}</b></td><td><a href="${w.facebook_url}" target="_blank" style="color:#70a1ff;">เฟซบุ๊ก</a></td><td>${w.history_snapshot}</td><td><form action="/admin/approve-withdraw" method="POST"><input type="hidden" name="withdraw_id" value="${w.id}"><input type="hidden" name="username" value="${w.username}"><button type="submit" style="background:#2ed573; color:#fff; border:none; padding:5px 10px; cursor:pointer;">อนุมัติ</button></form></td></tr>`).join('')}
      </table>

      <script>
          async function addRewardDynamic(event) {
              event.preventDefault();
              const formData = new FormData();
              formData.append('title', document.getElementById('new-title').value);
              formData.append('rarity', document.getElementById('new-rarity').value);
              formData.append('rate', 1);
              formData.append('pity_target', document.getElementById('new-pity').value);
              const res = await fetch('/admin/add-game-account-json', { method: 'POST', body: formData });
              const result = await res.json();
              if (result.success) location.reload();
              else alert("เกิดข้อผิดพลาด");
          }
      </script>
    </body>
  `);
}

app.listen(PORT, () => {
  console.log("Tree Planting Server running on port " + PORT);
});