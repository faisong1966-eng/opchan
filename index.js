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
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>🎁 Roblox Robux LootBox - หน้าแรก</title>
        <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;600;700;800&display=swap" rel="stylesheet">
        <style>
            * { box-sizing: border-box; font-family: 'Prompt', sans-serif; }
            body { background: #0f0f1a; color: #ffffff; text-align: center; margin: 0; padding: 0; min-height: 100vh; display: flex; justify-content: center; align-items: center; background-image: radial-gradient(circle at center, #1a1a2e 0%, #0f0f1a 100%); }
            .container { background: rgba(26, 26, 46, 0.85); backdrop-filter: blur(12px); padding: 40px 30px; border-radius: 20px; border: 1px solid rgba(255,215,0,0.2); box-shadow: 0 10px 30px rgba(0,0,0,0.6); width: 100%; max-width: 400px; }
            h1 { color: #ffd700; font-size: 28px; font-weight: 800; margin-bottom: 10px; text-shadow: 0 0 15px rgba(255,215,0,0.4); }
            p { color: #a2a2bc; font-size: 14px; margin-bottom: 25px; }
            a { display: block; background: linear-gradient(135deg, #ff4757, #ff6b81); color: white; padding: 12px; margin: 12px 0; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px; box-shadow: 0 4px 15px rgba(255,71,87,0.4); transition: 0.3s; }
            a:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(255,71,87,0.6); }
            .btn-register { background: linear-gradient(135deg, #2ed573, #7bed9f) !important; box-shadow: 0 4px 15px rgba(46,213,115,0.4) !important; color: #000 !important; }
            .btn-register:hover { box-shadow: 0 6px 20px rgba(46,213,115,0.6) !important; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🎁 Roblox Robux Box</h1>
            <p>เว็บสุ่มลุ้นรับ Robux สุดอลังการ ระบบปลอดภัย 100%</p>
            <a href="/login">🔑 เข้าสู่ระบบ</a>
            <a href="/register" class="btn-register">📝 สมัครสมาชิก</a>
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
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>สมัครสมาชิก</title>
        <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;600;700;800&display=swap" rel="stylesheet">
        <style>
            * { box-sizing: border-box; font-family: 'Prompt', sans-serif; }
            body { background: #0f0f1a; color: #ffffff; text-align: center; margin: 0; padding: 20px; min-height: 100vh; display: flex; justify-content: center; align-items: center; background-image: radial-gradient(circle at center, #1a1a2e 0%, #0f0f1a 100%); }
            .container { background: rgba(26, 26, 46, 0.9); backdrop-filter: blur(12px); padding: 30px; border-radius: 20px; border: 1px solid rgba(46,213,115,0.3); box-shadow: 0 10px 30px rgba(0,0,0,0.6); width: 100%; max-width: 400px; text-align: left; }
            h2 { color: #2ed573; text-align: center; font-weight: 800; margin-bottom: 5px; }
            label { display: block; margin-top: 15px; font-size: 13px; font-weight: 600; color: #dcdcfe; }
            input[type="text"], input[type="password"] { width: 100%; padding: 12px; margin-top: 6px; border-radius: 8px; border: 1px solid #3d3d5c; background: #121222; color: #fff; font-size: 14px; outline: none; transition: 0.2s; }
            input[type="text"]:focus, input[type="password"]:focus { border-color: #2ed573; box-shadow: 0 0 8px rgba(46,213,115,0.3); }
            input[type="file"] { width: 100%; padding: 10px; margin-top: 6px; border-radius: 8px; background: #121222; color: #fff; border: 1px solid #3d3d5c; font-size: 13px; }
            button { width: 100%; background: linear-gradient(135deg, #2ed573, #7bed9f); color: #000; padding: 12px; border: none; border-radius: 10px; margin-top: 25px; font-weight: 700; font-size: 15px; cursor: pointer; box-shadow: 0 4px 15px rgba(46,213,115,0.4); transition: 0.3s; }
            button:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(46,213,115,0.6); }
            a { display: block; text-align: center; margin-top: 20px; color: #70a1ff; text-decoration: none; font-size: 14px; font-weight: 600; }
            .alert-box { font-size: 12px; color: #ffd700; text-align: center; background: rgba(255,215,0,0.1); padding: 8px; border-radius: 6px; border: 1px solid rgba(255,215,0,0.3); margin-bottom: 15px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>📝 สมัครสมาชิก</h2>
            <div class="alert-box">⚠️ บัญชีมีอายุใช้งาน 30 วันนับจากวันที่สมัคร</div>
            <form action="/register" method="POST" enctype="multipart/form-data">
                <label>Username (สำหรับเข้าเว็บ):</label>
                <input type="text" name="username" placeholder="ระบุชื่อผู้ใช้งานของคุณ" required>
                <label>Password:</label>
                <input type="password" name="password" placeholder="••••••••" required>
                <label>อัปโหลดรูปโปรไฟล์ Roblox ของคุณ:</label>
                <input type="file" name="roblox_img" accept="image/*" required>
                <button type="submit">ยืนยันการสมัคร</button>
            </form>
            <a href="/">⬅️ กลับหน้าแรก</a>
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
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>เข้าสู่ระบบ</title>
        <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;600;700;800&display=swap" rel="stylesheet">
        <style>
            * { box-sizing: border-box; font-family: 'Prompt', sans-serif; }
            body { background: #0f0f1a; color: #ffffff; text-align: center; margin: 0; padding: 20px; min-height: 100vh; display: flex; justify-content: center; align-items: center; background-image: radial-gradient(circle at center, #1a1a2e 0%, #0f0f1a 100%); }
            .container { background: rgba(26, 26, 46, 0.9); backdrop-filter: blur(12px); padding: 30px; border-radius: 20px; border: 1px solid rgba(255,71,87,0.3); box-shadow: 0 10px 30px rgba(0,0,0,0.6); width: 100%; max-width: 400px; text-align: left; }
            h2 { color: #ffd700; text-align: center; font-weight: 800; margin-bottom: 20px; }
            label { display: block; margin-top: 15px; font-size: 13px; font-weight: 600; color: #dcdcfe; }
            input[type="text"], input[type="password"] { width: 100%; padding: 12px; margin-top: 6px; border-radius: 8px; border: 1px solid #3d3d5c; background: #121222; color: #fff; font-size: 14px; outline: none; transition: 0.2s; }
            input[type="text"]:focus, input[type="password"]:focus { border-color: #ff4757; box-shadow: 0 0 8px rgba(255,71,87,0.3); }
            button { width: 100%; background: linear-gradient(135deg, #ff4757, #ff6b81); color: white; padding: 12px; border: none; border-radius: 10px; margin-top: 25px; font-weight: 700; font-size: 15px; cursor: pointer; box-shadow: 0 4px 15px rgba(255,71,87,0.4); transition: 0.3s; }
            button:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(255,71,87,0.6); }
            a { display: block; text-align: center; margin-top: 20px; color: #70a1ff; text-decoration: none; font-size: 14px; font-weight: 600; }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>🔑 เข้าสู่ระบบ</h2>
            <form action="/login" method="POST">
                <label>Username:</label>
                <input type="text" name="username" placeholder="ระบุชื่อผู้ใช้งาน" required>
                <label>Password:</label>
                <input type="password" name="password" placeholder="••••••••" required>
                <button type="submit">เข้าสู่ระบบ</button>
            </form>
            <a href="/">⬅️ กลับหน้าแรก</a>
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
      .eq('username', username);

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
        pendingHtml += `<li style="color:#ffa502; margin-bottom:4px;">ยอดโอน <b>${p.exact_amount} บาท</b> (รอแอดมินตรวจสอบสลิป)</li>`;
      });
    } else {
      pendingHtml = `<span style="color:#8e8ea0; font-size:12px;">ไม่มีรายการรอดำเนินการ</span>`;
    }

    let withdrawSectionHtml = "";
    if (pendingWithdrawRow) {
      withdrawSectionHtml = `<div style="background:rgba(255,165,2,0.1); border:1px solid rgba(255,165,2,0.4); padding:12px; border-radius:12px; margin-top:15px; font-size:13px; color:#ffa502; text-align:center; font-weight:600;">
          ⏳ ส่งคำขอถอน <b>${pendingWithdrawRow.total_robux} Robux</b> เรียบร้อยแล้ว (รอแอดมินตรวจสอบและโอนรางวัล)
      </div>`;
    } else {
      const canWithdraw = totalEarnedRobux >= 10;
      withdrawSectionHtml = `<div style="margin-top:15px; background:rgba(18,18,34,0.6); border:1px solid rgba(255,215,0,0.15); padding:14px; border-radius:12px; text-align:left;">
          <div style="font-size:13px; font-weight:700; color:#ffd700; margin-bottom:6px;">🎁 ถอน Robux (สะสมขั้นต่ำ 10 Robux):</div>
          <p style="font-size:12px; color:#a2a2bc; margin:0 0 10px 0;">แต้ม Robux สะสมของคุณ: <b style="color:#2ed573;">${totalEarnedRobux} Robux</b></p>
          <form action="/request-withdraw" method="POST">
              <input type="hidden" name="username" value="${username}">
              <button type="submit" style="width:100%; background:${canWithdraw ? 'linear-gradient(135deg, #2ed573, #7bed9f)' : '#3d3d5c'}; color:${canWithdraw ? '#000' : '#8e8ea0'}; padding:10px; border:none; border-radius:8px; font-weight:700; cursor:${canWithdraw ? 'pointer' : 'not-allowed'}; font-size:13px; box-shadow:${canWithdraw ? '0 4px 15px rgba(46,213,115,0.3)' : 'none'}; transition:0.2s;">
                  ${canWithdraw ? '📥 กดส่งคำขอถอน Robux' : '❌ ยังสะสมไม่ถึง 10 Robux (ถอนไม่ได้)'}
              </button>
          </form>
      </div>`;
    }

    res.send(`
      <!DOCTYPE html>
      <html lang="th">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>สุ่มกล่อง Roblox Robux - อลังการพรีเมียม</title>
          <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;600;700;800;900&display=swap" rel="stylesheet">
          <style>
              * { box-sizing: border-box; font-family: 'Prompt', sans-serif; }
              body { background-color: #0b0b16; color: #ffffff; text-align: center; margin: 0; padding: 20px 10px 40px 10px; background-image: radial-gradient(circle at 50% 0%, #1a153b 0%, #0b0b16 70%); min-height: 100vh; }
              
              .container { background: rgba(20, 20, 38, 0.85); backdrop-filter: blur(16px); padding: 25px 20px; border-radius: 24px; display: inline-block; width: 100%; max-width: 480px; box-shadow: 0 15px 35px rgba(0,0,0,0.7); border: 1px solid rgba(255,215,0,0.25); position: relative; overflow: hidden; }
              
              /* แถบแสงอลังการด้านบน */
              .container::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #ff4757, #ffd700, #2ed573, #00d2d3, #8e44ad); }

              h1 { color: #ffd700; font-size: 24px; font-weight: 900; text-transform: uppercase; margin: 10px 0 15px 0; text-shadow: 0 0 20px rgba(255,215,0,0.6); letter-spacing: 0.5px; }
              
              .banner-sub { background: linear-gradient(135deg, rgba(255,71,87,0.15), rgba(255,215,0,0.15)); border: 1px solid rgba(255,215,0,0.3); padding: 12px; border-radius: 14px; margin-bottom: 18px; box-shadow: inset 0 0 15px rgba(255,215,0,0.1); }
              .banner-sub h2 { color: #ffd700; font-size: 16px; font-weight: 800; margin: 0 0 4px 0; }
              .banner-sub p { color: #dcdcfe; font-size: 12px; margin: 0; font-weight: 600; }

              .user-box { margin-bottom: 15px; text-align: left; background: rgba(15,15,26,0.7); padding: 12px 15px; border-radius: 14px; display: flex; justify-content: space-between; align-items: center; border: 1px solid rgba(255,255,255,0.08); }
              .user-info { display: flex; align-items: center; gap: 10px; }
              .profile-img { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; border: 2px solid #ffd700; box-shadow: 0 0 10px rgba(255,215,0,0.4); }
              .user-actions { display: flex; flex-direction: column; gap: 4px; }
              
              .btn-action-mini { padding: 4px 10px; border-radius: 6px; text-decoration: none; font-size: 11px; font-weight: 700; text-align: center; transition: 0.2s; }
              .btn-action-mini:hover { transform: scale(1.05); }

              #countdown-box { background: rgba(255,215,0,0.1); border: 1px solid rgba(255,215,0,0.3); padding: 8px; border-radius: 10px; margin-bottom: 15px; font-size: 12px; color: #ffd700; text-align: center; font-weight: 700; }
              
              .wallet { background: linear-gradient(135deg, rgba(35,35,60,0.9), rgba(20,20,38,0.9)); padding: 12px; border-radius: 14px; margin-bottom: 18px; font-size: 14px; display: flex; justify-content: space-around; font-weight: 700; border: 1px solid rgba(255,255,255,0.08); box-shadow: inset 0 2px 5px rgba(0,0,0,0.3); }
              .wallet div { display: flex; align-items: center; gap: 6px; }

              .box-preview-area { background: rgba(12,12,22,0.6); border-radius: 16px; padding: 15px; margin-bottom: 18px; border: 1px solid rgba(255,255,255,0.08); position: relative; }
              .chest-img-main { width: 110px; height: 110px; object-fit: contain; margin: 5px auto 10px auto; display: block; filter: drop-shadow(0 0 20px rgba(255,215,0,0.6)); animation: floatChest 3s ease-in-out infinite; }
              
              @keyframes floatChest {
                  0%, 100% { transform: translateY(0) scale(1); }
                  50% { transform: translateY(-6px) scale(1.03); }
              }

              .box-btn { background: linear-gradient(135deg, #ff4757, #ff6b81); color: white; padding: 14px; border: none; border-radius: 14px; font-size: 16px; cursor: pointer; font-weight: 800; width: 100%; box-shadow: 0 6px 20px rgba(255,71,87,0.5); transition: 0.2s; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
              .box-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(255,71,87,0.7); background: linear-gradient(135deg, #ff6b81, #ff4757); }
              
              .select-group { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 12px; }
              .select-group button { background: #1a1a2e; color: #a2a2bc; border: 1px solid #3d3d5c; padding: 10px 0; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 13px; transition: 0.2s; }
              .select-group button:hover { border-color: #ffd700; color: #fff; }
              .select-group button.active { background: linear-gradient(135deg, #ffd700, #ffaa00); color: #000; border-color: #ffd700; box-shadow: 0 0 12px rgba(255,215,0,0.4); }

              input[type="number"] { width: 100%; padding: 12px; margin: 8px 0 12px 0; border-radius: 10px; border: 1px solid #3d3d5c; background: #121222; color: #fff; font-size: 14px; text-align: center; font-weight: 700; outline: none; }
              input[type="number"]:focus { border-color: #2ed573; box-shadow: 0 0 8px rgba(46,213,115,0.3); }

              .topup-btn { background: linear-gradient(135deg, #2ed573, #7bed9f); color: #000; padding: 12px; border: none; border-radius: 10px; width: 100%; font-weight: 800; cursor: pointer; font-size: 14px; box-shadow: 0 4px 15px rgba(46,213,115,0.3); transition: 0.2s; }
              .topup-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(46,213,115,0.5); }
              
              .reward-showcase { background: rgba(12,12,22,0.7); padding: 12px; border-radius: 12px; margin-bottom: 15px; text-align: left; max-height: 120px; overflow-y: auto; font-size: 12px; border: 1px solid rgba(255,255,255,0.06); display: flex; flex-wrap: wrap; gap: 5px; }
              .reward-item { background: #23233c; padding: 5px 10px; border-radius: 6px; color: #ffd700; font-weight: 700; border: 1px solid rgba(255,215,0,0.2); }
              .reward-epic { background: rgba(142,68,173,0.3); color: #d5b8ff; border-color: rgba(142,68,173,0.6); }
              .reward-legend { background: rgba(231,76,60,0.3); color: #ff9999; border-color: rgba(231,76,60,0.6); }
              .reward-ufo { background: rgba(0,210,211,0.3); color: #70ffff; border-color: rgba(0,210,211,0.6); }

              #result-box { margin-top: 15px; padding: 15px; border-radius: 12px; font-size: 14px; font-weight: 700; background: rgba(12,12,22,0.8); min-height: 50px; transition: all 0.3s; text-align: left; max-height: 220px; overflow-y: auto; border: 1px solid rgba(255,255,255,0.1); }
              
              @keyframes bouncePop {
                  0% { transform: scale(0.3); opacity: 0; }
                  50% { transform: scale(1.1); opacity: 1; }
                  70% { transform: scale(0.95); }
                  100% { transform: scale(1); opacity: 1; }
              }
              .popup-animation { animation: bouncePop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }

              .epic-glow {
                  animation: epicFlash 0.5s infinite alternate;
                  box-shadow: 0 0 25px #ffd700, inset 0 0 15px #ff4757;
                  border: 2px solid #ffd700;
              }

              .rainbow-flash { animation: rainbowAnim 0.4s infinite alternate; }
              @keyframes rainbowAnim {
                  0% { background-color: rgba(255, 0, 127, 0.5); box-shadow: 0 0 30px #ff007f; }
                  33% { background-color: rgba(255, 215, 0, 0.5); box-shadow: 0 0 30px #ffd700; }
                  66% { background-color: rgba(0, 210, 211, 0.5); box-shadow: 0 0 30px #00d2d3; }
                  100% { background-color: rgba(142, 68, 173, 0.5); box-shadow: 0 0 30px #8e44ad; }
              }

              .ufo-galaxy-flash { animation: ufoAnim 0.25s infinite alternate; }
              @keyframes ufoAnim {
                  0% { background-color: rgba(0, 255, 255, 0.7); box-shadow: 0 0 40px #00ffff, inset 0 0 20px #ffffff; border: 2px solid #fff; }
                  50% { background-color: rgba(255, 0, 255, 0.7); box-shadow: 0 0 40px #ff00ff, inset 0 0 20px #ffff00; border: 2px solid #ffd700; }
                  100% { background-color: rgba(0, 255, 0, 0.7); box-shadow: 0 0 40px #00ff00, inset 0 0 20px #00ffff; border: 2px solid #00d2d3; }
              }

              @keyframes epicFlash {
                  0% { background-color: rgba(255, 215, 0, 0.2); }
                  100% { background-color: rgba(255, 71, 87, 0.4); }
              }

              hr { border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 25px 0; }
              
              .section-title { text-align: left; font-size: 15px; font-weight: 800; color: #ffd700; margin: 15px 0 8px 0; display: flex; align-items: center; gap: 6px; }
              .section-desc { text-align: left; font-size: 12px; color: #a2a2bc; line-height: 1.5; margin-bottom: 12px; }

              .topup-card { background: rgba(15,15,26,0.6); padding: 15px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.06); margin-bottom: 15px; text-align: left; }
              
              .logout-link { display: inline-block; margin-top: 20px; color: #ff4757; text-decoration: none; font-weight: 700; font-size: 14px; transition: 0.2s; }
              .logout-link:hover { color: #ff6b81; text-shadow: 0 0 10px rgba(255,71,87,0.4); }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="banner-sub">
                  <h2>🎉 สุ่มกล่องเพียง 1฿ ลุ้นแสน!</h2>
                  <p>สุ่มรับรางวัลสูงสุด 10,000 Robux</p>
              </div>

              <h1>🎁 สุ่มกล่อง Roblox Robux</h1>
              
              <div class="user-box">
                  <div class="user-info">
                      <img src="${robloxImg}" class="profile-img">
                      <span style="font-size: 13px; font-weight: 700;">ผู้ใช้งาน: <b style="color: #2ed573;">${username}</b></span>
                  </div>
                  <div class="user-actions">
                      <a href="/my-history?username=${username}" class="btn-action-mini" style="background:#00d2d3; color:#000;">📜 ประวัติการสุ่ม</a>
                      <a href="/edit-profile?username=${username}" class="btn-action-mini" style="background:#ffa502; color:#000;">🔄 เปลี่ยนรูปโปรไฟล์</a>
                  </div>
              </div>

              <div id="countdown-box">
                  ⏳ ID นี้ใช้งานได้อีก: กำลังคำนวณเวลา...
              </div>
              
              <div class="wallet">
                  <div>💰 แต้ม: <span id="points" style="color: #ffd700; font-size: 16px;">${currentPoints}</span></div>
                  <div>🎯 ยอดสุ่ม: <span id="spent" style="color: #2ed573; font-size: 16px;">${totalSpent}</span> บ.</div>
              </div>

              ${withdrawSectionHtml}
              
              <div class="section-title">🏆 ของรางวัลในกล่อง:</div>
              <div class="reward-showcase">
                  <span class="reward-item">0 Robux (เกลือ)</span>
                  <span class="reward-item">1 - 2 Robux</span>
                  <span class="reward-item">3 - 5 Robux</span>
                  <span class="reward-item reward-epic">10 - 20 Robux</span>
                  <span class="reward-item reward-legend">100 Robux 🔥</span>
                  <span class="reward-item reward-legend">500 Robux 💎</span>
                  <span class="reward-item reward-legend">1,000 Robux 👑</span>
                  <span class="reward-item reward-ufo">10,000 Robux 🛸 (ใหม่!)</span>
              </div>

              <div class="box-preview-area">
                  <img src="https://i.imgur.com/35N9L6q.png" class="chest-img-main" onerror="this.src='https://cdn-icons-png.flaticon.com/512/4248/4248443.png'">
                  <div class="section-title" style="justify-content: center; margin-top: 0; font-size: 13px; color: #ffd700;">⚙️ เลือกจำนวนครั้งในการเปิดกล่อง:</div>
                  <div class="select-group">
                      <button type="button" class="active" onclick="setCount(1, this)">1 ครั้ง</button>
                      <button type="button" onclick="setCount(10, this)">10 ครั้ง</button>
                      <button type="button" onclick="setCount(20, this)">20 ครั้ง</button>
                      <button type="button" onclick="setCount(30, this)">30 ครั้ง</button>
                      <button type="button" onclick="setCount(50, this)">50 ครั้ง</button>
                      <button type="button" onclick="setCount(100, this)">100 ครั้ง</button>
                  </div>

                  <button class="box-btn" id="open-box-btn" onclick="openBox()">📦 เปิดกล่องลุ้นโชค (ใช้ 1 แต้ม)</button>
              </div>
              
              <div id="result-box">🎁 กดเปิดกล่องเพื่อลุ้นรับรางวัลสุดอลังการ!</div>

              <hr>

              <div class="topup-card">
                  <div class="section-title" style="color: #2ed573; margin-top:0;">⚡ เติมเงินผ่าน พร้อมเพย์ (PromptPay)</div>
                  <p class="section-desc">1. ใส่จำนวนเงินเพื่อสร้าง QR<br>2. สแกนโอนผ่านพร้อมเพย์ แล้วอัปโหลดสลิป</p>
                  
                  <form action="/create-topup" method="POST">
                      <input type="hidden" name="username" value="${username}">
                      <input type="hidden" name="topup_type" value="promptpay">
                      <label style="font-size: 12px; color: #a2a2bc; font-weight: 600; display: block; text-align: left;">จำนวนเงินที่ต้องการเติม (บาท):</label>
                      <input type="number" name="amount" placeholder="เช่น 50" required>
                      <button type="submit" class="topup-btn">สร้าง QR Code สแกนจ่าย</button>
                  </form>
              </div>

              <div class="topup-card">
                  <div class="section-title" style="color: #ff4757; margin-top:0;">🧡 เติมเงินผ่าน TrueMoney Wallet</div>
                  <p class="section-desc">โอนเงินเข้า TrueMoney Wallet: <b style="color:#ff4757;">0643399170</b> (ชื่อ: <b>ธีรวัฒน์ คำมุงคุณ</b>)<br>แล้วกรอกจำนวนเงินพร้อมอัปโหลดสลิปด้านล่าง</p>
                  
                  <form action="/create-topup" method="POST">
                      <input type="hidden" name="username" value="${username}">
                      <input type="hidden" name="topup_type" value="truemoney">
                      <label style="font-size: 12px; color: #a2a2bc; font-weight: 600; display: block; text-align: left;">จำนวนเงินที่โอน (บาท):</label>
                      <input type="number" name="amount" placeholder="เช่น 50" required>
                      <button type="submit" class="topup-btn" style="background: linear-gradient(135deg, #ff4757, #ff6b81); color: #fff; box-shadow: 0 4px 15px rgba(255,71,87,0.4);">แจ้งโอนผ่าน TrueMoney Wallet</button>
                  </form>
              </div>

              <div style="text-align:left; margin-top:15px; background:rgba(15,15,26,0.6); padding:12px; border-radius:12px; border:1px solid rgba(255,255,255,0.06);">
                  <div style="font-size:12px; color:#ffd700; font-weight:700; margin-bottom:6px;">📌 สถานะการเติมเงิน:</div>
                  <ul style="padding-left:15px; margin:0; font-size:12px;">${pendingHtml}</ul>
              </div>

              <a href="/" class="logout-link">🚪 ออกจากระบบ</a>
          </div>

          <script>
              let userPoints = ${currentPoints};
              let userSpent = ${totalSpent};
              let selectedCount = 1;
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
                  const expireTime = createdAtTime + thirtyDaysMs;
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

              function openBox() {
                  if (userPoints < selectedCount) {
                      alert("แต้มของคุณไม่พอใช้งานสำหรับ " + selectedCount + " ครั้ง! กรุณาเติมเงินก่อนครับ");
                      return;
                  }

                  const resBox = document.getElementById("result-box");
                  resBox.className = "";
                  resBox.innerText = \`🌀 ส่งคำขอเปิดกล่องรัวๆ \${selectedCount} ครั้ง ไปยัง Server...\`;

                  fetch('/open-lootbox', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ username: '${username}', count: selectedCount })
                  })
                  .then(response => response.json())
                  .then(data => {
                      if (!data.success) {
                          alert(data.message || "เกิดข้อผิดพลาด");
                          location.reload();
                          return;
                      }

                      userPoints = data.newPoints;
                      userSpent = data.newSpent;
                      document.getElementById("points").innerText = userPoints;
                      document.getElementById("spent").innerText = userSpent;

                      let totalRewardNum = data.totalRewardNum;
                      let highestRewardNum = data.highestRewardNum;
                      let summaryRewards = data.summaryRewards;

                      let noticeText = "<br><span style='font-size:11px; color:#00d2d3;'>⏳ แจ้งเตือน: เซิร์ฟเวอร์สุ่มและบันทึกประวัติให้เรียบร้อย กรุณารอแอดมินจัดส่ง Robux</span>";

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

                      resBox.innerHTML = \`🎉 <b>สรุปผลสุ่ม \${selectedCount} ครั้ง (Server Verified):</b><br>
                          รวม Robux ที่ได้ทั้งหมด: <b style="color:#ffd700; font-size:16px;">\${totalRewardNum} Robux</b><br>
                          <div style="font-size:12px; margin-top:5px; background:rgba(0,0,0,0.3); padding:8px; border-radius:5px;">\${summaryListHtml}</div>
                          \${noticeText}\`;

                      setTimeout(() => { location.reload(); }, 2000);
                  })
                  .catch(err => {
                      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
                      location.reload();
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
      historyList += `<tr><td style="padding:10px; border-bottom:1px solid #3d3d5c;">${r.id}</td><td style="padding:10px; border-bottom:1px solid #3d3d5c; color:#ffd700;"><b>${r.reward}</b></td><td style="padding:10px; border-bottom:1px solid #3d3d5c; color:#a2a2bc; font-size:12px;">${r.time}</td></tr>`;
    });
  } else {
    historyList = `<tr><td colspan="3" style="padding:20px; color:#a2a2bc;">คุณยังไม่มีประวัติการสุ่ม</td></tr>`;
  }

  res.send(`
    <!DOCTYPE html>
    <html lang="th">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ประวัติการสุ่มของฉัน</title>
        <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;600;700;800&display=swap" rel="stylesheet">
        <style>
            * { box-sizing: border-box; font-family: 'Prompt', sans-serif; }
            body { background: #0f0f1a; color: #ffffff; text-align: center; margin: 0; padding: 20px; min-height: 100vh; display: flex; justify-content: center; align-items: center; background-image: radial-gradient(circle at center, #1a1a2e 0%, #0f0f1a 100%); }
            .container { background: rgba(26, 26, 46, 0.9); backdrop-filter: blur(12px); padding: 30px 20px; display: inline-block; border-radius: 20px; width: 100%; max-width: 500px; box-shadow: 0 10px 30px rgba(0,0,0,0.6); border: 1px solid rgba(0,210,211,0.3); }
            table { width: 100%; border-collapse: collapse; background: #121222; border-radius: 10px; overflow: hidden; margin-bottom: 20px; font-size: 13px; }
            th { padding: 12px; background: #1a1a2e; color: #ffd700; font-weight: 700; }
            a { display: inline-block; background: linear-gradient(135deg, #70a1ff, #1e90ff); color: #fff; padding: 10px 20px; border-radius: 10px; text-decoration: none; font-weight: 700; box-shadow: 0 4px 15px rgba(112,161,255,0.4); transition: 0.3s; }
            a:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(112,161,255,0.6); }
        </style>
    </head>
    <body>
        <div class="container">
            <h2 style="color:#ffd700; font-weight:800; margin-bottom:20px;">📜 ประวัติการสุ่มของ: ${username}</h2>
            <table>
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
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>เปลี่ยนรูปโปรไฟล์ Roblox</title>
        <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;600;700;800&display=swap" rel="stylesheet">
        <style>
            * { box-sizing: border-box; font-family: 'Prompt', sans-serif; }
            body { background: #0f0f1a; color: #ffffff; text-align: center; margin: 0; padding: 20px; min-height: 100vh; display: flex; justify-content: center; align-items: center; background-image: radial-gradient(circle at center, #1a1a2e 0%, #0f0f1a 100%); }
            .container { background: rgba(26, 26, 46, 0.9); backdrop-filter: blur(12px); padding: 30px; display: inline-block; border-radius: 20px; width: 100%; max-width: 380px; text-align: left; box-shadow: 0 10px 30px rgba(0,0,0,0.6); border: 1px solid rgba(255,165,2,0.3); }
            h2 { color: #ffa502; text-align: center; font-weight: 800; margin-bottom: 5px; }
            label { display: block; margin-top: 15px; font-size: 13px; font-weight: 600; color: #dcdcfe; }
            input[type="file"] { width: 100%; padding: 10px; margin-top: 6px; border-radius: 8px; background: #121222; color: #fff; border: 1px solid #3d3d5c; font-size: 13px; }
            button { width: 100%; background: linear-gradient(135deg, #2ed573, #7bed9f); color: #000; padding: 12px; border: none; border-radius: 10px; margin-top: 25px; font-weight: 700; font-size: 15px; cursor: pointer; box-shadow: 0 4px 15px rgba(46,213,115,0.4); transition: 0.3s; }
            button:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(46,213,115,0.6); }
            a { display: block; text-align: center; margin-top: 20px; color: #70a1ff; text-decoration: none; font-size: 14px; font-weight: 600; }
            .current-img { display: block; margin: 0 auto 15px auto; width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 2px solid #ffd700; box-shadow: 0 0 15px rgba(255,215,0,0.4); }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>🔄 เปลี่ยนรูปโปรไฟล์</h2>
            <p style="font-size:12px; color:#a2a2bc; text-align:center; margin-bottom:20px;">อัปเดตรูปใหม่ได้ตลอด หากเปลี่ยนบัญชีหรือสมัคร ID ใหม่</p>
            <img src="${currentImg}" class="current-img">
            <form action="/edit-profile" method="POST" enctype="multipart/form-data">
                <input type="hidden" name="username" value="${username}">
                <label>อัปโหลดรูปโปรไฟล์ Roblox ใหม่:</label>
                <input type="file" name="roblox_img" accept="image/*" required>
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

app.post("/request-withdraw", async (req, res) => {
  const { username } = req.body;

  const { data: userHistory } = await supabase
    .from('history')
    .select('*')
    .eq('username', username);

  if (!userHistory || userHistory.length === 0) {
    return res.send(`<script>alert("คุณไม่มีประวัติการสุ่มที่จะถอน!"); window.location.href="/lootbox?username=${username}";</script>`);
  }

  let totalRobux = 0;
  userHistory.forEach(h => {
    totalRobux += (h.reward_num || 0);
  });

  if (totalRobux < 10) {
    return res.send(`<script>alert("แต้ม Robux สะสมยังไม่ถึง 10 Robux ไม่สามารถถอนได้!"); window.location.href="/lootbox?username=${username}";</script>`);
  }

  res.send(`
    <!DOCTYPE html>
    <html lang="th">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ตรวจสอบเงื่อนไขก่อนถอน Robux</title>
        <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;600;700;800&display=swap" rel="stylesheet">
        <style>
            * { box-sizing: border-box; font-family: 'Prompt', sans-serif; }
            body { background: #0f0f1a; color: #ffffff; text-align: center; margin: 0; padding: 20px; min-height: 100vh; display: flex; justify-content: center; align-items: center; background-image: radial-gradient(circle at center, #1a1a2e 0%, #0f0f1a 100%); }
            .container { background: rgba(26, 26, 46, 0.9); backdrop-filter: blur(12px); padding: 30px; display: inline-block; border-radius: 20px; width: 100%; max-width: 450px; text-align: left; box-shadow: 0 10px 30px rgba(0,0,0,0.6); border: 1px solid rgba(255,215,0,0.3); }
            h2 { color: #ffd700; text-align: center; font-weight: 800; margin-bottom: 10px; }
            .warning-box { background: rgba(255,165,2,0.1); border: 1px solid rgba(255,165,2,0.4); padding: 15px; border-radius: 12px; margin: 15px 0; font-size: 12px; color: #ffa502; line-height: 1.6; }
            button { width: 100%; background: linear-gradient(135deg, #2ed573, #7bed9f); color: #000; padding: 12px; border: none; border-radius: 10px; font-weight: 800; cursor: pointer; margin-top: 10px; font-size: 15px; box-shadow: 0 4px 15px rgba(46,213,115,0.4); transition: 0.3s; }
            button:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(46,213,115,0.6); }
            a { display: block; text-align: center; margin-top: 15px; color: #70a1ff; text-decoration: none; font-size: 13px; font-weight: 600; }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>⚠️ ตรวจสอบก่อนยืนยันการถอน</h2>
            <p style="text-align:center; font-size:14px; color:#fff;">ยอดถอน: <b style="color:#ffd700; font-size:20px;">${totalRobux} Robux</b></p>
            
            <div class="warning-box">
                <b>📌 คำเตือนและเงื่อนไขการรับ Robux:</b><br><br>
                1. โปรดตรวจสอบให้แน่ใจว่าในเกม Roblox ของคุณตั้งค่าอายุเป็น <b>18 ปีขึ้นไปแล้วหรือยัง</b> และผ่านการ<b>สแกนใบหน้า (Age Check)</b> หรือยืนยันตัวตนแล้ว<br><br>
                2. <b>หากอายุในเกมไม่ถึง 18 ปี</b> ระบบ Roblox จะบังคับให้ต้องมี <b>"บัญชีผู้ปกครอง" (Parent Account)</b> ทำการกดอนุมัติ/รับ Robux ให้ทุกครั้ง<br><br>
                3. <b>ทุกครั้งที่มีการเปลี่ยน ID Roblox หรือใช้ ID ใหม่ในการรับรางวัล</b> คุณจะต้องกดเข้าไปเปลี่ยนรูปโปรไฟล์ Roblox ในหน้าเว็บให้ตรงกับไอดีใหม่ทุกครั้ง เพื่อให้แอดมินส่ง Robux ได้อย่างถูกต้อง
            </div>

            <form action="/confirm-withdraw" method="POST">
                <input type="hidden" name="username" value="${username}">
                <button type="submit">✅ ยืนยันว่าตรวจสอบแล้ว / ส่งคำขอถอน</button>
            </form>
            <a href="/lootbox?username=${username}">⬅️ ยังไม่ถอน / กลับหน้าสุ่มกล่อง</a>
        </div>
    </body>
    </html>
  `);
});

app.post("/confirm-withdraw", async (req, res) => {
  const { username } = req.body;

  const { data: userHistory } = await supabase
    .from('history')
    .select('*')
    .eq('username', username);

  if (!userHistory || userHistory.length === 0) {
    return res.send(`<script>alert("เกิดข้อผิดพลาด ไม่พบประวัติการสุ่ม!"); window.location.href="/lootbox?username=${username}";</script>`);
  }

  let totalRobux = 0;
  let totalOpens = userHistory.length;
  userHistory.forEach(h => {
    totalRobux += (h.reward_num || 0);
  });

  const { data: userData } = await supabase
    .from('users')
    .select('roblox_img')
    .eq('username', username)
    .single();

  const robloxImg = userData ? userData.roblox_img : "";

  await supabase
    .from('pending_withdraw')
    .insert([{
      username: username,
      roblox_img: robloxImg,
      total_opens: totalOpens,
      total_robux: totalRobux,
      status: 'pending'
    }]);

  res.send(`<script>alert("ส่งคำขอถอน ${totalRobux} Robux สำเร็จ! ประวัติถูกส่งไปให้แอดมินตรวจสอบเรียบร้อย"); window.location.href="/lootbox?username=${username}";</script>`);
});

app.post("/create-topup", (req, res) => {
  const { username, amount, topup_type } = req.body;
  const exactAmount = parseFloat(amount).toFixed(2);
  
  let titleText = "";
  let infoHtml = "";

  if (topup_type === "truemoney") {
      titleText = "🧡 แจ้งโอนเงิน TrueMoney Wallet";
      infoHtml = `
        <p style="font-size:13px; color:#a2a2bc; text-align:center; margin:5px 0;">โอนเข้าเบอร์: <b style="color:#ff4757; font-size:16px;">${MY_TRUEMONEY_NUMBER}</b></p>
        <p style="font-size:13px; color:#a2a2bc; text-align:center; margin:5px 0;">ชื่อบัญชี: <b>${MY_TRUEMONEY_NAME}</b></p>
      `;
  } else {
      titleText = "📱 สแกนจ่ายด้วยพร้อมเพย์";
      const qrCodeUrl = `https://promptpay.io/${MY_PROMPTPAY_NUMBER}/${exactAmount}.png`;
      infoHtml = `
        <p style="font-size:13px; color:#a2a2bc; text-align:center; margin:5px 0;">ชื่อบัญชี: <b>${MY_ACCOUNT_NAME}</b></p>
        <div style="background:#fff; padding:12px; text-align:center; border-radius:12px; margin:15px 0; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
            <img src="${qrCodeUrl}" style="width:180px; height:180px; display:block; margin:0 auto;">
        </div>
      `;
  }

  res.send(`
    <!DOCTYPE html><html lang="th"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${titleText}</title>
    <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;600;700;800&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; font-family: 'Prompt', sans-serif; }
        body { background: #0f0f1a; color: #fff; text-align: center; margin: 0; padding: 20px; min-height: 100vh; display: flex; justify-content: center; align-items: center; background-image: radial-gradient(circle at center, #1a1a2e 0%, #0f0f1a 100%); }
        .box { background: rgba(26, 26, 46, 0.9); backdrop-filter: blur(12px); padding: 30px; display: inline-block; border-radius: 20px; width: 100%; max-width: 380px; text-align: left; box-shadow: 0 10px 30px rgba(0,0,0,0.6); border: 1px solid rgba(255,215,0,0.3); }
        label { display: block; margin-top: 15px; font-size: 13px; font-weight: 600; color: #dcdcfe; }
        input[type="file"] { width: 100%; padding: 10px; margin-top: 6px; border-radius: 8px; background: #121222; color: #fff; border: 1px solid #3d3d5c; font-size: 13px; }
    </style></head>
    <body><div class="box">
        <h2 style="color:${topup_type === 'truemoney' ? '#ff4757' : '#2ed573'}; text-align:center; font-weight:800; margin-bottom:15px;">${titleText}</h2>
        ${infoHtml}
        
        <div style="text-align:center; background:rgba(255,215,0,0.1); padding:10px; border-radius:10px; border:1px solid rgba(255,215,0,0.3); margin:15px 0;">
            <span style="font-size:12px; color:#a2a2bc; display:block;">ยอดที่ต้องชำระ:</span>
            <span style="color:#ffd700; font-size:22px; font-weight:900;">${exactAmount} บาท</span>
        </div>
        
        <hr style="border:0; border-top:1px solid rgba(255,255,255,0.1); margin:15px 0;">

        <form action="/upload-slip" method="POST" enctype="multipart/form-data" onsubmit="handleUpload(this)">
            <input type="hidden" name="username" value="${username}">
            <input type="hidden" name="exact_amount" value="${exactAmount}">
            <input type="hidden" name="topup_type" value="${topup_type || 'promptpay'}">
            
            <label>📤 อัปโหลดสลิปโอนเงิน:</label>
            <input type="file" name="slip_img" accept="image/*" required>
            
            <button type="submit" id="submit-btn" style="width:100%; background:${topup_type === 'truemoney' ? 'linear-gradient(135deg, #ff4757, #ff6b81)' : 'linear-gradient(135deg, #2ed573, #7bed9f)'}; color:${topup_type === 'truemoney' ? '#fff' : '#000'}; padding:12px; border:none; border-radius:10px; font-weight:800; cursor:pointer; margin-top:20px; font-size:14px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); transition:0.3s;">ส่งสลิปให้แอดมินตรวจสอบ</button>
        </form>

        <div id="loading-text" style="display:none; text-align:center; margin-top:12px; color:#ffd700; font-size:13px; font-weight:700;">
            ⏳ กำลังอัปโหลดสลิปและบันทึกข้อมูล กรุณารอ...
        </div>

        <a href="/lootbox?username=${username}" style="display:block; text-align:center; margin-top:20px; color:#70a1ff; text-decoration:none; font-size:13px; font-weight:600;">⬅️ กลับหน้าสุ่มกล่อง</a>
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
              reward = "0 Robux (😢 เกลือ)";
              rewardNum = 0;
          } else if (forceRateType === 'always_jackpot_1') {
              reward = "1 Robux";
              rewardNum = 1;
          } else if (forceRateType === 'always_jackpot_2') {
              reward = "2 Robux";
              rewardNum = 2;
          } else if (forceRateType === 'always_jackpot_3') {
              reward = "3 Robux";
              rewardNum = 3;
          } else if (forceRateType === 'always_jackpot_5') {
              reward = "5 Robux";
              rewardNum = 5;
          } else if (forceRateType === 'always_jackpot_10') {
              reward = "10 Robux";
              rewardNum = 10;
          } else if (forceRateType === 'always_jackpot_15') {
              reward = "15 Robux";
              rewardNum = 15;
          } else if (forceRateType === 'always_jackpot_20') {
              reward = "20 Robux";
              rewardNum = 20;
          } else if (forceRateType === 'always_jackpot_100') {
              reward = "100 Robux (🔥 แจ็คพอตแตก)";
              rewardNum = 100;
          } else if (forceRateType === 'always_jackpot_500') {
              reward = "500 Robux (💎 แจ็คพอตใหญ่)";
              rewardNum = 500;
          } else if (forceRateType === 'always_jackpot_1000') {
              reward = "1,000 Robux (👑 แจ็คพอตในตำนาน)";
              rewardNum = 1000;
          } else if (forceRateType === 'always_jackpot_10000') {
              reward = "10,000 Robux (🛸 UFO ถล่มจักรวาล)";
              rewardNum = 10000;
          }
      } else {
          if (currentSaltCount > 0) {
              reward = "0 Robux (😢 เกลือ)";
              rewardNum = 0;
              currentSaltCount -= 1;
          } else {
              const rand = Math.random() * 100;
              if (rand < 0.0001) { 
                  reward = "10,000 Robux (🛸 UFO ถล่มจักรวาล)"; 
                  rewardNum = 10000; 
              }
              else if (rand < 0.0005) { 
                  reward = "1,000 Robux (👑 แจ็คพอตในตำนาน)"; 
                  rewardNum = 1000; 
              }
              else if (rand < 0.002) { 
                  reward = "500 Robux (💎 แจ็คพอตใหญ่)"; 
                  rewardNum = 500; 
              }
              else if (rand < 0.01) { 
                  reward = "100 Robux (🔥 แจ็คพอตแตก)"; 
                  rewardNum = 100; 
              }
              else if (rand < 0.02) { reward = "20 Robux"; rewardNum = 20; }
              else if (rand < 0.05) { reward = "15 Robux"; rewardNum = 15; }
              else if (rand < 0.1) { reward = "10 Robux"; rewardNum = 10; }
              else if (rand < 0.2) { reward = "5 Robux"; rewardNum = 5; }
              else if (rand < 0.3) { reward = "4 Robux"; rewardNum = 4; }
              else if (rand < 0.5) { reward = "3 Robux"; rewardNum = 3; }
              else if (rand < 1.0) { reward = "2 Robux"; rewardNum = 2; }
              else if (rand < 50.0) { reward = "1 Robux"; rewardNum = 1; }
              else { reward = "0 Robux (😢 เกลือ)"; rewardNum = 0; }
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
          reward_num: rewardNum
      });
  }

  const newPoints = user.points - selectedCount;
  const newSpent = (user.total_spent || 0) + selectedCount;

  let finalForceRateType = 'normal';
  let finalSaltCount = currentSaltCount;

  await supabase
    .from('users')
    .update({ 
        points: newPoints, 
        total_spent: newSpent,
        custom_salt_count: finalSaltCount,
        force_rate_type: finalForceRateType
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
    <!DOCTYPE html>
    <html lang="th">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>เข้าสู่ระบบผู้ดูแลระบบ</title>
        <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;600;700;800&display=swap" rel="stylesheet">
        <style>
            * { box-sizing: border-box; font-family: 'Prompt', sans-serif; }
            body { background: #0f0f1a; color: #fff; text-align: center; margin: 0; padding: 20px; min-height: 100vh; display: flex; justify-content: center; align-items: center; background-image: radial-gradient(circle at center, #1a1a2e 0%, #0f0f1a 100%); }
            .box { background: rgba(26, 26, 46, 0.9); backdrop-filter: blur(12px); padding: 30px; display: inline-block; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.6); width: 100%; max-width: 380px; border: 1px solid rgba(255,71,87,0.3); }
            input[type="password"] { padding: 12px; width: 100%; border-radius: 8px; border: 1px solid #3d3d5c; background: #121222; color: #fff; font-size: 14px; margin-top: 10px; outline: none; }
            button { padding: 12px; background: linear-gradient(135deg, #ff4757, #ff6b81); color: #fff; border: none; border-radius: 8px; cursor: pointer; font-weight: 700; margin-top: 15px; width: 100%; font-size: 15px; box-shadow: 0 4px 15px rgba(255,71,87,0.4); transition: 0.3s; }
            button:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(255,71,87,0.6); }
            a { color: #70a1ff; text-decoration: none; margin-top: 20px; display: inline-block; font-size: 14px; font-weight: 600; }
        </style>
    </head>
    <body>
      <div class="box">
        <h2 style="color: #ffd700; font-weight: 800; margin-bottom: 10px;">🛠️ ระบบแอดมิน</h2>
        <form action="/admin/login" method="POST">
          <input type="password" name="password" placeholder="รหัสผ่านแอดมิน" required>
          <button type="submit">เข้าสู่ระบบ</button>
        </form>
        <a href="/">⬅️ กลับหน้าแรก</a>
      </div>
    </body>
    </html>
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

  res.send(`<script>alert("อนุมัติยอดเงินและเพิ่ม ${pointsToAdd} แต้มให้ ${username} เรียบร้อย!"); window.location.href="/admin";</script>`);
});

app.post("/admin/delete-topup", async (req, res) => {
  if (!req.session.isAdmin) return res.redirect("/admin");
  const { topup_id } = req.body;

  await supabase
    .from('pending_topup')
    .delete()
    .eq('id', topup_id);

  res.send(`<script>alert("ลบสลิปรายการนี้เรียบร้อยแล้ว!"); window.location.href="/admin";</script>`);
});

app.post("/admin/approve-withdraw", async (req, res) => {
  if (!req.session.isAdmin) return res.redirect("/admin");
  const { withdraw_id, username } = req.body;

  await supabase
    .from('pending_withdraw')
    .update({ status: 'completed' })
    .eq('id', withdraw_id);

  await supabase
    .from('history')
    .delete()
    .eq('username', username);

  res.send(`<script>alert("อนุมัติการถอนของ ${username} เรียบร้อย!"); window.location.href="/admin";</script>`);
});

app.post("/admin/delete-withdraw", async (req, res) => {
  if (!req.session.isAdmin) return res.redirect("/admin");
  const { withdraw_id } = req.body;

  const { data: withdrawData } = await supabase
    .from('pending_withdraw')
    .select('username')
    .eq('id', withdraw_id)
    .single();

  await supabase
    .from('pending_withdraw')
    .delete()
    .eq('id', withdraw_id);

  if (withdrawData) {
    await supabase
      .from('history')
      .delete()
      .eq('username', withdrawData.username);
  }

  res.send(`<script>alert("เคลียร์รายการถอนเรียบร้อย!"); window.location.href="/admin";</script>`);
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

  res.send(`<script>alert("อัปเดตแต้มสำเร็จ!"); window.location.href="/admin";</script>`);
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

  res.send(`<script>alert("บันทึกการตั้งค่าเรตสุ่มพิเศษของ ${username} เรียบร้อย!"); window.location.href="/admin";</script>`);
});

app.post("/admin/delete-user", async (req, res) => {
  if (!req.session.isAdmin) return res.redirect("/admin");
  const { username } = req.body;

  await supabase.from('users').delete().eq('username', username);
  await supabase.from('history').delete().eq('username', username);
  await supabase.from('pending_topup').delete().eq('username', username);
  await supabase.from('pending_withdraw').delete().eq('username', username);

  res.send(`<script>alert("ลบสมาชิก ${username} ออกจากระบบเรียบร้อยแล้ว!"); window.location.href="/admin";</script>`);
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
      historyList += `<tr><td style="padding:8px;">${r.id}</td><td style="padding:8px; color:#ffd700;"><b>${r.reward}</b></td><td style="padding:8px; color:#a2a2bc;">${r.time}</td></tr>`;
    });
  } else {
    historyList = `<tr><td colspan="3" style="padding:15px; color:#a2a2bc;">ไม่มีประวัติการสุ่ม</td></tr>`;
  }

  res.send(`
    <!DOCTYPE html>
    <html lang="th">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>ประวัติการสุ่ม</title>
    <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;600;700;800&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; font-family: 'Prompt', sans-serif; }
        body { background:#0f0f1a; color:#fff; text-align:center; padding:30px 10px; }
        .box { background: rgba(26,26,46,0.9); padding:25px; display:inline-block; border-radius:20px; width:100%; max-width:600px; border: 1px solid rgba(255,215,0,0.3); }
        table { width:100%; border-collapse:collapse; background:#121222; border-radius:10px; overflow:hidden; margin-bottom:20px; font-size:13px; }
        th { padding:10px; background:#1a1a2e; color:#ffd700; }
        a { background: linear-gradient(135deg, #70a1ff, #1e90ff); color:#fff; padding:10px 20px; border-radius:10px; text-decoration:none; font-weight:700; display:inline-block; }
    </style></head>
    <body>
      <div class="box">
        <h2 style="color:#ffd700; font-weight:800; margin-bottom:15px;">📦 ประวัติการสุ่มของ: ${username}</h2>
        <table>
          <tr><th>ID</th><th>รางวัลที่ได้</th><th>เวลา</th></tr>
          ${historyList}
        </table>
        <a href="/admin">⬅️ กลับหน้าแอดมินหลัก</a>
      </div>
    </body>
    </html>
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
        <td><a href="${p.slip_img}" target="_blank"><img src="${p.slip_img}" style="width:50px; height:70px; object-fit:cover; border-radius:6px; border:1px solid #fff;"></a></td>
        <td style="font-size:12px; color:#a2a2bc;">${p.time}</td>
        <td>
          <div style="display:flex; gap:4px; justify-content:center;">
            <form action="/admin/approve-topup" method="POST" style="margin:0;">
              <input type="hidden" name="topup_id" value="${p.id}">
              <input type="hidden" name="username" value="${p.username}">
              <input type="hidden" name="exact_amount" value="${p.exact_amount}">
              <button type="submit" style="background:#2ed573; color:#fff; border:none; padding:6px 10px; border-radius:6px; font-weight:700; cursor:pointer; font-size:12px;">✅ อนุมัติ</button>
            </form>
            <form action="/admin/delete-topup" method="POST" onsubmit="return confirm('ต้องการลบสลิปนี้ใช่หรือไม่?');" style="margin:0;">
              <input type="hidden" name="topup_id" value="${p.id}">
              <button type="submit" style="background:#ff4757; color:#fff; border:none; padding:6px 10px; border-radius:6px; font-weight:700; cursor:pointer; font-size:12px;">🗑️ ลบ</button>
            </form>
          </div>
        </td>
      </tr>`;
    });
  } else {
    pendingSlipHtml = `<tr><td colspan="6" style="padding:15px; color:#a2a2bc;">ไม่มีรายการสลิปรอตรวจสอบ</td></tr>`;
  }

  let withdrawHtml = "";
  if (pendingWithdrawRows && pendingWithdrawRows.length > 0) {
    pendingWithdrawRows.forEach(w => {
      withdrawHtml += `<tr>
        <td>${w.id}</td>
        <td><b>${w.username}</b></td>
        <td><a href="${w.roblox_img}" target="_blank"><img src="${w.roblox_img}" style="width:36px; height:36px; border-radius:50%; object-fit:cover; border:1px solid #ffd700;"></a></td>
        <td style="color:#00d2d3;">สุ่ม ${w.total_opens} ครั้ง</td>
        <td style="color:#ffd700; font-weight:800;">${w.total_robux} Robux</td>
        <td style="font-size:12px; color:#a2a2bc;">${w.time}</td>
        <td>
          <div style="display:flex; gap:4px; justify-content:center; flex-wrap:wrap;">
            <a href="/admin/user-detail?username=${w.username}" target="_blank" style="background:#70a1ff; color:#fff; padding:5px 8px; border-radius:6px; font-weight:700; text-decoration:none; font-size:11px;">🔍 ประวัติ</a>
            <form action="/admin/approve-withdraw" method="POST" style="margin:0;">
              <input type="hidden" name="withdraw_id" value="${w.id}">
              <input type="hidden" name="username" value="${w.username}">
              <button type="submit" style="background:#2ed573; color:#fff; border:none; padding:5px 8px; border-radius:6px; font-weight:700; cursor:pointer; font-size:11px;">✅ อนุมัติ</button>
            </form>
            <form action="/admin/delete-withdraw" method="POST" onsubmit="return confirm('เคลียร์คำขอถอนนี้ใช่ไหม?');" style="margin:0;">
              <input type="hidden" name="withdraw_id" value="${w.id}">
              <button type="submit" style="background:#ff4757; color:#fff; border:none; padding:5px 8px; border-radius:6px; font-weight:700; cursor:pointer; font-size:11px;">🗑️ ลบ</button>
            </form>
          </div>
        </td>
      </tr>`;
    });
  } else {
    withdrawHtml = `<tr><td colspan="7" style="padding:15px; color:#a2a2bc;">ยังไม่มีคำขอถอน Robux จากสมาชิก</td></tr>`;
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
        <td><a href="${u.roblox_img}" target="_blank"><img src="${u.roblox_img}" style="width:36px; height:36px; border-radius:50%; object-fit:cover; border:1px solid #ffd700;"></a></td>
        <td>${u.points} แต้ม</td>
        <td>${u.total_spent || 0} บาท</td>
        <td style="color:#ffd700; font-size:12px;">${daysLeft}</td>
        <td>
          <form action="/admin/update-points" method="POST" style="display:inline-flex; gap:3px; align-items:center; margin:0 0 4px 0;">
            <input type="hidden" name="username" value="${u.username}">
            <input type="number" name="points" value="1" min="1" style="width:40px; padding:3px; text-align:center; border-radius:4px; border:1px solid #3d3d5c; background:#121222; color:#fff;">
            <button type="submit" name="action" value="add" style="background:#2ed573; color:#fff; border:none; padding:3px 6px; border-radius:4px; cursor:pointer; font-weight:700;">➕</button>
            <button type="submit" name="action" value="subtract" style="background:#ff4757; color:#fff; border:none; padding:3px 6px; border-radius:4px; cursor:pointer; font-weight:700;">➖</button>
          </form>

          <form action="/admin/update-user-luck" method="POST" style="background:rgba(0,0,0,0.4); padding:6px; border-radius:6px; margin-top:4px; text-align:left; border:1px solid rgba(255,255,255,0.06);">
            <div style="font-size:11px; color:#ffd700; margin-bottom:2px; font-weight:700;">🎛️ ตั้งค่าเรต/เกลือ:</div>
            <div style="display:flex; gap:4px; align-items:center; margin-bottom:4px;">
              <span style="font-size:11px; color:#a2a2bc;">เกลือ:</span>
              <input type="number" name="custom_salt_count" value="${saltCountVal}" min="0" style="width:45px; padding:2px; font-size:11px; text-align:center; background:#121222; color:#fff; border:1px solid #3d3d5c; border-radius:3px;">
            </div>
            <div style="margin-bottom:4px;">
              <select name="force_rate_type" style="width:100%; font-size:11px; padding:3px; background:#121222; color:#fff; border:1px solid #3d3d5c; border-radius:3px;">
                <option value="normal" ${rateTypeVal === 'normal' ? 'selected' : ''}>เรตปกติ</option>
                <option value="always_salt" ${rateTypeVal === 'always_salt' ? 'selected' : ''}>🔒 เกลือตลอดกาล</option>
                <option value="always_jackpot_1" ${rateTypeVal === 'always_jackpot_1' ? 'selected' : ''}>⭐ ออก 1 Robux</option>
                <option value="always_jackpot_2" ${rateTypeVal === 'always_jackpot_2' ? 'selected' : ''}>⭐ ออก 2 Robux</option>
                <option value="always_jackpot_3" ${rateTypeVal === 'always_jackpot_3' ? 'selected' : ''}>⭐ ออก 3 Robux</option>
                <option value="always_jackpot_5" ${rateTypeVal === 'always_jackpot_5' ? 'selected' : ''}>⭐ ออก 5 Robux</option>
                <option value="always_jackpot_10" ${rateTypeVal === 'always_jackpot_10' ? 'selected' : ''}>⭐ ออก 10 Robux</option>
                <option value="always_jackpot_15" ${rateTypeVal === 'always_jackpot_15' ? 'selected' : ''}>⭐ ออก 15 Robux</option>
                <option value="always_jackpot_20" ${rateTypeVal === 'always_jackpot_20' ? 'selected' : ''}>⭐ ออก 20 Robux</option>
                <option value="always_jackpot_100" ${rateTypeVal === 'always_jackpot_100' ? 'selected' : ''}>🔥 ออก 100 Robux</option>
                <option value="always_jackpot_500" ${rateTypeVal === 'always_jackpot_500' ? 'selected' : ''}>💎 ออก 500 Robux</option>
                <option value="always_jackpot_1000" ${rateTypeVal === 'always_jackpot_1000' ? 'selected' : ''}>👑 ออก 1,000 Robux</option>
                <option value="always_jackpot_10000" ${rateTypeVal === 'always_jackpot_10000' ? 'selected' : ''}>🛸 ออก 10,000 Robux</option>
              </select>
            </div>
            <button type="submit" style="background:#00d2d3; color:#000; border:none; padding:3px; border-radius:3px; font-weight:700; cursor:pointer; font-size:11px; width:100%;">💾 บันทึกเรต</button>
          </form>

          <form action="/admin/delete-user" method="POST" onsubmit="return confirm('ต้องการลบสมาชิก ${u.username} ออกจากระบบใช่หรือไม่?');" style="margin-top:6px;">
            <input type="hidden" name="username" value="${u.username}">
            <button type="submit" style="background:#c0392b; color:#fff; border:none; padding:4px 8px; border-radius:4px; font-weight:700; cursor:pointer; font-size:11px; width:100%;">🗑️ ลบยูส</button>
          </form>
        </td>
      </tr>`;
    });
  } else {
    userHtml = `<tr><td colspan="7" style="padding:15px; color:#a2a2bc;">ยังไม่มีสมาชิกในระบบ</td></tr>`;
  }

  let paginationHtml = "";
  if (totalPages > 1) {
      paginationHtml += `<div style="margin: 20px 0;">`;
      if (page > 1) {
          paginationHtml += `<a href="/admin?page=${page - 1}" style="background:#23233c; color:#fff; padding:8px 14px; margin:0 3px; border-radius:6px; text-decoration:none; font-weight:700; font-size:13px;">⬅️ หน้าก่อนหน้า</a>`;
      }
      paginationHtml += `<span style="margin:0 10px; color:#ffd700; font-weight:700; font-size:13px;">หน้า ${page} / ${totalPages}</span>`;
      if (page < totalPages) {
          paginationHtml += `<a href="/admin?page=${page + 1}" style="background:#23233c; color:#fff; padding:8px 14px; margin:0 3px; border-radius:6px; text-decoration:none; font-weight:700; font-size:13px;">หน้าถัดไป ➡️</a>`;
      }
      paginationHtml += `</div>`;
  }

  res.send(`
    <!DOCTYPE html>
    <html lang="th">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ระบบจัดการหลังบ้าน (แอดมิน)</title>
        <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;600;700;800&display=swap" rel="stylesheet">
        <style>
            * { box-sizing: border-box; font-family: 'Prompt', sans-serif; }
            body { background: #0b0b16; color: #fff; text-align: center; margin: 0; padding: 20px 10px; }
            h2 { color: #ffd700; font-weight: 900; }
            h3 { color: #ffd700; font-weight: 800; font-size: 16px; margin-top: 30px; }
            table { margin: 0 auto; border-collapse: collapse; background: rgba(26,26,46,0.85); border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); font-size: 13px; width: 100%; max-width: 950px; }
            th { padding: 10px; background: #1a1a2e; color: #ffd700; font-weight: 700; }
            td { padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.06); }
            a { color: #70a1ff; text-decoration: none; font-weight: 600; }
        </style>
    </head>
    <body>
      <h2>🛠️ ระบบจัดการหลังบ้าน (แอดมิน)</h2>
      <div style="margin-bottom: 20px;">
          <a href="/admin/logout" style="color:#ff4757; font-weight:700; margin-right:15px;">🔒 ออกจากระบบ</a>
          <a href="/" style="color:#70a1ff; font-weight:700;">🏠 กลับหน้าแรก</a>
      </div>

      <h3>📥 รายการสลิปรอตรวจสอบการเติมเงิน</h3>
      <table>
        <tr><th>ID</th><th>Username</th><th>ยอดเงิน</th><th>รูปสลิป</th><th>เวลา</th><th>จัดการ</th></tr>
        ${pendingSlipHtml}
      </table>

      <h3>💎 คำขอถอน Robux และประวัติการสุ่มจากสมาชิก</h3>
      <table>
        <tr><th>ID</th><th>Username</th><th>รูป Roblox</th><th>จำนวนครั้ง</th><th>รวม Robux</th><th>เวลา</th><th>จัดการ</th></tr>
        ${withdrawHtml}
      </table>

      <h3>👥 รายชื่อสมาชิกทั้งหมด</h3>
      <table>
        <tr><th>ลำดับ</th><th>Username</th><th>รูป Roblox</th><th>แต้ม</th><th>ยอดใช้</th><th>อายุ</th><th style="width:220px;">จัดการ / เรตลับ</th></tr>
        ${userHtml}
      </table>
      ${paginationHtml}
    </body>
    </html>
  `);
}

app.listen(PORT, () => {
  console.log("Server running smoothly at port " + PORT);
});