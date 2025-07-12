// pages/index/index.js
Page({
  data: {
    coins: 0,          // 用户金币数
    dailyLimit: 3,     // 每日免费次数
    usedCount: 0,      // 今日已使用次数
    inputLink: '',     // 输入的链接
    isVIP: false,      // 是否是VIP用户
    processing: false, // 是否正在处理
    adLoaded: false,   // 广告是否加载完成
  },

  onLoad() {
    // 初始化激励视频广告
    this.initRewardedVideoAd();
    // 获取用户信息和使用次数
    this.getUserInfo();
    // 检查网络状态
    this.checkNetworkStatus();
    // 防抖定时器
    this.processTimer = null;
  },

  // 检查网络状态
  checkNetworkStatus() {
    wx.getNetworkType({
      success: (res) => {
        if (res.networkType === 'none') {
          wx.showToast({
            title: '请检查网络连接',
            icon: 'none',
            duration: 2000
          });
        }
      }
    });

    // 监听网络状态变化
    wx.onNetworkStatusChange((res) => {
      if (!res.isConnected) {
        wx.showToast({
          title: '网络已断开',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  onShow() {
    // 检查每日使用次数是否需要重置
    this.checkDailyReset();
    // 恢复页面状态
    this.setData({ processing: false });
  },

  // 下拉刷新
  onPullDownRefresh() {
    // 重置使用次数
    this.checkDailyReset();
    // 刷新广告状态
    this.initRewardedVideoAd();
    // 获取最新用户信息
    this.getUserInfo();

    setTimeout(() => {
      wx.stopPullDownRefresh();
      wx.showToast({
        title: '刷新成功',
        icon: 'success',
        duration: 1500
      });
    }, 1000);
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

  // 页面滚动到底部
  onReachBottom() {
    // 如果需要加载更多内容，可以在这里处理
  },

  // 显示返回顶部按钮
  onPageScroll(e) {
    if (e.scrollTop > 100 && !this.data.showBackTop) {
      this.setData({ showBackTop: true });
    } else if (e.scrollTop <= 100 && this.data.showBackTop) {
      this.setData({ showBackTop: false });
    }
  },

  // 返回顶部
  backToTop() {
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 300
    });
  },

  // 初始化激励视频广告
  initRewardedVideoAd() {
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
        // 正常播放结束，可以下发游戏奖励
        this.addCoins(30); // 奖励30金币
        wx.showToast({
          title: '获得30金币奖励！',
          icon: 'success'
        });
      } else {
        // 播放中途退出，不下发游戏奖励
        wx.showToast({
          title: '需要完整观看广告才能获得奖励',
          icon: 'none'
        });
      }
    });
  },

  // 获取用户信息
  getUserInfo() {
    // TODO: 从云数据库获取用户信息
    // 这里先使用本地存储模拟
    const coins = wx.getStorageSync('coins') || 0;
    const usedCount = wx.getStorageSync('usedCount') || 0;
    this.setData({
      coins,
      usedCount
    });
  },

  // 检查每日使用次数是否需要重置
  checkDailyReset() {
    const lastResetDate = wx.getStorageSync('lastResetDate');
    const today = new Date().toDateString();
    
    if (lastResetDate !== today) {
      // 重置每日使用次数
      this.setData({ usedCount: 0 });
      wx.setStorageSync('usedCount', 0);
      wx.setStorageSync('lastResetDate', today);
    }
  },

  // 输入链接
  onInputLink(e) {
    this.setData({
      inputLink: e.detail.value
    });
  },

  // 处理粘贴
  handlePaste() {
    wx.getClipboardData({
      success: (res) => {
        if (res.data) {
          this.setData({
            inputLink: res.data.trim()
          });
          // 自动验证链接格式
          if (this.validateLinkFormat(res.data.trim())) {
            wx.showToast({
              title: '链接已粘贴',
              icon: 'success',
              duration: 1500
            });
          }
        } else {
          wx.showToast({
            title: '剪贴板为空',
            icon: 'none'
          });
        }
      },
      fail: () => {
        wx.showToast({
          title: '获取剪贴板失败',
          icon: 'none'
        });
      }
    });
  },

  // 处理视频（添加防抖）
  handleVideo() {
    // 清除之前的定时器
    if (this.processTimer) {
      clearTimeout(this.processTimer);
    }

    // 设置防抖延时
    this.processTimer = setTimeout(() => {
      this._handleVideo();
    }, 300);
  },

  // 实际处理视频的函数
  _handleVideo() {
    const { inputLink, usedCount, dailyLimit, isVIP, processing } = this.data;

    // 检查网络状态
    wx.getNetworkType({
      success: (res) => {
        if (res.networkType === 'none') {
          wx.showToast({
            title: '请检查网络连接',
            icon: 'none',
            duration: 2000
          });
          return;
        }

        // 继续处理逻辑
        this._processWithChecks();
      }
    });
  },

  // 处理前的检查
  _processWithChecks() {
    const { inputLink, usedCount, dailyLimit, isVIP, processing } = this.data;

    // 检查是否正在处理
    if (processing) {
      wx.showToast({
        title: '正在处理中，请稍候',
        icon: 'none'
      });
      return;
    }

    // 检查链接是否为空
    if (!inputLink.trim()) {
      wx.showToast({
        title: '请输入视频链接',
        icon: 'none'
      });
      return;
    }

    // 验证链接格式
    if (!this.validateLinkFormat(inputLink)) {
      return;
    }

    // 检查使用次数限制
    if (!isVIP && usedCount >= dailyLimit) {
      this.showWatchAdTip();
      return;
    }

    // 开始处理视频
    this.processVideo();
  },

  // 验证链接格式
  validateLinkFormat(link) {
    // 支持的视频平台链接正则表达式
    const patterns = [
      /https?:\/\/(v\.|www\.)?douyin\.com\/(video\/|share\/)?[A-Za-z0-9]+/,  // 抖音
      /https?:\/\/(www\.)?kuaishou\.com\/(short-video|video)\/.+/,  // 快手
      /https?:\/\/(www\.)?bilibili\.com\/video\/.+/,  // B站
      /https?:\/\/(v\.)?qq\.com\/x\/cover\/.+/,  // 腾讯视频
      /https?:\/\/(www\.)?youtube\.com\/watch\?v=.+/,  // YouTube
      /https?:\/\/(www\.)?weibo\.com\/tv\/show\/.+/   // 微博
    ];

    // 打印输入的链接，方便调试
    console.log('输入的链接:', link);
    
    const isValid = patterns.some(pattern => {
      const matches = pattern.test(link);
      // 打印每个正则匹配的结果
      console.log('正则匹配结果:', pattern, matches);
      return matches;
    });

    if (!isValid) {
      wx.showModal({
        title: '链接格式错误',
        content: '请确保复制完整的视频链接。\n\n支持的链接格式示例：\n- https://v.douyin.com/xxx\n- https://www.douyin.com/video/xxx',
        showCancel: false
      });
      return false;
    }

    return true;
  },

  // 显示观看广告提示
  showWatchAdTip() {
    wx.showModal({
      title: '免费次数已用完',
      content: '观看广告可获得更多次数和金币奖励',
      confirmText: '观看广告',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.watchAd();
        }
      }
    });
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

  // 处理视频
  async processVideo() {
    const { inputLink } = this.data;

    try {
      this.setData({ processing: true });

      // 1. 下载视频
      wx.showLoading({
        title: '正在下载视频...',
        mask: true
      });

      const videoFile = await this.downloadVideo(inputLink);

      // 2. 上传视频到云存储
      wx.showLoading({
        title: '正在上传视频...',
        mask: true
      });

      const uploadResult = await wx.cloud.uploadFile({
        cloudPath: `videos/${Date.now()}.mp4`,
        filePath: videoFile.tempFilePath
      });

      // 3. 调用云函数处理视频
      wx.showLoading({
        title: '正在处理视频...',
        mask: true
      });

      const result = await wx.cloud.callFunction({
        name: 'videoToText',
        data: {
          fileID: uploadResult.fileID
        }
      });

      // 4. 检查处理结果
      if (result.result.code !== 0) {
        throw new Error(result.result.message || '处理失败');
      }

      // 5. 增加使用次数
      const newUsedCount = this.data.usedCount + 1;
      this.setData({
        usedCount: newUsedCount,
        processing: false,
        inputLink: ''
      });
      wx.setStorageSync('usedCount', newUsedCount);

      // 6. 跳转到结果页面
      wx.navigateTo({
        url: `/pages/result/result?text=${encodeURIComponent(result.result.data)}&videoUrl=${encodeURIComponent(inputLink)}`
      });

    } catch (err) {
      console.error('处理失败:', err);
      wx.showModal({
        title: '处理失败',
        content: err.message || '请稍后重试',
        showCancel: false
      });
      this.setData({ processing: false });
    } finally {
      wx.hideLoading();
    }
  },

  // 下载视频
  async downloadVideo(url) {
    return new Promise((resolve, reject) => {
      wx.downloadFile({
        url: url,
        success: res => {
          if (res.statusCode === 200) {
            resolve(res);
          } else {
            reject(new Error('视频下载失败'));
          }
        },
        fail: err => {
          reject(new Error('视频下载失败: ' + err.errMsg));
        }
      });
    });
  },

  // 页面卸载时清理资源
  onUnload() {
    // 清理定时器
    if (this.processTimer) {
      clearTimeout(this.processTimer);
    }

    // 销毁激励视频广告实例
    if (this.videoAd) {
      this.videoAd.destroy();
    }

    // 取消网络状态监听
    wx.offNetworkStatusChange();
  }
})