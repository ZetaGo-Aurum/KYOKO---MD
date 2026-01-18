const { createCanvas, GlobalFonts, loadImage } = require('@napi-rs/canvas')
const config = require('../../config')
const path = require('path')
const fs = require('fs')

const pluginConfig = {
    name: 'nulis',
    alias: ['tulis', 'write'],
    category: 'tools',
    description: 'Generate tulisan tangan di kertas',
    usage: '$nulis <teks> atau $nulis 1 | teks (dengan nomor)',
    example: '$nulis Aku cinta kamu\n$nulis 1 | Paragraph pertama\n2 | Paragraph kedua',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    limit: 1,
    isEnabled: true
}

/**
 * Custom handwriting text renderer using @napi-rs/canvas
 * Works without ImageMagick - 100% Node.js solution for OptikLink
 * Supports TTF fonts for authentic handwriting look
 * 
 * Format:
 * - Plain text: "$nulis Halo saya menulis"
 * - With numbers: "$nulis 1 | Teks pertama\n2 | Teks kedua"
 */

// Register handwriting font on module load
const fontPath = path.join(process.cwd(), 'assets', 'fonts', 'Zahraaa.ttf')
if (fs.existsSync(fontPath)) {
    GlobalFonts.registerFromPath(fontPath, 'Zahraaa')
}

/**
 * Wrap text to fit within maxWidth with proper word boundaries
 */
function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ')
    const lines = []
    let currentLine = ''
    
    for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word
        const metrics = ctx.measureText(testLine)
        
        if (metrics.width > maxWidth && currentLine !== '') {
            lines.push(currentLine)
            currentLine = word
        } else {
            currentLine = testLine
        }
    }
    
    if (currentLine) {
        lines.push(currentLine)
    }
    
    return lines
}

/**
 * Parse input text to detect numbered format
 * Returns array of { number: string|null, text: string }
 */
function parseInput(text) {
    // Split by newlines first
    const rawLines = text.split(/\n|\\n/)
    const result = []
    
    for (const line of rawLines) {
        const trimmedLine = line.trim()
        if (!trimmedLine) continue
        
        // Check if line matches "number | text" format
        const match = trimmedLine.match(/^(\d+)\s*\|\s*(.+)$/)
        
        if (match) {
            result.push({
                number: match[1],
                text: match[2].trim()
            })
        } else {
            result.push({
                number: null,
                text: trimmedLine
            })
        }
    }
    
    return result
}

