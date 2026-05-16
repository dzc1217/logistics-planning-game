// api/chat.js
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: '只支持 POST 请求' });
    }
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: '请输入问题' });

    const SYSTEM_PROMPT = `你是高中地理等高线教学助手，只回答相关地理问题。`;

    try {
        const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',   // 如果不行，尝试改为 'deepseek-v3'
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: message }
                ],
                temperature: 0.3,
                max_tokens: 500
            })
        });

        const data = await response.json();
        console.log('DeepSeek 完整返回:', JSON.stringify(data));

        // 处理 API 返回的错误（如余额不足、模型不存在）
        if (data.error) {
            const errMsg = data.error.message || JSON.stringify(data.error);
            return res.status(200).json({ reply: `API 错误：${errMsg}` });
        }

        if (data.choices && data.choices.length > 0) {
            return res.status(200).json({ reply: data.choices[0].message.content });
        } else {
            return res.status(200).json({ reply: '抱歉，AI 返回了空内容，请稍后再试。' });
        }
    } catch (error) {
        return res.status(500).json({ reply: '服务器内部错误，请稍后重试。' });
    }
}