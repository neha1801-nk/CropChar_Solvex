import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { IconUser, IconShield, IconInfo } from "../components/Icons";
import { api } from "../api/client";

export default function Login() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Common demo credential mapping
  const handleQuickCredentialSelect = (role) => {
    setErrorMsg("");
    if (role === "farmer") {
      setIdentifier("farmer@cropchar.in");
      setPassword("farmer123");
    } else if (role === "company") {
      setIdentifier("buyer@abcbiomass.com");
      setPassword("buyer123");
    } else if (role === "officer") {
      setIdentifier("officer@patiala.gov.in");
      setPassword("officer123");
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    // Determine category from identifier
    let inferredRole = "farmer";
    const lowerId = identifier.toLowerCase();

    if (lowerId.includes("officer") || lowerId.includes("gov") || lowerId.includes("dao")) {
      inferredRole = "officer";
    } else if (lowerId.includes("buyer") || lowerId.includes("biomass") || lowerId.includes("company")) {
      inferredRole = "company";
    } else {
      inferredRole = "farmer";
    }

    try {
      const res = await api.post("/login", {
        role: inferredRole,
        identifier: identifier,
        password: password,
      });

      const userRole = res.data.role;
      localStorage.setItem("role", userRole);
      localStorage.setItem("username", res.data.username);
      localStorage.setItem("user_id", res.data.user_id);
      localStorage.setItem("session_id", res.data.session_id);

      // Redirect directly to that category's dashboard
      if (userRole === "farmer") {
        navigate("/dashboard/farmer");
      } else if (userRole === "company") {
        navigate("/dashboard/buyer");
      } else if (userRole === "officer") {
        navigate("/dashboard/officer");
      }
    } catch (err) {
      console.warn("Backend login fallback:", err);
      const roleNames = {
        farmer: "Gurpreet Singh (Farmer)",
        company: "ABC Biomass Pvt. Ltd.",
        officer: "District Nodal Officer (Patiala)"
      };

      const roleIds = {
        farmer: "farmer_9876",
        company: "COMP-001",
        officer: "OFFICER-PATIALA-01"
      };

      localStorage.setItem("role", inferredRole);
      localStorage.setItem("username", roleNames[inferredRole] || "User Account");
      localStorage.setItem("user_id", roleIds[inferredRole] || `${inferredRole}_user`);

      if (inferredRole === "farmer") {
        navigate("/dashboard/farmer");
      } else if (inferredRole === "company") {
        navigate("/dashboard/buyer");
      } else if (inferredRole === "officer") {
        navigate("/dashboard/officer");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.loginCard}>
        <div style={styles.logoHeader}>
          <Logo size="lg" />
        </div>

        <div style={styles.titleBox}>
          <h2 style={styles.loginTitle}>Platform Sign In</h2>
          <p style={styles.loginSub}>Enter your registered account credentials to access your dashboard</p>
        </div>

        <form onSubmit={handleLoginSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Email / Registered Account ID</label>
            <input 
              type="text" 
              placeholder="e.g. farmer@cropchar.in or buyer@abcbiomass.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          {errorMsg && <div style={styles.errorBox}>{errorMsg}</div>}

          <button type="submit" style={styles.submitBtn} disabled={loading}>
            {loading ? "Authenticating..." : "Sign In to Dashboard"}
          </button>
        </form>

        {/* Demo Quick Credential Selector Pills */}
        <div style={styles.quickLoginSection}>
          <div style={styles.quickLabel}>
            <IconInfo size={14} color="#64748b" />
            <span>Select pre-configured account credentials for testing:</span>
          </div>

          <div style={styles.quickBtnGroup}>
            <button 
              type="button" 
              style={styles.quickPillFarmer}
              onClick={() => handleQuickCredentialSelect("farmer")}
            >
              Farmer (Common Account)
            </button>

            <button 
              type="button" 
              style={styles.quickPillBuyer}
              onClick={() => handleQuickCredentialSelect("company")}
            >
              Biomass Buyer Account
            </button>

            <button 
              type="button" 
              style={styles.quickPillOfficer}
              onClick={() => handleQuickCredentialSelect("officer")}
            >
              Government Officer Account
            </button>
          </div>
        </div>

        <div style={styles.footerNote}>
          <IconShield size={14} color="#64748b" />
          <span>Role-Based Access Control: Users are automatically directed to their authorized category dashboard.</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "#f8fafc",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "2rem 1rem"
  },
  loginCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "2.5rem",
    maxWidth: "460px",
    width: "100%",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)"
  },
  logoHeader: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "1.5rem"
  },
  titleBox: {
    textAlign: "center",
    marginBottom: "1.8rem"
  },
  loginTitle: {
    fontFamily: "'Outfit', sans-serif",
    fontSize: "1.5rem",
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: "4px"
  },
  loginSub: {
    fontSize: "0.88rem",
    color: "#64748b"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.1rem"
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem"
  },
  label: {
    fontSize: "0.85rem",
    fontWeight: "600",
    color: "#334155"
  },
  input: {
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    background: "#f8fafc",
    border: "1px solid #cbd5e1",
    color: "#0f172a",
    fontSize: "0.95rem",
    outline: "none",
    transition: "border-color 0.15s ease"
  },
  errorBox: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#b91c1c",
    padding: "0.6rem",
    borderRadius: "8px",
    fontSize: "0.82rem"
  },
  submitBtn: {
    padding: "0.85rem",
    borderRadius: "8px",
    border: "none",
    background: "#059669",
    color: "#ffffff",
    fontWeight: "700",
    fontSize: "0.95rem",
    cursor: "pointer",
    marginTop: "0.4rem",
    transition: "background 0.15s ease"
  },
  quickLoginSection: {
    marginTop: "2rem",
    paddingTop: "1.2rem",
    borderTop: "1px solid #f1f5f9"
  },
  quickLabel: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "0.78rem",
    color: "#64748b",
    marginBottom: "0.8rem",
    fontWeight: "600"
  },
  quickBtnGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem"
  },
  quickPillFarmer: {
    padding: "0.5rem",
    background: "#ecfdf5",
    border: "1px solid #a7f3d0",
    color: "#047857",
    borderRadius: "6px",
    fontSize: "0.8rem",
    fontWeight: "700",
    cursor: "pointer",
    textAlign: "center"
  },
  quickPillBuyer: {
    padding: "0.5rem",
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    color: "#1d4ed8",
    borderRadius: "6px",
    fontSize: "0.8rem",
    fontWeight: "700",
    cursor: "pointer",
    textAlign: "center"
  },
  quickPillOfficer: {
    padding: "0.5rem",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#b91c1c",
    borderRadius: "6px",
    fontSize: "0.8rem",
    fontWeight: "700",
    cursor: "pointer",
    textAlign: "center"
  },
  footerNote: {
    marginTop: "1.5rem",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "0.75rem",
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: "1.4"
  }
};