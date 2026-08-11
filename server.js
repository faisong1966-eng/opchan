require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Setup Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('CRITICAL ERROR: SUPABASE_URL or SUPABASE_KEY is missing in environment variables!');
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

// Setup Uploads Folder
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// HTML Frontend Template with Anti-Cheat (F12 / Right-click block)
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="th">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>เว็บไซต์ปลูกต้นไม้โลก</title>
        <script src="/socket.io/socket.io.js"></script>
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-emerald-950 text-white min-h-screen font-sans select-none" oncontextmenu="return false;">
        <!-- Marquee Broadcast Bar -->
        <div class="bg-emerald-800 text-yellow-300 py-2 px-4 overflow-hidden whitespace-nowrap shadow-md">
            <div id="marquee-text" class="inline-block animate-pulse font-semibold">ยินดีต้อนรับสู่เว็บไซต์ปลูกต้นไม้โลก ปลูกเลยวันนี้!</div>
        </div>

        <div id="app" class="container mx-auto p-4 max-w-5xl"></div>

        <script>
            // Anti-Cheat: Block F12, Ctrl+Shift+I, Ctrl+U, Right Click
            document.addEventListener('keydown', function(e) {
                if (e.key === 'F12' || 
                    (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) || 
                    (e.ctrlKey && e.key === 'U')) {
                    alert('ไม่อนุญาตให้ใช้เครื่องมือตรวจสอบระบบ!');
                    e.preventDefault();
                    return false;
                }
            });

            const socket = io();
            let currentUser = JSON.parse(localStorage.getItem('tree_user')) || null;

            socket.on('broadcast_update', (msg) => {
                document.getElementById('marquee-text').innerText = msg;
            });

            socket.on('user_data_updated', (updatedUser) => {
                if (currentUser && currentUser.id === updatedUser.id) {
                    currentUser = updatedUser;
                    localStorage.setItem('tree_user', JSON.stringify(currentUser));
                    renderApp();
                }
            });

            socket.on('admin_refresh', () => {
                if(currentUser && currentUser.is_admin) {
                    loadAdminData();
                }
            });

            async function renderApp() {
                if (currentUser) {
                    try {
                        const res = await fetch('/api/user/refresh?id=' + currentUser.id);
                        const data = await res.json();
                        if(data.success) {
                            currentUser = data.user;
                            localStorage.setItem('tree_user', JSON.stringify(currentUser));
                        }
                    } catch (e) {
                        console.error('Refresh error', e);
                    }
                }

                const app = document.getElementById('app');
                if (!currentUser) {
                    app.innerHTML = \`
                        <div class="bg-emerald-900 p-8 rounded-2xl shadow-2xl max-w-md mx-auto mt-10 border border-emerald-700">
                            <h2 class="text-3xl font-bold mb-6 text-center text-emerald-300">🌱 ปลูกต้นไม้โลก</h2>
                            <div id="auth-error" class="text-red-400 mb-4 text-center"></div>
                            <div class="space-y-4">
                                <div>
                                    <label class="block mb-1 text-sm">ชื่อผู้ใช้ (Username)</label>
                                    <input type="text" id="username" class="w-full p-3 rounded bg-emerald-950 border border-emerald-700 focus:outline-none focus:border-emerald-400">
                                </div>
                                <div>
                                    <label class="block mb-1 text-sm">รหัสผ่าน (Password)</label>
                                    <input type="password" id="password" class="w-full p-3 rounded bg-emerald-950 border border-emerald-700 focus:outline-none focus:border-emerald-400">
                                </div>
                                <div id="register-fields" class="hidden">
                                    <label class="block mb-1 text-sm">ลิงก์เฟซบุ๊กส่วนตัว (สำหรับรับรางวัล)</label>
                                    <input type="text" id="facebook_link" placeholder="https://facebook.com/yourprofile" class="w-full p-3 rounded bg-emerald-950 border border-emerald-700 focus:outline-none focus:border-emerald-400">
                                </div>
                                <div class="flex gap-2 pt-2">
                                    <button onclick="handleAuth()" id="auth-btn" class="flex-1 bg-emerald-600 hover:bg-emerald-500 py-3 rounded font-bold transition shadow">เข้าสู่ระบบ</button>
                                    <button onclick="toggleRegister()" id="toggle-reg-btn" class="flex-1 bg-emerald-800 hover:bg-emerald-700 py-3 rounded font-bold transition shadow">สมัครสมาชิก</button>
                                </div>
                            </div>
                        </div>
                    \`;
                } else if (currentUser.is_admin) {
                    renderAdminDashboard(app);
                } else {
                    renderUserDashboard(app);
                }
            }

            let isRegisterMode = false;
            function toggleRegister() {
                isRegisterMode = !isRegisterMode;
                document.getElementById('register-fields').classList.toggle('hidden', !isRegisterMode);
                document.getElementById('toggle-reg-btn').innerText = isRegisterMode ? 'กลับไปเข้าสู่ระบบ' : 'สมัครสมาชิก';
                document.getElementById('auth-btn').innerText = isRegisterMode ? 'ยืนยันสมัครสมาชิก' : 'เข้าสู่ระบบ';
            }

            async function handleAuth() {
                const username = document.getElementById('username').value.trim();
                const password = document.getElementById('password').value.trim();
                if(!username || !password) {
                    document.getElementById('auth-error').innerText = 'กรุณากรอกข้อมูลให้ครบถ้วน';
                    return;
                }

                try {
                    if(isRegisterMode) {
                        const facebook_link = document.getElementById('facebook_link').value;
                        const res = await fetch('/api/register', {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({username, password, facebook_link})
                        });
                        const data = await res.json();
                        if(data.success) {
                            alert('สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ');
                            toggleRegister();
                        } else {
                            document.getElementById('auth-error').innerText = data.message;
                        }
                    } else {
                        const res = await fetch('/api/login', {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({username, password})
                        });
                        const data = await res.json();
                        if(data.success) {
                            currentUser = data.user;
                            localStorage.setItem('tree_user', JSON.stringify(currentUser));
                            renderApp();
                        } else {
                            document.getElementById('auth-error').innerText = data.message;
                        }
                    }
                } catch(err) {
                    document.getElementById('auth-error').innerText = 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์';
                }
            }

            function logout() {
                currentUser = null;
                localStorage.removeItem('tree_user');
                renderApp();
            }

            async function renderUserDashboard(app) {
                let rewards = [];
                try {
                    const resRewards = await fetch('/api/rewards');
                    rewards = await resRewards.json();
                } catch(e) {}

                let banNotice = '';
                if(currentUser.ban_until && new Date() < new Date(currentUser.ban_until)) {
                    banNotice = \`
                        <div class="bg-red-900/80 border border-red-500 p-4 rounded-xl mb-6 text-center animate-pulse">
                            <h3 class="text-xl font-bold text-red-200">🚨 \${currentUser.ban_reason || 'ท่านโดนแบน'}</h3>
                            <p class="text-sm text-red-300 mt-1">กรุณาเติมเงินขั้นต่ำ 50 บาท เพื่อปลดแบนและกลับมาร่วมกิจกรรม</p>
                        </div>
                    \`;
                }

                app.innerHTML = \`
                    \${banNotice}
                    <div class="flex justify-between items-center mb-6 bg-emerald-900 p-4 rounded-xl border border-emerald-700 shadow-lg">
                        <div>
                            <h1 class="text-xl font-bold text-emerald-300">ผู้ใช้งาน: \${currentUser.username}</h1>
                            <p class="text-sm text-emerald-400">แต้มสะสม: <span class="font-bold text-yellow-300">\${currentUser.points}</span> แต้ม | ปุ๋ยที่มี: <span class="font-bold text-yellow-300">\${currentUser.fertilizer}</span> ชิ้น</p>
                        </div>
                        <button onclick="logout()" class="bg-red-600 hover:bg-red-500 px-4 py-2 rounded text-sm font-bold shadow">ออกจากระบบ</button>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div class="bg-emerald-900 p-6 rounded-xl border border-emerald-700 text-center flex flex-col justify-between shadow-xl">
                            <div>
                                <h2 class="text-2xl font-bold mb-4 text-emerald-300">🌳 ต้นไม้โลกของคุณ</h2>
                                <div class="my-6">
                                    <div class="text-7xl mb-2 animate-bounce">🌱</div>
                                    <p class="text-sm text-emerald-300 mb-2">ความเจริญเติบโต: <span class="font-bold">\${Number(currentUser.tree_progress || 0).toFixed(2)}</span>% / 1000%</p>
                                    <div class="w-full bg-emerald-950 rounded-full h-4 border border-emerald-700 overflow-hidden">
                                        <div class="bg-yellow-400 h-full transition-all duration-300" style="width: \${Math.min((currentUser.tree_progress || 0) / 10, 100)}%"></div>
                                    </div>
                                </div>
                            </div>
                            <div class="space-y-3">
                                <button onclick="plantTree()" class="w-full bg-emerald-600 hover:bg-emerald-500 py-3 rounded font-bold shadow transition">ปลูก / เร่งโตด้วยปุ๋ย (ใช้ 1 ปุ๋ย)</button>
                                \${(currentUser.tree_progress || 0) >= 1000 && !currentUser.reward_claimed ? \`
                                    <button onclick="claimReward()" class="w-full bg-yellow-500 hover:bg-yellow-400 text-emerald-950 py-3 rounded font-bold shadow animate-bounce">กดขอรับรางวัล</button>
                                \` : ''}
                                \${currentUser.claim_status === 'pending' ? \`
                                    <div class="bg-yellow-900/50 border border-yellow-600 p-3 rounded text-sm text-yellow-200">
                                        ⏳ รอแอดมินตรวจสอบและส่งมอบรางวัลทาง Facebook ภายใน 24 ชม. กรุณาเปิดแชทไว้!
                                    </div>
                                \` : ''}
                                \${currentUser.claim_status === 'approved' ? \`
                                    <div class="bg-green-900/50 border border-green-600 p-3 rounded text-sm text-green-200">
                                        🎁 แอดมินได้ส่งของรางวัลให้ท่านเรียบร้อยแล้ว!
                                    </div>
                                \` : ''}
                            </div>
                        </div>

                        <!-- Topup Section -->
                        <div class="space-y-6">
                            <div class="bg-emerald-900 p-6 rounded-xl border border-emerald-700 shadow-xl">
                                <h2 class="text-xl font-bold mb-4 text-emerald-300">💳 ระบบเติมเงิน</h2>
                                <div class="bg-emerald-950 p-4 rounded mb-4 text-sm border border-emerald-800 space-y-2 text-center">
                                    <p><b>TrueMoney Wallet:</b> <span class="text-yellow-300 font-bold">0643399170</span> (ธีรวัฒน์ คำมุงคุณ)</p>
                                    <div class="flex justify-center my-2">
                                        <img src="/qrcode.jpg" alt="QR Code" class="w-36 h-36 object-contain rounded border border-emerald-600 bg-white p-1">
                                    </div>
                                    <p class="text-xs text-yellow-300">*เติมเงินขั้นต่ำ 50 บาทเพื่อปลดแบนอัตโนมัติ</p>
                                </div>
                                <form id="topup-form" onsubmit="submitSlip(event)" class="space-y-3">
                                    <select id="topup-channel" class="w-full p-2.5 rounded bg-emerald-950 border border-emerald-700">
                                        <option value="TrueMoney Wallet">TrueMoney Wallet (0643399170)</option>
                                        <option value="PromptPay QR">PromptPay QR Code (ธีรวัฒน์)</option>
                                    </select>
                                    <input type="number" id="topup-amount" placeholder="ระบุจำนวนเงิน" required class="w-full p-2.5 rounded bg-emerald-950 border border-emerald-700">
                                    <div>
                                        <label class="block text-xs text-emerald-300 mb-1">อัปโหลดสลิปหลักฐานการโอน:</label>
                                        <input type="file" id="topup-file" accept="image/*" required class="w-full p-2 rounded bg-emerald-950 border border-emerald-700 text-sm">
                                    </div>
                                    <button type="submit" id="slip-btn" class="w-full bg-blue-600 hover:bg-blue-500 py-2.5 rounded font-bold transition shadow">ส่งสลิปเติมเงิน</button>
                                </form>
                            </div>

                            <div class="bg-emerald-900 p-6 rounded-xl border border-emerald-700 shadow-xl">
                                <h2 class="text-xl font-bold mb-4 text-emerald-300">🛒 ร้านค้า (ซื้อปุ๋ย)</h2>
                                <button onclick="buyFertilizer()" class="w-full bg-purple-600 hover:bg-purple-500 py-3 rounded font-bold shadow transition">ซื้อปุ๋ย (1 แต้ม = 1 ปุ๋ย / เร่ง 1%)</button>
                            </div>
                        </div>
                    </div>

                    <!-- Rewards Showcase -->
                    <div class="bg-emerald-900 p-6 rounded-xl border border-emerald-700 shadow-xl">
                        <h2 class="text-xl font-bold mb-4 text-emerald-300">🏆 ของรางวัลต้นไม้โลกทั้งหมด</h2>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                            \` + (!Array.isArray(rewards) || rewards.length === 0 ? '<p class="text-sm text-emerald-400 col-span-full">ยังไม่มีของรางวัลในระบบ</p>' : rewards.map(r => \`
                                <div class="bg-emerald-950 p-4 rounded-xl border border-emerald-800 text-center flex flex-col items-center">
                                    <img src="\${r.image_url}" class="w-24 h-24 object-cover rounded-lg mb-2 border border-emerald-700">
                                    <h3 class="font-bold text-sm">\${r.name}</h3>
                                    <span class="text-xs bg-yellow-600/50 text-yellow-300 px-2 py-0.5 rounded mt-1">ระดับ \${r.rarity}</span>
                                    <p class="text-xs text-emerald-400 mt-2">คงเหลือ: \${r.stock} ชิ้น</p>
                                </div>
                            \`).join('')) + \`
                        </div>
                    </div>
                \`;
            }

            async function plantTree() {
                const res = await fetch('/api/plant', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({userId: currentUser.id})
                });
                const data = await res.json();
                if(data.success) {
                    currentUser = data.user;
                    localStorage.setItem('tree_user', JSON.stringify(currentUser));
                    renderApp();
                } else {
                    alert(data.message);
                }
            }

            async function buyFertilizer() {
                const res = await fetch('/api/buy-fertilizer', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({userId: currentUser.id})
                });
                const data = await res.json();
                if(data.success) {
                    currentUser = data.user;
                    localStorage.setItem('tree_user', JSON.stringify(currentUser));
                    renderApp();
                } else {
                    alert(data.message);
                }
            }

            async function submitSlip(e) {
                e.preventDefault();
                const amount = document.getElementById('topup-amount').value;
                const channel = document.getElementById('topup-channel').value;
                const fileInput = document.getElementById('topup-file');
                const btn = document.getElementById('slip-btn');

                if(fileInput.files.length === 0) return alert('กรุณาอัปโหลดรูปสลิป');

                const formData = new FormData();
                formData.append('userId', currentUser.id);
                formData.append('amount', amount);
                formData.append('channel', channel);
                formData.append('slip', fileInput.files[0]);

                btn.disabled = true;
                btn.innerText = 'กำลังส่งสลิป... กรุณารอสักครู่';

                const res = await fetch('/api/topup', {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                alert(data.message);
                btn.disabled = false;
                btn.innerText = 'ส่งสลิปเติมเงิน';
                if(data.success) {
                    document.getElementById('topup-form').reset();
                }
            }

            async function claimReward() {
                const res = await fetch('/api/claim', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({userId: currentUser.id})
                });
                const data = await res.json();
                if(data.success) {
                    currentUser = data.user;
                    localStorage.setItem('tree_user', JSON.stringify(currentUser));
                    renderApp();
                } else {
                    alert(data.message);
                }
            }

            // Admin Dashboard
            function renderAdminDashboard(app) {
                app.innerHTML = \`
                    <div class="flex justify-between items-center mb-6 bg-emerald-900 p-4 rounded-xl border border-emerald-700">
                        <h1 class="text-xl font-bold text-yellow-300">🛡️ แผงควบคุมแอดมิน (ปลูกต้นไม้โลก - ธีรวัฒน์)</h1>
                        <button onclick="logout()" class="bg-red-600 hover:bg-red-500 px-4 py-2 rounded text-sm font-bold shadow">ออกจากระบบ</button>
                    </div>

                    <div class="space-y-6">
                        <div class="bg-emerald-900 p-6 rounded-xl border border-emerald-700">
                            <h2 class="text-xl font-bold mb-4 text-emerald-300">📋 รายการสลิปเติมเงินรออนุมัติ</h2>
                            <div id="admin-slips" class="space-y-3">กำลังโหลด...</div>
                        </div>

                        <div class="bg-emerald-900 p-6 rounded-xl border border-emerald-700">
                            <h2 class="text-xl font-bold mb-4 text-emerald-300">🎁 คำขอรับรางวัลของผู้เล่น</h2>
                            <div id="admin-claims" class="space-y-3">กำลังโหลด...</div>
                        </div>

                        <!-- User Management Table -->
                        <div class="bg-emerald-900 p-6 rounded-xl border border-emerald-700">
                            <h2 class="text-xl font-bold mb-4 text-emerald-300">👥 รายชื่อผู้ใช้ทั้งหมดในระบบ (<span id="user-count">0</span> คน)</h2>
                            <div id="admin-users" class="space-y-3 overflow-x-auto">กำลังโหลด...</div>
                        </div>

                        <div class="bg-emerald-900 p-6 rounded-xl border border-emerald-700">
                            <h2 class="text-xl font-bold mb-4 text-emerald-300">🏆 เพิ่มของรางวัล (อัปโหลดรูป)</h2>
                            <form id="reward-form" onsubmit="adminAddReward(event)" class="space-y-3">
                                <input type="text" id="rew-name" placeholder="ชื่อรางวัล" required class="w-full p-2 rounded bg-emerald-950 border border-emerald-700 text-sm">
                                <select id="rew-rarity" class="w-full p-2 rounded bg-emerald-950 border border-emerald-700 text-sm">
                                    <option value="A">ระดับ A</option>
                                    <option value="B">ระดับ B</option>
                                    <option value="S">ระดับ S</option>
                                    <option value="SSR">ระดับ SSR</option>
                                    <option value="SSS+">ระดับ SSS+</option>
                                </select>
                                <div>
                                    <label class="block text-xs text-emerald-300 mb-1">รูปภาพของรางวัล:</label>
                                    <input type="file" id="rew-file" accept="image/*" required class="w-full p-1.5 rounded bg-emerald-950 border border-emerald-700 text-xs">
                                </div>
                                <input type="number" id="rew-stock" placeholder="จำนวน (Stock)" required class="w-full p-2 rounded bg-emerald-950 border border-emerald-700 text-sm">
                                <button type="submit" class="w-full bg-blue-600 hover:bg-blue-500 py-2 rounded font-bold shadow text-sm">บันทึกรางวัล</button>
                            </form>
                        </div>
                    </div>
                \`;
                loadAdminData();
            }

            async function loadAdminData() {
                try {
                    const res = await fetch('/api/admin/data');
                    const data = await res.json();
                    
                    // Slips
                    const slipsDiv = document.getElementById('admin-slips');
                    if (!data.slips || data.slips.length === 0) {
                        slipsDiv.innerHTML = '<p class="text-sm text-emerald-400">ไม่มีสลิปรอตรวจสอบ</p>';
                    } else {
                        slipsDiv.innerHTML = data.slips.map(s => \`
                            <div class="bg-emerald-950 p-4 rounded-xl flex flex-col md:flex-row justify-between items-center border border-emerald-800 gap-4">
                                <div>
                                    <p class="font-bold text-emerald-350">\${s.username} - เติมเงิน: \${s.amount} บาท</p>
                                    <p class="text-xs text-yellow-300">ช่องทาง: \${s.channel}</p>
                                    <a href="\${s.slip_image}" target="_blank" class="text-blue-400 underline text-xs mt-1 inline-block">🔍 ดูรูปสลิปเต็ม</a>
                                </div>
                                <div class="flex gap-2">
                                    <button onclick="handleSlip(\${s.id}, 'approve')" class="bg-green-600 hover:bg-green-500 px-3 py-1.5 rounded text-xs font-bold shadow">อนุมัติ</button>
                                    <button onclick="handleSlip(\${s.id}, 'warn')" class="bg-yellow-600 hover:bg-yellow-500 px-3 py-1.5 rounded text-xs font-bold shadow">เตือน (ลบสลิป)</button>
                                    <button onclick="handleSlip(\${s.id}, 'ban')" class="bg-red-600 hover:bg-red-500 px-3 py-1.5 rounded text-xs font-bold shadow">แบนผู้ใช้</button>
                                </div>
                            </div>
                        \`).join('');
                    }

                    // Claims
                    const claimsDiv = document.getElementById('admin-claims');
                    const pendingClaims = (data.users || []).filter(u => u.claim_status === 'pending');
                    if (pendingClaims.length === 0) {
                        claimsDiv.innerHTML = '<p class="text-sm text-emerald-400">ไม่มีคำขอรับรางวัล</p>';
                    } else {
                        claimsDiv.innerHTML = pendingClaims.map(u => \`
                            <div class="bg-emerald-950 p-4 rounded-xl flex justify-between items-center border border-emerald-800">
                                <div>
                                    <p class="font-bold text-emerald-300">\${u.username}</p>
                                    <a href="\${u.facebook_link}" target="_blank" class="text-blue-400 underline text-xs">ดูโปรไฟล์ Facebook ส่วนตัว</a>
                                </div>
                                <button onclick="approveClaim(\${u.id})" class="bg-green-600 hover:bg-green-500 px-4 py-2 rounded text-xs font-bold shadow">อนุมัติส่งของรางวัล</button>
                            </div>
                        \`).join('');
                    }

                    // Users Management Table
                    document.getElementById('user-count').innerText = (data.users || []).length;
                    const usersDiv = document.getElementById('admin-users');
                    usersDiv.innerHTML = (data.users || []).map(u => \`
                        <div class="bg-emerald-950 p-3 rounded-xl flex flex-col md:flex-row justify-between items-center border border-emerald-800 gap-3 text-sm">
                            <div>
                                <span class="font-bold text-emerald-300">\${u.username}</span> 
                                <span class="text-yellow-300 text-xs ml-2">(\${u.points} แต้ม / ปุ๋ย \${u.fertilizer})</span>
                                \${u.ban_until && new Date() < new Date(u.ban_until) ? '<span class="bg-red-600 text-white px-2 py-0.5 rounded text-xs ml-2">ติดแบน</span>' : ''}
                            </div>
                            <div class="flex flex-wrap gap-2 items-center">
                                <a href="\${u.facebook_link}" target="_blank" class="bg-blue-600 hover:bg-blue-500 px-2.5 py-1 rounded text-xs font-bold">ดูโปรไฟล์ FB</a>
                                <button onclick="adjustPoints(\${u.id}, 10)" class="bg-green-700 hover:bg-green-600 px-2 py-1 rounded text-xs font-bold">+10 แต้ม</button>
                                <button onclick="adjustPoints(\${u.id}, -10)" class="bg-orange-700 hover:bg-orange-600 px-2 py-1 rounded text-xs font-bold">-10 แต้ม</button>
                                <button onclick="userAction(\${u.id}, 'ban')" class="bg-red-600 hover:bg-red-500 px-2.5 py-1 rounded text-xs font-bold">แบน</button>
                                <button onclick="userAction(\${u.id}, 'unban')" class="bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1 rounded text-xs font-bold">ปลดแบน</button>
                            </div>
                        </div>
                    \`).join('');
                } catch(e) {}
            }

            async function handleSlip(slipId, action) {
                const res = await fetch('/api/admin/slip', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({slipId, action})
                });
                const data = await res.json();
                alert(data.message);
                loadAdminData();
            }

            async function approveClaim(userId) {
                const res = await fetch('/api/admin/claim', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({userId})
                });
                const data = await res.json();
                alert(data.message);
                loadAdminData();
            }

            async function adjustPoints(userId, amount) {
                const res = await fetch('/api/admin/adjust-points', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({userId, amount})
                });
                const data = await res.json();
                if(data.success) loadAdminData();
                else alert(data.message);
            }

            async function userAction(userId, action) {
                const res = await fetch('/api/admin/user-action', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({userId, action})
                });
                const data = await res.json();
                alert(data.message);
                loadAdminData();
            }

            async function adminAddReward(e) {
                e.preventDefault();
                const name = document.getElementById('rew-name').value;
                const rarity = document.getElementById('rew-rarity').value;
                const stock = document.getElementById('rew-stock').value;
                const fileInput = document.getElementById('rew-file');

                const formData = new FormData();
                formData.append('name', name);
                formData.append('rarity', rarity);
                formData.append('stock', stock);
                formData.append('reward_img', fileInput.files[0]);

                const res = await fetch('/api/admin/reward', {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                alert(data.message);
                if(data.success) {
                    document.getElementById('reward-form').reset();
                    loadAdminData();
                }
            }

            renderApp();
        </script>
    </body>
    </html>
    `);
});

