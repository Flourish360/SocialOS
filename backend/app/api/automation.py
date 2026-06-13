from fastapi import APIRouter, Depends
from ..api.deps import get_current_user
from ..models.user import User
from ..mock.data import MOCK_AUTOMATIONS, MOCK_INBOX, MOCK_COMPETITORS

router = APIRouter(prefix="/automation", tags=["automation"])


@router.get("/rules")
def list_rules(current_user: User = Depends(get_current_user)):
    return MOCK_AUTOMATIONS


@router.post("/rules", status_code=201)
def create_rule(body: dict, current_user: User = Depends(get_current_user)):
    rule = {"id": f"auto-{len(MOCK_AUTOMATIONS)+1}", "run_count": 0, "last_run": None, **body}
    MOCK_AUTOMATIONS.append(rule)
    return rule


@router.patch("/rules/{rule_id}/toggle")
def toggle_rule(rule_id: str, current_user: User = Depends(get_current_user)):
    for rule in MOCK_AUTOMATIONS:
        if rule["id"] == rule_id:
            rule["is_active"] = not rule["is_active"]
            return rule
    return {"error": "not found"}


@router.get("/inbox")
def unified_inbox(priority: str | None = None, current_user: User = Depends(get_current_user)):
    msgs = MOCK_INBOX
    if priority:
        msgs = [m for m in msgs if m["priority"] == priority]
    return msgs


@router.post("/inbox/{message_id}/reply")
def reply_to_message(message_id: str, body: dict, current_user: User = Depends(get_current_user)):
    for msg in MOCK_INBOX:
        if msg["id"] == message_id:
            msg["replied"] = True
    return {"status": "sent", "message_id": message_id, "reply": body.get("text")}


@router.get("/competitors")
def list_competitors(current_user: User = Depends(get_current_user)):
    return MOCK_COMPETITORS
