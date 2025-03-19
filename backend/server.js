// const WebSocket = require("ws");
// const BluetoothSerialPort = require("bluetooth-serial-port").BluetoothSerialPort;

// const wsServer = new WebSocket.Server({ port: 8080 });
// console.log("WebSocket server running on ws://localhost:8080");

// wsServer.on("connection", (ws) => {
//     console.log("Client connected");
    
//     ws.on("close", () => console.log("Client disconnected"));
// });

// // Bluetooth Setup
// const btSerial = new BluetoothSerialPort();
// btSerial.inquire();

// btSerial.on("found", (address, name) => {
//     console.log(`Found Bluetooth device: ${name} (${address})`);
//     if (name === "HC-05") {
//         btSerial.findSerialPortChannel(address, (channel) => {
//             btSerial.connect(address, channel, () => {
//                 console.log("Connected to HC-05!");

//                 // Create a buffer to accumulate data
//                 let dataBuffer = "";

//                 // Read data from HC-05
//                 btSerial.on("data", (buffer) => {
//                     // Log the raw buffer and its string representation
//                     console.log("Raw data buffer:", buffer);
//                     const rawData = buffer.toString("utf-8");
//                     console.log("Raw data string:", rawData);

//                     // Append the incoming data to the buffer
//                     dataBuffer += rawData;
//                     console.log("Accumulated data:", dataBuffer);

//                     // Check if the accumulated data contains a newline character
//                     if (dataBuffer.includes("\n")) {
//                         // Assume the complete fingerprint data ends with a newline
//                         const completeData = dataBuffer.trim();
//                         console.log("Complete fingerprint data:", completeData);

//                         // Reset the buffer for the next read
//                         dataBuffer = "";

//                         // Send the complete fingerprint data to all connected WebSocket clients
//                         wsServer.clients.forEach((client) => {
//                             if (client.readyState === WebSocket.OPEN) {
//                                 client.send(JSON.stringify({ fingerprintID: completeData }));
//                             }
//                         });
//                     }
//                 });
//             }, () => {
//                 console.log("Failed to connect to HC-05");
//             });
//         });
//     }
// });

// btSerial.on("finished", () => {
//     console.log("Bluetooth device scan finished");
// });


// const WebSocket = require("ws");
// const BluetoothSerialPort = require("bluetooth-serial-port").BluetoothSerialPort;
// const express = require("express");
// const cors = require("cors");

// const app = express();
// const port = 5000; // Port for the Express server
// let btSerial = null;
// let isBluetoothConnected = false;

// // Middleware
// app.use(cors());
// app.use(express.json());

// // WebSocket Server
// const wsServer = new WebSocket.Server({ port: 8080 });
// console.log("WebSocket server running on ws://localhost:8080");

// wsServer.on("connection", (ws) => {
//     console.log("Client connected");
//     ws.on("close", () => console.log("Client disconnected"));
// });

// // Function to start Bluetooth connection
// const startBluetooth = () => {
//     return new Promise((resolve, reject) => {
//         btSerial = new BluetoothSerialPort();
//         btSerial.inquire();

//         btSerial.on("found", (address, name) => {
//             console.log(`Found Bluetooth device: ${name} (${address})`);
//             if (name === "HC-05") {
//                 btSerial.findSerialPortChannel(address, (channel) => {
//                     btSerial.connect(address, channel, () => {
//                         console.log("Connected to HC-05!");
//                         isBluetoothConnected = true;

//                         // Read data from HC-05
//                         btSerial.on("data", (buffer) => {
//                             const rawData = buffer.toString("utf-8").trim();
//                             console.log("Received fingerprint ID:", rawData);

//                             // Send the fingerprint ID to all WebSocket clients
//                             wsServer.clients.forEach((client) => {
//                                 if (client.readyState === WebSocket.OPEN) {
//                                     client.send(JSON.stringify({ fingerprintID: rawData }));
//                                 }
//                             });
//                         });

//                         resolve("Bluetooth started successfully");
//                     }, () => {
//                         reject("Failed to connect to HC-05");
//                     });
//                 });
//             }
//         });

//         btSerial.on("finished", () => {
//             console.log("Bluetooth device scan finished");
//         });
//     });
// };

