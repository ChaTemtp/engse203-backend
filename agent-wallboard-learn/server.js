// server.js
const express = require('express');

const app = express();
const PORT = 3001;
const cors = require('cors');

// Step 1: เพิ่ม middleware สำหรับ JSON
app.use(express.json());
app.use(cors());
// ข้อมูล Agents
const agents = [
    { code: "A001", name: "Kaito Kid", status: "Available", loginTime: new Date() },
    { code: "A002", name: "Conan", status: "Wrap-up", loginTime: new Date() },
    { code: "A003", name: "Idk", status: "Active", loginTime: new Date() },
    { code: "A004", name: "Ran", status: "Not Ready", loginTime: new Date() },
];

// --- Route เปลี่ยน status ---
app.patch('/api/agents/:code/status', (req, res) => {
    const agentCode = req.params.code;
    const newStatus = req.body.status;

    const agent = agents.find(a => a.code === agentCode);
    if (!agent) return res.status(404).json({ success: false, error: "Agent not found" });

    const validStatuses = ["Available", "Active", "Wrap-up", "Not Ready", "Offline"];
    if (!validStatuses.includes(newStatus)) {
        return res.status(400).json({ success: false, error: "Invalid status", validStatuses });
    }

    const oldStatus = agent.status;
    agent.status = newStatus;
    agent.lastStatusChange = new Date();

    console.log(`[${new Date().toISOString()}] Agent ${agentCode}: ${oldStatus} → ${newStatus}`);

    res.json({
        success: true,
        message: `Agent ${agentCode} status changed from ${oldStatus} to ${newStatus}`,
        data: agent
    });
});

// --- Agent Login ---
app.post('/api/agents/:code/login', (req, res) => {
    const agentCode = req.params.code;
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ success: false, error: "Agent name is required" });
    }

    const agent = agents.find(a => a.code === agentCode);
    if (!agent) return res.status(404).json({ success: false, error: "Agent not found" });

    agent.name = name;
    agent.status = "Available";
    agent.loginTime = new Date();
    agent.lastStatusChange = new Date();

    console.log(`[${new Date().toISOString()}] Agent ${agentCode} logged in`);

    res.json({
        success: true,
        message: `Agent ${agentCode} logged in successfully`,
        data: agent
    });
});

// --- Agent Logout ---
app.post('/api/agents/:code/logout', (req, res) => {
    const agentCode = req.params.code;
    const agent = agents.find(a => a.code === agentCode);

    if (!agent) return res.status(404).json({ success: false, error: "Agent not found" });

    agent.status = "Offline";       // เปลี่ยน status เป็น Offline
    delete agent.loginTime;          // ลบ loginTime
    agent.lastStatusChange = new Date();

    console.log(`[${new Date().toISOString()}] Agent ${agentCode} logged out`);

    res.json({
        success: true,
        message: `Agent ${agentCode} logged out successfully`,
        data: agent
    });
});


// --- Route ดึงข้อมูล Agents ---
app.get('/api/agents', (req, res) => {
    res.json({ success: true, data: agents, count: agents.length, timestamp: new Date().toISOString() });
});

// --- Route Dashboard Stats ---
app.get('/api/dashboard/stats', (req, res) => {
    // ขั้นที่ 1: นับจำนวนรวม
    const totalAgents = agents.length;

    // ขั้นที่ 2: นับ Available agents
    const available = agents.filter(a => a.status === "Available").length;
    const active = agents.filter(a => a.status === "Active").length;
    const wrapUp = agents.filter(a => a.status === "Wrap-up").length;
    const notReady = agents.filter(a => a.status === "Not Ready").length;
    const offline = agents.filter(a => a.status === "Offline").length;

    // ขั้นที่ 3: คำนวณเปอร์เซ็นต์
    const percent = count => totalAgents > 0 ? Math.round((count / totalAgents) * 100) : 0;

    res.json({
        success: true,
        data: {
            total: totalAgents,
            statusBreakdown: {
                available: { count: available, percent: percent(available) },
                active: { count: active, percent: percent(active) },
                wrapUp: { count: wrapUp, percent: percent(wrapUp) },
                notReady: { count: notReady, percent: percent(notReady) },
                offline: { count: offline, percent: percent(offline) },
            },
            timestamp: new Date().toISOString()
        }
    });
});

// --- Route หน้าแรก ---
app.get('/', (req, res) => res.send('Hello Agent Wallboard!'));

// --- Route hello ---
app.get('/hello', (req, res) => res.send('Hello สวัสดี!'));

// --- Route health check ---
app.get('/health', (req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));

// --- Start Server ---
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
