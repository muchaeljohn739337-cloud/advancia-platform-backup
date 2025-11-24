# Network Packet Analysis Guide

## Bluetooth, Wi-Fi, and General Network Inspection

### 🎯 Overview

This guide covers packet capture, Bluetooth handshake analysis, and Wi-Fi packet inspection for security research, network diagnostics, and IoT development.

---

## 1️⃣ Wi-Fi Packet Capture

### Prerequisites

-   **Windows**: Administrator rights, compatible Wi-Fi adapter
-   **Tools**: Wireshark, npcap driver
-   **Knowledge**: OSI Model, 802.11 protocol

### Setup Wireshark on Windows

```powershell
# Install npcap (required for packet capture)
# Download from: https://npcap.com/

# Check available network interfaces
Get-NetAdapter | Select-Object Name, Status, LinkSpeed, MacAddress

# Enable Wi-Fi adapter in monitor mode (if supported)
netsh wlan set hostednetwork mode=allow
```

### Common Wireshark Filters

```
# Wi-Fi Management Frames
wlan.fc.type == 0

# Wi-Fi Data Frames
wlan.fc.type == 2

# WPA Handshake (4-way handshake)
eapol

# Specific SSID
wlan.ssid == "YourNetworkName"

# Probe requests (device looking for networks)
wlan.fc.type_subtype == 0x04

# Beacon frames (AP advertisements)
wlan.fc.type_subtype == 0x08
```

### Capture WPA2 Handshake

```bash
# 1. Start capture on Wi-Fi interface
# 2. Filter: eapol
# 3. Deauth a client (forces re-authentication)
# 4. Capture 4-way EAPOL handshake
# 5. Export for analysis/cracking (ethical use only!)
```

---

## 2️⃣ Bluetooth Packet Analysis

### Bluetooth Stack Layers

-   **HCI (Host Controller Interface)** - Commands/events between host and controller
-   **L2CAP** - Logical Link Control and Adaptation Protocol
-   **RFCOMM** - Serial port emulation
-   **SDP** - Service Discovery Protocol
-   **ATT/GATT** - Attribute Protocol (BLE)

### Tools

#### A. Windows Built-in Commands

```powershell
# List Bluetooth devices
Get-PnpDevice -Class Bluetooth | Format-Table FriendlyName, Status, InstanceId

# Bluetooth radio info
Get-NetAdapter | Where-Object {$_.InterfaceDescription -like "*Bluetooth*"}

# Check Bluetooth services
Get-Service | Where-Object {$_.Name -like "*bluetooth*"}
```

#### B. Wireshark with Bluetooth Adapter

```
# Filters for Bluetooth
btl2cap        # L2CAP packets
bthci_cmd      # HCI commands
bthci_evt      # HCI events
btatt          # BLE ATT protocol
btgatt         # BLE GATT
```

#### C. Hardware Sniffers

-   **Ubertooth One** ($120) - Open source Bluetooth sniffer
-   **nRF52840 Dongle** ($10) - Nordic BLE sniffer
-   **Ellisys Bluetooth Analyzer** ($$$$) - Professional grade

### BLE Packet Structure

```
Preamble (1 byte)
→ Access Address (4 bytes)
  → PDU Header (2 bytes)
    → Payload (0-255 bytes)
      → CRC (3 bytes)
```

### Common Bluetooth Attacks to Monitor

-   **Bluejacking** - Sending unsolicited messages
-   **Bluesnarfing** - Unauthorized data access
-   **KNOB Attack** - Key negotiation downgrade
-   **BIAS Attack** - Bypassing secure pairing

---

## 3️⃣ General Network Packet Inspection

### PowerShell Network Monitoring

```powershell
# Real-time TCP connections
Get-NetTCPConnection | Where-Object {$_.State -eq 'Established'} |
  Select-Object LocalAddress, LocalPort, RemoteAddress, RemotePort, OwningProcess

# Monitor specific port (e.g., 4000 - your backend)
Get-NetTCPConnection -LocalPort 4000 | Format-Table

# DNS cache inspection
Get-DnsClientCache | Format-Table Name, Type, TimeToLive

# Route table
Get-NetRoute | Format-Table

# ARP cache (MAC address table)
Get-NetNeighbor | Format-Table

# Firewall rules
Get-NetFirewallRule | Where-Object {$_.Enabled -eq $true}
```

### TCP Handshake (3-Way)

```
Client → Server: SYN (Synchronize)
Server → Client: SYN-ACK (Synchronize-Acknowledge)
Client → Server: ACK (Acknowledge)
```

### Wireshark Display Filters

```
# HTTP traffic
http

# HTTPS (encrypted)
tls

# DNS queries
dns

# TCP handshake
tcp.flags.syn == 1 && tcp.flags.ack == 0

# TCP with data
tcp.len > 0

# Slow connections (retransmissions)
tcp.analysis.retransmission

# Your backend API (port 4000)
tcp.port == 4000

# Your frontend (port 3000)
tcp.port == 3000
```