// // Function to stop Bluetooth connection
// const stopBluetooth = () => {
//     return new Promise((resolve) => {
//         if (btSerial) {
//             btSerial.close();
//             btSerial = null;
//             isBluetoothConnected = false;
//             console.log("Bluetooth connection stopped.");
//             resolve("Bluetooth stopped successfully");
//         } else {
//             resolve("Bluetooth was not running");
//         }
//     });
// };

// // Toggle Bluetooth endpoint
// app.post("/toggle-server", async (req, res) => {
//     const { action } = req.body;

//     try {
//         if (action === "start" && !isBluetoothConnected) {
//             const message = await startBluetooth();
//             res.json({ success: true, message });
//         } else if (action === "stop" && isBluetoothConnected) {
//             const message = await stopBluetooth();
//             res.json({ success: true, message });
//         } else {
//             res.json({ success: false, message: "Invalid action or already in the requested state" });
//         }
//     } catch (error) {
//         res.status(500).json({ success: false, message: error });
//     }
// });

// // Start Express server
// app.listen(port, () => {
//     console.log(`Express server running on http://localhost:${port}`);
// });

const WebSocket = require("ws");
const BluetoothSerialPort = require("bluetooth-serial-port").BluetoothSerialPort;
const express = require("express");
const cors = require("cors");

const app = express();
const port = 5000; // Express server port
let btSerial = null;
let isBluetoothConnected = false;

// Middleware
app.use(cors());
app.use(express.json());

// WebSocket Server on port 8080
const wsServer = new WebSocket.Server({ port: 8080 });
console.log("WebSocket server running on ws://localhost:8080");

wsServer.on("connection", (ws) => {
    console.log("Client connected");
    ws.on("close", () => console.log("Client disconnected"));
});

// Function to start Bluetooth connection
const startBluetooth = () => {
    return new Promise((resolve, reject) => {
        btSerial = new BluetoothSerialPort();
        btSerial.inquire();

        btSerial.on("found", (address, name) => {
            console.log(`Found Bluetooth device: ${name} (${address})`);
            // Update device name if your biometric scanner uses a different name
            if (name === "HC-05") {
                btSerial.findSerialPortChannel(address, (channel) => {
                    btSerial.connect(address, channel, () => {
                        console.log("Connected to HC-05!");
                        isBluetoothConnected = true;

                        // Read data from HC-05 (or your biometric scanner)
                        btSerial.on("data", (buffer) => {
                            const rawData = buffer.toString("utf-8").trim();
                            console.log("Received fingerprint ID:", rawData);

                            // Send the fingerprint ID to all WebSocket clients
                            wsServer.clients.forEach((client) => {
                                if (client.readyState === WebSocket.OPEN) {
                                    client.send(JSON.stringify({ fingerprintID: rawData }));
                                }
                            });
                        });

                        resolve("Bluetooth started successfully");
                    }, () => {
                        reject("Failed to connect to HC-05");
                    });
                });
            }
        });

        btSerial.on("finished", () => {
            console.log("Bluetooth device scan finished");
        });
    });
};

// Function to stop Bluetooth connection
const stopBluetooth = () => {
    return new Promise((resolve) => {
        if (btSerial) {
            btSerial.close();
            btSerial = null;
            isBluetoothConnected = false;
            console.log("Bluetooth connection stopped.");
            resolve("Bluetooth stopped successfully");
        } else {
            resolve("Bluetooth was not running");
        }
    });
};

// Toggle Bluetooth endpoint
app.post("/toggle-server", async (req, res) => {
    const { action } = req.body;

    try {
        if (action === "start" && !isBluetoothConnected) {
            const message = await startBluetooth();
            res.json({ success: true, message });
        } else if (action === "stop" && isBluetoothConnected) {
            const message = await stopBluetooth();
            res.json({ success: true, message });
        } else {
            res.json({ success: false, message: "Invalid action or already in the requested state" });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error });
    }
});

// Start Express server
app.listen(port, () => {
    console.log(`Express server running on http://localhost:${port}`);
});

// Enhance your existing server.js to send scanned IDs to the correct clients

// When sending data to clients, include type information
function broadcastScanData(id, sourceType) {
  wsServer.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'scan',
        id: id,
        source: sourceType // e.g., 'fingerprint', 'nfc', 'barcode'
      }));
    }
  });
}

// Only set up event handlers for testing when the devices aren't connected
let testMode = false; // Test mode is now disabled
