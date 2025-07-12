// pages/tools/tools.js
Page({
  data: {
    watermarkCount: 3,    // 去水印每日次数
    voiceCount: 3,        // 语音转文字每日次数
    translateCount: 5,    // 翻译每日次数
    adLoaded: false,      // 广告是否加载完成
  },

  onLoad() {
    // 初始化广告
    this.initAd();
    // 获取使用次数
    this.getUsageCount();
  },

  onShow() {
    // 刷新使用次数
    this.getUsageCount();
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
        this.addUsageCount();
        wx.showToast({
          title: '获得3次免费使用机会！',
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

  // 获取使用次数
  getUsageCount() {
    // 从本地存储获取使用次数
    const watermarkCount = wx.getStorageSync('watermarkCount') || 3;
    const voiceCount = wx.getStorageSync('voiceCount') || 3;
    const translateCount = wx.getStorageSync('translateCount') || 5;

    this.setData({
      watermarkCount,
      voiceCount,
      translateCount
    });

    // 检查是否需要重置每日次数
    this.checkDailyReset();
  },

  // 检查是否需要重置每日次数
  checkDailyReset() {
    const lastResetDate = wx.getStorageSync('lastResetDate');
    const today = new Date().toDateString();
    
    if (lastResetDate !== today) {
      // 重置每日使用次数
      this.setData({
        watermarkCount: 3,
        voiceCount: 3,
        translateCount: 5
      });
      
      // 保存重置后的次数
      wx.setStorageSync('watermarkCount', 3);
      wx.setStorageSync('voiceCount', 3);
      wx.setStorageSync('translateCount', 5);
      wx.setStorageSync('lastResetDate', today);
    }
  },

  // 增加使用次数
  addUsageCount() {
    const { watermarkCount, voiceCount, translateCount } = this.data;
    
    // 每个功能增加3次使用机会
    this.setData({
      watermarkCount: watermarkCount + 3,
      voiceCount: voiceCount + 3,
      translateCount: translateCount + 3
    });

    // 保存到本地存储
    wx.setStorageSync('watermarkCount', watermarkCount + 3);
    wx.setStorageSync('voiceCount', voiceCount + 3);
    wx.setStorageSync('translateCount', translateCount + 3);
  },

  // 处理去水印功能
  handleVideoWatermark() {
    if (this.data.watermarkCount <= 0) {
      this.showWatchAdTip();
      return;
    }

    wx.navigateTo({
      url: '/pages/index/index'
    });
  },

  // 处理语音转文字功能
  handleVoiceToText() {
    if (this.data.voiceCount <= 0) {
      this.showWatchAdTip();
      return;
    }

    wx.showToast({
      title: '该功能正在开发中',
      icon: 'none'
    });
  },

  // 处理翻译功能
  handleTranslate() {
    if (this.data.translateCount <= 0) {
      this.showWatchAdTip();
      return;
    }

    wx.showToast({
      title: '该功能正在开发中',
      icon: 'none'
    });
  },

  // 显示观看广告提示
  showWatchAdTip() {
    wx.showModal({
      title: '免费次数已用完',
      content: '观看广告可获得3次免费使用机会',
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

  // 分享设置
  onShareAppMessage() {
    return {
      title: '这个视频工具箱太好用了！',
      path: '/pages/tools/tools',
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

wx.request({
  url: 'http://localhost:3000/api/video-to-text',
  method: 'POST',
  data: {
    videoUrl: tempFilePath
  },
  success: (res) => {
    console.log('识别结果', res.data)
  }
})


// 新增录音功能
startRecord() {
  wx.startRecord({
    success: (res) => {
      this.uploadAudio(res.tempFilePath)
    },
    fail: (err) => console.error('录音失败', err)
  })
},

uploadAudio(tempFilePath) {
  wx.uploadFile({
    url: 'http://localhost:3000/api/video-to-text',
    filePath: tempFilePath,
    name: 'audio',
    success: (res) => {
      const result = JSON.parse(res.data)
      this.saveResult(result.text)
    }
  })
},

saveResult(text) {
  wx.request({
    url: 'http://localhost:3000/api/save-result',
    method: 'POST',
    data: { text },
    success: () => wx.showToast({ title: '保存成功' })
  })
}