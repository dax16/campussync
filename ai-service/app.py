from flask import Flask, jsonify, request
from flask_cors import CORS
from collections import defaultdict
import random
from datetime import datetime

app = Flask(__name__)
CORS(app)

mock_history: dict[int, float] = {}
for hour in range(8, 22):
    weight = 0.3
    if 10 <= hour <= 12:
        weight = 0.9
    elif 13 <= hour <= 15:
        weight = 0.85
    elif 16 <= hour <= 18:
        weight = 0.7
    elif hour < 9 or hour > 20:
        weight = 0.1
    mock_history[hour] = weight


@app.route('/health')
def health():
    return jsonify({'status': 'AI Service running', 'model': 'CampusSync Slot Recommender v1.0'})


@app.route('/suggest')
def suggest():
    room_id = request.args.get('room_id', '').strip()
    date_str = request.args.get('date', '').strip()

    if not room_id:
        return jsonify({'error': 'room_id is required'}), 400
    if not date_str:
        return jsonify({'error': 'date is required (YYYY-MM-DD)'}), 400

    try:
        date = datetime.strptime(date_str, '%Y-%m-%d')
        day_of_week = date.weekday()
    except ValueError:
        return jsonify({'error': 'Invalid date format. Expected YYYY-MM-DD'}), 400

    # Seed RNG deterministically so identical requests return identical results
    rng = random.Random(f'{room_id}:{date_str}')

    suggestions = []
    for hour in range(8, 22):
        base_score = mock_history[hour]
        if day_of_week >= 5:
            base_score *= 0.5
        noise = rng.uniform(-0.1, 0.1)
        score = max(0, min(1, base_score + noise))
        available_score = 1 - score

        suggestions.append({
            'start': f'{hour:02d}:00',
            'end': f'{hour + 1:02d}:00',
            'demand_level': 'high' if score > 0.7 else 'medium' if score > 0.4 else 'low',
            'availability_score': round(available_score, 2),
            'predicted_demand': round(score, 2),
            'recommendation': get_recommendation(score)
        })

    suggestions.sort(key=lambda x: x['availability_score'], reverse=True)
    top3 = suggestions[:3]

    return jsonify({
        'room_id': room_id,
        'date': date_str,
        'day_type': 'weekend' if day_of_week >= 5 else 'weekday',
        'suggestions': top3,
        'all_slots': suggestions,
        'insight': generate_insight(date_str, day_of_week)
    })


@app.route('/analytics')
def analytics():
    peak_hours = [
        {'hour': f'{h:02d}:00', 'demand': mock_history[h]}
        for h in range(8, 22)
    ]
    return jsonify({
        'peak_hours': peak_hours,
        'busiest_hour': '10:00',
        'quietest_hour': '08:00',
        'avg_utilization': round(sum(mock_history.values()) / len(mock_history), 2)
    })

def get_recommendation(demand_score):
    if demand_score > 0.8:
        return 'Very busy — book early or choose another slot'
    elif demand_score > 0.6:
        return 'Moderately busy — book ahead of time'
    elif demand_score > 0.3:
        return 'Usually available — good choice'
    else:
        return 'Typically quiet — great for focused work'

def generate_insight(date_str, day_of_week):
    if day_of_week >= 5:
        return 'Weekend bookings are typically 50% lower. Most slots will be available.'
    elif day_of_week == 0:
        return 'Mondays are moderately busy. Morning slots fill up quickly after 10am.'
    elif day_of_week == 4:
        return 'Fridays see lower demand after 3pm. Late afternoon is a great time to book.'
    else:
        return 'Mid-week demand peaks between 10am-3pm. Early morning or evening slots are quietest.'

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
