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
    secret: process.env.SESSION_SECRET || 'tree_game_secret_2026',
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

// ------------------- CSS THEME: TREE & GARDEN GAMIFICATION -------------------
const treeThemeCSS = `
    * { box-sizing: border-box; }
    body { 
        background: radial-gradient(circle at 50% 30%, #1b4d3e 0%, #0b2219 50%, #040e0a 100%);
        color: #ffffff; 
        text-align: center; 
        margin: 0;
        min-height: 100vh;
        font-family: 'Kanit', sans-serif;
        overflow-x: hidden;
        position: relative;
    }
    .winner-ticker-banner {
        background: linear-gradient(90deg, #2ed573, #ffa502, #00d2d3);
        color: #000;
        font-weight: 800;
        font-size: 13px;
        padding: 8px 0;
        position: relative;
        z-index: 10;
        box-shadow: 0 2px 15px rgba(0,0,0,0.5);
    }
    .scifi-box {
        background: rgba(13, 30, 22, 0.94);
        backdrop-filter: blur(25px);
        border: 2px solid #2ed573;
        border-radius: 24px;
        box-shadow: 0 0 40px rgba(46, 213, 115, 0.3);
        position: relative;
        z-index: 4;
        margin: 20px auto;
        padding: 25px;
        width: 92%;
        max-width: 480px;
    }
    .tree-stage-box {
        background: rgba(0, 0, 0, 0.4);
        border: 2px dashed #2ed573;
        border-radius: 16px;
        padding: 20px;
        margin: 15px 0;
        text-align: center;
    }
    .progress-bar-container {
        background: #1b1e2e;
        border-radius: 10px;
        overflow: hidden;
        height: 20px;
        border: 1px solid #2ed573;
        margin: 10px 0;
        position: relative;
    }
    .progress-bar-fill {
        background: linear-gradient(90deg, #2ed573, #00d2d3);
        height: 100%;
        width: 0%;
        transition: width 0.5s ease;
    }
`;

// ------------------- ROUTES -------------------

