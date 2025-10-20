from fastapi.testclient import TestClient
from src.app import app, activities

client = TestClient(app)


def test_get_activities_contains_keys():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    # basic sanity checks
    assert "Chess Club" in data
    assert isinstance(data["Chess Club"]["participants"], list)


def test_signup_and_unregister_cycle():
    activity = "Programming Class"
    email = "testuser@example.com"

    # Ensure email not present initially
    resp = client.get("/activities")
    assert resp.status_code == 200
    participants_before = resp.json()[activity]["participants"]
    if email in participants_before:
        # remove if somehow present from previous runs
        activities[activity]["participants"].remove(email)

    # Sign up
    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 200
    assert f"Signed up {email}" in resp.json().get("message", "")

    # Confirm present
    resp = client.get("/activities")
    assert email in resp.json()[activity]["participants"]

    # Unregister
    resp = client.delete(f"/activities/{activity}/participants?email={email}")
    assert resp.status_code == 200
    assert f"Unregistered {email}" in resp.json().get("message", "")

    # Confirm removed
    resp = client.get("/activities")
    assert email not in resp.json()[activity]["participants"]
