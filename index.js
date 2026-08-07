require('dotenv').config();

const express = require("express");
const session = require("express-session");
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

// Session Config
app.use(session({
    secret: process.env.SESSION_SECRET || 'linerangers_super_secret_key_2026',
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

// หน้าแรก
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="th">
    <head>
        <meta charset="UTF-8">
        <title>🚀 Line Rangers LootBox - เว็บสุ่มไอดี Line Rangers</title>
        <style>
            body { background-color: #121824; color: #ffffff; text-align: center; padding-top: 80px; font-family: 'Kanit', sans-serif; }
            .container { background: #1e2638; padding: 30px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 15px rgba(0,0,0,0.5); width: 350px; }
            h1 { color: #00b900; }
            a { display: block; background-color: #00b900; color: white; padding: 12px; margin: 10px 0; border-radius: 6px; text-decoration: none; font-weight: bold; }
            a:hover { background-color: #009900; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🛡️ Line Rangers Box</h1>
            <p>เว็บสุ่มไอดีและของรางวัลเกม Line Rangers</p>
            <a href="/login">เข้าสู่ระบบ</a>
            <a href="/register" style="background-color: #3b5998;">สมัครสมาชิก</a>
        </div>
    </body>
    </html>
  `);
});

// หน้าสมัครสมาชิก (ปรับรับลิงก์ Facebook)
app.get("/register", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="th">
    <head>
        <meta charset="UTF-8">
        <title>สมัครสมาชิก - Line Rangers</title>
        <style>
            body { background-color: #121824; color: #ffffff; text-align: center; padding-top: 30px; font-family: sans-serif; }
            .container { background: #1e2638; padding: 30px; border-radius: 10px; display: inline-block; width: 360px; text-align: left; }
            h2 { color: #00b900; text-align: center; }
            label { display: block; margin-top: 10px; font-size: 14px; }
            input { width: 100%; padding: 10px; margin-top: 5px; border-radius: 4px; border: 1px solid #334155; background: #0f172a; color: #fff; box-sizing: border-box; }
            button { width: 100%; background-color: #00b900; color: white; padding: 12px; border: none; border-radius: 5px; margin-top: 20px; font-weight: bold; cursor: pointer; }
            a { display: block; text-align: center; margin-top: 15px; color: #38bdf8; text-decoration: none; }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>📝 สมัครสมาชิก</h2>
            <p style="font-size:12px; color:#f59e0b; text-align:center;">⚠️ บัญชีมีอายุใช้งาน 30 วันนับจากวันที่สมัคร</p>
            <form action="/register" method="POST">
                <label>Username (สำหรับเข้าสู่ระบบ):</label>
                <input type="text" name="username" required placeholder="ตั้งชื่อผู้ใช้งาน">
                
                <label>Password:</label>
                <input type="password" name="password" required placeholder="ตั้งรหัสผ่าน">
                
                <label>ลิงก์ Facebook ส่วนตัว (สำหรับรับไอดี/รางวัล):</label>
                <input type="url" name="facebook_url" required placeholder="https://www.facebook.com/your.profile">
                <span style="font-size:10px; color:#94a3b8;">*คัดลอกลิงก์โปรไฟล์ Facebook ของคุณมาวาง เพื่อให้แอดมินทักส่งไอดีให้</span>

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
          facebook_url: facebook_url, 
          points: 0, 
          total_spent: 0, 
          step1_salt: 0, step1_reward: 'normal',
          step2_salt: 0, step2_reward: 'normal',
          step3_salt: 0, step3_reward: 'normal',
          step4_salt: 0, step4_reward: 'normal',
          step5_salt: 0, step5_reward: 'normal'
      }]);

    if (error) {
      return res.send(`<script>alert("ชื่อผู้ใช้นี้ซ้ำในระบบ หรือเกิดข้อผิดพลาด!"); window.location.href="/register";</script>`);
    }
    res.send(`<script>alert("สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ"); window.location.href="/login";</script>`);
  } catch (err) {
    res.send(`<script>alert("เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล"); window.location.href="/register";</script>`);
  }
});

// หน้าเข้าสู่ระบบ
app.get("/login", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="th">
    <head>
        <meta charset="UTF-8">
        <title>เข้าสู่ระบบ - Line Rangers</title>
        <style>
            body { background-color: #121824; color: #ffffff; text-align: center; padding-top: 50px; }
            .container { background: #1e2638; padding: 30px; border-radius: 10px; display: inline-block; width: 350px; text-align: left; }
            h2 { color: #00b900; text-align: center; }
            label { display: block; margin-top: 10px; font-size: 14px; }
            input { width: 100%; padding: 10px; margin-top: 5px; border-radius: 4px; border: 1px solid #334155; background: #0f172a; color: #fff; box-sizing: border-box; }
            button { width: 100%; background-color: #00b900; color: white; padding: 12px; border: none; border-radius: 5px; margin-top: 20px; font-weight: bold; cursor: pointer; }
            a { display: block; text-align: center; margin-top: 15px; color: #38bdf8; text-decoration: none; }
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
      return res.send(`<script>alert("บัญชีของคุณหมดอายุการใช้งาน 30 วันแล้ว ถูกลบออกจากระบบอัตโนมัติ!"); window.location.href="/login";</script>`);
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

// API สถานะผู้ใช้
app.get("/api/user-status", async (req, res) => {
  const username = req.query.username;
  if (!username) return res.json({ success: false });

  try {
    const { data: user } = await supabase
      .from('users')
      .select('points, total_spent')
      .eq('username', username)
      .single();

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

    const { data: userHistoryRows } = await supabase
      .from('history')
      .select('reward_num, is_withdrawn')
      .eq('username', username);

    let totalEarnedPoints = 0;
    if (userHistoryRows) {
      userHistoryRows.forEach(h => {
        if (!h.is_withdrawn) {
          totalEarnedPoints += (h.reward_num || 0);
        }
      });
    }

    res.json({
      success: true,
      points: user ? user.points : 0,
      total_spent: user ? user.total_spent : 0,
      hasPendingWithdraw: !!pendingWithdrawRow,
      pendingWithdrawAmount: pendingWithdrawRow ? pendingWithdrawRow.total_robux : 0,
      pendingRows: pendingRows || [],
      totalEarnedPoints: totalEarnedPoints
    });
  } catch (e) {
    res.json({ success: false });
  }
});

// หน้ากล่องสุ่มไอดี Line Rangers
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
    const facebookUrl = row.facebook_url || '#';
    const createdAt = row.created_at;

    const { data: userHistoryRows } = await supabase
      .from('history')
      .select('reward_num, is_withdrawn')
      .eq('username', username);

    let totalEarnedPoints = 0;
    if (userHistoryRows) {
      userHistoryRows.forEach(h => {
        if (!h.is_withdrawn) {
          totalEarnedPoints += (h.reward_num || 0);
        }
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

    let withdrawSectionHtml = "";
    if (pendingWithdrawRow) {
      withdrawSectionHtml = `
        <div id="withdraw-section-wrapper">
            <div style="background:rgba(255,165,2,0.15); border:1px solid #ffa502; padding:10px; border-radius:6px; margin-top:15px; font-size:13px; color:#ffa502; text-align:center;">
                ⏳ กำลังรอรับไอดี/รางวัล: <b style="color:#00b900;" id="pending-robux-display">${pendingWithdrawRow.total_robux} แต้มรางวัล</b> (แอดมินจะทักเฟซส่วนตัวไปส่งมอบภายใน 24 ชม.)
            </div>
        </div>
      `;
    } else {
      const canWithdraw = totalEarnedPoints >= 10;
      withdrawSectionHtml = `
        <div id="withdraw-section-wrapper">
            <div style="margin-top:8px; background:rgba(0,185,0,0.15); border:1px solid #00b900; padding:10px; border-radius:6px; font-size:13px; color:#00b900; text-align:center;">
                💰 ยอดรางวัลสะสมปัจจุบัน: <b style="color:#ffd700;" id="total-earned-robux">${totalEarnedPoints} แต้มรางวัล</b>
            </div>
            <div style="margin-top:10px; background:rgba(0,0,0,0.2); padding:10px; border-radius:8px; text-align:left;">
                <b style="font-size:13px; color:#ffd700;">🎁 แจ้งรับไอดี/รางวัล (สะสมขั้นต่ำ 10 แต้มรางวัล):</b>
                <form action="/request-withdraw" method="POST">
                    <input type="hidden" name="username" value="${username}">
                    <button type="submit" id="withdraw-btn" style="width:100%; margin-top:6px; background:${canWithdraw ? '#00b900' : '#555'}; color:#fff; padding:10px; border:none; border-radius:5px; font-weight:bold; cursor:${canWithdraw ? 'pointer' : 'not-allowed'};" ${canWithdraw ? '' : 'disabled'}>
                        ${canWithdraw ? '📥 กดส่งคำขอรับไอดี Line Rangers' : '❌ ยังสะสมไม่ถึง 10 แต้มรางวัล'}
                    </button>
                </form>
            </div>
        </div>`;
    }

    res.send(`
      <!DOCTYPE html>
      <html lang="th">
      <head>
          <meta charset="UTF-8">
          <title>สุ่มกล่องไอดี Line Rangers</title>
          <style>
              body { background-color: #0b0c10; color: #ffffff; text-align: center; margin: 0; padding: 15px 0; }
              .main-wrapper { max-width: 460px; margin: 0 auto; background: #13151f; border-radius: 16px; border: 1px solid #25283c; box-shadow: 0 10px 30px rgba(0,0,0,0.8); overflow: hidden; padding: 20px; box-sizing: border-box; }
              .banner-header h2 { color: #00b900; font-size: 20px; margin: 5px 0 0 0; }
              .user-bar { background: #1b1e2e; border: 1px solid #2a2e45; border-radius: 10px; padding: 10px 15px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
              .btn-history { background: #00d2d3; color: #000; padding: 4px 8px; border-radius: 4px; text-decoration: none; font-size: 11px; font-weight: bold; }
              .wallet-box { background: #1b1e2e; border: 1px solid #2a2e45; border-radius: 10px; padding: 10px; display: flex; justify-content: space-around; font-size: 14px; margin-bottom: 12px; font-weight: bold; color: #ffd700; }
              #countdown-box { background: rgba(255,215,0,0.1); border: 1px dashed #ffd700; padding: 6px; border-radius: 6px; margin-bottom: 12px; font-size: 12px; color: #ffd700; font-weight: bold; }
              .showcase-container { background: #181b2a; border: 1px solid #282c44; border-radius: 12px; padding: 10px; margin-bottom: 15px; }
              .rewards-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
              .reward-card { background: #13151f; border: 1px solid #2c314f; border-radius: 8px; padding: 6px 2px; text-align: center; }
              .reward-card.legendary { border-color: #ffd700; background: linear-gradient(135deg, #2b2b1e, #13151f); grid-column: span 3; }
              .select-group { display: grid; grid-template-columns: repeat(6, 1fr); gap: 4px; margin-bottom: 12px; }
              .select-group button { background: #1b1e2e; color: #fff; border: 1px solid #2f3452; padding: 6px 0; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 11px; }
              .select-group button.active { background: #00b900; color: #fff; border-color: #00e600; }
              .box-btn { background: linear-gradient(135deg, #00b900, #00e600); color: white; padding: 12px; border: none; border-radius: 8px; font-size: 14px; cursor: pointer; font-weight: bold; width: 100%; margin-bottom: 10px; }
              #result-box { margin-top: 10px; padding: 12px; border-radius: 8px; font-size: 13px; font-weight: bold; background: #181b2a; border: 1px solid #2c314f; min-height: 40px; text-align: left; max-height: 180px; overflow-y: auto; }
              .topup-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px; }
              .topup-card { background: #1b1e2e; border: 1px solid #2a2e45; border-radius: 10px; padding: 10px; text-align: left; }
              input[type="number"] { width: 100%; padding: 6px; background: #13151f; border: 1px solid #333856; color: #fff; border-radius: 4px; box-sizing: border-box; font-size: 12px; margin-bottom: 6px; }
              .topup-sub-btn { width: 100%; padding: 6px; border: none; border-radius: 4px; font-weight: bold; font-size: 11px; cursor: pointer; }
          </style>
      </head>
      <body>
          <div class="main-wrapper">
              <div class="banner-header">
                  <h2>🚀 สุ่มกล่องไอดี Line Rangers</h2>
                  <p style="color:#00d2d3; font-size:12px;">สุ่มลุ้นรับไอดีเทพ และรางวัลพิเศษมากมาย!</p>
              </div>

              <div class="user-bar">
                  <div style="text-align: left; font-size: 12px;">
                      <span style="color: #a4b0be; font-size: 10px;">ผู้ใช้งาน:</span> <b>${username}</b>
                  </div>
                  <div>
                      <a href="/my-history?username=${username}" class="btn-history">📜 ประวัติสุ่ม</a>
                  </div>
              </div>

              <div id="countdown-box">⏳ บัญชีใช้งานได้อีก: กำลังคำนวณ...</div>
              
              <div class="wallet-box">
                  <div>💰 แต้ม: <span id="points">${currentPoints}</span></div>
                  <div>🎯 สุ่มสะสม: <span id="spent">${totalSpent}</span> ฿</div>
              </div>

              <div id="dynamic-withdraw-container">${withdrawSectionHtml}</div>
              
              <div class="showcase-container">
                  <div style="font-size:12px; color:#a4b0be; text-align:left; margin-bottom:8px; font-weight:bold;">🏆 รายการของรางวัล</div>
                  <div class="rewards-grid">
                      <div class="reward-card"><div style="font-size: 18px;">🧂</div><div style="font-size: 10px;">เกลือ</div></div>
                      <div class="reward-card"><div style="font-size: 18px;">🎁</div><div style="font-size: 10px;">1-5 แต้ม</div></div>
                      <div class="reward-card"><div style="font-size: 18px;">💎</div><div style="font-size: 10px;">10-20 แต้ม</div></div>
                      <div class="reward-card legendary"><div style="font-size: 20px;">🛡️</div><div style="font-size: 11px; color:#ffd700;">แจ็คพอต: ไอดี Line Rangers สุดเทพ!</div></div>
                  </div>
              </div>

              <div style="font-size:12px; color:#ffd700; text-align:left; margin-bottom:6px; font-weight:bold;">⚙️ จำนวนครั้งในการเปิดกล่อง:</div>
              <div class="select-group">
                  <button type="button" class="${countParam === 1 ? 'active' : ''}" onclick="setCount(1, this)">1 ครั้ง</button>
                  <button type="button" class="${countParam === 10 ? 'active' : ''}" onclick="setCount(10, this)">10 ครั้ง</button>
                  <button type="button" class="${countParam === 20 ? 'active' : ''}" onclick="setCount(20, this)">20 ครั้ง</button>
                  <button type="button" class="${countParam === 30 ? 'active' : ''}" onclick="setCount(30, this)">30 ครั้ง</button>
                  <button type="button" class="${countParam === 50 ? 'active' : ''}" onclick="setCount(50, this)">50 ครั้ง</button>
                  <button type="button" class="${countParam === 100 ? 'active' : ''}" onclick="setCount(100, this)">100 ครั้ง</button>
              </div>

              <button class="box-btn" id="open-box-btn" onclick="openBox()">📦 เปิดกล่องลุ้นโชค (${countParam} ครั้ง / ใช้ ${countParam} แต้ม)</button>
              
              <div id="result-box">🎁 กดเปิดกล่องเพื่อลุ้นรับรางวัลไอดี Line Rangers!</div>

              <div style="font-size:15px; color:#ffd700; text-align:left; margin:15px 0 5px 0; font-weight:bold;">💳 ช่องทางการเติมเงิน</div>
              
              <div class="topup-grid">
                  <div class="topup-card">
                      <h4 style="color: #2ed573; margin:0 0 8px 0; font-size:12px;">📱 พร้อมเพย์</h4>
                      <form action="/create-topup" method="POST">
                          <input type="hidden" name="username" value="${username}">
                          <input type="hidden" name="topup_type" value="promptpay">
                          <input type="number" name="amount" placeholder="จำนวนเงิน" required>
                          <button type="submit" class="topup-sub-btn" style="background:#2ed573; color:#fff;">สแกน QR</button>
                      </form>
                  </div>

                  <div class="topup-card">
                      <h4 style="color: #ff4757; margin:0 0 8px 0; font-size:12px;">🧡 Wallet</h4>
                      <form action="/create-topup" method="POST">
                          <input type="hidden" name="username" value="${username}">
                          <input type="hidden" name="topup_type" value="truemoney">
                          <input type="number" name="amount" placeholder="จำนวนเงิน" required>
                          <button type="submit" class="topup-sub-btn" style="background:#ff4757; color:#fff;">แจ้งโอนเงิน</button>
                      </form>
                  </div>
              </div>

              <div style="text-align:left; margin-top:10px; background:#1b1e2e; padding:8px; border-radius:6px; font-size:11px;">
                  <b style="color:#ffd700;">📌 สถานะการเติมเงิน:</b>
                  <ul id="pending-list-container" style="padding-left:15px; margin:3px 0;">${pendingHtml}</ul>
              </div>

              <a href="/" style="display:block; margin-top:20px; color:#ff4757; text-decoration:none; font-size:12px;">ออกจากระบบ</a>
          </div>

          <script>
              let userPoints = ${currentPoints};
              let userSpent = ${totalSpent};
              let totalEarnedPoints = ${totalEarnedPoints};
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
                  box.innerHTML = \`⏳ บัญชีใช้งานได้อีก: \${days} วัน \${hours} ชม. \${minutes} นาที\`;
              }
              setInterval(updateCountdown, 1000);
              updateCountdown();

              function openBox() {
                  if (userPoints < selectedCount) {
                      alert("แต้มของคุณไม่พอ!");
                      return;
                  }
                  const openBtn = document.getElementById("open-box-btn");
                  openBtn.disabled = true;

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
                      for (const [rew, count] of Object.entries(data.summaryRewards)) {
                          summaryListHtml += \`• \${rew} x \${count} ครั้ง<br>\`;
                      }

                      document.getElementById("result-box").innerHTML = \`🎉 <b>สรุปผลสุ่ม \${selectedCount} ครั้ง:</b><br>
                          <div style="font-size:12px; margin-top:5px;">\${summaryListHtml}</div>\`;
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

// ประวัติการสุ่ม
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
        <style>
            body { background-color: #121824; color: #ffffff; text-align: center; padding-top: 40px; }
            .container { background: #1e2638; padding: 30px; display: inline-block; border-radius: 10px; width: 450px; }
            table { width: 100%; border-collapse: collapse; background: #0f172a; margin-bottom: 20px; font-size: 14px; }
            th { padding: 10px; background: #334155; color: #00b900; }
            a { display: inline-block; background: #38bdf8; color: #fff; padding: 10px 20px; border-radius: 5px; text-decoration: none; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <h2 style="color:#00b900;">📜 ประวัติการสุ่ม: ${username}</h2>
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

// คำขอถอน/รับไอดี
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

  let totalPoints = 0;
  userHistory.forEach(h => {
    totalPoints += (h.reward_num || 0);
  });

  res.send(`
    <!DOCTYPE html>
    <html lang="th">
    <head>
        <meta charset="UTF-8">
        <title>ยืนยันการขอรับไอดี / รางวัล</title>
        <style>
            body { background-color: #121824; color: #ffffff; text-align: center; padding-top: 30px; }
            .container { background: #1e2638; padding: 30px; display: inline-block; border-radius: 10px; width: 420px; text-align: left; }
            h2 { color: #00b900; text-align: center; }
            button { width: 100%; background-color: #00b900; color: white; padding: 12px; border: none; border-radius: 5px; font-weight: bold; cursor: pointer; margin-top: 10px; }
            a { display: block; text-align: center; margin-top: 15px; color: #38bdf8; text-decoration: none; }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>⚠️ ตรวจสอบก่อนยืนยัน</h2>
            <p style="text-align:center;">แต้มรางวัลสะสม: <b style="color:#ffd700; font-size:18px;">${totalPoints} แต้ม</b></p>
            <div style="background:rgba(0,185,0,0.1); border:1px solid #00b900; padding:12px; border-radius:6px; font-size:13px; color:#cbd5e1; margin-bottom:15px;">
                📌 เมื่อกดส่งคำขอ แอดมินจะตรวจสอบประวัติ และติดต่อส่งมอบไอดีเกม Line Rangers ให้ผ่านทาง <b>Facebook ส่วนตัว</b> ที่คุณระบุไว้ในการสมัครสมาชิกครับ
            </div>
            <form action="/confirm-withdraw" method="POST">
                <input type="hidden" name="username" value="${username}">
                <button type="submit">✅ ยืนยันส่งคำขอรับรางวัล</button>
            </form>
            <a href="/lootbox?username=${username}">⬅️ ยกเลิก / กลับหน้าสุ่ม</a>
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
    .eq('username', username)
    .eq('is_withdrawn', false);

  if (!userHistory || userHistory.length === 0) {
    return res.send(`<script>alert("ไม่พบประวัติการสุ่ม!"); window.location.href="/lootbox?username=${username}";</script>`);
  }

  let totalRobux = 0;
  let totalOpens = userHistory.length;
  let historyDataSnapshot = JSON.stringify(userHistory);
  let idsToUpdate = [];
  userHistory.forEach(h => {
    totalRobux += (h.reward_num || 0);
    idsToUpdate.push(h.id);
  });

  const { data: userData } = await supabase
    .from('users')
    .select('facebook_url')
    .eq('username', username)
    .single();

  const facebookUrl = userData ? userData.facebook_url : "";

  await supabase
    .from('pending_withdraw')
    .insert([{
      username: username,
      roblox_img: facebookUrl, // ใช้ช่อง roblox_img ในการเก็บ facebook_url เพื่อคงโครงสร้างเดิม
      total_opens: totalOpens,
      total_robux: totalRobux,
      status: 'pending',
      history_snapshot: historyDataSnapshot
    }]);

  if (idsToUpdate.length > 0) {
    await supabase
      .from('history')
      .update({ is_withdrawn: true })
      .in('id', idsToUpdate);
  }

  res.send(`<script>alert("ส่งคำขอสำเร็จ! แอดมินจะทักแชท Facebook ไปส่งมอบรางวัลครับ"); window.location.href="/lootbox?username=${username}";</script>`);
});

// เติมเงินและสลิป
app.post("/create-topup", (req, res) => {
  const { username, amount, topup_type } = req.body;
  const exactAmount = parseFloat(amount).toFixed(2);
  const qrCodeUrl = `https://promptpay.io/${MY_PROMPTPAY_NUMBER}/${exactAmount}.png`;

  res.send(`
    <!DOCTYPE html><html lang="th"><head><meta charset="UTF-8"><title>เติมเงิน</title>
    <style>
        body { background: #121824; color: #fff; text-align: center; padding-top: 30px; }
        .box { background: #1e2638; padding: 25px; display: inline-block; border-radius: 10px; width: 380px; text-align: left; }
    </style></head>
    <body><div class="box">
        <h2 style="color:#00b900; text-align:center;">💳 ชำระเงิน ${exactAmount} บาท</h2>
        ${topup_type === 'promptpay' ? `<div style="background:#fff; padding:10px; text-align:center; border-radius:8px;"><img src="${qrCodeUrl}" style="width:180px;"></div>` : `<p style="text-align:center;">โอน TrueMoney Wallet: <b>${MY_TRUEMONEY_NUMBER}</b></p>`}
        <form action="/upload-slip" method="POST" enctype="multipart/form-data" style="margin-top:15px;">
            <input type="hidden" name="username" value="${username}">
            <input type="hidden" name="exact_amount" value="${exactAmount}">
            <input type="hidden" name="topup_type" value="${topup_type}">
            <label>📤 อัปโหลดสลิป:</label>
            <input type="file" name="slip_img" accept="image/*" required style="background:#fff; color:#000; width:100%; box-sizing:border-box;">
            <button type="submit" style="width:100%; background:#00b900; color:#fff; padding:10px; border:none; border-radius:5px; margin-top:10px; font-weight:bold; cursor:pointer;">ส่งสลิปแจ้งแอดมิน</button>
        </form>
    </div></body></html>
  `);
});

// อัลกอริทึมกล่องสุ่ม (คงเรตเกลือ และ 5 สเต็ปของเดิมไว้ 100%)
function getRewardDetails(rewardType) {
    switch(rewardType) {
        case 'always_salt': return { reward: "🧂 เกลือ", rewardNum: 0 };
        case 'always_jackpot_1': return { reward: "🎁 1 แต้มรางวัล", rewardNum: 1 };
        case 'always_jackpot_2': return { reward: "🎁 2 แต้มรางวัล", rewardNum: 2 };
        case 'always_jackpot_3': return { reward: "🎁 3 แต้มรางวัล", rewardNum: 3 };
        case 'always_jackpot_5': return { reward: "🎁 5 แต้มรางวัล", rewardNum: 5 };
        case 'always_jackpot_10': return { reward: "💎 10 แต้มรางวัล", rewardNum: 10 };
        case 'always_jackpot_20': return { reward: "💎 20 แต้มรางวัล", rewardNum: 20 };
        case 'always_jackpot_100': return { reward: "🔥 แจ็คพอต: ไอดี Line Rangers ระดับ S!", rewardNum: 100 };
        case 'always_jackpot_1000': return { reward: "🐉 แจ็คพอตใหญ่: ไอดี Line Rangers ระดับ SSR!", rewardNum: 1000 };
        default: return null;
    }
}

app.post("/open-lootbox", async (req, res) => {
  const { username, count } = req.body;
  const selectedCount = parseInt(count) || 1;

  const { data: user } = await supabase.from('users').select('*').eq('username', username).single();
  if (!user || user.points < selectedCount) return res.json({ success: false, message: "แต้มไม่พอ!" });

  let totalRewardNum = 0;
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
      let rewardNum = 0;
      let handled = false;

      for (let s = 0; s < steps.length; s++) {
          if (steps[s].salt > 0) {
              reward = "🧂 เกลือ";
              rewardNum = 0;
              steps[s].salt -= 1;
              handled = true;
              break;
          } else if (steps[s].salt === 0 && steps[s].reward && steps[s].reward !== 'normal') {
              let info = getRewardDetails(steps[s].reward);
              if (info) {
                  reward = info.reward;
                  rewardNum = info.rewardNum;
                  steps[s].reward = 'normal';
                  handled = true;
                  break;
              }
          }
      }

      if (!handled) {
          const rand = Math.random() * 100;
          if (rand < 0.01) { reward = "🐉 แจ็คพอตใหญ่: ไอดี Line Rangers SSR!"; rewardNum = 1000; }
          else if (rand < 0.1) { reward = "🔥 แจ็คพอต: ไอดี Line Rangers S!"; rewardNum = 100; }
          else if (rand < 1.0) { reward = "💎 10 แต้มรางวัล"; rewardNum = 10; }
          else if (rand < 10.0) { reward = "🎁 1 แต้มรางวัล"; rewardNum = 1; }
          else { reward = "🧂 เกลือ"; rewardNum = 0; }
      }

      totalRewardNum += rewardNum;
      summaryRewards[reward] = (summaryRewards[reward] || 0) + 1;

      historyBatch.push({
          username: username,
          roblox_img: user.facebook_url,
          reward: reward,
          reward_num: rewardNum,
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
      totalRewardNum: totalRewardNum,
      summaryRewards: summaryRewards
  });
});

// =================== หลังบ้านแอดมิน (ADMIN DASHBOARD) ===================

app.get("/admin", async (req, res) => {
  if (req.session.isAdmin) return renderAdminDashboard(req, res);
  res.send(`
    <body style="background:#121824; color:#fff; text-align:center; padding-top:80px;">
      <div style="background:#1e2638; padding:30px; display:inline-block; border-radius:10px;">
        <h2>🛠️ เข้าสู่ระบบผู้ดูแลระบบ (Line Rangers Admin)</h2>
        <form action="/admin/login" method="POST">
          <input type="password" name="password" placeholder="รหัสผ่านแอดมิน" style="padding:10px; width:240px;" required>
          <button type="submit" style="padding:10px; background:#00b900; color:#fff; border:none; border-radius:4px; font-weight:bold; cursor:pointer;">เข้าสู่ระบบ</button>
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

// แอดมินเพิ่มไอดีเกม Line Rangers เข้าคลัง
app.post("/admin/add-account", async (req, res) => {
  if (!req.session.isAdmin) return res.redirect("/admin");
  const { account_info } = req.body;

  if (account_info) {
    await supabase.from('game_accounts').insert([{ account_info: account_info, status: 'available' }]);
  }
  res.send(`<script>alert("เพิ่มไอดี Line Rangers เข้าสู่คลังเรียบร้อย!"); window.location.href="/admin";</script>`);
});

// แสดงหน้าหลักหลังบ้านแอดมิน
async function renderAdminDashboard(req, res) {
  const { data: usersRows } = await supabase.from('users').select('*').order('id', { ascending: false });
  const { data: pendingRows } = await supabase.from('pending_topup').select('*').eq('status', 'pending');
  const { data: pendingWithdrawRows } = await supabase.from('pending_withdraw').select('*').eq('status', 'pending');
  const { data: gameAccounts } = await supabase.from('game_accounts').select('*').eq('status', 'available');

  let accountsListHtml = "";
  if (gameAccounts && gameAccounts.length > 0) {
      gameAccounts.forEach((acc, i) => {
          accountsListHtml += `<tr><td>${i+1}</td><td>${acc.account_info}</td><td style="color:#2ed573;">พร้อมสุ่ม</td></tr>`;
      });
  } else {
      accountsListHtml = `<tr><td colspan="3" style="color:#aaa;">ยังไม่มีไอดีในคลัง กรุณากรอกเพิ่มด้านล่าง</td></tr>`;
  }

  let withdrawHtml = "";
  if (pendingWithdrawRows && pendingWithdrawRows.length > 0) {
    pendingWithdrawRows.forEach((w, index) => {
      withdrawHtml += `<tr>
        <td>${index + 1}</td>
        <td><b>${w.username}</b></td>
        <td><a href="${w.roblox_img}" target="_blank" style="color:#38bdf8;">🔗 ดู Facebook ผู้เล่น</a></td>
        <td style="color:#ffd700; font-weight:bold;">${w.total_robux} แต้มรางวัล</td>
        <td>
            <form action="/admin/approve-withdraw" method="POST" style="margin:0; display:inline;">
              <input type="hidden" name="withdraw_id" value="${w.id}">
              <input type="hidden" name="username" value="${w.username}">
              <button type="submit" style="background:#2ed573; color:#fff; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">✅ ส่งมอบเรียบร้อย</button>
            </form>
        </td>
      </tr>`;
    });
  } else {
    withdrawHtml = `<tr><td colspan="5" style="padding:15px; color:#aaa;">ไม่มีคำขอรับรางวัลที่ค้างอยู่</td></tr>`;
  }

  res.send(`
    <body style="background:#121824; color:#fff; text-align:center; padding:30px; font-family:sans-serif;">
      <h2>🛠️ ระบบจัดการหลังบ้าน - Line Rangers LootBox</h2>
      
      <!-- ส่วนเพิ่มไอดีเกม Line Rangers -->
      <div style="background:#1e2638; padding:20px; border-radius:10px; width:800px; margin:0 auto 30px auto; text-align:left;">
          <h3 style="color:#00b900; margin-top:0;">➕ เพิ่มไอดีเกม Line Rangers เข้าคลัง</h3>
          <form action="/admin/add-account" method="POST" style="display:flex; gap:10px;">
              <input type="text" name="account_info" placeholder="กรอกข้อมูลไอดี เช่น ID / รหัสผ่าน / รายละเอียดไอดี..." style="flex:1; padding:10px; border-radius:4px; border:1px solid #334155; background:#0f172a; color:#fff;" required>
              <button type="submit" style="background:#00b900; color:#fff; border:none; padding:10px 20px; border-radius:4px; font-weight:bold; cursor:pointer;">บันทึกไอดี</button>
          </form>
          
          <h4 style="color:#ffd700; margin-top:20px;">📦 คลังไอดี Line Rangers ที่มีในระบบตอนนี้ (${gameAccounts ? gameAccounts.length : 0} ไอดี)</h4>
          <table border="1" style="width:100%; border-collapse:collapse; background:#0f172a; border-color:#334155; font-size:13px; text-align:center;">
             <tr style="background:#334155;"><th>ลำดับ</th><th>ข้อมูลไอดีเกม</th><th>สถานะ</th></tr>
             ${accountsListHtml}
          </table>
      </div>

      <!-- ส่วนจัดการคำขอรับไอดี/รางวัล -->
      <h3 style="color:#ffd700;">🎁 รายการคำขอรับไอดี Line Rangers จากผู้เล่น</h3>
      <table border="1" style="margin: 0 auto 30px auto; border-collapse: collapse; width: 800px; background:#1e2638; border-color:#444;">
        <tr style="background:#334155;"><th>ลำดับ</th><th>Username</th><th>Facebook ผู้เล่น</th><th>แต้มรางวัลสะสม</th><th>จัดการ</th></tr>
        ${withdrawHtml}
      </table>
      
      <a href="/admin/logout" style="color:#ff4757;">🔒 ออกจากระบบ</a>
    </body>
  `);
}

app.listen(PORT, () => {
  console.log("Line Rangers Lootbox Server is running on port " + PORT);
});