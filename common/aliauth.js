const WXAPI = require('apifm-uniapp')
import store from '@/store';

async function bindSeller() {
	const token = store.state.token
	const referrer = store.state.referrer
	if (!token) {
		return
	}
	if (!referrer) {
		return
	}
	const res = await WXAPI.bindSeller({
		token,
		uid: referrer
	})
}

// 检测登录状态，返回 true / false
async function checkHasLogined() {
	const token = store.state.token
	if (!token) {
		return false
	}
	const checkTokenRes = await WXAPI.checkToken(token)
	if (checkTokenRes.code != 0) {
		store.commit('$uStore', {
			name: 'token',
			value: ''
		})
		return false
	}
	return true
}

async function wxaCode() {
	return new Promise((resolve, reject) => {
		wx.login({
			success(res) {
				return resolve(res.code)
			},
			fail() {
				wx.showToast({
					title: '获取code失败',
					icon: 'none'
				})
				return resolve('获取code失败')
			}
		})
	})
}

async function login(page) {
	const _this = this
	wx.login({
		success: function(res) {
			const extConfigSync = wx.getExtConfigSync()
			if (extConfigSync.subDomain) {
				WXAPI.wxappServiceLogin({
					code: res.code
				}).then(function(res) {
					if (res.code == 10000) {
						// 去注册
						return;
					}
					if (res.code != 0) {
						// 登录错误
						wx.showModal({
							title: '无法登录',
							content: res.msg,
							showCancel: false
						})
						return;
					}
					store.commit('$uStore', {
						name: 'token',
						value: res.data.token
					})
					store.commit('$uStore', {
						name: 'uid',
						value: res.data.uid
					})
					_this.bindSeller()
					if (page) {
						page.onShow()
					}
				})
			} else {
				WXAPI.login_wx(res.code).then(function(res) {
					if (res.code == 10000) {
						// 去注册
						return;
					}
					if (res.code != 0) {
						// 登录错误
						wx.showModal({
							title: '无法登录',
							content: res.msg,
							showCancel: false
						})
						return;
					}
					store.commit('$uStore', {
						name: 'token',
						value: res.data.token
					})
					store.commit('$uStore', {
						name: 'uid',
						value: res.data.uid
					})
					_this.bindSeller()
					if (page) {
						page.onShow()
					}
				})
			}
		}
	})
}

async function authorize() {
	return new Promise((resolve, reject) => {
		my.getAuthCode({
			scopes: 'auth_base',
			success: (res) => {
				const code = res.authCode
				let referrer = '' // 推荐人
				let referrer_storge = store.state.referrer
				if (referrer_storge) {
					referrer = referrer_storge;
				}
				WXAPI.aliappUserAuthorize({
					code: code,
					referrer: referrer
				}).then(function(res) {
					if (res.code == 0) {
						store.commit('$uStore', {
							name: 'token',
							value: res.data.token
						})
						store.commit('$uStore', {
							name: 'uid',
							value: res.data.uid
						})
						resolve(res)
					} else {
						wx.showToast({
							title: res.msg,
							icon: 'none'
						})
						reject(res.msg)
					}
				})
			},
			fail: (err) => {
				my.showToast({
					content: err.errorMessage
				})
				reject(err)
			}
		})
	})
}

function loginOut() {
	store.commit('$uStore', {
		name: 'token',
		value: ''
	})
	store.commit('$uStore', {
		name: 'uid',
		value: ''
	})
}

async function checkAndAuthorize(scope) {
	return new Promise((resolve, reject) => {
		uni.getSetting({
			success(res) {
				if (!res.authSetting[scope]) {
					uni.authorize({
						scope: scope,
						success() {
							resolve() // 无返回参数
						},
						fail(e) {
							console.error(e)
							uni.showModal({
								title: '无权操作',
								content: '需要获得您的授权',
								showCancel: false,
								confirmText: '立即授权',
								confirmColor: '#e64340',
								success(res) {
									uni.openSetting();
								},
								fail(e) {
									console.error(e)
									reject(e)
								},
							})
						}
					})
				} else {
					resolve() // 无返回参数
				}
			},
			fail(e) {
				console.error(e)
				reject(e)
			}
		})
	})
}

module.exports = {
	checkHasLogined: checkHasLogined,
	wxaCode: wxaCode,
	login: login,
	loginOut: loginOut,
	checkAndAuthorize: checkAndAuthorize,
	authorize: authorize,
	bindSeller: bindSeller
}
