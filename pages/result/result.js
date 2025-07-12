// pages/result/result.js
Page({
  data: {
    textContent: '', // 文字内容
    videoUrl: '',    // 视频地址
    isLoading: true  // 加载状态
  },

  onLoad(options) {
    // 接收传入的数据
    if (options.text) {
      this.setData({
        textContent: decodeURIComponent(options.text),
        isLoading: false
      });
    }
    
    if (options.videoUrl) {
      this.setData({
        videoUrl: decodeURIComponent(options.videoUrl)
      });
    }
  },

  // 复制文字内容
  copyText() {
    wx.setClipboardData({
      data: this.data.textContent,
      success: () => {
        wx.showToast({
          title: '复制成功',
          icon: 'success'
        });
      }
    });
  },

  // 分享结果
  shareResult() {
    wx.showShareMenu({
      withShareTicket: true
    });
  },

  // 用户点击分享
  onShareAppMessage() {
    return {
      title: '视频转文字结果',
      path: `/pages/result/result?text=${encodeURIComponent(this.data.textContent)}`,
      imageUrl: this.data.videoUrl || '/images/share-default.jpg'
    };
  },

  onReady() {
    // 页面加载完成
    wx.hideLoading();
  }
});