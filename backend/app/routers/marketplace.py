import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from app.models.schemas import (
    OfferBody, OfferResponse,
    ConsentBody, ConsentResponse
)
from app.routers.fields import FIELDS_DB

router = APIRouter()

@router.get("/marketplace/opportunities")
def get_biomass_opportunities(
    state: Optional[str] = Query(None),
    district: Optional[str] = Query(None)
):
    """Returns fields identified by CropChar's ML pipeline as having high residue-disposal risk (risk_score >= 70)."""
    opportunities = []
    for f_id, field in FIELDS_DB.items():
        if field.get("risk_score", 0) >= 70:
            if state and state != "All Regions" and field.get("state", "").lower() != state.lower():
                continue
            if district and district != "All Districts" and field.get("district", "").lower() != district.lower():
                continue
            
            # Format opportunity for biomass buyers
            opp = {
                "field_id": field["id"],
                "name": field["name"],
                "farmer_name": field.get("farmer_name", "Gurpreet Singh"),
                "farmer_id": field.get("farmer_id", "farmer_9876"),
                "crop_type": field["crop_type"],
                "area_acres": field["area_acres"],
                "estimated_residue_tons": field["estimated_residue_tons"],
                "state": field["state"],
                "district": field["district"],
                "village": field.get("village", "Patiala Sector"),
                "prevention_window_hours": field.get("countdown_hours", 192),
                "status": field["status"],
                "offer": field.get("offer"),
                "geometry": field.get("geometry")
            }
            opportunities.append(opp)
    return opportunities

@router.post("/fields/{field_id}/offer", response_model=OfferResponse)
def make_offer(field_id: str, body: OfferBody):
    if field_id not in FIELDS_DB:
        raise HTTPException(status_code=404, detail=f"Field '{field_id}' not found")
    
    field = FIELDS_DB[field_id]
    offer_id = f"offer-{field_id}-{str(uuid.uuid4())[:6]}"
    now_iso = datetime.now(timezone.utc).isoformat()
    
    est_value = round(body.price_per_ton * field.get("estimated_residue_tons", 4.5), 2)
    
    offer_data = {
        "offer_id": offer_id,
        "company_id": body.company_id or "COMP-001",
        "company_name": body.company_name or "ABC Biomass Pvt. Ltd.",
        "distance_km": body.distance_km or 12.4,
        "price_per_ton": body.price_per_ton,
        "estimated_quantity_tons": field.get("estimated_residue_tons", 4.5),
        "total_offer_value": est_value,
        "notes": body.notes,
        "status": "pending_farmer_response",
        "timestamp": now_iso
    }
    
    field["status"] = "offered"
    field["offer"] = offer_data
    
    return OfferResponse(
        offer_id=offer_id,
        field_id=field_id,
        status="offered",
        timestamp=now_iso
    )

@router.post("/fields/{field_id}/consent", response_model=ConsentResponse)
def give_consent(field_id: str, body: ConsentBody):
    if field_id not in FIELDS_DB:
        raise HTTPException(status_code=404, detail=f"Field '{field_id}' not found")
    
    field = FIELDS_DB[field_id]
    now_iso = datetime.now(timezone.utc).isoformat()
    
    if body.accepted:
        field["status"] = "consented"
        if field.get("offer"):
            field["offer"]["status"] = "accepted"
    else:
        field["status"] = "monitoring"
        if field.get("offer"):
            field["offer"]["status"] = "declined"
        
    field["consent_updated_at"] = now_iso
    
    return ConsentResponse(
        field_id=field_id,
        status=field["status"],
        updated_at=now_iso
    )

@router.post("/offers/{field_id}/complete-collection")
def complete_collection(field_id: str):
    if field_id not in FIELDS_DB:
        raise HTTPException(status_code=404, detail=f"Field '{field_id}' not found")
    
    field = FIELDS_DB[field_id]
    field["status"] = "resolved"
    if field.get("offer"):
        field["offer"]["status"] = "collection_completed"
    
    return {
        "field_id": field_id,
        "status": "resolved",
        "message": "Biomass collection marked completed."
    }

@router.get("/offers")
def get_all_offers(company_id: Optional[str] = None):
    offers = []
    for f_id, field in FIELDS_DB.items():
        if field.get("offer"):
            off = field["offer"].copy()
            off["field_id"] = f_id
            off["field_name"] = field.get("name")
            off["farmer_name"] = field.get("farmer_name")
            off["crop_type"] = field.get("crop_type")
            off["area_acres"] = field.get("area_acres")
            off["district"] = field.get("district")
            if not company_id or off.get("company_id") == company_id:
                offers.append(off)
    return offers