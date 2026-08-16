import os
import json
import uuid
import pandas as pd
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query
from app.models.schemas import FieldCreateBody, RiskAssessmentResponse

router = APIRouter()

# Global in-memory fields database
FIELDS_DB = {}

def get_geojson_path():
    gis_path = os.path.join(os.path.dirname(__file__), "..", "..", "..", "gis-data", "fields.geojson")
    local_path = os.path.join(os.path.dirname(__file__), "..", "data", "fields.geojson")
    
    if os.path.exists(gis_path):
        return os.path.abspath(gis_path)
    elif os.path.exists(local_path):
        return os.path.abspath(local_path)
    return None

def load_initial_fields():
    global FIELDS_DB
    FIELDS_DB.clear()
    path = get_geojson_path()
    if path and os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                geojson_data = json.load(f)
                features = geojson_data.get("features", [])
                for feat in features:
                    props = feat.get("properties", {})
                    field_id = props.get("id") or props.get("field_id") or feat.get("id")
                    if field_id:
                        area = float(props.get("area_acres", 5.0))
                        offer_data = props.get("offer")
                        status_val = props.get("status", "monitoring")
                        if field_id == "F0001" and not offer_data:
                            offer_data = {
                                "offer_id": "offer-F0001-demo",
                                "company_id": "COMP-001",
                                "company_name": "ABC Biomass Pvt. Ltd.",
                                "distance_km": 12.4,
                                "price_per_ton": 2400.0,
                                "estimated_quantity_tons": 4.5,
                                "total_offer_value": 10800.0,
                                "notes": "Interested in purchasing stubble residue for bio-char processing.",
                                "status": "pending_farmer_response",
                                "timestamp": "2026-08-16T10:00:00Z"
                            }
                            status_val = "offered"

                        FIELDS_DB[field_id] = {
                            "id": field_id,
                            "field_id": field_id,
                            "name": props.get("name", f"Field {field_id}"),
                            "farmer_id": props.get("farmer_id", "farmer_9876"),
                            "farmer_name": props.get("farmer_name", "Gurpreet Singh"),
                            "crop_type": props.get("crop_type", "Paddy"),
                            "area_acres": area,
                            "estimated_residue_tons": round(area * 0.82, 1),
                            "planting_month": props.get("planting_month", "June"),
                            "harvest_month": props.get("harvest_month", "October"),
                            "state": props.get("state", "Punjab"),
                            "district": props.get("district", "Patiala"),
                            "village": props.get("village", "Patiala Sector"),
                            "risk_score": props.get("risk_score", 85),
                            "top_reasons": props.get("top_reasons", ["Sowing deadline approaching", "High residue load"]),
                            "countdown_hours": props.get("countdown_hours", 192),
                            "status": status_val,
                            "geometry": feat.get("geometry", {}),
                            "offer": offer_data,
                            "verification": None,
                            "opportunity_expired": False
                        }
        except Exception as e:
            print(f"[FIELDS_DB] Error loading GeoJSON: {e}")

    # Fallback default field if DB is empty
    if not FIELDS_DB:
        FIELDS_DB["F0001"] = {
            "id": "F0001",
            "field_id": "F0001",
            "name": "Patiala North Sector A",
            "farmer_id": "farmer_9876",
            "farmer_name": "Gurpreet Singh",
            "crop_type": "Paddy",
            "area_acres": 5.5,
            "estimated_residue_tons": 4.5,
            "planting_month": "June",
            "harvest_month": "October",
            "state": "Punjab",
            "district": "Patiala",
            "village": "Nabaha",
            "risk_score": 93,
            "top_reasons": ["Sowing deadline approaching", "History of burning on this field", "High residue load"],
            "countdown_hours": 192,
            "status": "offered",
            "geometry": {
                "type": "Polygon",
                "coordinates": [[[76.3800, 30.3400], [76.3850, 30.3400], [76.3850, 30.3440], [76.3800, 30.3440], [76.3800, 30.3400]]]
            },
            "offer": {
                "offer_id": "offer-F0001-demo",
                "company_id": "COMP-001",
                "company_name": "ABC Biomass Pvt. Ltd.",
                "distance_km": 12.4,
                "price_per_ton": 2400.0,
                "estimated_quantity_tons": 4.5,
                "total_offer_value": 10800.0,
                "notes": "Interested in purchasing stubble residue for bio-char processing.",
                "status": "pending_farmer_response",
                "timestamp": "2026-08-16T10:00:00Z"
            },
            "verification": None,
            "opportunity_expired": False
        }

