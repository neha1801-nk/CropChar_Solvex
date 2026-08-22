import React, { useState, useEffect } from "react";
import RiskMap from "./RiskMap";
import { IconLeaf, IconPlus, IconCheck, IconTruck, IconInfo, IconMapPin } from "./Icons";
import { api } from "../api/client";

const DEFAULT_FARMER_FIELDS = [
  {
    id: "F0001",
    field_id: "F0001",
    name: "Patiala North Sector A",
    farmer_id: "farmer_9876",
    farmer_name: "Gurpreet Singh",
    crop_type: "Paddy",
    area_acres: 5.5,
    estimated_residue_tons: 4.5,
    planting_month: "June",
    harvest_month: "October",
    state: "Punjab",
    district: "Patiala",
    village: "Nabaha",
    risk_score: 93,
    top_reasons: ["Sowing deadline approaching", "History of burning on this field", "High residue load"],
    countdown_hours: 192,
    status: "offered",
    geometry: {
      type: "Polygon",
      coordinates: [[[76.3800, 30.3400], [76.3850, 30.3400], [76.3850, 30.3440], [76.3800, 30.3440], [76.3800, 30.3400]]]
    },
    offer: {
      offer_id: "offer-F0001-demo",
      company_id: "COMP-001",
      company_name: "ABC Biomass Pvt. Ltd.",
      distance_km: 12.4,
      price_per_ton: 2400.0,
      estimated_quantity_tons: 4.5,
      total_offer_value: 10800.0,
      notes: "Interested in purchasing stubble residue for bio-char processing.",
      status: "pending_farmer_response",
      timestamp: "2026-08-16T10:00:00Z"
    }
  }
];

