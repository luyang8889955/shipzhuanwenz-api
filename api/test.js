// api/test.js
export default function handler(req, res) {
  res.status(200).json({
    message: 'API部署成功！',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    wx_appid_configured: !!process.env.WX_APPID,
    wx_secret_configured: !!process.env.WX_SECRET
  });
} 