---

## 4️⃣ Integration with Your SaaS Platform

### Add Network Monitoring to Advancia Pay

#### Backend API Endpoint

```typescript
// backend/src/routes/network-monitor.ts
import express from "express";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const router = express.Router();

// Get active connections
router.get("/connections", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { stdout } = await execAsync("powershell \"Get-NetTCPConnection | Where-Object {$_.State -eq 'Established'} | ConvertTo-Json\"");
    const connections = JSON.parse(stdout);
    res.json({ success: true, connections });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch connections" });
  }
});

// Get network interfaces
router.get("/interfaces", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { stdout } = await execAsync('powershell "Get-NetAdapter | Select-Object Name, Status, LinkSpeed, MacAddress | ConvertTo-Json"');
    const interfaces = JSON.parse(stdout);
    res.json({ success: true, interfaces });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch interfaces" });
  }
});

export default router;
```

#### Frontend Component

```tsx
// frontend/src/components/admin/NetworkMonitor.tsx
"use client";

import { useState, useEffect } from "react";
import adminApi from "@/lib/adminApi";

export default function NetworkMonitor() {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadConnections() {
      try {
        const { data } = await adminApi.get("/api/network/connections");
        setConnections(data.connections);
      } catch (error) {
        console.error("Failed to load connections:", error);
      } finally {
        setLoading(false);
      }
    }
    loadConnections();
    const interval = setInterval(loadConnections, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">🌐 Active Network Connections</h2>
        {loading ? (
          <div className="loading loading-spinner loading-lg"></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Local</th>
                  <th>Remote</th>
                  <th>State</th>
                  <th>PID</th>
                </tr>
              </thead>
              <tbody>
                {connections.map((conn, idx) => (
                  <tr key={idx}>
                    <td>
                      {conn.LocalAddress}:{conn.LocalPort}
                    </td>
                    <td>
                      {conn.RemoteAddress}:{conn.RemotePort}
                    </td>
                    <td>
                      <div className="badge badge-success">{conn.State}</div>
                    </td>
                    <td>{conn.OwningProcess}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 5️⃣ Security Best Practices

### Ethical Guidelines

-   ✅ Only capture packets on **your own network**
-   ✅ Get **written permission** for penetration testing
-   ✅ Comply with **local laws** (Computer Fraud and Abuse Act, GDPR)
-   ❌ Never capture/decrypt others' traffic without consent
-   ❌ Don't use captured data for unauthorized access

### Legal Packet Capture Use Cases

-   **Your own network diagnostics**
-   **IoT device development/debugging**
-   **Security auditing (authorized)**
-   **Educational/research purposes**
-   **Troubleshooting application issues**

---

## 6️⃣ Quick Reference

### Wireshark Installation

```powershell
# Download Wireshark
Start-Process "https://www.wireshark.org/download.html"

# Install npcap during Wireshark setup (required)
```

### Essential Commands

```powershell
# Network statistics
netstat -ano | findstr LISTENING
netstat -ano | findstr ESTABLISHED

# Ping with packet size
ping -l 1500 google.com

# Trace route
tracert google.com

# DNS lookup
nslookup advancia.com

# Port scan (test your own services)
Test-NetConnection -ComputerName localhost -Port 4000
```

---

## 7️⃣ Tools Summary

| Tool              | Purpose                       | Platform  | Cost      |
| ----------------- | ----------------------------- | --------- | --------- |
| **Wireshark**     | General packet analysis       | All       | Free      |
| **npcap**         | Windows packet capture driver | Windows   | Free      |
| **Ubertooth One** | Bluetooth sniffing            | All       | $120      |
| **nRF Sniffer**   | BLE packet capture            | All       | $10       |
| **tcpdump**       | CLI packet capture            | Linux/Mac | Free      |
| **Fiddler**       | HTTP/HTTPS debugging          | Windows   | Free      |
| **Burp Suite**    | Web security testing          | All       | Free/Paid |

---

## 8️⃣ Learning Resources

-   **Wireshark University** - <https://www.wireshark.org/docs/>
-   **Bluetooth SIG** - <https://www.bluetooth.com/specifications/>
-   **802.11 Standard** - Wi-Fi protocol documentation
-   **RFC 793** - TCP specification
-   **RFC 768** - UDP specification

---

## ⚠️ Disclaimer

This guide is for **educational and authorized security research only**. Unauthorized packet capture, network intrusion, or data interception may violate laws in your jurisdiction. Always obtain proper authorization before conducting any network analysis.

---

**Last Updated:** November 22, 2025
**Related Files:**

-   `backend/src/routes/network-monitor.ts` (if implemented)
-   `frontend/src/components/admin/NetworkMonitor.tsx` (if implemented)
