"""
EduBridge Insight Engine
Generates AI-powered insights, trend analysis, and study recommendations.
Uses statistical analysis on grade data to produce actionable insights.
"""

import math
from datetime import datetime


class InsightEngine:
    """Engine for generating educational insights from student grade data."""

    def generate_insights(self, student_id, grades):
        """
        Generate insight cards based on grade history.
        Each insight includes: type, subject, title, message, confidence, severity, icon
        """
        if not grades:
            return [{
                'type': 'info',
                'subject': 'General',
                'title': 'Getting Started',
                'message': 'No grade data available yet. Insights will appear after the first exam results.',
                'confidence': 1.0,
                'severity': 'info',
                'icon': '📋'
            }]

        insights = []

        # Group grades by subject
        subject_grades = {}
        for g in grades:
            subj = g.get('subject_name', 'Unknown')
            if subj not in subject_grades:
                subject_grades[subj] = []
            subject_grades[subj].append({
                'marks': g.get('marks', 0),
                'max_marks': g.get('max_marks', 100),
                'date': g.get('date', ''),
                'exam_type': g.get('exam_type', ''),
                'percentage': (g.get('marks', 0) / g.get('max_marks', 100)) * 100
            })

        for subject, sg in subject_grades.items():
            # Sort by date
            sg.sort(key=lambda x: x['date'])
            percentages = [g['percentage'] for g in sg]

            if len(percentages) < 2:
                continue

            # Trend detection
            recent_avg = sum(percentages[-3:]) / min(len(percentages), 3)
            older_avg = sum(percentages[:-3]) / max(len(percentages) - 3, 1) if len(percentages) > 3 else percentages[0]
            trend_change = recent_avg - older_avg

            if trend_change > 10:
                insights.append({
                    'type': 'trend',
                    'subject': subject,
                    'title': f'📈 Strong Improvement in {subject}',
                    'message': f'{subject} scores have improved by {abs(trend_change):.1f}% recently. '
                               f'Current average: {recent_avg:.1f}%. Excellent progress!',
                    'confidence': min(0.6 + len(sg) * 0.05, 0.95),
                    'severity': 'positive',
                    'icon': '📈'
                })
            elif trend_change < -10:
                insights.append({
                    'type': 'alert',
                    'subject': subject,
                    'title': f'⚠️ Declining Performance in {subject}',
                    'message': f'{subject} scores have dropped by {abs(trend_change):.1f}% over recent exams. '
                               f'Current average: {recent_avg:.1f}%. Consider additional practice.',
                    'confidence': min(0.6 + len(sg) * 0.05, 0.95),
                    'severity': 'warning',
                    'icon': '⚠️'
                })

            # Low score alert
            if percentages[-1] < 40:
                insights.append({
                    'type': 'critical',
                    'subject': subject,
                    'title': f'🚨 Below Passing in {subject}',
                    'message': f'Latest {subject} score ({percentages[-1]:.0f}%) is below the passing threshold. '
                               f'Immediate attention recommended.',
                    'confidence': 0.95,
                    'severity': 'critical',
                    'icon': '🚨'
                })

            # Consistency analysis
            if len(percentages) >= 3:
                std_dev = self._std_dev(percentages)
                if std_dev < 5 and recent_avg > 75:
                    insights.append({
                        'type': 'strength',
                        'subject': subject,
                        'title': f'🌟 Consistent Excellence in {subject}',
                        'message': f'{subject} performance is remarkably consistent (±{std_dev:.1f}%) '
                                   f'with an average of {recent_avg:.1f}%. A true strength area!',
                        'confidence': 0.88,
                        'severity': 'positive',
                        'icon': '🌟'
                    })
                elif std_dev > 15:
                    insights.append({
                        'type': 'inconsistency',
                        'subject': subject,
                        'title': f'🔄 Inconsistent in {subject}',
                        'message': f'{subject} scores vary significantly (±{std_dev:.1f}%). '
                                   f'Range: {min(percentages):.0f}% to {max(percentages):.0f}%. Regular practice may help.',
                        'confidence': 0.75,
                        'severity': 'warning',
                        'icon': '🔄'
                    })

        # Sort by confidence descending
        insights.sort(key=lambda x: x['confidence'], reverse=True)
        return insights[:8]  # Return top 8 insights

    def analyze_trends(self, grades):
        """Analyze grade trends and return per-subject analysis."""
        if not grades:
            return []

        subject_grades = {}
        for g in grades:
            subj = g.get('subject_name', 'Unknown')
            if subj not in subject_grades:
                subject_grades[subj] = []
            pct = (g.get('marks', 0) / g.get('max_marks', 100)) * 100
            subject_grades[subj].append({
                'percentage': pct,
                'date': g.get('date', ''),
            })

        trends = []
        for subject, sg in subject_grades.items():
            sg.sort(key=lambda x: x['date'])
            percentages = [g['percentage'] for g in sg]

            if len(percentages) < 2:
                trends.append({
                    'subject': subject,
                    'direction': 'stable',
                    'change': 0,
                    'current_avg': percentages[0] if percentages else 0,
                    'data_points': len(percentages)
                })
                continue

            # Linear regression for trend
            slope = self._linear_slope(percentages)
            current_avg = sum(percentages[-3:]) / min(len(percentages), 3)

            if slope > 2:
                direction = 'up'
            elif slope < -2:
                direction = 'down'
            else:
                direction = 'stable'

            trends.append({
                'subject': subject,
                'direction': direction,
                'change': round(slope * len(percentages), 1),
                'current_avg': round(current_avg, 1),
                'data_points': len(percentages),
                'min': round(min(percentages), 1),
                'max': round(max(percentages), 1),
                'std_dev': round(self._std_dev(percentages), 1)
            })

        return trends

    def generate_study_plan(self, student_id, grades, available_hours=2, upcoming_exams=None):
        """Generate a personalized study plan based on performance data."""
        if not grades:
            return {
                'daily_hours': available_hours,
                'subjects': [],
                'tips': ['Start tracking your grades to get personalized recommendations.']
            }

        # Analyze weaknesses
        subject_performance = {}
        for g in grades:
            subj = g.get('subject_name', 'Unknown')
            pct = (g.get('marks', 0) / g.get('max_marks', 100)) * 100
            if subj not in subject_performance:
                subject_performance[subj] = []
            subject_performance[subj].append(pct)

        # Calculate priority scores (lower performance = higher priority)
        priorities = []
        for subj, scores in subject_performance.items():
            avg = sum(scores) / len(scores)
            recent = scores[-1] if scores else avg
            trend = self._linear_slope(scores) if len(scores) >= 2 else 0

            # Priority formula: lower avg + declining trend = higher priority
            priority_score = (100 - avg) + max(0, -trend * 10)

            # Boost if upcoming exam
            has_exam = False
            if upcoming_exams:
                for exam in upcoming_exams:
                    if exam.get('subject', '').lower() in subj.lower():
                        has_exam = True
                        priority_score += 20
                        break

            priorities.append({
                'subject': subj,
                'average': round(avg, 1),
                'recent_score': round(recent, 1),
                'priority_score': round(priority_score, 1),
                'has_upcoming_exam': has_exam,
                'trend': 'declining' if trend < -2 else 'improving' if trend > 2 else 'stable'
            })

        priorities.sort(key=lambda x: x['priority_score'], reverse=True)

        # Allocate time proportionally
        total_priority = sum(p['priority_score'] for p in priorities) or 1
        plan_subjects = []
        for p in priorities:
            time_fraction = p['priority_score'] / total_priority
            minutes = round(available_hours * 60 * time_fraction)
            plan_subjects.append({
                'subject': p['subject'],
                'minutes_per_day': max(minutes, 10),
                'priority': 'high' if p['priority_score'] > 50 else 'medium' if p['priority_score'] > 25 else 'low',
                'focus_areas': self._get_focus_areas(p['subject'], p['average']),
                'average': p['average'],
                'trend': p['trend']
            })

        # Generate tips
        tips = []
        weakest = priorities[0] if priorities else None
        if weakest and weakest['average'] < 60:
            tips.append(f"Focus extra time on {weakest['subject']} — current average is {weakest['average']}%")
        tips.extend([
            'Use the Pomodoro technique: 25 min study + 5 min break',
            'Review notes within 24 hours of each class for 80% better retention',
            'Practice previous year questions for exam preparation',
            'Create mind maps for complex topics to improve understanding'
        ])

        return {
            'daily_hours': available_hours,
            'subjects': plan_subjects,
            'tips': tips[:6],
            'generated_at': datetime.now().isoformat()
        }

    def _std_dev(self, values):
        """Calculate standard deviation."""
        if len(values) < 2:
            return 0
        mean = sum(values) / len(values)
        variance = sum((x - mean) ** 2 for x in values) / len(values)
        return math.sqrt(variance)

    def _linear_slope(self, values):
        """Calculate linear regression slope."""
        n = len(values)
        if n < 2:
            return 0
        x_mean = (n - 1) / 2
        y_mean = sum(values) / n
        numerator = sum((i - x_mean) * (values[i] - y_mean) for i in range(n))
        denominator = sum((i - x_mean) ** 2 for i in range(n))
        return numerator / denominator if denominator != 0 else 0

    def _get_focus_areas(self, subject, average):
        """Get recommended focus areas based on subject and performance."""
        focus_map = {
            'Mathematics': {
                'low': ['Basic operations & fractions', 'Algebra fundamentals', 'Word problems'],
                'medium': ['Quadratic equations', 'Geometry proofs', 'Statistics'],
                'high': ['Advanced calculus', 'Trigonometry applications', 'Competition problems']
            },
            'Science': {
                'low': ['Physics fundamentals', 'Basic chemistry', 'Biology definitions'],
                'medium': ['Chemical equations', 'Newton\'s laws', 'Cell biology'],
                'high': ['Advanced mechanics', 'Organic chemistry', 'Genetics']
            },
            'English': {
                'low': ['Grammar rules', 'Vocabulary building', 'Sentence structure'],
                'medium': ['Essay writing', 'Comprehension skills', 'Literature analysis'],
                'high': ['Creative writing', 'Advanced grammar', 'Poetry analysis']
            },
        }

        level = 'low' if average < 50 else 'medium' if average < 80 else 'high'
        areas = focus_map.get(subject, {}).get(level, ['Review class notes', 'Practice problems', 'Seek teacher help'])
        return areas
