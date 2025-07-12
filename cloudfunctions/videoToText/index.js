// 云函数入口文件
const cloud = require('wx-server-sdk')
const ffmpeg = require('fluent-ffmpeg')
const ffmpegPath = require('ffmpeg-static')
const fs = require('fs')
const path = require('path')
const tencentcloud = require("tencentcloud-sdk-nodejs")

// 初始化云开发环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 设置ffmpeg路径
ffmpeg.setFfmpegPath(ffmpegPath)

// 创建临时目录
const TMP_DIR = '/tmp'
if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR)
}

// 语音识别客户端配置
const AsrClient = tencentcloud.asr.v20190614.Client
const clientConfig = {
  credential: {
    secretId: process.env.TENCENT_SECRET_ID,
    secretKey: process.env.TENCENT_SECRET_KEY,
  },
  region: "ap-shanghai",
  profile: {
    httpProfile: {
      endpoint: "asr.tencentcloudapi.com",
    },
  },
}

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const { fileID } = event
    
    // 1. 下载视频文件
    console.log('开始下载视频文件...')
    const videoFile = await cloud.downloadFile({
      fileID: fileID
    })
    const videoPath = path.join(TMP_DIR, 'video.mp4')
    fs.writeFileSync(videoPath, videoFile.fileContent)
    
    // 2. 提取音频
    console.log('开始提取音频...')
    const audioPath = path.join(TMP_DIR, 'audio.wav')
    await extractAudio(videoPath, audioPath)
    
    // 3. 上传音频文件到对象存储
    console.log('上传音频文件...')
    const audioBuffer = fs.readFileSync(audioPath)
    const uploadResult = await cloud.uploadFile({
      cloudPath: `audio/${Date.now()}.wav`,
      fileContent: audioBuffer
    })
    
    // 4. 获取音频文件访问链接
    const audioFileID = uploadResult.fileID
    const audioFileUrl = await getFileUrl(audioFileID)
    
    // 5. 调用语音识别
    console.log('开始语音识别...')
    const recognitionResult = await speechToText(audioFileUrl)
    
    // 6. 清理临时文件
    fs.unlinkSync(videoPath)
    fs.unlinkSync(audioPath)
    
    // 7. 返回结果
    return {
      code: 0,
      data: recognitionResult,
      message: 'success'
    }
    
  } catch (err) {
    console.error(err)
    return {
      code: -1,
      message: err.message || '处理失败'
    }
  }
}

// 提取音频
function extractAudio(videoPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .toFormat('wav')
      .outputOptions([
        '-acodec pcm_s16le',
        '-ac 1',
        '-ar 16000'
      ])
      .save(outputPath)
      .on('end', () => {
        console.log('音频提取完成')
        resolve()
      })
      .on('error', (err) => {
        console.error('音频提取失败:', err)
        reject(err)
      })
  })
}

// 获取文件访问链接
async function getFileUrl(fileID) {
  const result = await cloud.getTempFileURL({
    fileList: [fileID]
  })
  return result.fileList[0].tempFileURL
}

// 语音识别
const axios = require('axios');
const fs = require('fs');

async function getBaiduToken() {
  const response = await axios.post('https://aip.baidubce.com/oauth/2.0/token', {
    grant_type: 'client_credentials',
    client_id: process.env.BAIDU_API_KEY,
    client_secret: process.env.BAIDU_SECRET_KEY
  });
  return response.data.access_token;
}

async function speechToText(audioUrl) {
  try {
    const token = await getBaiduToken();
    const response = await axios.post('https://vop.baidu.com/server_api', {
      format: 'wav',
      rate: 16000,
      channel: 1,
      token: token,
      speech: audioUrl,
      len: fs.statSync(audioUrl).size
    }, {
      headers: {'Content-Type': 'application/json'}
    });
    return { text: response.data.result.join('') };
  } catch (error) {
    console.error('语音识别失败:', error);
    throw new Error('语音转换服务不可用');
  }
}