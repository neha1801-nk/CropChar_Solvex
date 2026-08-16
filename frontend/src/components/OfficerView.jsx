import React, { useState, useEffect } from "react";
import RiskMap from "./RiskMap";
import { IconShield, IconSatellite, IconFlame, IconCheck, IconInfo, IconAlertTriangle } from "./Icons";
import { api } from "../api/client";

const DISTRICT_OPTIONS = {
  "All Regions": ["All Districts"],
  "Punjab": ["All Districts", "Patiala", "Ludhiana", "Sangrur", "Amritsar", "Jalandhar"],
  "Haryana": ["All Districts", "Karnal", "Ambala", "Kurukshetra", "Panipat"],
  "Bihar": ["All Districts", "Rohtas", "Gaya", "Bhojpur", "Kaimur"],
  "Uttar Pradesh": ["All Districts", "Mathura", "Meerut", "Bulandshahr", "Aligarh"]
};

const DEFAULT_OFFICER_FIELDS = [
  {
    id: "F0024",
    field_id: "F0024",
    name: "Patiala South Field 24",
    farmer_id: "farmer_9878",
    farmer_name: "Jaswinder Pal",
    crop_type: "Paddy",
    area_acres: 6.2,
    state: "Punjab",
    district: "Patiala",
    village: "Rajpura",
    risk_score: 94,
    top_reasons: ["History of burning on this field", "Far from nearest CHC machine"],
    countdown_hours: 48,
    status: "fire_detected",
    geometry: {
      type: "Polygon",
      coordinates: [[[76.3700, 30.3300], [76.3750, 30.3300], [76.3750, 30.3340], [76.3700, 30.3340], [76.3700, 30.3300]]]
    }
  },
  {
    id: "F0001",
    field_id: "F0001",
    name: "Patiala North Sector A",
    farmer_id: "farmer_9876",
    farmer_name: "Gurpreet Singh",
    crop_type: "Paddy",
    area_acres: 5.5,
    state: "Punjab",
    district: "Patiala",
    village: "Nabaha",
    risk_score: 93,
    top_reasons: ["Sowing deadline approaching", "High residue load"],
    countdown_hours: 192,
    status: "offered",
    geometry: {
      type: "Polygon",
      coordinates: [[[76.3800, 30.3400], [76.3850, 30.3400], [76.3850, 30.3440], [76.3800, 30.3440], [76.3800, 30.3400]]]
    }
  },
  {
    id: "F0011",
    field_id: "F0011",
    name: "Karnal Rice Belt",
    farmer_id: "farmer_7702",
    farmer_name: "Anil Chaudhary",
    crop_type: "Paddy",
    area_acres: 9.2,
    state: "Haryana",
    district: "Karnal",
    village: "Indri",
    risk_score: 95,
    top_reasons: ["History of burning on this field", "High residue load"],
    countdown_hours: 36,
    status: "fire_detected",
    geometry: {
      type: "Polygon",
      coordinates: [[[77.0000, 29.6900], [77.0060, 29.6900], [77.0060, 29.6950], [77.0000, 29.6950], [77.0000, 29.6900]]]
    }
  }
];

const DEFAULT_FIRES = [
  {
    field_id: "F0024",
    district: "Patiala",
    state: "Punjab",
    detected_at: "2026-08-15 10:24 AM",
    confidence: 94,
    brightness_kelvin: 348.5,
    lat: 30.3320,
    lon: 76.3725,
    status: "awaiting_verification"
  },
  {
    field_id: "F0011",
    district: "Karnal",
    state: "Haryana",
    detected_at: "2026-08-15 09:15 AM",
    confidence: 88,
    brightness_kelvin: 339.0,
    lat: 29.6920,
    lon: 77.0030,
    status: "awaiting_verification"
  }
];

const DEFAULT_HISTORY = [
  {
    farmer_id: "farmer_9878",
    farmer_name: "Jaswinder Pal",
    field_id: "F0024",
    district: "Patiala",
    state: "Punjab",
    confirmed_incidents: 3,
    last_incident_date: "2025-10-28",
    previous_outcomes: ["Challan Issued", "Warning Served", "Repeat Burn Logged"],
    status: "Under Enforcement Review"
  },
  {
    farmer_id: "farmer_7702",
    farmer_name: "Anil Chaudhary",
    field_id: "F0011",
    district: "Karnal",
    state: "Haryana",
    confirmed_incidents: 2,
    last_incident_date: "2025-11-04",
    previous_outcomes: ["Warning Served", "Challan Pending"],
    status: "High Inspection Priority"
  }
];

