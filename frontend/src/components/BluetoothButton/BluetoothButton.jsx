// import React, { useState } from "react";
// import { Button } from "antd";
// import { PoweroffOutlined } from "@ant-design/icons";
// import axios from "axios";
// import { useBluetooth } from "./BluetoothContext";

// const BluetoothButton = () => {
//   const { isBluetoothConnected, setIsBluetoothConnected } = useBluetooth();
//   const [loading, setLoading] = useState(false);

//   const toggleServer = async () => {
//     setLoading(true);
//     try {
//       const response = await axios.post("https://188a-105-113-64-142.ngrok-free.app/toggle-server"
// , {
//         action: isBluetoothConnected ? "stop" : "start",
//       });
//       if (response.data.success) {
//         setIsBluetoothConnected(!isBluetoothConnected);
//       } else {
//         console.error("Failed to toggle server:", response.data.message);
//       }
//     } catch (error) {
//       console.error("Error communicating with server:", error);
//     }
//     setLoading(false);
//   };

//   return (
//     <div style={{ textAlign: "center", marginTop: "20px" }}>
//       <Button
//         type={isBluetoothConnected ? "primary" : "default"}
//         icon={<PoweroffOutlined />}
//         loading={loading}
//         onClick={toggleServer}
//         danger={isBluetoothConnected}
//       >
//         {isBluetoothConnected ? "Stop Bluetooth" : "Start Bluetooth"}
//       </Button>
//     </div>
//   );
// };

// export default BluetoothButton;

import React, { useState } from "react";
import { Button } from "antd";
import { PoweroffOutlined } from "@ant-design/icons";
import axios from "axios";
import { useBluetooth } from "./BluetoothContext";

const BluetoothButton = () => {
  const { isBluetoothConnected, setIsBluetoothConnected } = useBluetooth();
  const [loading, setLoading] = useState(false);

  const toggleServer = async () => {
    setLoading(true);
    try {
      // Change the URL to your local server address
      const response = await axios.post("http://localhost:5000/toggle-server", {
        action: isBluetoothConnected ? "stop" : "start",
      });
      if (response.data.success) {
        setIsBluetoothConnected(!isBluetoothConnected);
      } else {
        console.error("Failed to toggle server:", response.data.message);
      }
    } catch (error) {
      console.error("Error communicating with server:", error);
    }
    setLoading(false);
  };

  return (
    <div style={{ textAlign: "center", marginTop: "20px" }}>
      <Button
        type={isBluetoothConnected ? "primary" : "default"}
        icon={<PoweroffOutlined />}
        loading={loading}
        onClick={toggleServer}
        danger={isBluetoothConnected}
      >
        {isBluetoothConnected ? "Stop Bluetooth" : "Start Bluetooth"}
      </Button>
    </div>
  );
};

export default BluetoothButton;