export default function FarmerView() {
  const [activeTab, setActiveTab] = useState("overview"); // overview, fields, intervention, requests
  const [fields, setFields] = useState(DEFAULT_FARMER_FIELDS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Farmer & Agricultural Inputs State
  const [farmerName, setFarmerName] = useState(localStorage.getItem("username") || "Gurpreet Singh");
  const [cropType, setCropType] = useState("Paddy");
  const [customCrop, setCustomCrop] = useState("");
  const [plantingMonth, setPlantingMonth] = useState("June");
  const [harvestMonth, setHarvestMonth] = useState("October");
  const [areaAcres, setAreaAcres] = useState("5.5");
  const [areaUnit, setAreaUnit] = useState("Acres");
  const [pickedLocation, setPickedLocation] = useState({ lat: 30.3400, lng: 76.3800 });

  const fetchFarmerFields = async () => {
    try {
      const userId = localStorage.getItem("user_id") || "farmer_9876";
      const res = await api.get(`/fields?farmer_id=${encodeURIComponent(userId)}`);
      if (res.data && res.data.length > 0) {
        setFields(prev => {
          if (!prev || prev.length === 0) return res.data;
          const prevMap = new Map(prev.map(f => [f.id || f.field_id, f]));
          return res.data.map(item => {
            const local = prevMap.get(item.id || item.field_id);
            if (local && (local.status === "consented" || local.status === "monitoring") && item.status === "offered") {
              return { ...item, status: local.status, offer: local.offer };
            }
            return item;
          });
        });
      } else {
        setFields(prev => (prev && prev.length > 0 ? prev : DEFAULT_FARMER_FIELDS.filter(f => f.farmer_id === userId || userId === "farmer_9876")));
      }
    } catch (err) {
      console.error("Error fetching farmer fields:", err);
      const userId = localStorage.getItem("user_id") || "farmer_9876";
      setFields(prev => (prev && prev.length > 0 ? prev : DEFAULT_FARMER_FIELDS.filter(f => f.farmer_id === userId || userId === "farmer_9876")));
    }
  };

  useEffect(() => {
    fetchFarmerFields();
  }, []);

  const handleConsentAction = async (fieldId, accepted) => {
    const targetStatus = accepted ? "consented" : "monitoring";

    // Optimistic UI state update so button click takes effect immediately
    setFields(prevFields =>
      prevFields.map(f => {
        if (f.id === fieldId || f.field_id === fieldId) {
          return {
            ...f,
            status: targetStatus,
            offer: f.offer
              ? { ...f.offer, status: accepted ? "accepted" : "declined" }
              : null,
            opportunity_expired: false
          };
        }
        return f;
      })
    );

    try {
      await api.post(`/fields/${fieldId}/consent`, { accepted });
    } catch (err) {
      console.warn("Backend submit notice (applied local state update):", err);
    }
  };

  const handleRegisterFieldSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const numericArea = parseFloat(areaAcres) * (areaUnit === "Hectares" ? 2.471 : 1.0);
    const userId = localStorage.getItem("user_id") || "farmer_9876";

    const payload = {
      crop_type: cropType,
      custom_crop_type: customCrop || undefined,
      harvest_month: harvestMonth,
      area_acres: numericArea,
      planting_month: plantingMonth,
      latitude: pickedLocation.lat,
      longitude: pickedLocation.lng,
      state: "Punjab",
      district: "Patiala",
      village: "Patiala Sector",
      farmer_id: userId,
      farmer_name: farmerName || "Gurpreet Singh"
    };

    try {
      const res = await api.post("/fields", payload);
      if (res.data && res.data.id) {
        setFields(prev => [...prev.filter(f => f.id !== res.data.id), res.data]);
      }
      await fetchFarmerFields();
      setShowAddModal(false);
      setActiveTab("fields");
    } catch (err) {
      console.error("Error registering field:", err);
      // Fallback local field creation for immediate feedback
      const localId = `F0${Math.floor(100 + Math.random() * 900)}`;
      const newCreatedField = {
        id: localId,
        field_id: localId,
        name: `Patiala Sector ${localId}`,
        farmer_id: userId,
        farmer_name: farmerName || "Gurpreet Singh",
        crop_type: cropType,
        area_acres: numericArea,
        estimated_residue_tons: Math.round(numericArea * 0.82 * 10) / 10,
        planting_month: plantingMonth,
        harvest_month: harvestMonth,
        state: "Punjab",
        district: "Patiala",
        village: "Patiala Sector",
        risk_score: 85,
        top_reasons: ["Sowing deadline approaching", "High residue load"],
        countdown_hours: 192,
        status: "monitoring",
        geometry: {
          type: "Polygon",
          coordinates: [[
            [pickedLocation.lng - 0.0025, pickedLocation.lat - 0.0025],
            [pickedLocation.lng + 0.0025, pickedLocation.lat - 0.0025],
            [pickedLocation.lng + 0.0025, pickedLocation.lat + 0.0025],
            [pickedLocation.lng - 0.0025, pickedLocation.lat + 0.0025],
            [pickedLocation.lng - 0.0025, pickedLocation.lat - 0.0025]
          ]]
        },
        offer: null,
        verification: null,
        opportunity_expired: false
      };
      setFields(prev => [...prev, newCreatedField]);
      setShowAddModal(false);
      setActiveTab("fields");
    } finally {
      setLoading(false);
    }
  };

  const pendingOffersCount = fields.filter(f => f.status === "offered").length;
  const activeRequestsCount = fields.filter(f => f.status === "monitoring" || f.status === "offered" || f.status === "consented").length;
  const completedCount = fields.filter(f => f.status === "resolved").length;

  return (
    <div style={styles.container}>
      {/* Top Action Header */}
      <div style={styles.topHeader}>
        <div>
          <h2 style={styles.welcomeTitle}>Farmer Dashboard</h2>
          <p style={styles.welcomeSub}>Provide agricultural crop inputs and manage biomass recovery purchasing offers</p>
        </div>
        <button style={styles.addFieldBtn} onClick={() => setShowAddModal(true)}>
          <IconPlus size={18} /> Register New Field
        </button>
      </div>

      {/* Tabs */}
      <div style={styles.navTabs}>
        <button 
          style={{ ...styles.tabBtn, borderBottom: activeTab === "overview" ? "3px solid #059669" : "none", color: activeTab === "overview" ? "#059669" : "#64748b" }}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button 
          style={{ ...styles.tabBtn, borderBottom: activeTab === "fields" ? "3px solid #059669" : "none", color: activeTab === "fields" ? "#059669" : "#64748b" }}
          onClick={() => setActiveTab("fields")}
        >
          My Fields ({fields.length})
        </button>
        <button 
          style={{ ...styles.tabBtn, borderBottom: activeTab === "intervention" ? "3px solid #059669" : "none", color: activeTab === "intervention" ? "#059669" : "#64748b" }}
          onClick={() => setActiveTab("intervention")}
        >
          Biomass Recovery Notifications {pendingOffersCount > 0 && <span style={styles.badgeCount}>{pendingOffersCount}</span>}
        </button>
        <button 
          style={{ ...styles.tabBtn, borderBottom: activeTab === "requests" ? "3px solid #059669" : "none", color: activeTab === "requests" ? "#059669" : "#64748b" }}
          onClick={() => setActiveTab("requests")}
        >
          My Transactions
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div style={styles.tabContent}>
          <div style={styles.kpiGrid}>
            <div style={styles.kpiCard}>
              <div style={styles.kpiIconBox}><IconLeaf size={22} color="#059669" /></div>
              <div>
                <div style={styles.kpiLabel}>Registered Fields</div>
                <div style={styles.kpiValue}>{fields.length}</div>
              </div>
            </div>

            <div style={{ ...styles.kpiCard, borderColor: pendingOffersCount > 0 ? "#fde68a" : "#e2e8f0" }}>
              <div style={{ ...styles.kpiIconBox, background: "#fffbeb" }}><IconInfo size={22} color="#d97706" /></div>
              <div>
                <div style={styles.kpiLabel}>Pending Biomass Offers</div>
                <div style={{ ...styles.kpiValue, color: pendingOffersCount > 0 ? "#d97706" : "#0f172a" }}>{pendingOffersCount}</div>
              </div>
            </div>

            <div style={styles.kpiCard}>
              <div style={styles.kpiIconBox}><IconTruck size={22} color="#2563eb" /></div>
              <div>
                <div style={styles.kpiLabel}>Active Requests</div>
                <div style={styles.kpiValue}>{activeRequestsCount}</div>
              </div>
            </div>

            <div style={styles.kpiCard}>
              <div style={{ ...styles.kpiIconBox, background: "#ecfdf5" }}><IconCheck size={22} color="#059669" /></div>
              <div>
                <div style={styles.kpiLabel}>Completed Recovery</div>
                <div style={{ ...styles.kpiValue, color: "#059669" }}>{completedCount}</div>
              </div>
            </div>
          </div>

          <div style={styles.sectionBox}>
            <h3 style={styles.sectionTitle}>Latest Biomass Recovery & Purchase Offers</h3>
            {fields.length === 0 ? (
              <p style={{ color: "#64748b" }}>No registered fields yet. Click "Register New Field" above to provide your crop information.</p>
            ) : (
              <div style={styles.noticeList}>
                {fields.map(f => (
                  <div key={f.id} style={styles.interventionCard}>
                    <div style={styles.interventionHeader}>
                      <strong>FIELD {f.id} ({f.name})</strong>
                      <span style={styles.cropTag}>{f.crop_type} • {f.area_acres} Acres</span>
                    </div>

                    {f.status === "monitoring" && (
                      <div style={styles.statusBoxInfo}>
                        <h4 style={{ color: "#047857", marginBottom: "4px" }}>BIOMASS INTERVENTION</h4>
                        <p>Your field has been identified as having residue-disposal risk.</p>
                        <p>Biomass buyers have been notified of residue availability.</p>
                        <div style={styles.statusLine}>Status: <strong style={{ color: "#d97706" }}>Waiting for buyer interest</strong></div>
                      </div>
                    )}

                    {f.status === "offered" && f.offer && (
                      <div style={styles.statusBoxOffer}>
                        <h4 style={{ color: "#1d4ed8", marginBottom: "8px" }}>NEW BIOMASS OFFER RECEIVED</h4>
                        <div style={styles.offerDetailGrid}>
                          <div><strong>Buyer:</strong> {f.offer.company_name}</div>
                          <div><strong>Crop:</strong> {f.crop_type}</div>
                          <div><strong>Estimated Quantity:</strong> {f.offer.estimated_quantity_tons || 4.5} tons</div>
                          <div><strong>Price per ton:</strong> <span style={{ color: "#059669", fontWeight: "bold" }}>₹{f.offer.price_per_ton}</span> / ton</div>
                          <div><strong>Estimated Value:</strong> <span style={{ color: "#059669", fontSize: "1.1rem", fontWeight: "bold" }}>₹{f.offer.total_offer_value?.toLocaleString()}</span></div>
                        </div>

                        <div style={styles.actionBtnRow}>
                          <button style={styles.declineBtn} onClick={() => handleConsentAction(f.id, false)}>Decline</button>
                          <button style={styles.acceptBtn} onClick={() => handleConsentAction(f.id, true)}>Accept Offer</button>
                        </div>
                      </div>
                    )}

                    {f.status === "consented" && (
                      <div style={styles.statusBoxSuccess}>
                        <p style={{ color: "#047857", fontWeight: "bold", fontSize: "0.95rem" }}>✓ Offer Accepted</p>
                        <p style={{ color: "#047857" }}>✓ Biomass Recovery Confirmed</p>
                        <div style={styles.statusLine}>Status: <strong style={{ color: "#2563eb" }}>Pickup Pending</strong></div>
                      </div>
                    )}

                    {f.status === "resolved" && (
                      <div style={styles.statusBoxSuccess}>
                        <p style={{ color: "#047857", fontWeight: "bold" }}>✓ Biomass Collection Completed</p>
                        <p style={{ fontSize: "0.85rem", color: "#64748b" }}>Residue successfully collected by aggregator.</p>
                      </div>
                    )}

                    {f.opportunity_expired && (
                      <div style={styles.statusBoxExpired}>
                        <p style={{ color: "#64748b" }}>Opportunity expired — No buyer interest</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MY FIELDS */}
      {activeTab === "fields" && (
        <div style={styles.tabContent}>
          <div style={styles.fieldGrid}>
            {fields.map(f => {
              const estResidue = f.estimated_residue_tons || Math.round(f.area_acres * 0.82 * 10) / 10;
              const estValue = f.offer?.total_offer_value || Math.round(estResidue * 2400);
              return (
                <div key={f.id} style={styles.fieldCard}>
                  <div style={styles.fieldCardHeader}>
                    <h4 style={{ fontFamily: "Outfit, sans-serif", fontSize: "1.1rem" }}>Field {f.id}</h4>
                    <span style={styles.districtBadge}>{f.district}</span>
                  </div>
                  <div style={styles.fieldDetailsList}>
                    <div><strong>Farmer Name:</strong> <span style={{ fontWeight: "700", color: "#0f172a" }}>{f.farmer_name || "Gurpreet Singh"}</span></div>
                    <div><strong>Crop Type:</strong> {f.crop_type}</div>
                    <div><strong>Field Area:</strong> {f.area_acres} acres</div>
                    <div><strong>Est. Biomass Residue:</strong> <span style={{ color: "#059669", fontWeight: "700" }}>{estResidue} Tons</span></div>
                    <div><strong>Est. Market Value:</strong> <span style={{ color: "#059669", fontWeight: "700" }}>₹{estValue.toLocaleString()}</span></div>
                    <div><strong>Planting Month:</strong> <span style={{ color: "#059669", fontWeight: "600" }}>{f.planting_month}</span></div>
                    <div><strong>Approximate Harvest:</strong> <span style={{ color: "#059669", fontWeight: "600" }}>{f.harvest_month}</span></div>
                    <div><strong>Location:</strong> {f.village}, {f.district}</div>
                    <div>
                      <strong>Biomass Status:</strong>{" "}
                      <span style={{
                        padding: "2px 8px",
                        borderRadius: "12px",
                        fontSize: "0.75rem",
                        fontWeight: "700",
                        background: f.status === "offered" ? "#eff6ff" : f.status === "consented" || f.status === "resolved" ? "#ecfdf5" : "#fffbeb",
                        color: f.status === "offered" ? "#2563eb" : f.status === "consented" || f.status === "resolved" ? "#047857" : "#d97706",
                        border: `1px solid ${f.status === "offered" ? "#bfdbfe" : f.status === "consented" || f.status === "resolved" ? "#a7f3d0" : "#fde68a"}`
                      }}>
                        {f.status === "monitoring" ? "Listed in Marketplace (Waiting for Buyer)" :
                         f.status === "offered" ? "New Offer Received" :
                         f.status === "consented" ? "Offer Accepted (Pickup Pending)" : "Collection Completed"}
                      </span>
                    </div>
                  </div>
                  <div style={styles.fieldCardFooter}>
                    <button style={styles.secondaryBtn} onClick={() => setActiveTab("intervention")}>Manage Biomass Offers</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: BIOMASS NOTIFICATIONS */}
      {activeTab === "intervention" && (
        <div style={styles.tabContent}>
          <h3 style={{ marginBottom: "1rem", fontFamily: "Outfit, sans-serif" }}>Biomass Opportunities & Received Offers</h3>
          <div style={styles.noticeList}>
            {fields.map(f => {
              const estResidue = f.estimated_residue_tons || Math.round(f.area_acres * 0.82 * 10) / 10;
              const estValue = f.offer?.total_offer_value || Math.round(estResidue * 2400);
              return (
                <div key={f.id} style={styles.interventionCard}>
                  <div style={styles.interventionHeader}>
                    <strong>FIELD {f.id} — {f.name} ({f.district})</strong>
                    <span style={styles.cropTag}>{f.crop_type} • {f.area_acres} Acres ({estResidue} Tons Residue)</span>
                  </div>

                  {f.status === "monitoring" && (
                    <div style={styles.statusBoxInfo}>
                      <h4 style={{ color: "#047857", marginBottom: "4px" }}>BIOMASS MARKETPLACE OPPORTUNITY LINKED</h4>
                      <p>Your crop field has been registered and linked to CropChar's Biomass Marketplace.</p>
                      <p>Estimated residue available for bio-char/energy processing: <strong>{estResidue} Tons</strong> (Est. Value: ₹{estValue.toLocaleString()}).</p>
                      <div style={{ marginTop: "6px" }}>
                        Market Status: <strong style={{ color: "#d97706" }}>Listed in Marketplace — Waiting for buyer interest</strong>
                      </div>
                    </div>
                  )}

                  {f.status === "offered" && f.offer && (
                    <div style={styles.statusBoxOffer}>
                      <h4 style={{ color: "#1d4ed8", marginBottom: "8px" }}>NEW BIOMASS OFFER RECEIVED</h4>
                      <div style={styles.offerDetailGrid}>
                        <div><strong>Buyer:</strong> {f.offer.company_name}</div>
                        <div><strong>Farmer:</strong> {f.farmer_name || "Gurpreet Singh"}</div>
                        <div><strong>Crop:</strong> {f.crop_type}</div>
                        <div><strong>Estimated Quantity:</strong> {f.offer.estimated_quantity_tons || estResidue} tons</div>
                        <div><strong>Price per Ton:</strong> ₹{f.offer.price_per_ton} / ton</div>
                        <div><strong>Total Offer Value:</strong> <span style={{ color: "#059669", fontSize: "1.1rem", fontWeight: "bold" }}>₹{f.offer.total_offer_value?.toLocaleString() || estValue.toLocaleString()}</span></div>
                      </div>
                      <div style={styles.actionBtnRow}>
                        <button style={styles.declineBtn} onClick={() => handleConsentAction(f.id, false)}>Decline</button>
                        <button style={styles.acceptBtn} onClick={() => handleConsentAction(f.id, true)}>Accept Offer</button>
                      </div>
                    </div>
                  )}

                  {f.status === "consented" && (
                    <div style={styles.statusBoxSuccess}>
                      <p style={{ color: "#047857", fontWeight: "bold", fontSize: "0.95rem" }}>✓ Offer Accepted</p>
                      <p style={{ color: "#047857" }}>✓ Biomass Recovery & Pickup Confirmed with Buyer</p>
                      <div>Status: <strong style={{ color: "#2563eb" }}>Aggregator Pickup Pending</strong></div>
                    </div>
                  )}

                  {f.status === "resolved" && (
                    <div style={styles.statusBoxSuccess}>
                      <p style={{ color: "#047857", fontWeight: "bold" }}>✓ Biomass Collection Completed</p>
                      <p style={{ fontSize: "0.85rem", color: "#64748b" }}>Residue successfully collected by aggregator.</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: MY TRANSACTIONS */}
      {activeTab === "requests" && (
        <div style={styles.tabContent}>
          <div style={styles.tableCard}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Field ID</th>
                  <th style={styles.th}>Farmer Name</th>
                  <th style={styles.th}>Crop Type</th>
                  <th style={styles.th}>Area</th>
                  <th style={styles.th}>Est. Biomass Residue</th>
                  <th style={styles.th}>Est. Value</th>
                  <th style={styles.th}>Location</th>
                  <th style={styles.th}>Biomass Marketplace Status</th>
                </tr>
              </thead>
              <tbody>
                {fields.map(f => {
                  const estResidue = f.estimated_residue_tons || Math.round(f.area_acres * 0.82 * 10) / 10;
                  const estValue = f.offer?.total_offer_value || Math.round(estResidue * 2400);
                  return (
                    <tr key={f.id} style={styles.tr}>
                      <td style={styles.td}><strong>{f.id}</strong></td>
                      <td style={styles.td}><strong>{f.farmer_name || "Gurpreet Singh"}</strong></td>
                      <td style={styles.td}>{f.crop_type}</td>
                      <td style={styles.td}>{f.area_acres} acres</td>
                      <td style={{ ...styles.td, color: "#059669", fontWeight: "700" }}>{estResidue} Tons</td>
                      <td style={{ ...styles.td, color: "#059669", fontWeight: "700" }}>₹{estValue.toLocaleString()}</td>
                      <td style={styles.td}>{f.district}, {f.state}</td>
                      <td style={styles.td}>
                        {f.status === "monitoring" && <span style={{ color: "#d97706" }}>Listed in Marketplace (Waiting for Buyer)</span>}
                        {f.status === "offered" && <span style={{ color: "#2563eb", fontWeight: "bold" }}>Offer Received (₹{f.offer?.price_per_ton}/ton)</span>}
                        {f.status === "consented" && <span style={{ color: "#059669", fontWeight: "bold" }}>Offer Accepted (Pickup Pending)</span>}
                        {f.status === "resolved" && <span style={{ color: "#047857" }}>Collection Completed</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REGISTER NEW FIELD MODAL (Includes Agricultural Inputs as Text Fields & Location Picker) */}
      {showAddModal && (
        <div style={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Register New Agricultural Field</h3>
              <button style={styles.closeBtn} onClick={() => setShowAddModal(false)}>✕</button>
            </div>

            <form onSubmit={handleRegisterFieldSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Farmer Name</label>
                <input 
                  type="text" 
                  placeholder="Enter Farmer Name (e.g. Gurpreet Singh)"
                  value={farmerName}
                  onChange={e => setFarmerName(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Crop Type</label>
                <select value={cropType} onChange={e => setCropType(e.target.value)} style={styles.select}>
                  <option value="Paddy">Paddy (Rice Stubble)</option>
                  <option value="Wheat">Wheat Stubble</option>
                  <option value="Sugarcane">Sugarcane Trash</option>
                  <option value="Cotton">Cotton Stalks</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {cropType === "Other" && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>Enter Custom Crop Type</label>
                  <input 
                    type="text" 
                    placeholder="Enter custom crop type"
                    value={customCrop}
                    onChange={e => setCustomCrop(e.target.value)}
                    style={styles.input}
                    required
                  />
                </div>
              )}

              {/* AGRICULTURAL INPUTS AS TYPING TEXT FIELDS */}
              <div style={styles.formRow}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Planting Month</label>
                  <input 
                    type="text"
                    placeholder="e.g. June"
                    value={plantingMonth}
                    onChange={e => setPlantingMonth(e.target.value)}
                    style={styles.input}
                    required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Approximate Harvest Month</label>
                  <input 
                    type="text"
                    placeholder="e.g. October"
                    value={harvestMonth}
                    onChange={e => setHarvestMonth(e.target.value)}
                    style={styles.input}
                    required
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Field Area</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input 
                    type="number" 
                    step="0.1"
                    placeholder="e.g. 5.5"
                    value={areaAcres}
                    onChange={e => setAreaAcres(e.target.value)}
                    style={{ ...styles.input, flex: 2 }}
                    required
                  />
                  <select value={areaUnit} onChange={e => setAreaUnit(e.target.value)} style={{ ...styles.select, flex: 1 }}>
                    <option value="Acres">Acres</option>
                    <option value="Hectares">Hectares</option>
                  </select>
                </div>
              </div>

              {/* Interactive Location Picker Map */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Exact Field Location (Click Map to Select Pin)</label>
                <div style={{ fontSize: "0.8rem", color: "#059669", marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                  <IconMapPin size={14} color="#059669" /> Selected Pin: Lat {pickedLocation.lat.toFixed(4)}, Lon {pickedLocation.lng.toFixed(4)}
                </div>
                <RiskMap 
                  pickMode={true} 
                  selectedLocation={pickedLocation} 
                  onPickLocation={setPickedLocation} 
                />
              </div>

              <button type="submit" style={styles.submitBtn} disabled={loading}>
                {loading ? "Registering Field..." : "Submit Field Inputs"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { display: "flex", flexDirection: "column", gap: "1.25rem" },
  topHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" },
  welcomeTitle: { fontFamily: "Outfit, sans-serif", fontSize: "1.6rem", fontWeight: "700", color: "#0f172a" },
  welcomeSub: { fontSize: "0.88rem", color: "#64748b" },
  addFieldBtn: { background: "#059669", color: "#fff", border: "none", padding: "0.65rem 1.2rem", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "0.88rem", display: "flex", alignItems: "center", gap: "6px" },
  navTabs: { display: "flex", gap: "1.5rem", borderBottom: "1px solid #e2e8f0" },
  tabBtn: { background: "transparent", border: "none", padding: "0.8rem 0.2rem", fontWeight: "600", fontSize: "0.92rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" },
  badgeCount: { background: "#d97706", color: "#fff", padding: "2px 7px", borderRadius: "10px", fontSize: "0.72rem", fontWeight: "bold" },
  tabContent: { marginTop: "0.5rem" },
  kpiGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.5rem" },
  kpiCard: { background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "1.2rem", display: "flex", alignItems: "center", gap: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" },
  kpiIconBox: { width: "42px", height: "42px", borderRadius: "10px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" },
  kpiLabel: { fontSize: "0.82rem", color: "#64748b" },
  kpiValue: { fontSize: "1.4rem", fontWeight: "800", color: "#0f172a" },
  sectionBox: { background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" },
  sectionTitle: { fontFamily: "Outfit, sans-serif", fontSize: "1.2rem", marginBottom: "1rem", color: "#0f172a" },
  noticeList: { display: "flex", flexDirection: "column", gap: "1rem" },
  interventionCard: { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "1.25rem" },
  interventionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" },
  cropTag: { background: "#ffffff", border: "1px solid #cbd5e1", padding: "3px 8px", borderRadius: "6px", fontSize: "0.78rem", color: "#334155", fontWeight: "600" },
  statusBoxInfo: { background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "10px", padding: "1rem", lineHeight: "1.5", fontSize: "0.9rem", color: "#065f46" },
  statusBoxOffer: { background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "10px", padding: "1rem" },
  statusBoxSuccess: { background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "10px", padding: "1rem" },
  statusBoxExpired: { background: "#f1f5f9", borderRadius: "10px", padding: "1rem" },
  offerDetailGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.9rem", margin: "0.8rem 0" },
  actionBtnRow: { display: "flex", gap: "1rem", marginTop: "1rem" },
  declineBtn: { flex: 1, padding: "0.6rem", background: "#cbd5e1", color: "#0f172a", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer" },
  acceptBtn: { flex: 2, padding: "0.6rem", background: "#059669", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer" },
  fieldGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" },
  fieldCard: { background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.8rem", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" },
  fieldCardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  districtBadge: { background: "#f1f5f9", color: "#059669", padding: "2px 8px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "700" },
  fieldDetailsList: { fontSize: "0.88rem", color: "#334155", lineHeight: "1.6" },
  fieldCardFooter: { marginTop: "auto", paddingTop: "0.8rem", borderTop: "1px solid #f1f5f9" },
  secondaryBtn: { width: "100%", padding: "0.5rem", background: "#f8fafc", color: "#059669", border: "1px solid #cbd5e1", borderRadius: "8px", fontWeight: "600", cursor: "pointer" },
  tableCard: { background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" },
  table: { width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" },
  th: { background: "#f8fafc", padding: "0.8rem 1rem", borderBottom: "1px solid #e2e8f0", color: "#64748b", fontWeight: "600" },
  td: { padding: "0.9rem 1rem", borderBottom: "1px solid #f1f5f9" },
  tr: { transition: "background 0.15s" },
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, padding: "1rem" },
  modalCard: { background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "18px", padding: "1.8rem", maxWidth: "600px", width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 40px rgba(0,0,0,0.15)" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" },
  modalTitle: { fontFamily: "Outfit, sans-serif", fontSize: "1.2rem", color: "#0f172a" },
  closeBtn: { background: "transparent", border: "none", color: "#64748b", fontSize: "1.2rem", cursor: "pointer" },
  form: { display: "flex", flexDirection: "column", gap: "1rem" },
  formGroup: { display: "flex", flexDirection: "column", gap: "0.4rem" },
  formRow: { display: "flex", gap: "1rem" },
  label: { fontSize: "0.85rem", fontWeight: "600", color: "#334155" },
  input: { padding: "0.7rem", borderRadius: "8px", background: "#f8fafc", border: "1px solid #cbd5e1", color: "#0f172a", outline: "none" },
  select: { padding: "0.7rem", borderRadius: "8px", background: "#f8fafc", border: "1px solid #cbd5e1", color: "#0f172a", outline: "none" },
  submitBtn: { padding: "0.85rem", background: "#059669", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "0.95rem", marginTop: "0.5rem" }
};