"""
EduBridge Analytics — Python Flask Microservice
Provides AI-powered insights, trend analysis, and study recommendations.
"""

from flask import Flask, request, jsonify
import json
import math
from datetime import datetime, timedelta
from insights import InsightEngine

app = Flask(__name__)
engine = InsightEngine()


@app.route('/insights/<int:student_id>', methods=['GET'])
def get_insights(student_id):
    """Generate AI insights for a student based on their grades."""
    try:
        grades_json = request.args.get('grades', '[]')
        grades = json.loads(grades_json) if grades_json else []
        insights = engine.generate_insights(student_id, grades)
        return jsonify({'insights': insights})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/trends/<int:student_id>', methods=['POST'])
def analyze_trends(student_id):
    """Analyze grade trends across subjects."""
    try:
        data = request.get_json()
        grades = data.get('grades', [])
        trends = engine.analyze_trends(grades)
        return jsonify({'trends': trends})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/study-plan/<int:student_id>', methods=['POST'])
def generate_study_plan(student_id):
    """Generate a personalized study plan."""
    try:
        data = request.get_json()
        grades = data.get('grades', [])
        available_hours = data.get('available_hours', 2)
        upcoming_exams = data.get('upcoming_exams', [])
        plan = engine.generate_study_plan(student_id, grades, available_hours, upcoming_exams)
        return jsonify({'study_plan': plan})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'EduBridge Analytics', 'version': '1.0.0'})


if __name__ == '__main__':
    print("🐍 EduBridge Analytics Service running on http://127.0.0.1:5001")
    app.run(host='127.0.0.1', port=5001, debug=True)
