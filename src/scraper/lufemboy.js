/**
 * Cek Femboy - Random femboy percentage checker
 * Using local random logic without external GIF
 */

function cekfemboy(nama) {
    try {
        if (!nama) throw new Error('Masukkan nama dulu dong!');
        
        const percent = Math.floor(Math.random() * 101);
        let desc = '';
        let emoji = '';
        
        if (percent < 20) {
            desc = 'Cowok banget! Maskulin 100%! �';
            emoji = '😎';
        } else if (percent < 40) {
            desc = 'Ada aura lembutnya dikit~';
            emoji = '🌸';
        } else if (percent < 60) {
            desc = 'Lumayan femboy nih! Cute!';
            emoji = '😘';
        } else if (percent < 80) {
            desc = 'Femboy sejati detected!';
            emoji = '💅✨';
        } else {
            desc = 'FEMBOY DEWA TERTINGGI!';
            emoji = '�💖🔥';
        }
        
        // Progress bar
        const filled = Math.floor(percent / 10);
        const empty = 10 - filled;
        const bar = '█'.repeat(filled) + '░'.repeat(empty);
        
        return {
            hasil: `${emoji} *${nama}* ${emoji}\n\n` +
                   `> Level Femboy: *${percent}%*\n` +
                   `> [${bar}]\n\n` +
                   `> ${desc}`,
            percent: percent
        };
    } catch (error) {
        throw new Error(error.message);
    }
}

module.exports = cekfemboy
