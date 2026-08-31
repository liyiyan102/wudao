/**
 * 微信登录：wx.login 换会话 + 用户自选微信头像 / 昵称
 * （头像、昵称不能静默获取，须走 chooseAvatar + type=nickname）
 */
const { getUid } = require('./util')

const USER_KEY = 'wudao_user'
const AVATAR_PATH = 'wudao_avatar.jpg'

function getCurrentUser() {
  return wx.getStorageSync(USER_KEY) || null
}

function isLoggedIn() {
  return !!wx.getStorageSync(USER_KEY)
}

function logout() {
  wx.removeStorageSync(USER_KEY)
  return Promise.resolve(true)
}

function wxLoginCode() {
  return new Promise((resolve, reject) => {
    wx.login({
      success: (r) => resolve(r.code || ''),
      fail: () => reject({ msg: '微信登录失败' })
    })
  })
}

function persistAvatar(tempPath) {
  if (!tempPath) return Promise.resolve('')
  const dest = wx.env.USER_DATA_PATH + '/' + AVATAR_PATH
  const fs = wx.getFileSystemManager()
  return new Promise((resolve) => {
    const copy = () => {
      fs.copyFile({
        srcPath: tempPath,
        destPath: dest,
        success: () => resolve(dest + '?t=' + Date.now()),
        fail: () => resolve(tempPath)
      })
    }
    fs.access({
      path: dest,
      success: () => {
        fs.unlink({
          filePath: dest,
          complete: copy
        })
      },
      fail: copy
    })
  })
}

function saveProfile(profile) {
  const nickname = String((profile && profile.nickname) || '').trim().slice(0, 20)
  if (!nickname) return Promise.reject({ msg: '请选择微信昵称' })
  return wxLoginCode().then((code) =>
    persistAvatar(profile.avatar).then((avatar) => {
      const u = {
        id: getUid(),
        nickname,
        avatar,
        wxCode: code,
        loggedInAt: Date.now()
      }
      wx.setStorageSync(USER_KEY, u)
      return u
    })
  )
}

/** 未传资料时不要假装登录成功 */
function login(profile) {
  if (!profile || !profile.nickname) {
    return Promise.reject({ msg: 'NEED_PROFILE', code: 'NEED_PROFILE' })
  }
  return saveProfile(profile)
}

module.exports = {
  USER_KEY,
  getCurrentUser,
  isLoggedIn,
  logout,
  login,
  saveProfile,
  wxLoginCode
}
