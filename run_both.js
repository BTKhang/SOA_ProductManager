const { spawn } = require('child_process');
const path = require('path');
const net = require('net');

const checkPort = (port) => {
    return new Promise((resolve) => {
        const client = new net.Socket();
        client.setTimeout(800);
        client.on('connect', () => {
            client.destroy();
            resolve(true);
        });
        client.on('error', () => {
            client.destroy();
            resolve(false);
        });
        client.on('timeout', () => {
            client.destroy();
            resolve(false);
        });
        client.connect(port, '127.0.0.1');
    });
};

const startServices = async () => {
    console.log('Starting Auth Service (:3000) and Product Service (:3001)...\n');

    // Kiểm tra kết nối MySQL cổng 3306
    const isMySQLRunning = await checkPort(3306);
    if (!isMySQLRunning) {
        console.warn('⚠️  CẢNH BÁO: Không phát hiện cổng MySQL 3306 đang chạy!');
        console.warn('👉 Vui lòng khởi động WampServer (đảm bảo biểu tượng Wamp màu xanh) hoặc MySQL Server trước.\n');

        // Thử tự động kích hoạt mysqld nếu có Wamp
        try {
            spawn('C:\\wamp64\\bin\\mysql\\mysql8.4.7\\bin\\mysqld.exe', ['--defaults-file=C:\\wamp64\\bin\\mysql\\mysql8.4.7\\my.ini', '--console'], {
                detached: true,
                stdio: 'ignore'
            });
            await new Promise(r => setTimeout(r, 2000));
        } catch (e) {}
    }

    const authProcess = spawn('node', [path.join(__dirname, 'auth-service/server.js')], {
        stdio: 'inherit',
        shell: true
    });

    const productProcess = spawn('node', [path.join(__dirname, 'src/app.js')], {
        stdio: 'inherit',
        shell: true
    });

    const cleanup = () => {
        console.log('\nStopping services...');
        authProcess.kill();
        productProcess.kill();
        process.exit();
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
};

startServices();
