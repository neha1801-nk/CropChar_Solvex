import React, { useState, useEffect } from "react";
import RiskMap from "./RiskMap";
import { IconFactory, IconLeaf, IconTruck, IconCheck, IconSearch } from "./Icons";
import { api } from "../api/client";

const DEFAULT_OPPORTUNITIES = [
  {
    field_id: "F0001",
    name: "Patiala North Sector A",
    farmer_name: "Gurpreet Singh",
    farmer_id: "farmer_9876",
    crop_type: "Paddy",
    area_acres: 5.5,
    estimated_residue_tons: 4.5,
    state: "Punjab",
    district: "Patiala",
    village: "Nabaha",
    prevention_window_hours: 192,
    status: "monitoring",
    geometry: {
      type: "Polygon",
      coordinates: [[[76.3800, 30.3400], [76.3850, 30.3400], [76.3850, 30.3440], [76.3800, 30.3440], [76.3800, 30.3400]]]
    }
  },
  {
    field_id: "F0002",
    name: "Patiala East Sector B",
    farmer_name: "Harjit Kaur",
    farmer_id: "farmer_9877",
    crop_type: "Paddy",
    area_acres: 7.4,
    estimated_residue_tons: 6.1,
    state: "Punjab",
    district: "Patiala",
    village: "Samana",
    prevention_window_hours: 96,
    status: "monitoring",
    geometry: {
      type: "Polygon",
      coordinates: [[[76.3900, 30.3500], [76.3960, 30.3500], [76.3960, 30.3550], [76.3900, 30.3550], [76.3900, 30.3500]]]
    }
  },
  {
    field_id: "F0003",
    name: "Ludhiana Central Plot",
    farmer_name: "Sukhdev Singh",
    farmer_id: "farmer_8801",
    crop_type: "Paddy",
    area_acres: 8.0,
    estimated_residue_tons: 6.5,
    state: "Punjab",
    district: "Ludhiana",
    village: "Jagraon",
    prevention_window_hours: 120,
    status: "monitoring",
    geometry: {
      type: "Polygon",
      coordinates: [[[75.8500, 30.9000], [75.8560, 30.9000], [75.8560, 30.9050], [75.8500, 30.9050], [75.8500, 30.9000]]]
    }
  }
];

const DEFAULT_OFFERS = [
  {
    offer_id: "offer-F0001-demo",
    field_id: "F0001",
    field_name: "Patiala North Sector A",
    farmer_name: "Gurpreet Singh",
    crop_type: "Paddy",
    area_acres: 5.5,
    district: "Patiala",
    company_id: "COMP-001",
    company_name: "ABC Biomass Pvt. Ltd.",
    price_per_ton: 2400,
    estimated_quantity_tons: 4.5,
    total_offer_value: 10800,
    status: "pending_farmer_response",
    timestamp: "2026-08-16T10:00:00Z"
  }
];

