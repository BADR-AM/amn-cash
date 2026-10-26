import unittest
from decimal import Decimal
from fee_reference import cashout_fee

class TestFeeReference(unittest.TestCase):
    def test_defaults(self):
        for amount, expected in [
            ('1000', ('50.00','10.00','40.00')),
            ('1500', ('75.00','15.00','60.00')),
            ('5000', ('250.00','50.00','200.00')),
            ('1', ('0.05','0.01','0.04')),
        ]:
            with self.subTest(amount=amount):
                actual = cashout_fee(amount)
                self.assertEqual(tuple(str(x) for x in actual.values()), expected)

    def test_changes_to_rates(self):
        actual = cashout_fee('1000', '60', '15')
        self.assertEqual(actual['estimated_profit'], Decimal('45.00'))

    def test_reject_invalid(self):
        for amount in ('0', '-1', 'NaN', 'Infinity'):
            with self.subTest(amount=amount):
                with self.assertRaises(ValueError):
                    cashout_fee(amount)

if __name__ == '__main__':
    unittest.main()
