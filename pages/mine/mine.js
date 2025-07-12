// pages/mine/mine.js
Page({
  data: {
    avatarUrl: '',
    nickname: '',
    coins: 0,
    dailyLimit: 3,
    usedCount: 0,
    adLoaded: false
  },

  onLoad() {
    // 初始化广告
    this.initAd();
    // 获取用户信息
    this.getUserInfo();
  },

  onShow() {
    // 刷新用户数据
    this.getUserInfo();
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
        this.addCoins(30);
        wx.showToast({
          title: '获得30金币奖励！',
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

  // 获取用户信息
  getUserInfo() {
    // 从本地存储获取用户信息
    const avatarUrl = wx.getStorageSync('avatarUrl') || '';
    const nickname = wx.getStorageSync('nickname') || '';
    const coins = wx.getStorageSync('coins') || 0;
    const usedCount = wx.getStorageSync('usedCount') || 0;

    this.setData({
      avatarUrl,
      nickname,
      coins,
      usedCount
    });
  },

  // 选择头像
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    this.setData({
      avatarUrl
    });
    wx.setStorageSync('avatarUrl', avatarUrl);
  },

  // 修改昵称
  onNicknameChange(e) {
    const nickname = e.detail.value;
    this.setData({
      nickname
    });
    wx.setStorageSync('nickname', nickname);
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

  // 增加金币
  addCoins(amount) {
    const newCoins = this.data.coins + amount;
    this.setData({ coins: newCoins });
    wx.setStorageSync('coins', newCoins);
  },

  // 分享给好友
  handleShare() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  // 显示反馈
  showFeedback() {
    wx.showModal({
      title: '意见反馈',
      content: '如果您有任何建议或问题，欢迎通过以下方式联系我们',
      confirmText: '复制邮箱',
      success(res) {
        if (res.confirm) {
          wx.setClipboardData({
            data: 'feedback@example.com',
            success() {
              wx.showToast({
                title: '邮箱已复制',
                icon: 'success'
              });
            }
          });
        }
      }
    });
  },

  // 显示关于信息
  showAbout() {
    wx.showModal({
      title: '关于我们',
      content: '视频转文字助手 v1.0.0\n\n支持主流短视频平台\n每日免费次数：3次\n观看广告可获得更多次数',
      showCancel: false
    });
  },

  // 分享设置
  onShareAppMessage() {
    return {
      title: '这个视频转文字工具太好用了！',
      path: '/pages/index/index',
      imageUrl: '/images/share-image.png' // 需要添加分享图片
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '视频转文字助手 - 支持抖音/快手/B站等平台',
      query: '',
      imageUrl: '/images/share-image.png' // 需要添加分享图片
    };
  },

  onUnload() {
    // 销毁激励视频广告实例
    if (this.videoAd) {
      this.videoAd.destroy();
    }
  }
})