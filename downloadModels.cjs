const https = require('https');
const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'public', 'models');
if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
}

const baseUrl = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/';
const files = [
    'tiny_face_detector_model-weights_manifest.json',
    'tiny_face_detector_model-shard1',
    'face_landmark_68_model-weights_manifest.json',
    'face_landmark_68_model-shard1',
    'face_recognition_model-weights_manifest.json',
    'face_recognition_model-shard1',
    'face_recognition_model-shard2'
];

files.forEach(file => {
    https.get(baseUrl + file, (res) => {
        if(res.statusCode === 200) {
            const fileStream = fs.createWriteStream(path.join(modelsDir, file));
            res.pipe(fileStream);
            fileStream.on('finish', () => console.log('Downloaded', file));
        } else {
            console.log('Failed:', file, res.statusCode);
        }
    }).on('error', (err) => console.log('Error:', err));
});
