from flask import Blueprint, jsonify
from {{pythonPackageName}}.blueprints.health.service import get_health_data

health_bp = Blueprint("health", __name__, url_prefix="/health")

@health_bp.route("", methods=["GET"])
def health():
    return jsonify(get_health_data())
