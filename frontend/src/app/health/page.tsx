"use client";

import { useEffect, useState } from "react";

export default function HealthPage() {
  const [healthData, setHealthData] = useState(null);

  useEffect(() => {
    fetch("/api/health/data")
      .then((res) => res.json())
      .then(setHealthData);
  }, []);

  if (!healthData) return <div>Loading health data...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Health Hub</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Vitals</h2>
          <p>Heart Rate: {healthData.vitals.heartRate} bpm</p>
          <p>Blood Pressure: {healthData.vitals.bloodPressure}</p>
          <p>Sleep: {healthData.vitals.sleepHours} hours</p>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Recent Scans</h2>
          {healthData.scans.map((scan, i) => (
            <p key={i}>
              {scan.type}: {scan.status} (
              {new Date(scan.date).toLocaleDateString()})
            </p>
          ))}
        </div>

        <div className="bg-white p-4 rounded shadow col-span-2">
          <h2 className="text-lg font-semibold">Healing Protocols</h2>
          {healthData.protocols.map((protocol, i) => (
            <div key={i} className="mb-2">
              <p>
                {protocol.name}: {protocol.progress}%
              </p>
              <div className="w-full bg-gray-200 rounded">
                <div
                  className="bg-blue-500 h-2 rounded"
                  style={{ width: `${protocol.progress}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
