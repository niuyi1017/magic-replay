// 生成简单的 PNG 图标（纯色带文字）
// 运行: node scripts/generate-icons.js

const fs = require('fs')
const path = require('path')

// 简易 PNG 生成器（无依赖，生成纯色 + 简单图案的 PNG）
function createPNG(size) {
  // PNG 文件结构
  const width = size
  const height = size

  // 创建像素数据 (RGBA)
  const pixels = Buffer.alloc(width * height * 4)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const cx = width / 2
      const cy = height / 2
      const r = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
      const maxR = width * 0.45

      if (r <= maxR) {
        // 圆形区域 - 红色渐变 (#ff4757)
        const t = r / maxR
        pixels[idx] = 255     // R
        pixels[idx + 1] = Math.round(71 + (107 - 71) * t) // G: 71→107
        pixels[idx + 2] = Math.round(87 + (129 - 87) * t) // B: 87→129
        pixels[idx + 3] = 255 // A
      } else {
        // 透明
        pixels[idx] = 0
        pixels[idx + 1] = 0
        pixels[idx + 2] = 0
        pixels[idx + 3] = 0
      }
    }
  }

  // 绘制简单的 💬 图案（在圆内用白色画一个对话气泡）
  const bubbleLeft = Math.floor(width * 0.25)
  const bubbleRight = Math.floor(width * 0.75)
  const bubbleTop = Math.floor(height * 0.25)
  const bubbleBottom = Math.floor(height * 0.6)

  for (let y = bubbleTop; y <= bubbleBottom; y++) {
    for (let x = bubbleLeft; x <= bubbleRight; x++) {
      const idx = (y * width + x) * 4
      pixels[idx] = 255
      pixels[idx + 1] = 255
      pixels[idx + 2] = 255
      pixels[idx + 3] = 200
    }
  }

  // 小三角（气泡尾部）
  const triTop = bubbleBottom + 1
  const triBottom = Math.min(Math.floor(height * 0.72), height - 1)
  const triCx = Math.floor(width * 0.35)
  for (let y = triTop; y <= triBottom; y++) {
    const progress = (y - triTop) / (triBottom - triTop)
    const halfW = Math.floor((1 - progress) * width * 0.08)
    for (let x = triCx - halfW; x <= triCx + halfW; x++) {
      if (x >= 0 && x < width) {
        const idx = (y * width + x) * 4
        pixels[idx] = 255
        pixels[idx + 1] = 255
        pixels[idx + 2] = 255
        pixels[idx + 3] = 200
      }
    }
  }

  return encodePNG(width, height, pixels)
}

// Minimal PNG encoder
function encodePNG(width, height, pixels) {
  const zlib = require('zlib')

  // 添加过滤字节（每行开头加 0x00 = None filter）
  const rawData = Buffer.alloc(height * (width * 4 + 1))
  for (let y = 0; y < height; y++) {
    rawData[y * (width * 4 + 1)] = 0 // filter byte
    pixels.copy(rawData, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4)
  }

  const compressed = zlib.deflateSync(rawData)

  // Build PNG file
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  function makeChunk(type, data) {
    const len = Buffer.alloc(4)
    len.writeUInt32BE(data.length)
    const typeB = Buffer.from(type)
    const crcData = Buffer.concat([typeB, data])
    const crc = Buffer.alloc(4)
    crc.writeInt32BE(crc32(crcData))
    return Buffer.concat([len, typeB, data, crc])
  }

  // IHDR
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8  // bit depth
  ihdr[9] = 6  // color type: RGBA
  ihdr[10] = 0 // compression
  ihdr[11] = 0 // filter
  ihdr[12] = 0 // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr)
  const idatChunk = makeChunk('IDAT', compressed)
  const iendChunk = makeChunk('IEND', Buffer.alloc(0))

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk])
}

// CRC32 lookup
const crcTable = (() => {
  const table = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
    }
    table[n] = c
  }
  return table
})()

function crc32(buf) {
  let crc = -1
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8)
  }
  return crc ^ -1
}

// Generate icons
const sizes = [16, 48, 128]
const outDir = path.join(__dirname, '..', 'src', 'assets', 'icons')

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

for (const size of sizes) {
  const png = createPNG(size)
  const outPath = path.join(outDir, `icon${size}.png`)
  fs.writeFileSync(outPath, png)
  console.log(`Generated: icon${size}.png (${png.length} bytes)`)
}

console.log('Done!')
