// src/components/RoomManagementDashboard.jsx
import React, { useState } from "react";
import { Box, Button, Stack } from "@mui/material";
import RoomBooking from "./RoomBooking";
import RoomTransfer from "./RoomTransfer";
import RoomManagement from "./RoomManagement";

export default function RoomManagementDashboard() {
  const [activeTab, setActiveTab] = useState("booking");

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Button
          variant={activeTab === "booking" ? "contained" : "outlined"}
          onClick={() => setActiveTab("booking")}
        >
          Booking
        </Button>
        <Button
          variant={activeTab === "transfer" ? "contained" : "outlined"}
          onClick={() => setActiveTab("transfer")}
        >
          Transfer
        </Button>
        <Button
          variant={activeTab === "rooms" ? "contained" : "outlined"}
          onClick={() => setActiveTab("rooms")}
        >
          Room Management
        </Button>
      </Stack>

      {activeTab === "booking" && <RoomBooking />}
      {activeTab === "transfer" && <RoomTransfer />}
      {activeTab === "rooms" && <RoomManagement />}
    </Box>
  );
}
