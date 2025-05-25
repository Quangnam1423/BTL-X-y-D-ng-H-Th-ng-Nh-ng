const db = require('../config/firebase');
const pool = require('../config/mysql');

function calculateLPI(r, g, b, c = 0, lux = 0) {
    const LUX_norm = lux / 1000;
    const color_variance = (Math.abs(r - g) + Math.abs(g - b) + Math.abs(b - r)) / (r + g + b + 1e-5);
    const blue_ratio = b / (r + g + b + 1e-5);
    return 0.6 * LUX_norm + 0.25 * color_variance + 0.15 * blue_ratio;
}

async function fetchNewSensorDataAndSaveLPI() {
    const snapshot = await db.ref('sensorData').once('value');
    const data = snapshot.val();

    if (!data) {
        console.log('No sensor data found');
        return;
    }

    const conn = await pool.getConnection();

    try {
        // Lấy datetime mới nhất từ DB
        const [rows] = await conn.query('SELECT datetime FROM sensor_lpi ORDER BY datetime DESC LIMIT 1');
        const latestDatetime = rows.length > 0 ? new Date(rows[0].datetime) : new Date(0);

        // Gom tất cả record có datetime > latestDatetime
        const allRecords = [];

        for (const key in data) {
            const record = data[key];

            // Dạng phẳng
            if ('r' in record && 'g' in record && 'b' in record && 'lux' in record && 'datetime' in record) {
                const recordDate = new Date(record.datetime);
                if (recordDate > latestDatetime) {
                    allRecords.push({
                        r: record.r ?? 0,
                        g: record.g ?? 0,
                        b: record.b ?? 0,
                        c: record.c ?? 0,
                        lux: record.lux ?? 0,
                        datetime: recordDate
                    });
                }
            }

            // Dạng sensors.sensor1
            else if (record.sensors && record.sensors.sensor1) {
                const sensorData = record.sensors.sensor1;
                for (const datetime in sensorData) {
                    const entry = sensorData[datetime];
                    const recordDate = new Date(datetime);
                    if (recordDate > latestDatetime) {
                        allRecords.push({
                            r: entry.r ?? 0,
                            g: entry.g ?? 0,
                            b: entry.b ?? 0,
                            c: entry.c ?? 0,
                            lux: entry.lux ?? 0,
                            datetime: recordDate
                        });
                    }
                }
            }
        }

        // Sắp xếp theo datetime tăng dần
        allRecords.sort((a, b) => a.datetime - b.datetime);

        // Gộp mỗi 6 bản ghi thành 1
        let insertedCount = 0;
        for (let i = 0; i < allRecords.length; i += 6) {
            const batch = allRecords.slice(i, i + 6);
            if (batch.length < 6) break; // bỏ qua nếu chưa đủ 6

            const avg = {
                r: 0, g: 0, b: 0, c: 0, lux: 0
            };

            for (const rec of batch) {
                avg.r += rec.r;
                avg.g += rec.g;
                avg.b += rec.b;
                avg.c += rec.c;
                avg.lux += rec.lux;
            }

            // Trung bình
            avg.r /= 6;
            avg.g /= 6;
            avg.b /= 6;
            avg.c /= 6;
            avg.lux /= 6;

            const lpi = calculateLPI(avg.r, avg.g, avg.b, avg.c, avg.lux);
            const datetime = batch[5].datetime; // dùng thời gian trễ nhất trong nhóm

            await conn.execute(
                `INSERT INTO sensor_lpi (r, g, b, c, lux, datetime, lpi) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [avg.r, avg.g, avg.b, avg.c, avg.lux, datetime, lpi]
            );

            insertedCount++;
        }

        console.log(`✅ Inserted ${insertedCount} LPI records (batched by 6)`);
    } catch (err) {
        console.error('❌ Error inserting data:', err);
    } finally {
        conn.release();
    }
}

module.exports = { fetchNewSensorDataAndSaveLPI };