app.get("/", async (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="th">
    <head>
        <meta charset="UTF-8">
        <title>🌱 Tree Garden - หน้าแรก</title>
        <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;600;800&display=swap" rel="stylesheet">
        <style>
            ${treeThemeCSS}
            .btn-scifi { display: block; width: 100%; padding: 14px; margin: 15px 0; border-radius: 12px; font-size: 16px; font-weight: 800; text-decoration: none; font-family: 'Kanit'; cursor: pointer; }
            .btn-login { background: linear-gradient(135deg, #2ed573, #17b978); color: #000; }
            .btn-reg { background: linear-gradient(135deg, #1e90ff, #3742fa); color: #fff; }
        </style>
    </head>
    <body>
        <div class="winner-ticker-banner">🌱 ยินดีต้อนรับสู่ระบบปลูกต้นไม้และซื้อปุ๋ยเติบโตอัตโนมัติ! 🌱</div>
        <div class="scifi-box">
            <h1>🌳 TREE GARDEN SYSTEM</h1>
            <p style="color: #a4b0be; font-size: 13px;">ปลูกต้นไม้ประจำตัวคุณ ใส่ปุ๋ยเพื่อเร่งโต หรือรอรับรางวัลใหญ่เมื่อโตเต็มที่!</p>
            <a href="/login" class="btn-scifi btn-login">🔑 เข้าสู่สวนต้นไม้</a>
            <a href="/register" class="btn-scifi btn-reg">📝 สมัครสมาชิกใหม่</a>
        </div>
    </body>
    </html>
  `);
});

app.get("/register", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="th">
    <head><meta charset="UTF-8"><title>สมัครสมาชิก</title><link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;600&display=swap" rel="stylesheet">
    <style>${treeThemeCSS}
    .container { background: rgba(13, 30, 22, 0.94); padding: 25px; border-radius: 16px; display: inline-block; width: 360px; text-align: left; border: 1px solid #2ed573; margin-top:20px; }</style>
    </head>
    <body>
        <div class="container">
            <h2 style="color:#2ed573; text-align:center;">📝 สมัครสมาชิก</h2>
            <form action="/register" method="POST">
                <label>Username:</label>
                <input type="text" name="username" required style="width:100%; padding:10px; margin:5px 0 15px 0; background:#0b2219; color:#fff; border:1px solid #2ed573; border-radius:6px;">
                <label>Password:</label>
                <input type="password" name="password" required style="width:100%; padding:10px; margin:5px 0 15px 0; background:#0b2219; color:#fff; border:1px solid #2ed573; border-radius:6px;">
                <button type="submit" style="width:100%; background:#2ed573; color:#000; padding:12px; border:none; border-radius:6px; font-weight:bold; cursor:pointer; font-family:'Kanit';">ยืนยันการสมัคร</button>
            </form>
            <a href="/" style="display:block; text-align:center; margin-top:15px; color:#70a1ff; text-decoration:none;">กลับหน้าแรก</a>
        </div>
    </body>
    </html>
  `);
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  try {
    const { error } = await supabase.from('users').insert([{ 
        username, 
        password, 
        points: 100, // แจกแต้มเริ่มต้นไว้ซื้อปุ๋ย
        tree_exp: 0,
        tree_level: 1,
        planted_at: new Date()
    }]);

    if (error) {
      return res.send(`<script>alert("ชื่อผู้ใช้นี้ซ้ำในระบบแล้ว!"); window.location.href="/register";</script>`);
    }
    res.send(`<script>alert("สมัครสมาชิกสำเร็จ! รับแต้มเริ่มต้น 100 แต้ม"); window.location.href="/login";</script>`);
  } catch (err) {
    res.send(`<script>alert("เกิดข้อผิดพลาด"); window.location.href="/register";</script>`);
  }
});

app.get("/login", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="th">
    <head><meta charset="UTF-8"><title>เข้าสู่ระบบ</title><link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;600&display=swap" rel="stylesheet">
    <style>${treeThemeCSS}
    .container { background: rgba(13, 30, 22, 0.94); padding: 25px; border-radius: 16px; display: inline-block; width: 350px; text-align: left; border: 1px solid #2ed573; margin-top:30px; }</style>
    </head>
    <body>
        <div class="container">
            <h2 style="color:#ffd700; text-align:center;">🔑 เข้าสู่ระบบ</h2>
            <form action="/login" method="POST">
                <label>Username:</label>
                <input type="text" name="username" required style="width:100%; padding:10px; margin:5px 0 15px 0; background:#0b2219; color:#fff; border:1px solid #2ed573; border-radius:6px;">
                <label>Password:</label>
                <input type="password" name="password" required style="width:100%; padding:10px; margin:5px 0 15px 0; background:#0b2219; color:#fff; border:1px solid #2ed573; border-radius:6px;">
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
  try {
    const { data: row } = await supabase.from('users').select('*').eq('username', username).eq('password', password).single();
    if (row) {
      res.redirect(`/garden?username=${row.username}`);
    } else {
      res.send(`<script>alert("รหัสผ่านหรือชื่อผู้ใช้ไม่ถูกต้อง!"); window.location.href="/login";</script>`);
    }
  } catch (err) {
    res.send(`<script>alert("เกิดข้อผิดพลาด"); window.location.href="/login";</script>`);
  }
});

// ------------------- GARDEN & TREE PAGE -------------------

app.get("/garden", async (req, res) => {
  const username = req.query.username;
  if (!username) return res.redirect("/login");

  try {
    const [userRes, fertilizersRes] = await Promise.all([
      supabase.from('users').select('*').eq('username', username).single(),
      supabase.from('fertilizers').select('*').order('price', { ascending: true })
    ]);

    const user = userRes.data;
    if (!user) return res.redirect("/login");

    // คำนวณการเติบโตอัตโนมัติตามเวลา (Passive Growth: 1 วัน = 1 EXP หรือตามกำหนด 365 วัน)
    const plantedTime = new Date(user.planted_at || user.created_at).getTime();
    const now = new Date().getTime();
    const daysPassed = Math.floor((now - plantedTime) / (1000 * 60 * 60 * 24));
    
    // คำนวณ EXP รวมจากเวลาที่ผ่านไป + ปุ๋ยที่ผู้ใช้เคยใส่ (บันทึกใน tree_exp)
    let totalExp = (user.tree_exp || 0) + daysPassed;
    let maxExp = 365; // 365 วันโตเต็มที่
    let progressPercent = Math.min(100, Math.floor((totalExp / maxExp) * 100));

    let fertilizers = fertilizersRes.data || [];
    let fertilizersHtml = "";

    if (fertilizers.length > 0) {
      fertilizers.forEach(f => {
        fertilizersHtml += `
          <div style="background:#0b2219; border:1px solid #2ed573; border-radius:10px; padding:12px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
              <div style="text-align:left;">
                  <b style="color:#ffd700;">🧪 ${f.title}</b>
                  <div style="font-size:11px; color:#a4b0be;">เพิ่มความเติบโต +${f.growth_bonus} วัน</div>
                  <div style="font-size:12px; color:#2ed573; font-weight:bold;">💰 ราคา: ${f.price} แต้ม</div>
              </div>
              <form action="/buy-fertilizer" method="POST">
                  <input type="hidden" name="username" value="${username}">
                  <input type="hidden" name="fertilizer_id" value="${f.id}">
                  <button type="submit" style="background:#2ed573; color:#000; border:none; padding:8px 12px; border-radius:6px; font-weight:bold; cursor:pointer;">🛒 ซื้อ & ใส่ปุ๋ย</button>
              </form>
          </div>
        `;
      });
    } else {
      fertilizersHtml = `<p style="color:#aaa; font-size:12px;">ยังไม่มีรายการปุ๋ยในร้านค้า (แอดมินสามารถเพิ่มได้)</p>`;
    }

    res.send(`
      <!DOCTYPE html>
      <html lang="th">
      <head>
          <meta charset="UTF-8">
          <title>🌳 สวนต้นไม้ของฉัน - ${username}</title>
          <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;600;800&display=swap" rel="stylesheet">
          <style>${treeThemeCSS}</style>
      </head>
      <body>
          <div class="winner-ticker-banner">🌳 สวนต้นไม้ดิจิทัลส่วนตัวของคุณ (${username}) 🌳</div>
          
          <div class="scifi-box">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                  <span>👤 ผู้ใช้งาน: <b>${username}</b></span>
                  <span style="color:#ffd700; font-weight:bold;">💰 แต้ม: ${user.points || 0} ฿</span>
              </div>

              <div class="tree-stage-box">
                  <div style="font-size: 55px; margin-bottom: 5px;" id="tree-icon">
                      ${progressPercent > 80 ? '🌳' : progressPercent > 40 ? '🌿' : '🌱'}
                  </div>
                  <div style="font-size: 16px; color: #2ed573; font-weight: bold;">ต้นไม้ของคุณ (เลเวล ${user.tree_level || 1})</div>
                  <div style="font-size: 12px; color: #a4b0be;">เติบโตไปแล้ว ${totalExp} / ${maxExp} วัน</div>
                  
                  <div class="progress-bar-container">
                      <div class="progress-bar-fill" style="width: ${progressPercent}%;"></div>
                  </div>
                  <div style="font-size: 11px; color: #ffd700;">ความคืบหน้า: ${progressPercent}% (โตอัตโนมัติตามเวลา)</div>
              </div>

              <h3 style="color:#00d2d3; font-size:15px; text-align:left; margin-top:20px;">🧪 ร้านค้าปุ๋ยเร่งโต</h3>
              <div>${fertilizersHtml}</div>

              <a href="/" style="display:block; margin-top:20px; color:#ff4757; text-decoration:none; font-size:12px;">ออกจากระบบ</a>
          </div>
      </body>
      </html>
    `);
  } catch (err) {
    res.redirect("/login");
  }
});

// ระบบซื้อและใส่ปุ๋ย
app.post("/buy-fertilizer", async (req, res) => {
  const { username, fertilizer_id } = req.body;
  try {
    const [userRes, fertRes] = await Promise.all([
      supabase.from('users').select('*').eq('username', username).single(),
      supabase.from('fertilizers').select('*').eq('id', fertilizer_id).single()
    ]);

    const user = userRes.data;
    const fert = fertRes.data;

    if (!user || !fert) {
        return res.send(`<script>alert("ข้อมูลไม่ถูกต้อง"); window.location.href="/garden?username=${username}";</script>`);
    }

    if (user.points < fert.price) {
        return res.send(`<script>alert("แต้มของคุณไม่พอซื้อปุ๋ยนี้!"); window.location.href="/garden?username=${username}";</script>`);
    }

    const newPoints = user.points - fert.price;
    const newExp = (user.tree_exp || 0) + fert.growth_bonus;

    await supabase.from('users').update({
        points: newPoints,
        tree_exp: newExp
    }).eq('username', username);

    res.send(`<script>alert("ใส่ปุ๋ยสำเร็จ! ต้นไม้ได้รับความเติบโตเพิ่ม +${fert.growth_bonus} วัน"); window.location.href="/garden?username=${username}";</script>`);
  } catch (e) {
      res.send(`<script>alert("เกิดข้อผิดพลาด"); window.location.href="/garden?username=${username}";</script>`);
  }
});

app.listen(PORT, () => {
  console.log("Tree Garden Server running on port " + PORT);
});