export default function OfficerView() {
  const [activeTab, setActiveTab] = useState("gis_monitor"); // gis_monitor, repeat_history
  const [selectedState, setSelectedState] = useState("All Regions");
  const [selectedDistrict, setSelectedDistrict] = useState("All Districts");

  const [fields, setFields] = useState(DEFAULT_OFFICER_FIELDS);
  const [fires, setFires] = useState(DEFAULT_FIRES);
  const [stats, setStats] = useState({
    fields_monitored: 10,
    high_risk: 43,
    prevented: 128,
    active_fires: 12,
    residue_diverted_tons: 486.0,
    co2_avoided_tons: 729.0,
    pm25_avoided_tons: 18.47
  });
  const [repeatHistory, setRepeatHistory] = useState(DEFAULT_HISTORY);
  const [selectedField, setSelectedField] = useState(DEFAULT_OFFICER_FIELDS[0]);
  const [actionLoading, setActionLoading] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [actionSuccessMsg, setActionSuccessMsg] = useState("");

  const fetchOfficerData = async () => {
    try {
      const queryParams = `state=${encodeURIComponent(selectedState)}&district=${encodeURIComponent(selectedDistrict)}`;
      const [fieldsRes, firesRes, statsRes, historyRes] = await Promise.all([
        api.get(`/fields?${queryParams}`),
        api.get(`/fires?${queryParams}`),
        api.get(`/stats?${queryParams}`),
        api.get(`/officer/repeat-history?${queryParams}`)
      ]);

      const loadedFields = fieldsRes.data && fieldsRes.data.length > 0 ? fieldsRes.data : DEFAULT_OFFICER_FIELDS;
      setFields(loadedFields);
      setFires(firesRes.data && firesRes.data.length > 0 ? firesRes.data : DEFAULT_FIRES);
      setStats(statsRes.data || {
        fields_monitored: 10,
        high_risk: 43,
        prevented: 128,
        active_fires: 12,
        residue_diverted_tons: 486.0,
        co2_avoided_tons: 729.0,
        pm25_avoided_tons: 18.47
      });
      setRepeatHistory(historyRes.data && historyRes.data.length > 0 ? historyRes.data : DEFAULT_HISTORY);

      if (loadedFields.length > 0) {
        setSelectedField(loadedFields[0]);
      }
    } catch (err) {
      console.error("Error fetching officer GIS data:", err);
      setFields(DEFAULT_OFFICER_FIELDS);
      setFires(DEFAULT_FIRES);
      setRepeatHistory(DEFAULT_HISTORY);
    }
  };

  useEffect(() => {
    fetchOfficerData();
  }, [selectedState, selectedDistrict]);

  const handleStateChange = (e) => {
    const newState = e.target.value;
    setSelectedState(newState);
    setSelectedDistrict("All Districts");
  };

  // Inspect Incident Action
  const handleInspectIncident = (field) => {
    setSelectedField(field);
    setActionSuccessMsg("");
  };

  // 4 Action Controls (Dispatch Team, Mark Under Verification, Mark Verified Burn, Mark False Detection)
  const handleVerificationAction = async (actionType) => {
    if (!selectedField) return;
    setActionLoading(true);
    setActionSuccessMsg("");

    const actionLabels = {
      dispatch_ground_team: "Ground Team Dispatched to Field",
      mark_under_verification: "Marked Under Formal Verification",
      mark_verified_burn: "Verified Stubble Burn Incident Logged",
      mark_false_detection: "Marked False Detection — Alert Cleared"
    };

    const statusMap = {
      dispatch_ground_team: "ground_team_dispatched",
      mark_under_verification: "under_verification",
      mark_verified_burn: "burned",
      mark_false_detection: "monitoring"
    };

    const newStatus = statusMap[actionType] || "under_verification";
    const noteText = verificationNotes || `Action '${actionLabels[actionType] || actionType}' recorded by Nodal Officer.`;

    const updatedField = {
      ...selectedField,
      status: newStatus,
      verification: {
        action: actionType,
        notes: noteText,
        timestamp: new Date().toLocaleTimeString()
      }
    };

    // Optimistically update local UI state immediately
    setSelectedField(updatedField);
    setFields(prev => prev.map(f => f.id === selectedField.id ? updatedField : f));
    setActionSuccessMsg(`Action recorded: ${actionLabels[actionType] || actionType}`);
    setVerificationNotes("");

    try {
      await api.post(`/fires/${selectedField.id}/verify`, {
        action: actionType,
        officer_id: "OFFICER-PATIALA-01",
        notes: noteText
      });
      fetchOfficerData();
    } catch (err) {
      console.warn("Backend update notice (local optimistic state active):", err);
    } finally {
      setActionLoading(false);
    }
  };

  const availableDistricts = DISTRICT_OPTIONS[selectedState] || ["All Districts"];

  return (
    <div style={styles.container}>
      {/* Officer Header & Geographic State/District Filter Bar */}
      <div style={styles.headerBar}>
        <div>
          <h2 style={styles.title}>Government Nodal Officer Operations</h2>
          <p style={styles.sub}>Satellite Thermal Anomaly Monitoring & Ground Verification Center</p>
        </div>

        {/* Geographic State & District Filters */}
        <div style={styles.filterGroup}>
          <div style={styles.filterBox}>
            <label style={styles.filterLabel}>State / Region</label>
            <select value={selectedState} onChange={handleStateChange} style={styles.filterSelect}>
              <option value="All Regions">All Regions</option>
              <option value="Punjab">Punjab</option>
              <option value="Haryana">Haryana</option>
              <option value="Bihar">Bihar</option>
              <option value="Uttar Pradesh">Uttar Pradesh</option>
            </select>
          </div>

          <div style={styles.filterBox}>
            <label style={styles.filterLabel}>District</label>
            <select value={selectedDistrict} onChange={e => setSelectedDistrict(e.target.value)} style={styles.filterSelect}>
              {availableDistricts.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* TOP KPI BAR */}
      <div style={styles.kpiBar}>
        <div style={{ ...styles.kpiCard, borderColor: "#fecaca" }}>
          <div style={{ ...styles.kpiValue, color: "#dc2626" }}>{stats.active_fires || 12}</div>
          <div style={styles.kpiLabel}>ACTIVE SATELLITE FIRES</div>
        </div>
        <div style={{ ...styles.kpiCard, borderColor: "#fde68a" }}>
          <div style={{ ...styles.kpiValue, color: "#d97706" }}>{stats.high_risk || 43}</div>
          <div style={styles.kpiLabel}>HIGH-RISK FIELDS</div>
        </div>
        <div style={{ ...styles.kpiCard, borderColor: "#a7f3d0" }}>
          <div style={{ ...styles.kpiValue, color: "#059669" }}>{stats.prevented || 128}</div>
          <div style={styles.kpiLabel}>BURNS PREVENTED</div>
        </div>
        <div style={styles.kpiCard}>
          <div style={{ ...styles.kpiValue, color: "#059669" }}>{stats.residue_diverted_tons || 486.0} tons</div>
          <div style={styles.kpiLabel}>RESIDUE DIVERTED</div>
        </div>
        <div style={styles.kpiCard}>
          <div style={{ ...styles.kpiValue, color: "#2563eb" }}>{stats.co2_avoided_tons || 729.0} t</div>
          <div style={styles.kpiLabel}>EST. CO₂e AVOIDED</div>
        </div>

        {/* EST. PM2.5 AVOIDED KPI CARD WITH EXPLANATION */}
        <div style={{ ...styles.kpiCard, background: "#f8fafc", border: "1px solid #cbd5e1" }}>
          <div style={{ ...styles.kpiValue, color: "#7c3aed" }}>{stats.pm25_avoided_tons || 18.47} t</div>
          <div style={styles.kpiLabel}>EST. PM2.5 AVOIDED</div>
          <div style={styles.pmExplainTooltip}>
            Fine Particulate Matter (≤2.5µm Air Pollution)
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={styles.navTabs}>
        <button 
          style={{ ...styles.tabBtn, borderBottom: activeTab === "gis_monitor" ? "3px solid #dc2626" : "none", color: activeTab === "gis_monitor" ? "#dc2626" : "#64748b" }}
          onClick={() => setActiveTab("gis_monitor")}
        >
          GIS Fire Map & Incident Inspector
        </button>
        <button 
          style={{ ...styles.tabBtn, borderBottom: activeTab === "repeat_history" ? "3px solid #dc2626" : "none", color: activeTab === "repeat_history" ? "#dc2626" : "#64748b" }}
          onClick={() => setActiveTab("repeat_history")}
        >
          Repeat Burning & Enforcement Log
        </button>
      </div>

      {/* TAB 1: GIS MAP & INCIDENT INSPECTION */}
      {activeTab === "gis_monitor" && (
        <div style={styles.gridSection}>
          {/* Main Map View */}
          <div style={styles.mapSection}>
            <div style={styles.sectionHeader}>
              <h3 style={{ fontFamily: "Outfit, sans-serif" }}>Live Satellite Thermal Overview</h3>
              <span style={{ fontSize: "0.82rem", color: "#64748b" }}>State: {selectedState} | District: {selectedDistrict}</span>
            </div>
            <RiskMap 
              fields={fields} 
              fires={fires} 
              onSelectField={handleInspectIncident}
              selectedState={selectedState}
              selectedDistrict={selectedDistrict}
            />

            {/* Active Incident & Field Queue Table with Inspect Buttons */}
            <div style={{ marginTop: "1.25rem", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "12px", padding: "1rem" }}>
              <h4 style={{ fontFamily: "Outfit, sans-serif", fontSize: "1.05rem", color: "#0f172a", marginBottom: "0.75rem" }}>
                Active Incident & High-Risk Field Inspection Queue ({fields.length})
              </h4>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.84rem" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                      <th style={{ padding: "0.6rem" }}>Field ID</th>
                      <th style={{ padding: "0.6rem" }}>Farmer Name</th>
                      <th style={{ padding: "0.6rem" }}>District</th>
                      <th style={{ padding: "0.6rem" }}>Crop / Area</th>
                      <th style={{ padding: "0.6rem" }}>Risk / Status</th>
                      <th style={{ padding: "0.6rem" }}>Inspect Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map(f => {
                      const isFire = f.status === "fire_detected" || f.status === "ground_team_dispatched" || f.status === "under_verification";
                      const isSelected = selectedField && selectedField.id === f.id;
                      return (
                        <tr 
                          key={f.id} 
                          style={{ 
                            borderBottom: "1px solid #f1f5f9", 
                            background: isSelected ? "#eff6ff" : "transparent",
                            cursor: "pointer" 
                          }}
                          onClick={() => handleInspectIncident(f)}
                        >
                          <td style={{ padding: "0.65rem", fontWeight: "700" }}>{f.id}</td>
                          <td style={{ padding: "0.65rem" }}>{f.farmer_name}</td>
                          <td style={{ padding: "0.65rem" }}>{f.district}, {f.state}</td>
                          <td style={{ padding: "0.65rem" }}>{f.crop_type} ({f.area_acres} acres)</td>
                          <td style={{ padding: "0.65rem" }}>
                            <span style={{
                              padding: "2px 8px",
                              borderRadius: "12px",
                              fontSize: "0.75rem",
                              fontWeight: "700",
                              background: isFire ? "#fef2f2" : f.risk_score >= 70 ? "#fffbeb" : "#ecfdf5",
                              color: isFire ? "#dc2626" : f.risk_score >= 70 ? "#d97706" : "#047857",
                              border: `1px solid ${isFire ? "#fecaca" : f.risk_score >= 70 ? "#fde68a" : "#a7f3d0"}`
                            }}>
                              {isFire ? "ACTIVE FIRE ALERT" : f.status === "ground_team_dispatched" ? "TEAM DISPATCHED" : f.risk_score >= 70 ? `HIGH RISK (${f.risk_score})` : "MONITORED"}
                            </span>
                          </td>
                          <td style={{ padding: "0.65rem" }}>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleInspectIncident(f);
                              }}
                              style={{
                                padding: "0.4rem 0.8rem",
                                background: isSelected ? "#1d4ed8" : "#2563eb",
                                color: "#ffffff",
                                border: "none",
                                borderRadius: "6px",
                                fontWeight: "700",
                                fontSize: "0.78rem",
                                cursor: "pointer"
                              }}
                            >
                              {isSelected ? "Inspecting" : "Inspect Field"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Contextual Incident Action Panel */}
          <div style={styles.actionPanelSection}>
            {selectedField ? (
              <div style={styles.panelCard}>
                <div style={styles.panelHeader}>
                  <h3 style={styles.panelTitle}>
                    {selectedField.status === "fire_detected" ? "FIRE INCIDENT " + selectedField.id : "FIELD " + selectedField.id}
                  </h3>
                  <span style={selectedField.status === "fire_detected" ? styles.redBadge : styles.orangeBadge}>
                    {selectedField.status === "fire_detected" ? "ACTIVE FIRE" : "PREDICTED RISK"}
                  </span>
                </div>

                {/* PROMINENT ACTION TAKEN STATUS BANNER */}
                <div style={{
                  padding: "0.85rem 1rem",
                  borderRadius: "10px",
                  background: selectedField.verification ? "#ecfdf5" : selectedField.status === "ground_team_dispatched" ? "#fffbeb" : "#f8fafc",
                  border: `1px solid ${selectedField.verification ? "#a7f3d0" : selectedField.status === "ground_team_dispatched" ? "#fde68a" : "#cbd5e1"}`,
                  display: "flex",
                  flexDirection: "column",
                  gap: "3px"
                }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: "800", color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    OFFICIAL ACTION TAKEN STATUS
                  </div>
                  {selectedField.verification ? (
                    <div style={{ fontSize: "0.92rem", fontWeight: "700", color: "#047857", display: "flex", alignItems: "center", gap: "6px" }}>
                      <IconCheck size={16} color="#047857" />
                      <span>
                        ACTION TAKEN: {
                          selectedField.verification.action === "dispatch_ground_team" ? "Ground Team Dispatched to Field" :
                          selectedField.verification.action === "mark_under_verification" ? "Marked Under Formal Verification" :
                          selectedField.verification.action === "mark_verified_burn" ? "Verified Stubble Burn Logged" :
                          "False Detection Cleared"
                        }
                      </span>
                    </div>
                  ) : selectedField.status === "ground_team_dispatched" ? (
                    <div style={{ fontSize: "0.92rem", fontWeight: "700", color: "#d97706" }}>
                      ACTION TAKEN: Ground Patrol Team Dispatched
                    </div>
                  ) : (
                    <div style={{ fontSize: "0.85rem", fontWeight: "600", color: "#64748b" }}>
                      No Action Recorded Yet — Awaiting Officer Action below
                    </div>
                  )}
                  {selectedField.verification?.timestamp && (
                    <div style={{ fontSize: "0.75rem", color: "#047857", fontWeight: "500" }}>
                      Logged at {selectedField.verification.timestamp} by Nodal Officer ({selectedField.verification.officer_id || "OFFICER-PATIALA-01"})
                    </div>
                  )}
                </div>

                {/* Satellite Thermal Details */}
                <div style={styles.infoBox}>
                  <h4 style={styles.boxTitle}>SATELLITE DETECTION DETAILS</h4>
                  <div style={styles.infoGrid}>
                    <div><strong>Detection Time:</strong> 10:24 AM</div>
                    <div><strong>Satellite Confidence:</strong> <span style={{ color: "#dc2626", fontWeight: "bold" }}>94%</span></div>
                    <div><strong>Brightness (K):</strong> 348.5 K</div>
                  </div>
                </div>

                {/* Field Details */}
                <div style={styles.infoBox}>
                  <h4 style={styles.boxTitle}>FIELD & FARMER DETAILS</h4>
                  <div style={styles.infoGrid}>
                    <div><strong>Farmer Name:</strong> {selectedField.farmer_name}</div>
                    <div><strong>Crop Type:</strong> {selectedField.crop_type}</div>
                    <div><strong>Area:</strong> {selectedField.area_acres} acres</div>
                    <div><strong>Location:</strong> {selectedField.village}, {selectedField.district}, {selectedField.state}</div>
                  </div>
                </div>

                {/* Previous Burning History */}
                <div style={styles.infoBox}>
                  <h4 style={styles.boxTitle}>PREVIOUS BURNING HISTORY</h4>
                  <div style={styles.infoGrid}>
                    <div><strong>Confirmed Incidents:</strong> <span style={{ color: "#dc2626", fontWeight: "bold" }}>3</span></div>
                    <div><strong>Last Incident Date:</strong> 08 Aug 2026</div>
                  </div>
                </div>

                {/* Prevention History */}
                <div style={styles.infoBox}>
                  <h4 style={styles.boxTitle}>PREVENTION HISTORY</h4>
                  <div style={styles.infoGrid}>
                    <div><strong>ML Risk Score:</strong> {selectedField.risk_score} (HIGH)</div>
                    <div><strong>Biomass Opportunity:</strong> Created</div>
                    <div><strong>Buyer Interest:</strong> {selectedField.offer ? "Received" : "None"}</div>
                    <div><strong>Farmer Offer Status:</strong> {selectedField.offer?.status || "No Accepted Offer"}</div>
                  </div>
                </div>

                {/* 4 Bottom-Right Functional Controls */}
                <div style={styles.actionControlBox}>
                  <h4 style={{ fontSize: "0.88rem", color: "#0f172a", marginBottom: "6px", fontWeight: "700" }}>RECORD INTERVENTION OUTCOME</h4>
                  <textarea 
                    placeholder="Enter inspection & ground team verification notes..."
                    value={verificationNotes}
                    onChange={e => setVerificationNotes(e.target.value)}
                    style={styles.notesInput}
                  />

                  {actionSuccessMsg && (
                    <div style={styles.successAlert}>
                      <IconCheck size={14} color="#047857" /> {actionSuccessMsg}
                    </div>
                  )}

                  <div style={styles.actionGrid}>
                    <button 
                      style={{ ...styles.actionBtn, background: "#d97706" }} 
                      onClick={() => handleVerificationAction("dispatch_ground_team")}
                      disabled={actionLoading}
                    >
                      Dispatch Ground Team
                    </button>

                    <button 
                      style={{ ...styles.actionBtn, background: "#2563eb" }} 
                      onClick={() => handleVerificationAction("mark_under_verification")}
                      disabled={actionLoading}
                    >
                      Mark Under Verification
                    </button>

                    <button 
                      style={{ ...styles.actionBtn, background: "#dc2626" }} 
                      onClick={() => handleVerificationAction("mark_verified_burn")}
                      disabled={actionLoading}
                    >
                      Mark Verified Burn
                    </button>

                    <button 
                      style={{ ...styles.actionBtn, background: "#059669" }} 
                      onClick={() => handleVerificationAction("mark_false_detection")}
                      disabled={actionLoading}
                    >
                      Mark False Detection
                    </button>
                  </div>
                </div>

                {/* Recorded Verification & Audit Trail Summary Box */}
                {selectedField.verification && (
                  <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "10px", padding: "0.85rem", marginTop: "0.4rem" }}>
                    <h4 style={{ fontSize: "0.78rem", color: "#047857", fontWeight: "700", marginBottom: "0.4rem" }}>
                      ✓ RECORDED INTERVENTION & AUDIT LOG
                    </h4>
                    <div style={{ fontSize: "0.83rem", lineHeight: "1.5", color: "#065f46" }}>
                      <div><strong>Action Recorded:</strong> {selectedField.verification.action?.replaceAll("_", " ")?.toUpperCase()}</div>
                      <div><strong>Officer ID:</strong> {selectedField.verification.officer_id || "OFFICER-PATIALA-01"}</div>
                      <div><strong>Timestamp:</strong> {selectedField.verification.timestamp}</div>
                      <div><strong>Ground Notes:</strong> {selectedField.verification.notes}</div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={styles.emptyPanel}>
                <p>Click on any active fire point or field marker on the map to inspect incident details.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: REPEAT BURNING / ENFORCEMENT HISTORY */}
      {activeTab === "repeat_history" && (
        <div style={styles.tabContent}>
          <div style={styles.sectionHeader}>
            <h3 style={{ fontFamily: "Outfit, sans-serif" }}>Confirmed Repeat Burning & Enforcement Review Log</h3>
            <p style={{ fontSize: "0.88rem", color: "#64748b" }}>Only verified ground burn incidents contribute to confirmed history. ML predictions are not used for legal penalties.</p>
          </div>

          <div style={styles.tableCard}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Farmer / Land Identifier</th>
                  <th style={styles.th}>Field ID</th>
                  <th style={styles.th}>District</th>
                  <th style={styles.th}>State</th>
                  <th style={styles.th}>Confirmed Incidents</th>
                  <th style={styles.th}>Last Incident Date</th>
                  <th style={styles.th}>Previous Actions</th>
                  <th style={styles.th}>Enforcement Status</th>
                </tr>
              </thead>
              <tbody>
                {repeatHistory.map(row => (
                  <tr key={row.farmer_id} style={styles.tr}>
                    <td style={styles.td}><strong>{row.farmer_name}</strong> ({row.farmer_id})</td>
                    <td style={styles.td}>{row.field_id}</td>
                    <td style={styles.td}>{row.district}</td>
                    <td style={styles.td}>{row.state}</td>
                    <td style={{ ...styles.td, color: "#dc2626", fontWeight: "bold" }}>{row.confirmed_incidents} Incidents</td>
                    <td style={styles.td}>{row.last_incident_date}</td>
                    <td style={styles.td}>{row.previous_outcomes?.join(", ")}</td>
                    <td style={styles.td}>
                      <span style={{ color: "#b91c1c", background: "#fef2f2", padding: "4px 8px", borderRadius: "12px", fontSize: "0.78rem", fontWeight: "bold", border: "1px solid #fecaca" }}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { display: "flex", flexDirection: "column", gap: "1.25rem" },
  headerBar: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" },
  title: { fontFamily: "Outfit, sans-serif", fontSize: "1.6rem", fontWeight: "700", color: "#0f172a" },
  sub: { fontSize: "0.88rem", color: "#64748b" },
  filterGroup: { display: "flex", gap: "1rem" },
  filterBox: { display: "flex", flexDirection: "column", gap: "2px" },
  filterLabel: { fontSize: "0.75rem", color: "#64748b", fontWeight: "600" },
  filterSelect: { padding: "0.5rem 0.8rem", background: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "8px", outline: "none", fontWeight: "600" },
  kpiBar: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.8rem" },
  kpiCard: { background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "0.9rem", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" },
  kpiValue: { fontSize: "1.35rem", fontWeight: "800", marginBottom: "2px" },
  kpiLabel: { fontSize: "0.72rem", color: "#64748b", fontWeight: "700" },
  pmExplainTooltip: { fontSize: "0.68rem", color: "#64748b", marginTop: "4px", lineHeight: "1.2" },
  navTabs: { display: "flex", gap: "1.5rem", borderBottom: "1px solid #e2e8f0" },
  tabBtn: { background: "transparent", border: "none", padding: "0.8rem 0.2rem", fontWeight: "600", fontSize: "0.92rem", cursor: "pointer" },
  gridSection: { display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "1.5rem" },
  mapSection: { display: "flex", flexDirection: "column", gap: "0.8rem" },
  sectionHeader: { marginBottom: "0.8rem" },
  actionPanelSection: { display: "flex", flexDirection: "column" },
  panelCard: { background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.9rem", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" },
  panelHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  panelTitle: { fontFamily: "Outfit, sans-serif", fontSize: "1.15rem", color: "#0f172a" },
  redBadge: { background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca", padding: "2px 8px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "700" },
  orangeBadge: { background: "#fffbeb", color: "#b45309", border: "1px solid #fde68a", padding: "2px 8px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "700" },
  infoBox: { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "0.8rem" },
  boxTitle: { fontSize: "0.75rem", color: "#64748b", fontWeight: "700", marginBottom: "0.4rem" },
  infoGrid: { fontSize: "0.85rem", lineHeight: "1.55", color: "#334155" },
  actionControlBox: { background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "0.9rem" },
  notesInput: { width: "100%", height: "60px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#0f172a", padding: "0.5rem", fontSize: "0.85rem", outline: "none", resize: "none", marginBottom: "0.8rem" },
  successAlert: { background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#047857", padding: "0.5rem", borderRadius: "6px", fontSize: "0.8rem", marginBottom: "0.8rem", display: "flex", alignItems: "center", gap: "6px" },
  actionGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" },
  actionBtn: { padding: "0.65rem", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "700", fontSize: "0.8rem", cursor: "pointer" },
  emptyPanel: { background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "2rem", textAlign: "center", color: "#64748b", fontSize: "0.9rem" },
  tableCard: { background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", overflow: "hidden", marginTop: "1rem" },
  table: { width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" },
  th: { background: "#f8fafc", padding: "0.8rem 1rem", borderBottom: "1px solid #e2e8f0", color: "#64748b", fontWeight: "600" },
  td: { padding: "0.9rem 1rem", borderBottom: "1px solid #f1f5f9" },
  tr: { transition: "background 0.15s" }
};