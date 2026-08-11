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
    secret: process.env.SESSION_SECRET || 'tree_garden_secret_2026',
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
                    supabase.from('pending_withdraw').delete().eq('username', username)
                ]);
                return true; 
            }
        }
    } catch (e) {}
    return false; 
}

function parsePityCounters(val) {
    if (!val) return {};
    if (typeof val === 'object') return val;
    try {
        return JSON.parse(val);
    } catch (e) {
        return {};
    }
}

// ------------------- EXACT THEME CSS (TREE & GARDEN) -------------------
const exactSciFiCSS = `
    * { box-sizing: border-box; }
    body { 
        background: radial-gradient(circle at 50% 30%, #113a2b 0%, #071f16 50%, #030c08 100%);
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
            radial-gradient(circle at 15% 25%, rgba(46, 213, 115, 0.25) 0%, transparent 45%),
            radial-gradient(circle at 85% 30%, rgba(0, 210, 211, 0.25) 0%, transparent 45%),
            radial-gradient(circle at 50% 85%, rgba(255, 165, 2, 0.2) 0%, transparent 55%),
            linear-gradient(to bottom, rgba(3,12,8,0.8), rgba(7,31,22,0.95));
        pointer-events: none;
        z-index: 0;
    }
    .winner-ticker-banner {
        background: linear-gradient(90deg, #2ed573, #ffa502, #2ed573);
        background-size: 300% 300%;
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
        display: flex; align-items: center; gap: 6px;
        backdrop-filter: blur(5px);
        color: #fff;
        cursor: pointer;
    }
    .main-title-container {
        position: relative;
        padding-top: 25px;
        z-index: 4;
    }
    .game-logo-badge {
        background: linear-gradient(90deg, #2ed573, #ffd700);
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
        text-shadow: 0 0 30px rgba(46, 255, 115, 0.4);
        letter-spacing: 2px;
    }
    .sub-title-box {
        font-size: 13px;
        color: #2ed573;
        margin-top: 8px;
        font-weight: 600;
        text-shadow: 0 0 10px rgba(46,213,115,0.4);
    }
    .scifi-box {
        background: rgba(10, 26, 19, 0.94);
        backdrop-filter: blur(25px);
        border: 2px solid #2ed573;
        border-radius: 24px;
        box-shadow: 0 0 50px rgba(46, 213, 115, 0.3), inset 0 0 25px rgba(46, 213, 115, 0.1);
        position: relative;
        z-index: 4;
        margin: 20px auto;
        padding: 25px;
        width: 92%;
        max-width: 440px;
    }
    .footer-copy {
        font-size: 10px;
        color: #718093;
        margin: 20px 0 15px 0;
        z-index: 4;
        position: relative;
        letter-spacing: 0.5px;
    }
`;

// ------------------- TICKER API -------------------
app.get("/api/ticker", async (req, res) => {
  try {
      const { data: recentWins } = await supabase
          .from('history')
          .select('username, reward')
          .not('reward', 'ilike', '%เกลือ%')
          .order('id', { ascending: false })
          .limit(8);

      let tickerHtml = "🌱 ยินดีต้อนรับสู่ TREE GARDEN สวนต้นไม้ดิจิทัล ใส่ปุ๋ยเร่งโตรับรางวัลใหญ่ได้แล้ววันนี้! 🌱";
      if (recentWins && recentWins.length > 0) {
          let parts = recentWins.map(w => `🎉 คุณ <b>${w.username}</b> ต้นไม้โตจนได้รับรางวัล <span style="color:#ffd700;">${w.reward}</span>`);
          tickerHtml = parts.join(" &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp; ");
      }
      res.json({ success: true, tickerHtml });
  } catch (e) {
      res.json({ success: false });
  }
});

// ------------------- FRONTEND ROUTES -------------------

app.get("/", async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.send(`
    <!DOCTYPE html>
    <html lang="th">
    <head>
        <meta charset="UTF-8">
        <title>🌳 TREE GARDEN - หน้าแรก</title>
        <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;600;800;900&display=swap" rel="stylesheet">
        <style>
            ${exactSciFiCSS}
            .btn-scifi { display: block; width: 100%; padding: 14px; margin: 15px 0; border-radius: 12px; font-size: 16px; font-weight: 800; text-decoration: none; font-family: 'Kanit'; cursor: pointer; }
            .btn-login { background: linear-gradient(135deg, #2ed573, #17b978); color: #000; box-shadow: 0 4px 20px rgba(46, 213, 115, 0.5); border: 1px solid #7efff5; }
            .btn-reg { background: linear-gradient(135deg, #1e90ff, #3742fa); color: #fff; box-shadow: 0 4px 20px rgba(30, 144, 255, 0.5); border: 1px solid #70a1ff; }
        </style>
    </head>
    <body>
        <div class="winner-ticker-banner"><div class="winner-ticker-text">🌱 ยินดีต้อนรับสู่ TREE GARDEN สวนต้นไม้ดิจิทัล ใส่ปุ๋ยเร่งโตรับรางวัลใหญ่ได้แล้ววันนี้! 🌱</div></div>
        <div class="main-title-container">
            <div class="game-logo-badge">TREE GARDEN</div>
            <h1 class="main-title">TREE<br>GARDEN<br><span style="font-size: 20px; letter-spacing: 6px; color: #2ed573;">--- V 1.0 ---</span></h1>
            <div class="sub-title-box">✨ ระบบปลูกต้นไม้ ซื้อปุ๋ยเร่งโต และรับรางวัลอัตโนมัติตามระยะเวลา ✨</div>
        </div>
        <div class="scifi-box">
            <a href="/login" class="btn-scifi btn-login">🔑 เข้าสู่สวนต้นไม้</a>
            <a href="/register" class="btn-scifi btn-reg">📝 สมัครสมาชิก</a>
        </div>
        <div class="footer-copy">© TREE GARDEN ALL RIGHTS RESERVED.</div>
    </body>
    </html>
  `);
});

