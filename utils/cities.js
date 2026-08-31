/**
 * 城市选择数据（国内主要城市，按拼音首字母）
 */
const HOT_CITIES = [
  '北京', '上海', '广州', '深圳', '杭州', '成都',
  '重庆', '西安', '武汉', '南京', '苏州', '长沙'
]

/** 用于粗定位：城市中心坐标 */
const CITY_COORDS = {
  '北京': [39.9042, 116.4074], '上海': [31.2304, 121.4737],
  '广州': [23.1291, 113.2644], '深圳': [22.5431, 114.0579],
  '杭州': [30.2741, 120.1551], '成都': [30.5728, 104.0668],
  '重庆': [29.5630, 106.5516], '西安': [34.3416, 108.9398],
  '武汉': [30.5928, 114.3055], '南京': [32.0603, 118.7969],
  '苏州': [31.2989, 120.5853], '长沙': [28.2282, 112.9388],
  '天津': [39.3434, 117.3616], '郑州': [34.7466, 113.6254],
  '青岛': [36.0671, 120.3826], '大连': [38.9140, 121.6147],
  '厦门': [24.4798, 118.0894], '福州': [26.0745, 119.2965],
  '济南': [36.6512, 117.1201], '合肥': [31.8206, 117.2272],
  '昆明': [25.0389, 102.7183], '贵阳': [26.6470, 106.6302],
  '南宁': [22.8170, 108.3665], '海口': [20.0440, 110.1999],
  '沈阳': [41.8057, 123.4315], '长春': [43.8171, 125.3235],
  '哈尔滨': [45.8038, 126.5340], '石家庄': [38.0428, 114.5149],
  '太原': [37.8706, 112.5489], '呼和浩特': [40.8414, 111.7519],
  '南昌': [28.6820, 115.8579], '宁波': [29.8683, 121.5440],
  '无锡': [31.4912, 120.3119], '佛山': [23.0219, 113.1214],
  '东莞': [23.0207, 113.7518], '珠海': [22.2710, 113.5767],
  '兰州': [36.0611, 103.8343], '西宁': [36.6171, 101.7782],
  '银川': [38.4872, 106.2309], '乌鲁木齐': [43.8256, 87.6168],
  '拉萨': [29.6525, 91.1721]
}

