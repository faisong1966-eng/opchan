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

// ------------------- EXACT MATCH SCI-FI THEME WITH EMBEDDED CHARACTERS -------------------
const exactSciFiCSS = `
    * { box-sizing: border-box; }
    body { 
        background: radial-gradient(circle at 50% 30%, #291157 0%, #10062b 50%, #05020d 100%);
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
            radial-gradient(circle at 15% 25%, rgba(138, 43, 226, 0.35) 0%, transparent 45%),
            radial-gradient(circle at 85% 30%, rgba(0, 210, 211, 0.3) 0%, transparent 45%),
            radial-gradient(circle at 50% 85%, rgba(255, 71, 87, 0.25) 0%, transparent 55%),
            linear-gradient(to bottom, rgba(5,2,13,0.8), rgba(16,6,43,0.95));
        pointer-events: none;
        z-index: 0;
    }
    .space-chars-left {
        position: fixed;
        left: 0; bottom: 0;
        width: 280px;
        height: 100vh;
        background: linear-gradient(90deg, rgba(41,17,87,0.8), transparent);
        pointer-events: none;
        z-index: 1;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        align-items: flex-start;
        padding: 20px;
    }
    .space-chars-right {
        position: fixed;
        right: 0; bottom: 0;
        width: 280px;
        height: 100vh;
        background: linear-gradient(-90deg, rgba(41,17,87,0.8), transparent);
        pointer-events: none;
        z-index: 1;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        align-items: flex-end;
        padding: 20px;
    }
    .char-badge-left, .char-badge-right {
        background: rgba(0, 210, 211, 0.2);
        border: 2px solid #00d2d3;
        color: #00ff87;
        padding: 10px 15px;
        border-radius: 12px;
        font-weight: bold;
        font-size: 13px;
        box-shadow: 0 0 20px rgba(0,210,211,0.5);
        margin-bottom: 40px;
        backdrop-filter: blur(5px);
        animation: floatChar 4s ease-in-out infinite;
    }
    .char-badge-right { color: #ffd700; border-color: #ffd700; box-shadow: 0 0 20px rgba(255,215,0,0.5); }
    @keyframes floatChar {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
    }
    @media(max-width: 1000px) {
        .space-chars-left, .space-chars-right { display: none; }
    }
    .top-lang-bar {
        position: absolute;
        top: 15px; right: 20px;
        display: flex; gap: 10px; align-items: center;
        z-index: 10;
        font-size: 13px;
    }
    .lang-badge {
        background: rgba(0,0,0,0.6);
        border: 1px solid rgba(255,255,255,0.2);
        padding: 4px 12px;
        border-radius: 20px;
        display: flex; align-items: center; gap: 6px;
        backdrop-filter: blur(5px);
    }
    .audio-btn {
        background: rgba(0,0,0,0.6);
        border: 1px solid rgba(255,255,255,0.2);
        width: 35px; height: 35px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; color: #fff; backdrop-filter: blur(5px);
    }
    .main-title-container {
        position: relative;
        padding-top: 25px;
        z-index: 4;
    }
    .game-logo-badge {
        background: linear-gradient(90deg, #ffd700, #ff8c00);
        color: #000;
        font-size: 11px;
        font-weight: 800;
        padding: 3px 15px;
        border-radius: 12px;
        display: inline-block;
        margin-bottom: 5px;
        box-shadow: 0 0 15px rgba(255,215,0,0.6);
        letter-spacing: 1px;
    }
    h1.main-title {
        font-size: 38px;
        font-weight: 900;
        line-height: 1.1;
        margin: 0;
        background: linear-gradient(180deg, #ffffff 30%, #00ff87 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        text-shadow: 0 0 30px rgba(0, 255, 135, 0.5);
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
        background: rgba(13, 15, 30, 0.94);
        backdrop-filter: blur(25px);
        -webkit-backdrop-filter: blur(25px);
        border: 2px solid #00d2d3;
        border-radius: 24px;
        box-shadow: 0 0 50px rgba(0, 210, 211, 0.4), inset 0 0 25px rgba(0, 210, 211, 0.15);
        position: relative;
        z-index: 4;
        margin: 20px auto;
        padding: 25px;
        width: 92%;
        max-width: 440px;
    }
    .scifi-box::before {
        content: '';
        position: absolute;
        top: -6px; left: -6px; right: -6px; bottom: -6px;
        border: 1px solid rgba(255, 0, 127, 0.6);
        border-radius: 28px;
        pointer-events: none;
    }
    .feature-row {
        display: flex;
        justify-content: space-around;
        margin-top: 25px;
        padding-top: 15px;
        border-top: 1px solid rgba(255,255,255,0.1);
        z-index: 4;
        position: relative;
        max-width: 440px;
        margin-left: auto;
        margin-right: auto;
    }
    .feature-item {
        text-align: center;
        flex: 1;
        padding: 0 5px;
    }
    .feature-icon {
        width: 36px; height: 36px;
        background: rgba(0, 210, 211, 0.15);
        border: 1px solid #00d2d3;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        margin: 0 auto 6px auto;
        font-size: 16px;
        box-shadow: 0 0 10px rgba(0,210,211,0.4);
    }
    .feature-title { font-size: 11px; font-weight: bold; color: #fff; margin: 0; }
    .feature-desc { font-size: 9px; color: #a4b0be; margin: 2px 0 0 0; }
    
    .footer-copy {
        font-size: 10px;
        color: #718093;
        margin: 20px 0 15px 0;
        z-index: 4;
        position: relative;
        letter-spacing: 0.5px;
    }
`;

// ------------------- FRONTEND ROUTES -------------------

