const express = require('express');
const sqlite3 = require('sqlite3').verbose();

// 带错误处理的数据库连接
const db = new sqlite3.Database('results.db', (err) => {
  if (err) {
    console.error('数据库连接失败:', err);
    return;
  }
  
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT CHECK(LENGTH(content) <= 2000) NOT NULL,
      create_time DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('表结构创建失败:', err);
        return;
      }
      db.run("PRAGMA foreign_keys = ON");
      db.run("PRAGMA journal_mode = WAL");
    });
  });
});

const app = express();
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    res.status(401).json({ error: '无效的访问令牌' });
  }
};

app.use(express.json());

// 新增保存结果接口
// 语音识别结果存储
app.post('/api/save-result', authMiddleware, (req, res) => {
  const { transcript } = req.body;
  
  if (!transcript) {
    return res.status(400).json({ error: '缺少必填参数' });
  }

  db.serialize(() => {
    db.run(`
      INSERT INTO results(content, create_time)
      VALUES(?, datetime('now','localtime'))
    `, [transcript.slice(0, 2000)], function(err) {
      if (err) {
        console.error('数据库写入失败:', err);
        return res.status(500).json({ 
          error: '数据存储失败',
          detail: err.message
        });
      }
      res.json({
        id: this.lastID,
        content_length: transcript.length,
        stored_length: transcript.slice(0, 2000).length
      });
    });
  });
});

// 用户登录认证
app.post('/api/login', async (req, res) => {
  const { code } = req.body;
  
  try {
    const response = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
      params: {
        appid: process.env.WX_APPID,
        secret: process.env.WX_SECRET,
        js_code: code,
        grant_type: 'authorization_code'
      }
    });
    
    res.json({ 
      openid: response.data.openid,
      session_key: response.data.session_key 
    });
  } catch (error) {
    console.error('微信登录失败:', error);
    res.status(500).json({ error: '微信接口调用失败' });
  }
});

// 视频转文字
app.post('/api/video-to-text', async (req, res) => {
  try {
    const { videoUrl } = req.body;
    // 这里需要实现免费语音识别
    res.json({ text: '示例识别文字' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 添加根路径路由
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'running',
    service: 'Speech Recognition API',
    version: '1.0.0'
  });
});

app.listen(3000, () => console.log('服务已启动'));