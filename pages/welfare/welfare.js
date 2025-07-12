// pages/welfare/welfare.js
Page({
  data: {
    totalCount: 3,      // 今日剩余总次数
    totalEarned: 0,     // 累计获得次数
    hasSignedIn: false, // 是否已签到
    adLoaded: false,    // 广告是否加载完成
  },

  onLoad() {
    // 初始化广告
    this.initAd();
    // 获取用户数据
    this.getUserData();
  },

  onShow() {
    // 刷新用户数据
    this.getUserData();
  },

  // 初始化广告
  initAd() {
    // 创建激励视频广告实例
    this.videoAd = wx.createRewardedVideoAd({
      adUnitId: 'your-ad-unit-id' // 替换为你的广告单元ID
    });

    // 监听广告加载事件
    this.videoAd.onLoad(() => {
      this.setData({ adLoaded: true });
      console.log('激励视频广告加载成功');
    });

    // 监听广告错误事件
    this.videoAd.onError(err => {
      this.setData({ adLoaded: false });
      console.log('激励视频广告加载失败', err);
    });

    // 监听广告关闭事件
    this.videoAd.onClose(res => {
      if (res && res.isEnded) {
        // 正常播放结束，可以下发奖励
        this.addFreeCount(3, '观看广告');
        wx.showToast({
          title: '获得3次免费机会！',
          icon: 'success'
        });
      } else {
        wx.showToast({
          title: '需要完整观看广告才能获得奖励',
          icon: 'none'
        });
      }
    });
  },

  // 获取用户数据
  getUserData() {
    // 从本地存储获取数据
    const totalCount = wx.getStorageSync('totalCount') || 3;
    const totalEarned = wx.getStorageSync('totalEarned') || 0;
    const hasSignedIn = wx.getStorageSync('hasSignedIn') || false;
    const lastSignInDate = wx.getStorageSync('lastSignInDate');

    // 检查是否需要重置签到状态
    const today = new Date().toDateString();
    if (lastSignInDate !== today) {
      wx.setStorageSync('hasSignedIn', false);
      this.setData({ hasSignedIn: false });
    }

    this.setData({
      totalCount,
      totalEarned,
      hasSignedIn
    });
  },

  // 增加免费次数
  addFreeCount(count, source) {
    const newTotalCount = this.data.totalCount + count;
    const newTotalEarned = this.data.totalEarned + count;

    this.setData({
      totalCount: newTotalCount,
      totalEarned: newTotalEarned
    });

    // 保存到本地存储
    wx.setStorageSync('totalCount', newTotalCount);
    wx.setStorageSync('totalEarned', newTotalEarned);

    // 记录奖励来源
    console.log(`获得${count}次免费机会，来源：${source}`);
  },

  // 观看广告
  watchAd() {
    if (!this.data.adLoaded) {
      wx.showToast({
        title: '广告加载中，请稍后再试',
        icon: 'none'
      });
      return;
    }

    this.videoAd.show().catch(() => {
      // 失败重试
      this.videoAd.load()
        .then(() => this.videoAd.show())
        .catch(err => {
          wx.showToast({
            title: '广告展示失败，请稍后重试',
            icon: 'none'
          });
          console.log('激励视频广告显示失败', err);
        });
    });
  },

  // 签到
  signIn() {
    if (this.data.hasSignedIn) return;

    const today = new Date().toDateString();
    
    this.addFreeCount(1, '每日签到');
    this.setData({ hasSignedIn: true });
    
    wx.setStorageSync('hasSignedIn', true);
    wx.setStorageSync('lastSignInDate', today);

    wx.showToast({
      title: '签到成功，获得1次免费机会',
      icon: 'success'
    });
  },

  // 分享设置
  onShareAppMessage() {
    return {
      title: '这个视频转文字工具太好用了！',
      path: '/pages/index/index',
      imageUrl: '/images/share-image.png',
      success: (res) => {
        // 分享成功后奖励
        this.addFreeCount(2, '分享给好友');
        wx.showToast({
          title: '分享成功，获得2次免费机会',
          icon: 'success'
        });
      }
    };
  },

  onUnload() {
    // 销毁激励视频广告实例
    if (this.videoAd) {
      this.videoAd.destroy();
    }
  }
})