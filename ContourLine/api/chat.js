// api/chat.js
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: '消息不能为空' });

    const SYSTEM_PROMPT = `你是高中地理等高线教学助手，只回答相关地理问题。`;

    try {
        const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}` // 从环境变量读取
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: message }
                ],
                temperature: 0.3,
                max_tokens: 500
            })
        });
        const data = await response.json();
        if (data.choices) {
            res.json({ reply: data.choices[0].message.content });
        } else {
            res.json({ reply: '暂时无法回答，请稍后再试。' });
        }
    } catch (error) {
        res.status(500).json({ reply: '网络错误，请重试。' });
    }
}