async function handler(m, { sock }) {
    const text = m.args?.join(' ')
    
    if (!text) {
        return m.reply(
            `\n┏━━━━━━━━━━━━━━━━━━┓\n` +
            `┃  📝 *NULIS*           ┃\n` +
            `┗━━━━━━━━━━━━━━━━━━┛\n\n` +
            `> Buat tulisan tangan otomatis\n\n` +
            `┌──「 *FORMAT BIASA* 」\n` +
            `│ ${m.prefix}nulis <teks>\n` +
            `│ Contoh: ${m.prefix}nulis Halo dunia\n` +
            `└────────────────\n\n` +
            `┌──「 *FORMAT BERNOMOR* 」\n` +
            `│ ${m.prefix}nulis 1 | Teks pertama\n` +
            `│ 2 | Teks kedua\n` +
            `│ 3 | Teks ketiga\n` +
            `└────────────────`
        )
    }
    
    if (text.length > 1000) {
        return m.reply(
            `\n┏━━━━━━━━━━━━━━━━━━┓\n` +
            `┃  ❌ *ERROR*           ┃\n` +
            `┗━━━━━━━━━━━━━━━━━━┛\n\n` +
            `> Teks terlalu panjang!\n` +
            `> Maksimal: 1000 karakter`
        )
    }
    
    await m.react('⏳')
    await m.reply(
        `\n┏━━━━━━━━━━━━━━━━━━┓\n` +
        `┃  ⏳ *PROCESSING*     ┃\n` +
        `┗━━━━━━━━━━━━━━━━━━┛\n\n` +
        `> Membuat tulisan tangan...`
    )
    
    try {
        const inputPath = path.join(process.cwd(), 'assets', 'kertas', 'magernulis1.jpg')
        
        if (!fs.existsSync(inputPath)) {
            return m.reply(
                `\n┏━━━━━━━━━━━━━━━━━━┓\n` +
                `┃  ❌ *MISSING FILE*    ┃\n` +
                `┗━━━━━━━━━━━━━━━━━━┛\n\n` +
                `> Template tidak ditemukan\n` +
                `> Path: assets/kertas/magernulis1.jpg`
            )
        }
        
        // Load the template image
        const templateImage = await loadImage(inputPath)
        const width = templateImage.width
        const height = templateImage.height
        
        // Create canvas with same dimensions as template
        const canvas = createCanvas(width, height)
        const ctx = canvas.getContext('2d')
        
        // Draw template image
        ctx.drawImage(templateImage, 0, 0)
        
        // Configure text style - BLACK color for realistic pen look
        ctx.fillStyle = '#1a1a1a'
        ctx.textBaseline = 'top'
        
        // Use Zahraaa handwriting font
        const fontFamily = GlobalFonts.families.some(f => f.family === 'Zahraaa') 
            ? 'Zahraaa' 
            : 'Comic Sans MS'
        
        // Font sizes
        const mainFontSize = 22
        const smallFontSize = 14
        
        // Get current date
        const d = new Date()
        const tgl = d.toLocaleDateString('id-ID')
        const hari = d.toLocaleDateString('id-ID', { weekday: 'long' })
        
        // Draw date info in header area (right side - "No." and "Date" fields)
        ctx.font = `${smallFontSize}px "${fontFamily}"`
        ctx.fillText(hari, 820, 33)  // Day name near "No."
        ctx.fillText(tgl, 820, 58)   // Date near "Date"
        
        // Position configuration
        const numberX = 300          // X position for numbers (in checkbox column)
        const textStartX = 345       // X position for text (after vertical line)
        const textStartY = 148       // First line below the Kelas text
        const maxWidth = 310         // Width of writable area
        const lineHeight = 25        // Paper line spacing
        const maxLines = 18          // Number of usable lines on paper
        
        // Set main font for body text
        ctx.font = `${mainFontSize}px "${fontFamily}"`
        
        // Parse input to detect numbered format
        const parsedLines = parseInput(text)
        
        // Check if any line has a number (to determine format)
        const hasNumbers = parsedLines.some(line => line.number !== null)
        
        let currentY = textStartY
        let lineCount = 0
        
        if (hasNumbers) {
            // Numbered format: write number in checkbox column, text after
            for (const { number, text: lineText } of parsedLines) {
                if (lineCount >= maxLines) break
                
                // Write number in checkbox column if exists
                if (number) {
                    ctx.fillText(number, numberX, currentY)
                }
                
                // Wrap and write text
                const wrappedLines = wrapText(ctx, lineText, maxWidth)
                
                for (let i = 0; i < wrappedLines.length; i++) {
                    if (lineCount >= maxLines) break
                    
                    ctx.fillText(wrappedLines[i], textStartX, currentY)
                    currentY += lineHeight
                    lineCount++
                }
            }
        } else {
            // Plain format: just write text normally
            const allText = parsedLines.map(p => p.text).join(' ')
            const wrappedLines = wrapText(ctx, allText, maxWidth)
            
            for (let i = 0; i < Math.min(wrappedLines.length, maxLines); i++) {
                ctx.fillText(wrappedLines[i], textStartX, currentY)
                currentY += lineHeight
                lineCount++
            }
        }
        
        // If text was truncated, add "..."
        if (lineCount >= maxLines) {
            ctx.fillText('...', textStartX, currentY)
        }
        
        // Convert canvas to buffer
        const buffer = canvas.toBuffer('image/jpeg')
        
        await m.react('✅')
        
        const saluranId = config.saluran?.id || ''
        const saluranName = config.saluran?.name || 'KYOKO MD'
        
        await sock.sendMessage(m.chat, {
            image: buffer,
            caption: 
                `\n┏━━━━━━━━━━━━━━━━━━┓\n` +
                `┃  ✅ *SUCCESS*        ┃\n` +
                `┗━━━━━━━━━━━━━━━━━━┛\n\n` +
                `> Tulisan tangan berhasil dibuat!\n` +
                `> Hati-hati ketahuan ya 📖\n\n` +
                `> _KYOKO MD v2.0_`,
            contextInfo: {
                forwardingScore: 9999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: saluranId,
                    newsletterName: saluranName,
                    serverMessageId: 127
                }
            }
        }, { quoted: m })
        
    } catch (err) {
        console.error('[nulis] Error:', err.message)
        await m.react('❌')
        await m.reply(
            `\n┏━━━━━━━━━━━━━━━━━━┓\n` +
            `┃  ❌ *ERROR*          ┃\n` +
            `┗━━━━━━━━━━━━━━━━━━┛\n\n` +
            `> ${err.message}`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