export default function CompanyView() {
  const [activeTab, setActiveTab] = useState("opportunities"); // opportunities, my_offers, collection
  const [opportunities, setOpportunities] = useState(DEFAULT_OPPORTUNITIES);
  const [myOffers, setMyOffers] = useState(DEFAULT_OFFERS);
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [pricePerTon, setPricePerTon] = useState("2400");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchProcurementData = async () => {
    try {
      const [oppRes, offRes] = await Promise.all([
        api.get("/marketplace/opportunities"),
        api.get("/offers?company_id=COMP-001")
      ]);
      setOpportunities(oppRes.data && oppRes.data.length > 0 ? oppRes.data : DEFAULT_OPPORTUNITIES);
      setMyOffers(offRes.data || DEFAULT_OFFERS);
    } catch (err) {
      console.error("Error fetching biomass opportunities:", err);
      setOpportunities(DEFAULT_OPPORTUNITIES);
      setMyOffers(DEFAULT_OFFERS);
    }
  };

  useEffect(() => {
    fetchProcurementData();
  }, []);

  const handleOpenOfferModal = (opp) => {
    setSelectedOpp(opp);
    setPricePerTon("2400");
    setNotes("");
    setShowOfferModal(true);
  };

  const handleSubmitOffer = async (e) => {
    e.preventDefault();
    if (!selectedOpp) return;
    setLoading(true);

    try {
      await api.post(`/fields/${selectedOpp.field_id}/offer`, {
        company_id: "COMP-001",
        company_name: "ABC Biomass Pvt. Ltd.",
        price_per_ton: parseFloat(pricePerTon),
        notes: notes || undefined,
        distance_km: 12.4
      });

      await fetchProcurementData();
      setShowOfferModal(false);
      setActiveTab("my_offers");
    } catch (err) {
      console.error("Error submitting biomass offer:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteCollection = async (fieldId) => {
    try {
      await api.post(`/offers/${fieldId}/complete-collection`);
      await fetchProcurementData();
    } catch (err) {
      console.error("Error marking collection complete:", err);
    }
  };

  const totalAvailableTons = opportunities.reduce((acc, curr) => acc + (curr.estimated_residue_tons || 0), 0);
  const acceptedOffers = myOffers.filter(o => o.status === "accepted");
  const pendingCollectionCount = acceptedOffers.length;

  return (
    <div style={styles.container}>
      {/* Header Bar */}
      <div style={styles.topHeader}>
        <div>
          <h2 style={styles.welcomeTitle}>Biomass Buyer Procurement Portal</h2>
          <p style={styles.welcomeSub}>Discover high-risk crop residue opportunities and submit purchasing offers</p>
        </div>
        <div style={styles.companyBadge}>
          Company: ABC Biomass Pvt. Ltd. (ID: COMP-001)
        </div>
      </div>

      {/* KPI Cards */}
      <div style={styles.kpiGrid}>
        <div style={styles.kpiCard}>
          <div style={styles.kpiIconBox}><IconSearch size={22} color="#2563eb" /></div>
          <div>
            <div style={styles.kpiLabel}>Available Opportunities</div>
            <div style={{ ...styles.kpiValue, color: "#2563eb" }}>{opportunities.length}</div>
          </div>
        </div>
        <div style={styles.kpiCard}>
          <div style={styles.kpiIconBox}><IconLeaf size={22} color="#059669" /></div>
          <div>
            <div style={styles.kpiLabel}>Estimated Residue Available</div>
            <div style={{ ...styles.kpiValue, color: "#059669" }}>{totalAvailableTons.toFixed(1)} tons</div>
          </div>
        </div>
        <div style={styles.kpiCard}>
          <div style={styles.kpiIconBox}><IconFactory size={22} color="#475569" /></div>
          <div>
            <div style={styles.kpiLabel}>Offers Submitted</div>
            <div style={styles.kpiValue}>{myOffers.length}</div>
          </div>
        </div>
        <div style={styles.kpiCard}>
          <div style={{ ...styles.kpiIconBox, background: "#ecfdf5" }}><IconCheck size={22} color="#059669" /></div>
          <div>
            <div style={styles.kpiLabel}>Accepted Offers</div>
            <div style={{ ...styles.kpiValue, color: "#059669" }}>{acceptedOffers.length}</div>
          </div>
        </div>
        <div style={styles.kpiCard}>
          <div style={{ ...styles.kpiIconBox, background: "#eff6ff" }}><IconTruck size={22} color="#2563eb" /></div>
          <div>
            <div style={styles.kpiLabel}>Collection Pending</div>
            <div style={{ ...styles.kpiValue, color: "#2563eb" }}>{pendingCollectionCount}</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={styles.navTabs}>
        <button 
          style={{ ...styles.tabBtn, borderBottom: activeTab === "opportunities" ? "3px solid #2563eb" : "none", color: activeTab === "opportunities" ? "#2563eb" : "#64748b" }}
          onClick={() => setActiveTab("opportunities")}
        >
          Biomass Opportunities ({opportunities.length})
        </button>
        <button 
          style={{ ...styles.tabBtn, borderBottom: activeTab === "my_offers" ? "3px solid #2563eb" : "none", color: activeTab === "my_offers" ? "#2563eb" : "#64748b" }}
          onClick={() => setActiveTab("my_offers")}
        >
          My Offers ({myOffers.length})
        </button>
        <button 
          style={{ ...styles.tabBtn, borderBottom: activeTab === "collection" ? "3px solid #2563eb" : "none", color: activeTab === "collection" ? "#2563eb" : "#64748b" }}
          onClick={() => setActiveTab("collection")}
        >
          Collection Tracking ({pendingCollectionCount})
        </button>
      </div>

      {/* TAB 1: BIOMASS OPPORTUNITIES */}
      {activeTab === "opportunities" && (
        <div style={styles.tabContent}>
          <div style={styles.splitLayout}>
            {/* Opportunities List */}
            <div style={styles.oppListSection}>
              <h3 style={{ marginBottom: "1rem", fontFamily: "Outfit, sans-serif" }}>Available High-Risk Residue Opportunities</h3>
              <div style={styles.oppGrid}>
                {opportunities.map(opp => (
                  <div key={opp.field_id} style={styles.oppCard}>
                    <div style={styles.oppCardHeader}>
                      <strong>FIELD {opp.field_id}</strong>
                      <span style={styles.statusBadge}>Available</span>
                    </div>
                    <div style={styles.oppDetails}>
                      <div><strong>Crop:</strong> {opp.crop_type}</div>
                      <div><strong>Area:</strong> {opp.area_acres} acres</div>
                      <div><strong>Estimated Residue:</strong> <span style={{ color: "#059669", fontWeight: "bold" }}>{opp.estimated_residue_tons} tons</span></div>
                      <div><strong>Location:</strong> {opp.village}, {opp.district} ({opp.state})</div>
                      <div><strong>Prevention Window:</strong> <span style={{ color: "#d97706" }}>{opp.prevention_window_hours} hours</span></div>
                    </div>
                    <div style={styles.oppCardFooter}>
                      <button style={styles.offerBtn} onClick={() => handleOpenOfferModal(opp)}>
                        Submit Purchase Offer →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Map View */}
            <div style={styles.mapSideSection}>
              <h3 style={{ marginBottom: "1rem", fontFamily: "Outfit, sans-serif" }}>Residue Sourcing Map</h3>
              <RiskMap fields={opportunities} onSelectField={handleOpenOfferModal} />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MY OFFERS */}
      {activeTab === "my_offers" && (
        <div style={styles.tabContent}>
          <div style={styles.tableCard}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Offer ID</th>
                  <th style={styles.th}>Field ID</th>
                  <th style={styles.th}>Farmer Name</th>
                  <th style={styles.th}>Crop</th>
                  <th style={styles.th}>Est. Residue</th>
                  <th style={styles.th}>Price / Ton</th>
                  <th style={styles.th}>Total Value</th>
                  <th style={styles.th}>Offer Status</th>
                </tr>
              </thead>
              <tbody>
                {myOffers.map(off => (
                  <tr key={off.offer_id} style={styles.tr}>
                    <td style={styles.td}><strong>{off.offer_id}</strong></td>
                    <td style={styles.td}>{off.field_id}</td>
                    <td style={styles.td}>{off.farmer_name || "Local Farmer"}</td>
                    <td style={styles.td}>{off.crop_type || "Paddy"}</td>
                    <td style={styles.td}>{off.estimated_quantity_tons || 4.5} tons</td>
                    <td style={styles.td}>₹{off.price_per_ton}</td>
                    <td style={{ ...styles.td, color: "#059669", fontWeight: "bold" }}>₹{off.total_offer_value?.toLocaleString()}</td>
                    <td style={styles.td}>
                      {off.status === "pending_farmer_response" && <span style={{ color: "#d97706" }}>Pending Farmer Response</span>}
                      {off.status === "accepted" && <span style={{ color: "#059669", fontWeight: "bold" }}>Accepted by Farmer</span>}
                      {off.status === "declined" && <span style={{ color: "#dc2626" }}>Declined by Farmer</span>}
                      {off.status === "collection_completed" && <span style={{ color: "#047857" }}>Collection Completed</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: COLLECTION TRACKING */}
      {activeTab === "collection" && (
        <div style={styles.tabContent}>
          <h3 style={{ marginBottom: "1rem", fontFamily: "Outfit, sans-serif" }}>Biomass Pickup & Logistics Dispatch</h3>
          <div style={styles.oppGrid}>
            {acceptedOffers.map(off => (
              <div key={off.offer_id} style={styles.oppCard}>
                <div style={styles.oppCardHeader}>
                  <strong>FIELD {off.field_id} — {off.field_name}</strong>
                  <span style={{ color: "#059669", fontWeight: "bold", fontSize: "0.8rem" }}>Farmer Accepted</span>
                </div>
                <div style={styles.oppDetails}>
                  <div><strong>Farmer:</strong> {off.farmer_name}</div>
                  <div><strong>Location:</strong> {off.district}</div>
                  <div><strong>Biomass Load:</strong> {off.estimated_quantity_tons} tons</div>
                  <div><strong>Agreed Price:</strong> ₹{off.price_per_ton} / ton (Total: ₹{off.total_offer_value?.toLocaleString()})</div>
                </div>
                <div style={styles.oppCardFooter}>
                  <button style={styles.completeBtn} onClick={() => handleCompleteCollection(off.field_id)}>
                    Mark Biomass Collection Completed
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBMIT OFFER MODAL */}
      {showOfferModal && selectedOpp && (
        <div style={styles.modalOverlay} onClick={() => setShowOfferModal(false)}>
          <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>New Biomass Purchase Offer</h3>
              <button style={styles.closeBtn} onClick={() => setShowOfferModal(false)}>✕</button>
            </div>

            <div style={styles.oppSummaryBox}>
              <div><strong>Field ID:</strong> {selectedOpp.field_id}</div>
              <div><strong>Crop:</strong> {selectedOpp.crop_type}</div>
              <div><strong>Area:</strong> {selectedOpp.area_acres} acres</div>
              <div><strong>Estimated Quantity:</strong> {selectedOpp.estimated_residue_tons} tons</div>
              <div><strong>Location:</strong> {selectedOpp.village}, {selectedOpp.district}</div>
            </div>

            <form onSubmit={handleSubmitOffer} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Proposed Price per Ton (₹)</label>
                <input 
                  type="number" 
                  value={pricePerTon}
                  onChange={e => setPricePerTon(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.valueCalcBox}>
                <div>Estimated Total Offer Value:</div>
                <div style={styles.calcTotal}>
                  ₹{(parseFloat(pricePerTon || 0) * (selectedOpp.estimated_residue_tons || 4.5)).toLocaleString()}
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Optional Logistics / Pickup Details</label>
                <textarea 
                  placeholder="Enter logistics details e.g. Pickup scheduled within 48 hours with baler truck..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  style={{ ...styles.input, height: "70px", resize: "none" }}
                />
              </div>

              <button type="submit" style={styles.submitBtn} disabled={loading}>
                {loading ? "Submitting Offer..." : "Submit Offer to Farmer"}
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
  companyBadge: { background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1d4ed8", padding: "0.5rem 1rem", borderRadius: "20px", fontSize: "0.82rem", fontWeight: "700" },
  kpiGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" },
  kpiCard: { background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "1.2rem", display: "flex", alignItems: "center", gap: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" },
  kpiIconBox: { width: "42px", height: "42px", borderRadius: "10px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" },
  kpiLabel: { fontSize: "0.8rem", color: "#64748b" },
  kpiValue: { fontSize: "1.4rem", fontWeight: "800", color: "#0f172a" },
  navTabs: { display: "flex", gap: "1.5rem", borderBottom: "1px solid #e2e8f0" },
  tabBtn: { background: "transparent", border: "none", padding: "0.8rem 0.2rem", fontWeight: "600", fontSize: "0.92rem", cursor: "pointer" },
  tabContent: { marginTop: "0.5rem" },
  splitLayout: { display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "1.5rem" },
  oppListSection: { display: "flex", flexDirection: "column" },
  mapSideSection: { display: "flex", flexDirection: "column" },
  oppGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" },
  oppCard: { background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.8rem", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" },
  oppCardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  statusBadge: { background: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0", padding: "2px 8px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "700" },
  oppDetails: { fontSize: "0.88rem", color: "#334155", lineHeight: "1.6" },
  oppCardFooter: { marginTop: "auto", paddingTop: "0.8rem", borderTop: "1px solid #f1f5f9" },
  offerBtn: { width: "100%", padding: "0.65rem", background: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "0.88rem" },
  completeBtn: { width: "100%", padding: "0.65rem", background: "#059669", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "0.88rem" },
  tableCard: { background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" },
  table: { width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" },
  th: { background: "#f8fafc", padding: "0.8rem 1rem", borderBottom: "1px solid #e2e8f0", color: "#64748b", fontWeight: "600" },
  td: { padding: "0.9rem 1rem", borderBottom: "1px solid #f1f5f9" },
  tr: { transition: "background 0.15s" },
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, padding: "1rem" },
  modalCard: { background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "18px", padding: "1.8rem", maxWidth: "480px", width: "100%", boxShadow: "0 20px 40px rgba(0,0,0,0.15)" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" },
  modalTitle: { fontFamily: "Outfit, sans-serif", fontSize: "1.2rem", color: "#1d4ed8" },
  closeBtn: { background: "transparent", border: "none", color: "#64748b", fontSize: "1.2rem", cursor: "pointer" },
  oppSummaryBox: { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "1rem", fontSize: "0.88rem", lineHeight: "1.5", marginBottom: "1rem" },
  form: { display: "flex", flexDirection: "column", gap: "1rem" },
  formGroup: { display: "flex", flexDirection: "column", gap: "0.4rem" },
  label: { fontSize: "0.85rem", fontWeight: "600", color: "#334155" },
  input: { padding: "0.75rem", borderRadius: "8px", background: "#f8fafc", border: "1px solid #cbd5e1", color: "#0f172a", outline: "none", fontSize: "0.95rem" },
  valueCalcBox: { background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "10px", padding: "0.8rem", textAlign: "center", fontSize: "0.88rem", color: "#047857" },
  calcTotal: { fontSize: "1.5rem", fontWeight: "800", color: "#059669", marginTop: "2px" },
  submitBtn: { padding: "0.85rem", background: "#2563eb", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "0.95rem" }
};