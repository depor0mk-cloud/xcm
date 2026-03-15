import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));

app.get('*all', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

// --- Cipher Logic ---
const cipherMap: Record<string, string> = {
    'А': 'x9#', 'Б': '7@z', 'В': 'm$1', 'Г': 'q&2', 'Д': 'w*3', 'Е': 'e(4', 'Ё': 'r)5', 'Ж': 't-6', 'З': 'y+7', 'И': 'u=8',
    'Й': 'i/9', 'К': 'o?0', 'Л': 'p!a', 'М': 'a@s', 'Н': 's#d', 'О': 'd$f', 'П': 'f%g', 'Р': 'g^h', 'С': 'h&j', 'Т': 'j*k',
    'У': 'k(l', 'Ф': 'l)z', 'Х': 'z-x', 'Ц': 'x+c', 'Ч': 'c=v', 'Ш': 'v/b', 'Щ': 'b?n', 'Ъ': 'n!m', 'Ы': 'm@q', 'Ь': 'q#w',
    'Э': 'w$e', 'Ю': 'e%r', 'Я': 'r^t',
    'а': '1x#', 'б': '2@z', 'в': '3$1', 'г': '4&2', 'д': '5*3', 'е': '6(4', 'ё': '7)5', 'ж': '8-6', 'з': '9+7', 'и': '0=8',
    'й': 'a/9', 'к': 'b?0', 'л': 'c!a', 'м': 'd@s', 'н': 'e#d', 'о': 'f$f', 'п': 'g%g', 'р': 'h^h', 'с': 'i&j', 'т': 'j*k',
    'у': 'k(l', 'ф': 'l)z', 'х': 'm-x', 'ц': 'n+c', 'ч': 'o=v', 'ш': 'p/b', 'щ': 'q?n', 'ъ': 'r!m', 'ы': 's@q', 'ь': 't#w',
    'э': 'u$e', 'ю': 'v%r', 'я': 'w^t',
    'A': 'A1#', 'B': 'B2@', 'C': 'C3$', 'D': 'D4%', 'E': 'E5^', 'F': 'F6&', 'G': 'G7*', 'H': 'H8(', 'I': 'I9)', 'J': 'J0-',
    'K': 'K!1', 'L': 'L@2', 'M': 'M#3', 'N': 'N$4', 'O': 'O%5', 'P': 'P^6', 'Q': 'Q&7', 'R': 'R*8', 'S': 'S(9', 'T': 'T)0',
    'U': 'U-!', 'V': 'V=2', 'W': 'W+3', 'X': 'X/4', 'Y': 'Y?5', 'Z': 'Z>6',
    'a': 'a1#', 'b': 'b2@', 'c': 'c3$', 'd': 'd4%', 'e': 'e5^', 'f': 'f6&', 'g': 'g7*', 'h': 'h8(', 'i': 'i9)', 'j': 'j0-',
    'k': 'k!1', 'l': 'l@2', 'm': 'm#3', 'n': 'n$4', 'o': 'o%5', 'p': 'p^6', 'q': 'q&7', 'r': 'r*8', 's': 's(9', 't': 't)0',
    'u': 'u-!', 'v': 'v=2', 'w': 'w+3', 'x': 'x/4', 'y': 'y?5', 'z': 'z>6',
    '0': '_0_', '1': '_1_', '2': '_2_', '3': '_3_', '4': '_4_', '5': '_5_', '6': '_6_', '7': '_7_', '8': '_8_', '9': '_9_',
    ' ': '___', '.': '..!', ',': ',,?', '!': '!!!', '?': '???', '-': '---'
};

const reverseMap: Record<string, string> = {};
Object.keys(cipherMap).forEach(key => {
    reverseMap[cipherMap[key]] = key;
});

function encrypt(text: string) {
    let output = '';
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        output += cipherMap[char] !== undefined ? cipherMap[char] : char;
    }
    return output;
}

function decrypt(text: string) {
    let output = '';
    let i = 0;
    while (i < text.length) {
        const chunk3 = text.substring(i, i + 3);
        if (reverseMap[chunk3]) {
            output += reverseMap[chunk3];
            i += 3;
        } else {
            output += text[i];
            i += 1;
        }
    }
    return output;
}

// --- Telegram Bot ---
const token = process.env.TELEGRAM_BOT_TOKEN;
if (token) {
    const bot = new TelegramBot(token, { polling: true });

    bot.onText(/\/start/, (msg) => {
        bot.sendMessage(msg.chat.id, "Привет! Я бот-шифратор 'Имя'.\nПросто отправь мне любой текст, и я выдам тебе зашифрованную и расшифрованную версии.");
    });

    bot.on('message', (msg) => {
        if (msg.text === '/start') return;
        const text = msg.text;
        if (!text) return;

        const encrypted = encrypt(text);
        const decrypted = decrypt(text);

        let reply = `🔒 *Зашифровано:*\n\`${encrypted}\``;
        
        if (decrypted !== text) {
            reply += `\n\n🔓 *Расшифровано:*\n\`${decrypted}\``;
        }

        bot.sendMessage(msg.chat.id, reply, { parse_mode: 'Markdown' });
    });
    console.log('Telegram bot is running...');
} else {
    console.log('TELEGRAM_BOT_TOKEN is not set. Bot is disabled.');
}
