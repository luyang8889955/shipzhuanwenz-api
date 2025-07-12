// api/getOpenid.js
export default async function handler(req, res) {
  // 兼容POST和GET
  const code = req.body?.code || req.query?.code;
  
  // 从环境变量获取appid和secret（更安全）
  const appid = process.env.WX_APPID || '你的appid'; // 需要在Vercel环境变量中设置
  const secret = process.env.WX_SECRET || '你的secret'; // 需要在Vercel环境变量中设置

  if (!code) {
    res.status(400).json({ error: '缺少code参数' });
    return;
  }

  if (appid === '你的appid' || secret === '你的secret') {
    res.status(500).json({ error: '请先在Vercel环境变量中配置WX_APPID和WX_SECRET' });
    return;
  }

  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`;
  
  try {
    const result = await fetch(url);
    const data = await result.json();
    
    if (data.openid) {
      res.status(200).json({ openid: data.openid });
    } else {
      res.status(500).json({ 
        error: data.errmsg || '获取openid失败', 
        detail: data,
        hint: '请检查appid和secret是否正确'
      });
    }
  } catch (err) {
    res.status(500).json({ 
      error: '服务器请求失败', 
      detail: err.message 
    });
  }
} 