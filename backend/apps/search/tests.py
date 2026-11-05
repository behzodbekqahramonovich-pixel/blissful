from django.test import TestCase

from services.route_optimizer import RouteOptimizer


class ScoreTests(TestCase):
    def test_cheaper_variant_scores_higher_above_2000(self):
        opt = RouteOptimizer.__new__(RouteOptimizer)
        opt.budget_max = None
        a = {'total_cost': 2400, 'total_duration': 600, 'stops': 0, 'route_type': 'direct'}
        b = {'total_cost': 3300, 'total_duration': 600, 'stops': 0, 'route_type': 'direct'}
        cheapest = min(a['total_cost'], b['total_cost'])
        self.assertGreater(
            opt._calculate_advanced_score(a, 'balanced', cheapest),
            opt._calculate_advanced_score(b, 'balanced', cheapest),
        )