load_initial_fields()

@router.get("/fields")
def get_fields(
    state: Optional[str] = Query(None, description="Filter by state (e.g. Punjab, Haryana, Bihar, Uttar Pradesh)"),
    district: Optional[str] = Query(None, description="Filter by district (e.g. Patiala, Ludhiana, Karnal)"),
    farmer_id: Optional[str] = Query(None, description="Filter by farmer ID for role privacy isolation")
):
    results = list(FIELDS_DB.values())

    if state and state != "All Regions":
        results = [f for f in results if f.get("state", "").lower() == state.lower()]

    if district and district != "All Districts":
        results = [f for f in results if f.get("district", "").lower() == district.lower()]

    if farmer_id:
        # Strict role isolation: return ONLY fields belonging to this specific logged-in farmer
        results = [f for f in results if f.get("farmer_id") == farmer_id]

    return results

@router.post("/fields")
def register_field(body: FieldCreateBody):
    new_num = len(FIELDS_DB) + 1
    field_id = f"F0{new_num:03d}"
    
    crop = body.custom_crop_type if body.crop_type == "Other" and body.custom_crop_type else body.crop_type
    area = max(0.1, float(body.area_acres))
    est_residue = round(area * 0.82, 1)

    # ML Evaluation or calculated risk parameters
    risk_score = 88 if crop.lower() == "paddy" else 42
    reasons = ["Sowing deadline approaching", "High residue load"] if risk_score >= 70 else ["Normal crop management cycle"]
    countdown = 192 if risk_score >= 70 else 400

    # Try calling ML risk router if present
    try:
        from ml.risk_router import get_risk
        ml_res = get_risk(field_id)
        risk_score = ml_res.get("score", risk_score)
        reasons = ml_res.get("top_reasons", reasons)
        countdown = ml_res.get("countdown_hours", countdown)
    except Exception:
        pass

    # Create polygon geometry around the point selected on map by farmer
    lat, lon = body.latitude, body.longitude
    offset = 0.0025
    poly_coords = [
        [
            [round(lon - offset, 4), round(lat - offset, 4)],
            [round(lon + offset, 4), round(lat - offset, 4)],
            [round(lon + offset, 4), round(lat + offset, 4)],
            [round(lon - offset, 4), round(lat + offset, 4)],
            [round(lon - offset, 4), round(lat - offset, 4)]
        ]
    ]

    new_field = {
        "id": field_id,
        "field_id": field_id,
        "name": f"{body.district or 'Registered'} Sector {field_id}",
        "farmer_id": body.farmer_id or "farmer_9876",
        "farmer_name": body.farmer_name or "Gurpreet Singh",
        "crop_type": crop,
        "area_acres": area,
        "estimated_residue_tons": est_residue,
        "planting_month": body.planting_month,
        "harvest_month": body.harvest_month,
        "state": body.state or "Punjab",
        "district": body.district or "Patiala",
        "village": body.village or "Local Village",
        "risk_score": risk_score,
        "top_reasons": reasons,
        "countdown_hours": countdown,
        "status": "monitoring",
        "geometry": {
            "type": "Polygon",
            "coordinates": poly_coords
        },
        "offer": None,
        "verification": None,
        "opportunity_expired": False
    }

    FIELDS_DB[field_id] = new_field
    return new_field

@router.get("/fields/{field_id}")
def get_field_by_id(field_id: str):
    if field_id not in FIELDS_DB:
        raise HTTPException(status_code=404, detail=f"Field '{field_id}' not found")
    return FIELDS_DB[field_id]

@router.get("/fields/{field_id}/risk", response_model=RiskAssessmentResponse)
def get_field_risk(field_id: str):
    if field_id in FIELDS_DB:
        field = FIELDS_DB[field_id]
        return RiskAssessmentResponse(
            field_id=field_id,
            score=field.get("risk_score", 85),
            top_reasons=field.get("top_reasons", []),
            countdown_hours=field.get("countdown_hours", 192)
        )
    return RiskAssessmentResponse(
        field_id=field_id,
        score=75,
        top_reasons=["Sowing deadline approaching", "High residue load"],
        countdown_hours=192
    )

@router.post("/fields/reset")
def reset_fields():
    load_initial_fields()
    return {"message": "FIELDS_DB reset successfully", "total_fields": len(FIELDS_DB)}