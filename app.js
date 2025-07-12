// app.js
App({
  onLaunch(options) {
    // 小程序初始化时执行
    console.log('小程序初始化', options);
    // 获取用户OpenID（不使用云开发）
    this.getOpenId();
  },
  
  onShow(options) {
    // 小程序启动或从后台进入前台时触发
    console.log('小程序显示', options);
  },
  
  onHide() {
    // 小程序从前台进入后台时触发
    console.log('小程序隐藏');
  },
  
  onError(msg) {
    // 小程序发生脚本错误或API调用失败时触发
    console.error('小程序错误:', msg);
  },
  
  globalData: {
    userInfo: null,
    openid: null
  },

  // 获取用户OpenID（通过后端API）
  getOpenId() {
    wx.login({
      success: res => {
        if (res.code) {
          // 这里填写你自己的后端API地址
          wx.request({
            url: 'https://your-free-backend-domain/api/getOpenid', // 替换为你的后端API地址
            method: 'POST',
            data: { code: res.code },
            success: (resp) => {
              if (resp.data && resp.data.openid) {
                this.globalData.openid = resp.data.openid;
                console.log('获取openid成功:', resp.data.openid);
              } else {
                console.error('获取openid失败: 响应无openid', resp.data);
              }
            },
            fail: (err) => {
              console.error('获取openid失败: 网络错误', err);
            }
          });
        } else {
          console.error('wx.login失败:', res);
        }
      },
      fail: err => {
        console.error('wx.login接口调用失败:', err);
      }
    });
  }
});