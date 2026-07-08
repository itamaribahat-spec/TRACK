const { open, Protocol, SimConnectPeriod, SimConnectDataType } = require('node-simconnect');
const http = require('http');

console.log("=========================================");
console.log("    ITAMAR ADVANCED FLIGHT TRACKER       ");
console.log("=========================================");

let currentTelemetry = {
    lat: 32.0055,
    lon: 34.8854,
    hdg: 0,
    alt: 0,   // גובה ברגל
    speed: 0  // מהירות בקשרים
};

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    
    if (req.url === '/data') {
        res.writeHead(200);
        res.end(JSON.stringify(currentTelemetry));
    } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: "Not Found" }));
    }
});


server.listen(3000, () => {
    console.log("[SERVER] Flight Deck Link live on http://localhost:3000/data");
    console.log("Connecting to MSFS 2024 Engine...");
});

const selectedProtocol = Protocol.KittyHawk || Protocol.FSX_SP2;

open('Itamar Advanced Tracker', selectedProtocol)
    .then(function ({ recvOpen, handle }) {
        console.log(`[CONNECTED] Linked to Sim Engine: ${recvOpen.applicationName}`);

        const DEFINITION_ID = 1;
        const REQUEST_ID = 1;
        const USER_AIRCRAFT_ID = 0;

        handle.addToDataDefinition(DEFINITION_ID, 'PLANE LATITUDE', 'degrees', SimConnectDataType.FLOAT64);
        handle.addToDataDefinition(DEFINITION_ID, 'PLANE LONGITUDE', 'degrees', SimConnectDataType.FLOAT64);
        handle.addToDataDefinition(DEFINITION_ID, 'PLANE HEADING DEGREES TRUE', 'degrees', SimConnectDataType.FLOAT64);
        handle.addToDataDefinition(DEFINITION_ID, 'INDICATED ALTITUDE', 'feet', SimConnectDataType.FLOAT64);
        handle.addToDataDefinition(DEFINITION_ID, 'AIRSPEED INDICATED', 'knots', SimConnectDataType.FLOAT64);

        setInterval(() => {
            handle.requestDataOnSimObject(REQUEST_ID, DEFINITION_ID, USER_AIRCRAFT_ID, SimConnectPeriod.ONCE);
        }, 100); 

        handle.on('simObjectData', (recvSimObjectData) => {
            if (recvSimObjectData.requestID === REQUEST_ID) {
                const dataCursor = recvSimObjectData.data;
                
                const lat = dataCursor.readFloat64();
                const lon = dataCursor.readFloat64();
                const hdg = dataCursor.readFloat64();
                const alt = dataCursor.readFloat64();
                const speed = dataCursor.readFloat64();

                if (lat !== 0 && lon !== 0) {
                    currentTelemetry.lat = lat;
                    currentTelemetry.lon = lon;
                    currentTelemetry.hdg = hdg;
                    currentTelemetry.alt = alt;
                    currentTelemetry.speed = speed;

                    process.stdout.write(`\r[FLYING] ALT: ${Math.round(alt)} FT | SPD: ${Math.round(speed)} KT | HDG: ${hdg.toFixed(1)}°`);
                }
            }
        });

        handle.on('quit', () => {
            console.log("\n[QUIT] Simulator closed down.");
            process.exit(0);
        });
    })
   function renderLogbook() {
    const box = document.getElementById('log-list');
    if (flightLogbook.length === 0) {
        box.innerHTML = "<div style='color:#555; padding:10px;'>No flight logs preserved.</div>";
        return;
    }
    box.innerHTML = flightLogbook.map(log => `
        <div class="log-item">
            <div class="log-content">
                <span class="log-route" style="cursor:pointer;" onclick="drawRouteOnMap('${log.route}'); document.getElementById('route-status').innerText = 'FMC VIEW: ' + '${log.route}';" title="לחץ להצגה על המפה">${log.route}</span>
                <span class="log-time">${log.time}</span>
            </div>
            <div class="log-actions">
                <button class="action-btn" onclick="drawRouteOnMap('${log.route}'); document.getElementById('route-status').innerText = 'FMC VIEW: ' + '${log.route}';" title="הצג על המפה">👁️</button>
                <button class="action-btn" onclick="editLog(${log.id})" title="ערוך נתיב">✏️</button>
                <button class="action-btn" onclick="deleteLog(${log.id})" title="מחק טיסה">❌</button>
            </div>
        </div>
    `).join('');
}