// APIs
app.get('/api/user/refresh', async (req, res) => {
    try {
        const { data: user, error } = await supabase.from('users').select('*').eq('id', req.query.id).maybeSingle();
        if (error || !user) return res.json({success: false});
        res.json({success: true, user});
    } catch (err) {
        res.json({success: false});
    }
});

app.get('/api/rewards', async (req, res) => {
    try {
        const { data: rows } = await supabase.from('rewards').select('*');
        res.json(rows || []);
    } catch (err) {
        res.json([]);
    }
});

app.post('/api/register', async (req, res) => {
    try {
        const { username, password, facebook_link } = req.body;
        
        const { data: existingUser } = await supabase.from('users').select('*').eq('username', username).maybeSingle();
        if (existingUser) {
            return res.json({ success: false, message: 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว' });
        }

        const { error } = await supabase.from('users').insert([{ username, password, facebook_link, points: 0, fertilizer: 0, tree_progress: 0 }]);
        if (error) {
            return res.json({ success: false, message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + error.message });
        }
        res.json({ success: true });
    } catch (err) {
        res.json({ success: false, message: 'เกิดข้อผิดพลาดทางเซิร์ฟเวอร์' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const { data: user, error } = await supabase.from('users').select('*').eq('username', username).eq('password', password).maybeSingle();
        
        if (error || !user) {
            return res.json({ success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
        }
        res.json({ success: true, user });
    } catch (err) {
        res.json({ success: false, message: 'เกิดข้อผิดพลาดทางเซิร์ฟเวอร์' });
    }
});

app.post('/api/plant', async (req, res) => {
    try {
        const { userId } = req.body;
        const { data: user } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
        if (!user) return res.json({ success: false, message: 'ไม่พบผู้ใช้' });

        if (user.ban_until && new Date() < new Date(user.ban_until)) {
            return res.json({ success: false, message: 'บัญชีถูกแบน! กรุณาเติมเงินขั้นต่ำ 50 บาทเพื่อปลดแบน' });
        }
        if (user.fertilizer <= 0) return res.json({ success: false, message: 'ปุ๋ยของคุณหมด! กรุณาซื้อปุ๋ยเพิ่ม' });
        
        const newProgress = Math.min(Number(user.tree_progress || 0) + 10, 1000);
        const newFerti = user.fertilizer - 1;
        
        await supabase.from('users').update({ tree_progress: newProgress, fertilizer: newFerti }).eq('id', userId);
        
        const { data: updatedUser } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
        io.emit('user_data_updated', updatedUser);
        res.json({ success: true, user: updatedUser });
    } catch (err) {
        res.json({ success: false, message: 'เกิดข้อผิดพลาด' });
    }
});

app.post('/api/buy-fertilizer', async (req, res) => {
    try {
        const { userId } = req.body;
        const { data: user } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
        if (!user) return res.json({ success: false, message: 'ไม่พบผู้ใช้' });

        if (user.ban_until && new Date() < new Date(user.ban_until)) {
            return res.json({ success: false, message: 'บัญชีถูกแบน! กรุณาเติมเงินขั้นต่ำ 50 บาทเพื่อปลดแบน' });
        }
        if (user.points < 1) return res.json({ success: false, message: 'แต้มของคุณไม่พอ (1 แต้ม = 1 ปุ๋ย)' });
        
        const newPoints = user.points - 1;
        const newFerti = user.fertilizer + 1;

        await supabase.from('users').update({ points: newPoints, fertilizer: newFerti }).eq('id', userId);
        
        const { data: updatedUser } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
        io.emit('user_data_updated', updatedUser);
        res.json({ success: true, user: updatedUser });
    } catch (err) {
        res.json({ success: false, message: 'เกิดข้อผิดพลาด' });
    }
});

app.post('/api/topup', upload.single('slip'), async (req, res) => {
    try {
        const { userId, amount, channel } = req.body;
        if (!req.file) return res.json({ success: false, message: 'ไม่พบไฟล์สลิป' });
        const slip_image = '/uploads/' + req.file.filename;
        
        const { data: user } = await supabase.from('users').select('username').eq('id', userId).maybeSingle();
        if (!user) return res.json({ success: false, message: 'ไม่พบผู้ใช้' });

        await supabase.from('topup_slips').insert([{ user_id: userId, username: user.username, amount: Number(amount), channel, slip_image, status: 'pending' }]);
        
        io.emit('admin_refresh');
        res.json({ success: true, message: 'ส่งสลิปสำเร็จ! กรุณารอแอดมินตรวจสอบ' });
    } catch (err) {
        res.json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปโหลดสลิป' });
    }
});

app.post('/api/claim', async (req, res) => {
    try {
        const { userId } = req.body;
        await supabase.from('users').update({ claim_status: 'pending' }).eq('id', userId);
        
        const { data: updatedUser } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
        io.emit('user_data_updated', updatedUser);
        io.emit('admin_refresh');
        res.json({ success: true, user: updatedUser });
    } catch (err) {
        res.json({ success: false, message: 'เกิดข้อผิดพลาด' });
    }
});

app.get('/api/admin/data', async (req, res) => {
    try {
        const { data: slips } = await supabase.from('topup_slips').select('*').eq('status', 'pending');
        const { data: users } = await supabase.from('users').select('*');
        res.json({ slips: slips || [], users: users || [] });
    } catch (err) {
        res.json({ slips: [], users: [] });
    }
});

app.post('/api/admin/slip', async (req, res) => {
    try {
        const { slipId, action } = req.body;
        const { data: slip } = await supabase.from('topup_slips').select('*').eq('id', slipId).maybeSingle();
        if (!slip) return res.json({ success: false, message: 'ไม่พบสลิปนี้' });

        if (action === 'approve') {
            await supabase.from('topup_slips').update({ status: 'approved' }).eq('id', slipId);
            const { data: user } = await supabase.from('users').select('*').eq('id', slip.user_id).maybeSingle();
            if (user) {
                const newPoints = user.points + Number(slip.amount);
                let updateData = { points: newPoints };
                if (Number(slip.amount) >= 50) {
                    updateData.ban_until = null;
                    updateData.ban_count = 0;
                    updateData.ban_reason = null;
                }
                await supabase.from('users').update(updateData).eq('id', slip.user_id);
                const { data: updatedUser } = await supabase.from('users').select('*').eq('id', slip.user_id).maybeSingle();
                io.emit('user_data_updated', updatedUser);
                io.emit('admin_refresh');
                return res.json({ success: true, message: 'อนุมัติสลิปและเพิ่มแต้มเรียบร้อย' });
            }
        } else if (action === 'warn') {
            await supabase.from('topup_slips').delete().eq('id', slipId);
            return res.json({ success: true, message: 'ลบสลิปและเตือนผู้ใช้แล้ว' });
        } else if (action === 'ban') {
            await supabase.from('topup_slips').update({ status: 'rejected' }).eq('id', slipId);
            const { data: user } = await supabase.from('users').select('*').eq('id', slip.user_id).maybeSingle();
            if (user) {
                const newBanCount = (user.ban_count || 0) + 1;
                let updateData = { ban_count: newBanCount, ban_reason: `ท่านโดนแบนโดยการส่งสลิปปลอมติดต่อกันหลายครั้ง (ครั้งที่ ${newBanCount})` };
                if (newBanCount >= 3) {
                    updateData.ban_until = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
                }
                await supabase.from('users').update(updateData).eq('id', slip.user_id);
                const { data: updatedUser } = await supabase.from('users').select('*').eq('id', slip.user_id).maybeSingle();
                io.emit('user_data_updated', updatedUser);
                io.emit('admin_refresh');
                return res.json({ success: true, message: `ดำเนินการแบนสะสมครั้งที่ ${newBanCount} สำเร็จ` });
            }
        }
    } catch (err) {
        res.json({ success: false, message: 'เกิดข้อผิดพลาด' });
    }
});

app.post('/api/admin/claim', async (req, res) => {
    try {
        const { userId } = req.body;
        await supabase.from('users').update({ claim_status: 'approved' }).eq('id', userId);
        const { data: updatedUser } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
        if (updatedUser) {
            io.emit('user_data_updated', updatedUser);
            io.emit('admin_refresh');
            io.emit('broadcast_update', `🎉 สิ้นสุดรอบต้นไม้โลก! ผู้เล่น ${updatedUser.username} พิชิตการปลูกต้นไม้และได้รับรางวัลใหญ่เรียบร้อยแล้ว!`);
            res.json({ success: true, message: 'อนุมัติคำขอส่งของรางวัลสำเร็จ' });
        }
    } catch (err) {
        res.json({ success: false, message: 'เกิดข้อผิดพลาด' });
    }
});

app.post('/api/admin/adjust-points', async (req, res) => {
    try {
        const { userId, amount } = req.body;
        const { data: user } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
        if (!user) return res.json({ success: false, message: 'ไม่พบผู้ใช้นี้' });
        
        const newPoints = Math.max(0, user.points + Number(amount));
        await supabase.from('users').update({ points: newPoints }).eq('id', userId);
        
        const { data: updatedUser } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
        io.emit('user_data_updated', updatedUser);
        io.emit('admin_refresh');
        res.json({ success: true });
    } catch (err) {
        res.json({ success: false, message: 'เกิดข้อผิดพลาด' });
    }
});

app.post('/api/admin/user-action', async (req, res) => {
    try {
        const { userId, action } = req.body;
        if (action === 'ban') {
            const banTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
            const reason = 'ท่านโดนแบนโดยผู้ดูแลระบบ';
            await supabase.from('users').update({ ban_until: banTime, ban_reason: reason }).eq('id', userId);
            const { data: updatedUser } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
            io.emit('user_data_updated', updatedUser);
            io.emit('admin_refresh');
            res.json({ success: true, message: 'แบนผู้ใช้สำเร็จ' });
        } else if (action === 'unban') {
            await supabase.from('users').update({ ban_until: null, ban_count: 0, ban_reason: null }).eq('id', userId);
            const { data: updatedUser } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
            io.emit('user_data_updated', updatedUser);
            io.emit('admin_refresh');
            res.json({ success: true, message: 'ปลดแบนผู้ใช้สำเร็จ' });
        }
    } catch (err) {
        res.json({ success: false, message: 'เกิดข้อผิดพลาด' });
    }
});

app.post('/api/admin/reward', upload.single('reward_img'), async (req, res) => {
    try {
        const { name, rarity, stock } = req.body;
        if (!req.file) return res.json({ success: false, message: 'ไม่พบรูปภาพรางวัล' });
        const image_url = '/uploads/' + req.file.filename;
        await supabase.from('rewards').insert([{ name, rarity, image_url, stock: Number(stock) }]);
        res.json({ success: true, message: 'เพิ่มของรางวัลสำเร็จ' });
    } catch (err) {
        res.json({ success: false, message: 'เกิดข้อผิดพลาดในการเพิ่มรางวัล' });
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('Tree Garden Server running on Supabase port ' + PORT);
});