app.get("/register", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="th">
    <head><meta charset="UTF-8"><title>สมัครสมาชิก</title><link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;600&display=swap" rel="stylesheet">
    <style>${exactSciFiCSS}
    .container { background: rgba(10, 26, 19, 0.94); padding: 25px; border-radius: 16px; display: inline-block; width: 360px; text-align: left; border: 1px solid #2ed573; margin-top:20px; }</style>
    </head>
    <body>
        <div class="container" style="display:inline-block; position:relative; z-index:4;">
            <h2 style="color:#2ed573; text-align:center;">📝 สมัครสมาชิก</h2>
            <p style="font-size:11px; color:#ffd700; text-align:center;">⚠️ บัญชีมีอายุใช้งาน 30 วัน</p>
            <form action="/register" method="POST">
                <label>Username:</label>
                <input type="text" name="username" required style="width:100%; padding:10px; margin:5px 0 10px 0; background:#071f16; color:#fff; border:1px solid #2ed573; border-radius:6px; box-sizing:border-box; font-family:'Kanit';">
                <label>Password:</label>
                <input type="password" name="password" required style="width:100%; padding:10px; margin:5px 0 10px 0; background:#071f16; color:#fff; border:1px solid #2ed573; border-radius:6px; box-sizing:border-box; font-family:'Kanit';">
                <label>ลิงก์ Facebook ส่วนตัว:</label>
                <input type="url" name="facebook_url" placeholder="https://www.facebook.com/..." required style="width:100%; padding:10px; margin:5px 0 15px 0; background:#071f16; color:#fff; border:1px solid #2ed573; border-radius:6px; box-sizing:border-box; font-family:'Kanit';">
                <button type="submit" style="width:100%; background:#2ed573; color:#000; padding:12px; border:none; border-radius:6px; font-weight:bold; cursor:pointer; font-family:'Kanit';">ยืนยันการสมัคร</button>
            </form>
            <a href="/" style="display:block; text-align:center; margin-top:15px; color:#70a1ff; text-decoration:none;">กลับหน้าแรก</a>
        </div>
    </body>
    </html>
  `);
});

app.post("/register", async (req, res) => {
  const { username, password, facebook_url } = req.body;
  try {
    const { error } = await supabase.from('users').insert([{ 
        username, 
        password, 
        facebook_url: facebook_url || '',
        points: 0, 
        tickets: 0, // เก็บไว้ใช้เป็นแต้มปุ๋ยหรือสิทธิ์เร่งโต
        total_spent: 0,
        tree_exp: 0,
        tree_level: 1,
        planted_at: new Date()
    }]);

    if (error) {
      return res.send(`<script>alert("ชื่อผู้ใช้นี้ซ้ำในระบบแล้ว!"); window.location.href="/register";</script>`);
    }
    res.send(`<script>alert("สมัครสมาชิกสำเร็จ! ต้นไม้ของคุณเริ่มปลูกแล้ว กรุณาเข้าสู่ระบบ"); window.location.href="/login";</script>`);
  } catch (err) {
    res.send(`<script>alert("เกิดข้อผิดพลาด"); window.location.href="/register";</script>`);
  }
});

app.get("/login", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="th">
    <head><meta charset="UTF-8"><title>เข้าสู่ระบบ</title><link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;600&display=swap" rel="stylesheet">
    <style>${exactSciFiCSS}
    .container { background: rgba(10, 26, 19, 0.94); padding: 25px; border-radius: 16px; display: inline-block; width: 350px; text-align: left; border: 1px solid #2ed573; margin-top:30px; }</style>
    </head>
    <body>
        <div class="container" style="display:inline-block; position:relative; z-index:4;">
            <h2 style="color:#ffd700; text-align:center;">🔑 เข้าสู่ระบบ</h2>
            <form action="/login" method="POST">
                <label>Username:</label>
                <input type="text" name="username" required style="width:100%; padding:10px; margin:5px 0 10px 0; background:#071f16; color:#fff; border:1px solid #2ed573; border-radius:6px; box-sizing:border-box; font-family:'Kanit';">
                <label>Password:</label>
                <input type="password" name="password" required style="width:100%; padding:10px; margin:5px 0 15px 0; background:#071f16; color:#fff; border:1px solid #2ed573; border-radius:6px; box-sizing:border-box; font-family:'Kanit';">
                <button type="submit" style="width:100%; background:#ffd700; color:#000; padding:12px; border:none; border-radius:6px; font-weight:bold; cursor:pointer; font-family:'Kanit';">เข้าสู่ระบบ</button>
            </form>
            <a href="/" style="display:block; text-align:center; margin-top:15px; color:#70a1ff; text-decoration:none;">กลับหน้าแรก</a>
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
    const { data: row } = await supabase.from('users').select('*').eq('username', username).eq('password', password).single();
    if (row) {
      res.redirect(`/lootbox?username=${row.username}`);
    } else {
      res.send(`<script>alert("รหัสผ่านหรือชื่อผู้ใช้ไม่ถูกต้อง!"); window.location.href="/login";</script>`);
    }
  } catch (err) {
    res.send(`<script>alert("รหัสผ่านหรือชื่อผู้ใช้ไม่ถูกต้อง!"); window.location.href="/login";</script>`);
  }
});

// API สถานะผู้ใช้สำหรับหน้าเว็บต้นไม้
app.get("/api/user-status", async (req, res) => {
  const username = req.query.username;
  if (!username) return res.json({ success: false });

  try {
    const [userRes, pendingRes, pendingWithdrawRes, historyRes, gameAccRes] = await Promise.all([
      supabase.from('users').select('*').eq('username', username).single(),
      supabase.from('pending_topup').select('*').eq('username', username).eq('status', 'pending'),
      supabase.from('pending_withdraw').select('*').eq('username', username).eq('status', 'pending'),
      supabase.from('history').select('*').eq('username', username).eq('is_withdrawn', false),
      supabase.from('game_accounts').select('*').order('id', { ascending: true })
    ]);

    const user = userRes.data;
    res.json({
      success: true,
      points: user ? user.points : 0,
      tickets: user ? (user.tickets || 0) : 0,
      tree_exp: user ? (user.tree_exp || 0) : 0,
      tree_level: user ? (user.tree_level || 1) : 1,
      pendingRows: pendingRes.data || [],
      hasPendingWithdraw: pendingWithdrawRes.data && pendingWithdrawRes.data.length > 0,
      gameAccounts: gameAccRes.data || []
    });
  } catch (e) {
    res.json({ success: false });
  }
});

// ------------------- STORE / BUY FERTILIZER ROUTE -------------------
app.get("/store", async (req, res) => {
  const username = req.query.username;
  if (!username) return res.redirect("/login");

  const isExpired = await checkUserExpiration(username);
  if (isExpired) {
      return res.send(`<script>alert("บัญชีของคุณหมดอายุการใช้งาน 30 วันแล้ว!"); window.location.href="/login";</script>`);
  }

  try {
    const [userRes, captionsRes, pendingRes] = await Promise.all([
      supabase.from('users').select('*').eq('username', username).single(),
      supabase.from('captions').select('*').order('price', { ascending: true }),
      supabase.from('pending_topup').select('*').eq('username', username).eq('status', 'pending')
    ]);

    const user = userRes.data;
    if (!user) return res.redirect("/login");
    const captions = captionsRes.data || [];

    let captionsCardsHtml = "";
    if (captions.length > 0) {
      captions.forEach(cap => {
        captionsCardsHtml += `
          <div style="background:#071f16; border:1px solid #2ed573; border-radius:12px; padding:15px; text-align:left; display:flex; flex-direction:column; justify-content:space-between; margin-bottom:10px;">
              <div>
                  <div style="color:#ffd700; font-weight:bold; font-size:15px; margin-bottom:4px;">🧪 ${cap.title}</div>
                  <div style="font-size:12px; color:#a4b0be; margin-bottom:10px;">เพิ่มแต้ม/สิทธิ์ใส่ปุ๋ยให้ต้นไม้ของคุณเติบโตไวขึ้น</div>
              </div>
              <div>
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; font-size:13px;">
                      <span style="color:#2ed573; font-weight:bold;">💵 ราคา: ${cap.price} แต้ม</span>
                      <span style="color:#00ff87; font-weight:bold;">🎁 แถมสิทธิ์ปุ๋ย ${cap.tickets_bonus} ครั้ง</span>
                  </div>
                  <form action="/buy-caption" method="POST">
                      <input type="hidden" name="username" value="${username}">
                      <input type="hidden" name="caption_id" value="${cap.id}">
                      <button type="submit" style="width:100%; background:linear-gradient(135deg, #2ed573, #17b978); color:#000; border:none; padding:10px; border-radius:6px; font-weight:bold; cursor:pointer; font-family:'Kanit';">🛒 ซื้อปุ๋ยเร่งโต</button>
                  </form>
              </div>
          </div>
        `;
      });
    } else {
      captionsCardsHtml = `<div style="color:#a4b0be; padding:15px;">ยังไม่มีแพ็กเกจปุ๋ยในระบบร้านค้า (แอดมินสามารถเพิ่มได้หลังบ้าน)</div>`;
    }

    let pendingHtml = "";
    (pendingRes.data || []).forEach(p => {
      pendingHtml += `<li style="color:#ffa502;">ยอดโอน <b>${p.exact_amount} บาท</b> (รอตรวจสอบสลิป)</li>`;
    });

    res.send(`
      <!DOCTYPE html>
      <html lang="th">
      <head>
          <meta charset="UTF-8"><title>ร้านค้าปุ๋ยเร่งโต</title>
          <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;600&display=swap" rel="stylesheet">
          <style>${exactSciFiCSS}</style>
      </head>
      <body>
          <div class="winner-ticker-banner"><div class="winner-ticker-text">🌱 ร้านค้าจำหน่ายปุ๋ยสูตรพิเศษสำหรับเร่งโตต้นไม้ของคุณ 🌱</div></div>
          <div class="scifi-box" style="max-width: 500px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; background:#071f16; padding:10px; border-radius:8px;">
                  <span>ผู้ใช้งาน: <b>${username}</b></span>
                  <a href="/lootbox?username=${username}" style="background:#2ed573; color:#000; padding:5px 10px; border-radius:6px; text-decoration:none; font-weight:bold; font-size:11px;">🌳 กลับหน้าสวนต้นไม้</a>
              </div>
              <div style="background:#071f16; border:1px solid #ffd700; padding:10px; border-radius:8px; margin-bottom:15px; color:#ffd700; font-weight:bold;">
                  💰 แต้ม: ${user.points || 0} ฿ | 🎟️ สิทธิ์ปุ๋ย: ${user.tickets || 0} ครั้ง
              </div>
              <div>${captionsCardsHtml}</div>
              
              <h3 style="color:#ffd700; font-size:14px; text-align:left; margin-top:20px;">💳 เติมเงินเพื่อรับแต้ม</h3>
              <div style="display:flex; gap:10px; margin-bottom:10px;">
                  <form action="/create-topup" method="POST" style="flex:1; background:#071f16; padding:10px; border-radius:8px; border:1px solid #2ed573;">
                      <input type="hidden" name="username" value="${username}">
                      <input type="hidden" name="topup_type" value="promptpay">
                      <input type="number" name="amount" placeholder="ระบุจำนวนเงิน" required style="width:100%; padding:6px; background:#030c08; color:#fff; border:1px solid #2ed573; border-radius:4px; margin-bottom:6px; box-sizing:border-box;">
                      <button type="submit" style="width:100%; background:#2ed573; color:#000; padding:6px; border:none; border-radius:4px; font-weight:bold; cursor:pointer;">พร้อมเพย์ QR</button>
                  </form>
                  <form action="/create-topup" method="POST" style="flex:1; background:#071f16; padding:10px; border-radius:8px; border:1px solid #ff4757;">
                      <input type="hidden" name="username" value="${username}">
                      <input type="hidden" name="topup_type" value="truemoney">
                      <input type="number" name="amount" placeholder="ระบุจำนวนเงิน" required style="width:100%; padding:6px; background:#030c08; color:#fff; border:1px solid #ff4757; border-radius:4px; margin-bottom:6px; box-sizing:border-box;">
                      <button type="submit" style="width:100%; background:#ff4757; color:#fff; padding:6px; border:none; border-radius:4px; font-weight:bold; cursor:pointer;">True Wallet</button>
                  </form>
              </div>
              <ul style="text-align:left; font-size:11px; padding-left:15px;">${pendingHtml}</ul>
              <a href="/" style="display:block; margin-top:15px; color:#ff4757; text-decoration:none; font-size:12px;">ออกจากระบบ</a>
          </div>
      </body>
      </html>
    `);
  } catch (err) {
    res.redirect("/login");
  }
});

app.post("/buy-caption", async (req, res) => {
  const { username, caption_id } = req.body;
  try {
      const [userRes, captionRes] = await Promise.all([
          supabase.from('users').select('*').eq('username', username).single(),
          supabase.from('captions').select('*').eq('id', caption_id).single()
      ]);
      const user = userRes.data;
      const caption = captionRes.data;

      if (!user || !caption || user.points < caption.price) {
          return res.send(`<script>alert("แต้มไม่พอหรือข้อมูลไม่ถูกต้อง"); window.location.href="/store?username=${username}";</script>`);
      }

      await supabase.from('users').update({
          points: user.points - caption.price,
          tickets: (user.tickets || 0) + (caption.tickets_bonus || 0),
          total_spent: (user.total_spent || 0) + caption.price
      }).eq('username', username);

      res.send(`<script>alert("ซื้อปุ๋ยสำเร็จ! ได้รับสิทธิ์เพิ่ม +${caption.tickets_bonus} ครั้ง"); window.location.href="/lootbox?username=${username}";</script>`);
  } catch (e) {
      res.send(`<script>alert("เกิดข้อผิดพลาด"); window.location.href="/store?username=${username}";</script>`);
  }
});

// ------------------- MAIN GARDEN & TREE PLANTING PAGE (REPLACING LOOTBOX) -------------------

app.get("/lootbox", async (req, res) => {
  const username = req.query.username;
  if (!username) return res.redirect("/login");

  const isExpired = await checkUserExpiration(username);
  if (isExpired) {
      return res.send(`<script>alert("บัญชีของคุณหมดอายุการใช้งาน 30 วันแล้ว!"); window.location.href="/login";</script>`);
  }

  try {
    const [userRes, gameAccRes, pendingRes, pendingWithdrawRes, historyRes, recentWinsRes] = await Promise.all([
      supabase.from('users').select('*').eq('username', username).single(),
      supabase.from('game_accounts').select('*').order('id', { ascending: true }),
      supabase.from('pending_topup').select('*').eq('username', username).eq('status', 'pending'),
      supabase.from('pending_withdraw').select('*').eq('username', username).eq('status', 'pending'),
      supabase.from('history').select('*').eq('username', username).eq('is_withdrawn', false),
      supabase.from('history').select('username, reward').not('reward', 'ilike', '%เกลือ%').order('id', { ascending: false }).limit(5)
    ]);

    const row = userRes.data;
    if (!row) return res.redirect("/login");

    const currentTickets = row.tickets || 0;
    const createdAt = row.created_at;
    const gameAccounts = gameAccRes.data || [];
    const recentWins = recentWinsRes.data || [];

    // คำนวณความเติบโตของต้นไม้ตามเวลา (365 วันเต็ม) + ปุ๋ยที่สะสม (tree_exp)
    const plantedTime = new Date(row.planted_at || createdAt).getTime();
    const nowTime = new Date().getTime();
    const daysPassed = Math.floor((nowTime - plantedTime) / (1000 * 60 * 60 * 24));
    let totalExp = (row.tree_exp || 0) + daysPassed;
    let maxExp = 365;
    let progressPercent = Math.min(100, Math.floor((totalExp / maxExp) * 100));

    let tickerHtml = "🌱 ยินดีต้อนรับสู่ TREE GARDEN สวนต้นไม้ดิจิทัล ใส่ปุ๋ยเร่งโตรับรางวัลใหญ่ได้แล้ววันนี้! 🌱";
    if (recentWins.length > 0) {
        let parts = recentWins.map(w => `🎉 คุณ <b>${w.username}</b> ได้รับรางวัลต้นไม้โต <span style="color:#ffd700;">${w.reward}</span>`);
        tickerHtml = parts.join(" &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp; ");
    }

    let showcaseCardsHtml = "";
    gameAccounts.forEach(acc => {
        showcaseCardsHtml += `
          <div style="background:#071f16; border:1px solid #2ed573; border-radius:8px; padding:6px; text-align:center;">
              <div style="font-size:12px; color:#ffd700; font-weight:bold;">🌳 ${acc.title}</div>
              <div style="font-size:10px; color:#aaa;">ระดับ: ${acc.rarity || 'รางวัล'}</div>
          </div>
        `;
    });

    let claimButtonHtml = "";
    const hasPendingWithdraw = pendingWithdrawRes.data && pendingWithdrawRes.data.length > 0;
    let hasClaimable = (historyRes.data || []).some(h => h.reward && !h.reward.includes("เกลือ"));

    if (hasPendingWithdraw) {
      claimButtonHtml = `<div style="background: rgba(255, 165, 2, 0.15); border: 1px dashed #ffa502; padding: 10px; border-radius: 8px; margin-top: 10px; font-size:12px; color:#ffa502;">⏳ รอแอดมินตรวจสอบการจัดส่งรางวัล</div>`;
    } else if (hasClaimable) {
      claimButtonHtml = `
        <form action="/request-withdraw" method="POST" style="margin-top:10px;">
            <input type="hidden" name="username" value="${username}">
            <button type="submit" style="width:100%; background:#2ed573; color:#000; padding:10px; border:none; border-radius:6px; font-weight:bold; font-size:13px; cursor:pointer; font-family:'Kanit';">
                🎁 กดขอรับรางวัลต้นไม้โตทั้งหมด!
            </button>
        </form>
      `;
    }

    res.send(`
      <!DOCTYPE html>
      <html lang="th">
      <head>
          <meta charset="UTF-8">
          <title>🌳 TREE GARDEN - สวนต้นไม้ของฉัน</title>
          <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;600;800;900&display=swap" rel="stylesheet">
          <style>
              ${exactSciFiCSS}
              .user-bar { background: #071f16; border: 1px solid #2ed573; border-radius: 10px; padding: 10px 15px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
              .btn-nav { background: #2ed573; color: #000; padding: 5px 10px; border-radius: 6px; text-decoration: none; font-size: 11px; font-weight: bold; }
              .tree-display { background: rgba(0,0,0,0.4); border: 2px dashed #2ed573; border-radius: 16px; padding: 15px; margin: 15px 0; }
              .progress-bar { background: #030c08; border-radius: 10px; overflow: hidden; height: 18px; border: 1px solid #2ed573; margin: 8px 0; }
              .progress-fill { background: linear-gradient(90deg, #2ed573, #ffd700); height: 100%; width: ${progressPercent}%; transition: width 0.4s; }
              .box-btn { background: linear-gradient(135deg, #2ed573, #17b978); color: #000; padding: 12px; border: none; border-radius: 8px; font-size: 14px; cursor: pointer; font-weight: bold; width: 100%; font-family:'Kanit'; margin-top:10px; }
          </style>
      </head>
      <body>
          <div class="winner-ticker-banner"><div class="winner-ticker-text" id="ticker-content">${tickerHtml}</div></div>

          <div class="main-title-container">
              <div class="game-logo-badge">TREE GARDEN SYSTEM</div>
              <h1 class="main-title" style="font-size: 30px;">สวนต้นไม้ดิจิทัล</h1>
              <div class="sub-title-box">✦ ใส่ปุ๋ยเร่งโตเพื่อรับรางวัลใหญ่เมื่อต้นไม้โตเต็มที่ 365 วัน ✦</div>
          </div>

          <div class="scifi-box">
              <div class="user-bar">
                  <div style="text-align: left; font-size: 12px;">
                      <span style="color: #a4b0be; display: block; font-size: 10px;">ผู้ใช้งาน</span>
                      <b>${username}</b>
                  </div>
                  <div style="display:flex; gap:5px;">
                      <a href="/store?username=${username}" class="btn-nav">🛒 ร้านค้าปุ๋ย</a>
                      <a href="/my-history?username=${username}" class="btn-nav" style="background:#70a1ff; color:#000;">📜 ประวัติ</a>
                  </div>
              </div>

              <div style="font-size:12px; color:#ffd700; margin-bottom:10px;" id="countdown-box">⏳ ID นี้ใช้งานได้อีก 30 วัน</div>
              
              <div class="tree-display">
                  <div style="font-size: 50px;" id="tree-icon">${progressPercent > 80 ? '🌳' : progressPercent > 40 ? '🌿' : '🌱'}</div>
                  <div style="font-size: 15px; color: #2ed573; font-weight: bold;">ต้นไม้เลเวล ${row.tree_level || 1}</div>
                  <div style="font-size: 11px; color: #a4b0be;">เติบโตแล้ว ${totalExp} / ${maxExp} วัน</div>
                  <div class="progress-bar"><div class="progress-fill"></div></div>
                  <div style="font-size: 11px; color: #ffd700;">ความคืบหน้า: ${progressPercent}%</div>
              </div>

              <div style="background:#071f16; border:1px solid #2ed573; border-radius:10px; padding:10px; margin-bottom:10px; font-weight:bold; color:#ffd700;">
                  🎟️ สิทธิ์ใส่ปุ๋ยเร่งโต: <span id="tickets" style="color:#2ed573;">${currentTickets}</span> ครั้ง
              </div>

              <button class="box-btn" onclick="useFertilizer()" ${currentTickets <= 0 ? 'disabled style="background:#555; cursor:not-allowed;"' : ''} id="fertilize-btn">
                  🧪 ใช้สิทธิ์ใส่ปุ๋ยเร่งโต (+10 วัน)
              </button>

              <div id="claim-btn-container">${claimButtonHtml}</div>

              <div style="margin-top:15px; text-align:left;">
                  <div style="font-size: 11px; color: #a4b0be; margin-bottom: 5px; font-weight: bold;">🏆 รางวัลที่จะได้รับเมื่อต้นไม้โต:</div>
                  <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:6px;">${showcaseCardsHtml}</div>
              </div>

              <a href="/" style="display:block; margin-top:20px; color:#ff4757; text-decoration:none; font-size:12px; font-weight:bold;">ออกจากระบบ</a>
          </div>

          <script>
              let userTickets = ${currentTickets};
              let treeExp = ${totalExp};

              function useFertilizer() {
                  if (userTickets <= 0) {
                      alert("สิทธิ์ใส่ปุ๋ยหมด! กรุณาไปซื้อปุ๋ยเพิ่มที่ร้านค้า");
                      window.location.href = "/store?username=${username}";
                      return;
                  }

                  fetch('/open-lootbox', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ username: '${username}', count: 1 })
                  })
                  .then(res => res.json())
                  .then(data => {
                      if (!data.success) {
                          alert(data.message || "เกิดข้อผิดพลาด");
                          return;
                      }
                      userTickets = data.newTickets;
                      document.getElementById("tickets").innerText = userTickets;
                      if(userTickets <= 0) {
                          const btn = document.getElementById("fertilize-btn");
                          btn.disabled = true;
                          btn.style.background = "#555";
                          btn.style.cursor = "not-allowed";
                      }
                      alert("ใส่ปุ๋ยเร่งโตต้นไม้สำเร็จ! ต้นไม้เติบโตพุ่งขึ้น");
                      location.reload();
                  }).catch(e => alert("เชื่อมต่อเซิร์ฟเวอร์ล้มเหลว"));
              }
          </script>
      </body>
      </html>
    `);
  } catch (err) {
    res.redirect("/login");
  }
});

// ฟังก์ชันจำลองการเร่งโตเมื่อกดใช้ปุ๋ย (ใช้ Endpoint เดิม /open-lootbox เพื่อคงระบบสุ่มแจกรางวัลตามระบบการันตีเดิมของคุณ)
app.post("/open-lootbox", async (req, res) => {
  const { username, count } = req.body;
  const selectedCount = parseInt(count) || 1;

  try {
    const [userRes, allTargetAccountsRes] = await Promise.all([
      supabase.from('users').select('*').eq('username', username).single(),
      supabase.from('game_accounts').select('*')
    ]);

    const user = userRes.data;
    if (!user) return res.json({ success: false, message: "ไม่พบผู้ใช้งาน" });

    const targetAccList = allTargetAccountsRes.data || [];
    let availableAccounts = targetAccList.filter(a => a.status === 'available' || !a.status);

    const currentTickets = user.tickets || 0;
    if (currentTickets < selectedCount) {
        return res.json({ success: false, message: "สิทธิ์ปุ๋ยของคุณไม่พอ!" });
    }

    let reward = "เติบโตเร่งด่วน";
    let wonAcc = null;
    if (availableAccounts.length > 0) {
        wonAcc = availableAccounts[Math.floor(Math.random() * availableAccounts.length)];
        reward = `[${wonAcc.rarity || 'Normal'}] ${wonAcc.title}`;
    }

    const newTickets = currentTickets - selectedCount;
    const newExp = (user.tree_exp || 0) + (selectedCount * 10); // ใส่ปุ๋ยครั้งละ +10 วัน

    await Promise.all([
        supabase.from('users').update({ 
            tickets: newTickets, 
            tree_exp: newExp 
        }).eq('username', username),
        supabase.from('history').insert([{
            username: username,
            facebook_url: user.facebook_url || '',
            reward: reward,
            is_withdrawn: false
        }])
    ]);

    return res.json({ success: true, newTickets: newTickets });
  } catch (err) {
    return res.json({ success: false, message: "เกิดข้อผิดพลาดในการใส่ปุ๋ย" });
  }
});

// ------------------- HISTORY & WITHDRAW -------------------
app.get("/my-history", async (req, res) => {
  const username = req.query.username;
  if (!username) return res.redirect("/login");

  const { data: rows } = await supabase.from('history').select('*').eq('username', username).eq('is_withdrawn', false).order('id', { ascending: false });

  let historyList = "";
  (rows || []).forEach((r, index) => {
    historyList += `<tr><td style="padding:8px;">${index + 1}</td><td style="padding:8px; color:#ffd700;"><b>${r.reward}</b></td><td style="padding:8px;">${r.created_at || '-'}</td></tr>`;
  });

  res.send(`
    <!DOCTYPE html><html lang="th"><head><meta charset="UTF-8"><title>ประวัติรางวัลต้นไม้</title>
    <style>${exactSciFiCSS} .container { background: rgba(10, 26, 19, 0.95); padding: 30px; display: inline-block; border-radius: 10px; width: 500px; border: 1px solid #2ed573; margin-top:30px; position:relative; z-index:4; }</style>
    </head>
    <body>
        <div class="container">
            <h2 style="color:#ffd700;">📜 ประวัติรางวัลของ: ${username}</h2>
            <table border="1" style="width:100%; border-collapse:collapse; background:#071f16; border-color:#444; margin-bottom:20px; font-size:13px;">
                <tr style="background:#113a2b; color:#ffd700;"><th>ลำดับ</th><th>รางวัลต้นไม้</th><th>เวลา</th></tr>
                ${historyList || '<tr><td colspan="3" style="padding:15px; color:#aaa;">ยังไม่มีประวัติ</td></tr>'}
            </table>
            <a href="/lootbox?username=${username}" style="background:#2ed573; color:#000; padding:10px 20px; border-radius:5px; text-decoration:none; font-weight:bold;">⬅️ กลับหน้าสวนต้นไม้</a>
        </div>
    </body></html>
  `);
});

app.post("/request-withdraw", async (req, res) => {
  const { username } = req.body;
  const [userHistoryRes, userDataRes] = await Promise.all([
    supabase.from('history').select('*').eq('username', username).eq('is_withdrawn', false),
    supabase.from('users').select('facebook_url').eq('username', username).single()
  ]);

  const userHistory = userHistoryRes.data;
  if (!userHistory || userHistory.length === 0) {
    return res.send(`<script>alert("ไม่มีรางวัลที่จะขอรับ!"); window.location.href="/lootbox?username=${username}";</script>`);
  }

  let fullDetailedList = userHistory.map(h => h.reward);
  await Promise.all([
    supabase.from('pending_withdraw').insert([{
      username: username,
      facebook_url: userDataRes.data ? userDataRes.data.facebook_url : "",
      total_opens: userHistory.length,
      total_robux: userHistory.length,
      status: 'pending',
      history_snapshot: JSON.stringify(fullDetailedList)
    }]),
    supabase.from('history').update({ is_withdrawn: true }).in('id', userHistory.map(h => h.id))
  ]);

  res.send(`<script>alert("ส่งคำขอรับรางวัลสำเร็จ! แอดมินจะตรวจสอบและติดต่อกลับทางเฟซบุ๊ก"); window.location.href="/lootbox?username=${username}";</script>`);
});

app.post("/create-topup", (req, res) => {
  const { username, amount, topup_type } = req.body;
  const exactAmount = parseFloat(amount).toFixed(2);
  let infoHtml = topup_type === "truemoney" 
      ? `<p style="color:#ff4757; font-size:16px;">โอนผ่าน Wallet เบอร์: <b>${MY_TRUEMONEY_NUMBER}</b></p>`
      : `<div style="background:#fff; padding:10px; border-radius:8px;"><img src="https://promptpay.io/${MY_PROMPTPAY_NUMBER}/${exactAmount}.png" style="width:160px; height:160px;"></div>`;

  res.send(`
    <!DOCTYPE html><html lang="th"><head><meta charset="UTF-8"><title>เติมเงิน</title>
    <style>${exactSciFiCSS} .box { background: rgba(10, 26, 19, 0.95); padding: 25px; display: inline-block; border-radius: 10px; width: 380px; text-align: left; border: 1px solid #2ed573; margin-top:30px; position:relative; z-index:4; }</style>
    </head>
    <body>
        <div class="box">
            <h2 style="color:#ffd700; text-align:center;">ยอดชำระ: ${exactAmount} บาท</h2>
            <div style="text-align:center; margin-bottom:15px;">${infoHtml}</div>
            <form action="/upload-slip" method="POST" enctype="multipart/form-data">
                <input type="hidden" name="username" value="${username}">
                <input type="hidden" name="exact_amount" value="${exactAmount}">
                <input type="hidden" name="topup_type" value="${topup_type}">
                <label style="font-size:12px; display:block; margin-bottom:5px;">อัปโหลดสลิป:</label>
                <input type="file" name="slip_img" accept="image/*" required style="background:#fff; color:#000; padding:5px; width:100%; box-sizing:border-box; border-radius:4px; margin-bottom:10px;">
                <button type="submit" style="width:100%; background:#2ed573; color:#000; padding:10px; border:none; border-radius:5px; font-weight:bold; cursor:pointer;">ส่งสลิปให้แอดมิน</button>
            </form>
            <a href="/store?username=${username}" style="display:block; text-align:center; margin-top:15px; color:#70a1ff; text-decoration:none; font-size:13px;">กลับร้านค้า</a>
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

// ------------------- ADMIN DASHBOARD (ORIGINAL PRESERVED) -------------------

app.get("/admin", async (req, res) => {
  if (req.session.isAdmin) return renderAdminDashboard(req, res);
  res.send(`
    <body style="background:#071f16; color:#fff; text-align:center; padding-top:80px; font-family:sans-serif;">
      <div style="background:#0a2a1d; padding:30px; display:inline-block; border-radius:10px; border:1px solid #2ed573;">
        <h2>🛠️ เข้าสู่ระบบแอดมิน</h2>
        <form action="/admin/login" method="POST">
          <input type="password" name="password" placeholder="รหัสผ่านแอดมิน" style="padding:10px; width:240px; border-radius:4px; border:none; box-sizing:border-box;" required><br>
          <button type="submit" style="padding:10px 15px; background:#2ed573; color:#000; border:none; border-radius:4px; font-weight:bold; cursor:pointer; margin-top:10px; width:100%;">เข้าสู่ระบบ</button>
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
    await supabase.from('users').update({ points: (user.points || 0) + pointsToAdd }).eq('username', username);
  }
  await supabase.from('pending_topup').update({ status: 'completed' }).eq('id', topup_id);
  res.send(`<script>alert("อนุมัติยอดเงินและเพิ่ม ${pointsToAdd} แต้มเรียบร้อย!"); window.location.href="/admin";</script>`);
});

app.post("/admin/delete-topup", async (req, res) => {
  if (!req.session.isAdmin) return res.redirect("/admin");
  await supabase.from('pending_topup').delete().eq('id', req.body.topup_id);
  res.send(`<script>alert("ลบสลิปเรียบร้อย!"); window.location.href="/admin";</script>`);
});

app.post("/admin/approve-withdraw", async (req, res) => {
  if (!req.session.isAdmin) return res.redirect("/admin");
  const { withdraw_id, username } = req.body;
  await Promise.all([
    supabase.from('pending_withdraw').update({ status: 'completed' }).eq('id', withdraw_id),
    supabase.from('history').delete().eq('username', username).eq('is_withdrawn', true)
  ]);
  res.send(`<script>alert("อนุมัติส่งมอบรางวัลเรียบร้อย!"); window.location.href="/admin";</script>`);
});

app.post("/admin/add-game-account-json", upload.single('image_file'), async (req, res) => {
  if (!req.session.isAdmin) return res.status(403).json({ success: false });
  const { title, rarity, rate, pity_target } = req.body;
  let imageUrl = await uploadToSupabaseStorage(req.file);
  const { data, error } = await supabase.from('game_accounts').insert([{
      title, rarity: rarity || 'Normal', rate: parseFloat(rate) || 1.0, pity_target: parseInt(pity_target) || 0, image_url: imageUrl, status: 'available'
  }]).select();
  if (error) return res.json({ success: false, message: error.message });
  res.json({ success: true, newAccount: data[0] });
});

app.post("/admin/delete-game-account", async (req, res) => {
  if (!req.session.isAdmin) return res.redirect("/admin");
  await supabase.from('game_accounts').delete().eq('id', req.body.acc_id);
  res.send(`<script>alert("ลบรางวัลเรียบร้อย!"); window.location.href="/admin";</script>`);
});

app.post("/admin/clear-all-game-accounts", async (req, res) => {
  if (!req.session.isAdmin) return res.redirect("/admin");
  await supabase.from('game_accounts').delete().neq('id', 0);
  res.send(`<script>alert("ลบรางวัลทั้งหมดเกลี้ยงแล้ว!"); window.location.href="/admin";</script>`);
});

app.post("/admin/update-all-game-accounts", upload.any(), async (req, res) => {
  if (!req.session.isAdmin) return res.redirect("/admin");
  const { ids, rates, pity_targets, old_image_urls, statuses, show_pity, pity_mode } = req.body;
  if (ids) {
      const idArray = Array.isArray(ids) ? ids : [ids];
      const rateArray = Array.isArray(rates) ? rates : [rates];
      const pityArray = Array.isArray(pity_targets) ? pity_targets : [pity_targets];
      const imageArray = Array.isArray(old_image_urls) ? old_image_urls : [old_image_urls];
      const statusArray = Array.isArray(statuses) ? statuses : [statuses];

      await Promise.all(idArray.map(async (accId, i) => {
          let finalImageUrl = imageArray[i] || '';
          const uploadedFile = req.files ? req.files.find(f => f.fieldname === `image_file_${accId}`) : null;
          if (uploadedFile) {
              const newUrl = await uploadToSupabaseStorage(uploadedFile);
              if (newUrl) finalImageUrl = newUrl;
          }
          return supabase.from('game_accounts').update({
              rate: parseFloat(rateArray[i]) || 0,
              pity_target: parseInt(pityArray[i]) || 0,
              image_url: finalImageUrl,
              status: statusArray[i] || 'available'
          }).eq('id', accId);
      }));
  }
  res.send(`<script>alert("บันทึกการตั้งค่าสำเร็จ!"); window.location.href="/admin";</script>`);
});

app.post("/admin/add-caption", async (req, res) => {
  if (!req.session.isAdmin) return res.redirect("/admin");
  const { title, content, price, tickets_bonus } = req.body;
  await supabase.from('captions').insert([{ title, content: content || 'ปุ๋ยเร่งโต', price: parseFloat(price) || 0, tickets_bonus: parseInt(tickets_bonus) || 0 }]);
  res.send(`<script>alert("เพิ่มแพ็กเกจปุ๋ยสำเร็จ!"); window.location.href="/admin";</script>`);
});

app.post("/admin/delete-caption", async (req, res) => {
  if (!req.session.isAdmin) return res.redirect("/admin");
  await supabase.from('captions').delete().eq('id', req.body.caption_id);
  res.send(`<script>alert("ลบสำเร็จ!"); window.location.href="/admin";</script>`);
});

app.post("/admin/adjust-user-points", async (req, res) => {
  if (!req.session.isAdmin) return res.redirect("/admin");
  const { username, action_type, point_amount } = req.body;
  const val = parseInt(point_amount) || 0;
  const { data: user } = await supabase.from('users').select('points').eq('username', username).single();
  if (user) {
      let newPoints = action_type === 'add' ? (user.points || 0) + val : Math.max(0, (user.points || 0) - val);
      await supabase.from('users').update({ points: newPoints }).eq('username', username);
  }
  res.send(`<script>alert("ปรับแต้มเรียบร้อย!"); window.location.href="/admin";</script>`);
});

app.post("/admin/adjust-user-tickets", async (req, res) => {
  if (!req.session.isAdmin) return res.redirect("/admin");
  const { username, action_type, ticket_amount } = req.body;
  const val = parseInt(ticket_amount) || 0;
  const { data: user } = await supabase.from('users').select('tickets').eq('username', username).single();
  if (user) {
      let newTickets = action_type === 'add' ? (user.tickets || 0) + val : Math.max(0, (user.tickets || 0) - val);
      await supabase.from('users').update({ tickets: newTickets }).eq('username', username);
  }
  res.send(`<script>alert("ปรับสิทธิ์ปุ๋ยเรียบร้อย!"); window.location.href="/admin";</script>`);
});

app.post("/admin/delete-user", async (req, res) => {
  if (!req.session.isAdmin) return res.redirect("/admin");
  await supabase.from('users').delete().eq('username', req.body.username);
  res.send(`<script>alert("ลบยูสเรียบร้อย!"); window.location.href="/admin";</script>`);
});

async function renderAdminDashboard(req, res) {
  const [usersRes, pendingRes, pendingWithdrawRes, gameAccRes, captionsRes] = await Promise.all([
    supabase.from('users').select('*').order('id', { ascending: false }),
    supabase.from('pending_topup').select('*').eq('status', 'pending'),
    supabase.from('pending_withdraw').select('*').eq('status', 'pending'),
    supabase.from('game_accounts').select('*').order('id', { ascending: false }),
    supabase.from('captions').select('*').order('id', { ascending: false })
  ]);

  let pendingSlipHtml = "";
  (pendingRes.data || []).forEach((p, idx) => {
    pendingSlipHtml += `<tr><td>${idx+1}</td><td><b>${p.username}</b></td><td>${p.exact_amount} ฿</td><td><a href="${p.slip_img}" target="_blank">ดูสลิป</a></td><td><form action="/admin/approve-topup" method="POST"><input type="hidden" name="topup_id" value="${p.id}"><input type="hidden" name="username" value="${p.username}"><input type="hidden" name="exact_amount" value="${p.exact_amount}"><button type="submit" style="background:#2ed573;">อนุมัติ</button></form></td></tr>`;
  });

  let withdrawHtml = "";
  (pendingWithdrawRes.data || []).forEach((w, idx) => {
    withdrawHtml += `<tr><td>${idx+1}</td><td><b>${w.username}</b></td><td><a href="${w.facebook_url}" target="_blank">Facebook</a></td><td><form action="/admin/approve-withdraw" method="POST"><input type="hidden" name="withdraw_id" value="${w.id}"><input type="hidden" name="username" value="${w.username}"><button type="submit" style="background:#2ed573;">อนุมัติส่งมอบ</button></form></td></tr>`;
  });

  let gameAccHtml = "";
  (gameAccRes.data || []).forEach((acc, i) => {
    gameAccHtml += `<tr><td>${i+1}</td><td><b>${acc.title}</b></td><td>${acc.rarity}</td><td><input type="hidden" name="ids" value="${acc.id}"><input type="number" step="0.0001" name="rates" value="${acc.rate}" style="width:50px;"></td><td><input type="number" name="pity_targets" value="${acc.pity_target}" style="width:40px;"></td><td><input type="file" name="image_file_${acc.id}" accept="image/*"></td><td><form action="/admin/delete-game-account" method="POST"><input type="hidden" name="acc_id" value="${acc.id}"><button type="submit" style="background:#ff4757;">ลบ</button></form></td></tr>`;
  });

  let captionsHtml = "";
  (captionsRes.data || []).forEach((c, idx) => {
    captionsHtml += `<tr><td>${idx+1}</td><td>${c.title}</td><td>${c.price} ฿</td><td>+${c.tickets_bonus} สิทธิ์</td><td><form action="/admin/delete-caption" method="POST"><input type="hidden" name="caption_id" value="${c.id}"><button type="submit" style="background:#ff4757;">ลบ</button></form></td></tr>`;
  });

  let userHtml = "";
  (usersRes.data || []).forEach((u, idx) => {
    userHtml += `<tr><td>${idx+1}</td><td><b>${u.username}</b></td><td>${u.points} แต้ม / ${u.tickets} สิทธิ์</td><td><form action="/admin/adjust-user-points" method="POST"><input type="hidden" name="username" value="${u.username}"><select name="action_type"><option value="add">เพิ่ม</option><option value="subtract">ลด</option></select><input type="number" name="point_amount" value="10" style="width:50px;"><button type="submit">ปรับแต้ม</button></form></td></tr>`;
  });

  res.send(`
    <body style="background:#071f16; color:#fff; text-align:center; padding:20px; font-family:sans-serif;">
      <h2>🛠️ ระบบหลังบ้านแอดมิน (Tree Garden)</h2>
      <a href="/admin/logout" style="color:#ff4757;">🔒 ออกจากระบบ</a> | <a href="/" style="color:#70a1ff;">🏠 หน้าแรก</a>
      
      <h3>📦 จัดการรางวัลต้นไม้</h3>
      <form action="/admin/update-all-game-accounts" method="POST" enctype="multipart/form-data">
          <table border="1" style="margin:0 auto; background:#0a2a1d; border-color:#444;">
             <tr><th>ลำดับ</th><th>ชื่อรางวัล</th><th>ระดับ</th><th>เรต (%)</th><th>การันตี</th><th>รูปภาพ</th><th>จัดการ</th></tr>
             ${gameAccHtml || '<tr><td colspan="7">ไม่มีรางวัล</td></tr>'}
          </table>
          <button type="submit" style="margin-top:10px; background:#2ed573; padding:8px 15px; font-weight:bold;">บันทึกเรตทั้งหมด</button>
      </form>

      <h3>🛒 แพ็กเกจร้านค้าปุ๋ย</h3>
      <form action="/admin/add-caption" method="POST" style="margin-bottom:10px;">
          <input type="text" name="title" placeholder="ชื่อแพ็กเกจปุ๋ย" required>
          <input type="number" name="price" placeholder="ราคา" required>
          <input type="number" name="tickets_bonus" placeholder="แถมสิทธิ์" required>
          <button type="submit">เพิ่มแพ็กเกจปุ๋ย</button>
      </form>
      <table border="1" style="margin:0 auto; background:#0a2a1d; border-color:#444;">
          <tr><th>ลำดับ</th><th>ชื่อ</th><th>ราคา</th><th>แถมสิทธิ์</th><th>จัดการ</th></tr>
          ${captionsHtml || '<tr><td colspan="5">ไม่มีข้อมูล</td></tr>'}
      </table>

      <h3>📥 สลิปรอตรวจสอบ</h3>
      <table border="1" style="margin:0 auto; background:#0a2a1d; border-color:#444;">${pendingSlipHtml || '<tr><td>ไม่มีสลิป</td></tr>'}</table>

      <h3>🎁 คำขอรับรางวัลต้นไม้</h3>
      <table border="1" style="margin:0 auto; background:#0a2a1d; border-color:#444;">${withdrawHtml || '<tr><td>ไม่มีคำขอ</td></tr>'}</table>

      <h3>👥 สมาชิกทั้งหมด</h3>
      <table border="1" style="margin:0 auto; background:#0a2a1d; border-color:#444;">${userHtml || '<tr><td>ไม่มีสมาชิก</td></tr>'}</table>
    </body>
  `);
}

app.listen(PORT, () => {
  console.log("Tree Garden Server running on port " + PORT);
});