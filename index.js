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
    secret: process.env.SESSION_SECRET || 'lootbox_super_secret_key_2026',
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

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="th">
    <head>
        <meta charset="UTF-8">
        <title>🎁 Roblox Robux LootBox - หน้าแรก</title>
        <style>
            body { background-color: #1e1e2f; color: #ffffff; text-align: center; padding-top: 80px; }
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
            body { background-color: #1e1e2f; color: #ffffff; text-align: center; padding-top: 30px; }
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
            <p style="font-size:12px; color:#ffd700; text-align:center;">⚠️ บัญชีมีอายุใช้งาน 30 วันนับจากวันที่สมัคร</p>
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

app.post("/register", upload.single('roblox_img'), async (req, res) => {
  const { username, password } = req.body;
  const robloxImg = await uploadToSupabaseStorage(req.file);

  try {
    const { error } = await supabase
      .from('users')
      .insert([{ username, password, roblox_img: robloxImg, points: 0, total_spent: 0, custom_salt_count: 0, force_rate_type: 'normal' }]);

    if (error) {
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
        <style>
            body { background-color: #1e1e2f; color: #ffffff; text-align: center; padding-top: 50px; }
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

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  
  const isExpired = await checkUserExpiration(username);
  if (isExpired) {
      return res.send(`<script>alert("บัญชีของคุณหมดอายุการใช้งาน 30 วันแล้ว ถูกลบออกจากระบบอัตโนมัติครับ!"); window.location.href="/login";</script>`);
  }

  try {
    const { data: row, error } = await supabase
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

app.get("/lootbox", async (req, res) => {
  const username = req.query.username;
  const countParam = parseInt(req.query.count) || 1;
  if (!username) return res.redirect("/login");

  const isExpired = await checkUserExpiration(username);
  if (isExpired) {
      return res.send(`<script>alert("บัญชีของคุณหมดอายุใช้งาน 30 วันแล้ว!"); window.location.href="/login";</script>`);
  }

  try {
    const { data: row } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (!row) return res.redirect("/login");
    const currentPoints = row.points;
    const totalSpent = row.total_spent || 0;
    const robloxImg = row.roblox_img;
    const createdAt = row.created_at;

    const { data: userHistoryRows } = await supabase
      .from('history')
      .select('reward_num')
      .eq('username', username)
      .eq('is_withdrawn', false);

    let totalEarnedRobux = 0;
    if (userHistoryRows) {
      userHistoryRows.forEach(h => {
        totalEarnedRobux += (h.reward_num || 0);
      });
    }

    const { data: pendingWithdrawRow } = await supabase
      .from('pending_withdraw')
      .select('*')
      .eq('username', username)
      .eq('status', 'pending')
      .single();

    const { data: pendingRows } = await supabase
      .from('pending_topup')
      .select('*')
      .eq('username', username)
      .eq('status', 'pending');

    let pendingHtml = "";
    if (pendingRows && pendingRows.length > 0) {
      pendingRows.forEach(p => {
        pendingHtml += `<li style="color:#ffa502;">ยอดโอน <b>${p.exact_amount} บาท</b> (รอแอดมินตรวจสอบสลิป)</li>`;
      });
    } else {
      pendingHtml = `<span style="color:#aaa; font-size:12px;">ไม่มีรายการรอดำเนินการ</span>`;
    }

    const canWithdraw = totalEarnedRobux >= 10;
    let withdrawSectionHtml = "";
    if (pendingWithdrawRow) {
      withdrawSectionHtml = `<div style="background:rgba(255,165,2,0.15); border:1px solid #ffa502; padding:10px; border-radius:6px; margin-top:15px; font-size:13px; color:#ffa502; text-align:center;">
          ⏳ ส่งคำขอถอน <b>${pendingWithdrawRow.total_robux} Robux</b> เรียบร้อยแล้ว (รอแอดมินตรวจสอบและโอนรางวัล)
      </div>`;
    } else {
      withdrawSectionHtml = `<div style="margin-top:15px; background:rgba(0,0,0,0.2); padding:10px; border-radius:8px; text-align:left;">
          <b style="font-size:13px; color:#ffd700;">🎁 ถอน Robux (สะสมขั้นต่ำ 10 Robux):</b>
          <p style="font-size:12px; color:#aaa; margin:5px 0;">แต้ม Robux สะสมของคุณ: <b style="color:#2ed573;" id="total-earned-robux">${totalEarnedRobux} Robux</b></p>
          <div id="withdraw-form-wrapper">
              <button type="button" id="withdraw-btn" onclick="submitWithdrawRequest()" style="width:100%; background:${canWithdraw ? '#2ed573' : '#555'}; color:#fff; padding:10px; border:none; border-radius:5px; font-weight:bold; cursor:${canWithdraw ? 'pointer' : 'not-allowed'};" ${canWithdraw ? '' : 'disabled'}>
                  ${canWithdraw ? '📥 กดส่งคำขอถอน Robux' : '❌ ยังสะสมไม่ถึง 10 Robux (ถอนไม่ได้)'}
              </button>
          </div>
      </div>`;
    }

    res.send(`
      <!DOCTYPE html>
      <html lang="th">
      <head>
          <meta charset="UTF-8">
          <title>สุ่มกล่อง Roblox Robux</title>
          <style>
              body { background-color: #0b0c10; color: #ffffff; text-align: center; margin: 0; padding: 15px 0; }
              .main-wrapper { max-width: 460px; margin: 0 auto; background: #13151f; border-radius: 16px; border: 1px solid #25283c; box-shadow: 0 10px 30px rgba(0,0,0,0.8); overflow: hidden; padding: 20px; box-sizing: border-box; }
              
              .banner-header { text-align: center; margin-bottom: 15px; position: relative; }
              .banner-header h2 { color: #ffd700; font-size: 20px; margin: 5px 0 0 0; text-shadow: 0 0 10px rgba(255,215,0,0.4); }
              .banner-header p { color: #00d2d3; font-size: 13px; margin: 3px 0 0 0; font-weight: bold; }

              .user-bar { background: #1b1e2e; border: 1px solid #2a2e45; border-radius: 10px; padding: 10px 15px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
              .user-left { display: flex; align-items: center; gap: 10px; }
              .profile-img { width: 42px; height: 42px; border-radius: 50%; object-fit: cover; border: 2px solid #ffd700; }
              .user-right { display: flex; flex-direction: column; gap: 4px; align-items: flex-end; }
              
              .btn-history { background: #00d2d3; color: #000; padding: 3px 8px; border-radius: 4px; text-decoration: none; font-size: 11px; font-weight: bold; }
              .btn-edit { background: #ffa502; color: #000; padding: 3px 8px; border-radius: 4px; text-decoration: none; font-size: 11px; font-weight: bold; }

              .wallet-box { background: #1b1e2e; border: 1px solid #2a2e45; border-radius: 10px; padding: 10px; display: flex; justify-content: space-around; font-size: 14px; margin-bottom: 12px; font-weight: bold; color: #ffd700; }
              
              #countdown-box { background: rgba(255,215,0,0.1); border: 1px dashed #ffd700; padding: 6px; border-radius: 6px; margin-bottom: 12px; font-size: 12px; color: #ffd700; font-weight: bold; }

              .showcase-container { background: #181b2a; border: 1px solid #282c44; border-radius: 12px; padding: 10px; margin-bottom: 15px; }
              .showcase-title { font-size: 12px; color: #a4b0be; text-align: left; margin-bottom: 8px; font-weight: bold; display: flex; align-items: center; gap: 5px; }
              .rewards-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
              .reward-card { background: #13151f; border: 1px solid #2c314f; border-radius: 8px; padding: 6px 2px; text-align: center; }
              .reward-card .r-name { font-size: 10px; color: #fff; font-weight: bold; }
              .reward-card.legendary { border-color: #ffd700; background: linear-gradient(135deg, #2b2b1e, #13151f); box-shadow: 0 0 10px rgba(255,215,0,0.3); }

              .rate-sub-title { font-size: 12px; color: #ffd700; text-align: left; margin-bottom: 6px; font-weight: bold; }
              .select-group { display: grid; grid-template-columns: repeat(6, 1fr); gap: 4px; margin-bottom: 12px; }
              .select-group button { background: #1b1e2e; color: #fff; border: 1px solid #2f3452; padding: 6px 0; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 11px; text-align: center; }
              .select-group button.active { background: #ffd700; color: #000; border-color: #ffaa00; box-shadow: 0 0 8px rgba(255,215,0,0.5); }

              .box-btn { background: linear-gradient(135deg, #ff4757, #ff6b81); color: white; padding: 12px; border: none; border-radius: 8px; font-size: 14px; cursor: pointer; font-weight: bold; width: 100%; box-shadow: 0 4px 15px rgba(255,71,87,0.4); margin-bottom: 10px; }
              .box-btn:hover { filter: brightness(1.1); }
              .box-btn:disabled { background: #555 !important; cursor: not-allowed; box-shadow: none; filter: none; }

              #result-box { margin-top: 10px; padding: 12px; border-radius: 8px; font-size: 13px; font-weight: bold; background: #181b2a; border: 1px solid #2c314f; min-height: 40px; text-align: left; max-height: 180px; overflow-y: auto; }

              .topup-section-title { font-size: 15px; color: #ffd700; text-align: left; margin: 15px 0 5px 0; font-weight: bold; border-left: 3px solid #ffd700; padding-left: 6px; }
              .topup-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px; }
              .topup-card { background: #1b1e2e; border: 1px solid #2a2e45; border-radius: 10px; padding: 10px; text-align: left; }
              .topup-card h4 { font-size: 12px; margin: 0 0 8px 0; display: flex; align-items: center; gap: 4px; }
              
              label { display: block; font-size: 10px; color: #a4b0be; margin-bottom: 3px; }
              input[type="number"] { width: 100%; padding: 6px; background: #13151f; border: 1px solid #333856; color: #fff; border-radius: 4px; box-sizing: border-box; font-size: 12px; margin-bottom: 6px; }
              .topup-sub-btn { width: 100%; padding: 6px; border: none; border-radius: 4px; font-weight: bold; font-size: 11px; cursor: pointer; }
              
              .notice-bottom { background: linear-gradient(135deg, #1b1e2e, #251e2b); border: 1px solid #4a2845; padding: 10px; border-radius: 8px; margin-top: 15px; font-size: 11px; color: #ff9ff3; text-align: center; }

              @keyframes bouncePop {
                  0% { transform: scale(0.3); opacity: 0; }
                  50% { transform: scale(1.15); opacity: 1; }
                  70% { transform: scale(0.95); }
                  100% { transform: scale(1); opacity: 1; }
              }
              .popup-animation { animation: bouncePop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
              .epic-glow { box-shadow: 0 0 20px #ffd700; border: 1px solid #ffd700; }
              .rainbow-flash { animation: rainbowAnim 0.4s infinite alternate; }
              @keyframes rainbowAnim {
                  0% { background-color: rgba(255, 0, 127, 0.3); }
                  100% { background-color: rgba(255, 215, 0, 0.3); }
              }
              .ufo-galaxy-flash { animation: ufoAnim 0.25s infinite alternate; }
              @keyframes ufoAnim {
                  0% { background-color: rgba(0, 255, 255, 0.4); border: 2px solid #00ffff; }
                  100% { background-color: rgba(255, 0, 255, 0.4); border: 2px solid #ff00ff; }
              }

              .logout-link { display: block; margin-top: 20px; color: #ff4757; text-decoration: none; font-size: 12px; font-weight: bold; }
          </style>
      </head>
      <body>
          <div class="main-wrapper">
              
              <div class="banner-header">
                  <div style="font-size: 18px;">🎉 ✨ 🎁</div>
                  <h2>สุ่มกล่อง Roblox Robux</h2>
                  <p>✨ สุ่มรับรางวัลสูงสุด 10,000 Robux! ✨</p>
              </div>

              <div class="user-bar">
                  <div class="user-left">
                      <img src="${robloxImg}" class="profile-img">
                      <div style="text-align: left; font-size: 12px;">
                          <span style="color: #a4b0be; display: block; font-size: 10px;">ผู้ใช้งาน</span>
                          <b>${username}</b>
                      </div>
                  </div>
                  <div class="user-right">
                      <a href="/my-history?username=${username}" class="btn-history">📜 ประวัติสุ่ม</a>
                      <a href="/edit-profile?username=${username}" class="btn-edit">🔄 เปลี่ยนรูป</a>
                  </div>
              </div>

              <div id="countdown-box">
                  ⏳ ID นี้ใช้งานได้อีก: กำลังคำนวณเวลา...
              </div>
              
              <div class="wallet-box">
                  <div>💰 แต้ม: <span id="points">${currentPoints}</span></div>
                  <div>🎯 สุ่มสะสม: <span id="spent">${totalSpent}</span> ฿</div>
              </div>

              <div id="withdraw-section-container">
                  ${withdrawSectionHtml}
              </div>
              
              <div class="showcase-container">
                  <div class="showcase-title">🏆 ของรางวัลในกล่อง</div>
                  <div class="rewards-grid">
                      <div class="reward-card">
                          <div style="font-size: 20px; margin-bottom: 2px;">📦</div>
                          <div class="r-name" style="color:#a4b0be;">0 เกลือ</div>
                      </div>
                      <div class="reward-card">
                          <div style="font-size: 20px; margin-bottom: 2px;">🎁</div>
                          <div class="r-name">1-2 R</div>
                      </div>
                      <div class="reward-card">
                          <div style="font-size: 20px; margin-bottom: 2px;">💎</div>
                          <div class="r-name">3-5 R</div>
                      </div>
                      <div class="reward-card">
                          <div style="font-size: 20px; margin-bottom: 2px;">👑</div>
                          <div class="r-name">10-20 R</div>
                      </div>
                      <div class="reward-card">
                          <div style="font-size: 20px; margin-bottom: 2px;">🔥</div>
                          <div class="r-name" style="color:#ff4757;">100 R</div>
                      </div>
                      <div class="reward-card">
                          <div style="font-size: 20px; margin-bottom: 2px;">✨</div>
                          <div class="r-name" style="color:#ffa502;">500 R</div>
                      </div>
                      <div class="reward-card">
                          <div style="font-size: 20px; margin-bottom: 2px;">🌟</div>
                          <div class="r-name" style="color:#00d2d3;">1,000 R</div>
                      </div>
                      <div class="reward-card legendary">
                          <div style="font-size: 20px; margin-bottom: 2px;">🐉</div>
                          <div class="r-name" style="color:#ffd700;">10,000 R</div>
                      </div>
                  </div>
              </div>

              <div class="rate-sub-title">⚙️ เลือกจำนวนครั้งในการเปิดกล่อง:</div>
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

              <div class="topup-section-title">💳 ช่องทางการเติมเงิน</div>
              
              <div class="topup-grid">
                  <div class="topup-card">
                      <h4 style="color: #2ed573;">📱 พร้อมเพย์</h4>
                      <form action="/create-topup" method="POST">
                          <input type="hidden" name="username" value="${username}">
                          <input type="hidden" name="topup_type" value="promptpay">
                          <label>จำนวนเงิน (บาท):</label>
                          <input type="number" name="amount" placeholder="เช่น 50" required>
                          <button type="submit" class="topup-sub-btn" style="background:#2ed573; color:#fff;">สร้าง QR สแกน</button>
                      </form>
                  </div>

                  <div class="topup-card">
                      <h4 style="color: #ff4757;">🧡 Wallet</h4>
                      <form action="/create-topup" method="POST">
                          <input type="hidden" name="username" value="${username}">
                          <input type="hidden" name="topup_type" value="truemoney">
                          <label>จำนวนเงิน (บาท):</label>
                          <input type="number" name="amount" placeholder="เช่น 50" required>
                          <button type="submit" class="topup-sub-btn" style="background:#ff4757; color:#fff;">แจ้งโอนเงิน</button>
                      </form>
                  </div>
              </div>

              <div style="text-align: left; margin-top: 10px; font-size: 11px; color: #a4b0be; background: #1b1e2e; padding: 8px; border-radius: 6px;">
                  📌 เบอร์ TrueMoney: <b style="color:#ff4757;">${MY_TRUEMONEY_NUMBER}</b> (${MY_TRUEMONEY_NAME})
              </div>

              <div style="text-align:left; margin-top:10px; background:#1b1e2e; padding:8px; border-radius:6px; font-size:11px;">
                  <b style="color:#ffd700;">📌 สถานะการเติมเงิน:</b>
                  <ul style="padding-left:15px; margin:3px 0;">${pendingHtml}</ul>
              </div>

              <div class="notice-bottom">
                  ✨ เตรียมตัวรับโชคใหญ่! เติมเงินเพื่อเริ่มลุ้นได้เลย! ✨
              </div>

              <a href="/" class="logout-link">ออกจากระบบ</a>
          </div>

          <script>
              let userPoints = ${currentPoints};
              let userSpent = ${totalSpent};
              let selectedCount = ${countParam};
              const createdAtTime = new Date("${createdAt}").getTime();
              constthirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

              function setCount(count, btn) {
                  selectedCount = count;
                  document.querySelectorAll('.select-group button').forEach(b => b.classList.remove('active'));
                  btn.classList.add('active');
                  document.getElementById('open-box-btn').innerText = \`📦 เปิดกล่องลุ้นโชค (\${count} ครั้ง / ใช้ \${count} แต้ม)\`;
              }

              function updateCountdown() {
                  const now = new Date().getTime();
                  const expireTime = createdAtTime + 30 * 24 * 60 * 60 * 1000;
                  const timeLeft = expireTime - now;

                  const box = document.getElementById("countdown-box");
                  if (timeLeft <= 0) {
                      box.innerHTML = "❌ บัญชีของคุณหมดอายุการใช้งานแล้ว!";
                      box.style.color = "#ff4757";
                      box.style.borderColor = "#ff4757";
                      return;
                  }

                  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
                  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

                  box.innerHTML = \`⏳ ID นี้ใช้งานได้อีก: \${days} วัน \${hours} ชม. \${minutes} นาที \${seconds} วิ\`;
              }

              setInterval(updateCountdown, 1000);
              updateCountdown();
              
              function playSound(type) {
                  try {
                      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                      let notes = [];
                      let duration = 0.15;

                      if (type === 'ufo_ultimate') {
                          notes = [300, 450, 600, 900, 1200, 1500, 1800, 2400, 3000];
                          duration = 0.1;
                      } else if (type === 'god_jackpot') {
                          notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00];
                          duration = 0.2;
                      } else if (type === 'jackpot') {
                          notes = [523.25, 659.25, 783.99, 1046.50];
                      } else if (type === 'normal') {
                          notes = [400, 600];
                      } else {
                          notes = [220, 196, 164, 130];
                          duration = 0.3;
                      }

                      notes.forEach((freq, index) => {
                          let o = audioCtx.createOscillator();
                          let g = audioCtx.createGain();
                          o.connect(g);
                          g.connect(audioCtx.destination);
                          o.frequency.setValueAtTime(freq, audioCtx.currentTime + (index * duration));
                          g.gain.setValueAtTime(0.2, audioCtx.currentTime + (index * duration));
                          g.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + (index * duration) + duration);
                          o.start(audioCtx.currentTime + (index * duration));
                          o.stop(audioCtx.currentTime + (index * duration) + duration);
                      });
                  } catch(e) {}
              }

              function submitWithdrawRequest() {
                  const withdrawBtn = document.getElementById("withdraw-btn");
                  if (withdrawBtn) {
                      withdrawBtn.disabled = true;
                      withdrawBtn.innerText = "⏳ กำลังส่งคำขอถอน...";
                  }
                  
                  fetch('/request-withdraw-ajax', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ username: '${username}' })
                  })
                  .then(response => response.json())
                  .then(data => {
                      if (data.success) {
                          location.reload();
                      } else {
                          alert(data.message || "เกิดข้อผิดพลาด");
                          if (withdrawBtn) {
                              withdrawBtn.disabled = false;
                              withdrawBtn.innerText = "📥 กดส่งคำขอถอน Robux";
                          }
                      }
                  })
                  .catch(err => {
                      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
                      if (withdrawBtn) {
                          withdrawBtn.disabled = false;
                          withdrawBtn.innerText = "📥 กดส่งคำขอถอน Robux";
                      }
                  });
              }

              function openBox() {
                  if (userPoints < selectedCount) {
                      alert("แต้มของคุณไม่พอใช้งานสำหรับ " + selectedCount + " ครั้ง! กรุณาเติมเงินก่อนครับ");
                      return;
                  }

                  const openBtn = document.getElementById("open-box-btn");
                  openBtn.disabled = true;

                  const resBox = document.getElementById("result-box");
                  resBox.className = "";
                  resBox.innerText = \`🌀 กำลังเปิดกล่องรัวๆ \${selectedCount} ครั้ง...\`;

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

                      const totalEarnedElem = document.getElementById("total-earned-robux");
                      let currentEarned = 0;
                      if (totalEarnedElem) {
                          currentEarned = parseInt(totalEarnedElem.innerText) || 0;
                          currentEarned += data.totalRewardNum;
                          totalEarnedElem.innerText = currentEarned + " Robux";
                      } else {
                          location.reload();
                          return;
                      }

                      const withdrawBtn = document.getElementById("withdraw-btn");
                      if (withdrawBtn) {
                          if (currentEarned >= 10) {
                              withdrawBtn.disabled = false;
                              withdrawBtn.style.background = "#2ed573";
                              withdrawBtn.style.cursor = "pointer";
                              withdrawBtn.innerText = "📥 กดส่งคำขอถอน Robux";
                          } else {
                              withdrawBtn.disabled = true;
                              withdrawBtn.style.background = "#555";
                              withdrawBtn.style.cursor = "not-allowed";
                              withdrawBtn.innerText = "❌ ยังสะสมไม่ถึง 10 Robux (ถอนไม่ได้)";
                          }
                      }

                      let totalRewardNum = data.totalRewardNum;
                      let highestRewardNum = data.highestRewardNum;
                      let summaryRewards = data.summaryRewards;

                      let noticeText = "<br><span style='font-size:11px; color:#00d2d3;'>⏳ แจ้งเตือน: บันทึกประวัติเรียบร้อย ของรางวัลจะยังคงโชว์อยู่จนกว่าคุณจะกดสุ่มใหม่อีกครั้ง</span>";

                      if (highestRewardNum >= 10000) {
                          playSound('ufo_ultimate');
                          resBox.className = "ufo-galaxy-flash popup-animation";
                      } else if (highestRewardNum >= 500) {
                          playSound('god_jackpot');
                          resBox.className = "epic-glow rainbow-flash popup-animation";
                      } else if (highestRewardNum >= 100) {
                          playSound('jackpot');
                          resBox.className = "epic-glow popup-animation";
                      } else if (highestRewardNum >= 1) {
                          playSound('normal');
                          resBox.className = "popup-animation";
                          resBox.style.color = "#2ed573";
                      } else {
                          playSound('sad');
                          resBox.className = "popup-animation";
                          resBox.style.color = "#ff4757";
                      }

                      let summaryListHtml = "";
                      for (const [rew, count] of Object.entries(summaryRewards)) {
                          summaryListHtml += \`• \${rew} x \${count} ครั้ง<br>\`;
                      }

                      resBox.innerHTML = \`🎉 <b>สรุปผลสุ่มล่าสุด (\${selectedCount} ครั้ง):</b><br>
                          รวม Robux ที่ได้ทั้งหมด: <b style="color:#ffd700; font-size:16px;">\${totalRewardNum} Robux</b><br>
                          <div style="font-size:12px; margin-top:5px; background:rgba(0,0,0,0.3); padding:8px; border-radius:5px;">\${summaryListHtml}</div>
                          \${noticeText}\`;
                  })
                  .catch(err => {
                      openBtn.disabled = false;
                      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
                  });
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
    .order('id', { ascending: false });

  let historyList = "";
  if (rows && rows.length > 0) {
    rows.forEach(r => {
      const statusBadge = r.is_withdrawn ? '<span style="color:#ffa502; font-size:11px;">(ถอนแล้ว)</span>' : '<span style="color:#2ed573; font-size:11px;">(ยังไม่ถอน)</span>';
      historyList += `<tr><td style="padding:8px;">${r.id}</td><td style="padding:8px; color:#ffd700;"><b>${r.reward}</b> ${statusBadge}</td><td style="padding:8px;">${r.time}</td></tr>`;
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
        <style>
            body { background-color: #1e1e2f; color: #ffffff; text-align: center; padding-top: 40px; }
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
                <tr><th>ID</th><th>รางวัลที่ได้</th><th>เวลา</th></tr>
                ${historyList}
            </table>
            <a href="/lootbox?username=${username}">⬅️ กลับหน้าสุ่มกล่อง</a>
        </div>
    </body>
    </html>
  `);
});

app.get("/edit-profile", async (req, res) => {
  const username = req.query.username;
  if (!username) return res.redirect("/login");

  const { data: user } = await supabase
    .from('users')
    .select('roblox_img')
    .eq('username', username)
    .single();

  const currentImg = user ? user.roblox_img : "";

  res.send(`
    <!DOCTYPE html>
    <html lang="th">
    <head>
        <meta charset="UTF-8">
        <title>เปลี่ยนรูปโปรไฟล์ Roblox</title>
        <style>
            body { background-color: #1e1e2f; color: #ffffff; text-align: center; padding-top: 40px; }
            .container { background: #2b2b40; padding: 30px; display: inline-block; border-radius: 10px; width: 380px; text-align: left; box-shadow: 0 4px 15px rgba(0,0,0,0.5); }
            h2 { color: #ffa502; text-align: center; }
            label { display: block; margin-top: 10px; font-size: 14px; }
            input { width: 100%; padding: 8px; margin-top: 5px; border-radius: 4px; border: none; box-sizing: border-box; }
            button { width: 100%; background-color: #2ed573; color: white; padding: 10px; border: none; border-radius: 5px; margin-top: 20px; font-weight: bold; cursor: pointer; }
            a { display: block; text-align: center; margin-top: 15px; color: #70a1ff; text-decoration: none; font-size: 13px; }
            .current-img { display: block; margin: 0 auto 15px auto; width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 2px solid #ffd700; }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>🔄 เปลี่ยนรูปโปรไฟล์ Roblox</h2>
            <p style="font-size:12px; color:#aaa; text-align:center;">อัปเดตรูปใหม่ได้ตลอด หากเปลี่ยนบัญชีหรือสมัคร ID ใหม่</p>
            <img src="${currentImg}" class="current-img">
            <form action="/edit-profile" method="POST" enctype="multipart/form-data">
                <input type="hidden" name="username" value="${username}">
                <label>อัปโหลดรูปโปรไฟล์ Roblox ใหม่:</label>
                <input type="file" name="roblox_img" accept="image/*" required style="background:white; color:black; padding:5px;">
                <button type="submit">บันทึกการเปลี่ยนแปลง</button>
            </form>
            <a href="/lootbox?username=${username}">⬅️ กลับหน้าสุ่มกล่อง</a>
        </div>
    </body>
    </html>
  `);
});

app.post("/edit-profile", upload.single('roblox_img'), async (req, res) => {
  const { username } = req.body;
  const newRobloxImg = await uploadToSupabaseStorage(req.file);

  if (newRobloxImg) {
    await supabase
      .from('users')
      .update({ roblox_img: newRobloxImg })
      .eq('username', username);

    await supabase
      .from('history')
      .update({ roblox_img: newRobloxImg })
      .eq('username', username);
  }

  res.send(`<script>alert("เปลี่ยนรูปโปรไฟล์ Roblox สำเร็จ!"); window.location.href="/lootbox?username=${username}";</script>`);
});

app.post("/request-withdraw-ajax", async (req, res) => {
  const { username } = req.body;

  const { data: userHistory } = await supabase
    .from('history')
    .select('*')
    .eq('username', username)
    .eq('is_withdrawn', false);

  if (!userHistory || userHistory.length === 0) {
    return res.json({ success: false, message: "คุณไม่มีประวัติการสุ่มที่จะถอน!" });
  }

  let totalRobux = 0;
  let totalOpens = userHistory.length;
  userHistory.forEach(h => {
    totalRobux += (h.reward_num || 0);
  });

  if (totalRobux < 10) {
    return res.json({ success: false, message: "แต้ม Robux สะสมยังไม่ถึง 10 Robux ไม่สามารถถอนได้!" });
  }

  const { data: userData } = await supabase
    .from('users')
    .select('roblox_img')
    .eq('username', username)
    .single();

  const robloxImg = userData ? userData.roblox_img : "";
  const historyIds = userHistory.map(h => h.id);

  await supabase
    .from('pending_withdraw')
    .insert([{
      username: username,
      roblox_img: robloxImg,
      total_opens: totalOpens,
      total_robux: totalRobux,
      status: 'pending',
      history_ids: historyIds
    }]);

  for (let id of historyIds) {
    await supabase
      .from('history')
      .update({ is_withdrawn: true })
      .eq('id', id);
  }

  return res.json({ success: true });
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
        body { background: #1e1e2f; color: #fff; text-align: center; padding-top: 30px; }
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

app.post("/open-lootbox", async (req, res) => {
  const { username, count } = req.body;
  const selectedCount = parseInt(count) || 1;

  if (!username || selectedCount <= 0) {
    return res.json({ success: false, message: "ข้อมูลไม่ถูกต้อง" });
  }

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();

  if (userError || !user) {
    return res.json({ success: false, message: "ไม่พบผู้ใช้งาน" });
  }

  if (user.points < selectedCount) {
    return res.json({ success: false, message: "แต้มของคุณไม่พอใช้งาน!" });
  }

  let totalRewardNum = 0;
  let highestRewardNum = 0;
  let historyBatch = [];
  let summaryRewards = {};

  let currentSaltCount = user.custom_salt_count || 0;
  let forceRateType = user.force_rate_type || 'normal';

  for (let i = 0; i < selectedCount; i++) {
      let reward = "";
      let rewardNum = 0;

      if (i === 0 && forceRateType !== 'normal') {
          if (forceRateType === 'always_salt') {
              reward = "0 Robux (📦 เกลือ)";
              rewardNum = 0;
          } else if (forceRateType === 'always_jackpot_1') {
              reward = "1 Robux (🎁 1-2 R)";
              rewardNum = 1;
          } else if (forceRateType === 'always_jackpot_2') {
              reward = "2 Robux (🎁 1-2 R)";
              rewardNum = 2;
          } else if (forceRateType === 'always_jackpot_3') {
              reward = "3 Robux (💎 3-5 R)";
              rewardNum = 3;
          } else if (forceRateType === 'always_jackpot_5') {
              reward = "5 Robux (💎 3-5 R)";
              rewardNum = 5;
          } else if (forceRateType === 'always_jackpot_10') {
              reward = "10 Robux (👑 10-20 R)";
              rewardNum = 10;
          } else if (forceRateType === 'always_jackpot_15') {
              reward = "15 Robux (👑 10-20 R)";
              rewardNum = 15;
          } else if (forceRateType === 'always_jackpot_20') {
              reward = "20 Robux (👑 10-20 R)";
              rewardNum = 20;
          } else if (forceRateType === 'always_jackpot_100') {
              reward = "100 Robux (🔥 100 R)";
              rewardNum = 100;
          } else if (forceRateType === 'always_jackpot_500') {
              reward = "500 Robux (✨ 500 R)";
              rewardNum = 500;
          } else if (forceRateType === 'always_jackpot_1000') {
              reward = "1,000 Robux (🌟 1,000 R)";
              rewardNum = 1000;
          } else if (forceRateType === 'always_jackpot_10000') {
              reward = "10,000 Robux (🐉 10,000 R)";
              rewardNum = 10000;
          }
      } else {
          if (currentSaltCount > 0) {
              reward = "0 Robux (📦 เกลือ)";
              rewardNum = 0;
              currentSaltCount -= 1;
          } else {
              const rand = Math.random() * 100;
              if (rand < 0.0001) { 
                  reward = "10,000 Robux (🐉 10,000 R)"; 
                  rewardNum = 10000; 
              }
              else if (rand < 0.0005) { 
                  reward = "1,000 Robux (🌟 1,000 R)"; 
                  rewardNum = 1000; 
              }
              else if (rand < 0.002) { 
                  reward = "500 Robux (✨ 500 R)"; 
                  rewardNum = 500; 
              }
              else if (rand < 0.01) { 
                  reward = "100 Robux (🔥 100 R)"; 
                  rewardNum = 100; 
              }
              else if (rand < 0.02) { reward = "20 Robux (👑 10-20 R)"; rewardNum = 20; }
              else if (rand < 0.05) { reward = "15 Robux (👑 10-20 R)"; rewardNum = 15; }
              else if (rand < 0.1) { reward = "10 Robux (👑 10-20 R)"; rewardNum = 10; }
              else if (rand < 0.2) { reward = "5 Robux (💎 3-5 R)"; rewardNum = 5; }
              else if (rand < 0.3) { reward = "4 Robux (💎 3-5 R)"; rewardNum = 4; }
              else if (rand < 0.5) { reward = "3 Robux (💎 3-5 R)"; rewardNum = 3; }
              else if (rand < 1.0) { reward = "2 Robux (🎁 1-2 R)"; rewardNum = 2; }
              else if (rand < 50.0) { reward = "1 Robux (🎁 1-2 R)"; rewardNum = 1; }
              else { reward = "0 Robux (📦 เกลือ)"; rewardNum = 0; }
          }
      }

      totalRewardNum += rewardNum;
      summaryRewards[reward] = (summaryRewards[reward] || 0) + 1;

      if (rewardNum > highestRewardNum) {
          highestRewardNum = rewardNum;
      }

      historyBatch.push({
          username: username,
          roblox_img: user.roblox_img,
          reward: reward,
          reward_num: rewardNum,
          is_withdrawn: false
      });
  }

  const newPoints = user.points - selectedCount;
  const newSpent = (user.total_spent || 0) + selectedCount;

  await supabase
    .from('users')
    .update({ 
        points: newPoints, 
        total_spent: newSpent,
        custom_salt_count: currentSaltCount,
        force_rate_type: 'normal'
    })
    .eq('username', username);

  await supabase
    .from('history')
    .insert(historyBatch);

  return res.json({
      success: true,
      newPoints: newPoints,
      newSpent: newSpent,
      totalRewardNum: totalRewardNum,
      highestRewardNum: highestRewardNum,
      summaryRewards: summaryRewards
  });
});

app.get("/admin", async (req, res) => {
  if (req.session.isAdmin) {
    return renderAdminDashboard(req, res);
  }

  res.send(`
    <body style="background:#1e1e2f; color:#fff; text-align:center; padding-top:80px;">
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

app.post("/admin/approve-topup", async (req, res) => {
  if (!req.session.isAdmin) return res.redirect("/admin");
  const { topup_id, username, exact_amount } = req.body;
  const pointsToAdd = Math.floor(parseFloat(exact_amount));

  const { data: user } = await supabase
    .from('users')
    .select('points')
    .eq('username', username)
    .single();

  if (user) {
    await supabase
      .from('users')
      .update({ points: user.points + pointsToAdd })
      .eq('username', username);
  }

  await supabase
    .from('pending_topup')
    .update({ status: 'completed' })
    .eq('id', topup_id);

  res.redirect("/admin");
});

app.post("/admin/delete-topup", async (req, res) => {
  if (!req.session.isAdmin) return res.redirect("/admin");
  const { topup_id } = req.body;

  await supabase
    .from('pending_topup')
    .delete()
    .eq('id', topup_id);

  res.redirect("/admin");
});

app.post("/admin/approve-withdraw", async (req, res) => {
  if (!req.session.isAdmin) return res.redirect("/admin");
  const { withdraw_id, username } = req.body;

  const { data: withdrawData } = await supabase
    .from('pending_withdraw')
    .select('*')
    .eq('id', withdraw_id)
    .single();

  if (withdrawData) {
    if (withdrawData.history_ids && Array.isArray(withdrawData.history_ids) && withdrawData.history_ids.length > 0) {
      for (let id of withdrawData.history_ids) {
        await supabase.from('history').delete().eq('id', id);
      }
    } else {
      await supabase
        .from('history')
        .delete()
        .eq('username', username)
        .eq('is_withdrawn', true);
    }

    await supabase
      .from('pending_withdraw')
      .update({ status: 'completed' })
      .eq('id', withdraw_id);
  }

  res.redirect("/admin");
});

app.post("/admin/delete-withdraw", async (req, res) => {
  if (!req.session.isAdmin) return res.redirect("/admin");
  const { withdraw_id } = req.body;

  const { data: withdrawData } = await supabase
    .from('pending_withdraw')
    .select('*')
    .eq('id', withdraw_id)
    .single();

  if (withdrawData) {
    if (withdrawData.history_ids && Array.isArray(withdrawData.history_ids)) {
      for (let id of withdrawData.history_ids) {
        await supabase.from('history').update({ is_withdrawn: false }).eq('id', id);
      }
    }

    await supabase
      .from('pending_withdraw')
      .delete()
      .eq('id', withdraw_id);
  }

  res.redirect("/admin");
});

app.post("/admin/update-points", async (req, res) => {
  if (!req.session.isAdmin) return res.redirect("/admin");
  const { username, points, action } = req.body;
  const numPoints = parseInt(points) || 0;

  const { data: user } = await supabase
    .from('users')
    .select('points')
    .eq('username', username)
    .single();

  if (user) {
    let newPoints = action === "add" ? user.points + numPoints : Math.max(0, user.points - numPoints);
    await supabase
      .from('users')
      .update({ points: newPoints })
      .eq('username', username);
  }

  res.redirect("/admin");
});

app.post("/admin/update-user-luck", async (req, res) => {
  if (!req.session.isAdmin) return res.redirect("/admin");
  const { username, custom_salt_count, force_rate_type } = req.body;

  await supabase
    .from('users')
    .update({ 
        custom_salt_count: parseInt(custom_salt_count) || 0,
        force_rate_type: force_rate_type || 'normal'
    })
    .eq('username', username);

  res.redirect("/admin");
});

app.post("/admin/delete-user", async (req, res) => {
  if (!req.session.isAdmin) return res.redirect("/admin");
  const { username } = req.body;

  await supabase.from('users').delete().eq('username', username);
  await supabase.from('history').delete().eq('username', username);
  await supabase.from('pending_topup').delete().eq('username', username);
  await supabase.from('pending_withdraw').delete().eq('username', username);

  res.redirect("/admin");
});

app.get("/admin/user-detail", async (req, res) => {
  if (!req.session.isAdmin) return res.redirect("/admin");
  const username = req.query.username;

  const { data: rows } = await supabase
    .from('history')
    .select('*')
    .eq('username', username)
    .order('id', { ascending: false });

  let historyList = "";
  if (rows && rows.length > 0) {
    rows.forEach(r => {
      const statusBadge = r.is_withdrawn ? '<span style="color:#ffa502; font-size:11px;">(รอถอน)</span>' : '<span style="color:#2ed573; font-size:11px;">(ใหม่)</span>';
      historyList += `<tr><td>${r.id}</td><td style="color:#ffd700;"><b>${r.reward}</b> ${statusBadge}</td><td>${r.time}</td></tr>`;
    });
  } else {
    historyList = `<tr><td colspan="3" style="padding:15px; color:#aaa;">ไม่มีประวัติการสุ่ม</td></tr>`;
  }

  res.send(`
    <body style="background:#1e1e2f; color:#fff; text-align:center; padding-top:40px;">
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

async function renderAdminDashboard(req, res) {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;

  const { data: allUsers } = await supabase.from('users').select('*');
  const totalUsers = allUsers ? allUsers.length : 0;
  const totalPages = Math.ceil(totalUsers / limit) || 1;

  const { data: usersRows } = await supabase
    .from('users')
    .select('*')
    .order('id', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data: pendingRows } = await supabase.from('pending_topup').select('*').eq('status', 'pending').order('id', { ascending: false });
  const { data: pendingWithdrawRows } = await supabase.from('pending_withdraw').select('*').eq('status', 'pending').order('id', { ascending: false });

  let pendingSlipHtml = "";
  if (pendingRows && pendingRows.length > 0) {
    pendingRows.forEach(p => {
      const topupBadge = p.topup_type === 'truemoney' ? '<span style="color:#ff4757; font-size:11px;">[TrueMoney]</span>' : '<span style="color:#2ed573; font-size:11px;">[PromptPay]</span>';
      pendingSlipHtml += `<tr>
        <td>${p.id}</td>
        <td><b>${p.username}</b></td>
        <td style="color:#ffd700;"><b>${p.exact_amount} บาท</b><br>${topupBadge}</td>
        <td><a href="${p.slip_img}" target="_blank"><img src="${p.slip_img}" style="width:60px; height:80px; object-fit:cover; border:1px solid #fff;"></a></td>
        <td>${p.time}</td>
        <td>
          <div style="display:flex; gap:4px; justify-content:center;">
            <form action="/admin/approve-topup" method="POST" style="margin:0;">
              <input type="hidden" name="topup_id" value="${p.id}">
              <input type="hidden" name="username" value="${p.username}">
              <input type="hidden" name="exact_amount" value="${p.exact_amount}">
              <button type="submit" style="background:#2ed573; color:#fff; border:none; padding:6px 10px; border-radius:4px; font-weight:bold; cursor:pointer;">✅ อนุมัติ</button>
            </form>
            <form action="/admin/delete-topup" method="POST" onsubmit="return confirm('ต้องการลบสลิปนี้ (กันป่วน) ใช่หรือไม่?');" style="margin:0;">
              <input type="hidden" name="topup_id" value="${p.id}">
              <button type="submit" style="background:#ff4757; color:#fff; border:none; padding:6px 10px; border-radius:4px; font-weight:bold; cursor:pointer;" title="ลบสลิปปลอม">🗑️ ลบสลิป</button>
            </form>
          </div>
        </td>
      </tr>`;
    });
  } else {
    pendingSlipHtml = `<tr><td colspan="6" style="padding:15px; color:#aaa;">ไม่มีรายการสลิปรอตรวจสอบ</td></tr>`;
  }

  let withdrawHtml = "";
  if (pendingWithdrawRows && pendingWithdrawRows.length > 0) {
    pendingWithdrawRows.forEach((w, index) => {
      const withdrawRunningNo = index + 1;
      withdrawHtml += `<tr>
        <td>${withdrawRunningNo}</td>
        <td><b>${w.username}</b></td>
        <td><a href="${w.roblox_img}" target="_blank"><img src="${w.roblox_img}" style="width:40px; height:40px; border-radius:50%; object-fit:cover; border:1px solid #ffd700;"></a></td>
        <td style="color:#00d2d3;">สุ่มไป ${w.total_opens} ครั้ง</td>
        <td style="color:#ffd700; font-size:15px; font-weight:bold;">${w.total_robux} Robux</td>
        <td>${w.time}</td>
        <td>
          <div style="display:flex; gap:4px; justify-content:center; flex-wrap:wrap;">
            <a href="/admin/user-detail?username=${w.username}" target="_blank" style="background:#70a1ff; color:#fff; padding:6px 10px; border-radius:4px; font-weight:bold; text-decoration:none; font-size:12px;" title="เช็คประวัติการสุ่ม">🔍 ดูประวัติ</a>
            <form action="/admin/approve-withdraw" method="POST" style="margin:0;">
              <input type="hidden" name="withdraw_id" value="${w.id}">
              <input type="hidden" name="username" value="${w.username}">
              <button type="submit" style="background:#2ed573; color:#fff; border:none; padding:6px 10px; border-radius:4px; font-weight:bold; cursor:pointer; font-size:12px;">✅ อนุมัติโอน</button>
            </form>
            <form action="/admin/delete-withdraw" method="POST" onsubmit="return confirm('เคลียร์คำขอถอนของ ${w.username} ใช่ไหม?');" style="margin:0;">
              <input type="hidden" name="withdraw_id" value="${w.id}">
              <button type="submit" style="background:#ff4757; color:#fff; border:none; padding:6px 10px; border-radius:4px; font-weight:bold; cursor:pointer; font-size:12px;">🗑️ ลบ/เคลียร์</button>
            </form>
          </div>
        </td>
      </tr>`;
    });
  } else {
    withdrawHtml = `<tr><td colspan="7" style="padding:15px; color:#aaa;">ยังไม่มีคำขอถอน Robux จากสมาชิก</td></tr>`;
  }

  let userHtml = "";
  if (usersRows && usersRows.length > 0) {
    usersRows.forEach((u, index) => {
      const runningNo = offset + index + 1;

      let daysLeft = "-";
      if (u.created_at) {
          const createdTime = new Date(u.created_at).getTime();
          const now = new Date().getTime();
          const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
          const diffDays = Math.ceil((thirtyDaysMs - (now - createdTime)) / (1000 * 60 * 60 * 24));
          daysLeft = diffDays > 0 ? `${diffDays} วัน` : `หมดอายุ`;
      }

      const saltCountVal = u.custom_salt_count || 0;
      const rateTypeVal = u.force_rate_type || 'normal';

      userHtml += `<tr>
        <td>${runningNo}</td>
        <td><b>${u.username}</b></td>
        <td><a href="${u.roblox_img}" target="_blank"><img src="${u.roblox_img}" style="width:40px; height:40px; border-radius:50%; object-fit:cover; border:1px solid #ffd700;" title="คลิกเพื่อดูรูปใหญ่"></a></td>
        <td>${u.points} แต้ม</td>
        <td>${u.total_spent || 0} บาท</td>
        <td style="color:#ffd700; font-size:13px;">${daysLeft}</td>
        <td>
          <form action="/admin/update-points" method="POST" style="display:inline-flex; gap:3px; align-items:center; margin:0; margin-bottom:4px;">
            <input type="hidden" name="username" value="${u.username}">
            <input type="number" name="points" value="1" min="1" style="width:40px; padding:3px; text-align:center; border-radius:3px; border:none;">
            <button type="submit" name="action" value="add" style="background:#2ed573; color:#fff; border:none; padding:3px 6px; border-radius:3px; cursor:pointer; font-weight:bold;" title="เพิ่มแต้ม">➕</button>
            <button type="submit" name="action" value="subtract" style="background:#ff4757; color:#fff; border:none; padding:3px 6px; border-radius:3px; cursor:pointer; font-weight:bold;" title="ลดแต้ม">➖</button>
          </form>

          <form action="/admin/update-user-luck" method="POST" style="background:rgba(0,0,0,0.3); padding:6px; border-radius:4px; margin-top:4px; text-align:left;">
            <input type="hidden" name="username" value="${u.username}">
            <div style="font-size:11px; color:#ffd700; margin-bottom:2px;">🎛️ ตั้งค่าเรต/เกลือลับ:</div>
            <div style="display:flex; gap:4px; align-items:center; margin-bottom:4px;">
              <span style="font-size:11px; color:#aaa;">เกลือต่อ:</span>
              <input type="number" name="custom_salt_count" value="${saltCountVal}" min="0" style="width:45px; padding:2px; font-size:11px; text-align:center;"> รอบ
            </div>
            <div style="display:flex; gap:4px; align-items:center; margin-bottom:4px;">
              <select name="force_rate_type" style="width:100%; font-size:11px; padding:2px;">
                <option value="normal" ${rateTypeVal === 'normal' ? 'selected' : ''}>เรตปกติ (สุ่มตามดวง)</option>
                <option value="always_salt" ${rateTypeVal === 'always_salt' ? 'selected' : ''}>🔒 เกลือตลอดกาล (0)</option>
                <option value="always_jackpot_1" ${rateTypeVal === 'always_jackpot_1' ? 'selected' : ''}>⭐ ล็อคออก 1 Robux</option>
                <option value="always_jackpot_2" ${rateTypeVal === 'always_jackpot_2' ? 'selected' : ''}>⭐ ล็อคออก 2 Robux</option>
                <option value="always_jackpot_3" ${rateTypeVal === 'always_jackpot_3' ? 'selected' : ''}>⭐ ล็อคออก 3 Robux</option>
                <option value="always_jackpot_5" ${rateTypeVal === 'always_jackpot_5' ? 'selected' : ''}>⭐ ล็อคออก 5 Robux</option>
                <option value="always_jackpot_10" ${rateTypeVal === 'always_jackpot_10' ? 'selected' : ''}>⭐ ล็อคออก 10 Robux</option>
                <option value="always_jackpot_15" ${rateTypeVal === 'always_jackpot_15' ? 'selected' : ''}>⭐ ล็อคออก 15 Robux</option>
                <option value="always_jackpot_20" ${rateTypeVal === 'always_jackpot_20' ? 'selected' : ''}>⭐ ล็อคออก 20 Robux</option>
                <option value="always_jackpot_100" ${rateTypeVal === 'always_jackpot_100' ? 'selected' : ''}>🔥 ล็อคแจ็คพอต 100 Robux</option>
                <option value="always_jackpot_500" ${rateTypeVal === 'always_jackpot_500' ? 'selected' : ''}>💎 ล็อคแจ็คพอต 500 Robux</option>
                <option value="always_jackpot_1000" ${rateTypeVal === 'always_jackpot_1000' ? 'selected' : ''}>👑 ล็อคแจ็คพอต 1,000 Robux</option>
                <option value="always_jackpot_10000" ${rateTypeVal === 'always_jackpot_10000' ? 'selected' : ''}>🛸 ล็อคแจ็คพอต 10,000 Robux</option>
              </select>
            </div>
            <button type="submit" style="background:#00d2d3; color:#000; border:none; padding:3px; border-radius:3px; font-weight:bold; cursor:pointer; font-size:11px; width:100%;">💾 บันทึกเรตยูสนี้</button>
          </form>

          <form action="/admin/delete-user" method="POST" onsubmit="return confirm('ต้องการลบสมาชิก ${u.username} ออกจากระบบใช่หรือไม่?');" style="margin-top:6px;">
            <input type="hidden" name="username" value="${u.username}">
            <button type="submit" style="background:#c0392b; color:#fff; border:none; padding:4px 8px; border-radius:3px; font-weight:bold; cursor:pointer; font-size:11px; width:100%;">🗑️ ลบยูส</button>
          </form>
        </td>
      </tr>`;
    });
  } else {
    userHtml = `<tr><td colspan="7" style="padding:15px; color:#aaa;">ยังไม่มีสมาชิกในระบบ</td></tr>`;
  }

  let paginationHtml = "";
  if (totalPages > 1) {
      paginationHtml += `<div style="margin: 15px 0;">`;
      if (page > 1) {
          paginationHtml += `<a href="/admin?page=${page - 1}" style="background:#3d3d5c; color:#fff; padding:6px 12px; margin:0 3px; border-radius:4px; text-decoration:none; font-weight:bold;">⬅️ หน้าก่อนหน้า</a>`;
      }
      paginationHtml += `<span style="margin:0 10px; color:#ffd700; font-weight:bold;">หน้า ${page} / ${totalPages}</span>`;
      if (page < totalPages) {
          paginationHtml += `<a href="/admin?page=${page + 1}" style="background:#3d3d5c; color:#fff; padding:6px 12px; margin:0 3px; border-radius:4px; text-decoration:none; font-weight:bold;">หน้าถัดไป ➡️</a>`;
      }
      paginationHtml += `</div>`;
  }

  res.send(`
    <body style="background:#1e1e2f; color:#fff; text-align:center; padding-top:30px;">
      <h2>🛠️ ระบบจัดการหลังบ้าน (แอดมิน)</h2>
      <div style="margin-bottom: 20px;">
          <a href="/admin/logout" style="color:#ff4757; font-weight:bold; text-decoration:none; margin-right:15px;">🔒 ออกจากระบบ</a>
          <a href="/" style="color:#70a1ff; text-decoration:none;">🏠 กลับหน้าแรก</a>
      </div>

      <h3 style="color:#ffd700;">📥 รายการสลิปรอตรวจสอบการเติมเงิน (มีปุ่มลบสลิปกันป่วน)</h3>
      <table border="1" style="margin: 0 auto 30px auto; border-collapse: collapse; width: 800px; background:#2b2b40; border-color:#444;">
        <tr><th style="padding:8px;">ID</th><th style="padding:8px;">Username</th><th style="padding:8px;">ยอดเงิน</th><th style="padding:8px;">รูปสลิป</th><th style="padding:8px;">เวลา</th><th style="padding:8px;">จัดการ / ลบสลิปปลอม</th></tr>
        ${pendingSlipHtml}
      </table>

      <h3 style="color:#ffd700;">💎 คำขอถอน Robux และประวัติการสุ่มจากสมาชิก (ยอดสะสม >= 10 Robux)</h3>
      <table border="1" style="margin: 0 auto 30px auto; border-collapse: collapse; width: 900px; background:#2b2b40; border-color:#444;">
        <tr><th style="padding:8px;">ID</th><th style="padding:8px;">Username</th><th style="padding:8px;">รูป Roblox</th><th style="padding:8px;">จำนวนครั้ง</th><th style="padding:8px;">รวม Robux ที่ต้องโอน</th><th style="padding:8px;">เวลา</th><th style="padding:8px;">จัดการ</th></tr>
        ${withdrawHtml}
      </table>

      <h3 style="color:#ffd700; margin-top:40px;">👥 รายชื่อสมาชิกทั้งหมด (จัดการแต้ม / ตั้งค่าเกลือ-เรตลับรายบุคคล / อายุ 30 วัน)</h3>
      <table border="1" style="margin: 0 auto 10px auto; border-collapse: collapse; width: 900px; background:#2b2b40; border-color:#444;">
        <tr><th style="padding:8px;">ลำดับ</th><th style="padding:8px;">Username</th><th style="padding:8px;">รูป Roblox</th><th style="padding:8px;">แต้มคงเหลือ</th><th style="padding:8px;">ยอดใช้จ่าย</th><th style="padding:8px;">อายุใช้งาน</th><th style="padding:8px; width:220px;">จัดการ / ตั้งค่าเรตลับ</th></tr>
        ${userHtml}
      </table>
      ${paginationHtml}
    </body>
  `);
}

app.listen(PORT, () => {
  console.log("Server running smoothly at port " + PORT);
});