const CITY_LIST = [
  { name: '阿勒泰', province: '新疆', letter: 'A' },
  { name: '安庆', province: '安徽', letter: 'A' },
  { name: '澳门', province: '澳门', letter: 'A' },
  { name: '北京', province: '北京', letter: 'B' },
  { name: '保定', province: '河北', letter: 'B' },
  { name: '包头', province: '内蒙古', letter: 'B' },
  { name: '成都', province: '四川', letter: 'C' },
  { name: '重庆', province: '重庆', letter: 'C' },
  { name: '长沙', province: '湖南', letter: 'C' },
  { name: '长春', province: '吉林', letter: 'C' },
  { name: '常州', province: '江苏', letter: 'C' },
  { name: '大连', province: '辽宁', letter: 'D' },
  { name: '东莞', province: '广东', letter: 'D' },
  { name: '大庆', province: '黑龙江', letter: 'D' },
  { name: '佛山', province: '广东', letter: 'F' },
  { name: '福州', province: '福建', letter: 'F' },
  { name: '广州', province: '广东', letter: 'G' },
  { name: '贵阳', province: '贵州', letter: 'G' },
  { name: '桂林', province: '广西', letter: 'G' },
  { name: '杭州', province: '浙江', letter: 'H' },
  { name: '合肥', province: '安徽', letter: 'H' },
  { name: '哈尔滨', province: '黑龙江', letter: 'H' },
  { name: '海口', province: '海南', letter: 'H' },
  { name: '呼和浩特', province: '内蒙古', letter: 'H' },
  { name: '惠州', province: '广东', letter: 'H' },
  { name: '济南', province: '山东', letter: 'J' },
  { name: '嘉兴', province: '浙江', letter: 'J' },
  { name: '金华', province: '浙江', letter: 'J' },
  { name: '昆明', province: '云南', letter: 'K' },
  { name: '兰州', province: '甘肃', letter: 'L' },
  { name: '拉萨', province: '西藏', letter: 'L' },
  { name: '洛阳', province: '河南', letter: 'L' },
  { name: '绵阳', province: '四川', letter: 'M' },
  { name: '南京', province: '江苏', letter: 'N' },
  { name: '南昌', province: '江西', letter: 'N' },
  { name: '南宁', province: '广西', letter: 'N' },
  { name: '宁波', province: '浙江', letter: 'N' },
  { name: '南通', province: '江苏', letter: 'N' },
  { name: '青岛', province: '山东', letter: 'Q' },
  { name: '泉州', province: '福建', letter: 'Q' },
  { name: '上海', province: '上海', letter: 'S' },
  { name: '深圳', province: '广东', letter: 'S' },
  { name: '苏州', province: '江苏', letter: 'S' },
  { name: '沈阳', province: '辽宁', letter: 'S' },
  { name: '石家庄', province: '河北', letter: 'S' },
  { name: '三亚', province: '海南', letter: 'S' },
  { name: '天津', province: '天津', letter: 'T' },
  { name: '太原', province: '山西', letter: 'T' },
  { name: '台州', province: '浙江', letter: 'T' },
  { name: '乌鲁木齐', province: '新疆', letter: 'W' },
  { name: '武汉', province: '湖北', letter: 'W' },
  { name: '无锡', province: '江苏', letter: 'W' },
  { name: '温州', province: '浙江', letter: 'W' },
  { name: '西安', province: '陕西', letter: 'X' },
  { name: '厦门', province: '福建', letter: 'X' },
  { name: '西宁', province: '青海', letter: 'X' },
  { name: '徐州', province: '江苏', letter: 'X' },
  { name: '银川', province: '宁夏', letter: 'Y' },
  { name: '烟台', province: '山东', letter: 'Y' },
  { name: '扬州', province: '江苏', letter: 'Y' },
  { name: '郑州', province: '河南', letter: 'Z' },
  { name: '珠海', province: '广东', letter: 'Z' },
  { name: '中山', province: '广东', letter: 'Z' },
  { name: '珠海', province: '广东', letter: 'Z' }
]

// dedupe 珠海
const seen = {}
const CITY_LIST_UNIQUE = CITY_LIST.filter(c => {
  if (seen[c.name]) return false
  seen[c.name] = true
  return true
})

/** flat names for兼容旧 CITIES */
const CITIES = CITY_LIST_UNIQUE.map(c => c.name)

function buildGroups(list) {
  const map = {}
  list.forEach(c => {
    const L = c.letter || '#'
    if (!map[L]) map[L] = []
    map[L].push(c)
  })
  return Object.keys(map).sort().map(letter => ({
    letter,
    id: 'letter-' + letter,
    cities: map[letter]
  }))
}

const CITY_GROUPS = buildGroups(CITY_LIST_UNIQUE)

function nearestCity(lat, lng) {
  let best = '北京'
  let bestD = Infinity
  Object.keys(CITY_COORDS).forEach(name => {
    const [a, b] = CITY_COORDS[name]
    const d = (a - lat) * (a - lat) + (b - lng) * (b - lng)
    if (d < bestD) { bestD = d; best = name }
  })
  return best
}

const HISTORY_KEY = 'wudao_city_history'

function getCityHistory() {
  return wx.getStorageSync(HISTORY_KEY) || []
}

function pushCityHistory(city) {
  if (!city) return
  const list = getCityHistory().filter(x => x !== city)
  list.unshift(city)
  wx.setStorageSync(HISTORY_KEY, list.slice(0, 8))
}

function clearCityHistory() {
  wx.removeStorageSync(HISTORY_KEY)
}

module.exports = {
  HOT_CITIES,
  CITY_LIST: CITY_LIST_UNIQUE,
  CITY_GROUPS,
  CITIES,
  CITY_COORDS,
  nearestCity,
  getCityHistory,
  pushCityHistory,
  clearCityHistory
}