app.get("/", (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.send(`
    <!DOCTYPE html>
    <html lang="th">
    <head>
        <meta charset="UTF-8">
        <title>🛡️ LINE RANGERS BOX - หน้าแรก</title>
        <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;600;800;900&display=swap" rel="stylesheet">
        <style>
            ${exactSciFiCSS}
            .btn-scifi {
                display: block;
                width: 100%;
                padding: 14px;
                margin: 15px 0;
                border-radius: 12px;
                font-size: 16px;
                font-weight: 800;
                text-decoration: none;
                font-family: 'Kanit', sans-serif;
                transition: all 0.3s ease;
                cursor: pointer;
            }
            .btn-login {
                background: linear-gradient(135deg, #2ed573, #17b978);
                color: #000;
                box-shadow: 0 4px 20px rgba(46, 213, 115, 0.5);
                border: 1px solid #7efff5;
            }
            .btn-login:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 25px rgba(46, 213, 115, 0.8);
                filter: brightness(1.1);
            }
            .btn-reg {
                background: linear-gradient(135deg, #1e90ff, #3742fa);
                color: #fff;
                box-shadow: 0 4px 20px rgba(30, 144, 255, 0.5);
                border: 1px solid #70a1ff;
            }
            .btn-reg:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 25px rgba(30, 144, 255, 0.8);
                filter: brightness(1.1);
            }
        </style>
    </head>
    <body>
        <div class="space-chars-left"><div class="char-badge-left">🛡️ บราวน์ & แซลลี่ อวกาศ</div></div>
        <div class="space-chars-right"><div class="char-badge-right">⚔️ โคนี่ & ฮีโร่ เรนเจอร์</div></div>

        <div class="top-lang-bar">
            <div class="audio-btn">🔊</div>
            <div class="lang-badge">🌐 ไทย ∨</div>
        </div>

        <div class="main-title-container">
            <div class="game-logo-badge">LINE RANGERS</div>
            <h1 class="main-title">LINE<br>RANGERS<br><span style="font-size: 20px; letter-spacing: 6px; color: #00d2d3;">--- B O X ---</span></h1>
            <div class="sub-title-box">✨ ยินดีต้อนรับสู่โลกของ Line Rangers รวมพลังฮีโร่ ปกป้องโลกและพิชิตทุกภารกิจ! ✨</div>
        </div>

        <div class="scifi-box">
            <div style="color: #00ff87; font-weight: bold; font-size: 15px; margin-bottom: 5px;">
                🛡️ LINE RANGERS BOX
            </div>
            <div style="font-size: 12px; color: #00d2d3; margin-bottom: 20px;">
                ✦ เข้าสู่ระบบเพื่อเริ่มต้นการผจญภัย ✦
            </div>

            <a href="/login" class="btn-scifi btn-login">🔑 เข้าสู่ระบบ</a>
            <a href="/register" class="btn-scifi btn-reg">📝 สมัครสมาชิก</a>
        </div>

        <div class="feature-row">
            <div class="feature-item">
                <div class="feature-icon">🛡️</div>
                <div class="feature-title">ปลอดภัย 100%</div>
                <div class="feature-desc">มั่นใจในความปลอดภัย<br>ข้อมูลถูกเข้ารหัส</div>
            </div>
            <div class="feature-item">
                <div class="feature-icon">⚡</div>
                <div class="feature-title">รวดเร็วทันใจ</div>
                <div class="feature-desc">เข้าสู่ระบบง่าย<br>เพียงไม่กี่วินาที</div>
            </div>
            <div class="feature-item">
                <div class="feature-icon">⭐</div>
                <div class="feature-title">สิทธิพิเศษมากมาย</div>
                <div class="feature-desc">รับของรางวัลพิเศษ<br>สำหรับสมาชิก</div>
            </div>
        </div>

        <div class="footer-copy">© LINE RANGERS BOX ALL RIGHTS RESERVED.</div>
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
            ${exactSciFiCSS}
            .container { background: rgba(19, 21, 31, 0.94); padding: 25px; border-radius: 16px; display: inline-block; width: 360px; text-align: left; border: 1px solid #00d2d3; margin-top:20px; box-shadow:0 0 25px rgba(0,210,211,0.3); position:relative; z-index:4; }
            h2 { color: #00ff87; text-align: center; margin-top:0; font-size: 20px; }
            label { display: block; margin-top: 10px; font-size: 13px; color:#dcdde1; }
            input { width: 100%; padding: 10px; margin-top: 5px; border-radius: 6px; border: 1px solid #25283c; background:#1b1e2e; color:#fff; box-sizing: border-box; font-family:'Kanit'; }
            button { width: 100%; background: linear-gradient(135deg, #2ed573, #17b978); color: #000; padding: 12px; border: none; border-radius: 6px; margin-top: 20px; font-weight: 800; cursor: pointer; font-family:'Kanit'; font-size:15px; }
            a { display: block; text-align: center; margin-top: 15px; color: #70a1ff; text-decoration: none; font-size: 13px; }
        </style>
    </head>
    <body>
        <div class="space-chars-left"><div class="char-badge-left">🛡️ บราวน์อวกาศ</div></div>
        <div class="space-chars-right"><div class="char-badge-right">⚔️ โคนี่ฮีโร่</div></div>
        
        <div class="container">
            <h2>📝 สมัครสมาชิก</h2>
            <p style="font-size:11px; color:#ffd700; text-align:center;">⚠️ บัญชีมีอายุใช้งาน 30 วันนับจากวันที่สมัคร</p>
            <form action="/register" method="POST">
                <label>Username (สำหรับเข้าเว็บ):</label>
                <input type="text" name="username" placeholder="ตั้งชื่อผู้ใช้งาน" required>
                <label>Password:</label>
                <input type="password" name="password" placeholder="ตั้งรหัสผ่าน" required>
                <label>ลิงก์ Facebook ส่วนตัวของคุณ:</label>
                <input type="url" name="facebook_url" placeholder="https://www.facebook.com/your.profile" required>
                <span style="font-size:10px; color:#a4b0be; display:block; margin-top:3px;">*คัดลอกลิงก์โปรไฟล์เฟซบุ๊กมาวางไว้ เพื่อให้แอดมินทักไปส่งรางวัล</span>
                <button type="submit">ยืนยันการสมัคร</button>
            </form>
            <a href="/">กลับหน้าแรก</a>
        </div>
        <div class="footer-copy">© LINE RANGERS BOX ALL RIGHTS RESERVED.</div>
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
          tickets: 0,
          total_spent: 0, 
          pity_counters: JSON.stringify({}),
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
            ${exactSciFiCSS}
            .container { background: rgba(19, 21, 31, 0.94); padding: 25px; border-radius: 16px; display: inline-block; width: 350px; text-align: left; border: 1px solid #00d2d3; margin-top:30px; box-shadow:0 0 25px rgba(0,210,211,0.3); position:relative; z-index:4; }
            h2 { color: #ffd700; text-align: center; margin-top:0; font-size:20px; }
            label { display: block; margin-top: 10px; font-size: 13px; color:#dcdde1; }
            input { width: 100%; padding: 10px; margin-top: 5px; border-radius: 6px; border: 1px solid #25283c; background:#1b1e2e; color:#fff; box-sizing: border-box; font-family:'Kanit'; }
            button { width: 100%; background: linear-gradient(135deg, #ff4757, #ff6b81); color: white; padding: 12px; border: none; border-radius: 6px; margin-top: 20px; font-weight: 800; cursor: pointer; font-family:'Kanit'; font-size:15px; }
            a { display: block; text-align: center; margin-top: 15px; color: #70a1ff; text-decoration: none; font-size:13px; }
        </style>
    </head>
    <body>
        <div class="space-chars-left"><div class="char-badge-left">🛡️ บราวน์อวกาศ</div></div>
        <div class="space-chars-right"><div class="char-badge-right">⚔️ โคนี่ฮีโร่</div></div>
        
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
        <div class="footer-copy">© LINE RANGERS BOX ALL RIGHTS RESERVED.</div>
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

app.get("/api/user-status", async (req, res) => {
  const username = req.query.username;
  if (!username) return res.json({ success: false });

  try {
    const [userRes, pendingRes, pendingWithdrawRes, historyRes, gameAccRes] = await Promise.all([
      supabase.from('users').select('points, tickets, total_spent, pity_counters').eq('username', username).single(),
      supabase.from('pending_topup').select('*').eq('username', username).eq('status', 'pending'),
      supabase.from('pending_withdraw').select('*').eq('username', username).eq('status', 'pending'),
      supabase.from('history').select('*').eq('username', username).eq('is_withdrawn', false),
      supabase.from('game_accounts').select('*').order('id', { ascending: true })
    ]);

    const user = userRes.data;
    const pendingRows = pendingRes.data;
    const pendingWithdrawRows = pendingWithdrawRes.data;
    const unwithdrawnHistory = historyRes.data;
    const gameAccounts = gameAccRes.data;

    const hasPendingWithdraw = pendingWithdrawRows && pendingWithdrawRows.length > 0;

    let hasClaimable = false;
    if (unwithdrawnHistory && !hasPendingWithdraw) {
      unwithdrawnHistory.forEach(h => {
        if (h.reward && !h.reward.includes("เกลือ") && !h.reward.includes("สิทธิ์สุ่มฟรี")) {
          hasClaimable = true;
        }
      });
    }

    let availableCount = 0;
    if (gameAccounts) {
      gameAccounts.forEach(acc => {
        if (acc.status !== 'out_of_stock') availableCount++;
      });
    }

    let rawCounters = parsePityCounters(user ? user.pity_counters : {});
    let cleanCounters = {};
    if (gameAccounts) {
        gameAccounts.forEach(acc => {
            const t = parseInt(acc.pity_target) || 0;
            const isFreeTicketReward = acc.title && (acc.title.includes("สิทธิ์สุ่มฟรี") || acc.title.includes("[ฟรีสิทธิ์]"));
            if (t > 0 && !isFreeTicketReward && rawCounters[acc.id] !== undefined) {
                cleanCounters[acc.id] = rawCounters[acc.id];
            }
        });
    }

    res.json({
      success: true,
      points: user ? user.points : 0,
      tickets: user ? (user.tickets || 0) : 0,
      total_spent: user ? user.total_spent : 0,
      pityCounters: cleanCounters,
      pendingRows: pendingRows || [],
      hasPendingWithdraw: hasPendingWithdraw,
      hasClaimable: hasClaimable,
      gameAccounts: gameAccounts || [],
      hasAvailableStock: availableCount > 0
    });
  } catch (e) {
    res.json({ success: false });
  }
});

// ------------------- 1. CAPSULE STORE ROUTE (MARKETING LAW COMPLIANT) -------------------

app.get("/store", async (req, res) => {
  const username = req.query.username;
  if (!username) return res.redirect("/login");

  const isExpired = await checkUserExpiration(username);
  if (isExpired) {
      return res.send(`<script>alert("บัญชีของคุณหมดอายุใช้งาน 30 วันแล้ว!"); window.location.href="/login";</script>`);
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
    const pendingRows = pendingRes.data || [];

    let pendingHtml = "";
    if (pendingRows.length > 0) {
      pendingRows.forEach(p => {
        const typeBadge = p.topup_type === 'truemoney' ? '[Wallet]' : '[พร้อมเพย์]';
        pendingHtml += `<li style="color:#ffa502;">ยอดโอน <b>${p.exact_amount} บาท</b> ${typeBadge} (รอแอดมินตรวจสอบสลิป)</li>`;
      });
    } else {
      pendingHtml = `<span style="color:#aaa; font-size:12px;">ไม่มีรายการรอดำเนินการ</span>`;
    }

    let captionsCardsHtml = "";
    if (captions.length > 0) {
      captions.forEach(cap => {
        captionsCardsHtml += `
          <div style="background:#13151f; border:1px solid #00d2d3; border-radius:12px; padding:15px; text-align:left; display:flex; flex-direction:column; justify-content:space-between; box-shadow:0 0 15px rgba(0,210,211,0.15);">
              <div>
                  <div style="color:#ffd700; font-weight:bold; font-size:15px; margin-bottom:4px;">💬 ${cap.title}</div>
                  <div style="font-size:12px; color:#a4b0be; margin-bottom:10px; background:rgba(0,0,0,0.3); padding:8px; border-radius:6px; min-height:45px;">"${cap.content}"</div>
              </div>
              <div>
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; font-size:13px;">
                      <span style="color:#2ed573; font-weight:bold;">💵 ราคา: ${cap.price} แต้ม</span>
                      <span style="color:#00ff87; font-weight:bold; background:rgba(0,255,135,0.1); padding:2px 8px; border-radius:6px;">🎁 แถมสิทธิ์สุ่ม ${cap.tickets_bonus} ครั้ง</span>
                  </div>
                  <form action="/buy-caption" method="POST" onsubmit="return confirm('ยืนยันการซื้อแคปชั่นนี้ (${cap.price} แต้ม)? คุณจะได้รับแคปชั่นสำหรับคัดลอกทันที พร้อมรับสิทธิ์สุ่ม ${cap.tickets_bonus} ครั้ง');">
                      <input type="hidden" name="username" value="${username}">
                      <input type="hidden" name="caption_id" value="${cap.id}">
                      <button type="submit" style="width:100%; background:linear-gradient(135deg, #2ed573, #17b978); color:#000; border:none; padding:10px; border-radius:6px; font-weight:bold; cursor:pointer; font-family:'Kanit'; font-size:13px;">🛒 ซื้อแคปชั่น & รับสิทธิ์สุ่ม</button>
                  </form>
              </div>
          </div>
        `;
      });
    } else {
      captionsCardsHtml = `
        <div style="grid-column: span 2; background:#13151f; border:1px dashed #00d2d3; padding:20px; border-radius:12px; color:#a4b0be;">
            ยังไม่มีรายการแคปชั่นในระบบร้านค้า (แอดมินสามารถเพิ่มแพ็กเกจแคปชั่นได้ที่หลังบ้าน)
        </div>
      `;
    }

    res.send(`
      <!DOCTYPE html>
      <html lang="th">
      <head>
          <meta charset="UTF-8">
          <title>🛡️ ร้านค้าแคปชั่นดิจิทัล - LINE RANGERS BOX</title>
          <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;600;800;900&display=swap" rel="stylesheet">
          <style>
              ${exactSciFiCSS}
              .user-bar { background: #1b1e2e; border: 1px solid #00d2d3; border-radius: 10px; padding: 10px 15px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
              .btn-nav { background: #00d2d3; color: #000; padding: 5px 12px; border-radius: 6px; text-decoration: none; font-size: 11px; font-weight: bold; }
              .wallet-box { background: #1b1e2e; border: 1px solid #ffd700; border-radius: 10px; padding: 10px; display: flex; justify-content: space-around; font-size: 14px; margin-bottom: 15px; font-weight: bold; color: #ffd700; box-shadow: 0 0 10px rgba(255,215,0,0.2); }
              .store-grid { display: grid; grid-template-columns: 1fr; gap: 12px; margin-bottom: 20px; }
              .topup-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; }
              .topup-card { background: #1b1e2e; border: 1px solid #2a2e45; border-radius: 10px; padding: 10px; text-align: left; }
              input[type="number"] { width: 100%; padding: 6px; background: #13151f; border: 1px solid #333856; color: #fff; border-radius: 4px; box-sizing: border-box; font-size: 12px; margin-bottom: 6px; font-family:'Kanit'; }
              .topup-sub-btn { width: 100%; padding: 6px; border: none; border-radius: 4px; font-weight: bold; font-size: 11px; cursor: pointer; font-family:'Kanit'; }
          </style>
      </head>
      <body>
          <div class="space-chars-left"><div class="char-badge-left">🛡️ บราวน์ & แซลลี่ อวกาศ</div></div>
          <div class="space-chars-right"><div class="char-badge-right">⚔️ โคนี่ & ฮีโร่ เรนเจอร์</div></div>

          <div class="top-lang-bar">
              <div class="audio-btn">🔊</div>
              <div class="lang-badge">🌐 ไทย ∨</div>
          </div>

          <div class="main-title-container">
              <div class="game-logo-badge">STORE SYSTEM</div>
              <h1 class="main-title" style="font-size: 30px;">ร้านค้าแคปชั่นดิจิทัล</h1>
              <div class="sub-title-box">✦ ซื้อแคปชั่นคำคมเพื่อรับสิทธิ์สุ่มกล่องฟรีทันทีตามโปรโมชัน ✦</div>
          </div>

          <div class="scifi-box" style="max-width: 520px;">
              <div class="user-bar">
                  <div style="text-align: left; font-size: 12px;">
                      <span style="color: #a4b0be; display: block; font-size: 10px;">ผู้ใช้งาน</span>
                      <b>${username}</b>
                  </div>
                  <div style="display:flex; gap:6px;">
                      <a href="/lootbox?username=${username}" class="btn-nav" style="background:#2ed573; color:#000;">🎁 ไปหน้าสุ่มกล่อง</a>
                  </div>
              </div>

              <div class="wallet-box">
                  <div>💰 แต้มในกระเป๋า: <span id="points">${user.points || 0}</span> ฿</div>
                  <div>🎟️ สิทธิ์สุ่ม (Tickets): <span id="tickets" style="color:#00ff87;">${user.tickets || 0}</span> ครั้ง</div>
              </div>

              <div style="font-size:13px; color:#ffd700; text-align:left; margin-bottom:10px; font-weight:bold;">🛒 เลือกซื้อแพ็กเกจแคปชั่นคำคมดิจิทัล:</div>
              <div class="store-grid">
                  ${captionsCardsHtml}
              </div>

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

              <div style="text-align:left; margin-top:12px; background:#1b1e2e; padding:8px; border-radius:6px; font-size:11px;">
                  <b style="color:#ffd700;">📌 สถานะการเติมเงิน:</b>
                  <ul style="padding-left:15px; margin:3px 0;">${pendingHtml}</ul>
              </div>

              <a href="/" style="display:block; margin-top:20px; color:#ff4757; text-decoration:none; font-size:12px; font-weight:bold;">ออกจากระบบ</a>
          </div>

          <div class="footer-copy">© LINE RANGERS BOX ALL RIGHTS RESERVED.</div>
      </body>
      </html>
    `);
  } catch (err) {
    res.redirect("/login");
  }
});

app.post("/buy-caption", async (req, res) => {
  const { username, caption_id } = req.body;
  if (!username || !caption_id) {
      return res.send(`<script>alert("ข้อมูลไม่ถูกต้อง"); window.location.href="/store?username=${username}";</script>`);
  }

  try {
      const [userRes, captionRes] = await Promise.all([
          supabase.from('users').select('*').eq('username', username).single(),
          supabase.from('captions').select('*').eq('id', caption_id).single()
      ]);

      const user = userRes.data;
      const caption = captionRes.data;

      if (!user || !caption) {
          return res.send(`<script>alert("ไม่พบข้อมูลผู้ใช้หรือแพ็กเกจแคปชั่นนี้"); window.location.href="/store?username=${username}";</script>`);
      }

      const price = parseFloat(caption.price) || 0;
      const bonusTickets = parseInt(caption.tickets_bonus) || 0;

      if (user.points < price) {
          return res.send(`<script>alert("แต้มในกระเป๋าของคุณไม่พอสำหรับซื้อแคปชั่นนี้! กรุณาเติมเงินก่อน"); window.location.href="/store?username=${username}";</script>`);
      }

      const newPoints = user.points - price;
      const newTickets = (user.tickets || 0) + bonusTickets;
      const newSpent = (user.total_spent || 0) + price;

      await supabase.from('users').update({
          points: newPoints,
          tickets: newTickets,
          total_spent: newSpent
      }).eq('username', username);

      res.send(`
        <!DOCTYPE html>
        <html lang="th">
        <head>
            <meta charset="UTF-8">
            <title>ซื้อแคปชั่นสำเร็จ</title>
            <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;600&display=swap" rel="stylesheet">
            <style>
                ${exactSciFiCSS}
                .box { background: rgba(19, 21, 31, 0.95); padding: 30px; display: inline-block; border-radius: 16px; width: 420px; border: 2px solid #2ed573; margin-top:40px; box-shadow:0 0 30px rgba(46,213,115,0.4); position:relative; z-index:4; text-align:left; }
            </style>
        </head>
        <body>
            <div class="space-chars-left"><div class="char-badge-left">🛡️ บราวน์อวกาศ</div></div>
            <div class="space-chars-right"><div class="char-badge-right">⚔️ โคนี่ฮีโร่</div></div>
            
            <div class="box">
                <h2 style="color:#2ed573; text-align:center; margin-top:0;">🎉 ซื้อแคปชั่นสำเร็จเรียบร้อย!</h2>
                <p style="font-size:13px; color:#a4b0be; text-align:center;">คุณได้รับสิทธิ์สุ่มกล่องแถมฟรี <b style="color:#ffd700; font-size:16px;">+${bonusTickets} ครั้ง</b> เข้าบัญชีแล้ว!</p>
                
                <hr style="border:0; border-top:1px solid #333; margin:15px 0;">
                
                <label style="font-size:12px; color:#ffd700; font-weight:bold; display:block; margin-bottom:5px;">📋 ข้อความแคปชั่นของคุณ (กดคัดลอกไปใช้งานได้เลย):</label>
                <textarea id="captionText" readonly style="width:100%; height:90px; background:#0b0f19; color:#fff; border:1px solid #00d2d3; border-radius:6px; padding:10px; font-family:'Kanit'; font-size:13px; box-sizing:border-box;">${caption.content}</textarea>
                
                <button onclick="copyCaption()" style="width:100%; background:#00d2d3; color:#000; border:none; padding:10px; border-radius:6px; font-weight:bold; cursor:pointer; margin-top:10px; font-family:'Kanit';">📋 คัดลอกข้อความแคปชั่น</button>

                <a href="/lootbox?username=${username}" style="display:block; text-align:center; margin-top:18px; background:linear-gradient(135deg, #2ed573, #17b978); color:#000; padding:12px; border-radius:6px; text-decoration:none; font-weight:bold; font-size:14px;">🎁 ไปหน้าสุ่มกล่อง (ใช้สิทธิ์สุ่ม ${newTickets} ครั้ง)</a>
            </div>

            <script>
                function copyCaption() {
                    const copyText = document.getElementById("captionText");
                    copyText.select();
                    copyText.setSelectionRange(0, 99999);
                    navigator.clipboard.writeText(copyText.value);
                    alert("คัดลอกแคปชั่นไปยังคลิปบอร์ดแล้ว!");
                }
            </script>
        </body>
        </html>
      `);
  } catch (e) {
      res.send(`<script>alert("เกิดข้อผิดพลาดในการซื้อแคปชั่น"); window.location.href="/store?username=${username}";</script>`);
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
    const [userRes, gameAccRes, pendingRes, pendingWithdrawRes, historyRes] = await Promise.all([
      supabase.from('users').select('*').eq('username', username).single(),
      supabase.from('game_accounts').select('*').order('id', { ascending: true }),
      supabase.from('pending_topup').select('*').eq('username', username).eq('status', 'pending'),
      supabase.from('pending_withdraw').select('*').eq('username', username).eq('status', 'pending'),
      supabase.from('history').select('*').eq('username', username).eq('is_withdrawn', false)
    ]);

    const row = userRes.data;
    if (!row) return res.redirect("/login");

    const currentPoints = row.points || 0;
    const currentTickets = row.tickets || 0;
    const totalSpent = row.total_spent || 0;
    const createdAt = row.created_at;

    const gameAccounts = gameAccRes.data;

    let rawCounters = parsePityCounters(row.pity_counters);
    let pityCounters = {};
    if (gameAccounts) {
        gameAccounts.forEach(acc => {
            const t = parseInt(acc.pity_target) || 0;
            const isFreeTicketReward = acc.title && (acc.title.includes("สิทธิ์สุ่มฟรี") || acc.title.includes("[ฟรีสิทธิ์]"));
            if (t > 0 && !isFreeTicketReward && rawCounters[acc.id] !== undefined) {
                pityCounters[acc.id] = rawCounters[acc.id];
            }
        });
    }

    const pendingRows = pendingRes.data;
    const pendingWithdrawRows = pendingWithdrawRes.data;
    const hasPendingWithdraw = pendingWithdrawRows && pendingWithdrawRows.length > 0;

    let pendingHtml = "";
    if (pendingRows && pendingRows.length > 0) {
      pendingRows.forEach(p => {
        const typeBadge = p.topup_type === 'truemoney' ? '[Wallet]' : '[พร้อมเพย์]';
        pendingHtml += `<li style="color:#ffa502;">ยอดโอน <b>${p.exact_amount} บาท</b> ${typeBadge} (รอแอดมินตรวจสอบสลิป)</li>`;
      });
    } else {
      pendingHtml = `<span style="color:#aaa; font-size:12px;">ไม่มีรายการรอดำเนินการ</span>`;
    }

    const unwithdrawnHistory = historyRes.data;
    let hasClaimable = false;
    if (unwithdrawnHistory && !hasPendingWithdraw) {
      unwithdrawnHistory.forEach(h => {
        if (h.reward && !h.reward.includes("เกลือ") && !h.reward.includes("สิทธิ์สุ่มฟรี")) {
          hasClaimable = true;
        }
      });
    }

    let claimButtonHtml = "";
    if (hasPendingWithdraw) {
      claimButtonHtml = `
        <div style="background: rgba(255, 165, 2, 0.15); border: 1px dashed #ffa502; padding: 12px; border-radius: 8px; margin-top: 10px; text-align: center;">
            <div style="color: #ffa502; font-weight: bold; font-size: 13px;">⏳ อยู่ระหว่างรอแอดมินตรวจสอบและจัดส่งรางวัล</div>
            <div style="color: #a4b0be; font-size: 11px; margin-top: 3px;">แอดมินจะติดต่อกลับและจัดส่งรางวัลให้ภายใน 24 ชั่วโมงผ่านทาง Facebook</div>
        </div>
      `;
    } else if (hasClaimable) {
      claimButtonHtml = `
        <form action="/request-withdraw" method="POST" onsubmit="handleWithdrawSubmit(this)" style="margin-top:10px;">
            <input type="hidden" name="username" value="${username}">
            <button type="submit" id="withdraw-btn" style="width:100%; background:#00b900; color:#fff; padding:12px; border:none; border-radius:6px; font-weight:bold; font-size:14px; cursor:pointer; font-family:'Kanit'; box-shadow:0 0 10px rgba(0,185,0,0.4);">
                🎁 กดขอรับรางวัลทั้งหมดที่คุณสุ่มได้!
            </button>
        </form>
      `;
    }

    let showcaseCardsHtml = "";
    let availableCount = 0;
    if (gameAccounts && gameAccounts.length > 0) {
      gameAccounts.forEach(acc => {
        let badgeColor = "#2ed573";
        let iconSymbol = "🛡️";

        const isFreeTicketReward = acc.title && (acc.title.includes("สิทธิ์สุ่มฟรี") || acc.title.includes("[ฟรีสิทธิ์]"));

        if (isFreeTicketReward) {
            badgeColor = "#00d2d3";
            iconSymbol = "🎟️";
        } else if (acc.rarity === "เทพมังกร") { badgeColor = "#ff4757"; iconSymbol = "🐲"; }
        else if (acc.rarity === "SSR") { badgeColor = "#ffd700"; iconSymbol = "👑"; }
        else if (acc.rarity === "SS+") { badgeColor = "#ffa502"; iconSymbol = "⚔️"; }
        else if (acc.rarity === "S") { badgeColor = "#70a1ff"; iconSymbol = "🔮"; }

        const isOutOfStock = acc.status === 'out_of_stock';
        if (!isOutOfStock) availableCount++;

        const cardStyle = isOutOfStock ? 'border-color:#ff4757; opacity:0.6;' : `border-color:${badgeColor};`;
        const stockStatusHtml = isOutOfStock 
            ? `<div style="color:#ff4757; font-weight:800; font-size:13px; margin-top:2px;">❌ หมด</div>` 
            : `<div style="font-size:10px; color:#aaa;">ระดับ: ${acc.rarity || 'รางวัล'}</div>`;

        let pityInfoHtml = "";
        const targetVal = parseInt(acc.pity_target) || 0;
        if (targetVal > 0 && !isFreeTicketReward) {
            const currentPity = pityCounters[acc.id] || 0;
            pityInfoHtml = `<div style="font-size:9px; color:#ff6b81; margin-top:3px; background:rgba(255,71,87,0.1); border-radius:4px; padding:1px;">🎯 การันตี ${currentPity}/${targetVal} เกลือ</div>`;
        }

        let imageBtnHtml = "";
        if (acc.image_url && acc.image_url.trim() !== "") {
            imageBtnHtml = `<button type="button" onclick="openImageModal('${encodeURIComponent(acc.image_url)}', '${encodeURIComponent(acc.title)}')" style="margin-top:4px; background:#1f6beb; color:#fff; border:none; padding:2px 6px; border-radius:4px; font-size:9px; font-weight:bold; cursor:pointer; font-family:'Kanit';">🖼️ ดูรูปภาพ</button>`;
        }

        showcaseCardsHtml += `
          <div class="reward-card" style="${cardStyle}">
              <div style="font-size:22px; text-shadow: 0 0 8px ${badgeColor};">${iconSymbol}</div>
              <div class="r-name" style="color:${isOutOfStock ? '#ff4757' : badgeColor}">${acc.title}</div>
              ${stockStatusHtml}
              ${pityInfoHtml}
              ${imageBtnHtml}
          </div>
        `;
      });
    } else {
      showcaseCardsHtml = `
        <div class="reward-card" style="grid-column: span 2;">
            <div style="font-size:18px; color:#aaa;">🧂 เกลือ</div>
        </div>
      `;
    }

    const isAllOut = availableCount === 0;

    res.send(`
      <!DOCTYPE html>
      <html lang="th">
      <head>
          <meta charset="UTF-8">
          <title>🛡️ LINE RANGERS BOX - สุ่มไอดี</title>
          <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;600;800;900&display=swap" rel="stylesheet">
          <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>
          <style>
              ${exactSciFiCSS}
              .user-bar { background: #1b1e2e; border: 1px solid #00d2d3; border-radius: 10px; padding: 10px 15px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
              .btn-nav { background: #00d2d3; color: #000; padding: 5px 10px; border-radius: 6px; text-decoration: none; font-size: 11px; font-weight: bold; }

              .wallet-box { background: #1b1e2e; border: 1px solid #ffd700; border-radius: 10px; padding: 10px; display: flex; justify-content: space-around; font-size: 13.5px; margin-bottom: 10px; font-weight: bold; color: #ffd700; box-shadow: 0 0 10px rgba(255,215,0,0.2); }
              
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
              .box-btn:disabled { background: #555 !important; cursor: not-allowed; box-shadow: none; filter: none; }

              #result-box { margin-top: 10px; padding: 12px; border-radius: 8px; font-size: 13px; font-weight: bold; background: #181b2a; border: 1px solid #2c314f; min-height: 40px; text-align: left; max-height: 180px; overflow-y: auto; }
              
              .modal { display: none; position: fixed; z-index: 999; left: 0; top: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); backdrop-filter: blur(5px); }
              .modal-content { background: linear-gradient(135deg, #13151f, #1b1e2e); border: 2px solid #00d2d3; margin: 15% auto; padding: 25px; border-radius: 16px; width: 80%; max-width: 350px; text-align: center; box-shadow: 0 0 30px rgba(0,210,211,0.5); animation: popup 0.3s ease-out; }
              @keyframes popup { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }

              @keyframes shake {
                  0% { transform: translate(1px, 1px) rotate(0deg); }
                  20% { transform: translate(-3px, 0px) rotate(-1deg); }
                  40% { transform: translate(1px, -1px) rotate(1deg); }
                  60% { transform: translate(-3px, 1px) rotate(0deg); }
                  80% { transform: translate(1px, -1px) rotate(1deg); }
                  100% { transform: translate(0px, 0px) rotate(0deg); }
              }
              .screen-shake { animation: shake 0.5s; }
          </style>
      </head>
      <body>
          <div class="space-chars-left"><div class="char-badge-left">🛡️ บราวน์ & แซลลี่ อวกาศ</div></div>
          <div class="space-chars-right"><div class="char-badge-right">⚔️ โคนี่ & ฮีโร่ เรนเจอร์</div></div>

          <div class="top-lang-bar">
              <div class="audio-btn">🔊</div>
              <div class="lang-badge">🌐 ไทย ∨</div>
          </div>

          <div class="main-title-container">
              <div class="game-logo-badge">LINE RANGERS</div>
              <h1 class="main-title" style="font-size: 32px;">LINE RANGERS</h1>
              <div style="font-size: 18px; font-weight: 900; letter-spacing: 5px; color: #00d2d3; text-shadow: 0 0 10px rgba(0,210,211,0.6);">--- B O X ---</div>
              <div class="sub-title-box">✦ ศูนย์รวมพลังฮีโร่ ปกป้องโลกและพิชิตทุกภารกิจ! ✦</div>
          </div>

          <div class="scifi-box">
              <div style="font-size: 16px; color: #00ff87; font-weight: 800; margin-bottom: 5px;">🛡️ LINE RANGERS BOX</div>
              <div style="font-size: 11px; color: #00d2d3; margin-bottom: 15px;">✨ สุ่มไอเทมมูลค่าแพง ลุ้นรางวัลใหญ่! ✨</div>

              <div class="user-bar">
                  <div style="text-align: left; font-size: 12px;">
                      <span style="color: #a4b0be; display: block; font-size: 10px;">ผู้ใช้งาน</span>
                      <b>${username}</b>
                  </div>
                  <div style="display:flex; gap:5px;">
                      <a href="/store?username=${username}" class="btn-nav" style="background:#2ed573; color:#000;">🛒 ร้านค้าแคปชั่น</a>
                      <a href="/my-history?username=${username}" class="btn-history">📜 ประวัติ</a>
                  </div>
              </div>

              <div id="countdown-box">⏳ ID นี้ใช้งานได้อีก: กำลังคำนวณเวลา...</div>
              
              <div class="wallet-box">
                  <div>🎟️ สิทธิ์สุ่ม: <span id="tickets" style="color:#00ff87;">${currentTickets}</span> ครั้ง</div>
                  <div>💰 แต้มสะสม: <span id="points">${currentPoints}</span></div>
              </div>

              <div id="claim-btn-container">${claimButtonHtml}</div>

              <div class="showcase-container" style="margin-top:10px;">
                  <div class="showcase-title">🏆 คลังไอดีและรางวัลในกล่องสุ่ม</div>
                  <div class="rewards-grid" id="showcase-grid-container">
                      ${showcaseCardsHtml}
                  </div>
              </div>

              <div style="font-size:12px; color:#ffd700; text-align:left; margin-bottom:6px; font-weight:bold;">⚙️ เลือกจำนวนครั้งในการเปิดกล่อง (ใช้สิทธิ์สุ่ม Tickets):</div>
              <div class="select-group">
                  <button type="button" class="${countParam === 1 ? 'active' : ''}" onclick="setCount(1, this)">1 ครั้ง</button>
                  <button type="button" class="${countParam === 10 ? 'active' : ''}" onclick="setCount(10, this)">10 ครั้ง</button>
                  <button type="button" class="${countParam === 20 ? 'active' : ''}" onclick="setCount(20, this)">20 ครั้ง</button>
                  <button type="button" class="${countParam === 30 ? 'active' : ''}" onclick="setCount(30, this)">30 ครั้ง</button>
                  <button type="button" class="${countParam === 50 ? 'active' : ''}" onclick="setCount(50, this)">50 ครั้ง</button>
                  <button type="button" class="${countParam === 100 ? 'active' : ''}" onclick="setCount(100, this)">100 ครั้ง</button>
              </div>

              <button class="box-btn" id="open-box-btn" ${isAllOut ? 'disabled' : ''} onclick="openBox()">
                 ${isAllOut ? '❌ ไอดีในคลังหมดแล้ว (รอแอดมินเติมของ)' : `📦 เปิดกล่องลุ้นโชค (${countParam} ครั้ง / ใช้ ${countParam} สิทธิ์)`}
              </button>
              
              <div id="result-box">🎁 กดเปิดกล่องเพื่อลุ้นรับรางวัล!</div>

              <a href="/" style="display:block; margin-top:20px; color:#ff4757; text-decoration:none; font-size:12px; font-weight:bold;">ออกจากระบบ</a>
          </div>

          <div class="feature-row">
              <div class="feature-item">
                  <div class="feature-icon">🛡️</div>
                  <div class="feature-title">ปลอดภัย 100%</div>
                  <div class="feature-desc">มั่นใจในความปลอดภัย<br>ข้อมูลถูกเข้ารหัส</div>
              </div>
              <div class="feature-item">
                  <div class="feature-icon">⚡</div>
                  <div class="feature-title">รวดเร็วทันใจ</div>
                  <div class="feature-desc">เข้าสู่ระบบง่าย<br>เพียงไม่กี่วินาที</div>
              </div>
              <div class="feature-item">
                  <div class="feature-icon">⭐</div>
                  <div class="feature-title">สิทธิพิเศษมากมาย</div>
                  <div class="feature-desc">รับของรางวัลพิเศษ<br>สำหรับสมาชิก</div>
              </div>
          </div>

          <div class="footer-copy">© LINE RANGERS BOX ALL RIGHTS RESERVED.</div>

          <!-- Popup Result Modal -->
          <div id="resultModal" class="modal">
              <div class="modal-content" id="modalCard">
                  <h2 id="modalTitle" style="margin:0 0 10px 0;"></h2>
                  <div id="modalBody" style="font-size:14px; margin-bottom:15px;"></div>
                  <button onclick="closeModal()" style="background:#00b900; color:#fff; border:none; padding:10px 25px; border-radius:6px; font-weight:bold; cursor:pointer; font-family:'Kanit';">ตกลง</button>
              </div>
          </div>

          <!-- Image Viewer Modal -->
          <div id="imageModal" class="modal">
              <div class="modal-content" style="max-width: 400px; padding: 20px;">
                  <h3 id="imageModalTitle" style="color:#ffd700; margin-top:0; font-size:15px;">รูปภาพรางวัล</h3>
                  <div id="imageContainer" style="max-height: 300px; overflow-y: auto; margin-bottom: 15px;"></div>
                  <button onclick="closeImageModal()" style="background:#ff4757; color:#fff; border:none; padding:8px 20px; border-radius:6px; font-weight:bold; cursor:pointer; font-family:'Kanit';">ปิด</button>
              </div>
          </div>

          <script>
              let userTickets = ${currentTickets};
              let selectedCount = ${countParam};
              let hasAvailableStock = ${!isAllOut};
              const createdAtTime = new Date("${createdAt}").getTime();
              const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

              const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

              function handleWithdrawSubmit(form) {
                  const btn = document.getElementById('withdraw-btn');
                  if(btn.disabled) return false;
                  btn.disabled = true;
                  btn.innerText = '⏳ กำลังส่งคำขอรับรางวัล...';
                  return true;
              }

              function playTierSound(highestRarity) {
                  try {
                      if (!audioCtx) return;
                      const now = audioCtx.currentTime;

                      if (highestRarity === 'เทพมังกร' || highestRarity === 'FreeTicket') {
                          for (let i = 0; i < 7; i++) {
                              const osc = audioCtx.createOscillator();
                              const gain = audioCtx.createGain();
                              osc.type = 'sawtooth';
                              osc.frequency.setValueAtTime(250 + (i * 120), now + (i * 0.08));
                              gain.gain.setValueAtTime(0.4, now + (i * 0.08));
                              gain.gain.exponentialRampToValueAtTime(0.01, now + (i * 0.08) + 0.35);
                              osc.connect(gain);
                              gain.connect(audioCtx.destination);
                              osc.start(now + (i * 0.08));
                              osc.stop(now + (i * 0.08) + 0.35);
                          }
                      } else if (highestRarity === 'SSR') {
                          [440, 554.37, 659.25, 880].forEach((freq, idx) => {
                              const osc = audioCtx.createOscillator();
                              const gain = audioCtx.createGain();
                              osc.type = 'triangle';
                              osc.frequency.setValueAtTime(freq, now + (idx * 0.1));
                              gain.gain.setValueAtTime(0.35, now + (idx * 0.1));
                              gain.gain.exponentialRampToValueAtTime(0.01, now + (idx * 0.1) + 0.4);
                              osc.connect(gain);
                              gain.connect(audioCtx.destination);
                              osc.start(now + (idx * 0.1));
                              osc.stop(now + (idx * 0.1) + 0.4);
                          });
                      } else {
                          [330, 440].forEach((freq, idx) => {
                              const osc = audioCtx.createOscillator();
                              const gain = audioCtx.createGain();
                              osc.type = 'sine';
                              osc.frequency.setValueAtTime(freq, now + (idx * 0.08));
                              gain.gain.setValueAtTime(0.2, now + (idx * 0.08));
                              gain.gain.exponentialRampToValueAtTime(0.01, now + (idx * 0.08) + 0.2);
                              osc.connect(gain);
                              gain.connect(audioCtx.destination);
                              osc.start(now + (idx * 0.08));
                              osc.stop(now + (idx * 0.08) + 0.2);
                          });
                      }
                  } catch(e){}
              }

              function openImageModal(urlEncoded, titleEncoded) {
                  const urlStr = decodeURIComponent(urlEncoded);
                  const titleStr = decodeURIComponent(titleEncoded);
                  document.getElementById("imageModalTitle").innerText = "🖼️ " + titleStr;
                  
                  const urls = urlStr.split(',').map(u => u.trim()).filter(u => u !== '');
                  let html = "";
                  urls.forEach(u => {
                      html += \`<img src="\${u}" style="width:100%; border-radius:6px; margin-bottom:8px; object-fit:contain;" onerror="this.onerror=null;this.src='https://placehold.co/300x200?text=Invalid+Image';">\`;
                  });
                  document.getElementById("imageContainer").innerHTML = html;
                  document.getElementById("imageModal").style.display = "block";
              }

              function closeImageModal() {
                  document.getElementById("imageModal").style.display = "none";
              }

              setInterval(() => {
                  fetch('/api/user-status?username=${username}')
                  .then(res => res.json())
                  .then(data => {
                      if (!data.success) return;

                      if (data.tickets !== undefined && userTickets !== data.tickets) {
                          userTickets = data.tickets;
                          document.getElementById("tickets").innerText = userTickets;
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

                      if (data.hasPendingWithdraw) {
                          document.getElementById("claim-btn-container").innerHTML = \`
                            <div style="background: rgba(255, 165, 2, 0.15); border: 1px dashed #ffa502; padding: 12px; border-radius: 8px; margin-top: 10px; text-align: center;">
                                <div style="color: #ffa502; font-weight: bold; font-size: 13px;">⏳ อยู่ระหว่างรอแอดมินตรวจสอบและจัดส่งรางวัล</div>
                                <div style="color: #a4b0be; font-size: 11px; margin-top: 3px;">แอดมินจะติดต่อกลับและจัดส่งรางวัลให้ภายใน 24 ชั่วโมงผ่านทาง Facebook</div>
                            </div>
                          \`;
                      } else if (data.hasClaimable) {
                          document.getElementById("claim-btn-container").innerHTML = \`
                            <form action="/request-withdraw" method="POST" onsubmit="handleWithdrawSubmit(this)" style="margin-top:10px;">
                                <input type="hidden" name="username" value="${username}">
                                <button type="submit" id="withdraw-btn" style="width:100%; background:#00b900; color:#fff; padding:12px; border:none; border-radius:6px; font-weight:bold; font-size:14px; cursor:pointer; font-family:'Kanit'; box-shadow:0 0 10px rgba(0,185,0,0.4);">
                                    🎁 กดขอรับรางวัลทั้งหมดที่คุณสุ่มได้!
                                </button>
                            </form>
                          \`;
                      } else {
                          document.getElementById("claim-btn-container").innerHTML = "";
                      }

                      hasAvailableStock = data.hasAvailableStock;
                      const openBtn = document.getElementById("open-box-btn");
                      if (!hasAvailableStock) {
                          openBtn.disabled = true;
                          openBtn.innerText = "❌ ไอดีในคลังหมดแล้ว (รอแอดมินเติมของ)";
                      } else if (!openBtn.innerText.includes("กำลังเปิด")) {
                          openBtn.disabled = false;
                          openBtn.innerText = \`📦 เปิดกล่องลุ้นโชค (\${selectedCount} ครั้ง / ใช้ \${selectedCount} สิทธิ์)\`;
                      }

                      if (data.gameAccounts) {
                          let showcaseHtml = "";
                          data.gameAccounts.forEach(acc => {
                              let badgeColor = "#2ed573";
                              let iconSymbol = "🛡️";
                              const isFreeTicket = acc.title && (acc.title.includes("สิทธิ์สุ่มฟรี") || acc.title.includes("[ฟรีสิทธิ์]"));

                              if (isFreeTicket) { badgeColor = "#00d2d3"; iconSymbol = "🎟️"; }
                              else if (acc.rarity === "เทพมังกร") { badgeColor = "#ff4757"; iconSymbol = "🐲"; }
                              else if (acc.rarity === "SSR") { badgeColor = "#ffd700"; iconSymbol = "👑"; }
                              else if (acc.rarity === "SS+") { badgeColor = "#ffa502"; iconSymbol = "⚔️"; }
                              else if (acc.rarity === "S") { badgeColor = "#70a1ff"; iconSymbol = "🔮"; }

                              const isOutOfStock = acc.status === 'out_of_stock';
                              const cardStyle = isOutOfStock ? 'border-color:#ff4757; opacity:0.6;' : \`border-color:\${badgeColor};\`;
                              const stockStatusHtml = isOutOfStock 
                                  ? \`<div style="color:#ff4757; font-weight:800; font-size:13px; margin-top:2px;">❌ หมด</div>\` 
                                  : \`<div style="font-size:10px; color:#aaa;">ระดับ: \${acc.rarity || 'รางวัล'}</div>\`;

                              let pityInfoHtml = "";
                              const targetVal = parseInt(acc.pity_target) || 0;
                              if (targetVal > 0 && !isFreeTicket) {
                                  const currentPity = (data.pityCounters && data.pityCounters[acc.id]) || 0;
                                  pityInfoHtml = \`<div style="font-size:9px; color:#ff6b81; margin-top:3px; background:rgba(255,71,87,0.1); border-radius:4px; padding:1px;">🎯 การันตี \${currentPity}/\${targetVal} เกลือ</div>\`;
                              }

                              let imageBtnHtml = "";
                              if (acc.image_url && acc.image_url.trim() !== "") {
                                  imageBtnHtml = \`<button type="button" onclick="openImageModal('\${encodeURIComponent(acc.image_url)}', '\${encodeURIComponent(acc.title)}')" style="margin-top:4px; background:#1f6beb; color:#fff; border:none; padding:2px 6px; border-radius:4px; font-size:9px; font-weight:bold; cursor:pointer; font-family:'Kanit';">🖼️ ดูรูปภาพ</button>\`;
                              }

                              showcaseHtml += \`
                                <div class="reward-card" style="\${cardStyle}">
                                    <div style="font-size:22px; text-shadow: 0 0 8px \${badgeColor};">\${iconSymbol}</div>
                                    <div class="r-name" style="color:\${isOutOfStock ? '#ff4757' : badgeColor}">\${acc.title}</div>
                                    \${stockStatusHtml}
                                    \${pityInfoHtml}
                                    \${imageBtnHtml}
                                </div>
                              \`;
                          });
                          document.getElementById("showcase-grid-container").innerHTML = showcaseHtml;
                      }

                  }).catch(e => {});
              }, 2000);

              function setCount(count, btn) {
                  selectedCount = count;
                  document.querySelectorAll('.select-group button').forEach(b => b.classList.remove('active'));
                  btn.classList.add('active');
                  const openBtn = document.getElementById('open-box-btn');
                  if (hasAvailableStock) {
                      openBtn.innerText = \`📦 เปิดกล่องลุ้นโชค (\${count} ครั้ง / ใช้ \${count} สิทธิ์)\`;
                  }
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
                  if (!hasAvailableStock) {
                      alert("ขออภัยครับ ไอดีในคลังหมดแล้ว รอแอดมินเติมของสักครู่นะครับ!");
                      return;
                  }

                  if (userTickets < selectedCount) {
                      alert("สิทธิ์สุ่ม (Tickets) ของคุณไม่พอสำหรับ " + selectedCount + " ครั้ง! กรุณาไปซื้อแคปชั่นที่ร้านค้าเพื่อรับสิทธิ์สุ่มเพิ่มก่อนครับ");
                      window.location.href = "/store?username=${username}";
                      return;
                  }

                  const openBtn = document.getElementById("open-box-btn");
                  openBtn.disabled = true;

                  const resBox = document.getElementById("result-box");
                  resBox.innerText = \`🌀 กำลังเปิดกล่องทันที \${selectedCount} ครั้ง...\`;

                  fetch('/open-lootbox', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ username: '${username}', count: selectedCount })
                  })
                  .then(response => response.json())
                  .then(data => {
                      if (!hasAvailableStock) {
                          openBtn.disabled = true;
                          openBtn.innerText = "❌ ไอดีในคลังหมดแล้ว (รอแอดมินเติมของ)";
                      } else {
                          openBtn.disabled = false;
                          openBtn.innerText = \`📦 เปิดกล่องลุ้นโชค (\${selectedCount} ครั้ง / ใช้ \${selectedCount} สิทธิ์)\`;
                      }

                      if (!data.success) {
                          alert(data.message || "เกิดข้อผิดพลาดในการเปิดกล่อง");
                          if (data.outOfStock) {
                              hasAvailableStock = false;
                              openBtn.disabled = true;
                              openBtn.innerText = "❌ ไอดีในคลังหมดแล้ว (รอแอดมินเติมของ)";
                          }
                          return;
                      }

                      userTickets = data.newTickets;
                      document.getElementById("tickets").innerText = userTickets;

                      let summaryListHtml = "";
                      let hasWin = false;
                      let winDetails = "";
                      let highestRarityFound = 'Salt';

                      for (const [rew, count] of Object.entries(data.summaryRewards)) {
                          summaryListHtml += \`• \${rew} x \${count} ครั้ง<br>\`;
                          if (!rew.includes("เกลือ")) {
                              hasWin = true;
                              winDetails += \`<b>\${rew}</b> (\${count} ชิ้น)<br>\`;
                              
                              if (rew.includes("สิทธิ์สุ่มฟรี")) highestRarityFound = 'FreeTicket';
                              else if (rew.includes("เทพมังกร")) highestRarityFound = 'เทพมังกร';
                              else if (rew.includes("SSR") && highestRarityFound !== 'เทพมังกร') highestRarityFound = 'SSR';
                              else if (rew.includes("SS+") && highestRarityFound !== 'เทพมังกร' && highestRarityFound !== 'SSR') highestRarityFound = 'SS+';
                              else if (rew.includes("S") && highestRarityFound !== 'เทพมังกร' && highestRarityFound !== 'SSR' && highestRarityFound !== 'SS+') highestRarityFound = 'S';
                              else if (highestRarityFound === 'Salt') highestRarityFound = 'Normal';
                          }
                      }

                      let clashNoticeHtml = "";
                      if (data.clashDetected) {
                          clashNoticeHtml = \`<div style="color:#ff4757; font-size:12px; margin-bottom:8px; background:rgba(255,71,87,0.1); padding:6px; border-radius:4px; font-weight:bold;">😢 เสียใจด้วย รางวัลนี้มีคนอื่นได้ไปแล้ว! (ระบบได้ทำการคืนสิทธิ์สุ่มส่วนต่างให้คุณแล้ว)</div>\`;
                      }

                      resBox.innerHTML = clashNoticeHtml + \`🎉 <b>สรุปผลสุ่ม \${selectedCount} ครั้ง:</b><br>
                          <div style="font-size:12px; margin-top:5px; background:rgba(0,0,0,0.3); padding:8px; border-radius:5px;">\${summaryListHtml}</div>\`;

                      const modalCard = document.getElementById("modalCard");
                      const modalTitle = document.getElementById("modalTitle");
                      const modalBody = document.getElementById("modalBody");

                      playTierSound(hasWin ? highestRarityFound : 'Salt');

                      if (hasWin) {
                          confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
                          modalCard.style.borderColor = "#00d2d3";
                          modalCard.style.boxShadow = "0 0 40px rgba(0,210,211,0.8)";
                          modalTitle.style.color = "#00d2d3";
                          modalTitle.innerText = "🎉 ยินดีด้วย! คุณได้รับรางวัลพิเศษ! 🎉";
                          modalBody.innerHTML = \`คุณเปิดกล่องสุ่มได้รับ:<br><br>\${winDetails}<br><span style="font-size:11px; color:#a4b0be;">หากเป็นสิทธิ์สุ่มฟรี ระบบได้เพิ่มจำนวนสิทธิ์ให้ท่านแล้ว!</span>\`;
                      } else {
                          modalCard.style.borderColor = "#ff4757";
                          modalCard.style.boxShadow = "0 0 20px rgba(255,71,87,0.4)";
                          modalTitle.style.color = "#ff4757";
                          modalTitle.innerText = "😢 เสียใจด้วย...";
                          modalBody.innerHTML = \`<span style="color:#ff4757; font-size:15px;">ท่านได้เกลือ พยายามอีกนิดนะ!</span><br><br>ซื้อแคปชั่นที่ร้านค้าเพื่อรับสิทธิ์สุ่มเพิ่มได้เลย!\`;
                      }

                      document.getElementById("resultModal").style.display = "block";
                  })
                  .catch(err => {
                      openBtn.disabled = false;
                      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
                  });
              }

              function closeModal() {
                  document.getElementById("resultModal").style.display = "none";
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
    historyList = `<tr><td colspan="3" style="padding:15px; color:#aaa;">คุณยังไม่มีประวัติการสุ่มที่ยังไม่ขอรับรางวัล</td></tr>`;
  }

  res.send(`
    <!DOCTYPE html>
    <html lang="th">
    <head>
        <meta charset="UTF-8">
        <title>ประวัติการสุ่มของฉัน</title>
        <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;600&display=swap" rel="stylesheet">
        <style>
            ${exactSciFiCSS}
            .container { background: rgba(43, 43, 64, 0.95); padding: 30px; display: inline-block; border-radius: 10px; width: 500px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); border: 1px solid #00d2d3; margin-top:30px; position:relative; z-index:4; }
            table { width: 100%; border-collapse: collapse; background: #1e1e2f; border-color: #444; margin-bottom: 20px; font-size: 14px; }
            th { padding: 10px; background: #3d3d5c; color: #ffd700; }
            a { display: inline-block; background: #70a1ff; color: #fff; padding: 10px 20px; border-radius: 5px; text-decoration: none; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="space-chars-left"><div class="char-badge-left">🛡️ บราวน์อวกาศ</div></div>
        <div class="space-chars-right"><div class="char-badge-right">⚔️ โคนี่ฮีโร่</div></div>
        
        <div class="container">
            <h2 style="color:#ffd700;">📜 ประวัติการสุ่มของ: ${username}</h2>
            <table border="1">
                <tr><th>ลำดับ</th><th>รางวัลที่ได้</th><th>เวลา</th></tr>
                ${historyList}
            </table>
            <a href="/lootbox?username=${username}">⬅️ กลับหน้าสุ่มกล่อง</a>
        </div>
        <div class="footer-copy">© LINE RANGERS BOX ALL RIGHTS RESERVED.</div>
    </body>
    </html>
  `);
});

app.post("/request-withdraw", async (req, res) => {
  const { username } = req.body;

  const [existingPendingRes, userHistoryRes, userDataRes] = await Promise.all([
    supabase.from('pending_withdraw').select('*').eq('username', username).eq('status', 'pending'),
    supabase.from('history').select('*').eq('username', username).eq('is_withdrawn', false),
    supabase.from('users').select('facebook_url').eq('username', username).single()
  ]);

  if (existingPendingRes.data && existingPendingRes.data.length > 0) {
    return res.send(`<script>alert("คุณมีคำขอรับรางวัลที่กำลังรอแอดมินตรวจสอบอยู่แล้ว กรุณารอสักครู่!"); window.location.href="/lootbox?username=${username}";</script>`);
  }

  const userHistory = userHistoryRes.data;
  if (!userHistory || userHistory.length === 0) {
    return res.send(`<script>alert("คุณไม่มีประวัติการสุ่มที่จะแลกรับรางวัล!"); window.location.href="/lootbox?username=${username}";</script>`);
  }

  const userData = userDataRes.data;
  const facebookUrl = userData && userData.facebook_url ? userData.facebook_url : "";

  let rewardsSummaryList = [];
  let idsToUpdate = [];

  userHistory.forEach(h => {
    if (h.reward && !h.reward.includes("เกลือ") && !h.reward.includes("สิทธิ์สุ่มฟรี")) {
      rewardsSummaryList.push(h.reward);
      idsToUpdate.push(h.id);
    }
  });

  if (idsToUpdate.length === 0) {
      return res.send(`<script>alert("ไม่มีรางวัลไอดีเกมที่จะขอรับ มีเพียงสิทธิ์สุ่มฟรีหรือเกลือ"); window.location.href="/lootbox?username=${username}";</script>`);
  }

  let fullDetailedList = userHistory.map(h => h.reward);

  await Promise.all([
    supabase.from('pending_withdraw').insert([{
      username: username,
      facebook_url: facebookUrl,
      total_opens: userHistory.length,
      total_robux: rewardsSummaryList.length,
      status: 'pending',
      history_snapshot: JSON.stringify(fullDetailedList)
    }]),
    supabase.from('history').update({ is_withdrawn: true }).in('id', idsToUpdate)
  ]);

  res.send(`<script>alert("ส่งคำขอรับรางวัลสำเร็จ! ระบบกำลังรอดำเนินการ แอดมินจะจัดส่งรางวัลให้ภายใน 24 ชม."); window.location.href="/lootbox?username=${username}";</script>`);
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
        ${exactSciFiCSS}
        .box { background: rgba(43, 43, 64, 0.95); padding: 25px; display: inline-block; border-radius: 10px; width: 380px; text-align: left; border: 1px solid #00d2d3; margin-top:30px; position:relative; z-index:4; }
    </style></head>
    <body>
        <div class="space-chars-left"><div class="char-badge-left">🛡️ บราวน์อวกาศ</div></div>
        <div class="space-chars-right"><div class="char-badge-right">⚔️ โคนี่ฮีโร่</div></div>
        
        <div class="box">
            <h2 style="color:${topup_type === 'truemoney' ? '#ff4757' : '#2ed573'}; text-align:center; font-size:18px;">${titleText}</h2>
            ${infoHtml}
            
            <h2 style="color:#ffd700; text-align:center; margin:5px 0;">${exactAmount} บาท</h2>
            
            <hr style="border:0; border-top:1px solid #444; margin:15px 0;">

            <form action="/upload-slip" method="POST" enctype="multipart/form-data" onsubmit="return handleUpload(this)">
                <input type="hidden" name="username" value="${username}">
                <input type="hidden" name="exact_amount" value="${exactAmount}">
                <input type="hidden" name="topup_type" value="${topup_type || 'promptpay'}">
                
                <label style="font-size:13px; display:block; margin-bottom:5px;">📤 อัปโหลดสลิปโอนเงิน:</label>
                <input type="file" name="slip_img" accept="image/*" required style="background:#fff; color:#000; padding:5px; width:100%; box-sizing:border-box; border-radius:4px;">
                
                <button type="submit" id="submit-slip-btn" style="width:100%; background:${topup_type === 'truemoney' ? '#ff4757' : '#2ed573'}; color:#fff; padding:12px; border:none; border-radius:5px; font-weight:bold; cursor:pointer; margin-top:15px; font-size:14px;">🚀 ส่งสลิปให้แอดมินตรวจสอบ</button>
            </form>

            <div id="loading-box" style="display:none; text-align:center; margin-top:12px; background:rgba(0,0,0,0.3); padding:8px; border-radius:6px; color:#ffd700; font-size:12px; font-weight:bold;">
                ⏳ กำลังส่งสลิป กรุณารอสักครู่...
            </div>

            <a href="/store?username=${username}" style="display:block; text-align:center; margin-top:15px; color:#70a1ff; text-decoration:none; font-size:13px;">กลับหน้าร้านค้า</a>
        </div>
        <div class="footer-copy">© LINE RANGERS BOX ALL RIGHTS RESERVED.</div>
    <script>
        let isUploading = false;
        function handleUpload(form) {
            if (isUploading) return false;
            isUploading = true;
            
            const btn = document.getElementById('submit-slip-btn');
            const loading = document.getElementById('loading-box');
            btn.disabled = true;
            btn.style.background = '#555';
            btn.innerText = '⏳ กำลังอัปโหลดด่วน...';
            loading.style.display = 'block';
            return true;
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
      return res.send(`<script>alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่"); window.location.href="/store?username=${username}";</script>`);
    }
    res.send(`<script>alert("ส่งสลิปสำเร็จ! กรุณารอแอดมินตรวจสอบและเติมแต้มให้ภายในไม่กี่นาที"); window.location.href="/store?username=${username}";</script>`);
  } catch (err) {
    res.send(`<script>alert("เกิดข้อผิดพลาดในการอัปโหลดไฟล์"); window.location.href="/store?username=${username}";</script>`);
  }
});

// ------------------- 2. UPDATED BULK OPEN LOOTBOX ALGORITHM -------------------

app.post("/open-lootbox", async (req, res) => {
  const { username, count } = req.body;
  const selectedCount = parseInt(count) || 1;

  if (!username || selectedCount <= 0) {
    return res.json({ success: false, message: "ข้อมูลไม่ถูกต้อง" });
  }

  try {
    const [userRes, allTargetAccountsRes] = await Promise.all([
      supabase.from('users').select('*').eq('username', username).single(),
      supabase.from('game_accounts').select('*')
    ]);

    const user = userRes.data;
    if (!user) return res.json({ success: false, message: "ไม่พบผู้ใช้งาน" });

    const targetAccList = allTargetAccountsRes.data || [];
    let availableAccounts = targetAccList.filter(a => a.status === 'available' || !a.status);

    if (availableAccounts.length === 0) {
        return res.json({ success: false, message: "ขออภัย ไอดีในคลังหมดเกลี้ยงแล้ว!", outOfStock: true });
    }

    const currentTickets = user.tickets || 0;
    if (currentTickets < selectedCount) {
        return res.json({ success: false, message: "สิทธิ์สุ่ม (Tickets) ของคุณไม่พอใช้งาน!" });
    }

    let historyBatch = [];
    let summaryRewards = {};
    let pityCounters = parsePityCounters(user.pity_counters);

    let steps = [
      { salt: user.step1_salt || 0, reward: user.step1_reward || 'normal' },
      { salt: user.step2_salt || 0, reward: user.step2_reward || 'normal' },
      { salt: user.step3_salt || 0, reward: user.step3_reward || 'normal' },
      { salt: user.step4_salt || 0, reward: user.step4_reward || 'normal' },
      { salt: user.step5_salt || 0, reward: user.step5_reward || 'normal' }
    ];

    const safeFacebookUrl = (user && user.facebook_url) ? user.facebook_url : '';
    
    let activePityCounters = {};
    targetAccList.forEach(acc => {
        const target = parseInt(acc.pity_target) || 0;
        const isFreeTicketReward = acc.title && (acc.title.includes("สิทธิ์สุ่มฟรี") || acc.title.includes("[ฟรีสิทธิ์]"));
        if (target > 0 && !isFreeTicketReward && pityCounters[acc.id] !== undefined) {
            activePityCounters[acc.id] = pityCounters[acc.id];
        }
    });
    pityCounters = activePityCounters;

    let clashDetected = false;
    let actualConsumedTickets = 0;
    let successfulWonAccIds = [];
    let freeTicketsWon = 0;

    for (let i = 0; i < selectedCount; i++) {
        if (availableAccounts.length === 0) {
            break;
        }

        actualConsumedTickets += 1;
        let reward = "";
        let handled = false;
        let wonAcc = null; 
        let isGuaranteeHit = false;

        for (let s = 0; s < steps.length; s++) {
            if (steps[s].salt > 0) {
                reward = "🧂 เกลือ";
                steps[s].salt -= 1; 
                handled = true;
                break;
            } else if (steps[s].salt === 0 && steps[s].reward && steps[s].reward !== 'normal') {
                let cleanRewardName = steps[s].reward.replace(/^\[.*?\]\s*/, '');
                let matchedIndex = availableAccounts.findIndex(a => a.title === cleanRewardName && a.status !== 'out_of_stock');
                if (matchedIndex !== -1) {
                    wonAcc = availableAccounts.splice(matchedIndex, 1)[0];
                    const isFreeTicket = wonAcc.title && (wonAcc.title.includes("สิทธิ์สุ่มฟรี") || wonAcc.title.includes("[ฟรีสิทธิ์]"));

                    if (isFreeTicket) {
                        const matchNum = wonAcc.title.match(/\d+/);
                        const tCount = matchNum ? parseInt(matchNum[0]) : 10;
                        freeTicketsWon += tCount;
                        reward = `🎟️ [สิทธิ์สุ่มฟรี] ${wonAcc.title}`;
                    } else {
                        let exactRarity = wonAcc.rarity || 'Normal';
                        let iconSymbol = "🛡️";
                        if (exactRarity === "เทพมังกร") iconSymbol = "🐲";
                        else if (exactRarity === "SSR") iconSymbol = "👑";
                        else if (exactRarity === "SS+") iconSymbol = "⚔️";
                        else if (exactRarity === "S") iconSymbol = "🔮";
                        reward = `${iconSymbol} [${exactRarity}] ${cleanRewardName}`;
                    }

                    successfulWonAccIds.push(wonAcc.id);
                    isGuaranteeHit = true;
                } else {
                    reward = "🧂 เกลือ";
                    if (steps[s].reward !== 'normal') clashDetected = true;
                }

                steps[s].reward = 'normal'; 
                handled = true;
                break;
            }
        }

        if (!handled) {
            const pityTargetIndex = availableAccounts.findIndex(acc => {
                const target = parseInt(acc.pity_target) || 0;
                const currentCount = pityCounters[acc.id] || 0;
                const isFreeTicket = acc.title && (acc.title.includes("สิทธิ์สุ่มฟรี") || acc.title.includes("[ฟรีสิทธิ์]"));
                return target > 0 && !isFreeTicket && currentCount >= target && acc.status !== 'out_of_stock';
            });

            if (pityTargetIndex !== -1) {
                wonAcc = availableAccounts.splice(pityTargetIndex, 1)[0];
                let badgeColorIcon = "🛡️";
                if (wonAcc.rarity === "เทพมังกร") badgeColorIcon = "🐲";
                else if (wonAcc.rarity === "SSR") badgeColorIcon = "👑";
                else if (wonAcc.rarity === "SS+") badgeColorIcon = "⚔️";
                else if (wonAcc.rarity === "S") badgeColorIcon = "🔮";

                reward = `${badgeColorIcon} [${wonAcc.rarity}] ${wonAcc.title}`;
                successfulWonAccIds.push(wonAcc.id);
                isGuaranteeHit = true;
                handled = true;
            }
        }

        if (!handled) {
            if (availableAccounts.length === 0) {
                reward = "🧂 เกลือ";
            } else {
                const rand = Math.random() * 100;
                let winningAccIndex = -1;

                for (let aIndex = 0; aIndex < availableAccounts.length; aIndex++) {
                    const rate = parseFloat(availableAccounts[aIndex].rate) || 0;
                    if (rand < rate) {
                        winningAccIndex = aIndex;
                        break;
                    }
                }

                if (winningAccIndex !== -1) {
                    wonAcc = availableAccounts.splice(winningAccIndex, 1)[0];
                    const isFreeTicket = wonAcc.title && (wonAcc.title.includes("สิทธิ์สุ่มฟรี") || wonAcc.title.includes("[ฟรีสิทธิ์]"));

                    if (isFreeTicket) {
                        const matchNum = wonAcc.title.match(/\d+/);
                        const tCount = matchNum ? parseInt(matchNum[0]) : 10;
                        freeTicketsWon += tCount;
                        reward = `🎟️ [สิทธิ์สุ่มฟรี] ${wonAcc.title}`;
                    } else {
                        let badgeColorIcon = "🛡️";
                        if (wonAcc.rarity === "เทพมังกร") badgeColorIcon = "🐲";
                        else if (wonAcc.rarity === "SSR") badgeColorIcon = "👑";
                        else if (wonAcc.rarity === "SS+") badgeColorIcon = "⚔️";
                        else if (wonAcc.rarity === "S") badgeColorIcon = "🔮";

                        reward = `${badgeColorIcon} [${wonAcc.rarity}] ${wonAcc.title}`;
                    }

                    successfulWonAccIds.push(wonAcc.id);
                    
                    const matchedTargetConfig = targetAccList.find(t => t.id === wonAcc.id);
                    if (matchedTargetConfig && parseInt(matchedTargetConfig.pity_target) > 0 && !isFreeTicket) {
                        const currentC = pityCounters[wonAcc.id] || 0;
                        if (currentC >= parseInt(matchedTargetConfig.pity_target)) {
                            isGuaranteeHit = true;
                        }
                    }
                } else {
                    reward = "🧂 เกลือ";
                }
            }
        }

        if (isGuaranteeHit) {
            targetAccList.forEach(acc => {
                const target = parseInt(acc.pity_target) || 0;
                const isFreeTicket = acc.title && (acc.title.includes("สิทธิ์สุ่มฟรี") || acc.title.includes("[ฟรีสิทธิ์]"));
                if (target > 0 && !isFreeTicket) {
                    pityCounters[acc.id] = 0; 
                }
            });
        } else {
            targetAccList.forEach(acc => {
                const target = parseInt(acc.pity_target) || 0;
                const isFreeTicket = acc.title && (acc.title.includes("สิทธิ์สุ่มฟรี") || acc.title.includes("[ฟรีสิทธิ์]"));
                if (target > 0 && !isFreeTicket) {
                    if (wonAcc && wonAcc.id === acc.id) {
                        pityCounters[acc.id] = 0;
                    } else {
                        pityCounters[acc.id] = (pityCounters[acc.id] || 0) + 1; 
                    }
                }
            });
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

    const newTickets = (user.tickets || 0) - actualConsumedTickets + freeTicketsWon;

    await Promise.all([
        successfulWonAccIds.length > 0 ? supabase.from('game_accounts').update({ status: 'out_of_stock' }).in('id', successfulWonAccIds) : Promise.resolve(),
        supabase.from('users').update({ 
            tickets: parseInt(newTickets) || 0, 
            pity_counters: JSON.stringify(pityCounters),
            step1_salt: parseInt(steps[0].salt) || 0, step1_reward: steps[0].reward || 'normal',
            step2_salt: parseInt(steps[1].salt) || 0, step2_reward: steps[1].reward || 'normal',
            step3_salt: parseInt(steps[2].salt) || 0, step3_reward: steps[2].reward || 'normal',
            step4_salt: parseInt(steps[3].salt) || 0, step4_reward: steps[3].reward || 'normal',
            step5_salt: parseInt(steps[4].salt) || 0, step5_reward: steps[4].reward || 'normal'
        }).eq('username', username),
        historyBatch.length > 0 ? supabase.from('history').insert(historyBatch) : Promise.resolve()
    ]);

    return res.json({
        success: true,
        newTickets: newTickets,
        summaryRewards: summaryRewards,
        clashDetected: clashDetected
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
    await supabase.from('users').update({ points: (user.points || 0) + pointsToAdd }).eq('username', username);
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

  await Promise.all([
    supabase.from('pending_withdraw').delete().eq('id', withdraw_id),
    supabase.from('history').delete().eq('username', username).eq('is_withdrawn', true)
  ]);

  res.send(`<script>alert("อนุมัติส่งมอบรางวัลให้ ${username} เรียบร้อย! ประวัติสำรองถูกลบออกแล้ว"); window.location.href="/admin";</script>`);
});

app.post("/admin/add-game-account-json", upload.single('image_file'), async (req, res) => {
  if (!req.session.isAdmin) return res.status(403).json({ success: false, message: "Unauthorized" });
  const { title, rarity, rate, pity_target } = req.body;

  let imageUrl = await uploadToSupabaseStorage(req.file);

  const { data, error } = await supabase.from('game_accounts').insert([{
      title,
      rarity: rarity || 'Normal',
      rate: parseFloat(rate) || 1.0,
      pity_target: parseInt(pity_target) || 0,
      image_url: imageUrl,
      status: 'available'
  }]).select();

  if (error) {
      return res.json({ success: false, message: error.message });
  }

  res.json({ success: true, newAccount: data[0] });
});

app.post("/admin/delete-game-account", async (req, res) => {
  if (!req.session.isAdmin) return res.redirect("/admin");
  const { acc_id } = req.body;
  
  await supabase.from('game_accounts').delete().eq('id', acc_id);
  res.send(`<script>alert("ลบรางวัลออกจากคลังเรียบร้อยแล้ว!"); window.location.href="/admin";</script>`);
});

app.post("/admin/clear-all-game-accounts", async (req, res) => {
  if (!req.session.isAdmin) return res.redirect("/admin");
  await supabase.from('game_accounts').delete().neq('id', 0);
  res.send(`<script>alert("ลบและเคลียร์คลังรางวัลทั้งหมดเกลี้ยงจนเหลือ 0 รายการเรียบร้อยแล้ว!"); window.location.href="/admin";</script>`);
});

app.post("/admin/update-all-game-accounts", upload.any(), async (req, res) => {
  if (!req.session.isAdmin) return res.redirect("/admin");
  
  const { ids, rates, pity_targets, old_image_urls, statuses } = req.body;

  if (ids) {
      const idArray = Array.isArray(ids) ? ids : [ids];
      const rateArray = Array.isArray(rates) ? rates : [rates];
      const pityArray = Array.isArray(pity_targets) ? pity_targets : [pity_targets];
      const imageArray = Array.isArray(old_image_urls) ? old_image_urls : [old_image_urls];
      const statusArray = Array.isArray(statuses) ? statuses : [statuses];
      
      const processPromises = idArray.map(async (accId, i) => {
          const newRate = parseFloat(rateArray[i]) || 0;
          const newPity = parseInt(pityArray[i]) || 0;
          const oldImage = imageArray[i] || '';
          const newStatus = statusArray[i] || 'available';

          let finalImageUrl = oldImage;
          const uploadedFile = req.files ? req.files.find(f => f.fieldname === `image_file_${accId}`) : null;
          if (uploadedFile) {
              const newUploadedUrl = await uploadToSupabaseStorage(uploadedFile);
              if (newUploadedUrl) finalImageUrl = newUploadedUrl;
          }

          return supabase.from('game_accounts').update({
              rate: newRate,
              pity_target: newPity,
              image_url: finalImageUrl,
              status: newStatus
          }).eq('id', accId);
      });

      await Promise.all(processPromises);
  }

  res.send(`<script>alert("บันทึกข้อมูลและอัปเดตคลังรางวัลสำเร็จ!"); window.location.href="/admin";</script>`);
});

app.post("/admin/add-caption", async (req, res) => {
  if (!req.session.isAdmin) return res.redirect("/admin");
  const { title, content, price, tickets_bonus } = req.body;
  await supabase.from('captions').insert([{
      title,
      content,
      price: parseFloat(price) || 0,
      tickets_bonus: parseInt(tickets_bonus) || 0
  }]);
  res.send(`<script>alert("เพิ่มแคปชั่นลงร้านค้าสำเร็จ!"); window.location.href="/admin";</script>`);
});

app.post("/admin/delete-caption", async (req, res) => {
  if (!req.session.isAdmin) return res.redirect("/admin");
  await supabase.from('captions').delete().eq('id', req.body.caption_id);
  res.send(`<script>alert("ลบแคปชั่นออกจากร้านค้าสำเร็จ!"); window.location.href="/admin";</script>`);
});

app.post("/admin/adjust-user-points", async (req, res) => {
  if (!req.session.isAdmin) return res.redirect("/admin");
  const { username, action_type, point_amount } = req.body;
  const val = parseInt(point_amount) || 0;

  if (val <= 0) {
      return res.send(`<script>alert("กรุณากรอกจำนวนแต้มให้ถูกต้อง!"); window.location.href="/admin";</script>`);
  }

  const { data: user } = await supabase.from('users').select('points').eq('username', username).single();
  if (user) {
      let newPoints = user.points || 0;
      if (action_type === 'add') {
          newPoints += val;
      } else if (action_type === 'subtract') {
          newPoints = Math.max(0, newPoints - val);
      }
      await supabase.from('users').update({ points: newPoints }).eq('username', username);
  }

  res.send(`<script>alert("ปรับแต้มสมาชิก ${username} เรียบร้อยแล้ว!"); window.location.href="/admin";</script>`);
});

app.post("/admin/adjust-user-tickets", async (req, res) => {
  if (!req.session.isAdmin) return res.redirect("/admin");
  const { username, action_type, ticket_amount } = req.body;
  const val = parseInt(ticket_amount) || 0;

  const { data: user } = await supabase.from('users').select('tickets').eq('username', username).single();
  if (user) {
      let newTickets = user.tickets || 0;
      if (action_type === 'add') {
          newTickets += val;
      } else if (action_type === 'subtract') {
          newTickets = Math.max(0, newTickets - val);
      }
      await supabase.from('users').update({ tickets: newTickets }).eq('username', username);
  }

  res.send(`<script>alert("ปรับสิทธิ์สุ่ม Tickets ของสมาชิก ${username} เรียบร้อยแล้ว!"); window.location.href="/admin";</script>`);
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

  res.send(`<script>alert("บันทึกเรต 5 สเต็ปของ ${username} สำเร็จ!"); window.location.href="/admin";</script>`);
});

app.post("/admin/delete-user", async (req, res) => {
  if (!req.session.isAdmin) return res.redirect("/admin");
  const { username } = req.body;

  await Promise.all([
    supabase.from('users').delete().eq('username', username),
    supabase.from('history').delete().eq('username', username),
    supabase.from('pending_topup').delete().eq('username', username),
    supabase.from('pending_withdraw').delete().eq('username', username)
  ]);

  res.send(`<script>alert("ลบสมาชิก ${username} เรียบร้อยแล้ว!"); window.location.href="/admin";</script>`);
});

async function renderAdminDashboard(req, res) {
  const [usersRes, pendingRes, pendingWithdrawRes, gameAccRes, captionsRes] = await Promise.all([
    supabase.from('users').select('*').order('id', { ascending: false }),
    supabase.from('pending_topup').select('*').eq('status', 'pending'),
    supabase.from('pending_withdraw').select('*').eq('status', 'pending'),
    supabase.from('game_accounts').select('*').order('id', { ascending: false }),
    supabase.from('captions').select('*').order('id', { ascending: false })
  ]);

  const usersRows = usersRes.data;
  const pendingRows = pendingRes.data;
  const pendingWithdrawRows = pendingWithdrawRes.data;
  const gameAccounts = gameAccRes.data;
  const captionsRows = captionsRes.data || [];

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
      let detailedItemsHtml = "";
      try {
        const parsed = JSON.parse(w.history_snapshot);
        rewardsList = parsed.slice(0, 3).join(", ") + (parsed.length > 3 ? ` และอื่นๆ (${parsed.length} รายการ)` : '');
        parsed.forEach((item, idx) => {
            detailedItemsHtml += `<li>${idx + 1}. ${item}</li>`;
        });
      } catch(e) { 
          rewardsList = "ไอดี Line Rangers"; 
          detailedItemsHtml = "ไม่สามารถแสดงรายละเอียดได้";
      }

      withdrawHtml += `<tr>
        <td>${index + 1}</td>
        <td><b>${w.username}</b></td>
        <td><a href="${w.facebook_url || '#'}" target="_blank" style="background:#70a1ff; color:#fff; padding:4px 8px; border-radius:4px; text-decoration:none; font-size:12px; font-weight:bold;">👤 กดดูโปรไฟล์ Facebook</a></td>
        <td style="color:#ffd700; font-size:12px; text-align:left;">
           <b>รายการหลัก:</b> ${rewardsList} <br>
           <details style="margin-top:6px; background:rgba(0,0,0,0.2); padding:4px 8px; border-radius:4px; border:1px solid #444;">
               <summary style="color:#00d2d3; font-weight:bold; font-size:12px; cursor:pointer;">🔍 [ปุ่มกดดูประวัติ] แสดงประวัติการกดขอรับรางวัลทั้งหมด (${w.total_opens} ครั้ง)</summary>
               <ul style="padding-left:18px; margin:6px 0; font-size:11px; color:#a4b0be; max-height:120px; overflow-y:auto;">
                   ${detailedItemsHtml}
               </ul>
           </details>
        </td>
        <td>
          <form action="/admin/approve-withdraw" method="POST" style="margin:0;" onsubmit="return confirm('ยืนยันอนุมัติและเคลียร์ประวัติของ ${w.username}?');">
            <input type="hidden" name="withdraw_id" value="${w.id}">
            <input type="hidden" name="username" value="${w.username}">
            <button type="submit" style="background:#2ed573; color:#fff; border:none; padding:6px 12px; border-radius:4px; font-weight:bold; cursor:pointer;">✅ อนุมัติส่งมอบ</button>
          </form>
        </td>
      </tr>`;
    });
  } else {
    withdrawHtml = `<tr><td colspan="5" style="color:#aaa; padding:12px;">ไม่มีคำขอรับรางวัลที่ค้างอยู่</td></tr>`;
  }

  let captionsTableHtml = "";
  if (captionsRows.length > 0) {
      captionsRows.forEach((c, idx) => {
          captionsTableHtml += `<tr>
              <td>${idx + 1}</td>
              <td><b>${c.title}</b></td>
              <td style="color:#a4b0be; font-size:11px;">${c.content}</td>
              <td style="color:#2ed573;"><b>${c.price} แต้ม</b></td>
              <td style="color:#ffd700;"><b>+${c.tickets_bonus} ครั้ง</b></td>
              <td>
                  <form action="/admin/delete-caption" method="POST" onsubmit="return confirm('ยืนยันลบแคปชั่นนี้?');">
                      <input type="hidden" name="caption_id" value="${c.id}">
                      <button type="submit" style="background:#ff4757; color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-weight:bold; font-size:11px;">🗑️ ลบ</button>
                  </form>
              </td>
          </tr>`;
      });
  } else {
      captionsTableHtml = `<tr><td colspan="6" style="color:#aaa; padding:12px;">ยังไม่มีแคปชั่นในระบบร้านค้า</td></tr>`;
  }

  let gameAccHtml = "";
  if (gameAccounts && gameAccounts.length > 0) {
    gameAccounts.forEach((acc, i) => {
      const isOut = acc.status === 'out_of_stock';
      let thumbImg = acc.image_url ? `<a href="${acc.image_url}" target="_blank"><img src="${acc.image_url}" style="width:30px; height:30px; object-fit:cover; border-radius:4px; vertical-align:middle;"></a>` : '<span style="font-size:10px; color:#aaa;">ไม่มีรูป</span>';

      gameAccHtml += `<tr id="row-acc-${acc.id}">
        <td>${i+1}</td>
        <td><b>${acc.title}</b></td>
        <td style="color:#ffd700;">${acc.rarity || 'Normal'}</td>
        <td>
           <input type="hidden" name="ids" value="${acc.id}">
           <input type="number" step="0.0001" name="rates" value="${acc.rate || 0}" style="width:50px; padding:3px; text-align:center;"> %
        </td>
        <td>
           <input type="number" name="pity_targets" value="${acc.pity_target || 0}" placeholder="0 = ปิด" style="width:45px; padding:3px; text-align:center; color:#ff6b81; font-weight:bold;"> ครั้ง
        </td>
        <td>
           <input type="hidden" name="old_image_urls" value="${acc.image_url || ''}">
           ${thumbImg} <input type="file" name="image_file_${acc.id}" accept="image/*" style="font-size:10px; width:120px; color:#fff;">
        </td>
        <td>
           <select name="statuses" style="padding:3px; font-size:11px;">
              <option value="available" ${!isOut ? 'selected' : ''}>🟢 มีของ</option>
              <option value="out_of_stock" ${isOut ? 'selected' : ''}>❌ หมด</option>
           </select>
        </td>
        <td>
          <form action="/admin/delete-game-account" method="POST" style="margin:0;" onsubmit="return confirm('ยืนยันลบรางวัล ${acc.title}?');">
            <input type="hidden" name="acc_id" value="${acc.id}">
            <button type="submit" style="background:#ff4757; color:#fff; border:none; padding:5px 8px; border-radius:4px; cursor:pointer; font-weight:bold;">🗑️ ลบ</button>
          </form>
        </td>
      </tr>`;
    });
  } else {
    gameAccHtml = `<tr><td colspan="8" style="color:#aaa; padding:15px;" id="no-game-acc-row">คลังรางวัลว่างเปล่า (0 รายการ) - สามารถกดเพิ่มรางวัลใหม่ด้านบนได้ทันที</td></tr>`;
  }

  function renderRewardOptions(currentVal) {
      let opts = `<option value="normal" ${currentVal==='normal'?'selected':''}>--- สุ่มตามเรตปกติ ---</option>`;
      opts += `<option value="always_salt" ${currentVal==='always_salt'?'selected':''}>🔒 บังคับเกลือ</option>`;
      if (gameAccounts) {
          gameAccounts.forEach(acc => {
              const val = `[${acc.rarity || 'Normal'}] ${acc.title}`;
              opts += `<option value="${val}" ${currentVal===val?'selected':''}>🛡️ ออกรางวัล: ${acc.title}</option>`;
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
        <td><b style="color:#ffd700;">${u.points || 0}</b> แต้ม<br><b style="color:#00ff87;">${u.tickets || 0}</b> สิทธิ์สุ่ม</td>
        <td>
          <form action="/admin/adjust-user-points" method="POST" style="background:rgba(0,0,0,0.2); padding:6px; border-radius:6px; margin-bottom:6px; display:flex; gap:5px; align-items:center;">
            <input type="hidden" name="username" value="${u.username}">
            <select name="action_type" style="padding:3px; font-size:11px;">
               <option value="add">➕ เพิ่มแต้ม</option>
               <option value="subtract">➖ ลดแต้ม</option>
            </select>
            <input type="number" name="point_amount" placeholder="แต้ม" min="1" required style="width:60px; padding:3px; margin:0; font-size:11px;">
            <button type="submit" style="background:#2ed573; color:#fff; border:none; padding:3px 8px; border-radius:4px; font-weight:bold; cursor:pointer; font-size:11px;">ยืนยันแต้ม</button>
          </form>

          <form action="/admin/adjust-user-tickets" method="POST" style="background:rgba(0,0,0,0.2); padding:6px; border-radius:6px; margin-bottom:8px; display:flex; gap:5px; align-items:center;">
            <input type="hidden" name="username" value="${u.username}">
            <select name="action_type" style="padding:3px; font-size:11px;">
               <option value="add">➕ เพิ่มสิทธิ์</option>
               <option value="subtract">➖ ลดสิทธิ์</option>
            </select>
            <input type="number" name="ticket_amount" placeholder="สิทธิ์" min="1" required style="width:60px; padding:3px; margin:0; font-size:11px;">
            <button type="submit" style="background:#00d2d3; color:#000; border:none; padding:3px 8px; border-radius:4px; font-weight:bold; cursor:pointer; font-size:11px;">ยืนยันสิทธิ์</button>
          </form>

          <form action="/admin/update-user-luck" method="POST" style="background:rgba(0,0,0,0.3); padding:6px; border-radius:6px; text-align:left;">
            <input type="hidden" name="username" value="${u.username}">
            <div style="font-size:11px; color:#ffd700; margin-bottom:3px;">⚙️ ตั้งค่าเรต 5 สเต็ปยูสนี้:</div>
            <div style="font-size:10px; margin-bottom:2px;">สเต็ป 1: เกลือ <input type="number" name="step1_salt" value="${u.step1_salt||0}" style="width:35px;"> ครั้ง -> จากนั้นออกรางวัล <select name="step1_reward">${renderRewardOptions(u.step1_reward)}</select></div>
            <div style="font-size:10px; margin-bottom:2px;">สเต็ป 2: เกลือ <input type="number" name="step2_salt" value="${u.step2_salt||0}" style="width:35px;"> ครั้ง -> จากนั้นออกรางวัล <select name="step2_reward">${renderRewardOptions(u.step2_reward)}</select></div>
            <div style="font-size:10px; margin-bottom:2px;">สเต็ป 3: เกลือ <input type="number" name="step3_salt" value="${u.step3_salt||0}" style="width:35px;"> ครั้ง -> จากนั้นออกรางวัล <select name="step3_reward">${renderRewardOptions(u.step3_reward)}</select></div>
            <div style="font-size:10px; margin-bottom:2px;">สเต็ป 4: เกลือ <input type="number" name="step4_salt" value="${u.step4_salt||0}" style="width:35px;"> ครั้ง -> จากนั้นออกรางวัล <select name="step4_reward">${renderRewardOptions(u.step4_reward)}</select></div>
            <div style="font-size:10px; margin-bottom:4px;">สเต็ป 5: เกลือ <input type="number" name="step5_salt" value="${u.step5_salt||0}" style="width:35px;"> ครั้ง -> จากนั้นออกรางวัล <select name="step5_reward">${renderRewardOptions(u.step5_reward)}</select></div>
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

  let clearAllButtonHtml = "";
  if (gameAccounts && gameAccounts.length > 0) {
      clearAllButtonHtml = `
        <form action="/admin/clear-all-game-accounts" method="POST" onsubmit="return confirm('⚠️ คำเตือน: คุณต้องการลบรางวัลทั้งหมดในคลังทิ้งจนเกลี้ยง (เหลือ 0) จริงๆ หรือไม่?');" style="display:inline-block; margin-left: 10px;">
            <button type="submit" style="background:#ff4757; color:#fff; border:none; border-radius:6px; font-weight:bold; cursor:pointer; padding:9px 15px; font-size:13px; box-shadow:0 0 10px rgba(255,71,87,0.4);">🗑️ ลบเกลี้ยงทั้งหมด (Clear All)</button>
        </form>
      `;
  }

  res.send(`
    <body style="background:#1e1e2f; color:#fff; text-align:center; padding:20px; font-family:sans-serif;">
      <h2>🛠️ ระบบจัดการหลังบ้านแอดมิน (Line Rangers Box)</h2>
      <a href="/admin/logout" style="color:#ff4757; font-weight:bold; text-decoration:none;">🔒 ออกจากระบบ</a> | <a href="/" style="color:#70a1ff; text-decoration:none;">🏠 กลับหน้าแรก</a>

      <h3 style="color:#ffd700; margin-top:25px;">🎁 รายการคำขอรับรางวัลไอดี Line Rangers จากผู้เล่น</h3>
      <table border="1" style="margin: 0 auto 30px auto; border-collapse: collapse; width: 900px; background:#2b2b40; border-color:#444;">
        <tr style="background:#3d3d5c;"><th>ลำดับ</th><th>Username</th><th>Facebook ผู้เล่น</th><th>ประวัติการขอรับรางวัล (กดปุ่มดูเพื่อขยาย)</th><th>จัดการ</th></tr>
        ${withdrawHtml}
      </table>

      <div style="background:#2b2b40; padding:20px; border-radius:10px; border:1px solid #444; width:980px; margin:20px auto; text-align:left;">
          <h3 style="color:#00d2d3; margin-top:0;">🛒 จัดการแพ็กเกจแคปชั่นในร้านค้า (Capsule Store)</h3>
          <form action="/admin/add-caption" method="POST" style="display:flex; gap:8px; align-items:center; margin-bottom:15px;">
              <input type="text" name="title" placeholder="ชื่อแพ็กเกจ เช่น แคปชั่นสายเปย์" required style="padding:8px; flex:1.5;">
              <input type="text" name="content" placeholder="ข้อความแคปชั่นดิจิทัล" required style="padding:8px; flex:2.5;">
              <input type="number" name="price" placeholder="ราคา (แต้ม)" required style="padding:8px; width:90px;">
              <input type="number" name="tickets_bonus" placeholder="แถมสิทธิ์สุ่ม" required style="padding:8px; width:90px;">
              <button type="submit" style="background:#00d2d3; color:#000; border:none; border-radius:5px; font-weight:bold; cursor:pointer; padding:9px 15px;">เพิ่มแพ็กเกจ</button>
          </form>
          <table border="1" style="width:100%; border-collapse:collapse; background:#1e1e2f; border-color:#444; font-size:12px; text-align:center;">
              <tr style="background:#3d3d5c;"><th>ลำดับ</th><th>ชื่อแพ็กเกจ</th><th>ข้อความแคปชั่น</th><th>ราคา</th><th>แถมสิทธิ์สุ่ม</th><th>จัดการ</th></tr>
              ${captionsTableHtml}
          </table>
      </div>

      <div style="background:#2b2b40; padding:20px; border-radius:10px; border:1px solid #444; width:980px; margin:20px auto; text-align:left;">
          <h3 style="color:#2ed573; margin-top:0;">➕ เพิ่มไอดีเกม หรือ รางวัล "สิทธิ์สุ่มฟรี" เข้าคลัง</h3>
          <form id="add-game-form" onsubmit="addGameAccountDynamic(event)" style="display:flex; gap:8px; align-items:center; margin-bottom:20px;">
              <input type="text" id="new-title" placeholder="ชื่อรางวัล เช่น [ฟรีสิทธิ์] สิทธิ์สุ่มฟรี 10 ครั้ง" required style="padding:8px; flex:2;">
              <select id="new-rarity" style="padding:8px;">
                  <option value="Normal">ระดับ Normal</option>
                  <option value="S">ระดับ S</option>
                  <option value="SS+">ระดับ SS+</option>
                  <option value="SSR">ระดับ SSR</option>
                  <option value="เทพมังกร">ระดับ เทพมังกร</option>
              </select>
              <input type="number" step="0.0001" id="new-rate" placeholder="อัตรา %" required style="padding:8px; width:70px;">
              <input type="number" id="new-pity" placeholder="การันตี" style="padding:8px; width:70px;">
              <input type="file" id="new-image" accept="image/*" style="padding:5px; background:#fff; color:#000; border-radius:4px; width:140px;">
              <button type="submit" id="add-btn-submit" style="background:#2ed573; color:#fff; border:none; border-radius:5px; font-weight:bold; cursor:pointer; padding:9px 12px;">เพิ่มรางวัล</button>
          </form>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <h4 style="color:#ffd700; margin:0;">📦 คลังรางวัล และ การตั้งค่าการันตี / แก้ไข</h4>
              <div>
                  ${clearAllButtonHtml}
              </div>
          </div>

          <form action="/admin/update-all-game-accounts" method="POST" enctype="multipart/form-data">
              <table border="1" style="width:100%; border-collapse:collapse; background:#1e1e2f; border-color:#444; font-size:12px; text-align:center;">
                 <tr style="background:#3d3d5c;"><th>ลำดับ</th><th>ชื่อรางวัล</th><th>ระดับ</th><th>อัตราออก (%)</th><th>🎯 การันตี</th><th>🖼️ รูปภาพ (เปลี่ยนไฟล์)</th><th>สถานะ</th><th>จัดการ</th></tr>
                 <tbody id="game-accounts-tbody">
                     ${gameAccHtml}
                 </tbody>
              </table>
              <button type="submit" style="background:#2ed573; color:#fff; border:none; border-radius:6px; font-weight:bold; cursor:pointer; padding:12px 20px; margin-top:15px; width:100%; font-size:14px; box-shadow:0 0 10px rgba(46,213,115,0.4);">💾 บันทึกการตั้งค่าเรตทั้งหมด</button>
          </form>
      </div>

      <h3 style="color:#ffd700;">📥 รายการสลิปเติมเงินรอตรวจสอบ</h3>
      <table border="1" style="margin:0 auto 30px auto; border-collapse:collapse; width:800px; background:#2b2b40; border-color:#444;">
        <tr style="background:#3d3d5c;"><th>ลำดับ</th><th>Username</th><th>ช่องทาง</th><th>ยอดเงิน</th><th>สลิป</th><th>จัดการ</th></tr>
        ${pendingSlipHtml}
      </table>

      <h3 style="color:#ffd700;">👥 รายชื่อสมาชิกทั้งหมด และ จัดการแต้ม / สิทธิ์สุ่ม / เรตเกลือ</h3>
      <table border="1" style="margin:0 auto 30px auto; border-collapse:collapse; width:950px; background:#2b2b40; border-color:#444;">
        <tr style="background:#3d3d5c;"><th>ลำดับ</th><th>Username</th><th>Facebook Link</th><th>แต้ม / สิทธิ์สุ่ม</th><th>จัดการแต้ม / สิทธิ์สุ่ม / เรตเกลือ</th></tr>
        ${userHtml}
      </table>

      <script>
          async function addGameAccountDynamic(event) {
              event.preventDefault();
              const title = document.getElementById('new-title').value;
              const rarity = document.getElementById('new-rarity').value;
              const rate = document.getElementById('new-rate').value;
              const pity = document.getElementById('new-pity').value;
              const imageFile = document.getElementById('new-image').files[0];

              const formData = new FormData();
              formData.append('title', title);
              formData.append('rarity', rarity);
              formData.append('rate', rate);
              formData.append('pity_target', pity);
              if (imageFile) {
                  formData.append('image_file', imageFile);
              }

              const btn = document.getElementById('add-btn-submit');
              btn.disabled = true;
              btn.innerText = 'กำลังเพิ่ม...';

              try {
                  const res = await fetch('/admin/add-game-account-json', {
                      method: 'POST',
                      body: formData
                  });
                  const result = await res.json();
                  if (result.success) {
                      location.reload();
                  } else {
                      alert("เกิดข้อผิดพลาด: " + result.message);
                      btn.disabled = false;
                      btn.innerText = 'เพิ่มรางวัล';
                  }
              } catch (e) {
                  alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
                  btn.disabled = false;
                  btn.innerText = 'เพิ่มรางวัล';
              }
          }
      </script>
    </body>
  `);
}

app.listen(PORT, () => {
  console.log("Server running smoothly on port " + PORT);
});